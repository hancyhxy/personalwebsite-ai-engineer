/* journal-spreads.js — assemble the full ordered list of spreads from gallery.json.
   A "spread" is one renderable {kind, title, html, disc?} record; the Book engine
   takes this array and lays the spreads out as 3D-flippable pages. */

const DISCIPLINES = [
    { key: 'ux',  label: 'UX / Product',   classification: 'UX/Product' },
    { key: 'exp', label: 'Experiential',   classification: 'Experiential' },
    { key: 'con', label: 'Content',        classification: 'Content' },
    { key: 'vis', label: 'Visual',         classification: 'Visual' },
];

const TAB_PROJECTS_PER_PAGE = 7;   // matches tpl-mosaic's max slot count

/* Local helpers — namespaced to avoid collision with journal-templates.js
   (both files share the global script scope when loaded via plain <script src>). */
const SP = {
    escape: (s) => String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;'),
    slug: (p) => {
        const m = (p.coverImageUrl || '').match(/gallery\/([^/]+)\//);
        return m ? m[1] : '';
    },
    thumb: (p) => {
        const slug = SP.slug(p);
        return slug ? `./assets/images/thumbs/${slug}-thumb.jpg` : (p.coverImageUrl ? './' + p.coverImageUrl : '');
    },
    year: (date) => new Date(date).getFullYear(),
    monthYear: (date) => new Date(date).toLocaleString('en-US', { month: 'short', year: 'numeric' }),
};

class Spreads {
    constructor(projects) {
        this.projects = [...projects].sort((a, b) => new Date(b.date) - new Date(a.date));
        this.spreads = [];
        this.tabSpreadIndex = {};   // disciplineKey → spreadIndex (first spread of that tab)
        this._build();
    }

    _build() {
        this.spreads.push(this._cover());
        this.spreads.push(this._title());
        this.spreads.push(this._hero());

        for (const disc of DISCIPLINES) {
            const subset = this.projects.filter(p => p.classification === disc.classification);
            const pages = Math.max(1, Math.ceil(subset.length / TAB_PROJECTS_PER_PAGE));
            this.tabSpreadIndex[disc.key] = this.spreads.length;
            for (let pi = 0; pi < pages; pi++) {
                const slice = subset.slice(pi * TAB_PROJECTS_PER_PAGE, (pi + 1) * TAB_PROJECTS_PER_PAGE);
                this.spreads.push(this._tabSpread(disc, slice, pi + 1, pages));
            }
        }

        this.spreads.push(this._about());
        this.spreads.push(this._backCover());
    }

    _cover() {
        const earliest = SP.year(this.projects[this.projects.length - 1].date);
        const latest = SP.year(this.projects[0].date);
        return {
            kind: 'cover',
            html: `
            <div class="j-cover j-page">
              <div class="label-block">
                <div class="label-kicker">Issue No. IV · Vol. 01</div>
                <div class="label-title">Xinyi Han</div>
                <div class="label-sub">A handbook of selected works, ${earliest}–${latest}</div>
                <div class="label-bottom">Bound in Sydney · Apr 2026</div>
              </div>
            </div>`,
            spanBoth: true,
        };
    }

    _title() {
        const total = this.projects.length;
        return {
            kind: 'title',
            leftHtml: `
            <div class="j-page-pad">
              <div class="j-page-head"><span>Front matter</span><span class="pn">i</span></div>
              <div class="j-title-block">
                <div class="kicker">Portfolio · 2026 edition</div>
                <h1>The handbook</h1>
                <p class="lede">A working notebook of ${total} selected projects across product, experience, content and visual practice.</p>
                <div class="meta">
                  <span>Sydney</span><span>·</span><span>Edited by hand</span>
                </div>
              </div>
            </div>`,
            rightHtml: `
            <div class="j-page-pad">
              <div class="j-page-head"><span>Contents</span><span class="pn">ii</span></div>
              <div class="j-toc">
                ${DISCIPLINES.map((d, i) => {
                    const n = this.projects.filter(p => p.classification === d.classification).length;
                    return `
                    <div class="toc-row" data-tab="${d.key}">
                      <span class="num">0${i + 1}</span>
                      <span class="name">${d.label}</span>
                      <span class="count">${n} ${n === 1 ? 'work' : 'works'}</span>
                    </div>`;
                }).join('')}
                <div class="toc-row">
                  <span class="num">★</span>
                  <span class="name">About</span>
                  <span class="count">colophon</span>
                </div>
              </div>
            </div>`,
        };
    }

    _hero() {
        const cards = this.projects.map(p => {
            const discKey = DISCIPLINES.find(d => d.classification === p.classification)?.key || 'ux';
            return `
            <article class="j-hcard" data-c="${discKey}" data-disc-key="${discKey}" data-slug="${SP.slug(p)}">
              <div class="img"><img src="${SP.thumb(p)}" alt="${SP.escape(p['project name'])}" loading="lazy"></div>
              <h3 class="h3">${SP.escape(p['project name'])}</h3>
              <div class="meta">
                <span>${SP.monthYear(p.date)}</span>
                <span>${SP.escape(p.classification)}</span>
              </div>
            </article>`;
        }).join('');

        return {
            kind: 'hero',
            spanBoth: true,
            html: `
            <div class="j-hero-pad j-page">
              <div class="j-hero-head">
                <div class="h-title">All works · at a glance</div>
                <div class="h-sub">Tap a card · auto-flips to its tab</div>
              </div>
              <div class="j-hero-collage">${cards}</div>
            </div>`,
        };
    }

    _tabSpread(disc, projects, pageNum, totalPages) {
        const inner = window.JournalTemplates.compose(disc.label, projects, {
            tabKey: disc.key, pageNum, totalPages,
        });
        return {
            kind: 'tab',
            disc: disc.key,
            spanBoth: true,
            html: `
            <div class="j-tab-spread j-page" data-disc="${disc.key}">
              ${inner}
            </div>`,
        };
    }

    _about() {
        return {
            kind: 'about',
            leftHtml: `
            <div class="j-page-pad">
              <div class="j-page-head"><span>About the maker</span><span class="pn">★</span></div>
              <div class="j-about">
                <h2>Xinyi Han</h2>
                <p>Designer and design-engineer working at the intersection of products, experiences, and the words and pictures that hold them together.</p>
                <p>Previously at TikTok, Alibaba, and musical.ly. Currently studying interaction design at UTS in Sydney.</p>
                <dl class="contact">
                  <dt>Email</dt><dd>xinyihancy@gmail.com</dd>
                  <dt>Resume</dt><dd><a href="./assets/docs/CV_XinyiHan_2026.pdf" target="_blank" rel="noopener noreferrer">CV (PDF)</a></dd>
                  <dt>Based</dt><dd>Sydney, Australia</dd>
                </dl>
              </div>
            </div>`,
            rightHtml: `
            <div class="j-page-pad">
              <div class="j-page-head"><span>Colophon</span><span class="pn">★★</span></div>
              <div class="j-about">
                <h2>Colophon</h2>
                <p>Set in <em>Instrument Serif</em>, <em>Geist</em>, and <em>JetBrains Mono</em>. Bound by hand in Sydney, April 2026.</p>
                <p>This handbook is part of a four-issue portfolio series. Other issues: Polaroid, Retro, Vinyl, Stickies.</p>
                <p style="margin-top:24px;font-style:italic;">— end of book —</p>
              </div>
            </div>`,
        };
    }

    _backCover() {
        return {
            kind: 'back',
            html: `
            <div class="j-cover j-page">
              <div class="label-block" style="border-color:rgba(232,226,210,0.2);">
                <div class="label-kicker">Fin.</div>
                <div class="label-title" style="font-size:32px;">To be continued</div>
                <div class="label-sub">in the next issue</div>
              </div>
            </div>`,
            spanBoth: true,
        };
    }

    /* Public helpers */
    all() { return this.spreads; }
    indexForTab(tabKey) { return this.tabSpreadIndex[tabKey]; }
    indexForProject(slugOrProject) {
        // Find which tab spread contains this project, return that spread index.
        const slug = typeof slugOrProject === 'string' ? slugOrProject : SP.slug(slugOrProject);
        const proj = this.projects.find(p => SP.slug(p) === slug);
        if (!proj) return null;
        const disc = DISCIPLINES.find(d => d.classification === proj.classification);
        if (!disc) return null;
        const subset = this.projects.filter(p => p.classification === disc.classification);
        const inSubset = subset.findIndex(p => SP.slug(p) === slug);
        const pageOffset = Math.floor(inSubset / TAB_PROJECTS_PER_PAGE);
        return this.tabSpreadIndex[disc.key] + pageOffset;
    }
}

window.JournalSpreads = Spreads;
window.JournalDisciplines = DISCIPLINES;
