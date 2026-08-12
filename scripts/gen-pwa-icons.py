# Генерация PWA-иконок из логотипа.
# Логотип — тёмный скруглённый квадрат с белыми углами файла; для иконок
# перекрашиваем углы в цвет фона логотипа, получая полнокадровый квадрат:
# он годится и как any, и как maskable (лис в центре ~50% — в безопасной зоне).
# Запуск: py scripts/gen-pwa-icons.py
from PIL import Image, ImageDraw

SRC = "apps/web/src/assets/01_brand/logo_main.png"
OUT = "apps/web/public"

logo = Image.open(SRC).convert("RGBA")
w, h = logo.size

# Цвет фона берём изнутри тёмного скругления (верх по центру)
bg = logo.getpixel((w // 2, int(h * 0.04)))[:3]

# Маска скруглённого квадрата логотипа (радиус ~21% стороны)
radius = int(w * 0.21)
mask = Image.new("L", (w, h), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)

# Полнокадровое полотно: фон + логотип по маске (белые углы уходят)
canvas = Image.new("RGBA", (w, h), bg + (255,))
canvas.paste(logo, (0, 0), mask)

for size in (192, 512):
    icon = canvas.resize((size, size), Image.LANCZOS).convert("RGB")
    icon.save(f"{OUT}/icon-{size}.png", optimize=True)
    icon.save(f"{OUT}/icon-maskable-{size}.png", optimize=True)

print("done, bg =", bg)
