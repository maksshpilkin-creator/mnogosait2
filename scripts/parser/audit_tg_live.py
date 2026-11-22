import json
import requests
import re
import time

QUALIFIED_JSON = 'data/parsed_2gis/qualified_two_gis_leads.json'

with open(QUALIFIED_JSON, 'r', encoding='utf-8') as f:
    leads = json.load(f)

print(f"Всего лидов для проверки: {len(leads)}")

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

channels = []
bots = []
groups = []
direct_users = []
not_found_or_error = []

# Deduplicate usernames to avoid redundant requests
unique_tg = {}
for lead in leads:
    tg_url = lead['lead_search_checks']['telegram']['url']
    u = tg_url.split('/')[-1].lower()
    if u not in unique_tg:
        unique_tg[u] = []
    unique_tg[u].append(lead)

print(f"Уникальных Telegram username: {len(unique_tg)}")

for i, (u, lead_list) in enumerate(unique_tg.items(), 1):
    url = f"https://t.me/{u}"
    try:
        r = requests.get(url, headers=headers, timeout=5)
        html = r.text
        
        is_subscribers = bool(re.search(r'subscribers|подписчик', html, re.I))
        is_members = bool(re.search(r'members|участник', html, re.I))
        is_bot = bool(re.search(r'start bot|launch @|botfather', html, re.I)) or u.endswith('bot')
        is_user = bool(re.search(r'tgme_icon_user|you can contact|contact @', html, re.I))
        
        if is_subscribers:
            channels.append((u, len(lead_list), [l['facts']['name'] for l in lead_list]))
        elif is_members:
            groups.append((u, len(lead_list), [l['facts']['name'] for l in lead_list]))
        elif is_bot:
            bots.append((u, len(lead_list), [l['facts']['name'] for l in lead_list]))
        elif is_user:
            direct_users.append((u, len(lead_list), [l['facts']['name'] for l in lead_list]))
        else:
            not_found_or_error.append((u, 'unclear HTML', len(lead_list)))
    except Exception as e:
        not_found_or_error.append((u, str(e), len(lead_list)))
    
    if i % 20 == 0 or i == len(unique_tg):
        print(f"  Проверено {i}/{len(unique_tg)}...")
    time.sleep(0.1)

print("\n=== ИТОГИ АУДИТА ТЕЛЕГРАМ-ССЫЛОК ===")
print(f"Прямые личные аккаунты / чаты пользователей (direct user): {len(direct_users)} usernames (охватывают {sum(x[1] for x in direct_users)} лидов)")
print(f"Каналы с подписчиками (channels): {len(channels)} usernames (охватывают {sum(x[1] for x in channels)} лидов)")
print(f"Группы / чаты участников (groups): {len(groups)} usernames (охватывают {sum(x[1] for x in groups)} лидов)")
print(f"Боты: {len(bots)} usernames (охватывают {sum(x[1] for x in bots)} лидов)")
print(f"Ошибки/недоступно: {len(not_found_or_error)} usernames")

print("\n--- Список подтвержденных прямых пользователей (direct user) ---")
for u, count, names in direct_users:
    print(f"  @{u} ({count} лид.): {names[0]}")

print("\n--- Список обнаруженных каналов (подлежащих строгому отсечению!) ---")
for u, count, names in channels[:10]:
    print(f"  @{u} ({count} лид.): {names[0]}")
