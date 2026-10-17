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

  // ---- 소식
  function news(c) {
    window.KAIROS_NEWS = (c.items || []).map(function (n) {
      return { t: n.title, c: n.category, d: (n.date || '').slice(0, 10), u: n.url };
    });
  }

  function load() {
    var jobs = [];
    if ($('[data-news-home], [data-news-page]')) jobs.push(get('news').then(news));
    if ($('[data-c="hero_lead"]')) jobs.push(get('home').then(home));
    if ($('[data-c="lv_title"]')) jobs.push(get('levites').then(levites));
    if ($('[data-c="prayer_countries"]')) jobs.push(get('prayer').then(prayer));
    // 하나가 실패해도 나머지는 그대로 진행하고, HTML 기본값을 유지
    return Promise.all(jobs.map(function (j) { return j.catch(function (e) { console.warn('content 불러오기 실패:', e.message); }); }));
  }

  return { load: load };
})();
