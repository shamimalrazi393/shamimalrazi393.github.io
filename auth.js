/* ============================================================
   auth.js — author panel: sign in, section visibility, upload gate

   This is a convenience panel, not a security boundary. The ID and
   password live in config.js, which every visitor can download. It
   keeps the page tidy for you; it does not protect anything.
   ============================================================ */

const LS = {
  loggedIn:   'authorLoggedIn',
  loginTime:  'authorLoginTime',
  visibility: 'sectionVisibility',
  theme:      'theme'
};

/* ---------- Session ---------- */
function isLoggedIn() {
  if (localStorage.getItem(LS.loggedIn) !== 'true') return false;
  const since = Date.now() - Number(localStorage.getItem(LS.loginTime) || 0);
  return since < window.SITE.auth.sessionMinutes * 60 * 1000;
}

function authorLogin(event) {
  event.preventDefault();
  const id   = $('#auth-id').value.trim();
  const pass = $('#auth-pass').value;

  if (id === window.SITE.auth.id && pass === window.SITE.auth.password) {
    localStorage.setItem(LS.loggedIn, 'true');
    localStorage.setItem(LS.loginTime, String(Date.now()));
    showAuthorPanel();
    toast('Signed in.', 'success');
    scheduleLogout();
  } else {
    $('#auth-error').textContent = 'That ID or password is not right.';
    $('#auth-pass').value = '';
    $('#auth-pass').classList.add('shake');
    setTimeout(() => $('#auth-pass').classList.remove('shake'), 350);
  }
}

function authorLogout(quiet) {
  localStorage.removeItem(LS.loggedIn);
  localStorage.removeItem(LS.loginTime);
  hideAuthorPanel();
  if (!quiet) toast('Signed out.', 'info');
}

let logoutTimer = null;
function scheduleLogout() {
  clearTimeout(logoutTimer);
  const elapsed   = Date.now() - Number(localStorage.getItem(LS.loginTime) || 0);
  const remaining = window.SITE.auth.sessionMinutes * 60 * 1000 - elapsed;
  if (remaining > 0) {
    logoutTimer = setTimeout(() => {
      toast('Session expired — please sign in again.', 'info');
      authorLogout(true);
    }, remaining);
  }
}

function showAuthorPanel() {
  $('#auth-login').style.display = 'none';
  $('#auth-panel').style.display = 'block';
  $('#auth-error').textContent = '';
  buildToggles();
  const manage = $('#manage-link');
  if (manage) manage.href = window.SITE.services.manage;
}

function hideAuthorPanel() {
  $('#auth-login').style.display = 'block';
  $('#auth-panel').style.display = 'none';
  const pass = $('#auth-pass');
  if (pass) pass.value = '';
}

/* ---------- Section visibility ----------
   Saved to this browser only. It hides a section from the page and
   dims it in the nav; it does not remove the content from the repo. */
function getVisibility() {
  try { return JSON.parse(localStorage.getItem(LS.visibility) || '{}'); }
  catch { return {}; }
}

function buildToggles() {
  const grid = $('#toggle-grid');
  if (!grid) return;
  const saved = getVisibility();

  grid.innerHTML = '';
  window.SITE.nav.forEach(item => {
    const on  = saved[item.id] !== false;
    const btn = el('button', 'toggle' + (on ? ' on' : ''),
      `<span class="toggle-switch"></span><span>${esc(item.label)}</span>`);
    btn.type = 'button';
    btn.dataset.section = item.id;
    btn.setAttribute('aria-pressed', String(on));
    btn.addEventListener('click', () => {
      btn.classList.toggle('on');
      btn.setAttribute('aria-pressed', String(btn.classList.contains('on')));
    });
    grid.appendChild(btn);
  });
}

function saveVisibility() {
  const grid = $('#toggle-grid');
  if (!grid) return;
  const settings = {};
  $$('.toggle', grid).forEach(btn => {
    settings[btn.dataset.section] = btn.classList.contains('on');
  });
  localStorage.setItem(LS.visibility, JSON.stringify(settings));
  applyVisibility();
  toast('Visibility saved for this browser.', 'success');
}

function applyVisibility() {
  const saved = getVisibility();
  window.SITE.nav.forEach(item => {
    const visible = saved[item.id] !== false;
    const section = document.getElementById(item.id);
    if (section) section.classList.toggle('is-hidden', !visible);
    $$(`[data-nav="${item.id}"]`).forEach(link => {
      link.classList.toggle('is-hidden-section', !visible);
      link.style.display = visible ? '' : 'none';
    });
  });
}

function resetVisibility() {
  localStorage.removeItem(LS.visibility);
  applyVisibility();
  buildToggles();
  toast('All sections are visible again.', 'info');
}

/* ---------- Secure upload gate ---------- */
function openUploadModal() {
  $('#upload-overlay').classList.add('open');
  $('#upload-pass').value = '';
  $('#upload-error').textContent = '';
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#upload-pass').focus(), 60);
}

function closeUploadModal() {
  $('#upload-overlay').classList.remove('open');
  document.body.style.overflow = '';
}

function verifyUpload(event) {
  event.preventDefault();
  const pass = $('#upload-pass').value;
  const err  = $('#upload-error');

  if (!pass) { err.textContent = 'Enter the password.'; return; }

  if (pass !== window.SITE.auth.uploadPassword) {
    err.textContent = 'Incorrect password.';
    $('#upload-pass').value = '';
    $('#upload-pass').classList.add('shake');
    setTimeout(() => $('#upload-pass').classList.remove('shake'), 350);
    return;
  }

  window.open(window.SITE.services.upload, '_blank', 'noopener');
  closeUploadModal();
}
