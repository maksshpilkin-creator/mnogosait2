import os
import sys
import time
import json
import urllib.parse
from typing import List, Dict, Any, Optional

# Add tools/parser-2gis to path to reuse ChromeOptions, ChromeBrowser, ChromeRemote
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../tools/parser-2gis')))

from parser_2gis.chrome.options import ChromeOptions
from parser_2gis.chrome.remote import ChromeRemote


class DGisClient:
    def __init__(self, headless: bool = True):
        self.options = ChromeOptions(headless=headless, disable_images=True)
        self.remote = ChromeRemote(self.options, [])
        self.remote.start()
        self._warmup()

    def _warmup(self):
        """Warm up browser session with initial page to establish cookies/session."""
        self.remote.navigate('https://2gis.ru/novosibirsk')
        time.sleep(3)

    def search_query(self, city_alias: str, query: str, max_pages: int = 3) -> List[str]:
        """Search query in city, return list of firm IDs across pages."""
        encoded_query = urllib.parse.quote(query)
        first_page_url = f'https://2gis.ru/{city_alias}/search/{encoded_query}'
        
        self.remote.navigate(first_page_url)
        time.sleep(2.5)

        # Extract search info and page 1 items
        search_info = self.remote.execute_script('''
            (() => {
                const s = window.initialState?.data?.search;
                if (!s) return null;
                const profKey = Object.keys(s.profile || {})[0];
                const data = profKey ? s.profile[profKey]?.data : null;
                const pagKey = Object.keys(s.pagination || {})[0];
                const p1 = pagKey ? s.pagination[pagKey]?.['1']?.data : [];
                return {
                    total: data?.total || 0,
                    pages: data?.pages || 1,
                    p1_ids: p1 || []
                };
            })()
        ''')

        if not search_info:
            return []

        all_ids = list(search_info.get('p1_ids', []))
        total_pages = min(search_info.get('pages', 1), max_pages)

        # Fetch subsequent pages via in-browser fetch
        for page_num in range(2, total_pages + 1):
            page_url = f'https://2gis.ru/{city_alias}/search/{encoded_query}/page/{page_num}'
            js_code = f'''
                (async () => {{
                    try {{
                        const resp = await fetch('{page_url}');
                        if (!resp.ok) return [];
                        const text = await resp.text();
                        const startPattern = 'var initialState = JSON.parse(';
                        const startIdx = text.indexOf(startPattern);
                        if (startIdx === -1) return [];
                        const endIdx = text.indexOf(');', startIdx);
                        const rawArg = text.substring(startIdx + startPattern.length, endIdx);
                        const state = JSON.parse(eval(rawArg));
                        const pag = state?.data?.search?.pagination;
                        if (!pag) return [];
                        const pagKey = Object.keys(pag)[0];
                        return pag[pagKey]?.['{page_num}']?.data || [];
                    }} catch (e) {{
                        return [];
                    }}
                }})()
            '''
            eval_res = self.remote._chrome_tab.Runtime.evaluate(
                expression=js_code, returnByValue=True, awaitPromise=True
            )
            page_ids = eval_res.get('result', {}).get('value', [])
            if page_ids:
                all_ids.extend(page_ids)
            time.sleep(0.3)

        # Deduplicate while preserving order
        seen = set()
        unique_ids = []
        for fid in all_ids:
            if fid not in seen:
                seen.add(fid)
                unique_ids.append(fid)

        return unique_ids

    def fetch_firm_details(self, city_alias: str, firm_id: str) -> Optional[Dict[str, Any]]:
        """Fetch full details for a firm card."""
        firm_url = f'https://2gis.ru/{city_alias}/firm/{firm_id}'
        js_code = f'''
            (async () => {{
                try {{
                    const resp = await fetch('{firm_url}');
                    if (!resp.ok) return {{ error: 'status_' + resp.status }};
                    const text = await resp.text();
                    const startPattern = 'var initialState = JSON.parse(';
                    const startIdx = text.indexOf(startPattern);
                    if (startIdx === -1) return {{ error: 'no_initial_state' }};
                    const endIdx = text.indexOf(');', startIdx);
                    const rawArg = text.substring(startIdx + startPattern.length, endIdx);
                    const state = JSON.parse(eval(rawArg));
                    const profiles = state?.data?.entity?.profile;
                    if (!profiles) return {{ error: 'no_profiles' }};
                    const prof = Object.values(profiles)[0];
                    if (!prof || !prof.data) return {{ error: 'no_profile_data' }};
                    
                    const d = prof.data;
                    return {{
                        id: d.id,
                        name: d.name,
                        name_ex: d.name_ex,
                        address_name: d.address_name,
                        address_comment: d.address_comment,
                        adm_div: d.adm_div,
                        city_alias: d.city_alias || '{city_alias}',
                        contact_groups: d.contact_groups || [],
                        rubrics: (d.rubrics || []).map(r => r.name || r.short_name || r.caption),
                        reviews: d.reviews,
                        point: d.point,
                        schedule: d.schedule,
                        canonical_url: 'https://2gis.ru/' + (d.city_alias || '{city_alias}') + '/firm/' + d.id.split('_')[0]
                    }};
                }} catch (e) {{
                    return {{ error: e.toString() }};
                }}
            }})()
        '''
        eval_res = self.remote._chrome_tab.Runtime.evaluate(
            expression=js_code, returnByValue=True, awaitPromise=True
        )
        res = eval_res.get('result', {}).get('value')
        if not res or 'error' in res:
            return None
        return res

    def close(self):
        try:
            self.remote._chrome_browser.close()
        except Exception:
            pass
