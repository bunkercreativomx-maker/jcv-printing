(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // Year
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  // Nav border once the page scrolls (sentinel, no scroll listener)
  const nav = $('.nav');
  const sentinel = document.createElement('div');
  sentinel.style.cssText = 'position:absolute;top:0;height:1px;width:1px';
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);

  // Mobile menu
  const toggle = $('.nav__toggle'), menu = $('#mobile-menu');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open; menu.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  matchMedia('(min-width: 1024px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  // Reveal on scroll with short stagger among siblings entering together
  const io = new IntersectionObserver((entries) => {
    let i = 0;
    entries.filter(e => e.isIntersecting).forEach(e => {
      e.target.style.setProperty('--d', `${Math.min(i++, 5) * 60}ms`);
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));

  // Hide floating call button while the quote/visit section is on screen
  const fab = $('.fab'), quote = $('#quote');
  if (fab && quote) new IntersectionObserver(([e]) => fab.classList.toggle('is-hidden', e.isIntersecting), { threshold: 0.15 }).observe(quote);
  const heroCtas = $('.hero__ctas');
  if (fab && heroCtas) { fab.classList.add('is-early'); new IntersectionObserver(([e]) => fab.classList.toggle('is-early', e.isIntersecting || e.boundingClientRect.top > 0), { threshold: 0 }).observe(heroCtas); }

  // Preselect service from CTA
  $$('[data-service]').forEach(a => a.addEventListener('click', () => { $('#f-service').value = a.dataset.service; }));

  function sendText(body, statusEl) {
    const sep = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? '&' : '?';
    const href = `sms:+19157042300${sep}body=${encodeURIComponent(body)}`;
    if (matchMedia('(pointer: coarse)').matches) {
      statusEl.innerHTML = 'Opening your messages app. If nothing opens, <a href="tel:+19157042300">call 915.704.2300</a>.';
      location.href = href;
    } else {
      statusEl.innerHTML = 'On a computer? Text these details to <a href="sms:+19157042300">915.704.2300</a> from your phone, or <a href="tel:+19157042300">call us</a>.';
      navigator.clipboard?.writeText(body).then(() => { statusEl.innerHTML += ' Your message was copied.'; }).catch(() => {});
    }
  }

  // Quote form -> prefilled SMS to the shop
  const form = $('#quote-form'), status = $('#form-status'), F = form.elements;
  const showErr = (input, errId, bad) => {
    input.setAttribute('aria-invalid', String(bad));
    $(errId).hidden = !bad;
    if (bad) input.setAttribute('aria-describedby', errId.slice(1)); else input.removeAttribute('aria-describedby');
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = F.name.value.trim(), phone = F.phone.value.trim();
    const badName = !name, badPhone = phone.replace(/\D/g, '').length < 10;
    showErr(F.name, '#e-name', badName); showErr(F.phone, '#e-phone', badPhone);
    if (badName) return F.name.focus();
    if (badPhone) return F.phone.focus();
    const body = `Hi JCV Printing, I'd like a quote.\nName: ${name}\nPhone: ${phone}\nService: ${F.service.value}` + (F.details.value.trim() ? `\nDetails: ${F.details.value.trim()}` : '');
    sendText(body, status);
  });

  // ---------- Websites: portfolio tabs + auto-scrolling preview ----------
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stage = $('.work__stage'), full = $('#work-full'), mob = $('#work-mobile'), host = $('#work-host'), live = $('#work-live');
  const tabs = $$('.work__tab');
  let anim = null;
  const startScroll = () => {
    if (anim) anim.cancel();
    if (reduce || !full.complete || !full.naturalWidth) return;
    const screen = full.parentElement;
    const dist = full.getBoundingClientRect().height - screen.getBoundingClientRect().height;
    if (dist < 40) return;
    anim = full.animate([
      { transform: 'translateY(0)', offset: 0 },
      { transform: 'translateY(0)', offset: 0.08 },
      { transform: `translateY(${-dist}px)`, offset: 0.92 },
      { transform: `translateY(${-dist}px)`, offset: 1 }
    ], { duration: Math.max(9000, dist * 9), iterations: Infinity, direction: 'alternate', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
  };
  if (stage) {
    full.addEventListener('load', startScroll);
    if (full.complete) startScroll();
    stage.addEventListener('pointerenter', () => anim && anim.pause());
    stage.addEventListener('pointerleave', () => anim && anim.play());
    const visIO = new IntersectionObserver(([e]) => { if (anim) e.isIntersecting ? anim.play() : anim.pause(); });
    visIO.observe(stage);
    let resizeT; addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(startScroll, 200); });
  }

  // ---------- Websites: free check quiz ----------
  const quiz = $('#quiz');
  if (quiz) {
    const boxes = $$('input', quiz), fill = $('#score-fill'), num = $('#score-num'), msg = $('#score-msg');
    const msgs = [
      'Every box you leave empty is a customer going to someone else.',
      'A start. Most customers still cannot find or reach you online.',
      'A start. Most customers still cannot find or reach you online.',
      'Halfway there. A few fixes could bring in more calls.',
      'Good base. A couple of gaps are still costing you calls.',
      'Almost there. Let us find the last gap.',
      'Strong. Want us to confirm it is really working?'
    ];
    const update = () => {
      const c = boxes.filter(b => b.checked).length;
      fill.style.transform = `scaleX(${Math.max(0.02, c / boxes.length)})`;
      num.textContent = `${c} of ${boxes.length}`; msg.textContent = msgs[c];
    };
    boxes.forEach(b => b.addEventListener('change', update));
  }
  $$('[data-pkg]').forEach(a => a.addEventListener('click', () => { const p = $('#c-pkg'); if (p) p.value = a.dataset.pkg; }));

  const cform = $('#check-form');
  if (cform) {
    const C = cform.elements, cstatus = $('#check-status');
    cform.addEventListener('submit', (e) => {
      e.preventDefault();
      const biz = C.biz.value.trim(), phone = C.phone.value.trim(), link = C.link.value.trim();
      const badBiz = !biz, badPhone = phone.replace(/\D/g, '').length < 10;
      showErr(C.biz, '#ce-biz', badBiz); showErr(C.phone, '#ce-phone', badPhone);
      if (badBiz) return C.biz.focus();
      if (badPhone) return C.phone.focus();
      const have = $$('#quiz input:checked').map(b => b.parentElement.textContent.trim());
      const body = `Hi JCV Printing, I'd like a free website check.\nBusiness: ${biz}\nPhone: ${phone}` +
        (link ? `\nWebsite/Facebook: ${link}` : '\nNo website yet') +
        (C.pkg.value ? `\nInterested in: ${C.pkg.value}` : '') +
        `\nChecklist: ${have.length}/6` + (have.length ? ` (${have.join(', ')})` : '');
      sendText(body, cstatus);
    });
  }
})();
