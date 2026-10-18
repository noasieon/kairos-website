// 관리자 페이지(/admin)에서 고치는 content/*.json을 읽어 각 페이지에 채워 넣습니다.
// 페이지 HTML에 들어 있는 내용은 JSON을 못 읽었을 때를 위한 기본값입니다.
window.KairosContent = (function () {
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  };
  // 아주 작은 마크다운: **굵게**, [링크](주소), "- " 목록, 빈 줄로 문단 구분
  var inline = function (s, strongTag) {
    var t = strongTag || 'strong';
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<' + t + '>$1</' + t + '>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  };
  var block = function (s) {
    return String(s || '').trim().split(/\n\s*\n/).map(function (chunk) {
      var lines = chunk.split('\n');
      if (lines.every(function (l) { return /^\s*-\s+/.test(l); })) {
        return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*-\s+/, '')) + '</li>'; }).join('') + '</ul>';
      }
      return '<p>' + inline(lines.join(' ')) + '</p>';
    }).join('');
  };
  var br = function (s) { return esc(s).replace(/\n/g, '<br>'); };
  // 소식 본문용 마크다운: ## 제목, 목록(- / 1.), > 인용·안내 상자, ![사진](주소), @[youtube](ID), ---
  var postInline = function (s) {
    var links = [];
    var t = String(s || '').replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, function (_, label, url) {
      links.push('<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + '</a>');
      return '\u0000' + (links.length - 1) + '\u0000';
    });
    t = esc(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])_([^_\n]+?)_(?=[\s).,!?]|$)/g, '$1<em>$2</em>');
    return t.replace(/\u0000(\d+)\u0000/g, function (_, i) { return links[+i]; });
  };
  var mdPost = function (text) {
    var lines = String(text || '').split('\n'), html = '', i = 0;
    var isImg = function (l) { return /^!\[[^\]]*\]\([^)]+\)\s*$/.test(l.trim()); };
    while (i < lines.length) {
      var l = lines[i];
      if (!l.trim()) { i++; continue; }
      if (/^---\s*$/.test(l)) { html += '<hr>'; i++; continue; }
      var h = l.match(/^(#{2,3})\s+(.*)$/);
      if (h) { html += '<h' + h[1].length + '>' + postInline(h[2]) + '</h' + h[1].length + '>'; i++; continue; }
      var yt = l.trim().match(/^@\[youtube\]\(([A-Za-z0-9_-]{6,})\)$/);
      if (yt) {
        html += '<div class="post-video"><iframe src="https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0" title="영상" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
        i++; continue;
      }
      if (isImg(l)) {
        var imgs = [];
        while (i < lines.length && (isImg(lines[i]) || (!lines[i].trim() && i + 1 < lines.length && isImg(lines[i + 1])))) {
          var m = lines[i].trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
          if (m) imgs.push(m);
          i++;
        }
        html += '<div class="post-gallery n' + Math.min(imgs.length, 3) + '">' + imgs.map(function (m) {
          return '<figure><img src="' + esc(src(m[2])) + '" alt="' + esc(m[1]) + '" loading="lazy">' + (m[1] ? '<figcaption>' + esc(m[1]) + '</figcaption>' : '') + '</figure>';
        }).join('') + '</div>';
        continue;
      }
      if (/^>/.test(l)) {
        var q = [];
        while (i < lines.length && /^>/.test(lines[i])) { q.push(lines[i].replace(/^>\s?/, '')); i++; }
        html += '<blockquote class="post-note">' + mdPost(q.join('\n')) + '</blockquote>';
        continue;
      }
      if (/^\s*(-|\d+\.)\s+/.test(l)) {
        var stack = [], out = '';
        while (i < lines.length && /^\s*(-|\d+\.)\s+/.test(lines[i])) {
          var mm = lines[i].match(/^(\s*)(-|\d+\.)\s+(.*)$/), lvl = Math.floor(mm[1].length / 2), tag = mm[2] === '-' ? 'ul' : 'ol';
          while (stack.length > lvl + 1) out += '</li></' + stack.pop() + '>';
          if (stack.length === lvl + 1 && stack[lvl] !== tag) { out += '</li></' + stack.pop() + '>'; }
          if (stack.length < lvl + 1) { out += '<' + tag + '><li>'; stack.push(tag); }
          else out += '</li><li>';
          out += postInline(mm[3]);
          i++;
        }
        while (stack.length) out += '</li></' + stack.pop() + '>';
        html += out;
        continue;
      }
      var para = [];
      while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|>|---\s*$|\s*(-|\d+\.)\s+|@\[youtube\])/.test(lines[i]) && !isImg(lines[i])) { para.push(postInline(lines[i])); i++; }
      if (para.length) html += '<p>' + para.join('<br>') + '</p>';
      else i++;
    }
    return html;
  };
  var src = function (p) { return String(p || '').replace(/^\//, ''); };
  var get = function (name) {
    return fetch('content/' + name + '.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(name);
      return r.json();
    });
  };
  var $ = function (sel) { return document.querySelector(sel); };
  var set = function (sel, html) { var el = $(sel); if (el != null && html != null) el.innerHTML = html; };

  // ---- 메인
  function home(c) {
    set('[data-c="hero_lead"]', esc(c.hero_lead));
    var stats = $('[data-c="stats"]');
    if (stats && c.stats && c.stats.length) {
      stats.innerHTML = c.stats.map(function (s) {
        var dec = +s.decimals || 0, v = (+s.value).toFixed(dec) + (s.suffix || '');
        return '<div><strong data-count="' + (+s.value) + '" data-dec="' + dec + '" data-suffix="' + esc(s.suffix || '') + '">' + esc(v) + '</strong>' + esc(s.label) + '</div>';
      }).join('');
    }
    set('[data-c="about_statement"]', inline(c.about_statement, 'em'));
    set('[data-c="tv_title"]', br(c.tv_title));
    set('[data-c="tv_desc"]', esc(c.tv_desc));
    var days = ['일', '월', '화', '수', '목', '금', '토'];
    var bible = c.tv_bible_days || [], theme = c.tv_theme_day, time = c.tv_time || '05:00';
    var week = $('[data-c="tv_week"]');
    if (week) {
      week.innerHTML = days.map(function (d) {
        var cls = d === theme ? ' class="theme"' : (bible.indexOf(d) > -1 ? ' class="on"' : '');
        var t = (d === theme || bible.indexOf(d) > -1) ? esc(time) : '—';
        return '<li' + cls + '><span class="d">' + d + '</span><span class="t">' + t + '</span></li>';
      }).join('');
    }
    var h = parseInt(time, 10), m = parseInt(time.split(':')[1] || '0', 10);
    var spoken = (h < 12 ? '오전 ' : '오후 ') + ((h % 12) || 12) + '시' + (m ? ' ' + m + '분' : '');
    var ordered = days.filter(function (d) { return bible.indexOf(d) > -1; });
    set('[data-c="tv_bible_text"]', esc(ordered.join(' · ') + ' ' + spoken));
    set('[data-c="tv_theme_text"]', theme ? esc((theme === '일' ? '주일' : theme + '요일') + ' ' + spoken) : '');
  }

  // ---- 이번 주 기도 제목 (메인·기도 정보)
  function weekly(c) {
    var w = c.weekly_prayer;
    if (!w) return;
    document.querySelectorAll('[data-c="weekly_week"]').forEach(function (el) { el.textContent = w.week || ''; });
    document.querySelectorAll('[data-c="weekly_text"]').forEach(function (el) { el.textContent = w.text || ''; });
    document.querySelectorAll('[data-c="weekly_verse"]').forEach(function (el) {
      el.innerHTML = w.verse ? '“' + esc(w.verse) + '”' + (w.verse_ref ? ' <cite>' + esc(w.verse_ref) + '</cite>' : '') : '';
    });
  }

  // ---- 레바이츠
  function levites(c) {
    set('[data-c="lv_title"]', br(c.title));
    var st = $('[data-c="lv_status"]');
    if (st) { st.className = 'lv-status is-' + (c.status || 'closed'); st.innerHTML = '<i></i>' + esc(c.status_label); }
    set('[data-c="lv_period"]', esc(c.period) + (c.period_note ? '<small>' + esc(c.period_note) + '</small>' : ''));
    set('[data-c="lv_place"]', esc(c.place));
    set('[data-c="lv_target"]', esc(c.target));
    set('[data-c="lv_capacity"]', esc(c.capacity));
    set('[data-c="lv_note"]', esc(c.note));
    var apply = $('[data-c="lv_apply"]');
    if (apply) {
      var open = c.status === 'open' && c.apply_url;
      apply.hidden = !open;
      if (open) apply.href = c.apply_url;
    }
    var link = $('[data-c="lv_apply_link"]');
    if (link && c.apply_url) link.href = c.apply_url;
  }

  // ---- 기도 정보
  function prayer(c) {
    var pl = $('[data-c="partner_link"]');
    if (pl && c.partner_url) { pl.href = c.partner_url; pl.textContent = '기도 동역자 신청하기'; }
    set('[data-c="prayer_intro"]', (c.intro || []).map(function (p, i) { return '<p' + (i ? ' class="sub-p2"' : '') + '>' + inline(p) + '</p>'; }).join(''));
    var list = c.countries || [];
    set('[data-c="prayer_tabs"]', list.map(function (k) {
      return '<a href="#' + esc(k.id) + '" data-tab="' + esc(k.id) + '"><b>' + esc(k.name) + '</b><span>' + esc(k.en) + '</span></a>';
    }).join(''));
    set('[data-c="prayer_countries"]', list.map(function (k) {
      var facts = (k.facts || []).map(function (f) { return '<span><b>' + esc(f.value) + '</b>' + esc(f.label) + '</span>'; }).join('');
      var cols = (k.sections || []).map(function (s, i) {
        return '<div class="pc-col"><span class="pc-label">0' + (i + 1) + '</span><h3>' + esc(s.title) + '</h3>' + block(s.body) + '</div>';
      }).join('');
      var pts = (k.prayers || []).map(function (p, i) { return '<li><span class="pp-no">0' + (i + 1) + '</span><span>' + esc(p) + '</span></li>'; }).join('');
      return '<section class="pc" id="' + esc(k.id) + '" data-country><div class="wrap">' +
        '<div class="pc-banner"><img src="' + esc(src(k.image)) + '" alt="' + esc(k.name) + ' 풍경" loading="lazy">' +
        '<div class="pc-banner-in">' + (k.tag ? '<span class="pc-tag' + (k.main ? ' main' : '') + '">' + esc(k.tag) + '</span>' : '') +
        '<h2><span class="pc-en">' + esc(k.en) + '</span><span class="pc-ko">' + esc(k.name) + '</span></h2>' +
        '<span class="pc-facts">' + facts + '</span></div></div>' +
        '<p class="pc-summary">' + esc(k.summary) + '</p>' +
        '<div class="pc-cols">' + cols + '</div>' +
        '<div class="pc-pray"><blockquote>' + esc(k.verse) + (k.verse_ref ? '<cite>' + esc(k.verse_ref) + '</cite>' : '') + '</blockquote>' +
        '<div><span class="pc-pray-label">Pray with us<em>함께 기도해 주세요</em></span><ol>' + pts + '</ol></div></div>' +
        '</div></section>';
    }).join(''));
  }

  // ---- 후원 안내
  function give(c) {
    var has = c.account_bank && c.account_number;
    var acc = $('[data-c="give_account"]');
    if (acc) acc.hidden = !has;
    if (has) {
      set('[data-c="give_bank"]', esc(c.account_bank));
      set('[data-c="give_number"]', esc(c.account_number));
      set('[data-c="give_holder"]', esc(c.account_holder || ''));
      var cp = $('[data-c="give_copy"]');
      if (cp) cp.addEventListener('click', function () {
        var done = function () { cp.textContent = '복사됨'; setTimeout(function () { cp.textContent = '복사'; }, 1600); };
        try { navigator.clipboard.writeText(c.account_number).then(done, function () {}); } catch (e) {}
      });
      set('[data-c="give_once"]', '');
    }
    if (c.regular_url) set('[data-c="give_regular"]', '<a class="btn btn-yt" href="' + esc(c.regular_url) + '" target="_blank" rel="noopener">정기 후원 신청하기</a>');
    if (c.note) set('[data-c="give_note"]', esc(c.note));
  }

  // ---- 소식
  function news(c) {
    window.KAIROS_NEWS = (c.items || []).map(function (n) {
      var inside = n.body && n.slug;
      return { t: n.title, c: n.category, d: (n.date || '').slice(0, 10), u: inside ? 'news-post.html?id=' + encodeURIComponent(n.slug) : n.url, ext: !inside };
    });
  }

  // ---- 소식 글 한 편
  function post(c) {
    var items = c.items || [], id = new URLSearchParams(location.search).get('id');
    var k = -1;
    items.forEach(function (n, i) { if (n.slug === id) k = i; });
    if (k < 0) {
      set('[data-c="post_title"]', '소식을 찾을 수 없습니다');
      set('[data-c="post_body"]', '<p>주소가 바뀌었거나 삭제된 소식입니다. <a href="news.html">소식 목록</a>에서 다시 찾아 주세요.</p>');
      return;
    }
    var n = items[k];
    document.title = n.title + ' · KAIROS';
    set('[data-c="post_title"]', esc(n.title));
    set('[data-c="post_cat"]', esc(n.category));
    var d = (n.date || '').slice(0, 10);
    set('[data-c="post_date"]', d ? esc(d.replace(/-/g, '.')) : '');
    set('[data-c="post_body"]', mdPost(n.body) || '<p>본문이 없습니다.</p>');
    var link = function (m, dir) {
      if (!m || !m.slug || !m.body) return '<span></span>';
      return '<a class="post-nav-' + dir + '" href="news-post.html?id=' + encodeURIComponent(m.slug) + '"><small>' + (dir === 'prev' ? '이전 소식' : '다음 소식') + '</small><b>' + esc(m.title) + '</b></a>';
    };
    // 목록은 최신순: 앞(k-1)이 더 최근 글
    set('[data-c="post_nav"]', link(items[k + 1], 'prev') + link(items[k - 1], 'next'));
  }

  function load() {
    var jobs = [];
    if ($('[data-news-home], [data-news-page]')) jobs.push(get('news').then(news));
    if ($('[data-c="post_body"]')) jobs.push(get('news').then(post));
    if ($('[data-c="hero_lead"], [data-c="weekly_text"]')) jobs.push(get('home').then(function (c) { if ($('[data-c="hero_lead"]')) home(c); weekly(c); }));
    if ($('[data-c="lv_title"]')) jobs.push(get('levites').then(levites));
    if ($('[data-c="prayer_countries"]')) jobs.push(get('prayer').then(prayer));
    if ($('[data-c="give_note"]')) jobs.push(get('give').then(give));
    // 하나가 실패해도 나머지는 그대로 진행하고, HTML 기본값을 유지
    return Promise.all(jobs.map(function (j) { return j.catch(function (e) { console.warn('content 불러오기 실패:', e.message); }); }));
  }

  return { load: load };
})();
