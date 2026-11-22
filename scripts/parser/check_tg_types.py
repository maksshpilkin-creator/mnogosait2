import requests
import re

usernames = ['xmotors_russia', 'durov', 'botfather', 'pavel', 'crewnskk', 'nbsmotornsk']
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

for u in usernames:
    try:
        r = requests.get(f'https://t.me/{u}', headers=headers, timeout=10)
        html = r.text
        extra_match = re.search(r'<div class="tgme_page_extra">([\s\S]*?)</div>', html)
        action_match = re.search(r'<div class="tgme_page_action">([\s\S]*?)</div>', html)
        
        extra = re.sub(r'\s+', ' ', extra_match.group(1)).strip() if extra_match else 'None'
        action = re.sub(r'\s+', ' ', action_match.group(1)).strip() if action_match else 'None'
        
        print(f"=== @{u} ===")
        print(f"  extra: {extra}")
        print(f"  action: {action}")
        
        # Classification
        if 'subscribers' in extra.lower() or 'подписчик' in extra.lower():
            kind = 'channel'
        elif 'members' in extra.lower() or 'участник' in extra.lower():
            kind = 'group'
        elif u.lower().endswith('bot') or 'bot' in extra.lower() or 'send message' in action.lower() and 'bot' in html.lower():
            kind = 'bot'
        elif 'you can contact' in action.lower() or 'напишите' in action.lower():
            kind = 'direct_chat'
        else:
            kind = 'unknown'
        print(f"  -> KIND: {kind}\n")
    except Exception as e:
        print(f"=== @{u} === ERROR: {e}\n")
