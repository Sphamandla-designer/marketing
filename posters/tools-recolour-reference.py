"""Turn the uploaded partnership reference into a clean AX-Channels ground.

Keeps the poster exactly as designed — the curved line field, the handshake, the
gradient, the arrow — and changes only two things:
  1. the purple (hue 230-300) becomes AX-Channels magenta (#D62F6C, hue 338);
     the suits and shirt cuffs (blue-grey, hue ~215) and the skin are untouched;
  2. the old white wording and logos are lifted out by inpainting, so new copy
     can be set in exactly the same places.
Output: assets/partnership-ground.png at 1080 x 1350.
"""
import cv2, numpy as np
src = cv2.imread('refs/partnership-reference.jpeg')            # 736 x 920, BGR
hsv = cv2.cvtColor(src, cv2.COLOR_BGR2HSV_FULL).astype(np.float32)   # H in 0..255
H = hsv[..., 0] * 360 / 256
S = hsv[..., 1] / 255
# weight: 1 inside the purple band, ramping off at its edges, 0 for low-saturation pixels
w = np.clip((H - 228) / 12, 0, 1) * np.clip((305 - H) / 12, 0, 1) * np.clip((S - .12) / .15, 0, 1)
target = 338 + (H - 268) * 0.25                               # keep a little of the original variation
Hn = H + (target - H) * w
hsv[..., 0] = (Hn % 360) * 256 / 360
hsv[..., 1] = np.clip(hsv[..., 1] * (1 + .05 * w), 0, 255)
out = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR_FULL)

# the old copy: white, unsaturated pixels inside these boxes (native coordinates)
boxes = [(440, 68, 672, 100),    # web address, top right
         (98, 158, 602, 278),    # the two partner logos
         (78, 298, 664, 452),    # the two-line headline
         (66, 792, 292, 852),    # footer logo
         (505, 798, 672, 852)]   # footer contact
hsv8 = cv2.cvtColor(src, cv2.COLOR_BGR2HSV)
bright = ((hsv8[..., 2] > 95) & (hsv8[..., 1] < 120)).astype(np.uint8) * 255
mask = np.zeros(bright.shape, np.uint8)
for x0, y0, x1, y1 in boxes:
    mask[y0:y1, x0:x1] = bright[y0:y1, x0:x1]
mask = cv2.dilate(mask, np.ones((7, 7), np.uint8), iterations=1)
# frequency-selective reconstruction carries the fine line field through the holes,
# where a diffusion fill would leave dark ghosts of the old letters
valid = np.where(mask > 0, 0, 255).astype(np.uint8)
clean = np.zeros_like(out)
cv2.xphoto.inpaint(out, valid, clean, cv2.xphoto.INPAINT_FSR_BEST)
# the footer sits on a plain gradient: fill those two boxes whole, smoothly
# (a vertical gradient), so each column is blended between the rows just above and below
for x0, y0, x1, y1 in boxes[3:]:
    y0, y1, x0, x1 = y0 - 6, y1 + 6, x0 - 6, x1 + 6
    top = clean[y0 - 3:y0, x0:x1].astype(np.float32).mean(0)
    bot = clean[y1:y1 + 3, x0:x1].astype(np.float32).mean(0)
    t = np.linspace(0, 1, y1 - y0)[:, None, None]
    fill = top[None] * (1 - t) + bot[None] * t
    # smooth across columns too, so no single column shows a seam
    fill = cv2.GaussianBlur(fill, (0, 0), sigmaX=4, sigmaY=.1)
    clean[y0:y1, x0:x1] = np.clip(fill + np.random.normal(0, 1.2, fill.shape), 0, 255).astype(np.uint8)

big = cv2.resize(clean, (1080, 1350), interpolation=cv2.INTER_LANCZOS4)
blur = cv2.GaussianBlur(big, (0, 0), 1.2)
big = cv2.addWeighted(big, 1.35, blur, -.35, 0)                # gentle unsharp after the upscale
cv2.imwrite('assets/partnership-ground.png', big)
cv2.imwrite('/tmp/claude-0/-home-user/52f9107b-1e4e-5329-bf59-ff5cf7f617d5/scratchpad/ax/mask.png', mask)
print('ok', int(mask.astype(bool).sum()))
