/* ============================================================
   utils.js — shared helpers used by every other module
   ============================================================ */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* Escape anything from Drive or a form before it reaches innerHTML.
   File names are outside our control, so they are treated as text. */
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function el(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html != null) node.innerHTML = html;
  return node;
}

function debounce(fn, ms = 180) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ---------- Toasts ---------- */
function toast(message, type = 'info', ms = 3600) {
  const wrap = $('#toast-wrap');
  if (!wrap) return;
  const icon = type === 'success' ? 'fa-circle-check'
             : type === 'error'   ? 'fa-circle-exclamation'
             : 'fa-circle-info';
  const node = el('div', `toast ${type}`,
    `<i class="fa-solid ${icon}"></i><span>${esc(message)}</span>`);
  wrap.appendChild(node);
  setTimeout(() => {
    node.classList.add('leaving');
    setTimeout(() => node.remove(), 320);
  }, ms);
}

/* ============================================================
   GOOGLE DRIVE HELPERS

   The Apps Scripts return a recursive tree:

     { name: "Publications", id: "…", type: "folder", children: [
         { name: "SAAC.pdf", id: "…", type: "file",
           url: "https://drive.google.com/file/d/ID/preview",
           dateCreated: "2026-09-17T18:06:17.670Z" },
         { name: "2025", type: "folder", children: [ … ] }
     ]}

   So a node is either a file or a folder that holds more nodes.
   ============================================================ */

function driveId(node) {
  if (node && node.id) return node.id;
  const url = node && (node.url || node.webViewLink || node.link);
  if (!url) return '';
  const m = url.match(/\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
  return m ? m[1] : '';
}

const previewUrl  = node => { const id = driveId(node); return id ? `https://drive.google.com/file/d/${id}/preview` : (node.url || ''); };
const viewUrl     = node => { const id = driveId(node); return id ? `https://drive.google.com/file/d/${id}/view` : (node.url || ''); };
const downloadUrl = node => { const id = driveId(node); return id ? `https://drive.google.com/uc?export=download&id=${id}` : (node.url || ''); };

/* A real thumbnail image — far lighter than embedding an iframe per card. */
const thumbUrl = (node, w = 420) => {
  const id = driveId(node);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${w}` : '';
};

function nodeName(node) {
  return String((node && (node.name || node.title)) || '').trim() || 'Untitled';
}
function isFolder(node) {
  return node && (node.type === 'folder' || Array.isArray(node.children));
}
function fileExt(name) {
  const parts = String(name || '').split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/* Types Drive will not render in an iframe — open those in a new tab. */
const NON_PREVIEW = ['pptx', 'ppt', 'xlsx', 'xls', 'zip', 'rar', '7z',
                     'mp3', 'mp4', 'avi', 'mov', 'exe', 'apk', 'msi'];

const canPreview = name => !NON_PREVIEW.includes(fileExt(name));

/* Group extensions into a handful of kinds, for icons and filtering. */
function fileKind(name) {
  const e = fileExt(name);
  if (e === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(e)) return 'doc';
  if (['ppt', 'pptx'].includes(e)) return 'slides';
  if (['xls', 'xlsx', 'csv'].includes(e)) return 'sheet';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'].includes(e)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(e)) return 'video';
  if (['mp3', 'wav', 'm4a'].includes(e)) return 'audio';
  if (['zip', 'rar', '7z'].includes(e)) return 'archive';
  if (['exe', 'msi', 'apk'].includes(e)) return 'app';
  return 'file';
}

const KIND_ICON = {
  pdf: 'fa-file-pdf', doc: 'fa-file-lines', slides: 'fa-file-powerpoint',
  sheet: 'fa-file-excel', image: 'fa-file-image', video: 'fa-file-video',
  audio: 'fa-file-audio', archive: 'fa-file-zipper', app: 'fa-window-maximize',
  file: 'fa-file', folder: 'fa-folder'
};

/* ---------- Dates ---------- */
function nodeDate(node) {
  const raw = node && (node.dateCreated || node.updated || node.lastUpdated || node.modified);
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d) ? null : d;
}
function formatDate(d) {
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ---------- Tree helpers ---------- */

/* Every file anywhere in the tree, each carrying the folder path it sits in.
   Used for counts and for the command palette. */
function flattenFiles(node, path = []) {
  let out = [];
  (node.children || []).forEach(child => {
    if (isFolder(child)) {
      out = out.concat(flattenFiles(child, path.concat(nodeName(child))));
    } else {
      out.push({ node: child, path });
    }
  });
  return out;
}

/* Walk down a tree by folder names to reach the current directory. */
function nodeAtPath(root, path) {
  let current = root;
  for (const name of path) {
    const next = (current.children || []).find(c => isFolder(c) && nodeName(c) === name);
    if (!next) return current;
    current = next;
  }
  return current;
}

/* ---------- Endpoint resolution ----------
   Returns either a plain URL (Apps Script modes) or a 'drive:<folderId>'
   marker, which fetchTreeNetwork recognises and answers by talking to the
   Google Drive API directly. */
function endpointFor(key) {
  const d = window.SITE.data;

  if (d.mode === 'driveApi') {
    const folderId = (d.folders || {})[key];
    if (!d.driveApiKey || !folderId) return '';
    return `drive:${folderId}`;
  }

  if (d.mode === 'unified') {
    const folderId = d.folders[key];
    if (!d.unifiedUrl || !folderId) return '';
    return `${d.unifiedUrl}?folder=${encodeURIComponent(key)}&id=${encodeURIComponent(folderId)}`;
  }
  return d.endpoints[key] || '';
}

/* ---------- Google Drive API ----------
   One request lists one folder. Subfolders are then listed in parallel,
   so a tree three levels deep still finishes in well under a second —
   Apps Script did the same walk one folder at a time, on its own slow
   runtime, which is why sections used to crawl.

   Requires: Drive API enabled, an API key in config.driveApiKey, and each
   folder shared as "Anyone with the link". */
const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';
const DRIVE_MAX_DEPTH   = 4;   // deep enough for real use, shallow enough to stay fast

async function driveListFolder(folderId, apiKey) {
  const out = [];
  let pageToken = '';

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      key: apiKey,
      fields: 'nextPageToken,files(id,name,mimeType,createdTime,modifiedTime,size)',
      pageSize: '1000',
      orderBy: 'folder,createdTime desc',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true'
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`);
    if (!res.ok) {
      /* Drive explains refusals properly, so pass its wording through —
         it is the difference between "something broke" and "this folder
         is not shared" or "this key is restricted to another site". */
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body && body.error && body.error.message) detail = body.error.message;
      } catch { /* non-JSON error body — the status code will have to do */ }
      throw new Error(detail);
    }

    const data = await res.json();
    out.push(...(data.files || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return out;
}

async function driveTree(folderId, apiKey, depth = 0) {
  const items = await driveListFolder(folderId, apiKey);

  const children = await Promise.all(items.map(async item => {
    if (item.mimeType === DRIVE_FOLDER_MIME) {
      const node = { name: item.name, id: item.id, type: 'folder', children: [] };
      if (depth < DRIVE_MAX_DEPTH) {
        try {
          node.children = (await driveTree(item.id, apiKey, depth + 1)).children;
        } catch { /* one unreadable subfolder must not empty the whole section */ }
      }
      return node;
    }
    return {
      name: item.name,
      id: item.id,
      type: 'file',
      url: `https://drive.google.com/file/d/${item.id}/preview`,
      mimeType: item.mimeType,
      size: item.size,
      dateCreated: item.createdTime
    };
  }));

  return { name: '', id: folderId, type: 'folder', children };
}

/* The folder's own name, for the diagnostics table. Fetched alongside the
   listing, and failure here is not worth breaking a section over. */
async function driveFolderName(folderId, apiKey) {
  try {
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}` +
      `?fields=name&supportsAllDrives=true&key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) return '';
    return (await res.json()).name || '';
  } catch { return ''; }
}

/* ---------- Fetch + normalise ----------
   Accepts the folder-tree shape above, and also the flat shapes other
   Apps Scripts return ({files:[…]}, a bare array, …), so every section
   keeps working whichever script is behind it. Always hands back a
   folder-shaped root node.

   Two-tier cache, in localStorage (survives closing the tab, unlike
   sessionStorage — a repeat visit next week still benefits):
     - under TREE_FRESH_MINUTES old  → used as-is, no request at all.
     - under TREE_STALE_MINUTES old  → shown immediately (feels instant),
       and a fresh copy is fetched quietly in the background so the
       *next* visit is up to date. The page already on screen is not
       rewritten by that background fetch, to avoid content jumping
       under someone who is reading it.
     - older, or missing            → a normal, awaited fetch.        */
const TREE_FRESH_MINUTES = 30;
const TREE_STALE_MINUTES = 24 * 60; // one day

function readTreeCache(store) {
  if (!store) return null;
  try { return JSON.parse(localStorage.getItem(store) || 'null'); }
  catch { return null; }
}
function writeTreeCache(store, tree) {
  if (!store) return;
  try { localStorage.setItem(store, JSON.stringify({ at: Date.now(), tree })); }
  catch { /* quota or private mode — the page works without the cache */ }
}

async function fetchTree(url, cacheKey) {
  const store = cacheKey ? `tree:${cacheKey}` : null;
  const hit   = readTreeCache(store);
  const ageMin = hit ? (Date.now() - hit.at) / 60000 : Infinity;

  if (hit && ageMin < TREE_FRESH_MINUTES) return hit.tree;

  if (hit && ageMin < TREE_STALE_MINUTES) {
    fetchTreeNetwork(url, store).catch(() => { /* refreshed next time instead */ });
    return hit.tree;
  }

  return fetchTreeNetwork(url, store);
}

async function fetchTreeNetwork(url, store) {
  /* Drive API mode: 'drive:<folderId>' instead of a real URL. */
  if (url.startsWith('drive:')) {
    const folderId = url.slice(6);
    const apiKey   = window.SITE.data.driveApiKey;
    const [tree, name] = await Promise.all([
      driveTree(folderId, apiKey),
      driveFolderName(folderId, apiKey)
    ]);
    tree.name = name;
    writeTreeCache(store, tree);
    return tree;
  }

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    const match = text.match(/[\[{][\s\S]*[\]}]/);
    if (!match) throw new Error('Response was not JSON');
    data = JSON.parse(match[0]);
  }

  if (data && data.error && !data.children && !data.files) {
    throw new Error(String(data.error));
  }

  const keep = tree => { writeTreeCache(store, tree); return tree; };

  if (Array.isArray(data)) return keep({ name: '', type: 'folder', children: data });
  if (Array.isArray(data.children)) return keep(data);

  for (const key of ['files', 'items', 'data', 'value', 'result']) {
    if (Array.isArray(data[key])) {
      return keep({ name: data.name || '', type: 'folder', children: data[key] });
    }
  }
  for (const key in data) {
    if (Array.isArray(data[key])) {
      return keep({ name: data.name || '', type: 'folder', children: data[key] });
    }
  }
  return keep({ name: data.name || '', type: 'folder', children: [] });
}

/* ---------- Placeholder blocks ---------- */
function skeletonGrid(n = 4) {
  return `<div class="skeleton-grid">${
    Array.from({ length: n }, () => `
      <div class="sk-card">
        <div class="sk-thumb"></div>
        <div class="sk-line"></div>
        <div class="sk-line short"></div>
      </div>`).join('')}</div>`;
}
function stateEmpty(text = 'Nothing here yet.') {
  return `<div class="state"><i class="fa-regular fa-folder-open"></i><span>${esc(text)}</span></div>`;
}
function stateError(html) {
  return `<div class="state error"><i class="fa-solid fa-triangle-exclamation"></i><span>${html}</span></div>`;
}
