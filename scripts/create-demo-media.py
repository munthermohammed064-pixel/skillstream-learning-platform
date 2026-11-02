"""Generate an original, silent code walkthrough for the local graduation demo."""
from pathlib import Path
import shutil
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'data' / 'demo-media'
OUT.mkdir(parents=True, exist_ok=True)
font_dir = Path('C:/Windows/Fonts')
regular = str(font_dir / 'segoeui.ttf')
bold = str(font_dir / 'segoeuib.ttf')
mono = str(font_dir / 'consola.ttf')
slides = [
    ('Functions, one step at a time.', 'A small JavaScript walkthrough', 'INPUT  →  FUNCTION  →  RESULT', 'A function gives a name to a reusable operation.'),
    ('Give the operation a name.', '01 / Define', 'function double(value) {\n  return value * 2;\n}', 'value is a parameter: a name for the input.'),
    ('Call it with a real value.', '02 / Call', 'const result = double(7);\n\nconsole.log(result); // 14', '7 is the argument. The returned result is 14.'),
    ('Return a value. Do not just print it.', '03 / Return', 'function add(a, b) {\n  return a + b;\n}\n\nconst total = add(3, 4);', 'A returned value can be used by the rest of the program.'),
    ('Work with a list.', '04 / Transform', 'const prices = [10, 20, 30];\nconst doubled = prices.map(double);\n\n// [20, 40, 60]', 'map calls double once for each item and builds a new list.'),
    ('Check the result.', '05 / Verify', 'console.assert(double(0) === 0);\nconsole.assert(double(-3) === -6);\nconsole.assert(double(2.5) === 5);', 'Include zero, negative numbers, and decimals in your checks.'),
    ('Your turn.', 'Practice / Build', 'function sumPrices(prices) {\n  // Return the sum of the numbers.\n}', 'Write the function, then explain how it handles an empty list.'),
]

for number, (title, kicker, code, note) in enumerate(slides):
    image = Image.new('RGB', (1280, 720), '#fafaf9')
    draw = ImageDraw.Draw(image)
    draw.text((76, 46), 'SkillStream', font=ImageFont.truetype(bold, 22), fill='#242426')
    draw.text((76, 150), kicker, font=ImageFont.truetype(regular, 18), fill='#77777b')
    draw.text((76, 192), title, font=ImageFont.truetype(bold, 39), fill='#242426')
    draw.rounded_rectangle((76, 276, 1204, 568), radius=18, fill='#efefec')
    draw.multiline_text((110, 310), code, font=ImageFont.truetype(mono, 28), fill='#313b46', spacing=14)
    draw.text((76, 615), note, font=ImageFont.truetype(regular, 21), fill='#77777b')
    draw.text((1160, 660), f'{number+1:02d}', font=ImageFont.truetype(regular, 15), fill='#99999b')
    image.save(OUT / f'slide-{number:02d}.png')

ffmpeg = shutil.which('ffmpeg')
if not ffmpeg:
    raise SystemExit('FFmpeg is required to build the demo video.')
video = OUT / 'javascript-functions.webm'
subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-y', '-framerate', '1/8', '-i', str(OUT / 'slide-%02d.png'), '-vf', 'fps=24', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '36', '-pix_fmt', 'yuv420p', str(video)], check=True)
subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-i', str(video), '-f', 'null', '-'], check=True)
print(f'Demo video created and decoded successfully: {video}')
