"""Ôm khung sát máy theo ẢNH layout (định dạng JSON Machine Locator: crop / ppp / m{b, p, src, r}).
- Khung chưa có đường bao (p) – gồm khung vừa sửa tay trong app (app xoá p khi sửa): tìm hình máy quanh khung (mở rộng ~25%),
  lấy các khối nét kín chạm vào khung, tạo đường bao p và thu khung b về đúng bao ngoài của máy.
- Khung đã có p: giữ nguyên (chạy lại nhiều lần không làm khung to dần). --all: làm lại tất cả.
- Toạ độ ảnh: px = (pt - crop[0..1]) * ppp  (crop[2..3] là kích thước ảnh tính bằng điểm, không dùng ở đây).
python fit_frames.py <layout.png> <in.json> <out.json> [--all]   (--all: làm lại cho mọi khung)"""
import sys, json
import numpy as np, cv2
from scipy import ndimage as ndi

png, src, dst = sys.argv[1:4]
ALL = '--all' in sys.argv
import os
for f in (png, src):
    if not os.path.isfile(f): sys.exit(f'Không thấy file: {os.path.abspath(f)}  -> kiểm tra lại đường dẫn')
g = cv2.imdecode(np.fromfile(png, np.uint8), cv2.IMREAD_GRAYSCALE)   # đọc được cả đường dẫn có dấu tiếng Việt
if g is None: sys.exit(f'Không đọc được ảnh: {png}')
H, W = g.shape
d = json.load(open(src, encoding='utf-8')); cx0, cy0 = d['crop'][0], d['crop'][1]; ppp = d['ppp']
INK = {160: (g < 160).astype(np.uint8), 215: (g < 215).astype(np.uint8)}   # 215: máy vẽ nét xám nhạt
to_px = lambda x, y: ((x - cx0) * ppp, (y - cy0) * ppp)
to_pt = lambda px, py: [round(px / ppp + cx0, 1), round(py / ppp + cy0, 1)]

def fit(b, thr=160):
    x, y, w, h = b
    X0, Y0 = to_px(x, y); X1, Y1 = to_px(x + w, y + h)
    mx = max(12, 0.25 * (X1 - X0)); my = max(12, 0.25 * (Y1 - Y0))
    a0, b0, a1, b1 = int(max(0, X0 - mx)), int(max(0, Y0 - my)), int(min(W, X1 + mx)), int(min(H, Y1 + my))
    if a1 - a0 < 10 or b1 - b0 < 10: return None
    roi = INK[thr][b0:b1, a0:a1]
    closed = cv2.morphologyEx(roi, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8), iterations=2)
    filled = ndi.binary_fill_holes(closed).astype(np.uint8)
    solid = cv2.morphologyEx(filled, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
    lab, n = ndi.label(solid)
    if not n: return None
    box = np.zeros_like(solid); box[int(Y0) - b0:int(Y1) - b0, int(X0) - a0:int(X1) - a0] = 1
    A = (X1 - X0) * (Y1 - Y0)
    keep = np.zeros_like(solid)
    for i in range(1, n + 1):
        comp = lab == i; area = comp.sum(); inside = (comp & (box > 0)).sum()
        # khối thuộc máy: nằm phần lớn trong khung, hoặc là khối lớn phủ tâm khung
        if area >= 0.02 * A and (inside >= 0.6 * area or (inside >= 0.25 * A and area <= 2.5 * A)):
            keep |= comp
    if keep.sum() < 0.2 * A: return None
    cs, _ = cv2.findContours(keep.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    polys = []
    for c in cs:
        if cv2.contourArea(c) < 0.02 * A: continue
        c = cv2.approxPolyDP(c, 2.0, True).reshape(-1, 2)
        if len(c) >= 3: polys.append([to_pt(a0 + px, b0 + py) for px, py in c])
    if not polys: return None
    ys, xs = np.nonzero(keep)
    p0 = to_pt(a0 + xs.min(), b0 + ys.min()); p1 = to_pt(a0 + xs.max() + 1, b0 + ys.max() + 1)
    return [p0[0], p0[1], round(p1[0] - p0[0], 1), round(p1[1] - p0[1], 1)], polys

done = snapped = miss = 0; report = []; fitted = []
for code, v in d['m'].items():
    p = v.get('p') or [None] * len(v['b'])
    # chỉ làm khung CHƯA có đường bao: app TS xoá p khi bạn sửa khung, nên khung vừa sửa tay sẽ được ôm lại,
    # còn khung đã ôm rồi thì giữ nguyên (chạy lại nhiều lần không làm khung to dần)
    need = [ALL or not (i < len(p) and p[i]) for i in range(len(v['b']))]
    if not any(need): continue
    newp = list(p) + [None] * (len(v['b']) - len(p))
    for i, b in enumerate(v['b']):
        if not need[i]: continue
        r = fit(b) or fit(b, 215)
        if not r: miss += 1; report.append(f'{code}: không tìm thấy hình máy trong/quanh khung'); continue
        nb, polys = r
        shift = max(abs(nb[0] - b[0]), abs(nb[1] - b[1]), abs(nb[0] + nb[2] - b[0] - b[2]), abs(nb[1] + nb[3] - b[1] - b[3]))
        if shift > 0.5: snapped += 1
        if shift > 12: report.append(f'{code}: khung đổi nhiều ({shift:.0f} pt) – nên soát')
        v['b'][i] = nb; newp[i] = polys; done += 1
        tag = f'{code}' + (f' (vị trí {i + 1})' if len(v['b']) > 1 else '')
        fitted.append(f'{tag}: dời/đổi {shift:.1f} pt' if shift > 0.5 else f'{tag}: giữ khung, thêm đường bao')
    v['p'] = newp
    if not any(newp): v.pop('p')
json.dump(d, open(dst, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print(f'ôm lại {done} khung (thu/giãn {snapped}), không tìm được {miss}')
if fitted:
    print('Đã ôm:')
    for f in fitted: print('  +', f)
if report:
    print('Cần soát:')
    for r in report: print('  -', r)