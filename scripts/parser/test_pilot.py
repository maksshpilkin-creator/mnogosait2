import os
import sys
import json
import time

from dgis_client import DGisClient

QUERIES = [
    'Мотосалоны',
    'Мототехника',
    'Квадроциклы',
    'Снегоходы',
    'Питбайки'
]

def main():
    print("=== ЗАПУСК ПИЛОТНОГО СБОРА 2ГИС (Новосибирск) ===")
    client = DGisClient(headless=True)
    
    city = 'novosibirsk'
    all_firm_ids = set()
    
    try:
        for q in QUERIES:
            print(f"Поиск по рубрике: '{q}'...")
            fids = client.search_query(city, q, max_pages=2)
            print(f"  Найдено ID: {len(fids)}")
            all_firm_ids.update(fids)
            time.sleep(1)
            
        print(f"\nВсего уникальных фирм найдено по всем рубрикам: {len(all_firm_ids)}")
        
        # Test extraction on 5 firms
        test_ids = list(all_firm_ids)[:5]
        print(f"\nТестируем извлечение детальных карточек для первых {len(test_ids)} фирм:")
        
        parsed_records = []
        for i, fid in enumerate(test_ids, 1):
            print(f"\n[{i}/{len(test_ids)}] Загрузка ID {fid}...")
            details = client.fetch_firm_details(city, fid)
            if not details:
                print("  ОШИБКА: не удалось получить данные")
                continue
                
            name = details.get('name')
            address = details.get('address_name')
            canonical_url = details.get('canonical_url')
            
            # Extract contacts
            phones = []
            websites = []
            telegrams = []
            vk_links = []
            
            for cg in details.get('contact_groups', []):
                for c in cg.get('contacts', []):
                    ctype = c.get('type')
                    cval = c.get('value', '')
                    ctext = c.get('text', '')
                    curl = c.get('url', '')
                    
                    if ctype == 'phone':
                        phones.append(ctext or cval)
                    elif ctype == 'website':
                        # Can be website or telegram/social link
                        if 't.me' in curl or 't.me' in cval:
                            telegrams.append({'url': curl or cval, 'text': ctext})
                        elif 'vk.com' in curl or 'vk.ru' in curl:
                            vk_links.append(curl or cval)
                        else:
                            websites.append(curl or cval)
                    elif ctype == 'telegram':
                        telegrams.append({'url': curl or cval, 'text': ctext})
                    elif ctype == 'vkontakte':
                        vk_links.append(curl or cval)
            
            print(f"  Название: {name}")
            print(f"  Адрес: {address}")
            print(f"  2ГИС URL: {canonical_url}")
            print(f"  Телефоны: {phones}")
            print(f"  Сайты: {websites or None}")
            print(f"  Telegram: {telegrams or 'Не указан'}")
            print(f"  VK: {vk_links or 'Не указан'}")
            
            parsed_records.append(details)
            time.sleep(0.3)
            
        print(f"\nУспешно обработано: {len(parsed_records)} карточек без сбоев.")
        print("Пилотный прогон завершён успешно!")
        
    finally:
        client.close()

if __name__ == '__main__':
    main()
