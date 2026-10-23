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
    const sep = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) ? '&' : '?';
    const href = `sms:+19157042300${sep}body=${encodeURIComponent(body)}`;
    const mobile = matchMedia('(pointer: coarse)').matches;
    if (mobile) {
      status.innerHTML = 'Opening your messages app. If nothing opens, <a href="tel:+19157042300">call 915.704.2300</a>.';
      location.href = href;
    } else {
      status.innerHTML = 'On a computer? Text these details to <a href="sms:+19157042300">915.704.2300</a> from your phone, or <a href="tel:+19157042300">call us</a>.';
      navigator.clipboard?.writeText(body).then(() => { status.innerHTML += ' Your message was copied.'; }).catch(() => {});
    }
  });
})();
