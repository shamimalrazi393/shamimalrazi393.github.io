/* ============================================================
   collection.js — the file browser behind every Drive section

   One Collection = one Apps Script endpoint = one Drive folder tree.
   It handles nested folders with breadcrumbs, search, sorting, a
   grid/list view switch, and feeds the reader modal and the command
   palette.
   ============================================================ */

const COLLECTIONS = {};        // key -> Collection, for search + diagnostics
const PREVIEW_LIMIT = 8;       // items shown before "Show all"

class Collection {
  constructor(key, mountId, options = {}) {
    this.key      = key;
    this.mount    = document.getElementById(mountId);
    this.label    = options.label || key;
    this.emptyText = options.emptyText;
    this.root     = null;
    this.path     = [];          // folder names from the root
    this.query    = '';
    this.sort     = 'date';      // 'date' | 'name' | 'type'
    this.view     = localStorage.getItem('collectionView') || 'grid';
    this.expanded = false;
    this.loaded   = false;
    this.pending  = false;
    this.observer = null;
    this.onDone   = null;
    COLLECTIONS[key] = this;
  }

  /* ---------- scheduling ----------
     Fourteen folders used to be fetched the moment the page opened.
     Apps Script answers slowly and a browser only runs about six
     requests per host at once, so they queued and the whole page felt
     stuck. Now a folder is fetched when its section comes near the
     viewport, and anything still untouched is filled in quietly once
     the page has settled. */
  schedule() {
    if (!this.mount || this.loaded || this.pending) return;

    const near = () => {
      const r = this.mount.getBoundingClientRect();
      return r.top < window.innerHeight * 1.6 && r.bottom > -200;
    };

    if (near()) { this.load(); return; }

    if (!('IntersectionObserver' in window)) { this.load(); return; }

    this.observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { this.observer.disconnect(); this.load(); }
    }, { rootMargin: '400px 0px' });
    this.observer.observe(this.mount);
  }

  /* ---------- data ---------- */
  async load() {
    if (!this.mount || this.pending || this.loaded) return;
    this.pending = true;
    if (this.observer) this.observer.disconnect();

    const url = endpointFor(this.key);

    if (!url) {
      this.mount.innerHTML = stateEmpty(
        this.emptyText || 'No Drive folder is connected to this section yet.');
      this.pending = false;
      return;
    }

    this.mount.innerHTML = skeletonGrid(4);

    try {
      this.root = await fetchTree(url, this.key);
      this.loaded = true;
    } catch (err) {
      const driveMode = window.SITE.data.mode === 'driveApi';
      this.mount.innerHTML = stateError(
        `Couldn't load <strong>${esc(this.label)}</strong>. ` +
        (driveMode
          ? `Check that this folder is shared as “Anyone with the link”, and ` +
            `that the API key in config.js is valid for this site. ` +
            `<span style="opacity:.75">(${esc(err.message)})</span>`
          : `Check that its Apps Script is deployed with access set to “Anyone”.`));
      console.warn(`[${this.key}]`, err.message);
      return;
    } finally {
      this.pending = false;
    }

    this.allFiles = flattenFiles(this.root);
    this.render();
    updateStats();
    if (this.onDone) this.onDone();
  }

  /* Items to show for the current folder, query and sort. */
  current() {
    const folder = nodeAtPath(this.root, this.path);
    let items = (folder.children || []).slice();

    if (this.query) {
      const q = this.query.toLowerCase();
      /* Searching looks through the whole tree, not just this folder,
         so a file three folders deep is still findable. */
      items = this.allFiles
        .filter(f => nodeName(f.node).toLowerCase().includes(q))
        .map(f => f.node);
    }

    const dir = { folder: 0, file: 1 };
    items.sort((a, b) => {
      const af = isFolder(a) ? 'folder' : 'file';
      const bf = isFolder(b) ? 'folder' : 'file';
      if (af !== bf) return dir[af] - dir[bf];       // folders always first
      if (this.sort === 'name') return nodeName(a).localeCompare(nodeName(b));
      if (this.sort === 'type') return fileExt(nodeName(a)).localeCompare(fileExt(nodeName(b)));
      const ad = nodeDate(a), bd = nodeDate(b);
      if (ad && bd) return bd - ad;                  // newest first
      return nodeName(a).localeCompare(nodeName(b));
    });

    return items;
  }

  /* ---------- rendering ---------- */
  render() {
    if (!this.mount || !this.root) return;

    const items   = this.current();
    const visible = this.expanded ? items : items.slice(0, PREVIEW_LIMIT);
    const total   = this.allFiles.length;

    this.mount.innerHTML = '';
    this.mount.className = 'collection';

    /* Toolbar — only worth showing once there is enough to sift through */
    if (total > 3 || this.path.length || this.query) {
      this.mount.appendChild(this.buildToolbar(items.length));
    }

    /* Breadcrumbs when inside a subfolder */
    if (this.path.length && !this.query) {
      this.mount.appendChild(this.buildCrumbs());
    }

    if (!items.length) {
      this.mount.appendChild(el('div', '', this.query
        ? stateEmpty(`Nothing matches “${this.query}”.`)
        : stateEmpty(this.emptyText || 'This folder is empty.')));
      return;
    }

    const list = el('div', this.view === 'list' ? 'file-list' : 'file-grid');
    visible.forEach(node => list.appendChild(
      this.view === 'list' ? this.buildRow(node) : this.buildCard(node)));
    this.mount.appendChild(list);

    if (items.length > PREVIEW_LIMIT) {
      const btn = el('button', 'show-more', this.expanded
        ? '<i class="fa-solid fa-chevron-up"></i> Show fewer'
        : `<i class="fa-solid fa-chevron-down"></i> Show all ${items.length}`);
      btn.onclick = () => { this.expanded = !this.expanded; this.render(); };
      this.mount.appendChild(btn);
    }
  }

  buildToolbar(shown) {
    const bar = el('div', 'coll-bar');

    const search = el('div', 'coll-search', `
      <i class="fa-solid fa-magnifying-glass"></i>
      <input type="search" placeholder="Search ${esc(this.label.toLowerCase())}…"
             value="${esc(this.query)}" aria-label="Search ${esc(this.label)}">`);
    const input = $('input', search);
    input.addEventListener('input', debounce(e => {
      this.query = e.target.value.trim();
      this.expanded = false;
      this.render();
      const box = $('input', $('.coll-search', this.mount) || document.createElement('div'));
      if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
    }, 200));
    bar.appendChild(search);

    const right = el('div', 'coll-actions');

    const sort = el('select', 'coll-select', `
      <option value="date">Newest first</option>
      <option value="name">Name A–Z</option>
      <option value="type">File type</option>`);
    sort.value = this.sort;
    sort.setAttribute('aria-label', 'Sort files');
    sort.onchange = e => { this.sort = e.target.value; this.render(); };
    right.appendChild(sort);

    const toggle = el('div', 'view-toggle', `
      <button class="${this.view === 'grid' ? 'on' : ''}" data-view="grid"
              title="Grid view" aria-label="Grid view"><i class="fa-solid fa-grip"></i></button>
      <button class="${this.view === 'list' ? 'on' : ''}" data-view="list"
              title="List view" aria-label="List view"><i class="fa-solid fa-list"></i></button>`);
    $$('button', toggle).forEach(b => b.onclick = () => {
      this.view = b.dataset.view;
      localStorage.setItem('collectionView', this.view);
      this.render();
    });
    right.appendChild(toggle);

    bar.appendChild(right);
    bar.appendChild(el('div', 'coll-count', `${shown} item${shown === 1 ? '' : 's'}`));
    return bar;
  }

  buildCrumbs() {
    const nav = el('nav', 'crumbs');
    nav.setAttribute('aria-label', 'Folder path');

    const home = el('button', 'crumb', `<i class="fa-solid fa-folder-tree"></i> ${esc(nodeName(this.root) || this.label)}`);
    home.onclick = () => { this.path = []; this.expanded = false; this.render(); };
    nav.appendChild(home);

    this.path.forEach((name, i) => {
      nav.appendChild(el('span', 'crumb-sep', '<i class="fa-solid fa-chevron-right"></i>'));
      const last = i === this.path.length - 1;
      const crumb = el('button', 'crumb' + (last ? ' current' : ''), esc(name));
      crumb.onclick = () => { this.path = this.path.slice(0, i + 1); this.expanded = false; this.render(); };
      nav.appendChild(crumb);
    });
    return nav;
  }

  /* --- grid card --- */
  buildCard(node) {
    const name = nodeName(node);

    if (isFolder(node)) {
      const count = (node.children || []).length;
      const card = el('button', 'file-card folder-card', `
        <div class="fc-thumb folder">
          <i class="fa-solid fa-folder"></i>
        </div>
        <div class="fc-info">
          <div class="fc-name" title="${esc(name)}">${esc(name)}</div>
          <div class="fc-meta">${count} item${count === 1 ? '' : 's'}</div>
        </div>`);
      card.onclick = () => {
        this.path = this.path.concat(name);
        this.expanded = false;
        this.render();
        this.mount.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };
      return card;
    }

    const kind = fileKind(name);
    const date = formatDate(nodeDate(node));
    const card = el('button', 'file-card', `
      <div class="fc-thumb">
        <img src="${esc(thumbUrl(node))}" alt="" loading="lazy"
             onerror="this.closest('.fc-thumb').classList.add('no-thumb')">
        <span class="fc-fallback"><i class="fa-solid ${KIND_ICON[kind]}"></i></span>
        <span class="fc-badge">${esc(fileExt(name).toUpperCase() || 'FILE')}</span>
        <div class="fc-overlay"><span>
          <i class="fa-solid ${canPreview(name) ? 'fa-book-open' : 'fa-arrow-up-right-from-square'}"></i>
          ${canPreview(name) ? 'Read' : 'Open'}</span></div>
      </div>
      <div class="fc-info">
        <div class="fc-name" title="${esc(name)}">${esc(name)}</div>
        <div class="fc-meta">${esc(date || kind)}</div>
      </div>`);
    card.onclick = () => this.open(node);
    return card;
  }

  /* --- list row --- */
  buildRow(node) {
    const name = nodeName(node);

    if (isFolder(node)) {
      const count = (node.children || []).length;
      const row = el('button', 'file-row', `
        <span class="fr-icon folder"><i class="fa-solid fa-folder"></i></span>
        <span class="fr-name">${esc(name)}</span>
        <span class="fr-type">Folder</span>
        <span class="fr-date">${count} item${count === 1 ? '' : 's'}</span>
        <span class="fr-go"><i class="fa-solid fa-chevron-right"></i></span>`);
      row.onclick = () => {
        this.path = this.path.concat(name);
        this.expanded = false;
        this.render();
      };
      return row;
    }

    const kind = fileKind(name);
    const row = el('button', 'file-row', `
      <span class="fr-icon ${kind}"><i class="fa-solid ${KIND_ICON[kind]}"></i></span>
      <span class="fr-name">${esc(name)}</span>
      <span class="fr-type">${esc(fileExt(name).toUpperCase() || '—')}</span>
      <span class="fr-date">${esc(formatDate(nodeDate(node)))}</span>
      <span class="fr-go"><i class="fa-solid fa-arrow-right"></i></span>`);
    row.onclick = () => this.open(node);
    return row;
  }

  /* Files currently on screen, so the reader can step through them. */
  siblings() {
    return this.current().filter(n => !isFolder(n));
  }

  open(node) {
    if (canPreview(nodeName(node))) openReader(node, this);
    else window.open(viewUrl(node), '_blank', 'noopener');
  }
}

/* ============================================================
   READER MODAL — with previous / next through the collection
   ============================================================ */
let readerNode = null, readerList = [], readerIndex = -1;

function openReader(node, collection) {
  readerNode  = node;
  readerList  = collection ? collection.siblings() : [node];
  readerIndex = readerList.findIndex(n => driveId(n) === driveId(node));

  $('#reader-frame').src   = previewUrl(node);
  $('#reader-title').textContent = nodeName(node);
  $('#reader-sub').textContent   = formatDate(nodeDate(node)) || '';
  $('#reader-overlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  updateReaderNav();
}

function updateReaderNav() {
  const prev = $('#reader-prev'), next = $('#reader-next'), pos = $('#reader-pos');
  const many = readerList.length > 1;
  [prev, next].forEach(b => { if (b) b.style.display = many ? '' : 'none'; });
  if (pos) pos.textContent = many ? `${readerIndex + 1} / ${readerList.length}` : '';
  if (prev) prev.disabled = readerIndex <= 0;
  if (next) next.disabled = readerIndex >= readerList.length - 1;
}

function readerStep(delta) {
  const i = readerIndex + delta;
  if (i < 0 || i >= readerList.length) return;
  readerIndex = i;
  readerNode  = readerList[i];
  $('#reader-frame').src = previewUrl(readerNode);
  $('#reader-title').textContent = nodeName(readerNode);
  $('#reader-sub').textContent   = formatDate(nodeDate(readerNode)) || '';
  updateReaderNav();
}

function closeReader() {
  $('#reader-overlay').classList.remove('open');
  $('#reader-frame').src = '';
  document.body.style.overflow = '';
}

function readerAction(action) {
  if (!readerNode) return;
  if (action === 'download')  window.open(downloadUrl(readerNode), '_blank', 'noopener');
  else if (action === 'open') window.open(viewUrl(readerNode), '_blank', 'noopener');
  else if (action === 'print') {
    try { $('#reader-frame').contentWindow.print(); }
    catch { window.open(viewUrl(readerNode), '_blank', 'noopener'); }
  }
}

/* ============================================================
   DIAGNOSTICS — "Check data sources"
   Calls every endpoint, reports what each returned, and flags two
   sections that come back with the same Drive folder.
   ============================================================ */
async function runDiagnostics() {
  const panel = $('#diag');
  const btn   = $('#diag-btn');
  if (!panel) return;

  const d = window.SITE.data;
  const keys = Object.keys(
    d.mode === 'perSection' ? d.endpoints : d.folders);

  panel.classList.add('open');
  panel.innerHTML = '<div class="diag-row head"><span>Section</span><span>Files</span><span>Drive folder it is actually reading</span></div>';
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-circle-notch spin"></i> Checking…'; }

  const rows = [panel.innerHTML];
  const seenFolder = {};
  const clashes = [];

  for (const key of keys) {
    const url = endpointFor(key);
    if (!url) {
      rows.push(`<div class="diag-row warn"><span class="diag-key">${esc(key)}</span>
        <span class="diag-count">—</span><span class="diag-files">no url configured</span></div>`);
      continue;
    }
    try {
      const root  = await fetchTree(url);
      const files = flattenFiles(root);
      const fname = nodeName(root) || '(unnamed)';
      const fid   = root.id || fname;

      if (seenFolder[fid]) clashes.push(`${seenFolder[fid]} + ${key} → “${fname}”`);
      else seenFolder[fid] = key;

      rows.push(`<div class="diag-row ${files.length ? 'good' : 'warn'}">
        <span class="diag-key">${esc(key)}</span>
        <span class="diag-count">${files.length}</span>
        <span class="diag-files" title="${esc(files.map(f => nodeName(f.node)).join(', '))}">
          <strong>${esc(fname)}</strong>${files.length ? ' — ' + esc(files.slice(0, 2).map(f => nodeName(f.node)).join(', ')) : ' (empty)'}
        </span></div>`);
    } catch (err) {
      rows.push(`<div class="diag-row bad"><span class="diag-key">${esc(key)}</span>
        <span class="diag-count">error</span><span class="diag-files">${esc(err.message)}</span></div>`);
    }
  }

  if (clashes.length) {
    rows.push(`<div class="diag-note">
      <strong>Two sections are reading the same Drive folder:</strong> ${esc(clashes.join('; '))}.
      ${d.mode === 'driveApi'
        ? 'Fix the duplicated folder ID in <strong>config.js → data.folders</strong> and reload — nothing to deploy.'
        : 'Open the Apps Script behind the wrong one, point its folder ID at the right folder, then Deploy → Manage deployments → New version.'}</div>`);
  }

  panel.innerHTML = rows.join('');
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-stethoscope"></i> Check data sources'; }
}
