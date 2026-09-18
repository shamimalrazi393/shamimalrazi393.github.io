/* ============================================================
   main.js — theme, scroll behaviour, nav state, boot sequence
   ============================================================ */

/* ---------- Theme ---------- */
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem(LS.theme, dark ? 'dark' : 'light');
  $$('[data-theme-icon]').forEach(i => {
    i.className = dark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  });
  const label = $('#theme-label');
  if (label) label.textContent = dark ? 'Light mode' : 'Dark mode';
}

function toggleTheme() {
  applyTheme(document.documentElement.getAttribute('data-theme') !== 'dark');
}

/* ---------- Reading progress + back-to-top ---------- */
function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;

  const line = $('#progress-line');
  if (line) line.style.width = pct + '%';

  const top = $('#to-top');
  if (top) top.classList.toggle('show', window.scrollY > 500);
}

/* ---------- Which nav item is current ---------- */
function setupScrollSpy() {
  const sections = window.SITE.nav
    .map(n => document.getElementById(n.id))
    .filter(Boolean);
  if (!sections.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      $$('[data-nav]').forEach(link => {
        link.classList.toggle('active', link.dataset.nav === id);
      });
      /* Keep the active chip in view on the mobile bar */
      const chip = $(`#topbar-scroll [data-nav="${id}"]`);
      if (chip && window.innerWidth <= 1000) {
        chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
      }
    });
  }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
}

/* ---------- Reveal on scroll ----------
   Sections fade up as they arrive, and their direct children follow in
   sequence so a list assembles rather than snapping into place.
   The hero is excluded — it runs its own entrance on load. */
function setupReveal() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const section = entry.target;
      section.classList.add('shown');

      if (!reduced) {
        $$('.stagger > *', section).forEach((child, i) => {
          child.style.transitionDelay = Math.min(i * 55, 440) + 'ms';
          child.classList.add('shown');
        });
      }

      if (section.id === 'skills') animateSkills();
      observer.unobserve(section);
    });
  }, { threshold: .06, rootMargin: '0px 0px -40px 0px' });

  $$('.section').forEach(section => {
    if (section.classList.contains('hero')) return;
    section.classList.add('reveal');
    if (!reduced) $$('.stagger > *', section).forEach(c => c.classList.add('reveal-child'));
    observer.observe(section);
  });
}

/* ---------- Wire up every listener ---------- */
function bindEvents() {
  /* Theme */
  $$('[data-action="theme"]').forEach(b => b.addEventListener('click', toggleTheme));

  /* Smooth scroll for nav links (delegated — nav is built at runtime) */
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-nav]');
    if (!link) return;
    e.preventDefault();
    const target = document.getElementById(link.dataset.nav);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${link.dataset.nav}`);
    }
  });

  /* Back to top */
  const top = $('#to-top');
  if (top) top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* Scroll */
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Reader modal */
  $('#reader-close')?.addEventListener('click', closeReader);
  $('#reader-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'reader-overlay') closeReader();
  });
  $$('[data-reader]').forEach(b =>
    b.addEventListener('click', () => readerAction(b.dataset.reader)));
  $('#reader-prev')?.addEventListener('click', () => readerStep(-1));
  $('#reader-next')?.addEventListener('click', () => readerStep(1));

  /* Upload modal */
  $('#open-upload')?.addEventListener('click', openUploadModal);
  $('#upload-close')?.addEventListener('click', closeUploadModal);
  $('#upload-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'upload-overlay') closeUploadModal();
  });
  $('#upload-form')?.addEventListener('submit', verifyUpload);

  /* Keyboard: Escape closes, arrows step through the reader */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeReader(); closeUploadModal(); return; }
    if (!$('#reader-overlay')?.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  { e.preventDefault(); readerStep(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); readerStep(1); }
  });

  /* Forms */
  $('#contact-form')?.addEventListener('submit', sendMessage);
  $('#auth-form')?.addEventListener('submit', authorLogin);

  /* Author panel buttons */
  $('#auth-logout')?.addEventListener('click', () => authorLogout());
  $('#save-visibility')?.addEventListener('click', saveVisibility);
  $('#reset-visibility')?.addEventListener('click', resetVisibility);
  $('#diag-btn')?.addEventListener('click', runDiagnostics);
}

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  if (!window.SITE) {
    document.body.innerHTML =
      '<p style="padding:40px;font-family:sans-serif">config.js failed to load.</p>';
    return;
  }

  /* Theme: saved choice, else follow the operating system */
  const saved = localStorage.getItem(LS.theme);
  applyTheme(saved ? saved === 'dark'
                   : window.matchMedia('(prefers-color-scheme: dark)').matches);

  /* Content that comes straight from config.js */
  renderNav();
  renderIdentity();
  renderResume();
  renderSkills();

  /* Author state */
  if (isLoggedIn()) { showAuthorPanel(); scheduleLogout(); }
  else { authorLogout(true); }
  applyVisibility();

  /* Footer year */
  $$('.js-year').forEach(n => n.textContent = new Date().getFullYear());

  bindEvents();
  bindPalette();
  setupScrollSpy();
  setupReveal();
  onScroll();

  /* Everything that needs the network */
  loadAllSections();

  /* Jump to a hash if the page was opened with one */
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target) setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 240);
  }
});
