/**
 * ============================================================
 *  UNIFIED DRIVE FOLDER ENDPOINT
 *  One deployment serves every section of the website.
 * ============================================================
 *
 *  WHY USE THIS
 *  ------------
 *  With one script per folder it is easy to copy a script, forget to
 *  change the folder ID, and end up with (for example) the Presentation
 *  section listing the Project folder's files. Here every folder is
 *  named in one table, so you can see at a glance that no two names
 *  point at the same ID.
 *
 *  SETUP
 *  -----
 *  1.  script.google.com  →  New project.
 *  2.  Paste this whole file in, replacing whatever is there.
 *  3.  Fill in FOLDERS below. To get a folder ID, open the folder in
 *      Drive and copy the part of the address after /folders/ :
 *          drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUv
 *                                          └────── this ──────┘
 *  4.  Deploy  →  New deployment  →  type: Web app
 *        Execute as:        Me
 *        Who has access:    Anyone
 *      Copy the /exec url it gives you.
 *  5.  In assets/js/config.js set:
 *        data.mode       = 'unified'
 *        data.unifiedUrl = '<the /exec url>'
 *        data.folders    = the same IDs you used here
 *  6.  Every time you change this script:
 *        Deploy → Manage deployments → pencil icon → Version: New version
 *      (If you skip this the live site keeps running the old code.)
 *
 *  CHECKING YOUR WORK
 *  ------------------
 *  Open  <your /exec url>?folder=presentation  in a browser. You should
 *  see the presentation files as JSON. Then sign in on the website and
 *  press "Check data sources" — it lists every folder side by side and
 *  warns you if two of them return the same files.
 */

/* ---------- 1. YOUR FOLDERS ----------
   The key on the left must match the key in config.js.
   Paste the Drive folder ID on the right.                     */
var FOLDERS = {
  certificates: 'PASTE_FOLDER_ID_HERE',
  honors:       'PASTE_FOLDER_ID_HERE',

  poster:       'PASTE_FOLDER_ID_HERE',
  project:      'PASTE_FOLDER_ID_HERE',
  presentation: 'PASTE_FOLDER_ID_HERE',   // <- must NOT equal `project`
  lab:          'PASTE_FOLDER_ID_HERE',

  publications: 'PASTE_FOLDER_ID_HERE',   // <- the folder that was never shown
  research:     'PASTE_FOLDER_ID_HERE',
  work:         'PASTE_FOLDER_ID_HERE',

  poem:         'PASTE_FOLDER_ID_HERE',
  song:         'PASTE_FOLDER_ID_HERE',
  travel:       'PASTE_FOLDER_ID_HERE',
  article:      'PASTE_FOLDER_ID_HERE',
  story:        'PASTE_FOLDER_ID_HERE'
};


/* ---------- 2. THE ENDPOINT ---------- */
function doGet(e) {
  var params = (e && e.parameter) || {};
  var key    = params.folder;

  // ?list=1  → show which folder names this deployment knows about
  if (params.list) {
    return json({ folders: Object.keys(FOLDERS) });
  }

  if (!key) {
    return json({ error: 'Add ?folder=<name>, e.g. ?folder=presentation',
                  available: Object.keys(FOLDERS) });
  }

  var folderId = FOLDERS[key];
  if (!folderId || folderId === 'PASTE_FOLDER_ID_HERE') {
    return json({ error: 'No folder ID set for "' + key + '" in Code.gs',
                  name: key, type: 'folder', children: [] });
  }

  try {
    return json(listFolder(folderId));
  } catch (err) {
    return json({ name: key, type: 'folder', children: [], error: String(err) });
  }
}


/* ---------- 3. READ A FOLDER, INCLUDING SUBFOLDERS ----------
   Returns the same recursive shape your existing scripts use, so the
   website reads both without any change:

     { name, id, type: "folder", children: [
         { name, id, type: "file", url, dateCreated },
         { name, id, type: "folder", children: [ ... ] }
     ]}

   MAX_DEPTH stops a runaway folder tree from timing the script out. */
var MAX_DEPTH = 4;

function readFolder(folder, depth) {
  var node = {
    name: folder.getName(),
    id:   folder.getId(),
    type: 'folder',
    children: []
  };

  // Subfolders first
  if (depth < MAX_DEPTH) {
    var folders = folder.getFolders();
    while (folders.hasNext()) {
      node.children.push(readFolder(folders.next(), depth + 1));
    }
  }

  // Then files
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    if (file.isTrashed()) continue;
    node.children.push({
      name:        file.getName(),
      id:          file.getId(),
      type:        'file',
      url:         'https://drive.google.com/file/d/' + file.getId() + '/preview',
      mimeType:    file.getMimeType(),
      size:        file.getSize(),
      dateCreated: file.getDateCreated().toISOString()
    });
  }

  // Folders above files, then newest file first
  node.children.sort(function (a, b) {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    if (a.type === 'folder') return a.name.localeCompare(b.name);
    return a.dateCreated < b.dateCreated ? 1 : -1;
  });

  return node;
}

function listFolder(folderId) {
  return readFolder(DriveApp.getFolderById(folderId), 0);
}


/* ---------- 4. HELPER ---------- */
function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ---------- 5. SAFETY CHECK ----------
   Run this from the editor (Run → checkFolders) and read the log.
   It tells you if two sections are pointing at the same folder — the
   exact mistake that made "presentation" show the project files.     */
function checkFolders() {
  var seen = {};
  var problems = [];

  Object.keys(FOLDERS).forEach(function (key) {
    var id = FOLDERS[key];
    if (!id || id === 'PASTE_FOLDER_ID_HERE') {
      problems.push('• ' + key + ' — no folder ID set');
      return;
    }
    if (seen[id]) {
      problems.push('• ' + seen[id] + ' and ' + key + ' share the SAME folder ID');
    } else {
      seen[id] = key;
    }
    try {
      var name = DriveApp.getFolderById(id).getName();
      Logger.log(key + '  →  "' + name + '"');
    } catch (err) {
      problems.push('• ' + key + ' — cannot open that folder (' + err + ')');
    }
  });

  Logger.log('\n--- Problems ---');
  Logger.log(problems.length ? problems.join('\n') : 'None. Every section has its own folder.');
}
