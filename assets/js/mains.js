/* =========================================================
   Suresh Gugal — Portfolio interactions
   GSAP + ScrollTrigger for motion; everything degrades
   gracefully if the CDN scripts fail to load.
   ========================================================= */
(function () {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Year ---------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Text splitting (own lightweight splitter) ---------- */
  function splitChars(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(w =>
      '<span class="w" aria-hidden="true" style="display:inline-block;white-space:nowrap">' +
      [...w].map(c => '<span class="c" style="display:inline-block">' + c.replace('&', '&amp;') + '</span>').join('') +
      '</span>'
    ).join(' ');
    return $$('.c', el);
  }
  function wrapLines(el) {
    $$('.split-line', el).forEach(line => {
      const inner = document.createElement('span');
      inner.className = 'line-inner';
      while (line.firstChild) inner.appendChild(line.firstChild);
      line.appendChild(inner);
    });
    return $$('.line-inner', el);
  }

  /* ---------- Preloader → intro ---------- */
  const preloader = $('.preloader');
  const heroTitle = $('.hero__title');
  const heroLines = heroTitle ? wrapLines(heroTitle) : [];

  function intro() {
    if (!hasGSAP || reduceMotion) {
      if (preloader) preloader.remove();
      $$('.reveal-up').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }
    const tl = gsap.timeline();
    if (preloader) {
      tl.to(preloader, { yPercent: -100, duration: 0.9, ease: 'expo.inOut', delay: 0.4, onComplete: () => preloader.remove() });
    }
    tl.from(heroLines, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, '-=0.35')
      .to('.hero .reveal-up', { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, '-=0.9')
      .from('.hero__tags li', { opacity: 0, y: 20, duration: 0.6, stagger: 0.06, ease: 'power2.out' }, '-=0.6')
      .from('.header', { yPercent: -100, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=1');
  }
  if (document.readyState === 'complete') intro();
  else window.addEventListener('load', intro);
  // Safety net if the load event is slow (large remote images)
  setTimeout(() => { if (document.body.contains(preloader)) { preloader.remove(); $$('.reveal-up').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; }); } }, 6000);

  /* ---------- Scroll animations ---------- */
  if (hasGSAP && !reduceMotion) {
    gsap.registerPlugin(ScrollTrigger);

    // Section reveal (hero handled by intro)
    $$('.reveal-up').filter(el => !el.closest('.hero')).forEach(el => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // Character-by-character headings
    $$('.split-chars').forEach(el => {
      const chars = splitChars(el);
      gsap.from(chars, {
        yPercent: 100, opacity: 0, rotate: 8, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.025,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    // Project cards
    gsap.utils.toArray('.card').forEach((card, i) => {
      gsap.from(card, {
        y: 80, opacity: 0, duration: 1, ease: 'power3.out', delay: (i % 3) * 0.08,
        scrollTrigger: { trigger: card, start: 'top 92%' }
      });
    });

    // Skill rows
    gsap.from('.skill', {
      x: -60, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.skill-list', start: 'top 80%' }
    });

    // Parallax touches
    gsap.to('.hero__glow', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__title', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.from('.footer__word', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer__word', start: 'top bottom', end: 'bottom bottom', scrub: true } });

    // Counters
    $$('[data-count]').forEach(el => {
      const target = +el.dataset.count;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
        onUpdate: () => { el.textContent = String(Math.round(obj.v)).padStart(2, '0'); }
      });
    });
  } else {
    $$('[data-count]').forEach(el => { el.textContent = String(el.dataset.count).padStart(2, '0'); });
  }

  /* ---------- Sticky header + active nav ---------- */
  const header = $('.header');
  const onScroll = () => header.classList.toggle('is-stuck', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const navLinks = $$('.nav__link');
  const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  }

  /* ---------- Mobile menu ---------- */
  const burger = $('.burger');
  const menu = $('#mobile-menu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- Custom cursor + magnetic buttons ---------- */
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && !reduceMotion) {
    document.body.classList.add('has-cursor');
    const ring = $('.cursor'), dot = $('.cursor-dot');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    });
    (function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(loop);
    })();
    $$('a, button, .skill').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
    });

    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.3;
        const y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- Project filters ---------- */
  const filters = $$('.filter');
  const cards = $$('.card');
  filters.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filters.forEach(b => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-selected', b === btn); });
    cards.forEach(c => c.classList.toggle('is-hidden', f !== 'all' && c.dataset.cat !== f));
    if (hasGSAP && !reduceMotion) {
      gsap.fromTo(cards.filter(c => !c.classList.contains('is-hidden')),
        { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' });
      ScrollTrigger.refresh();
    }
  }));

  /* ---------- Lightbox ---------- */
  const lb = $('.lightbox');
  const lbImg = $('img', lb), lbCap = $('figcaption', lb);
  let group = [], index = 0, lastFocus = null;

  function show(i) {
    index = (i + group.length) % group.length;
    const a = group[index];
    lbImg.src = a.getAttribute('href');
    lbImg.alt = a.dataset.title || '';
    lbCap.textContent = a.dataset.title || '';
  }
  function open(a) {
    group = $$('[data-lightbox]').filter(x => !x.closest('.card.is-hidden'));
    lastFocus = document.activeElement;
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    show(group.indexOf(a));
    document.body.style.overflow = 'hidden';
    $('.lightbox__close', lb).focus();
  }
  function close() {
    lb.classList.remove('is-open');
    setTimeout(() => { lb.hidden = true; lbImg.src = ''; }, 300);
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  $$('[data-lightbox]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); open(a); }));
  $('.lightbox__close', lb).addEventListener('click', close);
  $('.lightbox__prev', lb).addEventListener('click', () => show(index - 1));
  $('.lightbox__next', lb).addEventListener('click', () => show(index + 1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
})();
