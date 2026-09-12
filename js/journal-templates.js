/* journal-templates.js (rev 2) — collage composer.

   Replaces the previous fixed-grid-templates approach.  Now each tab spread is
   built by Templates.compose(...) which:
     1. assigns each project a "main element" (polaroid / vellum info card /
        weekly-grid card) chosen by index rotation
     2. sprinkles 0-1 decorative elements per project (chip / washi / note)
     3. tops up with 2-4 standalone decorations (lined notes, washi tape,
        ticket stub) so the spread reads as densely loaded — 8-12 elements total
     4. positions every element via absolute top/left within one of 6 overlapping
        zones, with a deterministic ±3° rotation seeded from the element index. */

const NOTE_TONES   = ['yellow', 'blue', 'pink', 'mint', 'bone'];
const CHIP_TONES   = ['yellow', 'pink', 'blue', 'mint'];
const WASHI_PATTERNS = ['grid', 'dots', 'stripes'];
const WASHI_COLORS = ['yellow', 'blue', 'mint', 'pink'];

/* ===== Helpers ===== */
const slugFromCover = (p) => {
    const m = (p.coverImageUrl || '').match(/gallery\/([^/]+)\//);
    return m ? m[1] : '';
};
const thumbUrl = (p) => {
    const slug = slugFromCover(p);
    return slug ? `./assets/images/thumbs/${slug}-thumb.jpg` : (p.coverImageUrl ? './' + p.coverImageUrl : '');
};
const monthShort = (date) => new Date(date).toLocaleString('en-US', { month: 'short' }).toUpperCase();
const yearOnly = (date) => new Date(date).getFullYear();
const tagsOf = (p, n = 2) =>
    (p['tag'] || '').split(',').map(s => s.trim()).filter(Boolean).slice(0, n);
const escapeHtml = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/* Deterministic ±3° rotation given a globally-unique element index.
   137 is prime → uniform-looking distribution mod 7. */
const rotFor = (i) => ((i * 137 + 17) % 7) - 3;

/* Pick a value from `arr` deterministically by index. */
const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

/* ===== Element render functions =====
   Each accepts (project|null, opts) and returns a complete .j-el HTML string.
   Position (top/left), rotation and z-index are set by the caller via opts. */

function elPolaroid(p, opts) {
    const img = thumbUrl(p);
    return `
    <div class="j-el j-polaroid" style="${opts.style}" data-slug="${slugFromCover(p)}" data-disc="${escapeHtml(p.classification)}">
      <div class="photo">${img ? `<img src="${img}" alt="${escapeHtml(p['project name'])}" loading="lazy">` : ''}</div>
      <div class="caption">${escapeHtml(p['project name'])}</div>
      <div class="date">${monthShort(p.date)} · ${yearOnly(p.date)}</div>
    </div>`;
}

function elInfo(p, opts) {
    return `
    <div class="j-el j-info" style="${opts.style}" data-slug="${slugFromCover(p)}" data-disc="${escapeHtml(p.classification)}">
      <div class="info-head">
        <span>info.</span>
        <span>★ ★ ★</span>
      </div>
      <dl>
        <div class="info-row"><dt>Date</dt><dd>${monthShort(p.date)} · ${yearOnly(p.date)}</dd></div>
        <div class="info-row"><dt>Studio</dt><dd>${escapeHtml(p.company && p.company !== '-' ? p.company : 'Personal')}</dd></div>
        <div class="info-row"><dt>Field</dt><dd>${escapeHtml(p.classification)}</dd></div>
      </dl>
      <div class="info-name">${escapeHtml(p['project name'])}</div>
    </div>`;
}

function elCal(p, opts) {
    // 7-day calendar mock: highlight a "release date" cell based on project day
    const d = new Date(p.date);
    const day = d.getDate();
    const days = Array.from({ length: 21 }, (_, i) => i + 1);
    const cells = days.map(n =>
        `<span${n === day ? ' class="is-mark"' : ''}>${n}</span>`
    ).join('');
    return `
    <div class="j-el j-cal" style="${opts.style}" data-slug="${slugFromCover(p)}" data-disc="${escapeHtml(p.classification)}">
      <div class="cal-head">
        <span class="yr">${monthShort(p.date)} ${yearOnly(p.date)}</span>
        <span>wk ${Math.ceil(day / 7)}</span>
      </div>
      <div class="cal-grid">${cells}</div>
      <div class="cal-foot">${escapeHtml(p['project name'])}</div>
    </div>`;
}

function elNote(p, opts) {
    const tone = opts.tone || pick(NOTE_TONES, opts.idx);
    if (p) {
        return `
        <div class="j-el j-note" data-tone="${tone}" style="${opts.style}" data-slug="${slugFromCover(p)}" data-disc="${escapeHtml(p.classification)}">
          <div class="n-kicker">${escapeHtml(p.company && p.company !== '-' ? p.company : 'Note')}</div>
          <div class="n-title">${escapeHtml(p['project name'])}</div>
        </div>`;
    }
    // Standalone decorative note (no project) — uses opts.text if provided
    return `
    <div class="j-el j-note" data-tone="${tone}" style="${opts.style}">
      <div class="n-kicker">${escapeHtml(opts.kicker || 'note')}</div>
      <div class="n-body">${escapeHtml(opts.text || 'made in transit · with feeling')}</div>
    </div>`;
}

function elTicket(p, opts) {
    return `
    <div class="j-el j-ticket" style="${opts.style}" data-slug="${slugFromCover(p)}" data-disc="${escapeHtml(p.classification)}">
      <div class="stub">
        <div class="yr">${yearOnly(p.date)}</div>
        <div class="mo">${monthShort(p.date)}</div>
      </div>
      <div class="body">
        <div class="venue">${escapeHtml(p.company && p.company !== '-' ? p.company : 'Self-show')}</div>
        <div class="name">${escapeHtml(p['project name'])}</div>
        <div class="seat">Adm. One · No ${String(opts.idx + 1).padStart(3, '0')}</div>
      </div>
    </div>`;
}

function elCard(p, opts) {
    return `
    <div class="j-el j-card" style="${opts.style}" data-slug="${slugFromCover(p)}" data-disc="${escapeHtml(p.classification)}">
      <div class="c-title">${escapeHtml(p['project name'])}</div>
      <div class="c-sub">${escapeHtml((tagsOf(p, 2).join(' · ')) || (p.company !== '-' ? p.company : ''))}</div>
    </div>`;
}

function elChip(text, opts) {
    const tone = opts.tone || pick(CHIP_TONES, opts.idx);
    return `<span class="j-el j-chip" data-tone="${tone}" style="${opts.style}">${escapeHtml(text)}</span>`;
}

function elWashi(opts) {
    const pattern = opts.pattern || pick(WASHI_PATTERNS, opts.idx);
    const color = opts.color || pick(WASHI_COLORS, opts.idx + 1);
    return `<div class="j-el j-washi" data-pattern="${pattern}" data-color="${color}" style="${opts.style}"></div>`;
}

/* ===== Zone-based positioning =====
   Each zone is a (centerX%, centerY%) anchor on the spread.  Elements get an
   offset jitter so two elements in the same zone don't fully overlap. */

const ZONES = [
    // Spread is treated as one wide canvas (50% per page).  Zones use percent
    // coordinates of the FULL canvas (0-100%).  Avoid the spine (45-55%).
    { x: 18, y: 28, name: 'tl' },   // top-left
    { x: 72, y: 22, name: 'tr' },   // top-right
    { x: 25, y: 60, name: 'ml' },   // middle-left
    { x: 78, y: 56, name: 'mr' },   // middle-right
    { x: 38, y: 78, name: 'bl' },   // bottom-left
    { x: 65, y: 80, name: 'br' },   // bottom-right
    // Tab title eats top 10%, charm eats bottom 8%, so y ~18-85% is usable.
];

/* Place an element: returns inline style string with top/left/transform/z-index. */
function place(zoneIdx, elIdx, z = 10, jitter = true) {
    const zone = ZONES[zoneIdx % ZONES.length];
    const dx = jitter ? (((elIdx * 73 + 11) % 11) - 5) : 0;   // ±5%
    const dy = jitter ? (((elIdx * 53 + 7) % 11) - 5) : 0;
    const x = Math.max(2, Math.min(86, zone.x + dx));
    const y = Math.max(14, Math.min(82, zone.y + dy));
    const rot = rotFor(elIdx);
    return `top:${y}%;left:${x}%;--rot:${rot}deg;z-index:${z};`;
}

/* Place a washi tape — wider rotation range (±10°), z-index high to overlap others. */
function placeWashi(elIdx) {
    const x = 10 + ((elIdx * 91 + 13) % 70);     // 10-80%
    const y = 18 + ((elIdx * 47 + 5) % 60);      // 18-78%
    const rot = (((elIdx * 137) % 21) - 10);     // ±10°
    return `top:${y}%;left:${x}%;--rot:${rot}deg;z-index:20;`;
}

/* Place a chip — small, often paired with another element; goes near corners. */
function placeChip(elIdx) {
    const cornerX = (elIdx % 2) ? 75 + ((elIdx * 17) % 15) : 5 + ((elIdx * 19) % 12);
    const cornerY = ((elIdx * 31) % 60) + 18;
    const rot = rotFor(elIdx) * 2;     // chips can twist a bit more
    return `top:${cornerY}%;left:${cornerX}%;--rot:${rot}deg;z-index:18;`;
}

/* ===== Compose a spread ===== */

const MAIN_KINDS = ['polaroid', 'info', 'cal', 'polaroid', 'note', 'polaroid'];
// rotation cycle: more polaroids than other types so visuals stay photo-led

function composeMain(p, idx, zoneIdx, elIdx) {
    const kind = pick(MAIN_KINDS, idx);
    const style = place(zoneIdx, elIdx, 10);
    const opts = { idx: elIdx, style };
    switch (kind) {
        case 'info':     return elInfo(p, opts);
        case 'cal':      return elCal(p, opts);
        case 'note':     return elNote(p, opts);
        case 'polaroid':
        default:         return elPolaroid(p, opts);
    }
}

const Templates = {
    /* Build the inner HTML of one tab spread.  `projects` is most-recent-first. */
    compose(disciplineLabel, projects, { tabKey, pageNum, totalPages }) {
        let elIdx = 0;
        const elements = [];

        // 1. One main element per project, rotating zones for distribution
        projects.forEach((p, i) => {
            const zoneIdx = i % ZONES.length;
            elements.push(composeMain(p, i, zoneIdx, elIdx++));

            // 2. Optional decorative chip (one tag) sprinkled near a corner
            const tags = tagsOf(p, 1);
            if (tags.length) {
                elements.push(elChip(tags[0], { idx: elIdx, style: placeChip(elIdx) }));
                elIdx++;
            }
        });

        // 3. Top up with standalone decorations to hit 8-12 element density
        const targetMin = Math.max(8, projects.length * 2);
        const padding = Math.max(2, targetMin - elements.length);

        const fillers = [
            // Lined note (mood/quote)
            () => elNote(null, {
                idx: elIdx,
                style: place((elIdx + 2) % ZONES.length, elIdx, 8),
                kicker: 'mood',
                text: pick([
                    'made in transit · with feeling',
                    'small joys · big plans',
                    'still learning to ship',
                    'paper holds what screens can\'t',
                    'edits welcomed · revisions encouraged',
                ], elIdx),
            }),
            // Washi tape
            () => elWashi({ idx: elIdx, style: placeWashi(elIdx) }),
            // Chip with discipline label
            () => elChip(disciplineLabel.split('/')[0].trim(), { idx: elIdx, style: placeChip(elIdx) }),
        ];

        for (let i = 0; i < padding; i++) {
            const filler = fillers[i % fillers.length]();
            elements.push(filler);
            elIdx++;
        }

        // 4. Always add a couple of washi tapes regardless (visual richness)
        elements.push(elWashi({ idx: elIdx++, style: placeWashi(elIdx) }));
        elements.push(elWashi({ idx: elIdx++, style: placeWashi(elIdx) }));

        // Header is positioned absolutely above the canvas
        return `
        <div class="j-tab-canvas">
          <div class="j-tab-head">
            <div class="h-title">${escapeHtml(disciplineLabel)}</div>
            <div class="h-meta">${projects.length} ${projects.length === 1 ? 'work' : 'works'} · ${pageNum}/${totalPages}</div>
          </div>
          ${elements.join('\n')}
        </div>`;
    },
};

window.JournalTemplates = Templates;
