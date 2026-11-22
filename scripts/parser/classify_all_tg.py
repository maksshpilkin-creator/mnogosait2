import os
import re
import json
import time
import requests
from concurrent.futures import ThreadPoolExecutor

RAW_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/parsed_2gis/raw_all_cities.json'))
CACHE_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../data/parsed_2gis/tg_classification_cache.json'))

with open(RAW_FILE, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

# Extract all unique Telegram usernames
all_usernames = set()
for item in raw_data:
    for cg in (item.get('contact_groups') or []):
        for c in (cg.get('contacts') or []):
            val = c.get('url') or c.get('value') or ''
            if 't.me/' in val:
                m = re.search(r't\.me/([A-Za-z0-9_]{4,32})', val)
                if m:
                    u = m.group(1).lower()
                    if not u.startswith('+') and not u.startswith('joinchat'):
                        all_usernames.add(u)

print(f"Всего уникальных Telegram-аккаунтов в сырой базе: {len(all_usernames)}")

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

cache = {}
if os.path.exists(CACHE_FILE):
    try:
        with open(CACHE_FILE, 'r', encoding='utf-8') as f:
            cache = json.load(f)
    except Exception:
        cache = {}

to_check = [u for u in all_usernames if u not in cache]
print(f"Требуется проверить в сети: {len(to_check)}")

def check_username(u):
    url = f"https://t.me/{u}"
    try:
        r = requests.get(url, headers=headers, timeout=8)
        html = r.text
        
        is_subscribers = bool(re.search(r'subscribers|подписчик', html, re.I))
        is_members = bool(re.search(r'members|участник', html, re.I))
        is_bot = bool(re.search(r'start bot|launch @|botfather', html, re.I)) or u.endswith('bot')
        is_user = bool(re.search(r'tgme_icon_user|you can contact|contact @', html, re.I))
        
        if is_subscribers:
            return u, 'channel'
        elif is_members:
            return u, 'group'
        elif is_bot:
            return u, 'bot'
        elif is_user:
            return u, 'direct_user'
        else:
            return u, 'unknown'
    except Exception:
        return u, 'error'

with ThreadPoolExecutor(max_workers=8) as executor:
    results = list(executor.map(check_username, to_check))

for u, res_type in results:
    cache[u] = res_type

with open(CACHE_FILE, 'w', encoding='utf-8') as f:
    json.dump(cache, f, ensure_ascii=False, indent=2)

counts = {}
for t in cache.values():
    counts[t] = counts.get(t, 0) + 1

print("\n=== РЕЗУЛЬТАТЫ КЛАССИФИКАЦИИ ТЕЛЕГРАМ ===")
for t, cnt in counts.items():
    print(f"  {t}: {cnt}")
print(f"Кэш сохранён в {CACHE_FILE}")
