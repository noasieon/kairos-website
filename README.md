# KAIROS 홈페이지

빌드 도구 없는 정적 웹사이트입니다. GitHub Pages에 그대로 올려 게시합니다.

## 구성
- `index.html` — 메인 (소개 · 카이로스 TV · 핵심 가치 · 사역 지역 · 함께하는 방법 · 소식 · 문의)
- `prayer.html` — 왕의 대로 기도 정보 (튀르키예 · 시리아 · 요르단 · 이스라엘)
- `levites.html` — 카이로스 레바이츠 훈련 안내
- `news.html` — 소식 전체 목록 (분류 필터 · 검색)
- `news-post.html?id=…` — 소식 글 한 편 (content/news.json의 본문을 그림, 사진은 assets/img/news/)
- `admin/` — 관리자 페이지 (Sveltia CMS)
- `content/` — 관리자 페이지에서 고치는 내용 파일
  - `news.json` 소식 · `levites.json` 레바이츠 모집 정보 · `prayer.json` 나라별 기도 정보 · `home.json` 메인 문구·숫자
- `assets/` — `style.css`, `site.js`(화면 효과), `content.js`(content/*.json을 페이지에 채움), `img/`

페이지 HTML 안의 글은 JSON을 읽지 못했을 때 보이는 기본값입니다. 실제 표시 내용은 `content/*.json`이 기준입니다.

## 내용 고치기
홈페이지 주소 뒤에 `/admin/`을 붙여 관리자 페이지에 들어갑니다. GitHub 계정(저장소 쓰기 권한 필요)으로 로그인한 뒤 고치고 **저장**하면, 1~2분 뒤 홈페이지에 반영됩니다.

카이로스 TV 영상은 유튜브 채널의 최신 영상이 자동으로 나오므로 따로 고칠 필요가 없습니다.

## 로컬에서 보기
```bash
python3 -m http.server 4321 --directory ~/kairos-website
```
그다음 http://localhost:4321 을 엽니다. (파일을 직접 열면 content/*.json을 읽지 못해 기본값만 보입니다.)
