"""
Chuẩn bị layout mới cho Machine Locator từ bản vẽ PDF (PyMuPDF).

    python scripts/machine-locator/prepare_layout.py \
        --pdf scripts/machine-locator/input/factoryA-f1.pdf \
        --image public/assets/machine-locator/factory-a-f1.png \
        --json src/data/machineLocator/factoryA-f1.json

- crop = bounding box toàn bộ nét vẽ trên trang (get_drawings) + lề 5 pt (đơn vị PDF pt)
- render vùng crop ra PNG, ppp = 4.4444 (giống Fac B), nền trắng
- ghi JSON {crop, page, ppp, m}; nếu đọc được nhãn mã máy thì chạy
  generate_machine_boxes.py --mode label để dựng khung, máy không phải high gắn r = true
"""

from __future__ import annotations

import argparse
import csv
import json
import subprocess
import sys
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:  # pragma: no cover
    sys.exit('Thiếu PyMuPDF: pip install pymupdf')

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from generate_machine_boxes import (  # noqa: E402
    extract_words,
    find_labels,
    r_contains_pt,
    write_layout_json,
)


def is_background(d, page_area: float) -> bool:
    """Nền trang: hình chỉ tô màu trắng (không viền) hoặc phủ gần hết trang."""
    r = d['rect']
    white_fill = d.get('type') == 'f' and d.get('fill') and all(c >= 0.99 for c in d['fill'])

    return bool(white_fill) or r.width * r.height >= 0.95 * page_area


def drawings_bbox(page, transform) -> fitz.Rect | None:
    box = None
    page_area = page.rect.width * page.rect.height
    skipped = 0

    for d in page.get_drawings():
        if is_background(d, page_area):
            skipped += 1
            continue

        r = fitz.Rect(d['rect'])
        if transform:
            r = r * transform
        r.normalize()
        if r.is_empty and r.width == 0 and r.height == 0:
            continue
        box = r if box is None else box | r

    if skipped:
        print(f'Bỏ qua {skipped} hình nền (tô trắng / phủ gần hết trang) khi tính crop.')

    return box


def main():
    # console Windows mặc định cp1252, không in được tiếng Việt
    for stream in (sys.stdout, sys.stderr):
        stream.reconfigure(encoding='utf-8')

    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--pdf', required=True, type=Path)
    ap.add_argument('--image', required=True, type=Path)
    ap.add_argument('--json', required=True, type=Path)
    ap.add_argument('--page', type=int, default=0)
    ap.add_argument('--margin', type=float, default=5.0)
    ap.add_argument('--ppp', type=float, default=4.4444)
    args = ap.parse_args()

    doc = fitz.open(args.pdf)
    print(f'{args.pdf.name}: {doc.page_count} trang, dùng trang {args.page}')

    page = doc[args.page]
    transform = page.rotation_matrix if page.rotation else None

    if page.rotation:
        print(f'! Trang xoay {page.rotation}°: toạ độ quy đổi theo page.rotation_matrix.')

    bbox = drawings_bbox(page, transform)
    if bbox is None:
        sys.exit('Trang không có nét vẽ nào.')

    page_rect = page.rect  # đã tính xoay
    crop = fitz.Rect(
        max(page_rect.x0, bbox.x0 - args.margin),
        max(page_rect.y0, bbox.y0 - args.margin),
        min(page_rect.x1, bbox.x1 + args.margin),
        min(page_rect.y1, bbox.y1 + args.margin),
    )
    crop_list = [round(crop.x0), round(crop.y0), round(crop.width), round(crop.height)]
    crop = fitz.Rect(crop_list[0], crop_list[1], crop_list[0] + crop_list[2], crop_list[1] + crop_list[3])
    page_size = [round(page_rect.width, 2), round(page_rect.height, 2)]

    print(f'Trang: {page_size[0]} x {page_size[1]} pt  |  bbox nét vẽ: '
          f'{bbox.x0:.1f},{bbox.y0:.1f} - {bbox.x1:.1f},{bbox.y1:.1f}  |  crop [x,y,w,h] = {crop_list}')

    # ---------- ẢNH ----------
    # clip của get_pixmap tính theo toạ độ trang đã xoay, giống crop
    pix = page.get_pixmap(matrix=fitz.Matrix(args.ppp, args.ppp), clip=crop, alpha=False)
    args.image.parent.mkdir(parents=True, exist_ok=True)
    pix.save(args.image)
    print(f'Đã ghi {args.image} ({pix.width} x {pix.height} px)')

    # ---------- JSON RỖNG ----------
    args.json.parent.mkdir(parents=True, exist_ok=True)
    write_layout_json(args.json, crop_list, page_size, args.ppp, {})

    # ---------- NHÃN ----------
    words = extract_words(page, transform)
    crop_rect = (crop.x0, crop.y0, crop.x1, crop.y1)
    labels = [lb for lb in find_labels(words) if r_contains_pt(crop_rect, lb.center)]
    print(f'Words: {len(words)}  |  nhãn mã máy: {len(labels)} ({len({lb.code for lb in labels})} mã)')

    if not labels:
        print('! Không đọc được nhãn mã máy nào (chữ có thể đã bị xuất thành nét vẽ). '
              'Giữ m rỗng; thêm máy bằng tay trong trang Machine Locator.')
        print(f'Đã ghi {args.json} (0 máy)')
        return

    # ---------- DỰNG KHUNG (generate_machine_boxes --mode label) ----------
    work = SCRIPT_DIR / 'input'
    gen_json = work / f'{args.json.stem}.generated.json'
    gen_csv = work / f'{args.json.stem}.generated-review.csv'

    subprocess.run([
        sys.executable, str(SCRIPT_DIR / 'generate_machine_boxes.py'),
        '--mode', 'label',
        '--pdf', str(args.pdf),
        '--current', str(args.json),
        '--page', str(args.page),
        '--out', str(gen_json),
        '--review-csv', str(gen_csv),
    ], check=True)

    generated = json.loads(gen_json.read_text(encoding='utf-8'))

    with gen_csv.open(encoding='utf-8-sig', newline='') as f:
        review = {row['machine_code']: row['confidence'] for row in csv.DictReader(f)}

    machines = {}
    for code, v in generated['m'].items():
        m = {'b': v['b'], 'u': v['u'], 'src': 'cad'}
        if code in review:  # CSV chỉ chứa máy medium / low
            m['r'] = True
        if v.get('t'):  # vị trí chữ mã máy (app bỏ khối trùng chữ khi tự ôm)
            m['t'] = v['t']
        machines[code] = m

    write_layout_json(args.json, crop_list, page_size, args.ppp, machines)
    print(f'Đã ghi {args.json} ({len(machines)} máy, {sum(1 for m in machines.values() if m.get("r"))} cần soát)')


if __name__ == '__main__':
    main()
