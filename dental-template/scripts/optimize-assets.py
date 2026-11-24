"""Encode delivery copies only; keep the generated PNG sources untouched."""
from pathlib import Path
from PIL import Image
import json

root = Path(__file__).resolve().parents[1]
source = root / 'public/assets/images/generated'
target = root / 'public/assets/images/optimized'
target.mkdir(parents=True, exist_ok=True)
settings = {
    'mirror-satin': ((1200, 900), 88),
    'braces-satin': ((1200, 900), 88),
    'service-implant-satin-v1': ((1200, 900), 88),
    'hero-gradient-layer-v1': ((1600, 800), 94),
    'hero-implant-layer-v1': ((520, 1040), 90),
}
results = []
for name, (size, quality) in settings.items():
    original = source / f'{name}.png'
    output = target / f'{name}.webp'
    with Image.open(original) as image:
        image.thumbnail(size, Image.Resampling.LANCZOS)
        image.save(output, 'WEBP', quality=quality, method=6, exact=True)
        results.append({'name': name, 'original_bytes': original.stat().st_size,
                        'delivery_bytes': output.stat().st_size,
                        'size': image.size, 'alpha': image.mode == 'RGBA'})
print(json.dumps(results, indent=2))
