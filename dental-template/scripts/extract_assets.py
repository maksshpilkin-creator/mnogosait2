# -*- coding: utf-8 -*-
"""
Asset Extraction Pipeline for Dental Clinic «ЭМАЛЬ»
Extracts high-resolution crops from the 16 reference screenshots into dental-template/assets/images/.
"""
import os
import sys
from PIL import Image, ImageEnhance

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOTS_DIR = os.path.join(os.path.dirname(BASE_DIR), "скрины для сайта")
OUTPUT_DIR = os.path.join(BASE_DIR, "assets", "images")

def run_extraction():
    print(f"Reading screenshots from: {SCREENSHOTS_DIR}")
    print(f"Writing assets to: {OUTPUT_DIR}")

    os.makedirs(os.path.join(OUTPUT_DIR, "hero"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "about"), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, "services"), exist_ok=True)

    # 1. Hero 3D implant
    p_hero = os.path.join(SCREENSHOTS_DIR, "начало.png")
    if os.path.exists(p_hero):
        with Image.open(p_hero) as im:
            crop_hero = im.crop((480, 150, 1060, 760))
            crop_hero.save(os.path.join(OUTPUT_DIR, "hero", "implant-3d.png"), "PNG")
            crop_hero.save(os.path.join(OUTPUT_DIR, "hero", "implant-3d.webp"), "WEBP", quality=90)
            print("Extracted hero/implant-3d")

    # 2. About teeth model with braces
    p_braces = os.path.join(SCREENSHOTS_DIR, "Снимок экрана 2026-11-21 173239.png")
    if os.path.exists(p_braces):
        with Image.open(p_braces) as im:
            crop_braces = im.crop((920, 130, 1460, 720))
            crop_braces.save(os.path.join(OUTPUT_DIR, "about", "braces-model.png"), "PNG")
            crop_braces.save(os.path.join(OUTPUT_DIR, "about", "braces-model.webp"), "WEBP", quality=90)
            print("Extracted about/braces-model")

    # 3. About probe tool on satin
    p_probe = os.path.join(SCREENSHOTS_DIR, "Снимок экрана 2026-11-21 173247.png")
    if os.path.exists(p_probe):
        with Image.open(p_probe) as im:
            crop_probe = im.crop((100, 150, 640, 740))
            crop_probe.save(os.path.join(OUTPUT_DIR, "about", "probe-satin.png"), "PNG")
            crop_probe.save(os.path.join(OUTPUT_DIR, "about", "probe-satin.webp"), "WEBP", quality=90)
            print("Extracted about/probe-satin")

    # 4. Service 01 Therapy
    p_srv = os.path.join(SCREENSHOTS_DIR, "Снимок экрана 2026-11-21 173307.png")
    if os.path.exists(p_srv):
        with Image.open(p_srv) as im:
            crop_srv = im.crop((940, 195, 1460, 520))
            crop_srv.save(os.path.join(OUTPUT_DIR, "services", "therapy.png"), "PNG")
            crop_srv.save(os.path.join(OUTPUT_DIR, "services", "therapy.webp"), "WEBP", quality=90)
            print("Extracted services/therapy")

    # 5. Service 02 Hygiene
    p_about_probe = os.path.join(OUTPUT_DIR, "about", "probe-satin.png")
    if os.path.exists(p_about_probe):
        with Image.open(p_about_probe) as im:
            hyg = im.resize((520, 325))
            hyg.save(os.path.join(OUTPUT_DIR, "services", "hygiene.png"), "PNG")
            hyg.save(os.path.join(OUTPUT_DIR, "services", "hygiene.webp"), "WEBP", quality=90)
            print("Generated services/hygiene")

    # 6. Service 03 Whitening
    p_about_braces = os.path.join(OUTPUT_DIR, "about", "braces-model.png")
    if os.path.exists(p_about_braces):
        with Image.open(p_about_braces) as im:
            enhancer = ImageEnhance.Brightness(im)
            whiten = enhancer.enhance(1.15).resize((520, 325))
            whiten.save(os.path.join(OUTPUT_DIR, "services", "whitening.png"), "PNG")
            whiten.save(os.path.join(OUTPUT_DIR, "services", "whitening.webp"), "WEBP", quality=90)
            print("Generated services/whitening")

    # 7. Service 04 Orthodontics
    if os.path.exists(p_about_braces):
        with Image.open(p_about_braces) as im:
            ortho = im.resize((520, 325))
            ortho.save(os.path.join(OUTPUT_DIR, "services", "orthodontics.png"), "PNG")
            ortho.save(os.path.join(OUTPUT_DIR, "services", "orthodontics.webp"), "WEBP", quality=90)
            print("Generated services/orthodontics")

    # 8. Service 05 Surgery
    p_hero_implant = os.path.join(OUTPUT_DIR, "hero", "implant-3d.png")
    if os.path.exists(p_hero_implant):
        with Image.open(p_hero_implant) as im:
            surg = im.resize((520, 325))
            surg.save(os.path.join(OUTPUT_DIR, "services", "surgery.png"), "PNG")
            surg.save(os.path.join(OUTPUT_DIR, "services", "surgery.webp"), "WEBP", quality=90)
            print("Generated services/surgery")

    # 9. Service 06 Prosthetics
    p_therapy = os.path.join(OUTPUT_DIR, "services", "therapy.png")
    if os.path.exists(p_therapy):
        with Image.open(p_therapy) as im:
            enhancer2 = ImageEnhance.Contrast(im)
            prost = enhancer2.enhance(1.1).resize((520, 325))
            prost.save(os.path.join(OUTPUT_DIR, "services", "prosthetics.png"), "PNG")
            prost.save(os.path.join(OUTPUT_DIR, "services", "prosthetics.webp"), "WEBP", quality=90)
            print("Generated services/prosthetics")

    # 10. Modal header
    p_modal = os.path.join(SCREENSHOTS_DIR, "Снимок экрана 2026-11-21 173316.png")
    if os.path.exists(p_modal):
        with Image.open(p_modal) as im:
            crop_modal = im.crop((1040, 70, 1540, 360))
            crop_modal.save(os.path.join(OUTPUT_DIR, "services", "modal-header.png"), "PNG")
            crop_modal.save(os.path.join(OUTPUT_DIR, "services", "modal-header.webp"), "WEBP", quality=90)
            print("Extracted services/modal-header")

    print("Asset extraction completed successfully.")

if __name__ == "__main__":
    run_extraction()
