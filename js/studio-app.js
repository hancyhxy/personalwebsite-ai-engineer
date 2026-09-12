// The Studio — vanilla port of app.jsx.
// No React, no Babel — renders directly into the existing DOM in index-studio.html.
(function () {
    'use strict';

    const PROJECTS = window.STUDIO_PROJECTS || [];
    const DISCIPLINES = window.STUDIO_DISCIPLINES || [];

    const state = {
        time: 'day',         // 'day' | 'evening'
        accent: 'ochre',     // 'ochre' | 'blue' | 'red'
        view: 'pin',         // 'pin' | 'index'
        cursor: false,       // custom pen cursor on/off
        grid: true,          // graph paper on/off on blotter
        filter: 'All',
        loupeOn: false,
        tweaksOn: false,
        openProject: null
    };

    // ---- small helpers --------------------------------------------------
    const $ = (sel, root = document) => root.querySelector(sel);
    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

    function el(tag, attrs = {}, children = []) {
        const node = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs)) {
            if (v == null || v === false) continue;
            if (k === 'class') node.className = v;
            else if (k === 'html') node.innerHTML = v;
            else if (k === 'onClick') node.addEventListener('click', v);
            else if (k.startsWith('data-')) node.setAttribute(k, v);
            else if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
            else node.setAttribute(k, v);
        }
        const kids = Array.isArray(children) ? children : [children];
        for (const c of kids) {
            if (c == null || c === false) continue;
            node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
        }
        return node;
    }

    function counts() {
        const c = { All: PROJECTS.length };
        DISCIPLINES.forEach(d => {
            c[d.key] = PROJECTS.filter(p => p.discipline === d.key).length;
        });
        return c;
    }

    // ---- masthead clock -------------------------------------------------
    function startClock() {
        const node = $('#studio-clock');
        if (!node) return;
        const tick = () => {
            const d = new Date();
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            node.textContent = `${hh}:${mm} AEDT`;
        };
        tick();
        setInterval(tick, 30000);
    }

    // ---- lamp toggle ----------------------------------------------------
    function setTime(t) {
        state.time = t;
        document.documentElement.setAttribute('data-time', t);
        const label = $('#lamp-label');
        if (label) label.textContent = `Desk lamp · ${t === 'evening' ? 'on' : 'off'}`;
        const seg = $('#tweak-time');
        if (seg) updateSeg(seg, t);
    }

    // ---- accent ---------------------------------------------------------
    const ACCENT_MAP = {
        ochre: { '--ochre': 'oklch(0.72 0.13 72)',  '--ochre-2': 'oklch(0.82 0.09 72)' },
        blue:  { '--ochre': 'oklch(0.55 0.12 240)', '--ochre-2': 'oklch(0.82 0.06 240)' },
        red:   { '--ochre': 'oklch(0.58 0.16 30)',  '--ochre-2': 'oklch(0.82 0.09 30)' }
    };
    function setAccent(a) {
        state.accent = a;
        const page = $('.studio-page');
        if (!page) return;
        const vars = ACCENT_MAP[a] || ACCENT_MAP.ochre;
        for (const [k, v] of Object.entries(vars)) page.style.setProperty(k, v);
        const seg = $('#tweak-accent');
        if (seg) updateSeg(seg, a);
    }

    // ---- cursor / grid --------------------------------------------------
    function setCursor(on) {
        state.cursor = on;
        const page = $('.studio-page');
        if (!page) return;
        page.classList.toggle('cursor-pen', on);
        const seg = $('#tweak-cursor');
        if (seg) updateSeg(seg, on ? 'pen' : 'system');
    }
    function setGrid(on) {
        state.grid = on;
        const page = $('.studio-page');
        if (!page) return;
        page.classList.toggle('no-grid', !on);
        const seg = $('#tweak-grid');
        if (seg) updateSeg(seg, on ? 'on' : 'off');
    }

    // ---- pen cursor -----------------------------------------------------
    function mountPenCursor() {
        const pen = $('#studio-pen');
        if (!pen) return;
        const move = (e) => {
            pen.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 3}px)`;
        };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseleave', () => pen.classList.add('hide'));
        window.addEventListener('mouseenter', () => pen.classList.remove('hide'));
    }

    // ---- render: desk (mostly static, JS only for small pieces) ---------
    function mountRuler() {
        const host = $('#studio-ruler');
        if (!host) return;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < 40; i++) {
            const tick = el('div', {
                class: 'tick',
                style: {
                    top: (i * 24) + 'px',
                    height: (i % 5 === 0 ? 14 : 6) + 'px',
                    borderColor: i % 5 === 0 ? 'rgba(40,30,10,0.7)' : 'rgba(40,30,10,0.35)'
                }
            });
            if (i % 5 === 0) tick.appendChild(el('span', { class: 'num', style: { top: 0 } }, String(i)));
            frag.appendChild(tick);
        }
        host.appendChild(frag);
    }

    // ---- filters --------------------------------------------------------
    function renderFilters() {
        const host = $('#studio-filters');
        if (!host) return;
        host.innerHTML = '';
        const cts = counts();

        const addBtn = (key, label) => {
            const btn = el('button', { class: 'filter', 'data-active': String(state.filter === key) }, [
                label + ' ',
                el('span', { class: 'count' }, String(cts[key] ?? 0))
            ]);
            btn.addEventListener('click', () => {
                state.filter = key;
                renderFilters();
                renderPinboard();
                renderIndex();
            });
            host.appendChild(btn);
        };
        addBtn('All', 'Everything');
        DISCIPLINES.forEach(d => addBtn(d.key, d.label));

        // view toggle
        const viewWrap = el('div', { class: 'view-toggle' });
        const mkView = (key, label) => {
            const b = el('button', { 'data-active': String(state.view === key) }, label);
            b.addEventListener('click', () => setView(key));
            return b;
        };
        viewWrap.appendChild(mkView('pin', 'Wall'));
        viewWrap.appendChild(el('span', {}, '·'));
        viewWrap.appendChild(mkView('index', 'Index'));
        host.appendChild(viewWrap);
    }

    function setView(v) {
        state.view = v;
        const pin = $('#studio-pinboard');
        const idx = $('#studio-index');
        if (pin) pin.style.display = v === 'pin' ? '' : 'none';
        if (idx) idx.style.display = v === 'index' ? '' : 'none';
        renderFilters();
        const seg = $('#tweak-view');
        if (seg) updateSeg(seg, v);
    }

    // ---- pinboard -------------------------------------------------------
    function renderPinboard() {
        const host = $('#studio-pinboard');
        if (!host) return;
        host.innerHTML = '';
        PROJECTS.forEach(p => {
            const dim = state.filter !== 'All' && p.discipline !== state.filter;
            const card = el('article', {
                class: 'card' + (dim ? ' dim' : ''),
                'data-discipline': p.discipline,
                'data-tag': p.tag,
                style: {
                    left: p.pin.x + '%',
                    top: (p.pin.y * 9) + 'px',
                    transform: `rotate(${p.pin.rot}deg)`
                }
            }, [
                el('span', { class: 'pushpin' }),
                el('h3', {}, p.title),
                el('div', { class: 'sub' }, p.subtitle),
                el('div', { class: 'meta' }, [
                    el('span', {}, `${p.discipline} · ${p.year}`),
                    el('span', {}, p.place)
                ])
            ]);
            card.addEventListener('click', () => openPanel(p));
            host.appendChild(card);
        });
    }

    // ---- index view -----------------------------------------------------
    function renderIndex() {
        const host = $('#studio-index');
        if (!host) return;
        host.innerHTML = '';
        PROJECTS.forEach((p, i) => {
            const dim = state.filter !== 'All' && p.discipline !== state.filter;
            const row = el('div', { class: 'idx-row' + (dim ? ' dim' : '') }, [
                el('span', { class: 'idx-n' }, '№ ' + String(i + 1).padStart(2, '0')),
                el('span', { class: 'idx-title' }, [
                    p.title,
                    el('em', {}, p.subtitle)
                ]),
                el('span', { class: 'idx-tag' }, p.tag),
                el('span', { class: 'idx-disc' }, p.discipline),
                el('span', { class: 'idx-year' }, `${p.year} · ${p.place}`),
                el('span', { class: 'idx-go' }, 'open →')
            ]);
            row.addEventListener('click', () => openPanel(p));
            host.appendChild(row);
        });
    }

    // ---- case study panel -----------------------------------------------
    function openPanel(p) {
        state.openProject = p;
        const backdrop = $('#studio-panel-backdrop');
        const panel = $('#studio-panel');
        if (!backdrop || !panel) return;

        const idx = PROJECTS.findIndex(x => x.id === p.id) + 1;
        const heroImg = p.cover
            ? `<img src="${p.cover}" alt="${p.title}" />`
            : `<div style="width:100%;height:100%;background:var(--paper-3);"></div>`;

        panel.innerHTML = `
            <div class="panel-head">
                <span>Case · ${String(idx).padStart(2, '0')} / ${PROJECTS.length} · ${p.discipline}</span>
                <button id="studio-panel-close">close [esc]</button>
            </div>
            <div class="panel-body">
                <h2>${escapeHtml(p.title)} — <em>${escapeHtml(p.subtitle)}</em></h2>
                <p class="dek">${escapeHtml(p.note || 'A piece of work from the wall. Click-through to the full case study.')}</p>
                <div class="specimen-hero">${heroImg}</div>
                <div class="grid2">
                    <dl>
                        <dt>Discipline</dt><dd>${escapeHtml(p.discipline)}</dd>
                        <dt>Year</dt><dd>${escapeHtml(p.year)}</dd>
                        <dt>Place</dt><dd>${escapeHtml(p.place)}</dd>
                        <dt>Format</dt><dd>${escapeHtml(p.kind)}</dd>
                        <dt>Tags</dt><dd>${escapeHtml(p.tag)}</dd>
                        <dt>Status</dt><dd>Shipped / ongoing</dd>
                    </dl>
                    <div class="prose">
                        <p>A short paragraph on the brief — what the team was trying to solve, what I did, and what I learned.</p>
                        <span class="margin-note">Margin note: The hardest part wasn't the interface.</span>
                        <p>Then a second paragraph on the craft: the decisions nobody asked me to make but that changed how the thing felt. These are the moments I pin to the wall.</p>
                        <p>Finally — the outcome, in the plainest words I can find. Numbers if they help, but never instead of the story.</p>
                    </div>
                </div>
            </div>
        `;
        $('#studio-panel-close').addEventListener('click', closePanel);

        backdrop.classList.add('on');
        panel.classList.add('on');
        document.body.style.overflow = 'hidden';
    }
    function closePanel() {
        state.openProject = null;
        $('#studio-panel-backdrop')?.classList.remove('on');
        $('#studio-panel')?.classList.remove('on');
        document.body.style.overflow = '';
    }
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[ch]);
    }

    // ---- loupe ----------------------------------------------------------
    let loupeTrack = null;
    function setLoupe(on) {
        state.loupeOn = on;
        const loupe = $('#loupe');
        const inner = $('#loupe-inner');
        const btn = $('#tool-loupe');
        if (btn) btn.setAttribute('data-active', String(on));
        if (!loupe || !inner) return;
        loupe.classList.toggle('on', on);

        if (loupeTrack) {
            window.removeEventListener('mousemove', loupeTrack);
            loupeTrack = null;
        }

        if (on) {
            // mirror the stage into the loupe at 2x
            const src = $('#stage');
            if (src) {
                inner.innerHTML = '';
                const clone = src.cloneNode(true);
                clone.style.pointerEvents = 'none';
                // strip IDs so nothing collides
                clone.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
                inner.appendChild(clone);
            }
            loupeTrack = (e) => {
                loupe.style.transform = `translate(${e.clientX - 90}px, ${e.clientY - 90}px)`;
                inner.style.transform = `translate(${-e.clientX * 2 + 90}px, ${-e.clientY * 2 + 90}px)`;
            };
            window.addEventListener('mousemove', loupeTrack);
        }
    }

    // ---- tweaks panel ---------------------------------------------------
    function updateSeg(segRoot, activeValue) {
        $$('button', segRoot).forEach(b => {
            b.setAttribute('data-on', String(b.dataset.value === String(activeValue)));
        });
    }

    function mountTweaks() {
        const host = $('#tweaks');
        if (!host) return;
        host.innerHTML = `
            <h5>Tweaks <span style="color:var(--ink-4)">studio knobs</span></h5>
            <div class="row">
                <label>Time of day</label>
                <div class="seg" id="tweak-time">
                    <button data-value="day">Day</button>
                    <button data-value="evening">Evening</button>
                </div>
            </div>
            <div class="row">
                <label>Signature accent</label>
                <div class="seg" id="tweak-accent">
                    <button data-value="ochre">Ochre</button>
                    <button data-value="blue">Ink-Blue</button>
                    <button data-value="red">Red</button>
                </div>
            </div>
            <div class="row">
                <label>Directory default</label>
                <div class="seg" id="tweak-view">
                    <button data-value="pin">Wall</button>
                    <button data-value="index">Index</button>
                </div>
            </div>
            <div class="row">
                <label>Custom cursor</label>
                <div class="seg" id="tweak-cursor">
                    <button data-value="pen">Pen</button>
                    <button data-value="system">System</button>
                </div>
            </div>
            <div class="row">
                <label>Graph paper blotter</label>
                <div class="seg" id="tweak-grid">
                    <button data-value="on">On</button>
                    <button data-value="off">Off</button>
                </div>
            </div>
        `;
        $$('#tweak-time button').forEach(b => b.addEventListener('click', () => setTime(b.dataset.value)));
        $$('#tweak-accent button').forEach(b => b.addEventListener('click', () => setAccent(b.dataset.value)));
        $$('#tweak-view button').forEach(b => b.addEventListener('click', () => setView(b.dataset.value)));
        $$('#tweak-cursor button').forEach(b => b.addEventListener('click', () => setCursor(b.dataset.value === 'pen')));
        $$('#tweak-grid button').forEach(b => b.addEventListener('click', () => setGrid(b.dataset.value === 'on')));

        updateSeg($('#tweak-time'), state.time);
        updateSeg($('#tweak-accent'), state.accent);
        updateSeg($('#tweak-view'), state.view);
        updateSeg($('#tweak-cursor'), state.cursor ? 'pen' : 'system');
        updateSeg($('#tweak-grid'), state.grid ? 'on' : 'off');
    }
    function setTweaks(on) {
        state.tweaksOn = on;
        $('#tweaks')?.classList.toggle('on', on);
        $('#tool-tweaks')?.setAttribute('data-active', String(on));
    }

    // ---- boot -----------------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        // Static interactive pieces
        startClock();
        mountRuler();
        mountPenCursor();
        mountTweaks();

        // Lamp button (on the desk)
        $('#lamp-toggle')?.addEventListener('click', () => setTime(state.time === 'day' ? 'evening' : 'day'));

        // Tools
        $('#tool-loupe')?.addEventListener('click', () => setLoupe(!state.loupeOn));
        $('#tool-tweaks')?.addEventListener('click', () => setTweaks(!state.tweaksOn));

        // Case panel close (backdrop + esc)
        $('#studio-panel-backdrop')?.addEventListener('click', closePanel);
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (state.openProject) closePanel();
                else if (state.tweaksOn) setTweaks(false);
                else if (state.loupeOn) setLoupe(false);
            }
        });

        // Project rendering
        renderFilters();
        renderPinboard();
        renderIndex();
        setView(state.view);

        // Apply initial state
        setTime(state.time);
        setAccent(state.accent);
        setCursor(state.cursor);
        setGrid(state.grid);
    });
})();
