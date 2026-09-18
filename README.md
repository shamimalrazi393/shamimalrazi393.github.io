# Md. Shamim Al Razi — Portfolio

Personal academic site for a Materials and Metallurgical Engineering student at BUET.
Plain HTML, CSS and JavaScript — no build step, no framework, no npm. Upload the folder
to GitHub and turn on Pages.

---

## Files

```
index.html                 page structure — rarely needs editing
assets/
  css/
    base.css               colours, fonts, layout, sidebar, responsive rules
    components.css         buttons, file browser, tabs, palette, modals
    sections.css           hero, stats, about, skills, contact, author panel
  js/
    config.js       ←★     EVERY url and every piece of text lives here
    utils.js               escaping, Drive links, the folder-tree reader
    collection.js          the file browser + reader modal + diagnostics
    palette.js             the ⌘K search
    sections.js            renders each section, builds the tab groups
    auth.js                author sign-in and section visibility
    main.js                theme, scrolling, navigation, start-up
apps-script/
  Code.gs                  optional: one Apps Script for all folders
profile.jpg                the one profile picture (left sidebar)
about.jpg                  photo in the About section
buet-logo.png              university logo / favicon
rotating.png               the image that turns in Home — add your own
```

**To change anything normal — a URL, your bio, a skill, a publication — open
`assets/js/config.js`. That is the only file you need.**

---

## Putting it on GitHub Pages

1. Create a repository named `<your-username>.github.io`.
2. Upload everything here, keeping the folder structure. `profile.jpg`, `about.jpg`
   and `buet-logo.png` must sit beside `index.html`.
3. **Settings → Pages → Source: Deploy from a branch → `main` / root**.
4. Open `https://<your-username>.github.io`.

To test locally, don't double-click `index.html` — browsers block `fetch` on `file://`.
Run `python3 -m http.server 8000` and open `http://localhost:8000`.

---

## What the site does now

### It reads your real Drive folder tree

Your Apps Scripts return a **recursive tree**, not a flat list:

```json
{ "name": "Publications", "id": "…", "type": "folder", "children": [
    { "name": "SAAC.pdf", "type": "file",
      "url": "https://drive.google.com/file/d/…/preview",
      "dateCreated": "2026-09-17T18:06:17.670Z" },
    { "name": "2025", "type": "folder", "children": [ … ] }
]}
```

So every section is a proper file browser: **subfolders show as folders you can open**,
with breadcrumbs to walk back out. Nesting works to any depth. It still accepts the flat
`{files:[…]}` shape, so a section behind an older script keeps working.

### Search across everything — ⌘K

Press **⌘K** (or **Ctrl+K**, or just **/**) anywhere on the page. It searches section
names and every document loaded from Drive, and matches loosely — typing `htr` finds
*Heat Treatment Report.pdf*. Enter opens the document straight in the reader.

### Per-collection controls

Each section with more than a few files gets a toolbar: a **search box** (which looks
through subfolders too, not just the open one), **sort** by newest / name / file type,
and a **grid ⇄ list** switch. List view is a dense table with type and date — better
when a folder has thirty items. Your choice of view is remembered.

### Subsections

Academic Works, Credentials and My Writings each hold several Drive folders. They are
listed one below another, each with its own heading and a file count on the right.

### A real reader

Opening a document gives you **previous / next arrows** through the rest of that folder,
a position counter, and ← / → keyboard navigation. Download now builds a proper
`uc?export=download` link instead of handing Drive a `/view` URL that just opens a page.

### The rotating image in Home

Put a square image named **`rotating.png`** next to `index.html` and it turns
continuously in the Home section — one full revolution every 26 seconds. A PNG with a
transparent background works best; a faint circular plate sits behind it so a cut-out
image still has a footing. Hovering pauses the spin so a visitor can actually look at it.

Both the file name and the speed are in `config.js`:

```js
rotatingImage: 'rotating.png',
rotateSeconds: 9,             // one full turn
alwaysRotate: false,          // see below
```

**Keep the turn under about 15 seconds.** Slower than that and a roughly symmetric
image looks like it is standing still — that is why it seemed not to be moving at 26s.

**If it still does not turn**, your system has "reduce animations" switched on (Windows
Settings → Accessibility → Visual effects, Android → Developer/Accessibility, iOS →
Accessibility → Motion). Browsers pass that through and the site stops looping
animations on purpose. Set `alwaysRotate: true` in `config.js` to keep it turning
regardless.

**If the file is not there**, the stage removes itself and the hero collapses to a
single full-width column — no broken-image icon, no empty gap.

### Load speed

The page used to fire **all fourteen** Apps Script requests the moment it opened. Apps
Script answers slowly and a browser only runs about six requests per host at once, so
they queued behind each other and everything sat on skeletons. Four changes:

- **Folders load as you reach them.** A section fetches its folder when it comes within
  400px of the viewport. Opening the page now costs about three requests instead of
  fourteen.
- **The rest fill in quietly afterwards.** Once the page is idle, the untouched folders
  load three at a time in the background — so ⌘K can still search every document without
  the first paint waiting on them.
- **Replies are cached for ten minutes** in `sessionStorage`. Reloading, or coming back
  to the page, costs no requests at all.
- **Font Awesome no longer blocks the first paint.** It is ~100 KB and only supplies
  icons, so it loads at low priority and applies when ready. Google Fonts dropped from
  nine weights to six, and the page now preconnects to Google Fonts, cdnjs, Apps Script
  and Drive before it needs them.

Videos in Fusion are also built only when that section is approached, and the About photo
loads lazily. The profile picture and the rotating image are marked high priority, since
both are above the fold.

### Motion

The page moves, but only where movement carries meaning:

- **The hero assembles on load** — eyebrow, name, role, tagline, contact, buttons and
  stats each rise in sequence. Each element carries its own `--d` delay in `index.html`,
  so you can re-time the sequence without touching the JavaScript.
- **The intro wipes in from the left** — "Hello, I'm", then the name, then the tagline,
  each uncovered left to right with a thin copper edge travelling along the boundary.
  The three lines are staggered; their delays are the `--d` values in `index.html`, so
  the sequence can be re-timed without touching the JavaScript.
- **The name carries a slow gradient sheen** once its wipe has finished.
- **Sections fade up as you reach them**, and lists marked `.stagger` — education,
  positions, skills, focus chips — assemble item by item instead of snapping in.
- Section labels draw a short copper rule as they arrive; the sidebar grows a marker
  beside the current section.

Everything above is switched off for anyone whose system asks for reduced motion — they
get the finished layout immediately, with nothing left invisible.

### Other things

- **Thumbnails** come from Drive's thumbnail service instead of an embedded iframe per
  card — much faster, and it falls back to a file-type icon if a thumbnail is missing.
- **Skeleton placeholders** while a folder loads, instead of a spinner.
- **Live counts** in the hero, totalled from what actually loaded.
- **Focus-area chips** and a **status line**, both from `config.js`.
- Dark mode follows your system setting until you choose otherwise.

### Images

- **The About photo is never cropped.** It keeps its own proportions, whatever shape the
  file is — the frame adapts to the picture rather than the picture being cut to fit.
  (It used to be forced into a 4:5 box, which sliced the top and bottom off a 2:3 photo.)
- **There is exactly one profile picture** — the 116px circular portrait in the left
  sidebar. It crops to `center 22%`, which keeps a face in frame on a tall photo; change
  `object-position` in `base.css` if yours sits differently.

### Borders

Border weight and colour are two tokens at the top of `base.css`:

```css
--bw:      1.5px;   /* ordinary edges */
--bw-bold: 2px;     /* cards, modals, tabs, the stat strip */
--line:    #ccd6e0; /* raise the contrast further by darkening this */
```

Every edge on the site references those, so changing them there changes the whole page.

---

## The three problems

### 1. Files in the Publication folder never appeared — **fixed**

The old site had no publication endpoint anywhere and no code that loaded one.
`renderContent()` called loaders for credentials, academic, writings and videos, and
nothing for publications, research or work — the section was empty by construction.

All three are wired up now with the URLs you supplied. I checked each one:

| Section | Drive folder it returns | Contents |
|---|---|---|
| Publications | `Publications` | 1 file — `SAAC.pdf` |
| Research | `Research Experience` | empty |
| Work | `Work Experience` | empty |

Research and work are correctly connected and simply have nothing in them yet — add
files in Drive and they will appear with no code change.

### 2. Presentation shows Project files — **confirmed, and it is not fixed yet**

The presentation URL you sent is the same one as before, and I opened it directly. It
returns:

```json
{ "name": "Projects", "id": "1TRWIh5tM4KOrzmVp_tsAgr6BKmq4oE3N", "type": "folder",
  "children": [ "metrograin_v3_setUp.exe", "DataPlot_Pro_v3.1_Setup.exe" ] }
```

The `project` endpoint returns **the same folder name and the same folder id**. Two
different script deployments, both reading the Projects folder. Nothing in this website
can fix that — the folder is chosen inside the Apps Script.

**To fix it:**

1. Open <https://script.google.com> and find the script behind the presentation URL.
2. Change its folder ID to the **Presentation** folder's ID (open that folder in Drive;
   the ID is the part of the address after `/folders/`).
3. **Deploy → Manage deployments → pencil → Version: New version → Deploy.**
   Editing the code alone changes nothing on the live site.
4. If the `/exec` URL changed, paste the new one into `config.js`.

Then sign in on the site and press **Check data sources** — it now prints the actual
Drive folder name each endpoint is reading and warns when two of them match.

**Or prevent it entirely:** use `apps-script/Code.gs`. One deployment serves every
folder, all the IDs sit in one visible table, and the site asks for folders by name. It
also has a `checkFolders()` function you can run in the editor to catch duplicates
before they reach the site. Then set `data.mode = 'unified'` in `config.js`.

### 3. The sections looked like separate blocks — **fixed**

Every section used to be a raised card with its own shadow on a tinted background.
Now it is one continuous document: fixed sidebar, sections separated by hairline rules,
numbered labels above serif headings, white page. The only background is in the hero —
a close-packed atomic lattice at about 5% opacity, fading out. Delete `.hero::before`
in `sections.css` to remove it.

---

## Other things fixed along the way

- **Resume "Show details"** hid the timeline instead of expanding it; both lists now
  simply show.
- **Two dead icon URLs** (SolidWorks pointed at a fan wiki).
- **File names went into `innerHTML` unescaped** — a name containing a quote or angle
  bracket could break the card or inject markup. Everything is escaped now.
- **Errors were silent.** Each section now names what failed and what to check.
- **`SCRIPT_URL` (`?action=getData`)** was fetched on every page load and its result was
  never used. Removed.
- A horizontal-scroll bug on phones, a duplicate `id="year"`, an unused
  `confirmAndOpenAppScript()` stub, and the `seasonal` key that meant `lab`.

---

## About the passwords

`config.js` holds the author ID, the author password, the upload password and the
YouTube API key. **Every visitor can read that file** — it is served as plain text, and
the same was true of the old single-file version. Treat all of it as public.

- The author panel only hides sections in your own browser. Don't reuse a password.
- Restrict the YouTube key: Google Cloud Console → Credentials → your key → Application
  restrictions → HTTP referrers → `shamimalrazi393.github.io/*`.
- Real protection has to live in the Apps Script, which runs on Google's servers.

---

## Everyday tasks

| I want to… | Where |
|---|---|
| Change my bio, email or tagline | `config.js` → part 1 |
| Connect a Drive folder to a section | `config.js` → part 2 |
| Add a publication or research entry | `config.js` → part 8 |
| Add or re-rank a skill | `config.js` → part 6 |
| Add a degree or a position | `config.js` → part 7 |
| Rename or reorder the navigation | `config.js` → part 9 |
| Change colours | `base.css` → `:root` |
| Change the rotating role words | `config.js` → part 1, `roles` |
| Change the rotating image | drop in a new `rotating.png`, or rename it in `config.js` |
| Change the rotation speed | `config.js` → `rotateSeconds` |
| Re-time the intro wipe | `index.html` → the `--d` values in the hero |
| Make every border heavier | `base.css` → `--bw`, `--bw-bold`, `--line` |
| Change the status line or focus chips | `config.js` → part 1, `status` / `focus` |
| Re-time the hero entrance | `index.html` → the `--d` values in the hero |
| Turn off all motion | `base.css` → the reduced-motion block, drop the media query |
| Remove the lattice background | `sections.css` → delete `.hero::before` |
| Find out why a section is empty or wrong | Sign in → **Check data sources** |
