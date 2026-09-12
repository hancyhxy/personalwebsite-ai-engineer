/* Stickies Wall — editorial collage + horizontal walkthrough.
   Adapted from the Claude Design handoff bundle's React prototype to vanilla JS
   to match the v2 static-site conventions (cf. polaroid-wall.js). */

/* ------------------------------------------------------------------ */
/*  StickyBoot — Claude Code–style opening sequence                   */
/*                                                                    */
/*  Plays a fake 3-phase loading animation over the paper background, */
/*  then shows an interactive Accept/Cancel prompt. On Accept, the    */
/*  insight headline pushes up + shrinks while the Stickies app fades */
/*  in behind. Entire sequence is decorative — no real data is gated. */
/* ------------------------------------------------------------------ */
class StickyBoot {
    constructor(bootEl, projects) {
        this.bootEl = bootEl;
        this.projects = projects || [];
        this.focused = 0;
        this.timers = [];
        this._onKey = this._onKey.bind(this);
    }

    async start() {
        if (!this.bootEl) { this._finishImmediate(); return; }
        this.bootEl.innerHTML = `
            <div class="stk-boot-stage">
                <div class="stk-boot-cmds" id="stk-boot-cmds"></div>
                <div class="stk-boot-status" id="stk-boot-status">
                    <span class="mark">*</span>
                    <span class="label">Thinking</span><span class="ellipsis">…</span>
                </div>
                <ul class="stk-boot-log" id="stk-boot-log" hidden></ul>
                <div class="stk-boot-prompt" id="stk-boot-prompt" hidden>
                    <div class="stk-boot-insight-card">
                        <div class="stk-boot-insight-header">
                            <span class="bullet">●</span>
                            <span class="star">★</span>
                            <span class="title">Insight</span>
                            <span class="rule"></span>
                        </div>
                        <h1 class="stk-boot-insight">
                            <span class="stk-boot-line" style="--i:0">Xinyi is a senior</span>
                            <span class="stk-boot-line" style="--i:1">UX designer thinking</span>
                            <span class="stk-boot-line" style="--i:2">with her hands in pixels</span>
                            <span class="stk-boot-line" style="--i:3">in paper, AI, and space.</span>
                        </h1>
                        <div class="stk-boot-insight-footer" style="--i:4">
                            <span class="rule"></span>
                        </div>
                    </div>
                    <div class="stk-boot-choices" role="menu">
                        <button class="stk-boot-choice is-focus" data-idx="0" role="menuitem" style="--i:5">
                            <span class="caret">❯</span><span>Accept</span>
                        </button>
                        <button class="stk-boot-choice" data-idx="1" role="menuitem" style="--i:6">
                            <span class="caret">❯</span><span>Cancel</span>
                        </button>
                    </div>
                    <div class="stk-boot-hint" style="--i:7">↵ accept · ↑↓ choose</div>
                </div>
            </div>
        `;

        this.cmdsEl = this.bootEl.querySelector('#stk-boot-cmds');
        this.statusEl = this.bootEl.querySelector('#stk-boot-status');
        this.statusEl.style.opacity = '0'; /* hidden until after commands */
        this.logEl = this.bootEl.querySelector('#stk-boot-log');
        this.promptEl = this.bootEl.querySelector('#stk-boot-prompt');
        this.insightEl = this.bootEl.querySelector('.stk-boot-insight');
        this.choiceEls = [...this.bootEl.querySelectorAll('.stk-boot-choice')];

        this.choiceEls.forEach(el => {
            el.addEventListener('mouseenter', () => this._focus(Number(el.dataset.idx)));
            el.addEventListener('click', () => { this._focus(Number(el.dataset.idx)); this._accept(); });
        });

        await this._runSequence();
    }

    async _runSequence() {
        /* Phase 0 — Fake CLI prompt. Path-prefixed zsh-style lines appear
           in turn with a cursor blinking at the end of each before the
           next is added. Format: "<path> cd <target>" with target shown
           as an underlined, link-style token. */
        await this._typeCommand('~', 'cd', 'xinyi');
        await this._wait(500);
        await this._typeCommand('~/xinyi', 'cd', 'portfolio');
        await this._wait(500);

        /* Status line fades in now that the shell has "started". */
        this.statusEl.style.transition = 'opacity 0.4s ease';
        this.statusEl.style.opacity = '1';

        /* Phase 1 — Thinking (1.0s) */
        await this._wait(1000);

        /* Phase 2 — Reading projects. Render all rows upfront as ☐ pending;
           the "active cursor" then walks down, flipping each to ■ active
           (orange) for ~240ms, then to ✓ done (gray + strikethrough). */
        this._setStatus('Reading projects', true);
        const names = this.projects.map(p => p['project name']).slice(0, 8);
        this._renderLogRows(names);

        const rows = [...this.logEl.querySelectorAll('.stk-boot-row')];
        for (const row of rows) {
            const marker = row.querySelector('.marker');
            row.classList.add('is-active');
            if (marker) marker.textContent = '■';
            await this._wait(240);
            row.classList.remove('is-active');
            row.classList.add('is-done');
            if (marker) marker.textContent = '✓';
        }
        await this._wait(200);

        /* Phase 3 — Composing (short pause) */
        this._setStatus('Composing', true);
        await this._wait(400);

        /* Phase 4 — Ready (gray, no ellipsis) + prompt */
        this._setStatus('Ready', false);
        this.statusEl.classList.add('is-ready');
        this.promptEl.hidden = false;
        this.promptEl.offsetHeight; /* force reflow */
        this.promptEl.classList.add('is-revealed');

        document.addEventListener('keydown', this._onKey);
    }

    _setStatus(label, pulsing) {
        const labelEl = this.statusEl.querySelector('.label');
        const ellipsisEl = this.statusEl.querySelector('.ellipsis');
        labelEl.textContent = label;
        if (ellipsisEl) ellipsisEl.style.display = pulsing ? '' : 'none';
        this.statusEl.classList.toggle('is-ready', !pulsing);
    }

    /* Appends a "$ cmd" line with a blinking cursor at the end. Cursor
       stays on the active line; once this resolves (after ~400ms cursor
       pause), the cursor is removed so the line reads as completed
       history — the next command (or status) then gets its own turn. */
    _typeCommand(path, verb, arg) {
        const line = document.createElement('div');
        line.className = 'stk-boot-cmd';
        line.innerHTML = `
            <span class="prompt">${this._esc(path)}</span>
            <span class="verb">${this._esc(verb)}</span>
            <span class="arg">${this._esc(arg)}</span>
            <span class="cursor">▋</span>
        `;
        this.cmdsEl.appendChild(line);
        return new Promise(resolve => {
            this.timers.push(setTimeout(() => {
                const cur = line.querySelector('.cursor');
                if (cur) cur.remove();
                resolve();
            }, 400));
        });
    }

    _renderLogRows(names) {
        this.logEl.hidden = false;
        this.logEl.innerHTML = '';
        names.forEach((name, idx) => {
            const li = document.createElement('li');
            li.className = 'stk-boot-row';
            li.innerHTML = `
                ${idx === 0 ? '<span class="tree">L</span>' : '<span class="tree"></span>'}
                <span class="marker">☐</span>
                <span class="label">Read "${this._esc(name)}"</span>
            `;
            this.logEl.appendChild(li);
        });
    }

    _focus(idx) {
        this.focused = idx;
        this.choiceEls.forEach((el, i) => el.classList.toggle('is-focus', i === idx));
    }

    _onKey(e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            this._focus((this.focused + 1) % 2);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            this._accept();
        }
    }

    _accept() {
        if (this._accepted) return;
        this._accepted = true;
        document.removeEventListener('keydown', this._onKey);

        /* Fade chrome (status + log + choices + hint + card header/footer) */
        this.statusEl.classList.add('is-fading');
        this.logEl.classList.add('is-fading');
        this.bootEl.querySelector('.stk-boot-choices').classList.add('is-fading');
        this.bootEl.querySelector('.stk-boot-hint').classList.add('is-fading');
        const cardHeader = this.bootEl.querySelector('.stk-boot-insight-header');
        const cardFooter = this.bootEl.querySelector('.stk-boot-insight-footer');
        if (cardHeader) cardHeader.style.opacity = '0';
        if (cardFooter) cardFooter.style.opacity = '0';

        /* Reveal the app behind the boot overlay with a simple cross-fade.
           The overlay fades out, body.booted triggers the app fade-in —
           no FLIP, no scale flourish, just a clean handoff. */
        document.body.classList.remove('booting');
        document.body.classList.add('booted');
        this.bootEl.classList.add('is-gone');

        this.timers.push(setTimeout(() => this.bootEl.remove(), 700));
    }

    _finishImmediate() {
        document.body.classList.remove('booting');
        document.body.classList.add('booted');
    }

    _wait(ms) { return new Promise(r => { const t = setTimeout(r, ms); this.timers.push(t); }); }
    _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
}

class StickyWall {
    /* Sticky palette colors cycled across tiles. Order matches the restrained
       low-sat palette from the design handoff. */
    static TILE_COLORS = ['wheat', 'mist', 'sage', 'putty', 'fog', 'cream', 'dust', 'linen', 'bone', 'ivory'];

    /* Fixed layout slots t1..t14. Positions declared in stickies-wall.css
       (absolute left/top/width/height + --tile-rot). Each slot is filled
       from the HERO manifest below — a hand-curated ordered list — rather
       than by auto-slicing gallery.json, so the collage is a deliberate
       selection instead of whatever happens to be most recent. */
    static SLOTS = ['t1','t2','t3','t4','t5','t6','t7','t8','t9','t10','t11','t12','t13','t14'];

    /* Curated hero manifest. `name` must match `project name` in gallery.json.
       `kind: 'text'` renders as a text-only sticky (no cover image). */
    static HERO = [
        { name: "Claude Code ↔ Figma: Building an AI-Powered Portfolio Assistant", kind: 'image' },
        { name: "Interactive Virtual Drum Kit",                                    kind: 'image' },
        { name: "Design Museum Tour as a Game",                                    kind: 'text'  },
        { name: "Rider Dispatch & Scheduling Platform",                            kind: 'image' },
        { name: "Re-Architecting Alibaba Help Center for Global Consistency",      kind: 'image' },
        { name: "KOL Growth Strategy",                                             kind: 'image' },
        { name: "Customer Service Workspace & AI Chatbot",                         kind: 'image' },
        { name: "FriendUp Map-based Social App",                                   kind: 'image' },
        { name: "Content-Driven Food Delivery Experience",                         kind: 'image' },
        { name: "Farmer Coffee Logo",                                              kind: 'image' },
        { name: "The Museum Kit — Reframing Art through Interaction",              kind: 'image' },
        { name: "My friends are my power station",                                 kind: 'image' },
        { name: "How Are Oscars Biased?",                                          kind: 'text'  },
        { name: "Global 1 Million AUDITION",                                       kind: 'image' },
    ];

    /* Paper flourishes — kept lightweight so no single tile dominates */
    static TORN = { t2: 'top', t5: 'bot', t9: 'top', t13: 'bot' };
    static TAPE = { t1: 'left', t6: 'right', t11: 'left' };
    static PAPER = { t3: 'dot-paper', t8: 'grid-paper', t14: 'dot-paper' };

    /* Disciplines — each drives one horizontal walkthrough act.
       `match` is a predicate against a gallery.json entry's classification. */
    static ACTS = [
        {
            key: 'UX/Product',
            kicker: 'Discipline 01 / 04',
            roman: 'I',
            titleHtml: 'Interfaces <em>for the other</em> side of scale.',
            blurb: "Years at consumer scale — Alibaba, ByteDance, and the projects that taught me how a single pixel changes a rider's shift or a user's afternoon.",
            match: (p) => p.classification === 'UX/Product',
        },
        {
            key: 'Experiential',
            kicker: 'Discipline 02 / 04',
            roman: 'II',
            titleHtml: 'Things <em>you can</em> walk into.',
            blurb: 'Installations, speculative museum games, kitchens rebuilt as spatial video. The work where the screen became optional.',
            match: (p) => p.classification === 'Experiential',
        },
        {
            key: 'Content',
            kicker: 'Discipline 03 / 04',
            roman: 'III',
            titleHtml: 'Stories with <em>structure.</em>',
            blurb: 'Data narrative, creator strategy, and arguments that try to earn their conclusion. Writing as a design discipline.',
            match: (p) => p.classification === 'Content',
        },
        {
            key: 'Visual',
            kicker: 'Discipline 04 / 04',
            roman: 'IV',
            titleHtml: 'Marks, systems, <em>paper.</em>',
            blurb: 'Identity, data visualization, and campaign work. The craft of making something feel inevitable once you see it.',
            match: (p) => p.classification === 'Visual',
        },
    ];

    constructor(heroSelector, bridgeSelector, actsSelector, panelSelector) {
        this.heroEl = document.querySelector(heroSelector);
        this.bridgeEl = document.querySelector(bridgeSelector);
        this.actsEl = document.querySelector(actsSelector);
        this.panelEl = document.querySelector(panelSelector);
        this.projects = [];
        this.panelBackdrop = null;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onHeroScroll = this._onHeroScroll.bind(this);
    }

    async init() {
        if (!this.heroEl || !this.actsEl) return;

        try {
            const res = await fetch('./content/gallery.json');
            if (!res.ok) throw new Error('Failed to load gallery.json');
            const data = await res.json();
            /* Sort most-recent-first so t1 gets the newest project */
            this.projects = data.slice().sort((a, b) => b.date.localeCompare(a.date));
        } catch (err) {
            console.error('StickyWall: failed to load gallery.json', err);
            return;
        }

        this._buildHero();
        this._buildBridge();
        this._buildActs();
        this._buildPanel();
        this._attachEvents();
    }

    /* ------------------------------------------------------------------ */
    /*  HERO — 14 curated tiles on a 24×14 grid                            */
    /* ------------------------------------------------------------------ */
    _buildHero() {
        const collage = document.createElement('div');
        collage.className = 'stk-collage';

        /* Background video — muted + loop + playsInline for cross-browser autoplay */
        const bgVideo = document.createElement('video');
        bgVideo.className = 'stk-hero-video';
        bgVideo.src = './assets/videos/hero.mp4';
        bgVideo.autoplay = true;
        bgVideo.loop = true;
        bgVideo.muted = true;
        bgVideo.playsInline = true;
        bgVideo.setAttribute('aria-hidden', 'true');
        collage.appendChild(bgVideo);

        /* Handwritten-style heading above the tile collage */
        const heading = document.createElement('h1');
        heading.className = 'stk-headline';
        heading.innerHTML = `
            Xinyi is a senior<br>
            UX designer thinking<br>
            with her hands <span class="stk-strike">in pixels</span><br>
            in paper, <span class="stk-underline">AI</span>, and space.
        `;
        collage.appendChild(heading);

        const byName = new Map(this.projects.map(p => [p['project name'], p]));
        StickyWall.HERO.forEach((entry, i) => {
            const project = byName.get(entry.name);
            if (!project) { console.warn('StickyWall: hero project not found in gallery.json:', entry.name); return; }
            const slot = StickyWall.SLOTS[i];
            const color = StickyWall.TILE_COLORS[i % StickyWall.TILE_COLORS.length];
            collage.appendChild(this._createTile(project, i, slot, color, entry.kind));
        });

        this.heroEl.innerHTML = '';
        this.heroEl.appendChild(collage);

        const plate = document.createElement('div');
        plate.className = 'stk-plate';
        plate.innerHTML = `
            <span>Xinyi Han · Selected Work · ${this._yearOf(this.projects[this.projects.length - 1])} — ${this._yearOf(this.projects[0])}</span>
            <span class="issue"><em>↓ Scroll to walk through</em></span>
            <span>Instrument Serif / Geist / JetBrains Mono</span>
        `;
        this.heroEl.appendChild(plate);

        const nudge = document.createElement('div');
        nudge.className = 'stk-nudge';
        nudge.textContent = 'Scroll · 01 / 06';
        this.heroEl.appendChild(nudge);

        window.addEventListener('scroll', this._onHeroScroll, { passive: true });
        this._onHeroScroll();
    }

    _createTile(p, i, slot, color, kind = 'image') {
        const tile = document.createElement('article');
        const torn = StickyWall.TORN[slot];
        const paper = StickyWall.PAPER[slot];
        const tape = StickyWall.TAPE[slot];
        const classes = ['stk-tile'];
        if (torn === 'top') classes.push('torn-top');
        if (torn === 'bot') classes.push('torn-bot');
        if (paper) classes.push(paper);

        tile.className = classes.join(' ');
        tile.dataset.slot = slot;
        tile.dataset.c = color;
        tile.dataset.kind = kind;
        tile.style.animationDelay = `${0.2 + i * 0.03}s`;
        tile.addEventListener('click', () => this._openPanel(p));

        if (tape !== undefined) {
            const tapeEl = document.createElement('div');
            tapeEl.className = `stk-tape ${tape}`.trim();
            tile.appendChild(tapeEl);
        }

        const inner = document.createElement('div');
        inner.className = 'stk-inner';

        const chips = (p.tag || '').split(',').map(t => t.trim()).filter(Boolean);
        const title = p['project name'];
        const year = this._yearOf(p);

        /* Image kind builds a <photo> block; on 404 the onerror flips data-kind
           to 'text' as a safety net. Text kind skips the photo entirely so
           there's no flash of broken image. */
        if (kind === 'image') {
            const photo = document.createElement('div');
            photo.className = 'stk-photo';
            const img = document.createElement('img');
            img.src = this._thumbUrl(p);
            img.alt = title;
            img.loading = 'lazy';
            img.addEventListener('error', () => {
                tile.dataset.kind = 'text';
                photo.remove();
            });
            photo.appendChild(img);
            inner.appendChild(photo);
        }

        inner.appendChild(this._html(`
            <div class="stk-meta">
                <span class="t">${this._esc(title)}</span>
                ${chips.length ? `<div class="chips">${chips.slice(0, 2).map(c => `<span class="chip">${this._esc(c)}</span>`).join('')}</div>` : ''}
                <span class="kind">${this._esc(p.classification)} · ${year}</span>
            </div>
        `));

        tile.appendChild(inner);
        return tile;
    }

    /* ------------------------------------------------------------------ */
    /*  BRIDGE — quote that fades in on scroll                             */
    /* ------------------------------------------------------------------ */
    _buildBridge() {
        if (!this.bridgeEl) return;
        this.bridgeEl.innerHTML = `
            <div>
                <q>The portfolio is a kind of notebook. Stickers are how you tell people what has been lived there.</q>
                <div class="attr">— studio notes · ${this._monthYear()}</div>
            </div>
        `;
        const io = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) this.bridgeEl.classList.add('on'); });
        }, { threshold: 0.3 });
        io.observe(this.bridgeEl);
    }

    /* ------------------------------------------------------------------ */
    /*  ACTS — horizontal walkthrough, sticky + translateX                 */
    /* ------------------------------------------------------------------ */
    _buildActs() {
        this.actsEl.innerHTML = '';

        StickyWall.ACTS.forEach((act, actIndex) => {
            const cards = this.projects.filter(act.match);
            if (!cards.length) return;

            const vhHeight = 120 + cards.length * 60;
            const section = document.createElement('section');
            section.className = 'stk-hact';
            section.style.height = `${vhHeight}vh`;
            section.dataset.screenLabel = `0${actIndex + 2} ${act.key}`;

            const sticky = document.createElement('div');
            sticky.className = 'stk-hact-sticky';

            const track = document.createElement('div');
            track.className = 'stk-hact-track';

            /* Intro panel */
            const intro = document.createElement('div');
            intro.className = 'stk-hact-intro';
            intro.innerHTML = `
                <div class="k">${this._esc(act.kicker)}</div>
                <div class="roman">${act.roman}</div>
                <h2>${act.titleHtml}</h2>
                <p class="blurb">${this._esc(act.blurb)}</p>
                <div class="count">
                    <div>Works<b>${cards.length}</b></div>
                    <div>Span<b>${this._yearOf(cards[cards.length - 1])}–${this._yearOf(cards[0])}</b></div>
                </div>
            `;
            track.appendChild(intro);

            /* Cards */
            const sizeVariants = ['wide', '', 'small', 'tall', '', 'small', 'book', ''];
            const colorVariants = ['cream', 'sage', 'wheat', 'dust', 'linen', 'fog', 'putty', 'mist'];
            cards.forEach((p, i) => {
                const hcard = document.createElement('article');
                const sizeMod = sizeVariants[i % sizeVariants.length];
                hcard.className = `stk-hcard ${sizeMod}`.trim();
                hcard.dataset.c = colorVariants[i % colorVariants.length];
                hcard.addEventListener('click', () => this._openPanel(p));

                hcard.innerHTML = `
                    <div class="big">
                        <div class="top">
                            <span>№ ${String(i + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}</span>
                            <span>${this._esc(p.classification)}</span>
                        </div>
                        <div class="hcover">
                            <img src="${this._thumbUrl(p)}" alt="${this._esc(p['project name'])}" loading="lazy">
                        </div>
                        <div>
                            <h3>${this._esc(p['project name'])}</h3>
                            <p class="sub">${this._esc(p.tag || '')}.</p>
                        </div>
                        <div class="foot">
                            <span>${this._yearOf(p)}</span>
                            <span>${this._esc(p.company || '—')}</span>
                        </div>
                    </div>
                `;
                track.appendChild(hcard);
            });

            /* Progress indicator */
            const progress = document.createElement('div');
            progress.className = 'stk-hact-progress';
            progress.innerHTML = `
                <div class="label">${this._esc(act.key)}</div>
                <div class="counter">01 / ${String(cards.length).padStart(2, '0')}</div>
                <div class="bar"></div>
            `;

            const hint = document.createElement('div');
            hint.className = 'stk-hact-hint';
            hint.textContent = 'Scroll · pan right →';

            sticky.appendChild(track);
            sticky.appendChild(progress);
            sticky.appendChild(hint);
            section.appendChild(sticky);
            this.actsEl.appendChild(section);

            this._bindActScroll(section, track, progress, cards.length);
        });
    }

    _bindActScroll(section, track, progress, cardCount) {
        const bar = progress.querySelector('.bar');
        const counter = progress.querySelector('.counter');
        let raf = null;
        const onScroll = () => {
            if (raf) return;
            raf = requestAnimationFrame(() => {
                raf = null;
                const rect = section.getBoundingClientRect();
                const total = section.offsetHeight - window.innerHeight;
                if (total <= 0) return;
                const p = Math.max(0, Math.min(1, -rect.top / total));
                const maxX = track.scrollWidth - window.innerWidth;
                const x = -p * maxX;
                track.style.transform = `translate3d(${x}px, 0, 0)`;
                if (bar) bar.style.width = (p * 100).toFixed(1) + '%';
                if (counter) {
                    const idx = Math.min(cardCount, Math.floor(p * (cardCount + 0.5)) + 1);
                    counter.textContent = `${String(idx).padStart(2, '0')} / ${String(cardCount).padStart(2, '0')}`;
                }
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    /* ------------------------------------------------------------------ */
    /*  HERO zoom/fade on scroll                                           */
    /* ------------------------------------------------------------------ */
    _onHeroScroll() {
        if (!this.heroEl) return;
        const y = window.scrollY;
        const vh = window.innerHeight;
        const p = Math.max(0, Math.min(1, y / (vh * 0.9)));
        const scale = 1 - p * 0.08;
        const opacity = 1 - p * 0.9;
        this.heroEl.style.transform = `scale(${scale})`;
        this.heroEl.style.opacity = String(opacity);
    }

    /* ------------------------------------------------------------------ */
    /*  CASE PANEL                                                         */
    /* ------------------------------------------------------------------ */
    _buildPanel() {
        if (!this.panelEl) return;
        this.panelBackdrop = document.createElement('div');
        this.panelBackdrop.className = 'stk-panel-backdrop';
        this.panelBackdrop.addEventListener('click', () => this._closePanel());
        document.body.appendChild(this.panelBackdrop);
    }

    _openPanel(p) {
        if (!this.panelEl || !p) return;
        const idx = this.projects.findIndex(x => x === p);
        const slug = this._slugOf(p);
        this.panelEl.innerHTML = `
            <button class="close" type="button" aria-label="Close">Close ✕</button>
            <div class="hero-img">
                <img src="${this._thumbUrl(p)}" alt="${this._esc(p['project name'])}">
            </div>
            <p class="kicker">№ ${String(idx + 1).padStart(2, '0')} / ${String(this.projects.length).padStart(2, '0')} · ${this._esc(p.classification)}</p>
            <h2>${this._esc(p['project name'])}</h2>
            <p class="dek">${this._esc(p.tag || '')}.</p>
            <div class="facts">
                <div>Year<b>${this._yearOf(p)}</b></div>
                <div>Discipline<b>${this._esc(p.classification)}</b></div>
                <div>Company<b>${this._esc(p.company || '—')}</b></div>
                <div>Slug<b>${this._esc(slug)}</b></div>
            </div>
            <a class="open-case" href="./${this._esc(p.projectUrl)}" target="_blank" rel="noopener noreferrer">Open case study →</a>
        `;
        this.panelEl.querySelector('.close').addEventListener('click', () => this._closePanel());

        this.panelEl.classList.add('on');
        this.panelBackdrop.classList.add('on');
        document.body.classList.add('scroll-locked');
    }

    _closePanel() {
        if (!this.panelEl) return;
        this.panelEl.classList.remove('on');
        this.panelBackdrop.classList.remove('on');
        document.body.classList.remove('scroll-locked');
    }

    _attachEvents() {
        document.addEventListener('keydown', this._onKeyDown);
    }

    _onKeyDown(e) {
        if (e.key === 'Escape' && this.panelEl && this.panelEl.classList.contains('on')) {
            this._closePanel();
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */
    _slugOf(p) {
        const parts = (p.coverImageUrl || '').split('/');
        return parts[1] || '';
    }

    _thumbUrl(p) {
        const slug = this._slugOf(p);
        return `assets/images/thumbs/${slug}-thumb.jpg`;
    }

    _yearOf(p) {
        return (p && p.date) ? p.date.slice(0, 4) : '';
    }

    _monthYear() {
        const d = new Date();
        return d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    }

    _esc(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    _html(s) {
        const tpl = document.createElement('template');
        tpl.innerHTML = s.trim();
        return tpl.content.firstChild;
    }
}
