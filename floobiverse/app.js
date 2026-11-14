/* The Floobiverse page (v4): powers, scroll scenes and small interactions.
   The character panels are written out in index.html so they read without JavaScript.
   CAST below is used by the powers; keep it in step with index.html if a fact changes. */

/* Character heights as a fraction of Boo, measured in pixels from the style guide proportions chart
   (page 15, "Floob's friends: Proportions"). The same numbers live in style.css as --sc-* variables. */
const SCALE = { boo: 1, taffy: 0.87, pozzo: 0.70, bonbon: 0.69, quiddie: 0.60, floob: 0.57, didi: 0.42, gogo: 0.41, lucky: 0.38 };

const CAST = {
  lucky: { name: 'Lucky', title: 'The Worrisome Scientist', powers: 'Can digitise herself and enter the internet', likes: 'Everything perfectly organised', motto: 'When in doubt, follow the logic' },
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = () => window.matchMedia('(max-width: 860px)').matches;
const hasGsap = !!(window.gsap && window.ScrollTrigger);
const motionOK = hasGsap && !reduceMotion;
const root = document.documentElement;
const barSpace = () => parseFloat(getComputedStyle(root).getPropertyValue('--top')) || 0; // room kept for the top bar, if there is one
root.classList.add(motionOK ? 'motion' : 'no-motion');

/* ---------- Loader: paint rises while the hero clip and fonts load, then drips away ---------- */
const loader = $('#loader');
let introRevealed = false;
function revealIntro() {
  if (introRevealed) return;
  introRevealed = true;
  if (motionOK) gsap.from('.intro-title .iw, .intro-hint', { y: 40, opacity: 0, rotate: 5, duration: 0.7, ease: 'back.out(1.7)', stagger: 0.07 });
}
function hideLoader() {
  if (!loader || loader.classList.contains('done')) return;
  loader.classList.add('done');
  setTimeout(() => loader.remove(), 1300);
  revealIntro();
}
if (loader && getComputedStyle(loader).display !== 'none') {
  const setP = v => loader.style.setProperty('--p', Math.max(parseFloat(loader.style.getPropertyValue('--p')) || 0, v));
  setP(0.12);
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  const hero = $('.frame-video');
  const heroReady = new Promise(r => {
    if (!hero || hero.readyState >= 3) return r();
    hero.addEventListener('canplay', r, { once: true });
    hero.addEventListener('error', r, { once: true });
  });
  fonts.then(() => setP(0.5));
  heroReady.then(() => setP(0.78));
  Promise.all([fonts, heroReady, new Promise(r => setTimeout(r, 600))]).then(() => { setP(1); setTimeout(hideLoader, 380); });
  setTimeout(() => { setP(1); hideLoader(); }, 2500);
} else if (loader) loader.remove();

/* ---------- Top bar menu on phones ---------- */
const menuBtn = $('.menu-btn');
if (menuBtn) { // the page can run without its top bar (for example inside the Floob Creative website)
  const setMenu = open => { menuBtn.setAttribute('aria-expanded', String(open)); document.body.classList.toggle('menu-open', open); };
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  $('#topnav').addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });
}

/* ---------- On touch screens, say "tap" rather than "click" ---------- */
if (window.matchMedia('(hover: none)').matches) {
  $$('.secret-label').forEach(l => { l.textContent = 'Tap to reveal'; });
  const tip = $('.lineup-tip');
  if (tip) tip.textContent = tip.textContent.replace(/^Click/, 'Tap');
}

/* ---------- In-page links: lazy images load during a long smooth scroll and push the target down, so re-check on arrival ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  const target = document.getElementById(a.getAttribute('href').slice(1));
  if (!target) return;
  const settle = () => { const off = target.getBoundingClientRect().top - barSpace(); if (Math.abs(off) > 30) window.scrollBy({ top: off, behavior: 'instant' }); };
  let done = false;
  const once = () => { if (done) return; done = true; settle(); setTimeout(settle, 400); };
  addEventListener('scrollend', once, { once: true });
  setTimeout(once, 2500);
});

/* ---------- Looping videos: load about one screen ahead, play only while on screen ---------- */
const loadIO = new IntersectionObserver(entries => entries.forEach(en => {
  if (!en.isIntersecting) return;
  const v = en.target;
  v.src = (small() && v.dataset.srcSm) || v.dataset.src;
  loadIO.unobserve(v);
}), { rootMargin: '100% 0px' });
const playIO = new IntersectionObserver(entries => entries.forEach(en => {
  const v = en.target;
  if (en.isIntersecting && !reduceMotion) v.play().catch(() => {});
  else v.pause();
}), { threshold: 0.12 });
$$('video[data-src]').forEach(v => loadIO.observe(v));
$$('video[data-loop]').forEach(v => playIO.observe(v));
if (reduceMotion) $$('video[autoplay]').forEach(v => { v.removeAttribute('autoplay'); v.pause(); });

/* ---------- Modal (photos, clips): focus stays inside, Escape closes, focus returns ---------- */
const modal = $('#modal');
const modalBody = $('#modalBody');
let lastFocus = null;
function openModal(html, label) {
  lastFocus = document.activeElement;
  modalBody.innerHTML = html;
  modal.setAttribute('aria-label', label || 'Viewer');
  modal.hidden = false;
  document.body.classList.add('modal-open');
  $('.modal-close', modal).focus();
}
function closeModal() {
  modal.hidden = true;
  modalBody.innerHTML = '';
  document.body.classList.remove('modal-open');
  if (lastFocus) lastFocus.focus();
}
modal.addEventListener('click', e => { if (e.target === modal || e.target.closest('.modal-close')) closeModal(); });
modal.addEventListener('keydown', e => {
  if (e.key === 'Escape') return closeModal();
  if (e.key !== 'Tab') return;
  const f = $$('button, a[href], video[controls], iframe', modal);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});
document.addEventListener('click', e => {
  const clip = e.target.closest('[data-clip]');
  if (clip) {
    e.preventDefault();
    openModal(`<video src="${clip.dataset.clip}" autoplay controls playsinline muted></video>`, clip.textContent.trim());
    return;
  }
  const tile = e.target.closest('[data-full]');
  if (tile) {
    e.preventDefault();
    const img = $('img', tile);
    const cap = tile.dataset.caption || (img && img.alt) || '';
    openModal(`<figure><img src="${tile.dataset.full}" alt="${cap.replace(/"/g, '&quot;')}"><figcaption>${cap}</figcaption></figure>`, cap);
  }
});

/* ---------- Music video: nothing loads from YouTube until it is clicked ---------- */
$('#ytButton').addEventListener('click', () => {
  $('#ytCard').innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/jREfzFF4vfA?autoplay=1&rel=0" title="Floobiverse music video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
});

/* ---------- Copy email address ---------- */
const live = $('#liveStatus');
$$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
  const text = b.dataset.copy;
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (err) {
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
    t.remove();
  }
  if (!b.dataset.label) b.dataset.label = b.textContent;
  b.textContent = ok ? 'Copied: ' + text : text;
  b.classList.toggle('copied', ok);
  live.textContent = ok ? 'Email address copied' : 'Copy failed. The address is ' + text;
  clearTimeout(b._t);
  b._t = setTimeout(() => { b.textContent = b.dataset.label; b.classList.remove('copied'); }, 3200);
}));

/* ---------- Character secrets: hidden under a smear until clicked ---------- */
$$('.secret').forEach(b => b.addEventListener('click', () => { b.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }));

/* ---------- Quiddie's drain ----------
   One fixed grey layer (mix-blend-mode: saturation) takes the colour out of everything beneath it.
   Its mask leaves a coloured hole that shrinks onto Quiddie, while streams of colour fly into him.
   How grey the page is depends only on where you are on the page, so it is right however you got
   there: slow scrolling, fast scrolling, or jumping with the menu.
     above Quiddie's panel ............ full colour
     while his panel arrives .......... colour drains into him
     between him and the colour scene . grey
     during the colour scene .......... colour returns with the clip
     after it ......................... full colour */
const Drain = (() => {
  const el = $('#drain'), layer = $('#streams');
  const quid = $('#char-quiddie'), qImg = quid && $('.char-img', quid), qBody = quid && $('.char-body', quid);
  const COLS = ['#1fb5a8', '#ec6f9c', '#e8504d', '#2fbcd6', '#a347ba', '#e9b500', '#f39417', '#ffe44d', '#e8095f'];
  const N = 26;
  const dots = [];
  let built = false, replay = null, gulped = false, lastP = 0;
  const ranges = { q0: 0, q1: 0, r0: 0, r1: 0, lift: [0.15, 0.7] };
  function build() {
    if (built) return;
    built = true;
    for (let i = 0; i < N; i++) {
      const d = document.createElement('i');
      d.style.background = COLS[i % COLS.length];
      layer.appendChild(d);
      const side = i % 4, t = Math.random();
      dots.push({ el: d, side, t, delay: (i / N) * 0.45, size: rand(0.7, 1.5) });
    }
  }
  function qPoint() {
    const r = qImg.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height * 0.42, w: r.width, h: r.height };
  }
  function startPoint(d) {
    const W = innerWidth, H = innerHeight;
    return [[d.t * W, -20], [W + 20, d.t * H], [d.t * W, H + 20], [-20, d.t * H]][d.side];
  }
  function streams(p, q) {
    dots.forEach(d => {
      const k = clamp((p - d.delay) / 0.5, 0, 1);
      if (k <= 0 || k >= 1) { d.el.style.opacity = 0; return; }
      const [sx, sy] = startPoint(d), e = k * k * (3 - 2 * k);
      const x = lerp(sx, q.x, e) + Math.sin(k * Math.PI) * 40 * (d.side % 2 ? 1 : -1);
      const y = lerp(sy, q.y, e);
      const s = d.size * (1 - e * 0.75);
      d.el.style.opacity = 1;
      d.el.style.transform = `translate(${x}px, ${y}px) scale(${s}, ${s * (1 + e)})`;
    });
  }
  function gulp() {
    if (!qBody) return;
    gsap.fromTo(qBody, { scaleX: 1.12, scaleY: 0.88 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: 'elastic.out(1, 0.35)', transformOrigin: '50% 100%', overwrite: true });
  }
  // p: 0 = full colour, 1 = fully drained into Quiddie
  function drainTo(p) {
    if (p <= 0) { el.style.opacity = 0; streams(0); root.style.setProperty('--drain', 0); return; }
    const q = qPoint();
    const R = Math.hypot(Math.max(q.x, innerWidth - q.x), Math.max(q.y, innerHeight - q.y)) + 80;
    const r = R * Math.pow(1 - clamp(p, 0, 1), 1.4);
    el.style.opacity = 1;
    const m = p >= 1 ? 'none' : `radial-gradient(circle at ${q.x}px ${q.y}px, transparent ${r}px, #000 ${r + 70}px)`;
    el.style.webkitMaskImage = el.style.maskImage = m;
    root.style.setProperty('--drain', clamp(p, 0, 1).toFixed(3));
    build();
    streams(p, q);
  }
  function grey(amount) { // uniform grey, used between the scenes and while the colour scene lifts it
    el.style.webkitMaskImage = el.style.maskImage = 'none';
    el.style.opacity = amount.toFixed(3);
    root.style.setProperty('--drain', amount.toFixed(3));
    streams(0);
  }
  function update() {
    if (!quid || replay) return;
    const y = scrollY;
    if (y < ranges.q0) { drainTo(0); gulped = false; lastP = 0; return; }
    if (y < ranges.q1) {
      const p = (y - ranges.q0) / Math.max(1, ranges.q1 - ranges.q0);
      drainTo(p);
      if (p > 0.96 && lastP <= 0.96 && !gulped) { gulped = true; gulp(); }
      if (p < 0.8) gulped = false;
      lastP = p;
      return;
    }
    lastP = 1;
    if (y < ranges.r0) return grey(1);
    if (y < ranges.r1) {
      const t = (y - ranges.r0) / Math.max(1, ranges.r1 - ranges.r0);
      return grey(1 - clamp((t - ranges.lift[0]) / (ranges.lift[1] - ranges.lift[0]), 0, 1));
    }
    grey(0);
  }
  function setRanges(q0, q1, r0, r1) { Object.assign(ranges, { q0, q1, r0, r1 }); update(); }
  // "Try Quiddie's power": colour floods back for a moment, Quiddie gets ready, then he sucks it all up again
  function replayPower(done) {
    const s = { p: lastP >= 1 ? 1 : Math.max(lastP, 0.6) };
    replay = gsap.timeline({ onComplete: () => { replay = null; update(); done && done(); } })
      .to(s, { p: 0, duration: 0.7, ease: 'power2.out', onUpdate: () => drainTo(s.p) })
      .to(qBody, { y: -18, scaleY: 1.08, scaleX: 0.95, duration: 0.35, ease: 'power2.out', transformOrigin: '50% 100%' }, 0.8)
      .to(qBody, { y: 0, scaleY: 1, scaleX: 1, duration: 0.3, ease: 'power2.in' }, 1.15)
      .to(s, { p: 1, duration: 1.9, ease: 'power1.in', onUpdate: () => drainTo(s.p) }, 1.0)
      .add(gulp, 2.9);
  }
  return { update, setRanges, replayPower };
})();

/* ---------- Powers: one entry per character, each acts on its own panel and puts itself back ---------- */
const busy = new Set();
const fxOf = sec => $('.fx', sec);
function relRect(base, el) {
  const a = base.getBoundingClientRect(), b = el.getBoundingClientRect();
  return { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height };
}
function say(sec, text, ms = 2600, near) {
  const p = document.createElement('p');
  p.className = 'fx-say';
  p.textContent = text;
  fxOf(sec).appendChild(p);
  const b = relRect(sec, near || $('.power-btn', sec)), w = sec.offsetWidth, pw = Math.min(320, w - 24);
  p.style.width = pw + 'px';
  p.style.left = clamp(b.x - 10, 12, w - pw - 12) + 'px';
  p.style.top = Math.max(12, b.y - 20) + 'px';
  gsap.fromTo(p, { scale: 0.4, opacity: 0, yPercent: -100 }, { scale: 1, opacity: 1, yPercent: -100, duration: 0.5, ease: 'back.out(2)' });
  gsap.to(p, { opacity: 0, y: -20, delay: ms / 1000, duration: 0.4, onComplete: () => p.remove() });
}
const finished = sec => busy.delete(sec);

const ORBIT_ART = [
  // paint pot
  '<svg viewBox="0 0 40 40"><path d="M8 14h24l-2 20a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" fill="#e8504d" stroke="#1d1a22" stroke-width="2.5"/><path d="M6 11h28v4H6z" fill="#fff" stroke="#1d1a22" stroke-width="2.5"/><path d="M12 15c0 5 4 4 4 9 0 2 3 2 3 0v-9" fill="#ffe44d"/></svg>',
  // brush
  '<svg viewBox="0 0 40 40"><path d="M27 4l7 7-14 14-7-7z" fill="#f39417" stroke="#1d1a22" stroke-width="2.5" stroke-linejoin="round"/><path d="M13 18l7 7c-3 6-9 10-15 10 0-6 3-13 8-17z" fill="#1fb5a8" stroke="#1d1a22" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  // star
  '<svg viewBox="0 0 40 40"><path d="M20 3l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#ffe44d" stroke="#1d1a22" stroke-width="2.5" stroke-linejoin="round"/></svg>',
  // paint blob
  '<svg viewBox="0 0 40 40"><path d="M20 4c8 0 15 7 15 16 0 8-6 15-15 15S5 29 5 21C5 11 12 4 20 4z" fill="#ec6f9c" stroke="#1d1a22" stroke-width="2.5"/><ellipse cx="14" cy="14" rx="4" ry="2.5" fill="#fff" opacity=".6"/></svg>',
];

const POWERS = {
  floob(sec) { // paint pots, brushes and stars rise and orbit him in a tidy ring while he cycles three colours; the fact boxes stay put
    const img = $('.char-img', sec), fx = fxOf(sec), r = relRect(sec, img);
    const cx = r.x + r.w / 2, ground = r.y + r.h, mid = r.y + r.h * 0.5;
    const n = 6, R = Math.max(r.w * 1.05, 150), Ry = R * 0.28;
    const items = Array.from({ length: n }, (_, i) => {
      const o = document.createElement('div');
      o.className = 'orbit';
      o.innerHTML = ORBIT_ART[i % ORBIT_ART.length];
      fx.appendChild(o);
      return o;
    });
    const st = { a: 0, rad: 0, lift: 0 };
    const draw = () => items.forEach((o, i) => {
      const ang = st.a + (i * Math.PI * 2) / n, depth = (Math.sin(ang) + 1) / 2;
      const x = cx + Math.cos(ang) * R * st.rad, y = lerp(ground, mid, st.lift) + Math.sin(ang) * Ry * st.rad;
      const sc = (0.75 + depth * 0.4) * (0.4 + 0.6 * st.lift);
      o.style.transform = `translate(${x}px, ${y}px) scale(${sc}) rotate(${Math.cos(ang) * 14}deg)`;
      o.style.opacity = (0.55 + depth * 0.45) * Math.min(1, st.lift * 2);
    });
    const shadow = 'drop-shadow(0 14px 12px rgba(0,0,0,.16))';
    gsap.timeline({ onUpdate: draw, onComplete: () => { items.forEach(o => o.remove()); gsap.set(img, { clearProps: 'filter' }); finished(sec); } })
      .to(st, { rad: 1, lift: 1, duration: 0.9, ease: 'back.out(1.6)' }, 0)
      .to(st, { a: Math.PI * 3, duration: 4.4, ease: 'none' }, 0)
      .to(st, { rad: 0, lift: 0, duration: 0.8, ease: 'power2.in' }, 3.6)
      .to(img, { filter: `hue-rotate(140deg) saturate(1.25) ${shadow}`, duration: 0.5 }, 0.4)
      .to(img, { filter: `hue-rotate(250deg) saturate(1.3) ${shadow}`, duration: 0.5 }, 1.7)
      .to(img, { filter: `hue-rotate(360deg) saturate(1) ${shadow}`, duration: 0.5 }, 3.0);
  },

  bonbon(sec) { // sprinkles burst from her hands, the panel turns candy-striped, the text bounces on a sugar rush
    const fx = fxOf(sec), r = relRect(sec, $('.char-img', sec));
    const cols = ['#ff4f9a', '#ffd54f', '#4fc3f7', '#9ccc65', '#ab47bc', '#ffffff', '#ff8a65'];
    for (let i = 0; i < 54; i++) {
      const s = document.createElement('i');
      s.className = 'sprinkle';
      s.style.cssText = `background:${cols[i % cols.length]};left:${r.x + r.w * rand(0.25, 0.75)}px;top:${r.y + r.h * 0.5}px`;
      fx.appendChild(s);
      gsap.timeline({ onComplete: () => s.remove() })
        .fromTo(s, { rotation: rand(0, 180), scale: rand(0.6, 1.3) }, { x: rand(-360, 360), y: rand(-300, -80), rotation: '+=' + rand(200, 600), duration: rand(0.6, 0.9), ease: 'power2.out' })
        .to(s, { y: '+=' + rand(320, 520), opacity: 0, duration: 1.3, ease: 'power2.in' });
    }
    sec.classList.add('sugar');
    const txt = $$('.char-text > *', sec);
    gsap.to(txt, { y: -9, duration: 0.15, ease: 'sine.inOut', yoyo: true, repeat: 17, stagger: 0.035 });
    setTimeout(() => { sec.classList.remove('sugar'); gsap.to(txt, { y: 0, duration: 0.3, overwrite: true, onComplete: () => finished(sec) }); }, 3800);
  },

  boo(sec) { // the tail swings, the panel shakes and everything is left crooked for a while
    const body = $('.char-body', sec), inner = $('.char-inner', sec);
    const bits = $$('.char-num, .char-name, .char-title, .char-hook, .power-row, .char-facts > div, .char-motto, .char-extra', sec);
    gsap.timeline()
      .to(body, { rotation: -16, duration: 0.25, ease: 'power2.out', transformOrigin: '50% 91%' })
      .to(body, { rotation: 28, duration: 0.18, ease: 'power3.in' })
      .add(() => {
        gsap.to(inner, { keyframes: { x: [-16, 14, -10, 8, -4, 0] }, duration: 0.5, ease: 'none' });
        bits.forEach(b => gsap.to(b, { rotation: rand(-9, 9), x: rand(-24, 24), y: rand(-6, 10), duration: 0.45, ease: 'back.out(3)' }));
      })
      .to(body, { rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' })
      .to(body, { scale: 0.94, duration: 0.3, delay: 2.2 })
      .add(() => gsap.to(bits, { rotation: 0, x: 0, y: 0, duration: 0.9, ease: 'power2.inOut', stagger: 0.08 }))
      .to(body, { scale: 1, duration: 0.4, delay: 0.9, onComplete: () => finished(sec) });
  },

  taffy(sec) { // drag him and he stretches toward the pointer, then twangs back
    const body = $('.char-body', sec), art = $('.char-art', sec);
    gsap.set(body, { transformOrigin: '50% 91%' });
    const twang = () => gsap.to(body, { rotation: 0, scaleX: 1, scaleY: 1, duration: 1.3, ease: 'elastic.out(1.2, 0.22)' });
    const pull = (x, y) => {
      const b = art.getBoundingClientRect();
      const ox = b.left + b.width / 2, oy = b.top + b.height * 0.91;
      const dx = x - ox, dy = y - oy, len = Math.hypot(dx, dy);
      const rot = clamp(Math.atan2(dx, -dy) * 180 / Math.PI, -75, 75);
      const sy = clamp(len / (b.height * 0.7), 0.85, 2.3);
      gsap.to(body, { rotation: rot, scaleY: sy, scaleX: 1 / Math.sqrt(sy), duration: 0.25, ease: 'power2.out', overwrite: true });
    };
    const btn = $('.power-btn', sec).getBoundingClientRect();
    pull(btn.left + btn.width / 2, btn.top);
    setTimeout(twang, 500);
    say(sec, 'Now drag Taffy', 2200);
    let dragging = false, idle;
    sec.classList.add('stretchy');
    const down = e => { if (!e.target.closest('.char-img')) return; dragging = true; body.setPointerCapture?.(e.pointerId); e.preventDefault(); clearTimeout(idle); };
    const move = e => { if (dragging) pull(e.clientX, e.clientY); };
    const up = () => { if (!dragging) return; dragging = false; twang(); idle = setTimeout(end, 2500); };
    const end = () => { dragging = false; sec.classList.remove('stretchy'); body.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); twang(); finished(sec); };
    body.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    idle = setTimeout(end, 7000);
  },

  gogo(sec) { // a little Floob walks across; Gogo dashes over, clamps onto his leg and is dragged along with hearts, then trots home
    const art = $('.char-art', sec), body = $('.char-body', sec), img = $('.char-img', sec), fx = fxOf(sec);
    const zone = document.createElement('div');
    zone.className = 'walkzone';
    art.appendChild(zone);
    const A = art.getBoundingClientRect(), G = img.getBoundingClientRect();
    const W = A.width, ground = G.bottom - A.top, gW = G.width, gLeft = G.left - A.left;
    const fH = G.height * SCALE.floob / SCALE.gogo / 0.9; // the walk pose has a little margin inside the image
    const fl = document.createElement('img');
    fl.src = 'img/poses/floob-walk.webp';
    fl.alt = '';
    fl.style.height = fH + 'px';
    fl.style.top = (ground - fH * 0.96) + 'px';
    zone.appendChild(fl);
    const fW = fH * 480 / 505;
    const T = 5.2, speed = (W + fW * 1.2) / T;
    const floobX = t => -fW + speed * t;                 // left edge of Floob
    const legX = t => floobX(t) + fW * 0.22;             // his trailing foot
    const attach = t => legX(t) - gW * 0.78 - gLeft;     // Gogo's offset when holding on
    const tPass = (gLeft + gW * 0.4 + fW * 0.9) / speed;  // Floob is walking past Gogo: off he goes
    const tGrab = tPass + 0.3;
    const tLet = Math.min(T, (W - 8 - gW * 0.22 - fW * 0.22 + fW) / speed); // Gogo reaches the edge and lets go
    const letX = attach(tLet);
    const st = { t: 0 };
    let heartT = 0, pose = 0;
    const walkSrc = ['img/poses/floob-walk.webp', 'img/poses/floob-run.webp'];
    const heart = (x, y) => {
      const h = document.createElement('i');
      h.className = 'heart';
      const a = relRect(sec, art);
      h.style.cssText = `left:${a.x + x}px;top:${a.y + y}px`;
      fx.appendChild(h);
      gsap.fromTo(h, { scale: 0.3, opacity: 1 }, { y: -80, x: rand(-24, 24), scale: rand(0.8, 1.3), opacity: 0, duration: 1.1, ease: 'power1.out', onComplete: () => h.remove() });
    };
    img.style.scale = '-1 1'; // face right, towards Floob
    gsap.timeline({ onComplete: () => { zone.remove(); img.style.scale = ''; gsap.set(body, { clearProps: 'transform' }); finished(sec); } })
      .to(st, { t: T, duration: T, ease: 'none', onUpdate() {
        const t = st.t;
        gsap.set(fl, { x: floobX(t), y: -Math.abs(Math.sin(t * 9)) * fH * 0.05 });
        const p = Math.floor(t / 0.2) % 2;
        if (p !== pose) { pose = p; fl.src = walkSrc[p]; }
        let x = 0, rot = 0;
        if (t > tPass && t < tGrab) { const k = (t - tPass) / (tGrab - tPass); x = lerp(0, attach(tGrab), k * k); rot = -6; }
        else if (t >= tGrab && t < tLet) {
          x = attach(t); rot = -10 + Math.sin(t * 18) * 3;
          if (t - heartT > 0.22) { heartT = t; heart(gLeft + x + gW * 0.6, ground - G.height); }
        } else if (t >= tLet) x = letX;
        gsap.set(body, { x, rotation: rot, transformOrigin: '50% 91%' });
      } })
      .add(() => { img.style.scale = ''; }) // turn round
      .to(body, { keyframes: [{ y: -14, duration: 0.14 }, { y: 0, duration: 0.14 }, { y: -12, duration: 0.14 }, { y: 0, duration: 0.14 }, { y: -10, duration: 0.14 }, { y: 0, duration: 0.14 }], ease: 'sine.inOut' })
      .to(body, { x: 0, rotation: 0, duration: 0.84, ease: 'none' }, '<');
  },

  didi(sec) { // a spiral spreads from her eye, the text sways, the heading changes until it ends
    const fx = fxOf(sec), r = relRect(sec, $('.char-img', sec)), name = $('.char-name', sec);
    const sp = document.createElement('div');
    sp.className = 'spiral';
    let d = 'M0 0';
    for (let t = 0; t < 14 * Math.PI * 2; t += 0.2) d += ` L${(Math.cos(t) * t * 1.15).toFixed(1)} ${(Math.sin(t) * t * 1.15).toFixed(1)}`;
    sp.innerHTML = `<svg viewBox="-110 -110 220 220" aria-hidden="true"><path d="${d}"/></svg>`;
    sp.style.left = r.x + r.w / 2 + 'px';
    sp.style.top = r.y + r.h * 0.4 + 'px';
    fx.appendChild(sp);
    const size = Math.hypot(sec.offsetWidth, sec.offsetHeight) * 2.2;
    gsap.set(sp, { width: size, height: size, xPercent: -50, yPercent: -50 });
    gsap.fromTo(sp, { scale: 0, opacity: 0.9 }, { scale: 1, duration: 1.2, ease: 'power2.out' });
    gsap.to(sp, { rotation: 1080, duration: 4.4, ease: 'none' });
    const old = name.textContent;
    name.textContent = 'Adore me!';
    name.classList.add('hypno');
    const txt = $$('.char-text > *', sec);
    gsap.to(txt, { rotation: 2.5, x: 10, duration: 0.55, ease: 'sine.inOut', yoyo: true, repeat: 7, stagger: 0.05, transformOrigin: '0% 50%' });
    setTimeout(() => {
      gsap.to(sp, { opacity: 0, scale: 0.2, duration: 0.6, onComplete: () => sp.remove() });
      gsap.to(txt, { rotation: 0, x: 0, duration: 0.4, overwrite: true });
      name.textContent = old;
      name.classList.remove('hypno');
      finished(sec);
    }, 4400);
  },

  lucky(sec) { // she breaks into pixels, the panel becomes a data screen, then she reassembles
    const img = $('.char-img', sec), fx = fxOf(sec), r = relRect(sec, img), c = CAST.lucky;
    const cols = 9, rows = 11, tw = r.w / cols, th = r.h / rows, tiles = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const t = document.createElement('i');
      t.className = 'pixel';
      t.style.cssText = `left:${r.x + x * tw}px;top:${r.y + y * th}px;width:${tw + 0.5}px;height:${th + 0.5}px;background-image:url(${img.currentSrc || img.src});background-size:${r.w}px ${r.h}px;background-position:${-x * tw}px ${-y * th}px`;
      fx.appendChild(t); tiles.push(t);
    }
    img.style.visibility = 'hidden';
    const screen = document.createElement('div');
    screen.className = 'terminal';
    screen.innerHTML = `<video src="media/pixel-720.mp4" muted playsinline loop autoplay aria-hidden="true"></video><pre></pre>`;
    fx.appendChild(screen);
    const lines = ['> lucky.exe --digitise', 'name ........ ' + c.name, 'title ....... ' + c.title, 'power ....... ' + c.powers, 'loves ....... ' + c.likes, 'motto ....... "' + c.motto + '"', '> upload complete. returning to Chromia_'];
    const pre = $('pre', screen), sr = sec.getBoundingClientRect();
    const visTop = Math.max(0, -sr.top), visH = Math.min(sr.bottom, innerHeight) - Math.max(sr.top, 0);
    pre.style.marginTop = Math.round(visTop + Math.max(80, visH * 0.3)) + 'px';
    gsap.timeline({ onComplete: () => finished(sec) })
      .to(tiles, { x: () => rand(-260, 260), y: () => rand(-220, 220), rotation: () => rand(-90, 90), opacity: 0, duration: 0.7, ease: 'power2.in', stagger: { amount: 0.4, from: 'random' } })
      .fromTo(screen, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.45)
      .add(() => lines.forEach((l, i) => setTimeout(() => { pre.textContent += (i ? '\n' : '') + l; }, i * 330)), 0.75)
      .to(screen, { opacity: 0, duration: 0.4 }, 4)
      .to(tiles, { x: 0, y: 0, rotation: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: { amount: 0.4, from: 'random' } }, 4.1)
      .add(() => { img.style.visibility = ''; tiles.forEach(t => t.remove()); screen.remove(); });
  },

  pozzo(sec) { // each press: he lunges at his own name and bites a chunk out of it; after three bites the letters grow back
    const st = sec._bites || (sec._bites = { list: [], timer: 0, regrowing: false, lunging: false });
    busy.delete(sec);
    if (st.regrowing || st.lunging) return;
    st.lunging = true;
    const art = $('.char-art', sec), body = $('.char-body', sec), img = $('.char-img', sec), name = $('.char-name', sec);
    const nr = name.getBoundingClientRect(), ir = img.getBoundingClientRect();
    // the letters themselves: measure the text, not the heading box
    const range = document.createRange(); range.selectNodeContents(name);
    const tr = range.getBoundingClientRect();
    const biteR = Math.min(tr.height * 0.27, 38);
    const n = st.list.length;
    const bx = tr.right - biteR * (0.35 + n * 1.5), by = tr.top + tr.height * [0.34, 0.62, 0.4][n % 3];
    // Pozzo faces left; his mouth is about here in the drawing
    const mx = ir.left + ir.width * 0.2, my = ir.top + ir.height * 0.3;
    const dx = bx + biteR * 0.6 - mx, dy = by - my;
    art.classList.add('lunge');
    const chomp = () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'bite');
      const D = biteR * 2.4;
      svg.setAttribute('viewBox', '-60 -60 120 120');
      let d = '';
      for (let i = 0; i <= 36; i++) { const a = (i / 36) * Math.PI * 2, rr = i % 2 ? 50 : 42; d += (i ? 'L' : 'M') + (Math.cos(a) * rr).toFixed(1) + ' ' + (Math.sin(a) * rr).toFixed(1); }
      svg.innerHTML = `<path d="${d}Z"/>`;
      svg.style.width = svg.style.height = D + 'px';
      svg.style.left = (bx - nr.left - D / 2) + 'px';
      svg.style.top = (by - nr.top - D / 2) + 'px';
      name.appendChild(svg);
      st.list.push(svg);
      gsap.fromTo(svg, { scale: 0.2 }, { scale: 1, duration: 0.18, ease: 'back.out(3)' });
    };
    gsap.timeline({ onComplete: () => { art.classList.remove('lunge'); st.lunging = false; after(); } })
      .to(body, { x: dx * 0.15, y: dy * 0.15 + 10, scaleX: 1.08, scaleY: 0.9, duration: 0.18, ease: 'power2.out', transformOrigin: '50% 91%' })
      .to(body, { x: dx, y: dy, scaleX: 0.92, scaleY: 1.1, rotation: -8, duration: 0.3, ease: 'power3.in' })
      .add(chomp)
      .to(body, { scaleX: 1.18, scaleY: 0.82, duration: 0.09, ease: 'power2.out' })
      .to(body, { scaleX: 1, scaleY: 1, duration: 0.12 })
      .to(body, { x: 0, y: 0, rotation: 0, duration: 0.55, ease: 'power2.inOut' }, '+=0.15');
    function after() {
      clearTimeout(st.timer);
      const regrow = () => {
        st.regrowing = true;
        gsap.to(st.list, { scale: 0, duration: 0.6, ease: 'power2.in', stagger: 0.12, onComplete: () => { st.list.forEach(s => s.remove()); st.list = []; st.regrowing = false; } });
      };
      if (st.list.length >= 3) { say(sec, 'He once ate his own house.', 2300, name); st.timer = setTimeout(regrow, 2600); }
      else st.timer = setTimeout(regrow, 4500);
    }
  },

  quiddie(sec) { // the colour floods back for a moment, then he sucks it all up again
    Drain.replayPower(() => finished(sec));
  },
};

document.addEventListener('click', e => {
  const b = e.target.closest('.power-btn');
  if (!b) return;
  const sec = b.closest('.char'), id = sec.dataset.id;
  if (!motionOK) {
    const note = $('.power-note', sec);
    const show = note.classList.toggle('show');
    b.setAttribute('aria-expanded', String(show));
    return;
  }
  if (busy.has(sec)) return;
  busy.add(sec);
  // On a phone the character sits above the button, often half off the screen: bring them into view first, then play
  const art = $('.char-art', sec), r = art.getBoundingClientRect(), top = barSpace() + 4;
  if (small() && id !== 'quiddie' && (r.top < top - 8 || r.bottom > innerHeight)) {
    let go = false;
    const run = () => { if (go) return; go = true; POWERS[id](sec, b, e); };
    addEventListener('scrollend', run, { once: true });
    setTimeout(run, 700);
    window.scrollBy({ top: r.top - top, behavior: 'smooth' });
  } else POWERS[id](sec, b, e);
});

/* ---------- Scroll scenes (skipped entirely with reduced motion or without GSAP) ---------- */
if (motionOK) {
  gsap.registerPlugin(ScrollTrigger);
  const mm = gsap.matchMedia();
  // Inside another website (the Floob Creative site) on a touch screen, the page scrolls itself, so a swipe can never
  // scroll the surrounding website by mistake and the scroll scenes stay in step with the finger.
  if (window.self !== window.top && ScrollTrigger.isTouch === 1) ScrollTrigger.normalizeScroll({ allowNestedScroll: true });

  // First scroll: a drop of paint falls from the title.
  addEventListener('scroll', () => $('.paint-fall')?.classList.add('fall'), { once: true, passive: true });

  // 1. The opening. The painting fills most of the first screen; Floob stands beside it, notices it,
  //    crouches, leaps in an arc and splashes into the canvas. Then the push-through clip takes over.
  const frame = $('#frame'), dive = $('#dive'), copy = $('.intro-copy'), stage = $('.intro-stage');
  const poses = $$('.pose', dive);
  let curPose = 'idle';
  const setPose = name => { if (name === curPose) return; curPose = name; poses.forEach(p => p.classList.toggle('on', p.dataset.pose === name)); };
  function sizeFrame() {
    const H = stage.clientHeight, phone = small();
    const top = copy.offsetTop + copy.offsetHeight + 14, bottom = phone ? 64 : 62;
    const h0 = phone ? H * 0.42 : H;
    const s0 = phone ? Math.min(0.92, (innerWidth - 28) / innerWidth) : clamp((H - top - bottom) / h0, 0.5, 0.72);
    const centre = top + (H - top - bottom) / 2;
    frame.style.setProperty('--s0', s0.toFixed(4));
    return centre - H / 2;
  }
  let ty0 = sizeFrame();
  frame.style.setProperty('--ty0', ty0 + 'px');
  addEventListener('resize', () => { ty0 = sizeFrame(); ScrollTrigger.refresh(); });

  mm.add({ desk: '(min-width: 861px)', phone: '(max-width: 860px)' }, ctx => {
    const desk = ctx.conditions.desk;
    const home = () => ({ x: dive.offsetLeft + dive.offsetWidth / 2, y: dive.offsetTop + dive.offsetHeight / 2 });
    const target = () => ({ x: stage.clientWidth / 2, y: stage.clientHeight / 2 });
    const dx = () => target().x - home().x, dy = () => target().y - home().y;
    const peak = () => Math.min(0, dy()) - stage.clientHeight * 0.18;
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#intro', start: 'top top', end: desk ? '+=180%' : '+=140%', scrub: 0.6, pin: '.intro-stage', invalidateOnRefresh: true,
      onUpdate: self => {
        const p = self.progress;
        setPose(p < 0.06 ? 'idle' : p < 0.11 ? 'curious' : p < 0.15 ? 'crouch' : p < 0.245 ? 'leap' : 'splash');
      } } });
    tl.to(copy, { y: -60, opacity: 0, duration: 0.1 }, 0)
      .to('.intro-hint', { opacity: 0, duration: 0.05 }, 0)
      .fromTo(frame, { '--ty0': () => ty0 + 'px' }, { '--ty0': '0px', duration: 0.12, ease: 'power1.inOut' }, 0)
      // notice: a small hop
      .to(dive, { y: -26, duration: 0.025, ease: 'power2.out' }, 0.06)
      .to(dive, { y: 0, duration: 0.025, ease: 'power2.in' }, 0.085)
      // anticipation: squash down
      .to(dive, { scaleY: 0.8, scaleX: 1.16, duration: 0.03, ease: 'power2.out' }, 0.115)
      // leap: stretch, then a clean arc into the centre of the canvas (slow out of the crouch, fast through the air)
      .to(dive, { scaleY: 1.18, scaleX: 0.86, duration: 0.02, ease: 'power2.out' }, 0.15)
      .to(dive, { scaleY: 1, scaleX: 1, duration: 0.05 }, 0.17)
      .to(dive, { x: dx, duration: 0.095, ease: 'power1.in' }, 0.15)
      .to(dive, { y: peak, duration: 0.05, ease: 'power2.out' }, 0.15)
      .to(dive, { y: dy, duration: 0.045, ease: 'power2.in' }, 0.2)
      .to(dive, { rotation: 22, duration: 0.095, ease: 'none' }, 0.15)
      // entry: he shrinks into the painting and the canvas ripples
      .to(dive, { scale: 0.08, opacity: 0, duration: 0.045, ease: 'power2.in' }, 0.245)
      // (every ripple tween starts and ends invisible, so scrolling back up never leaves a ring behind)
      .fromTo('.ripple .ring', { scale: 0.2, opacity: 0 }, { scale: desk ? 3.2 : 2, keyframes: { opacity: [0, 0.95, 0.5, 0] }, duration: 0.07, stagger: 0.015, ease: 'power2.out' }, 0.27)
      .fromTo('.ripple i', { x: 0, y: 0, scale: 0.4, opacity: 0 }, { x: i => Math.cos(i / 8 * Math.PI * 2) * (desk ? 200 : 110), y: i => Math.sin(i / 8 * Math.PI * 2) * (desk ? 140 : 80) + 30, scale: 1, keyframes: { opacity: [0, 1, 1, 0] }, duration: 0.08, ease: 'power2.out' }, 0.27)
      // the painting becomes the world
      .to(frame, { '--frame-scale': 1, duration: 0.55, ease: 'power2.inOut' }, 0.32)
      .to('.intro-wall', { scale: 1.6, opacity: 0, duration: 0.55, ease: 'power2.in' }, 0.32)
      .to(frame, { '--border': 0, duration: 0.2 }, 0.68)
      .fromTo('.intro-arrive', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.12 }, 0.8)
      .fromTo('.intro-peek img', { yPercent: 100 }, { yPercent: 0, duration: 0.12, stagger: 0.01, ease: 'back.out(1.6)' }, 0.8);
    if (!desk) return;
    // Desktop: the generated push-through clip, loaded on the first sign of interaction so it never weighs on the first screen.
    // It starts from the moment its painting matches ours (about three seconds in) and fades in as Floob lands.
    const film = $('#introFilm'), FROM = 2.75;
    let ready = false;
    const update = p => {
      if (!ready) return;
      const k = clamp((p - 0.29) / 0.58, 0, 1);
      if (film.duration) film.currentTime = Math.min(film.duration - 0.04, FROM + k * (film.duration - FROM));
      film.style.opacity = p < 0.28 ? 0 : p < 0.31 ? (p - 0.28) / 0.03 : p < 0.9 ? 1 : 0;
    };
    const st = ScrollTrigger.create({ trigger: '#intro', start: 'top top', end: '+=180%', onUpdate: self => update(self.progress) });
    const load = () => {
      ['pointermove', 'wheel', 'touchstart', 'keydown', 'scroll'].forEach(t => removeEventListener(t, load));
      fetch(film.dataset.film).then(r => r.ok ? r.blob() : Promise.reject()).then(b => {
        film.src = URL.createObjectURL(b);
        film.addEventListener('loadeddata', () => { ready = true; update(st.progress); }, { once: true });
      }).catch(() => {});
    };
    ['pointermove', 'wheel', 'touchstart', 'keydown', 'scroll'].forEach(t => addEventListener(t, load, { passive: true }));
    return () => { st.kill(); ['pointermove', 'wheel', 'touchstart', 'keydown', 'scroll'].forEach(t => removeEventListener(t, load)); };
  });

  // 2. Text reveals.
  $$('.reveal-words').forEach(h => {
    h.innerHTML = h.textContent.split(' ').map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
    gsap.from($$('.w > span', h), { yPercent: 110, rotate: 6, duration: 0.7, ease: 'back.out(1.6)', stagger: 0.07, scrollTrigger: { trigger: h, start: 'top 85%' } });
  });
  $$('.reveal').forEach(el => gsap.from(el, { y: 40, opacity: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('.pop').forEach((el, i) => gsap.from(el, { scale: 0.6, opacity: 0, duration: 0.6, ease: 'back.out(2)', delay: (i % 3) * 0.08, scrollTrigger: { trigger: el, start: 'top 90%' } }));

  // 3. Origin: each beat's lines rise in as the beat reaches the middle of the screen; the motto is brushed in last.
  $$('.beat-o').forEach(li => gsap.timeline({ scrollTrigger: { trigger: li, start: 'top 62%' } })
    .from(li, { opacity: 0, duration: 0.3 })
    .from($$('.ln', li), { y: 34, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.18 }, 0));
  const brush = $('.motto .brush path'), blen = brush.getTotalLength();
  gsap.timeline({ scrollTrigger: { trigger: '.motto', start: 'top 80%' } })
    .from('.motto span', { y: 24, opacity: 0, rotate: -3, duration: 0.6, ease: 'back.out(2)' })
    .fromTo(brush, { strokeDasharray: blen, strokeDashoffset: blen }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, 0.3);
  // Floob's birth, scrubbed alongside the three beats: blue and green paint slide together into one teal puddle,
  // the puddle bulges and Floob pops out; on the third beat he leaps off towards Zack's painting.
  {
    const born = $$('.birth-floob'), easel = $('.birth-easel'), idleImg = born[0];
    let bp = 'none';
    const birthPose = name => { if (name === bp) return; bp = name; born.forEach(b => b.classList.toggle('on', b.dataset.pose === name)); };
    gsap.set('.blob-b', { attr: { cx: 70, cy: 300, r: 54 }, fill: '#2f7fd8' });
    gsap.set('.blob-g', { attr: { cx: 330, cy: 300, r: 54 }, fill: '#6cc04a' });
    gsap.set('.puddle-base', { attr: { rx: 1, ry: 1 } });
    gsap.set('.bulge', { attr: { r: 1, cy: 330 } });
    gsap.set(easel, { opacity: 0, scale: 0.7, xPercent: 12, transformOrigin: '50% 100%' });
    const artBox = $('.origin-art');
    // finish exactly when the sticky picture lets go, so every moment is seen while it is still on screen
    const release = () => 'bottom ' + Math.round(parseFloat(getComputedStyle(artBox).top) + artBox.offsetHeight) + 'px';
    const tl = gsap.timeline({ scrollTrigger: { trigger: '.origin-grid', start: 'top 55%', end: release, invalidateOnRefresh: true, scrub: 0.6,
      onUpdate: self => {
        const p = self.progress;
        birthPose(p < 0.47 ? '' : p < 0.66 ? 'idle' : p < 0.71 ? 'crouch' : p < 0.84 ? 'leap' : '');
        idleImg.classList.toggle('settled', p > 0.56 && p < 0.66);
      } } });
    tl.to('.blob-b', { attr: { cx: 182, r: 62 }, duration: 0.24, ease: 'power1.inOut' }, 0)
      .to('.blob-g', { attr: { cx: 218, r: 62 }, duration: 0.24, ease: 'power1.inOut' }, 0)
      .to('.blob-b, .blob-g', { fill: '#1fb5a8', duration: 0.1 }, 0.18)
      .to('.puddle-base', { attr: { rx: 130, ry: 30 }, duration: 0.12, ease: 'power2.out' }, 0.24)
      .to('.blob-b, .blob-g', { attr: { r: 30, cy: 322 }, duration: 0.12, ease: 'power2.in' }, 0.24)
      .to('.bulge', { attr: { r: 50, cy: 262 }, duration: 0.1, ease: 'power2.out' }, 0.36)
      .to('.bulge', { attr: { r: 1, cy: 330 }, duration: 0.06, ease: 'power2.in' }, 0.48)
      .fromTo(idleImg, { scale: 0.1, y: 40 }, { scale: 1.15, y: -30, duration: 0.05, ease: 'power2.out' }, 0.47)
      .to(idleImg, { scale: 1, y: 0, duration: 0.07, ease: 'bounce.out' }, 0.52)
      .to('.puddle-base', { attr: { rx: 90, ry: 18 }, duration: 0.08 }, 0.5)
      .to('.blob-b, .blob-g', { attr: { r: 1 }, duration: 0.06 }, 0.5)
      .fromTo(born[2], { x: 0, y: 0, rotation: 0, scale: 1 }, { keyframes: [
        { x: 60, y: -120, rotation: 12, scale: 0.95, duration: 0.06, ease: 'power2.out' },
        { x: 170, y: -40, rotation: 26, scale: 0.55, duration: 0.07, ease: 'power2.in' }] }, 0.71)
      .to(born[2], { opacity: 0, duration: 0.02 }, 0.82)
      .to('.puddle-base', { attr: { rx: 40, ry: 8 }, duration: 0.1 }, 0.71)
      .to(easel, { opacity: 1, scale: 1, xPercent: 0, duration: 0.1, ease: 'back.out(1.6)' }, 0.8);
  }

  // 4. Each character arrives as a splat of paint, then pops out of it.
  $$('.char').forEach(sec => {
    gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top 65%' } })
      .from($('.char-splat', sec), { scale: 0, rotate: -40, duration: 0.55, ease: 'back.out(1.8)', transformOrigin: '50% 50%' })
      .from($$('.drop', sec), { scale: 0, y: -80, duration: 0.4, stagger: 0.06, ease: 'bounce.out' }, 0.1)
      .from($('.char-img', sec), { scale: 0.2, y: 60, opacity: 0, duration: 0.7, ease: 'elastic.out(1, 0.55)', clearProps: 'transform,opacity' }, 0.25)
      .from($$('.char-text > *', sec), { x: 40, opacity: 0, duration: 0.5, stagger: 0.05, ease: 'power3.out', clearProps: 'transform,opacity' }, 0.3)
      .add(() => sec.classList.add('alive'));
  });

  // 5. Quiddie's drain and the colour coming back. Positions only: Drain decides the greyness from scroll position.
  const qTrig = ScrollTrigger.create({ trigger: '#char-quiddie', start: 'top 85%', end: 'center 55%' });
  const v = $('#restoreVideo');
  v.poster = 'media/colour-poster.webp';
  const vsrc = (small() && v.dataset.scrubSm) || v.dataset.scrub;
  let fetched = false;
  const fetchClip = () => {
    if (fetched) return;
    fetched = true;
    // Load the whole clip into memory first, so scrubbing can jump to any frame (the clip is all keyframes).
    fetch(vsrc).then(r => r.ok ? r.blob() : Promise.reject()).then(b => { v.src = URL.createObjectURL(b); v.load(); }).catch(() => { v.preload = 'auto'; v.src = vsrc; v.load(); });
  };
  ScrollTrigger.create({ trigger: '#restore', start: 'top 400%', onEnter: fetchClip, onEnterBack: fetchClip });
  if (scrollY > innerHeight * 3) fetchClip();
  const seek = t => { if (v.duration) { const want = Math.min(v.duration - 0.05, t * v.duration); if (Math.abs(v.currentTime - want) > 0.01) v.currentTime = want; } };
  let rProg = 0;
  v.addEventListener('loadedmetadata', () => seek(rProg));
  mm.add({ desk: '(min-width: 861px)', phone: '(max-width: 860px)' }, ctx => {
    const prog = { t: 0 };
    const tl = gsap.timeline({ scrollTrigger: { trigger: '#restore', start: 'top top', end: ctx.conditions.desk ? '+=200%' : '+=140%', scrub: true, pin: '.restore-stage', invalidateOnRefresh: true,
      onRefresh: self => Drain.setRanges(qTrig.start, qTrig.end, self.start, self.end) } });
    tl.to(prog, { t: 1, duration: 1, ease: 'none', onUpdate: () => { rProg = prog.t; seek(prog.t); } }, 0)
      .fromTo('.b1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.08 }, 0.02)
      .fromTo('.rq', { yPercent: 105 }, { yPercent: 0, duration: 0.1, ease: 'back.out(1.4)' }, 0.02)
      .to('.b1', { opacity: 0, y: -30, duration: 0.08 }, 0.28)
      .fromTo('.b2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.08 }, 0.32)
      .to('.rq', { keyframes: [{ scaleY: 0.9, scaleX: 1.08, duration: 0.03 }, { yPercent: -8, scaleY: 1.06, scaleX: 0.95, duration: 0.04 }, { xPercent: -160, yPercent: 0, rotation: -12, duration: 0.08 }] }, 0.5)
      .to('.b2', { opacity: 0, y: -30, duration: 0.08 }, 0.55)
      .fromTo('.b3', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.08 }, 0.6)
      // Floob hops in from the left, Bonbon from the right, with squash on every landing
      .fromTo('.rf', { xPercent: -330 }, { xPercent: 0, duration: 0.16, ease: 'none' }, 0.6)
      .fromTo('.rf', { y: 0 }, { keyframes: [
        { y: () => -innerHeight * 0.16, scaleY: 1.1, scaleX: 0.92, duration: 0.04, ease: 'power2.out' }, { y: 0, scaleY: 1, scaleX: 1, duration: 0.04, ease: 'power2.in' },
        { scaleY: 0.82, scaleX: 1.14, duration: 0.012 }, { y: () => -innerHeight * 0.1, scaleY: 1.08, scaleX: 0.94, duration: 0.03, ease: 'power2.out' },
        { y: 0, scaleY: 1, scaleX: 1, duration: 0.03, ease: 'power2.in' }, { scaleY: 0.85, scaleX: 1.12, duration: 0.012 }, { scaleY: 1, scaleX: 1, duration: 0.03, ease: 'back.out(3)' }] }, 0.6)
      .fromTo('.rb', { xPercent: 260 }, { xPercent: 0, duration: 0.16, ease: 'none' }, 0.66)
      .fromTo('.rb', { y: 0 }, { keyframes: [
        { y: () => -innerHeight * 0.14, scaleY: 1.1, scaleX: 0.92, duration: 0.04, ease: 'power2.out' }, { y: 0, scaleY: 1, scaleX: 1, duration: 0.04, ease: 'power2.in' },
        { scaleY: 0.82, scaleX: 1.14, duration: 0.012 }, { y: () => -innerHeight * 0.09, scaleY: 1.08, scaleX: 0.94, duration: 0.03, ease: 'power2.out' },
        { y: 0, scaleY: 1, scaleX: 1, duration: 0.03, ease: 'power2.in' }, { scaleY: 0.85, scaleX: 1.12, duration: 0.012 }, { scaleY: 1, scaleX: 1, duration: 0.03, ease: 'back.out(3)' }] }, 0.66);
  });
  ScrollTrigger.addEventListener('refresh', () => Drain.update());
  addEventListener('scroll', Drain.update, { passive: true });
  addEventListener('resize', Drain.update);

  // 6. Chromia: on desktop, scrolling down walks sideways through the places, with Floob strolling along the bottom.
  mm.add('(min-width: 861px)', () => {
    const track = $('.places'), walker = $('.walker');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const wposes = ['img/poses/floob-walk.webp', 'img/poses/floob-run.webp'];
    let f0 = -1;
    gsap.timeline({ scrollTrigger: { trigger: '.chromia-pin', start: 'top top', end: () => '+=' + dist(), scrub: 0.5, pin: true, invalidateOnRefresh: true,
      onUpdate: self => { const f = Math.floor(self.progress * 18) % 2; if (f !== f0) { f0 = f; walker.src = wposes[f]; } } } })
      .to(track, { x: () => -dist(), ease: 'none' }, 0)
      .fromTo(walker, { x: 0 }, { x: () => innerWidth - 170, ease: 'none' }, 0)
      .fromTo('.place img', { xPercent: -4 }, { xPercent: 4, ease: 'none' }, 0);
  });

  // 7. Licensing arrives as you scroll: each piece plays once, in under a second.
  const once = (trigger, start = 'top 85%') => ({ trigger, start, once: true });
  gsap.from('.proof li', { scale: 0.6, y: 30, opacity: 0, duration: 0.55, ease: 'back.out(2.2)', stagger: 0.1, scrollTrigger: once('.proof') });
  gsap.from('.lic', { y: 60, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1, scrollTrigger: once('.license-grid') });
  gsap.from('.lic img', { scale: 1.18, duration: 0.8, ease: 'power2.out', stagger: 0.1, scrollTrigger: once('.license-grid') });
  gsap.from('.get-list li', { x: -30, opacity: 0, duration: 0.45, ease: 'back.out(2)', stagger: 0.15, scrollTrigger: once('.get-list') });
  {
    const tl = gsap.timeline({ scrollTrigger: once('.steps') });
    $$('.steps li').forEach((li, i) => tl.from(li, { x: 20, opacity: 0, duration: 0.25, ease: 'power2.out' }, i * 0.22).from($('span', li), { scale: 0, rotate: -90, duration: 0.3, ease: 'back.out(2.5)' }, i * 0.22));
  }
  gsap.fromTo('.license-cta > *', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'bounce.out', stagger: 0.12, clearProps: 'transform,opacity', scrollTrigger: once('.license-cta', 'top 92%') });
  gsap.from('.license-cast', { yPercent: 60, duration: 0.9, ease: 'back.out(1.3)', scrollTrigger: once('.license-cast', 'top bottom') });

  // Paint-drip edges grow down as each section arrives.
  $$('.drip-top').forEach(s => gsap.fromTo(s, { '--drip-h': '0px' }, { '--drip-h': '70px', ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'top 40%', scrub: true } }));

  // Photo tiles drift slightly for depth.
  $$('.tile img').forEach(img => gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true } }));

  addEventListener('load', () => ScrollTrigger.refresh());
}
