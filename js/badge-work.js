'use strict';
// A quiet, complete index inside the menu. No entrance flights or page-height changes.
window.BADGE_WORK_READY = (async () => {
  const root = document.getElementById('work-collection'), status = document.getElementById('work-status');
  const nav = document.getElementById('journey-nav'), section = document.getElementById('work-next');
  const topics = [
    ['build', 'Interactive Products', 'Prototyping new ways to connect, play and work with AI.'],
    ['conversation', 'Conversational AI', 'Designing the space between people, support teams and intelligent systems.'],
    ['commerce', 'Commerce & Operations', 'Connecting content, services and the systems behind delivery.'],
    ['experience', 'Experiences & Visual Stories', 'Exploring ideas through spaces, identities and information.'],
    ['content', 'Content & Community', 'Making stories, building audiences and finding a shared language.']
  ];
  const chapters = [
    ['independent', '01 / Independent & Study', '2026–2021 · Ongoing explorations', 'Personal projects, content practice and further study at UTS. These threads overlap rather than replacing one another.'],
    ['bytedance', '02 / ByteDance', '2023 · Local life', 'Content-driven delivery experiences and the operations that support them.'],
    ['alibaba', '03 / Alibaba', '2022–2021 · Customer experience', 'Chatbot interactions, support workspaces and help-center systems.'],
    ['early', '04 / Foundations', '2020–2017 · Parsons & early explorations', 'An exploration of interaction, visual storytelling and physical experiences.']
  ];
  let projects = [], mode = 'topic';
  section.dataset.layout = mode;
  // Keep the server-authored complete index usable even if gallery.json cannot load.
  root.querySelectorAll('a.work-item').forEach(a => {
    const i = SCROLLCAROUSEL_PROJECTS.findIndex(p => new URL(p.url, 'https://xyhan.com/').pathname === new URL(a.href).pathname);
    if (i >= 0) a.href = './project-scrollcarousel.html?project=' + i;
  });
  function organize(next) {
    mode = next === 'journey' ? 'journey' : 'topic'; section.dataset.layout = mode;
    section.querySelectorAll('button[data-layout]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.layout === mode)));
    if (!projects.length) return;
    const fragment = document.createDocumentFragment();
    const groups = mode === 'journey' ? chapters : topics;
    nav.replaceChildren(); nav.hidden = mode !== 'journey';
    groups.forEach(([id, title, description, detail]) => {
      const list = projects.filter(p => (mode === 'journey' ? p.chapter : p.topic) === id).sort((a, b) => b.date.localeCompare(a.date));
      if (!list.length) return;
      const group = document.createElement('section'); group.className = 'work-group'; group.id = 'chapter-' + id;
      const heading = document.createElement('header'); heading.className = 'group-heading';
      const h = document.createElement('h3'); h.textContent = title;
      const p = document.createElement('p'); p.textContent = description; heading.append(h, p);
      if (detail) { const note = document.createElement('p'); note.className = 'chapter-story'; note.textContent = detail; heading.append(note); }
      group.append(heading); list.forEach(p => group.append(p.el)); fragment.append(group);
      if (mode === 'journey') {
        const a = document.createElement('a'); a.href = '#' + group.id; a.textContent = title;
        a.addEventListener('click', event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const scroller = section.closest('.portfolio-menu-scroll');
          if (!scroller) return;
          event.preventDefault();
          scroller.scrollTo({ top: scroller.scrollTop + group.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 24, behavior: 'auto' });
        });
        nav.append(a);
      }
    });
    root.replaceChildren(fragment);
    status.textContent = projects.length + ' projects / ' + (mode === 'journey' ? 'Newest first within each chapter · project dates, not employment dates' : 'Organized by topic · newest first');
  }
  window.BadgeWorkRestore = state => organize(state.mode);
  section.querySelectorAll('button[data-layout]').forEach(b => b.addEventListener('click', () => organize(b.dataset.layout)));
  try {
    const response = await fetch('content/gallery.json'); if (!response.ok) throw Error('Collection unavailable');
    const data = await response.json();
    projects = data.map((p, i) => {
      const slug = p.projectUrl.split('/')[1], company = p.company || '';
      const topic = /chatbot|help-center/i.test(slug) ? 'conversation' : /Delivery|Dispatch/i.test(slug) ? 'commerce' : /portfolio-ai|friendup|drum-kit|tech-fest|ai-assisted-video-editing/i.test(slug) ? 'build' : /KOL|audition/i.test(slug) ? 'content' : 'experience';
      const chapter = /Alibaba/i.test(company) ? 'alibaba' : /TikTok/i.test(company) ? 'bytedance' : /Personal|UTS|Red Note/i.test(company) ? 'independent' : 'early';
      const localIndex = SCROLLCAROUSEL_PROJECTS.findIndex(project => project.url.replace(/^\.\//, '') === p.projectUrl.replace(/^\.\//, ''));
      const el = document.createElement('a'); el.className = 'work-item'; el.dataset.projectId = slug;
      el.href = localIndex >= 0 ? './project-scrollcarousel.html?project=' + localIndex : new URL(p.projectUrl, 'https://xyhan.com/').href;
      if (localIndex < 0) { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
      const number = document.createElement('span'); number.className = 'work-number micro'; number.textContent = String(i + 1).padStart(2, '0');
      const box = document.createElement('div'); box.className = 'work-thumb';
      const img = document.createElement('img'); img.src = 'assets/images/thumbs/' + slug + '-thumb.jpg'; img.alt = ''; img.width = 160; img.height = 90; img.loading = 'lazy';
      img.addEventListener('error', () => { img.hidden = true; box.classList.add('image-unavailable'); box.textContent = '↗'; }); box.append(img);
      const copy = document.createElement('div'); copy.className = 'work-copy';
      const title = document.createElement('h4'); title.textContent = p['project name'];
      const tags = document.createElement('p'); tags.textContent = p.tag; copy.append(title, tags);
      const meta = document.createElement('span'); meta.className = 'work-meta micro'; meta.textContent = p.date.slice(0, 4) + ' / ' + (company === '-' ? 'Independent exploration' : company);
      const arrow = document.createElement('span'); arrow.className = 'work-arrow'; arrow.textContent = '↗'; arrow.setAttribute('aria-hidden', 'true');
      el.append(number, box, copy, meta, arrow);
      return { date: p.date, el, topic, chapter };
    });
    organize(mode);
  } catch (error) {
    status.textContent = 'Showing the complete project index. Sorting is temporarily unavailable.';
    section.querySelectorAll('button[data-layout]').forEach(b => b.disabled = true);
    console.warn(error);
  }
})();
