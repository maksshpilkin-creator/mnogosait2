import os
import sys
import json
import time
import urllib.parse
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../tools/parser-2gis')))
from dgis_client import DGisClient

CITIES = [
    ('Москва', 'moscow'),
    ('Санкт-Петербург', 'spb'),
    ('Новосибирск', 'novosibirsk'),
    ('Екатеринбург', 'ekaterinburg'),
    ('Казань', 'kazan'),
    ('Краснодар', 'krasnodar'),
    ('Самара', 'samara'),
    ('Нижний Новгород', 'n_novgorod'),
    ('Уфа', 'ufa'),
    ('Ростов-на-Дону', 'rostov'),
    ('Воронеж', 'voronezh'),
    ('Пермь', 'perm'),
    ('Красноярск', 'krasnoyarsk'),
    ('Тюмень', 'tyumen'),
    ('Челябинск', 'chelyabinsk')
]

QUERIES = [
    'Мотосалоны',
    'Мототехника',
    'Квадроциклы',
    'Снегоходы',
    'Питбайки'
]

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/parsed_2gis'))
RAW_OUTPUT_FILE = os.path.join(OUTPUT_DIR, 'raw_all_cities.json')

def save_raw(data: List[Dict[str, Any]]):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    temp_file = RAW_OUTPUT_FILE + '.tmp'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    if os.path.exists(RAW_OUTPUT_FILE):
        try:
            os.remove(RAW_OUTPUT_FILE)
        except OSError:
            pass
    os.replace(temp_file, RAW_OUTPUT_FILE)

def main():
    print("=== МАСШТАБНЫЙ СБОР БАЗЫ МОТОСАЛОНОВ 2ГИС ПО 15 ГОРОДАМ РОССИИ ===")
    print(f"Города ({len(CITIES)}): {', '.join([c[0] for c in CITIES])}")
    print(f"Рубрики ({len(QUERIES)}): {', '.join(QUERIES)}")
    print(f"Файл выгрузки: {RAW_OUTPUT_FILE}\n")

    client = DGisClient(headless=True)
    all_results: List[Dict[str, Any]] = []
    global_seen_firm_ids = set()

    # Load existing if available to support resume
    if os.path.exists(RAW_OUTPUT_FILE):
        try:
            with open(RAW_OUTPUT_FILE, 'r', encoding='utf-8') as f:
                existing = json.load(f)
                if isinstance(existing, list):
                    all_results = existing
                    for item in all_results:
                        fid = item.get('id', '').split('_')[0]
                        if fid:
                            global_seen_firm_ids.add(fid)
                    print(f"Загружено ранее собранных записей: {len(all_results)}")
        except Exception as e:
            print(f"Не удалось прочитать существующий файл: {e}")

    start_time = time.time()

    try:
        for city_idx, (city_name, city_alias) in enumerate(CITIES, 1):
            print(f"\n==========================================")
            print(f"[{city_idx}/{len(CITIES)}] ГОРОД: {city_name} ({city_alias})")
            print(f"==========================================")

            city_firm_ids = set()

            for q in QUERIES:
                print(f"  Рубрика: '{q}'...", end=' ', flush=True)
                try:
                    ids = client.search_query(city_alias, q, max_pages=3)
                    print(f"найдено ID: {len(ids)}")
                    city_firm_ids.update(ids)
                except Exception as e:
                    print(f"ОШИБКА: {e}")
                time.sleep(0.5)

            new_city_ids = [fid for fid in city_firm_ids if fid.split('_')[0] not in global_seen_firm_ids]
            print(f"\n  Всего уникальных фирм в {city_name}: {len(city_firm_ids)} (новых для сбора: {len(new_city_ids)})")

            # Fetch details for new firms
            for i, fid in enumerate(new_city_ids, 1):
                clean_fid = fid.split('_')[0]
                if i % 10 == 0 or i == len(new_city_ids):
                    print(f"    Прогресс {city_name}: {i}/{len(new_city_ids)}...", flush=True)

                try:
                    details = client.fetch_firm_details(city_alias, clean_fid)
                    if details:
                        details['searched_city'] = city_name
                        details['searched_city_alias'] = city_alias
                        all_results.append(details)
                        global_seen_firm_ids.add(clean_fid)
                except Exception as e:
                    print(f"    Ошибка при загрузке {clean_fid}: {e}")

                time.sleep(0.3)

            # Save progress after each city
            save_raw(all_results)
            print(f"  Сохранено записей в базе на текущий момент: {len(all_results)}")
            time.sleep(1.0)

        elapsed = time.time() - start_time
        print(f"\n==========================================")
        print(f"СБОР ЗАВЕРШЕН УСПЕШНО ЗА {elapsed:.1f} сек.")
        print(f"Всего собрано организаций: {len(all_results)}")
        print(f"Итоговый файл: {RAW_OUTPUT_FILE}")
        print(f"==========================================")

    finally:
        client.close()

if __name__ == '__main__':
    main()
