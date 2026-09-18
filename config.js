/* ============================================================
   config.js  —  EDIT THIS FILE ONLY
   ------------------------------------------------------------
   Every URL, every piece of text and every list lives here.
   To update the site normally you never need to open any other
   file. Each part is numbered and explained.
   ============================================================ */


window.SITE = {

  /* ══════════ 1. PERSONAL INFO ══════════ */
  profile: {
    name:      'Md. Shamim Al Razi',
    firstName: 'Shamim',
    role:      'Materials & Metallurgical Engineering',
    org:       'Bangladesh University of Engineering and Technology',
    orgShort:  'BUET',
    tagline:   'Bridging materials science, artificial intelligence and human creativity.',

    /* The image that turns continuously in the Home section.
       Put the file next to index.html and name it here. A square image
       with a transparent background works best. */
    rotatingImage: 'rotating.png',
    /* One full turn. Keep it under about 15s — slower than that and a
       roughly symmetric image looks like it is standing still. */
    rotateSeconds: 9,

    /* Windows, Android and iOS all have a "reduce animations" setting, and
       when it is on the browser is told to stop looping animations — the
       image would sit still. Set this to true to keep it turning anyway. */
    alwaysRotate: true,

    /* Chips under the About text. */
    focus: [
      'Advanced materials',
      'Metallurgy & phase transformation',
      'Machine learning for materials',
      'Nanotechnology',
      'Sustainable processing',
      'Computational modelling'
    ],
    email:     'shamim393393@gmail.com',
    phone:     '+8801628912047',
    location:  'Dhaka, Bangladesh',

    // These image files sit next to index.html in the repo root.
    photo:      'profile.jpg',
    aboutPhoto: 'about.jpg',
    logo:       'buet-logo.png',

    bio: `My objective as a <strong>Materials and Metallurgical Engineering</strong> student is to
          harness the unique properties of materials and the transformative potential of artificial
          intelligence to develop smarter, more efficient and sustainable technologies. By integrating
          technical expertise with intellectual curiosity, I actively explore the intersection of
          science, intelligence and creativity.`,

    bio2: `Beyond my scientific work I express my interest in human insight and innovation through
           writing — poems, songs, articles, travelogues and short stories — a balance between
           analytical reasoning and creative thought.`,

    socials: [
      { label: 'LinkedIn', icon: 'fa-brands fa-linkedin-in', url: 'https://www.linkedin.com/in/shamim393/' },
      { label: 'Facebook', icon: 'fa-brands fa-facebook-f',  url: 'https://www.facebook.com/md.shamimalrazi.393/' },
      { label: 'X',        icon: 'fa-brands fa-x-twitter',   url: 'https://x.com/Shamim393' },
      { label: 'YouTube',  icon: 'fa-brands fa-youtube',     url: 'https://youtube.com/@fusion_393' },
      { label: 'Email',    icon: 'fa-solid fa-envelope',     url: 'mailto:shamim393393@gmail.com' }
    ]
  },


  /* ══════════ 2. DATA SOURCES (Google Drive via Apps Script) ══════════

     HOW IT WORKS
     ------------
     Each section that lists files calls one Apps Script web-app URL that
     returns JSON shaped like:

         { "files": [ { "name": "Report.pdf", "url": "https://..." }, ... ] }

     THERE ARE TWO MODES:

     (A) mode: 'unified'   ←  RECOMMENDED. This is the permanent fix for
         "presentation section is showing project files".
         You deploy ONE script (apps-script/Code.gs in this repo) and give it
         every folder ID. The site then requests a folder BY NAME
         (?folder=presentation), so two sections can never silently point at
         the same Drive folder again. Fill in `unifiedUrl` and `folders`.

     (B) mode: 'perSection' ←  What the old site used. One separate script
         deployment per folder, listed in `endpoints`. It works, but if a
         section shows the wrong files the mistake is the FOLDER ID inside
         that particular Apps Script, and it can only be fixed in the Apps
         Script editor — not here.

     Either way: log in on the site as author and press "Check data sources".
     It calls every endpoint and shows you how many files each one returned
     and the first few names, so you can see exactly which URL points where.
  ═════════════════════════════════════════════════════════════════════ */

  data: {
    mode: 'perSection',        //  'perSection'  |  'unified'

    /* ---- used when mode === 'unified' ---- */
    unifiedUrl: '',            // e.g. 'https://script.google.com/macros/s/AAAA.../exec'
    folders: {                 // paste each Google Drive FOLDER ID
      certificates: '',
      honors:       '',
      poster:       '',
      project:      '',
      presentation: '',
      lab:          '',
      publications: '',
      research:     '',
      work:         '',
      poem:         '',
      song:         '',
      travel:       '',
      article:      '',
      story:        ''
    },

    /* ---- used when mode === 'perSection' ---- */
    endpoints: {
      certificates: 'https://script.google.com/macros/s/AKfycbxSCOGTaAThoJVZJVVrKjvSswX_VZxNY1ju-fkb9BCl3Pv-xI20w6ZiIBqi89PU2BAT/exec',
      honors:       'https://script.google.com/macros/s/AKfycbyQJGkZewrcNn9aCFypFcVY0bqflOtfBxoGyWremB8nHquF4W1VAO43d0MAqjlsee6S/exec',

      poster:       'https://script.google.com/macros/s/AKfycbwN-iHAVgOv1ET2ychLgfkKCuSL30Q_rybcDsUOET3PAI-Be0pJN403I3gxScaac9rQ/exec',
      project:      'https://script.google.com/macros/s/AKfycbz-Czs9Q6ky-rZFMy8BQr2flY_Z8v4DrNTDOCzMVaWw81k-rC28FYiZq0P2fggmgIXr/exec',

      /* ⚠️  If this section still lists the PROJECT files, the mistake is
         inside this script, not here: it is a different deployment from
         `project` above, so it must be reading the Project folder in Drive.
         Open it in the Apps Script editor, point its folder ID at the
         Presentation folder, then Deploy → Manage deployments → New version.
         Sign in on the site and press "Check data sources" to confirm. */
      presentation: 'https://script.google.com/macros/s/AKfycbyWjWY0Fz_KlGbo5dwMiGyazkRg7TKFd_L8ou9AxSFfwBFN0DvAY6dt1HSkh_iSyN0/exec',

      lab:          'https://script.google.com/macros/s/AKfycbwhRJNO9gJFt72D8Lnr6dNxbcizNBc0ITP9KsHZB7NRdWMNnETBv5ZnoFXeJNnNRUBM/exec',

      /* These three were missing entirely in the old site, which is why the
         publication folder never appeared. They are wired up now. */
      publications: 'https://script.google.com/macros/s/AKfycbwT-FR4FzTIZFM4T951TmEw73Uxyl7DV7g1u9fJD3AmU38Rm8-O39UGImnjPg824ooF/exec',
      research:     'https://script.google.com/macros/s/AKfycbw8f7c4JdZqIVoAZef0IwBD6ifzqWONr6eCH0zn7O82HNUvmT_Dv9OblzfYjLFPkoo/exec',
      work:         'https://script.google.com/macros/s/AKfycbzEyIWO5zCsDhoNFbfzaGVPLsF0ZeIL-chki1OKDwo1kszZ0StpNxIp9Nl5Cs7ud2HT/exec',

      poem:    'https://script.google.com/macros/s/AKfycbyken5UbbZZJDO31yYFm2NYms8tesH8TXvHwi8uBs7BxSHkEFIAS8EQ6ZTmsau6xMXU/exec',
      song:    'https://script.google.com/macros/s/AKfycbwNFknHCrErOtU5qliEC9pYWArOs2rvoO8SZWjGyvjHf8cqlGds7opk7D9FsdFKAb0P/exec',
      travel:  'https://script.google.com/macros/s/AKfycbxzbXVq4qbGPqMO1Xb21OFnBqAedZ_8_57cRoKO41E5d-U56p-JQ1c5QIQC0pTBP08a/exec',
      article: 'https://script.google.com/macros/s/AKfycbwgl12L1Dq-cB6l1oXT_RlFsLBXAiJ7ScRmMba_m3p0CE0hio1AUKiyTUkoW1dLCYOV/exec',
      story:   'https://script.google.com/macros/s/AKfycbx3UJ46hogaKqmsHi7bQfjXxkdaIkddhRYwY1I-VlpceoUGG_cb0p2hFXj8x06LdeEa/exec'
    }
  },


  /* ══════════ 3. OTHER SCRIPT URLS ══════════ */
  services: {
    email:  'https://script.google.com/macros/s/AKfycbyVveC2YVa4iq9xOs1l9WPaxwVK5KhgQ4axWAfTLmUAe6nrbi_M3dvgH6MgfaGCsx53/exec',
    manage: 'https://script.google.com/macros/s/AKfycbwDqNBfSnmaDEoNKBhGpI2GnFwj-Q4eYiajnShyngavBhq0rjbR5SpJTcMZS8lhrLbpig/exec',
    upload: 'https://script.google.com/macros/s/AKfycbxNEmi4SoGFZORWG8nSExol4MWsbv4WP3_TB-c5Ang_vDAXvGuQBvU-YcABsTP8Obw6/exec'
  },


  /* ══════════ 4. YOUTUBE ══════════
     NOTE: an API key placed in front-end code is readable by every visitor.
     Restrict it in Google Cloud Console → Credentials → Application
     restrictions → HTTP referrers → add your own domain only. */
  youtube: {
    channelId: 'UCZpabp4C9ttk68-G1_SOsJQ',
    apiKey:    'AIzaSyC0Z9fSpsm-GUipCRgG0XJTeKTvRza0pFU',
    channel:   'https://youtube.com/@fusion_393',
    facebook:  'https://www.facebook.com/IslamInMyHeart11'
  },


  /* ══════════ 5. AUTHOR PANEL ══════════
     Everything written here ships inside a public JS file, so treat it as
     visible to anyone who looks. It only tidies the page — it is not real
     security. Never reuse a password you use anywhere else. */
  auth: {
    id:             'ShamimPortfolio',
    password:       'S_2111056',
    uploadPassword: 'ThisIsShamim',
    sessionMinutes: 10
  },


  /* ══════════ 6. SKILLS ══════════ */
  skills: [
    { name: 'C',                level: 85, tag: 'Advanced' },
    { name: 'C++',              level: 80, tag: 'Advanced' },
    { name: 'MATLAB',           level: 75, tag: 'Proficient' },
    { name: 'SolidWorks',       level: 75, tag: 'Proficient' },
    { name: 'Python',           level: 70, tag: 'Proficient' },
    { name: 'MS Office',        level: 95, tag: 'Expert' },
    { name: 'Machine Learning', level: 65, tag: 'Intermediate' },
    { name: 'HTML & CSS',       level: 40, tag: 'Beginner' },
    { name: 'JavaScript',       level: 30, tag: 'Beginner' }
  ],


  /* ══════════ 7. RESUME ══════════ */
  education: [
    { title: 'Bangladesh University of Engineering and Technology',
      date:  '2021 — Present',
      meta:  'B.Sc. in Materials and Metallurgical Engineering' },

    { title: 'Shahid Syed Nazrul Islam College, Mymensingh',
      date:  '2018 — 2020',
      meta:  'Higher Secondary Certificate (HSC)' },

    { title: 'Govt. Islampur Nekjahan Pilot Model High School',
      date:  '2013 — 2018',
      meta:  'Secondary School Certificate (SSC)' }
  ],

  experience: [
    { title: 'Assistant General Secretary — BUET Robotics Society',
      date:  'Present',
      meta:  'Contributing to robotics projects, workshops and events.' },

    { title: 'Term Representative — SAMME',
      date:  '2022 — 2023',
      meta:  'Represented student interests in the Student Association of MME.' },

    { title: 'Executive — Help Buetian',
      date:  '2022 — 2023',
      meta:  'Social and academic welfare initiatives for students.' },

    { title: 'Host (English) — "Soul of BUET × Mufti Tarique Masood"',
      date:  'July 2023',
      meta:  'Hosted an international program in English.' }
  ],


  /* ══════════ 8. WRITTEN ENTRIES ══════════
     These show up with or without a Drive folder. Any files found at the
     matching endpoint in part 2 are listed underneath them.
     Delete the // in front of a line to switch an example on. */

  publications: [
    // { title: 'Title of the paper',
    //   venue: 'Journal or conference, 2025',
    //   summary: 'One or two lines about what it covers.',
    //   url: 'https://doi.org/...' }
  ],

  research: [
    // { title: 'Project title',
    //   venue: 'Supervisor / lab, 2025',
    //   summary: 'What you did and what came out of it.',
    //   url: '' }
  ],

  work: [
    // { title: 'Role',
    //   venue: 'Organisation, 2025',
    //   summary: 'Short description.',
    //   url: '' }
  ],


  /* ══════════ 9. NAVIGATION ══════════
     Order here = order on the page and in the sidebar. */
  nav: [
    { id: 'home',         label: 'Home',         icon: 'fa-solid fa-house' },
    { id: 'about',        label: 'About',        icon: 'fa-solid fa-user' },
    { id: 'resume',       label: 'Resume',       icon: 'fa-solid fa-graduation-cap' },
    { id: 'research',     label: 'Research',     icon: 'fa-solid fa-flask' },
    { id: 'publications', label: 'Publications', icon: 'fa-solid fa-book-open' },
    { id: 'work',         label: 'Work',         icon: 'fa-solid fa-briefcase' },
    { id: 'academic',     label: 'Academic',     icon: 'fa-solid fa-cubes' },
    { id: 'credentials',  label: 'Credentials',  icon: 'fa-solid fa-certificate' },
    { id: 'skills',       label: 'Skills',       icon: 'fa-solid fa-sliders' },
    { id: 'writings',     label: 'Writings',     icon: 'fa-solid fa-feather' },
    { id: 'fusion',       label: 'Fusion',       icon: 'fa-solid fa-music' },
    { id: 'contact',      label: 'Contact',      icon: 'fa-solid fa-envelope' }
  ]
};
