/* ============================================================
   sections.js — renders everything that comes from config.js,
                 builds the tabbed collections, wires the sections
   ============================================================ */

/* ---------- Navigation ---------- */
function renderNav() {
  const html = window.SITE.nav.map(item =>
    `<a href="#${item.id}" class="side-link" data-nav="${item.id}">
       <i class="${item.icon}"></i><span>${esc(item.label)}</span>
     </a>`).join('');
  const side = $('#side-nav'), top = $('#topbar-scroll');
  if (side) side.innerHTML = html;
  if (top)  top.innerHTML  = html;
}

/* ---------- Identity ---------- */
function renderIdentity() {
  const p = window.SITE.profile;

  $$('[data-bind="name"]').forEach(n => n.textContent = p.name);
  $$('[data-bind="role"]').forEach(n => n.textContent = p.role);
  $$('[data-bind="photo"]').forEach(n => { n.src = p.photo; n.alt = p.name; });

  const first = $('#hero-first');
  if (first) first.textContent = p.firstName + '.';
  const tagline = $('#hero-tagline');
  if (tagline) tagline.textContent = p.tagline;

  const chips = $('#focus-chips');
  if (chips) chips.innerHTML = (p.focus || [])
    .map(f => `<span class="chip">${esc(f)}</span>`).join('');

  const heroMeta = $('#hero-meta');
  if (heroMeta) heroMeta.innerHTML = `
    <span><i class="fa-solid fa-envelope"></i>
      <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></span>
    <span><i class="fa-solid fa-phone"></i>
      <a href="tel:${esc(p.phone.replace(/\s/g, ''))}">${esc(p.phone)}</a></span>
    <span><i class="fa-solid fa-location-dot"></i>${esc(p.location)}</span>`;

  const orgTag = $('#hero-org');
  if (orgTag) orgTag.innerHTML =
    `<img src="${esc(p.logo)}" alt="" onerror="this.remove()">
     <span class="dot"></span>${esc(p.role)} · ${esc(p.orgShort)}`;

  const sideOrg = $('#side-org');
  if (sideOrg) sideOrg.innerHTML =
    `<img src="${esc(p.logo)}" alt="" onerror="this.remove()">${esc(p.orgShort)}`;

  const socials = p.socials.map(s =>
    `<a href="${esc(s.url)}" target="_blank" rel="noopener"
        title="${esc(s.label)}" aria-label="${esc(s.label)}"><i class="${s.icon}"></i></a>`).join('');
  $$('[data-bind="socials"]').forEach(n => n.innerHTML = socials);

  const bio = $('#about-bio');
  if (bio) bio.innerHTML = `<p>${p.bio}</p><p>${p.bio2}</p>`;

  const aboutImg = $('#about-photo');
  if (aboutImg) { aboutImg.src = p.aboutPhoto; aboutImg.alt = p.name; }

  const facts = $('#about-facts');
  if (facts) facts.innerHTML = `
    <div class="fact"><dt>Department</dt><dd>MME</dd></div>
    <div class="fact"><dt>Institution</dt><dd>${esc(p.orgShort)}</dd></div>
    <div class="fact"><dt>Location</dt><dd>${esc(p.location)}</dd></div>
    <div class="fact"><dt>Focus</dt><dd>Materials · AI</dd></div>`;

  const card = $('#contact-card');
  if (card) card.innerHTML = `
    <div class="contact-line"><i class="fa-solid fa-envelope"></i>
      <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>
    <div class="contact-line"><i class="fa-solid fa-phone"></i>
      <a href="tel:${esc(p.phone.replace(/\s/g, ''))}">${esc(p.phone)}</a></div>
    <div class="contact-line"><i class="fa-solid fa-location-dot"></i>
      <span>${esc(p.location)}</span></div>
    <div class="contact-line"><i class="fa-solid fa-building-columns"></i>
      <span>${esc(p.org)}<small>Department of Materials and Metallurgical Engineering</small></span></div>`;

  /* The rotating image. If the file is missing the stage is removed AND
     the grid is told to collapse to one column — otherwise its 300px
     track would stay behind as empty space squeezing the text. */
  const spin = $('#rotating-image');
  if (spin) {
    spin.src = p.rotatingImage || 'rotating.png';
    spin.alt = '';
    spin.style.animationDuration = (p.rotateSeconds || 9) + 's';
    if (p.alwaysRotate) spin.classList.add('always-rotate');
    spin.addEventListener('error', () => {
      $('#hero-model')?.remove();
      $('.hero-grid')?.classList.add('no-model');
    });
  }

  const yt = $('#yt-link'), fb = $('#fb-link');
  if (yt) yt.href = window.SITE.youtube.channel;
  if (fb) fb.href = window.SITE.youtube.facebook;

  document.title = `${p.name} — ${p.role}`;
}

/* ---------- Hero stats ----------
   Filled in as the collections finish loading. */
function updateStats() {
  const strip = $('#hero-stats');
  if (!strip) return;

  const count = keys => keys.reduce((sum, k) => {
    const c = COLLECTIONS[k];
    return sum + (c && c.allFiles ? c.allFiles.length : 0);
  }, 0);

  const stats = [
    { n: count(['publications', 'research']), label: 'Publications & research' },
    { n: count(['poster', 'project', 'presentation', 'lab']), label: 'Academic works' },
    { n: count(['certificates', 'honors']), label: 'Certificates & honors' },
    { n: count(['poem', 'song', 'travel', 'article', 'story']), label: 'Written pieces' }
  ].filter(s => s.n > 0);

  if (!stats.length) { strip.innerHTML = ''; return; }

  strip.innerHTML = stats.map(s => `
    <div class="stat">
      <span class="stat-n" data-to="${s.n}">0</span>
      <span class="stat-l">${esc(s.label)}</span>
    </div>`).join('');

  $$('.stat-n', strip).forEach(node => {
    const target = +node.dataset.to;
    let current = 0;
    const step = Math.max(1, Math.round(target / 18));
    const timer = setInterval(() => {
      current = Math.min(target, current + step);
      node.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 32);
  });
}

/* ---------- Resume ---------- */
function renderResume() {
  const build = items => items.map(i => `
    <div class="tl-item">
      <div class="tl-date">${esc(i.date)}</div>
      <div class="tl-title">${esc(i.title)}</div>
      <div class="tl-meta">${esc(i.meta)}</div>
    </div>`).join('');
  const ed = $('#education-list'), ex = $('#experience-list');
  if (ed) ed.innerHTML = build(window.SITE.education);
  if (ex) ex.innerHTML = build(window.SITE.experience);
}

/* ---------- Skills ---------- */
function renderSkills() {
  const box = $('#skill-list');
  if (!box) return;
  box.innerHTML = window.SITE.skills.map(s => `
    <div class="skill">
      <div class="skill-name">${esc(s.name)}</div>
      <div class="skill-track"><div class="skill-fill" data-level="${s.level}"></div></div>
      <div class="skill-tag">${esc(s.tag)}</div>
    </div>`).join('');
}

function animateSkills() {
  $$('#skill-list .skill-fill').forEach((bar, i) => {
    setTimeout(() => { bar.style.width = bar.dataset.level + '%'; }, i * 70);
  });
}

/* ---------- Written entries (publications / research / work) ---------- */
function renderEntries(key, containerId) {
  const box = document.getElementById(containerId);
  if (!box) return 0;
  const entries = window.SITE[key] || [];
  if (!entries.length) { box.innerHTML = ''; return 0; }

  box.innerHTML = entries.map((e, i) => {
    const title = e.url
      ? `<a class="entry-title" href="${esc(e.url)}" target="_blank" rel="noopener">${esc(e.title)}</a>`
      : `<div class="entry-title">${esc(e.title)}</div>`;
    return `<div class="entry">
      <div class="entry-num">${String(i + 1).padStart(2, '0')}</div>
      <div>${title}
        ${e.venue   ? `<div class="entry-venue">${esc(e.venue)}</div>` : ''}
        ${e.summary ? `<div class="entry-summary">${esc(e.summary)}</div>` : ''}
        ${e.url ? `<a class="entry-link" href="${esc(e.url)}" target="_blank" rel="noopener">
                     <i class="fa-solid fa-arrow-up-right-from-square"></i> View</a>` : ''}
      </div></div>`;
  }).join('');
  return entries.length;
}

/* ============================================================
   STACKED SUBSECTIONS
   Each Drive folder is its own block, one below the next, with a
   count in the sub-heading.
   ============================================================ */
function loadSubsections(list) {
  list.forEach(({ key, label }) => {
    const coll = new Collection(key, `coll-${key}`, { label });
    coll.onDone = () => {
      const badge = document.querySelector(`[data-count="${key}"]`);
      if (badge && coll.allFiles) badge.textContent = coll.allFiles.length || '';
    };
    coll.schedule();
  });
}

/* ---------- YouTube ---------- */
function loadVideos(showAll = false) {
  const box = $('#video-grid');
  const btn = $('#videos-more');
  if (!box) return;

  const yt = window.SITE.youtube;
  if (!yt.apiKey || !yt.channelId) { box.innerHTML = stateEmpty('YouTube is not configured.'); return; }

  box.innerHTML = skeletonGrid(2);

  const max = showAll ? 12 : 4;
  fetch(`https://www.googleapis.com/youtube/v3/search?key=${yt.apiKey}` +
        `&channelId=${yt.channelId}&part=snippet,id&order=date&type=video&maxResults=${max}`)
    .then(r => { if (!r.ok) throw new Error(`YouTube ${r.status}`); return r.json(); })
    .then(data => {
      const videos = (data.items || []).filter(v => v.id && v.id.videoId);
      if (!videos.length) { box.innerHTML = stateEmpty('No videos found.'); return; }
      box.innerHTML = '';
      box.className = 'video-grid';
      videos.forEach(v => {
        const frame = document.createElement('iframe');
        frame.src = `https://www.youtube.com/embed/${v.id.videoId}`;
        frame.title = v.snippet?.title || 'Video';
        frame.loading = 'lazy';
        frame.allowFullscreen = true;
        frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        box.appendChild(frame);
      });
      if (btn) { btn.style.display = showAll ? 'none' : 'inline-flex'; btn.onclick = () => loadVideos(true); }
    })
    .catch(() => {
      box.innerHTML = stateError(
        `Couldn't load videos — the API key may be restricted or out of quota. ` +
        `<a href="${esc(yt.channel)}" target="_blank" rel="noopener" style="text-decoration:underline">Open the channel</a> instead.`);
    });
}

/* ---------- Contact form ---------- */
async function sendMessage(event) {
  event.preventDefault();
  const name    = $('#cf-name').value.trim();
  const email   = $('#cf-email').value.trim();
  const subject = $('#cf-subject').value.trim();
  const message = $('#cf-message').value.trim();
  const errBox  = $('#cf-error');
  errBox.textContent = '';

  if (!name || !email || !subject || !message) { errBox.textContent = 'Please fill in every field.'; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errBox.textContent = 'That email address does not look right.'; return; }

  const btn = $('#cf-submit'), orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-circle-notch spin"></i> Sending…';

  try {
    /* mode:'no-cors' means the response is opaque — Apps Script sends no
       CORS headers on a plain doPost. The request does arrive; we simply
       cannot read the result, so mailto is offered as a fallback. */
    await fetch(window.SITE.services.email, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ name, email, subject, message, timestamp: new Date().toISOString() })
    });
    toast('Message sent. I will get back to you soon.', 'success');
    $('#contact-form').reset();
  } catch {
    const p = window.SITE.profile;
    errBox.innerHTML = `Could not reach the mail service. ` +
      `<a href="mailto:${esc(p.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}" style="text-decoration:underline">Send it by email instead</a>.`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ============================================================
   LOAD EVERY SECTION
   ============================================================ */
function loadAllSections() {
  /* Publications / research / work: written entries, then the folder */
  [['publications', 'Publications'], ['research', 'Research Experience'], ['work', 'Work Experience']]
    .forEach(([key, label]) => {
      const written = renderEntries(key, `entries-${key}`);
      new Collection(key, `coll-${key}`, {
        label,
        emptyText: written
          ? 'No documents attached to this section yet.'
          : 'Nothing published here yet — check back soon.'
      }).schedule();
    });

  /* Academic Works */
  loadSubsections([
    { key: 'poster',       label: 'Poster Presentation' },
    { key: 'project',      label: 'Project' },
    { key: 'presentation', label: 'Presentation' },
    { key: 'lab',          label: 'Lab' }
  ]);

  /* Credentials */
  loadSubsections([
    { key: 'certificates', label: 'Certificates' },
    { key: 'honors',       label: 'Honors & Awards' }
  ]);

  /* My Writings */
  loadSubsections([
    { key: 'poem',    label: 'Poems' },
    { key: 'song',    label: 'Songs' },
    { key: 'travel',  label: 'Travelogues' },
    { key: 'article', label: 'Articles' },
    { key: 'story',   label: 'Short Stories' }
  ]);

  /* Videos are heavy iframes — only build them when Fusion is approached. */
  const fusion = document.getElementById('fusion');
  if (fusion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(e => {
      if (e[0].isIntersecting) { io.disconnect(); loadVideos(); }
    }, { rootMargin: '400px 0px' });
    io.observe(fusion);
  } else {
    loadVideos();
  }

  /* Once the page has settled, quietly fetch whatever the visitor has
     not scrolled to yet, a few at a time. That keeps ⌘K able to search
     every document without making the first paint wait for 14 requests. */
  backfillCollections();
}

function backfillCollections() {
  const start = () => {
    const queue = Object.values(COLLECTIONS).filter(c => !c.loaded && !c.pending);
    let i = 0;
    const pump = () => {
      const batch = queue.slice(i, i + 3);
      if (!batch.length) return;
      i += 3;
      Promise.all(batch.map(c => c.load())).then(() => setTimeout(pump, 400));
    };
    pump();
  };

  if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 4000 });
  else setTimeout(start, 2500);
}
