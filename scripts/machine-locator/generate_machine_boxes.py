"""
Sinh lại khung máy cho Machine Locator từ bản vẽ PDF (PyMuPDF).

Cài đặt:
    pip install pymupdf numpy

Chạy (từ thư mục gốc backlog-web):
    python scripts/machine-locator/generate_machine_boxes.py \
        --mode snap \
        --pdf "<đường dẫn>/LT2-1st_Floor_FAC_B_T_VINH_20260930.pdf" \
        --current src/data/machineLocator/factoryB-f1.json \
        --manual "<đường dẫn>/factory-b-machines_YYYYMMDD.json"

Mode:
    label  đọc nhãn mã máy bằng get_text("words") rồi tìm hình kín quanh nhãn
           (chỉ dùng được khi chữ trong PDF là text thật)
    snap   không đọc nhãn: "hút" từng khung trong --current vào hình kín
           khớp nhất trên bản vẽ (dùng khi chữ bị xuất thành nét vẽ)

--apply high (mặc định): chỉ thay khung của máy đạt high; --apply medium: thay cả medium.
Máy không được thay giữ nguyên khung cũ, chỉ ghi vào CSV kiểm tra.

Output (mặc định cạnh file --current):
    factoryB-f1.generated.json          cùng format {crop, page, ppp, m}, toạ độ PDF pt
    factoryB-f1.generated-review.csv    danh sách máy độ tin cậy low / medium

Script KHÔNG ghi đè file JSON hiện tại và không đụng tới dữ liệu chỉnh tay
(EDITS trong app vẫn được ưu tiên như cũ).

Toạ độ: PDF point, gốc trên-trái, trục y hướng xuống (giống get_text / get_drawings
của PyMuPDF và giống file factoryB-f1.json hiện tại).
"""

from __future__ import annotations

import argparse
import bisect
import csv
import json
import math
import re
import statistics
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

try:
    import pymupdf as fitz
except ImportError:  # pragma: no cover
    sys.exit('Thiếu PyMuPDF: pip install pymupdf')

import numpy as np

Rect = tuple[float, float, float, float]  # x0, y0, x1, y1
Pt = tuple[float, float]

CODE_RE = re.compile(r'^([AL])-?(\d{2,5})$')
CONF_RANK = {'high': 2, 'medium': 1, 'low': 0}
DASHES = str.maketrans({'–': '-', '—': '-', '_': '-', '‐': '-', '−': '-'})


# =========================================================
# CODE
# =========================================================

def normalize_code(text: str) -> str | None:
    s = re.sub(r'\s+', '', (text or '').upper().translate(DASHES))
    s = s.strip('.,:;()[]{}*#')
    m = CODE_RE.match(s)

    return f'{m.group(1)}-{m.group(2)}' if m else None


def code_sort_key(code: str):
    p, n = code.split('-', 1)

    return (p, int(n) if n.isdigit() else 0)


# =========================================================
# GEOMETRY HELPERS
# =========================================================

def r_area(r: Rect) -> float:
    return max(0.0, r[2] - r[0]) * max(0.0, r[3] - r[1])


def r_center(r: Rect) -> Pt:
    return ((r[0] + r[2]) / 2, (r[1] + r[3]) / 2)


def r_intersect(a: Rect, b: Rect) -> Rect | None:
    x0, y0 = max(a[0], b[0]), max(a[1], b[1])
    x1, y1 = min(a[2], b[2]), min(a[3], b[3])

    return (x0, y0, x1, y1) if x1 > x0 and y1 > y0 else None


def r_contains_pt(r: Rect, p: Pt, eps: float = 0.0) -> bool:
    return r[0] - eps <= p[0] <= r[2] + eps and r[1] - eps <= p[1] <= r[3] + eps


def r_contains_rect(outer: Rect, inner: Rect, eps: float = 0.0) -> bool:
    return (outer[0] - eps <= inner[0] and outer[1] - eps <= inner[1]
            and outer[2] + eps >= inner[2] and outer[3] + eps >= inner[3])


def r_dist_pt(r: Rect, p: Pt) -> float:
    dx = max(r[0] - p[0], 0.0, p[0] - r[2])
    dy = max(r[1] - p[1], 0.0, p[1] - r[3])

    return math.hypot(dx, dy)


def xywh_to_rect(b) -> Rect:
    return (b[0], b[1], b[0] + b[2], b[1] + b[3])


def rect_to_xywh(r: Rect) -> list[float]:
    return [round(r[0], 1), round(r[1], 1), round(r[2] - r[0], 1), round(r[3] - r[1], 1)]


def poly_area(poly: list[Pt]) -> float:
    s = 0.0
    for i in range(len(poly)):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % len(poly)]
        s += x0 * y1 - x1 * y0

    return abs(s) / 2


def pt_in_poly(p: Pt, poly: list[Pt]) -> bool:
    x, y = p
    inside = False
    j = len(poly) - 1

    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]

        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i

    return inside


def union_area(rects: list[Rect]) -> float:
    rects = [r for r in rects if r_area(r) > 0]
    if not rects:
        return 0.0

    xs = sorted({v for r in rects for v in (r[0], r[2])})
    ys = sorted({v for r in rects for v in (r[1], r[3])})
    total = 0.0

    for i in range(len(xs) - 1):
        for j in range(len(ys) - 1):
            cx, cy = (xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2
            if any(r[0] <= cx <= r[2] and r[1] <= cy <= r[3] for r in rects):
                total += (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j])

    return total


def set_iou(a: list[Rect], b: list[Rect]) -> float:
    """IoU giữa 2 tập khung (máy nhiều vị trí): |A∩B| / |A∪B|."""
    if not a or not b:
        return 0.0

    inter = union_area([r for x in a for y in b if (r := r_intersect(x, y))])
    union = union_area(a + b)

    return inter / union if union > 0 else 0.0


def bezier(p0, p1, p2, p3, n=6) -> list[Pt]:
    out = []
    for k in range(1, n + 1):
        t = k / n
        u = 1 - t
        out.append((
            u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
            u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1],
        ))

    return out


# =========================================================
# LABELS
# =========================================================

@dataclass
class Word:
    rect: Rect
    text: str

    @property
    def h(self) -> float:
        return self.rect[3] - self.rect[1]

    @property
    def yc(self) -> float:
        return (self.rect[1] + self.rect[3]) / 2


@dataclass
class Label:
    code: str
    rect: Rect
    words: list[int]
    overlapped: bool = False

    @property
    def center(self) -> Pt:
        return r_center(self.rect)


def extract_words(page, transform) -> list[Word]:
    words = []
    for w in page.get_text('words'):
        r = fitz.Rect(w[:4]) * transform if transform else fitz.Rect(w[:4])
        r.normalize()
        words.append(Word((r.x0, r.y0, r.x1, r.y1), w[4]))

    return words


def find_labels(words: list[Word]) -> list[Label]:
    """Nhận mã máy; gộp nhãn bị tách thành nhiều word cùng hàng (vd 'A-' '1443', 'A' '-' '1443')."""
    order = sorted(range(len(words)), key=lambda i: words[i].yc)
    ycs = [words[i].yc for i in order]

    def right_neighbor(i: int) -> int | None:
        w = words[i]
        tol = max(w.h, 1.0) * 0.5
        lo = bisect.bisect_left(ycs, w.yc - tol)
        hi = bisect.bisect_right(ycs, w.yc + tol)
        best, best_gap = None, None

        for k in order[lo:hi]:
            if k == i:
                continue
            gap = words[k].rect[0] - w.rect[2]
            if -0.3 * w.h <= gap <= 0.8 * max(w.h, words[k].h) and (best_gap is None or gap < best_gap):
                best, best_gap = k, gap

        return best

    labels: list[Label] = []
    used: set[int] = set()

    # 1) word đứng riêng (có thể chứa nhiều mã: 'A-1443/A-1444')
    for i, w in enumerate(words):
        parts = [p for p in re.split(r'[/,;&]', w.text) if p]
        codes = [c for p in parts if (c := normalize_code(p))]

        if codes and len(codes) == len(parts):
            used.add(i)
            labels.extend(Label(c, w.rect, [i]) for c in codes)

    # 2) ghép tối đa 3 word liền nhau trên cùng hàng
    for i, w in enumerate(words):
        if i in used or not re.match(r'^[AL]', w.text.strip().upper()):
            continue

        chain, text, rect = [i], w.text, w.rect

        for _ in range(3):
            k = right_neighbor(chain[-1])
            if k is None or k in used:
                break

            chain.append(k)
            text += words[k].text
            r = words[k].rect
            rect = (min(rect[0], r[0]), min(rect[1], r[1]), max(rect[2], r[2]), max(rect[3], r[3]))
            c = normalize_code(text)

            if c:
                used.update(chain)
                labels.append(Label(c, rect, list(chain)))
                break

    # 3) nhãn chồng chữ: word khác đè lên > 20% diện tích word nhỏ hơn
    for lb in labels:
        for k, w in enumerate(words):
            if k in lb.words:
                continue
            inter = r_intersect(lb.rect, w.rect)
            if inter and r_area(inter) > 0.2 * min(r_area(lb.rect), r_area(w.rect)):
                lb.overlapped = True
                break

    return labels


# =========================================================
# DRAWINGS -> CLOSED SHAPES
# =========================================================

@dataclass
class Shape:
    id: int
    kind: str  # rect | quad | polyline | graph | ray
    bbox: Rect
    poly: list[Pt] | None = None

    @property
    def area(self) -> float:
        return poly_area(self.poly) if self.poly and len(self.poly) >= 3 else r_area(self.bbox)

    def contains(self, p: Pt) -> bool:
        if not r_contains_pt(self.bbox, p):
            return False

        return pt_in_poly(p, self.poly) if self.poly and len(self.poly) >= 3 else True


@dataclass
class Geometry:
    shapes: list[Shape] = field(default_factory=list)
    segments: np.ndarray = field(default_factory=lambda: np.zeros((0, 4)))


def extract_geometry(page, transform, join_tol: float) -> Geometry:
    closed_polys: list[tuple[str, list[Pt]]] = []
    all_segs: list[tuple[float, float, float, float]] = []
    loose_segs: list[tuple[Pt, Pt]] = []

    def P(p) -> Pt:
        q = fitz.Point(p) * transform if transform else fitz.Point(p)
        return (q.x, q.y)

    def close(a: Pt, b: Pt) -> bool:
        return math.hypot(a[0] - b[0], a[1] - b[1]) <= join_tol

    def add_poly_segs(poly: list[Pt], closed: bool):
        n = len(poly)
        for i in range(n if closed else n - 1):
            a, b = poly[i], poly[(i + 1) % n]
            all_segs.append((a[0], a[1], b[0], b[1]))

    for d in page.get_drawings():
        chain: list[Pt] = []

        def flush(is_last: bool):
            nonlocal chain
            if len(chain) >= 2:
                is_closed = len(chain) >= 3 and (close(chain[0], chain[-1]) or (is_last and d.get('closePath')))
                if is_closed:
                    poly = chain[:-1] if close(chain[0], chain[-1]) else chain
                    if len(poly) >= 3:
                        closed_polys.append(('polyline', poly))
                    add_poly_segs(poly, True)
                else:
                    add_poly_segs(chain, False)
                    loose_segs.extend((chain[i], chain[i + 1]) for i in range(len(chain) - 1))
            chain = []

        for item in d['items']:
            op = item[0]

            if op == 're':
                flush(False)
                r = fitz.Rect(item[1])
                poly = [P(r.tl), P(r.tr), P(r.br), P(r.bl)]
                closed_polys.append(('rect', poly))
                add_poly_segs(poly, True)
            elif op == 'qu':
                flush(False)
                q = item[1]
                poly = [P(q.ul), P(q.ur), P(q.lr), P(q.ll)]
                closed_polys.append(('quad', poly))
                add_poly_segs(poly, True)
            elif op in ('l', 'c'):
                p0 = P(item[1])
                pts = [P(item[2])] if op == 'l' else bezier(p0, P(item[2]), P(item[3]), P(item[4]))
                if not chain or not close(chain[-1], p0):
                    flush(False)
                    chain = [p0]
                chain.extend(pts)

        flush(True)

    shapes: list[Shape] = []
    seen: set[tuple] = set()

    def add_shape(kind: str, bbox: Rect, poly: list[Pt] | None):
        key = tuple(round(v, 1) for v in bbox)
        if key in seen:
            return
        seen.add(key)
        shapes.append(Shape(len(shapes), kind, bbox, poly))

    for kind, poly in closed_polys:
        xs, ys = [p[0] for p in poly], [p[1] for p in poly]
        add_shape(kind, (min(xs), min(ys), max(xs), max(ys)), poly)

    # Các đoạn rời nối thành vòng kín: snap đầu mút theo dung sai,
    # bỏ dần đỉnh bậc < 2, mỗi thành phần liên thông còn lại là 1 hình kín (lấy bbox)
    def snap(p: Pt):
        return (round(p[0] / join_tol), round(p[1] / join_tol))

    adj: dict[tuple, set[tuple]] = defaultdict(set)
    coords: dict[tuple, Pt] = {}
    for a, b in loose_segs:
        ka, kb = snap(a), snap(b)
        if ka == kb:
            continue
        adj[ka].add(kb)
        adj[kb].add(ka)
        coords[ka], coords[kb] = a, b

    stack = [k for k, v in adj.items() if len(v) < 2]
    while stack:
        k = stack.pop()
        if k not in adj:
            continue
        for n in adj.pop(k):
            if n in adj:
                adj[n].discard(k)
                if len(adj[n]) < 2:
                    stack.append(n)

    visited: set[tuple] = set()
    for start in adj:
        if start in visited:
            continue
        comp, queue = [], [start]
        visited.add(start)
        while queue:
            k = queue.pop()
            comp.append(k)
            for n in adj[k]:
                if n not in visited:
                    visited.add(n)
                    queue.append(n)
        if len(comp) >= 3:
            xs = [coords[k][0] for k in comp]
            ys = [coords[k][1] for k in comp]
            add_shape('graph', (min(xs), min(ys), max(xs), max(ys)), None)

    segs = np.array(all_segs, dtype=float) if all_segs else np.zeros((0, 4))

    return Geometry(shapes, segs)


# =========================================================
# RAY ENCLOSURE (khung hở / chữ T không nối thành vòng)
# =========================================================

class RayCaster:
    def __init__(self, segs: np.ndarray):
        self.x0, self.y0, self.x1, self.y1 = (segs[:, i] for i in range(4))
        self.xmin, self.xmax = np.minimum(self.x0, self.x1), np.maximum(self.x0, self.x1)
        self.ymin, self.ymax = np.minimum(self.y0, self.y1), np.maximum(self.y0, self.y1)

    def cast(self, px: float, py: float, direction: str, maxlen: float) -> float | None:
        eps = 1e-6
        with np.errstate(divide='ignore', invalid='ignore'):
            if direction in ('left', 'right'):
                m = (self.ymin <= py) & (self.ymax >= py) & (self.ymax - self.ymin > eps)
                x = self.x0[m] + (py - self.y0[m]) * (self.x1[m] - self.x0[m]) / (self.y1[m] - self.y0[m])
                d = (x - px) if direction == 'right' else (px - x)
            else:
                m = (self.xmin <= px) & (self.xmax >= px) & (self.xmax - self.xmin > eps)
                y = self.y0[m] + (px - self.x0[m]) * (self.y1[m] - self.y0[m]) / (self.x1[m] - self.x0[m])
                d = (y - py) if direction == 'down' else (py - y)

        d = d[(d > 0.05) & (d <= maxlen)]
        if not d.size:
            return None

        v = float(d.min())

        return {'right': px + v, 'left': px - v, 'down': py + v, 'up': py - v}[direction]

    def enclosure(self, label: Label, maxlen: float) -> Rect | None:
        cx, cy = label.center
        L = self.cast(cx, cy, 'left', maxlen)
        R = self.cast(cx, cy, 'right', maxlen)
        U = self.cast(cx, cy, 'up', maxlen)
        D = self.cast(cx, cy, 'down', maxlen)

        if None in (L, R, U, D):
            return None

        # Khung ôm sát nhãn (khung chữ) -> bắn tiếp ra ngoài thêm 1 lần
        box = (L, U, R, D)
        if is_label_frame(box, label):
            L2 = self.cast(L - 0.1, cy, 'left', maxlen)
            R2 = self.cast(R + 0.1, cy, 'right', maxlen)
            U2 = self.cast(cx, U - 0.1, 'up', maxlen)
            D2 = self.cast(cx, D + 0.1, 'down', maxlen)
            if None in (L2, R2, U2, D2):
                return None
            box = (L2, U2, R2, D2)

        return box


# =========================================================
# MATCHING
# =========================================================

@dataclass
class Limits:
    min_side: float
    min_area: float
    max_side: float
    max_area: float
    max_aspect: float
    radius: float
    ray_len: float


def is_label_frame(bbox: Rect, label: Label) -> bool:
    lr = label.rect
    m = max(2.0, 0.6 * (lr[3] - lr[1]))
    grown = (lr[0] - m, lr[1] - m, lr[2] + m, lr[3] + m)

    return r_contains_rect(bbox, lr, 0.5) and r_contains_rect(grown, bbox)


def shape_ok(bbox: Rect, label: Label, other_centers: list[Pt], lim: Limits) -> bool:
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]

    if w < lim.min_side or h < lim.min_side or w * h < lim.min_area:
        return False
    if w > lim.max_side or h > lim.max_side or w * h > lim.max_area:
        return False
    if max(w, h) / max(min(w, h), 1e-6) > lim.max_aspect:
        return False
    if is_label_frame(bbox, label):
        return False

    # chứa nhãn của máy khác -> là khu vực / line, không phải máy
    return not any(r_contains_pt(bbox, c) for c in other_centers)


@dataclass
class Assignment:
    label: Label
    bbox: Rect | None = None
    shape_id: int | None = None
    confidence: str = 'low'  # high | medium | low
    reason: str = ''


def match_labels(labels: list[Label], geo: Geometry, lim: Limits) -> list[Assignment]:
    ray = RayCaster(geo.segments) if len(geo.segments) else None
    centers_by_code: dict[str, list[Pt]] = defaultdict(list)
    for lb in labels:
        centers_by_code[lb.code].append(lb.center)

    def others(lb: Label) -> list[Pt]:
        return [c for code, cs in centers_by_code.items() if code != lb.code for c in cs]

    result = [Assignment(lb) for lb in labels]

    # Pha 1: hình kín nhỏ nhất chứa tâm nhãn
    for a in result:
        oc = others(a.label)
        cands = [s for s in geo.shapes if s.contains(a.label.center) and shape_ok(s.bbox, a.label, oc, lim)]
        if cands:
            s = min(cands, key=lambda s: s.area)
            a.bbox, a.shape_id, a.confidence, a.reason = s.bbox, s.id, 'high', f'inside_{s.kind}'

    # Tranh chấp: 1 hình bị 2 mã khác nhau nhận
    owners: dict[int, set[str]] = defaultdict(set)
    for a in result:
        if a.shape_id is not None:
            owners[a.shape_id].add(a.label.code)
    for a in result:
        if a.shape_id is not None and len(owners[a.shape_id]) > 1:
            a.confidence, a.reason = 'low', 'disputed_shape'

    taken = {sid: codes for sid, codes in owners.items()}

    # Pha 2a: khung hở bao quanh nhãn (bắn tia 4 hướng)
    pending = [a for a in result if a.bbox is None]
    for a in pending:
        if not ray:
            break
        box = ray.enclosure(a.label, lim.ray_len)
        if box and shape_ok(box, a.label, others(a.label), lim):
            a.bbox, a.confidence, a.reason = box, 'medium', 'ray_enclosure'

    # Pha 2b: hình kín gần nhất trong bán kính, tránh hình đã gán cho máy khác (greedy theo khoảng cách)
    pending = [a for a in result if a.bbox is None]
    pairs = []
    for ai, a in enumerate(pending):
        oc = others(a.label)
        for s in geo.shapes:
            d = r_dist_pt(s.bbox, a.label.center)
            if d <= lim.radius and shape_ok(s.bbox, a.label, oc, lim):
                pairs.append((d, ai, s))
    pairs.sort(key=lambda t: t[0])

    for d, ai, s in pairs:
        a = pending[ai]
        if a.bbox is not None:
            continue
        if taken.get(s.id, set()) - {a.label.code}:
            continue
        a.bbox, a.shape_id, a.confidence, a.reason = s.bbox, s.id, 'medium', f'nearest_{s.kind}_{d:.1f}pt'
        taken.setdefault(s.id, set()).add(a.label.code)

    for a in result:
        if a.bbox is None:
            a.reason = 'no_shape'
        elif a.label.overlapped:
            a.confidence = 'low'
            a.reason += '+label_overlapped'

    return result


# =========================================================
# SNAP MODE (không đọc nhãn, bám theo khung hiện tại)
# =========================================================

@dataclass
class SnapResult:
    code: str
    index: int
    old: Rect
    bbox: Rect | None = None
    iou: float = 0.0
    confidence: str = 'low'
    reason: str = ''


def size_ok(bbox: Rect, lim: Limits) -> bool:
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]

    if w < lim.min_side or h < lim.min_side or w * h < lim.min_area:
        return False
    if w > lim.max_side or h > lim.max_side or w * h > lim.max_area:
        return False

    return max(w, h) / max(min(w, h), 1e-6) <= lim.max_aspect


def snap_boxes(
    old: dict[str, list[Rect]],
    geo: Geometry,
    lim: Limits,
    margin: float,
    area_ratio: float,
) -> list[SnapResult]:
    shapes = [s for s in geo.shapes if size_ok(s.bbox, lim)]
    sb = np.array([s.bbox for s in shapes], dtype=float).reshape(-1, 4)
    areas = (sb[:, 2] - sb[:, 0]) * (sb[:, 3] - sb[:, 1])

    # (kết quả, [(điểm gốc, iou, shape)]) cho từng khung cũ
    jobs: list[tuple[SnapResult, list[tuple[float, float, Shape]]]] = []

    for code, rects in old.items():
        for i, r in enumerate(rects):
            a = r_area(r)
            m = (
                (sb[:, 0] <= r[2] + margin) & (sb[:, 2] >= r[0] - margin)
                & (sb[:, 1] <= r[3] + margin) & (sb[:, 3] >= r[1] - margin)
                & (areas <= area_ratio * a) & (areas >= a / area_ratio)
            )
            oc = r_center(r)
            norm = math.hypot(r[2] - r[0], r[3] - r[1]) / 2 + margin
            cands = []

            for k in np.nonzero(m)[0]:
                s = shapes[int(k)]
                iou = set_iou([r], [s.bbox])
                sc = r_center(s.bbox)
                closeness = 1 - min(math.hypot(sc[0] - oc[0], sc[1] - oc[1]) / norm, 1.0)
                cands.append((iou + 0.2 * closeness, iou, s))

            jobs.append((SnapResult(code, i, r), cands))

    # Khung có ứng viên rõ nhất xử lý trước
    jobs.sort(key=lambda j: max((c[0] for c in j[1]), default=-1.0), reverse=True)

    taken: dict[int, tuple[str, int]] = {}
    results: list[SnapResult] = []

    for res, cands in jobs:
        results.append(res)

        if not cands:
            res.reason = 'no_candidate'
            continue

        score, iou, s = max(
            ((sc - (0.3 if c.id in taken else 0.0), io, c) for sc, io, c in cands),
            key=lambda t: t[0],
        )
        disputed = s.id in taken

        if iou < 0.25:
            res.reason = f'best_iou_{iou:.2f}'
            continue

        res.bbox, res.iou = s.bbox, iou
        taken.setdefault(s.id, (res.code, res.index))

        if iou >= 0.5 and not disputed:
            res.confidence, res.reason = 'high', f'snap_{s.kind}'
        else:
            res.confidence = 'medium'
            res.reason = f'snap_{s.kind}' + ('+shared_shape' if disputed else '+iou_0.25-0.5')

    results.sort(key=lambda r: (code_sort_key(r.code), r.index))

    return results


# =========================================================
# IO
# =========================================================

def load_manual(path: Path, all_sources: bool) -> dict[str, list[Rect]]:
    """Nhận file 'Xuất JSON' của app ({machines:[...]}) hoặc EDITS ({code:{boxes,deleted}})."""
    data = json.loads(path.read_text(encoding='utf-8'))
    out: dict[str, list[Rect]] = {}

    if isinstance(data, dict) and isinstance(data.get('machines'), list):
        for m in data['machines']:
            code = normalize_code(m.get('code', ''))
            if not code:
                continue
            if not all_sources and m.get('source') not in (None, 'manual'):
                continue
            boxes = [(l['x'], l['y'], l['x'] + l['w'], l['y'] + l['h']) for l in m.get('locations', [])]
            if boxes:
                out[code] = boxes
    elif isinstance(data, dict):
        for code, e in data.items():
            c = normalize_code(code)
            if not c or not isinstance(e, dict) or e.get('deleted') or not e.get('boxes'):
                continue
            out[c] = [(b['x'], b['y'], b['x'] + b['w'], b['y'] + b['h']) for b in e['boxes']]

    return out


def write_layout_json(path: Path, crop, page, ppp, machines: dict[str, dict]):
    lines = [f'    {json.dumps(c)}: {json.dumps(v, separators=(",", ":"))}'
             for c, v in machines.items()]
    text = (
        '{\n'
        f'  "crop": {json.dumps(crop, separators=(",", ":"))},\n'
        f'  "page": {json.dumps(page, separators=(",", ":"))},\n'
        f'  "ppp": {ppp},\n'
        '  "m": {\n' + ',\n'.join(lines) + '\n  }\n}\n'
    )
    json.loads(text)
    path.write_text(text, encoding='utf-8')


# =========================================================
# MAIN
# =========================================================

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--mode', choices=['label', 'snap'], default='label',
                    help='label: đọc nhãn mã máy; snap: bám khung hiện tại vào hình kín trên bản vẽ')
    ap.add_argument('--apply', choices=['high', 'medium'], default='high',
                    help='mức tin cậy tối thiểu để thay khung cũ (mặc định high)')
    ap.add_argument('--snap-margin', type=float, default=15.0, help='snap: mở rộng khung cũ mỗi phía (pt)')
    ap.add_argument('--snap-area-ratio', type=float, default=3.0,
                    help='snap: loại hình có diện tích > N lần hoặc < 1/N khung cũ')
    ap.add_argument('--pdf', required=True, type=Path)
    ap.add_argument('--current', required=True, type=Path, help='factoryB-f1.json hiện tại (lấy crop/ppp, so sánh)')
    ap.add_argument('--manual', type=Path, help='JSON chỉnh tay xuất từ app')
    ap.add_argument('--out', type=Path)
    ap.add_argument('--review-csv', type=Path)
    ap.add_argument('--page', type=int, default=0, help='trang PDF (0-based)')
    ap.add_argument('--all-sources', action='store_true',
                    help='so sánh với mọi máy trong file --manual, không chỉ source=manual')
    ap.add_argument('--join-tol', type=float, default=0.6, help='dung sai nối đầu mút (pt)')
    ap.add_argument('--radius', type=float, default=30.0, help='bán kính tìm hình gần nhất (pt)')
    ap.add_argument('--ray-len', type=float, default=100.0, help='độ dài tia tối đa (pt)')
    ap.add_argument('--min-side', type=float, default=2.0)
    ap.add_argument('--min-area', type=float, default=6.0)
    ap.add_argument('--max-side', type=float, default=160.0)
    ap.add_argument('--max-area', type=float, default=None,
                    help='mặc định: max(4000, 4 x P90 diện tích khung hiện tại)')
    ap.add_argument('--max-aspect', type=float, default=15.0)
    args = ap.parse_args()

    out_path = args.out or args.current.with_name(args.current.stem + '.generated.json')
    csv_path = args.review_csv or args.current.with_name(args.current.stem + '.generated-review.csv')

    if out_path.resolve() == args.current.resolve():
        sys.exit('--out trùng file hiện tại; script không ghi đè dữ liệu cũ.')

    current = json.loads(args.current.read_text(encoding='utf-8'))
    crop, ppp = current['crop'], current['ppp']
    crop_rect: Rect = (crop[0], crop[1], crop[0] + crop[2], crop[1] + crop[3])
    old: dict[str, list[Rect]] = {c: [xywh_to_rect(b) for b in v['b']] for c, v in current['m'].items()}

    old_areas = sorted(r_area(r) for rs in old.values() for r in rs)
    p90 = old_areas[int(0.9 * (len(old_areas) - 1))] if old_areas else 0.0
    max_area = args.max_area or max(4000.0, 4 * p90)
    lim = Limits(args.min_side, args.min_area, args.max_side, max_area, args.max_aspect, args.radius, args.ray_len)

    # ---------- PDF ----------
    doc = fitz.open(args.pdf)
    page = doc[args.page]
    transform = page.rotation_matrix if page.rotation else None
    page_size = [round(page.rect.width, 2), round(page.rect.height, 2)]

    if page.rotation:
        print(f'! Trang xoay {page.rotation}°: đã quy đổi toạ độ theo page.rotation_matrix.')
    if any(abs(a - b) > 0.5 for a, b in zip(page_size, current['page'])):
        print(f'! Kích thước trang {page_size} khác file hiện tại {current["page"]}.')

    geo = extract_geometry(page, transform, args.join_tol)

    print(f'Mode: {args.mode}  |  apply: {args.apply}  |  hình kín: {len(geo.shapes)}  |  đoạn: {len(geo.segments)}')
    print(f'Giới hạn hình máy: cạnh {lim.min_side}-{lim.max_side} pt, diện tích {lim.min_area}-{lim.max_area:.0f} pt²')

    if args.mode == 'snap':
        info = run_snap_mode(old, geo, lim, args.snap_margin, args.snap_area_ratio)
    else:
        info = run_label_mode(page, transform, crop_rect, old, geo, lim)

    # ---------- APPLY ----------
    applied_levels = {'high'} if args.apply == 'high' else {'high', 'medium'}
    old_u = {c: bool(v.get('u')) for c, v in current['m'].items()}
    machines: dict[str, dict] = {}

    for code in sorted(info, key=code_sort_key):
        v = info[code]
        # Máy chưa có trong file cũ thì không có khung cũ để giữ
        v['applied'] = v['confidence'] in applied_levels or code not in old
        v['out'] = v['proposed'] if v['applied'] else old[code]
        u = old_u.get(code, False) if args.mode == 'snap' else v['confidence'] != 'high'
        machines[code] = {'b': [rect_to_xywh(r) for r in v['out']], 'u': u}

    write_layout_json(out_path, crop, current['page'], ppp, machines)

    counts = defaultdict(int)
    for v in info.values():
        counts[v['confidence']] += 1
    n_applied = sum(1 for c, v in info.items() if v['applied'] and c in old)
    print(f'\nĐã ghi {out_path}  ({len(machines)} máy: '
          f'high {counts["high"]}, medium {counts["medium"]}, low {counts["low"]}; '
          f'thay khung {n_applied} máy)')

    new_codes = sorted(set(machines) - set(old), key=code_sort_key)
    if new_codes:
        print(f'Mã mới so với file hiện tại: {", ".join(new_codes)}')

    # ---------- SO SÁNH VỚI CHỈNH TAY ----------
    # (IoU cũ, IoU đề xuất, IoU ghi ra) so với khung tay
    iou_rows: dict[str, tuple[float, float, float]] = {}
    if args.manual:
        manual = load_manual(args.manual, args.all_sources)
        print(f'\nSo sánh với {len(manual)} máy chỉnh tay ({args.manual.name})')
        print('IoU đề xuất = khung tìm được trên bản vẽ; IoU ghi ra = khung thực sự ghi vào JSON theo --apply')
        print(f'{"Mã":<10}{"IoU cũ":>8}{"Đề xuất":>9}{"Ghi ra":>8}{"Δ":>8}  {"Tin cậy":<8} Ghi chú')
        print('-' * 84)

        ok_old = ok_prop = ok_out = 0
        for code in sorted(manual, key=code_sort_key):
            v = info.get(code)
            io = set_iou(old.get(code, []), manual[code])
            ip = set_iou(v['proposed'] if v else [], manual[code])
            iw = set_iou(v['out'] if v else [], manual[code])
            iou_rows[code] = (io, ip, iw)
            ok_old += io >= 0.7
            ok_prop += ip >= 0.7
            ok_out += iw >= 0.7
            conf = v['confidence'] if v else '-'
            note = ';'.join(v['reasons']) if v else 'không có trong kết quả mới'
            print(f'{code:<10}{io:>8.2f}{ip:>9.2f}{iw:>8.2f}{iw - io:>+8.2f}  {conf:<8} {note}')

        print('-' * 84)
        n = len(manual) or 1
        print(f'IoU >= 0.7: trước {ok_old}/{len(manual)} ({ok_old / n:.0%})  ->  '
              f'sau {ok_out}/{len(manual)} ({ok_out / n:.0%})  '
              f'[nếu thay hết đề xuất: {ok_prop}/{len(manual)} ({ok_prop / n:.0%})]')

    # ---------- CSV REVIEW ----------
    with csv_path.open('w', newline='', encoding='utf-8-sig') as f:
        wr = csv.writer(f)
        wr.writerow(['machine_code', 'confidence', 'reasons', 'applied', 'label_count', 'label_centers',
                     'new_boxes_xywh', 'old_boxes_xywh', 'iou_new_vs_old',
                     'iou_old_vs_manual', 'iou_new_vs_manual', 'iou_output_vs_manual'])
        n_review = 0
        for code, v in info.items():
            if v['confidence'] == 'high':
                continue
            n_review += 1
            io = iou_rows.get(code)
            wr.writerow([
                code,
                v['confidence'],
                ';'.join(v['reasons']),
                'yes' if v['applied'] else 'no',
                len(v['labels']),
                ' | '.join(f'{p[0]:.1f},{p[1]:.1f}' for p in v['labels']),
                ' | '.join(','.join(map(str, rect_to_xywh(r))) for r in v['proposed']),
                ' | '.join(','.join(map(str, rect_to_xywh(r))) for r in old.get(code, [])),
                f'{set_iou(v["proposed"], old[code]):.2f}' if code in old and v['proposed'] else '',
                f'{io[0]:.2f}' if io else '',
                f'{io[1]:.2f}' if io else '',
                f'{io[2]:.2f}' if io else '',
            ])

    print(f'Đã ghi {csv_path} ({n_review} máy low/medium cần kiểm tra)')


def run_label_mode(page, transform, crop_rect: Rect, old: dict[str, list[Rect]],
                   geo: Geometry, lim: Limits) -> dict[str, dict]:
    words = extract_words(page, transform)
    labels = [lb for lb in find_labels(words) if r_contains_pt(crop_rect, lb.center)]

    print(f'Words: {len(words)}  |  nhãn mã máy trong vùng crop: {len(labels)} ({len({lb.code for lb in labels})} mã)')
    if not labels:
        print('! Không đọc được nhãn nào (chữ có thể đã bị xuất thành nét vẽ). Thử --mode snap.')

    # Kiểm tra cùng hệ toạ độ với file hiện tại
    dists = [min(r_dist_pt(r, lb.center) for r in old[lb.code]) for lb in labels if lb.code in old]
    if dists:
        med = statistics.median(dists)
        print(f'Khoảng cách trung vị nhãn PDF -> khung cũ: {med:.1f} pt')
        if med > 40:
            print('! Nhãn lệch xa khung cũ: kiểm tra --page / hệ toạ độ trước khi dùng kết quả.')

    assigns = match_labels(labels, geo, lim)
    by_code: dict[str, list[Assignment]] = defaultdict(list)
    for a in assigns:
        by_code[a.label.code].append(a)

    info: dict[str, dict] = {}

    for code in set(by_code) | set(old):
        items = by_code.get(code, [])
        boxes: list[Rect] = []
        for a in items:
            if a.bbox and not any(r_intersect(a.bbox, b) and set_iou([a.bbox], [b]) > 0.9 for b in boxes):
                boxes.append(a.bbox)

        if not items:
            conf, reasons, boxes = 'low', ['label_not_found_keep_old'], old[code]
        elif not boxes:
            conf, reasons = 'low', sorted({a.reason for a in items})
            boxes = old.get(code) or [
                (a.label.rect[0] - 2, a.label.rect[1] - 2, a.label.rect[2] + 2, a.label.rect[3] + 2) for a in items
            ]
            reasons.append('fallback_old_box' if code in old else 'fallback_label_box')
        else:
            conf = min((a.confidence for a in items), key=lambda c: CONF_RANK[c])
            reasons = sorted({a.reason for a in items})

        info[code] = {
            'confidence': conf,
            'reasons': reasons,
            'labels': [a.label.center for a in items],
            'proposed': boxes,
        }

    return info


def run_snap_mode(old: dict[str, list[Rect]], geo: Geometry, lim: Limits,
                  margin: float, area_ratio: float) -> dict[str, dict]:
    results = snap_boxes(old, geo, lim, margin, area_ratio)
    by_code: dict[str, list[SnapResult]] = defaultdict(list)
    for r in results:
        by_code[r.code].append(r)

    info: dict[str, dict] = {}

    for code, items in by_code.items():
        items.sort(key=lambda r: r.index)
        conf = min((r.confidence for r in items), key=lambda c: CONF_RANK[c])
        info[code] = {
            'confidence': conf,
            'reasons': [f'#{r.index + 1}:{r.reason}' if len(items) > 1 else r.reason for r in items],
            'labels': [],
            # khung không có ứng viên thì đề xuất giữ khung cũ
            'proposed': [r.bbox or r.old for r in items],
        }

    return info


if __name__ == '__main__':
    main()
