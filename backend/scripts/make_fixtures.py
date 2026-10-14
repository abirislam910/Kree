"""Generate demo fixtures for Kree's mock generation mode (MOCK_GENERATION=true).

- demo-image.png: 1536x1024 (same size the image model returns), labelled DEMO.
- demo-audio.mp3: 30s seamless-ish lo-fi loop (64 BPM, 8 bars), mono 96 kbps.

Usage (from backend/):
    python3 -m venv .venv-fixtures
    .venv-fixtures/bin/pip install lameenc numpy pillow
    .venv-fixtures/bin/python scripts/make_fixtures.py fixtures
"""
import sys
import numpy as np
import lameenc
from PIL import Image, ImageDraw, ImageFilter, ImageFont

out_dir = sys.argv[1]

# ---------- image ----------
W, H = 1536, 1024
y = np.linspace(0, 1, H)[:, None]
x = np.linspace(0, 1, W)[None, :]
top = np.array([58, 42, 74])      # dusk purple
bottom = np.array([232, 150, 96])  # warm amber
grad = top * (1 - y[..., None]) + bottom * y[..., None]
glow = np.exp(-(((x - 0.68) ** 2) / 0.02 + ((y - 0.42) ** 2) / 0.03))[..., None]
img_arr = np.clip(grad + glow * np.array([90, 70, 30]), 0, 255).astype(np.uint8)
img_arr = np.broadcast_to(img_arr, (H, W, 3)).copy()
img = Image.fromarray(img_arr, 'RGB')

d = ImageDraw.Draw(img)
# window
d.rounded_rectangle([880, 180, 1260, 560], radius=18, fill=(255, 214, 150), outline=(70, 45, 60), width=14)
d.line([1070, 180, 1070, 560], fill=(70, 45, 60), width=10)
d.line([880, 370, 1260, 370], fill=(70, 45, 60), width=10)
# desk, lamp, books, plant
d.rectangle([0, 760, W, 1024], fill=(92, 58, 52))
d.rectangle([0, 740, W, 770], fill=(122, 80, 66))
d.polygon([(250, 520), (390, 520), (350, 600), (290, 600)], fill=(255, 196, 120))
d.rectangle([312, 600, 328, 740], fill=(60, 40, 44))
d.ellipse([260, 725, 380, 750], fill=(60, 40, 44))
for i, c in enumerate([(160, 72, 72), (82, 110, 140), (196, 160, 90), (96, 130, 96)]):
    d.rectangle([520 + i * 46, 600 - i * 12, 558 + i * 46, 740], fill=c)
d.rectangle([1320, 640, 1420, 740], fill=(150, 90, 70))
for dx, dy in [(-40, -90), (0, -130), (40, -95), (-15, -60), (25, -60)]:
    d.ellipse([1370 + dx - 38, 640 + dy - 38, 1370 + dx + 38, 640 + dy + 38], fill=(88, 140, 92))
img = img.filter(ImageFilter.GaussianBlur(1.2))

d = ImageDraw.Draw(img)
try:
    font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 64)
except OSError:
    font = ImageFont.load_default()
# Top-centre: the page crops the image to cover the viewport (losing the
# sides on narrow screens) and the menu button sits top-left.
label = 'DEMO IMAGE'
l, t_, r, b = d.textbbox((0, 0), label, font=font)
x0 = (W - (r - l)) // 2 - l
y0 = 70
d.rounded_rectangle([x0 + l - 32, y0 + t_ - 22, x0 + r + 32, y0 + b + 22], radius=20, fill=(0, 0, 0))
d.text((x0, y0), label, fill=(255, 255, 255), font=font)
img.save(f'{out_dir}/demo-image.png', optimize=True)

# ---------- audio ----------
SR = 44100
BPM = 64
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 8                       # 8 bars at 64 BPM = exactly 30s
N = int(round(BARS * BAR * SR))
t = np.arange(N) / SR
mix = np.zeros(N)
rng = np.random.default_rng(7)

def midi(n):
    return 440 * 2 ** ((n - 69) / 12)

def place(sig, start):
    i = int(start * SR)
    end = min(N, i + len(sig))
    mix[i:end] += sig[:end - i]

def keys(notes, dur, amp=0.07):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    env = (1 - np.exp(-tt / 0.01)) * np.exp(-tt / 0.9)
    s = np.zeros(n)
    for note in notes:
        f = midi(note)
        s += np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt) * np.exp(-tt / 0.3)
    return amp * env * s / len(notes) * 3

def kick():
    n = int(0.35 * SR); tt = np.arange(n) / SR
    f = 50 + 70 * np.exp(-tt / 0.04)
    return 0.55 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.12)

def snare():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    noise = np.convolve(rng.standard_normal(n), np.ones(6) / 6, mode='same')
    return 0.16 * noise * np.exp(-tt / 0.06)

def hat():
    n = int(0.05 * SR); tt = np.arange(n) / SR
    return 0.025 * np.diff(rng.standard_normal(n + 1)) * np.exp(-tt / 0.012)

chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]]  # Fmaj7 Em7 Dm7 Cmaj7
bass = [41, 40, 38, 36]
for bar in range(BARS):
    b0 = bar * BAR
    ch = chords[bar % 4]
    place(keys(ch, 1.9), b0)
    place(keys(ch, 1.9, amp=0.05), b0 + 2.5 * BEAT)
    place(keys([bass[bar % 4]], 1.8, amp=0.12), b0)
    for beat in range(4):
        tb = b0 + beat * BEAT
        if beat in (0, 2):
            place(kick(), tb)
        if beat == 2 and bar % 2 == 1:
            place(kick(), tb + 0.75 * BEAT)
        if beat in (1, 3):
            place(snare(), tb)
        for sub in (0, 0.5):
            place(hat(), tb + (sub + 0.08 * (sub > 0)) * BEAT)  # slight swing

# vinyl crackle + hiss
crackle = np.zeros(N)
idx = rng.choice(N, size=int(30 * 12), replace=False)
crackle[idx] = rng.uniform(-0.08, 0.08, size=len(idx))
mix += crackle + 0.003 * rng.standard_normal(N)

# soft tape-ish saturation and short edge fades for a cleaner loop point
mix = np.tanh(mix * 1.4) / np.tanh(1.4)
fade = int(0.01 * SR)
mix[:fade] *= np.linspace(0, 1, fade)
mix[-fade:] *= np.linspace(1, 0, fade)
pcm = (np.clip(mix, -1, 1) * 32767 * 0.9).astype('<i2')

enc = lameenc.Encoder()
enc.set_bit_rate(96)
enc.set_in_sample_rate(SR)
enc.set_channels(1)
enc.set_quality(2)
mp3 = enc.encode(pcm.tobytes()) + enc.flush()
with open(f'{out_dir}/demo-audio.mp3', 'wb') as f:
    f.write(mp3)

print(f'image {W}x{H}, audio {N / SR:.2f}s, mp3 {len(mp3) / 1024:.0f} KiB')
