// 헤더 배경 전환 + 모바일 메뉴
function initHeader() {
  var header = document.querySelector('.site-header');
  var nav = document.querySelector('.nav');
  var btn = document.querySelector('.menu-btn');
  if (header && !header.classList.contains('light')) {
    var onScroll = function () { header.classList.toggle('solid', window.scrollY > 40 || nav.classList.contains('open')); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  if (btn) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      if (header && !header.classList.contains('light')) header.classList.toggle('solid', open || window.scrollY > 40);
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); btn.setAttribute('aria-expanded', false); });
    });
  }
}

// 소식 — 메인(최신 5건)과 소식 페이지(필터·검색·더 보기)
function initNews() {
  var NEWS = window.KAIROS_NEWS;
  if (!NEWS) return;
  var M = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var esc = function (s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var parts = function (d) { if (!d) return null; var p = d.split('-'); return { y: p[0], m: M[+p[1] - 1], n: +p[1], d: p[2] }; };
  var arrow = '<span class="nw-arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 17L17 7M9 7h8v8"/></svg></span>';

  function feature(f) {
    var fd = parts(f.d);
    return '<a class="nw-feature" href="' + f.u + '"' + (f.ext ? ' target="_blank" rel="noopener"' : '') + '>' +
      '<span class="nw-glow" aria-hidden="true"></span>' +
      '<span class="nw-meta"><span class="nw-new">Latest</span><span class="nw-cat">' + f.c + '</span></span>' +
      '<span class="nw-bigdate">' + (fd ? '<b>' + fd.d + '</b><span>' + fd.m + '<br>' + fd.y + '</span>' : '') + '</span>' +
      '<h3>' + esc(f.t) + '</h3>' +
      '<span class="nw-read">자세히 보기' + arrow + '</span></a>';
  }
  function row(n) {
    var p = parts(n.d);
    return '<li><a href="' + n.u + '"' + (n.ext ? ' target="_blank" rel="noopener"' : '') + '>' +
      '<span class="nw-date">' + (p ? '<b>' + p.d + '</b><span>' + p.m + ' ' + p.y + '</span>' : '<b class="dash">—</b><span>ARCHIVE</span>') + '</span>' +
      '<span class="nw-body"><span class="nw-cat">' + n.c + '</span><span class="nw-title">' + esc(n.t) + '</span></span>' +
      arrow + '</a></li>';
  }
  function top(box, items) {
    box.innerHTML = items.length ? feature(items[0]) + (items.length > 1 ? '<ol class="nw-list">' + items.slice(1, 5).map(row).join('') + '</ol>' : '') : '';
    box.classList.toggle('solo', items.length === 1);
  }

  // 메인
  var home = document.querySelector('[data-news-home]');
  if (home) top(home, NEWS.slice(0, 5));

  // 소식 페이지
  var page = document.querySelector('[data-news-page]');
  if (!page) return;
  var rest = document.querySelector('.np-rest');
  var more = document.querySelector('.np-more');
  var empty = document.querySelector('.np-empty');
  var filters = document.querySelector('.np-filters');
  var input = document.querySelector('.np-search input');
  var STEP = 10, cat = '', q = '', shown = STEP;

  document.querySelector('[data-news-total]').textContent = NEWS.length;
  var latest = parts(NEWS[0].d);
  if (latest) document.querySelector('[data-news-latest]').textContent = latest.y + '.' + latest.n + '.' + (+latest.d);

  var cats = ['전체', '성경 강해', '절기·테마', '레바이츠', '기도'];
  filters.innerHTML = cats.map(function (c, i) {
    var n = i ? NEWS.filter(function (x) { return x.c === c; }).length : NEWS.length;
    return '<button type="button" aria-pressed="' + (i === 0) + '" data-c="' + (i ? c : '') + '">' + c + '<span>' + n + '</span></button>';
  }).join('');

  function render() {
    var items = NEWS.filter(function (n) { return (!cat || n.c === cat) && (!q || n.t.toLowerCase().indexOf(q) > -1); });
    top(page, items);
    var others = items.slice(5);
    rest.innerHTML = others.slice(0, shown).map(row).join('');
    more.hidden = others.length <= shown;
    empty.hidden = items.length > 0;
  }
  filters.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    cat = b.dataset.c; shown = STEP; render();
  });
  input.addEventListener('input', function () { q = input.value.trim().toLowerCase(); shown = STEP; render(); });
  more.querySelector('button').addEventListener('click', function () { shown += STEP; render(); });
  render();
}

// 모션 그래픽
function initMotion() {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 왕의 대로 — 국가 지점을 경로 위에 배치하고, 선이 지나갈 때 차례로 나타나게
  document.querySelectorAll('.route').forEach(function (route) {
    var path = route.querySelector('.road');
    var vb = route.querySelector('svg').viewBox.baseVal;
    var len = path.getTotalLength();
    route.querySelectorAll('.stop').forEach(function (stop) {
      var at = parseFloat(stop.dataset.at);
      var pt = path.getPointAtLength(at * len);
      stop.style.left = (pt.x / vb.width * 100) + '%';
      stop.style.top = (pt.y / vb.height * 100) + '%';
      stop.style.setProperty('--sd', (0.5 + 2.8 * at) + 's');
    });
  });

  // 단어 단위로 분리 — 스크롤에 따라 밝아짐 (말씀 구절, 팀 소개 문장)
  var wordSets = [];
  document.querySelectorAll('[data-words]').forEach(function (el) {
    var words = [];
    (function split(node) {
      Array.from(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            frag.appendChild(s);
            words.push(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'CITE') {
          split(n);
        }
      });
    })(el);
    wordSets.push({ el: el, words: words });
  });

  // 스크롤 진행 막대
  var bar = document.createElement('div');
  bar.className = 'progress';
  document.body.appendChild(bar);

  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty('--p', h > 0 ? scrollY / h : 0);
    wordSets.forEach(function (set) {
      var r = set.el.getBoundingClientRect();
      var p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35);
      var n = reduce ? set.words.length : Math.round(Math.max(0, Math.min(1, p)) * set.words.length);
      set.words.forEach(function (w, k) { w.classList.toggle('on', k < n); });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // 숫자 카운트업
  function countUp(el) {
    var to = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = to.toFixed(dec) + suf; return; }
    var t0 = null, dur = 1800;
    function step(t) {
      t0 = t0 || t;
      var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = (to * e).toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll('[data-count]');
  counters.forEach(function (el) { el.textContent = (0).toFixed(+(el.dataset.dec || 0)) + (el.dataset.suffix || ''); });
  setTimeout(function () { counters.forEach(countUp); }, reduce ? 0 : 1600);

  // 스크롤 등장
  if (!reduce && 'IntersectionObserver' in window) {
    var targets = document.querySelectorAll('.section-head, .values-head > *, .lv-def-item, .cost, .lv-step, .lv-visa, .lv-faq, .who, .lv-vision p, .lv-apply, .pc-banner, .pc-summary, .pc-col, .pc-pray, .nw-feature, .nw-list li, .rg-item, .rg-stage, .jn-panel, .jn, .vrow, .flip, .join, .about-label, .film, .pillar, .tv-head > *, .week, .value, .not-item, .region-card, .card, .news-list, .news-more, .country-head, .country-body > *, .prayer-intro, .contact-band .wrap');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) {
      var sibs = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--rd', Math.min(sibs, 5) * 0.08 + 's');
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  // 흐르는 띠 — 기본은 천천히, 스크롤하면 그 속도와 방향을 따라 빨라짐
  var track = document.querySelector('.marquee-track');
  if (track) {
    var group = track.querySelector('.marquee-group');
    track.appendChild(group.cloneNode(true));
    if (!reduce) {
      var x = 0, boost = 0, dir = 1, lastY = scrollY, last = performance.now();
      window.addEventListener('scroll', function () {
        var dy = scrollY - lastY; lastY = scrollY;
        if (dy) dir = dy > 0 ? 1 : -1;
        boost = Math.min(boost + Math.abs(dy) * 0.6, 40);
      }, { passive: true });
      (function tick(now) {
        var dt = Math.min(now - last, 50) / 16.67; last = now;
        var w = group.offsetWidth;
        x -= (0.6 + boost) * dir * dt;
        boost *= Math.pow(0.92, dt);
        if (x <= -w) x += w;
        if (x > 0) x -= w;
        track.style.transform = 'translate3d(' + x + 'px,0,0) skewX(' + (-boost * 0.25 * dir) + 'deg)';
        requestAnimationFrame(tick);
      })(last);
    }
  }

  // 영상 카드 — 클릭하면 YouTube 플레이어로 교체
  document.querySelectorAll('.film[data-yt]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + btn.dataset.yt + '?autoplay=1&rel=0';
      f.title = btn.getAttribute('aria-label');
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      var box = document.createElement('div');
      box.className = btn.className + ' playing';
      box.appendChild(f);
      btn.replaceWith(box);
    });
  });

  // 추구하지 않는 가치 — 눌러서 뒤집기 (터치 기기용)
  document.querySelectorAll('.flip').forEach(function (f) {
    f.addEventListener('click', function () { f.classList.toggle('flipped'); });
  });

  // 핵심 가치 — 터치 기기에서는 화면 가운데 줄을 강조
  var rows = document.querySelectorAll('.vrow');
  if (rows.length && window.matchMedia('(hover: none)').matches) {
    var pick = function () {
      var mid = innerHeight / 2, best = null, bd = 1e9;
      rows.forEach(function (r) {
        var b = r.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid);
        if (d < bd) { bd = d; best = r; }
      });
      rows.forEach(function (r) { r.classList.toggle('active', r === best && bd < innerHeight * 0.3); });
    };
    window.addEventListener('scroll', pick, { passive: true });
    pick();
  }

  // 사역 지역 — 나라 선택 + 자동 넘김 (진행 막대가 다 차면 다음 나라)
  var rg = document.querySelector('.rg');
  if (rg) {
    var items = rg.querySelectorAll('.rg-item');
    var pics = rg.querySelectorAll('.rg-pic');
    var count = rg.querySelector('.rg-count b');
    var cur = 0;
    var show = function (i) {
      if (i === cur) return;
      pics.forEach(function (p) { p.classList.remove('is-prev'); });
      pics[cur].classList.add('is-prev');
      items[cur].classList.remove('is-on');
      pics[cur].classList.remove('is-on');
      items[cur].querySelector('.rg-btn').setAttribute('aria-expanded', 'false');
      cur = i;
      items[i].classList.add('is-on');
      pics[i].classList.add('is-on');
      items[i].querySelector('.rg-btn').setAttribute('aria-expanded', 'true');
      count.textContent = '0' + (i + 1);
    };
    items.forEach(function (it, i) {
      it.querySelector('.rg-btn').addEventListener('click', function () { show(i); });
      it.querySelector('.rg-bar').addEventListener('animationend', function () { show((i + 1) % items.length); });
    });
    rg.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') rg.classList.add('paused'); });
    rg.addEventListener('pointerleave', function () { rg.classList.remove('paused'); });
    if ('IntersectionObserver' in window) {
      rg.classList.add('paused');
      new IntersectionObserver(function (en) {
        rg.classList.toggle('paused', !en[0].isIntersecting);
      }, { threshold: 0.35 }).observe(rg);
    }
  }

  // 기도 정보 — 지금 보고 있는 나라 탭 표시
  var tabs = document.querySelectorAll('.pc-tabs a');
  if (tabs.length) {
    var secs = document.querySelectorAll('[data-country]');
    var mark = function () {
      var id = '';
      secs.forEach(function (sec) { if (sec.getBoundingClientRect().top < innerHeight * 0.4) id = sec.id; });
      tabs.forEach(function (t) { t.classList.toggle('on', t.dataset.tab === id); });
    };
    window.addEventListener('scroll', mark, { passive: true });
    mark();
  }

  // 레바이츠 — 위로 떠오르는 불씨
  var cv = document.querySelector('.embers');
  if (cv && !reduce) {
    var ctx = cv.getContext('2d'), W, H, dpr = Math.min(devicePixelRatio || 1, 2), sparks = [];
    var size = function () { W = cv.offsetWidth; H = cv.offsetHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); window.addEventListener('resize', size);
    var spawn = function (y) {
      return { x: Math.random() * W, y: y == null ? H + 10 : y, r: Math.random() * 2.2 + .6, vy: Math.random() * .9 + .4,
        sway: Math.random() * 2 * Math.PI, sw: Math.random() * .02 + .005, life: Math.random() * .5 + .5, hue: 25 + Math.random() * 20 };
    };
    for (var k = 0; k < 70; k++) sparks.push(spawn(Math.random() * H));
    var visible = true;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(cv);
    (function loop() {
      if (visible) {
        ctx.clearRect(0, 0, W, H);
        sparks.forEach(function (s, i) {
          s.y -= s.vy; s.sway += s.sw; s.x += Math.sin(s.sway) * .5;
          var a = Math.max(0, Math.min(1, s.y / H)) * s.life;
          ctx.beginPath();
          ctx.fillStyle = 'hsla(' + s.hue + ',100%,62%,' + a + ')';
          ctx.shadowColor = 'hsla(' + s.hue + ',100%,55%,' + a + ')';
          ctx.shadowBlur = 8;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
          if (s.y < -10) sparks[i] = spawn();
        });
      }
      requestAnimationFrame(loop);
    })();
  }

  // 레바이츠 추천 대상 카드 — 마우스 방향으로 기울기 + 빛
  document.querySelectorAll('.who').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || reduce) return;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', x * 100 + '%');
      c.style.setProperty('--my', y * 100 + '%');
      c.style.setProperty('--ry', (x - .5) * 12 + 'deg');
      c.style.setProperty('--rx', (.5 - y) * 10 + 'deg');
    });
    c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
  });

  // 가치 카드 — 커서 따라가는 빛
  document.querySelectorAll('.value').forEach(function (v) {
    v.addEventListener('pointermove', function (e) {
      var r = v.getBoundingClientRect();
      v.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      v.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
}

// content/*.json을 먼저 채운 뒤 화면 효과를 시작 (단어 분리·숫자 카운트가 최신 내용 기준으로 동작)
initHeader();
(window.KairosContent ? window.KairosContent.load() : Promise.resolve()).then(function () {
  initNews();
  initMotion();
});
