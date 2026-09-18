/* ============================================================
   palette.js — the ⌘K / Ctrl-K command palette

   Searches section names and every file loaded from Drive, so any
   document is two keystrokes away from anywhere on the page.
   ============================================================ */

let paletteResults = [], paletteIndex = 0;

function openPalette() {
  const overlay = $('#palette-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  const input = $('#palette-input');
  input.value = '';
  input.focus();
  runPalette('');
}

function closePalette() {
  $('#palette-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

/* Cheap subsequence match: "hetr" finds "Heat Treatment Report".
   Returns a score, lower is better, or -1 for no match. */
function fuzzyScore(text, query) {
  if (!query) return 0;
  const t = text.toLowerCase(), q = query.toLowerCase();
  const direct = t.indexOf(q);
  if (direct !== -1) return direct;              // a plain substring always wins

  let ti = 0, score = 0;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return -1;
    score += found - ti;
    ti = found + 1;
  }
  return 1000 + score;
}

function paletteItems() {
  const items = [];

  window.SITE.nav.forEach(n => items.push({
    kind: 'section',
    label: n.label,
    sub: 'Jump to section',
    icon: n.icon,
    run: () => {
      closePalette();
      document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth' });
    }
  }));

  Object.values(COLLECTIONS).forEach(coll => {
    if (!coll.loaded || !coll.allFiles) return;
    coll.allFiles.forEach(({ node, path }) => {
      const name = nodeName(node);
      items.push({
        kind: 'file',
        label: name,
        sub: [coll.label].concat(path).join(' › '),
        icon: 'fa-solid ' + KIND_ICON[fileKind(name)],
        run: () => { closePalette(); coll.open(node); }
      });
    });
  });

  return items;
}

function runPalette(query) {
  const box = $('#palette-results');
  if (!box) return;

  const scored = [];
  paletteItems().forEach(item => {
    const s = fuzzyScore(item.label, query);
    if (s !== -1) scored.push({ item, score: s + (item.kind === 'section' ? -5 : 0) });
  });

  scored.sort((a, b) => a.score - b.score);
  paletteResults = scored.slice(0, 40).map(s => s.item);
  paletteIndex = 0;

  if (!paletteResults.length) {
    box.innerHTML = `<div class="palette-empty">No matches for “${esc(query)}”.</div>`;
    return;
  }

  box.innerHTML = paletteResults.map((item, i) => `
    <button class="palette-row${i === 0 ? ' active' : ''}" data-i="${i}">
      <i class="${item.icon}"></i>
      <span class="pr-label">${esc(item.label)}</span>
      <span class="pr-sub">${esc(item.sub)}</span>
    </button>`).join('');

  $$('.palette-row', box).forEach(row => {
    row.addEventListener('click', () => paletteResults[+row.dataset.i]?.run());
    row.addEventListener('mousemove', () => setPaletteIndex(+row.dataset.i));
  });
}

function setPaletteIndex(i) {
  const rows = $$('.palette-row');
  if (!rows.length) return;
  paletteIndex = (i + rows.length) % rows.length;
  rows.forEach((r, n) => r.classList.toggle('active', n === paletteIndex));
  rows[paletteIndex]?.scrollIntoView({ block: 'nearest' });
}

function bindPalette() {
  const input = $('#palette-input');
  if (!input) return;

  input.addEventListener('input', debounce(e => runPalette(e.target.value.trim()), 120));

  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown')      { e.preventDefault(); setPaletteIndex(paletteIndex + 1); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setPaletteIndex(paletteIndex - 1); }
    else if (e.key === 'Enter')     { e.preventDefault(); paletteResults[paletteIndex]?.run(); }
    else if (e.key === 'Escape')    { closePalette(); }
  });

  $('#palette-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'palette-overlay') closePalette();
  });

  $$('[data-action="palette"]').forEach(b => b.addEventListener('click', openPalette));

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      $('#palette-overlay').classList.contains('open') ? closePalette() : openPalette();
    }
    /* "/" opens search too, as long as you are not already typing */
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
      e.preventDefault();
      openPalette();
    }
  });
}
