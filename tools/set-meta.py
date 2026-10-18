"""페이지마다 링크 미리보기(카카오톡·페이스북) 정보를 넣습니다.

도메인을 바꿀 때: BASE만 고친 뒤  python3 tools/set-meta.py  를 실행하세요.
"""
import os
import re

BASE = 'https://noasieon.github.io/kairos-website/'
SITE = "KAIROS · King's Highway Mission"

PAGES = {
    'index.html': (SITE, 'Kairos 팀은 왕의 대로 지역 1억 2천만 영혼에게 복음을 전하고, 114개 주요 도시마다 그리스도께 헌신된 제자 공동체를 세우는 초교파 선교 공동체입니다.', 'og-home.jpg', ''),
    'prayer.html': ('왕의 대로 기도 정보 · KAIROS', '왕의 대로 4개국을 위한 나라별 기도 정보와 기도 제목. 기도 동역자로 함께해 주세요.', 'og-prayer.jpg', 'prayer.html'),
    'levites.html': ('카이로스 레바이츠 · KAIROS', '레위 지파의 정체성으로 부흥의 불을 가져오는 왕 같은 제사장을 세우는 3개월 제자 훈련.', 'og-levites.jpg', 'levites.html'),
    'news.html': ('카이로스 소식 · KAIROS', '카이로스의 성경 강해, 절기 말씀, 레바이츠 훈련, 기도 소식.', 'og-home.jpg', 'news.html'),
    'news-post.html': ('카이로스 소식 · KAIROS', '카이로스의 성경 강해, 절기 말씀, 레바이츠 훈련, 기도 소식.', 'og-home.jpg', 'news.html'),
    'give.html': ('후원 안내 · KAIROS', '왕의 대로 지역의 복음 사역과 제자 훈련에 기도와 후원으로 함께해 주세요.', 'og-home.jpg', 'give.html'),
}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
START, END = '  <!-- meta:start -->\n', '  <!-- meta:end -->\n'


def block(title, desc, img, path):
    e = lambda s: s.replace('&', '&amp;').replace('"', '&quot;')
    return (START +
            f'  <meta name="description" content="{e(desc)}">\n'
            f'  <link rel="canonical" href="{BASE}{path}">\n'
            f'  <meta property="og:type" content="website">\n'
            f'  <meta property="og:site_name" content="{e(SITE)}">\n'
            f'  <meta property="og:locale" content="ko_KR">\n'
            f'  <meta property="og:title" content="{e(title)}">\n'
            f'  <meta property="og:description" content="{e(desc)}">\n'
            f'  <meta property="og:url" content="{BASE}{path}">\n'
            f'  <meta property="og:image" content="{BASE}assets/img/og/{img}">\n'
            f'  <meta property="og:image:width" content="1200">\n'
            f'  <meta property="og:image:height" content="630">\n'
            f'  <meta name="twitter:card" content="summary_large_image">\n' +
            END)


for name, (title, desc, img, path) in PAGES.items():
    p = os.path.join(ROOT, name)
    if not os.path.exists(p):
        continue
    s = open(p, encoding='utf8').read()
    if START in s:
        s = re.sub(re.escape(START) + r'.*?' + re.escape(END), lambda m: block(title, desc, img, path), s, flags=re.S)
    else:
        # 기존 description / og:* 줄을 걷어내고 새 묶음을 넣음
        s = re.sub(r'  <meta name="description"[^>]*>\n', '', s)
        s = re.sub(r'  <meta property="og:[^>]*>\n', '', s)
        s = s.replace('  <link rel="icon"', block(title, desc, img, path) + '  <link rel="icon"', 1)
    open(p, 'w', encoding='utf8').write(s)
    print('ok', name)
