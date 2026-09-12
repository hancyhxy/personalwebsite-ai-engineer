/* journal-app.js — application entrypoint.
   Loads gallery.json, builds spreads, mounts the Book, wires up tab nav and
   hero-card jumps. Listens for book:change to keep tab "current" indicator in sync. */

class JournalApp {
    constructor() {
        this.book = null;
        this.spreads = null;
    }

    async init() {
        // Load data
        const projects = await fetch('./content/gallery.json').then(r => r.json());
        this.spreads = new window.JournalSpreads(projects);

        // Decorate the leather binder: rings + inner perspective stage + charm dangle.
        // Book engine then mounts the spread world inside .j-book-inner.
        const book = document.getElementById('j-book');
        book.innerHTML = `
          <div class="j-rings">
            ${'<div class="ring"></div>'.repeat(6)}
          </div>
          <div class="j-book-inner" id="j-book-inner"></div>
          <div class="j-charm">
            <svg viewBox="0 0 60 80" xmlns="http://www.w3.org/2000/svg">
              <!-- thread -->
              <path d="M30 0 Q28 20 32 40 Q34 50 30 60" stroke="#8a8a85" stroke-width="1" fill="none"/>
              <!-- silver ring -->
              <circle cx="30" cy="62" r="5" fill="none" stroke="#aaa" stroke-width="1.5"/>
              <!-- charm 1: heart -->
              <path d="M22 70 c-2 -3 2 -6 4 -3 c2 -3 6 0 4 3 c-1 2 -4 4 -4 4 c0 0 -3 -2 -4 -4z" fill="#d8636e" opacity="0.85"/>
              <!-- charm 2: tiny star -->
              <polygon points="40,68 41,71 44,71 42,73 43,76 40,74 37,76 38,73 36,71 39,71" fill="#e6c84a" opacity="0.85"/>
              <!-- charm 3: small key -->
              <circle cx="32" cy="76" r="2" fill="none" stroke="#8a8a85" stroke-width="1"/>
              <line x1="32" y1="78" x2="32" y2="80" stroke="#8a8a85" stroke-width="1"/>
            </svg>
          </div>
        `;

        // Mount the book engine into the inner stage
        const all = this.spreads.all();
        this.book = new window.JournalBook('#j-book-inner', all);

        // Build right-side tab nav (attached to .j-book so it's outside the perspective stage)
        this._buildTabs();
        this._bindInteractions();
        this._buildNav();

        this.book.root.addEventListener('book:change', () => this._syncTabs());
        this._syncTabs();
    }

    _buildTabs() {
        const stage = document.querySelector('.j-stage');
        const tabs = document.createElement('aside');
        tabs.className = 'j-tabs';
        tabs.innerHTML = window.JournalDisciplines.map(d => {
            const cssVar = `var(--tab-${d.key})`;
            const idx = this.spreads.indexForTab(d.key);
            return `<button class="j-tab" data-tab="${d.key}" data-spread="${idx}" style="--c:${cssVar}">${d.label}</button>`;
        }).join('');
        document.querySelector('.j-book').appendChild(tabs);

        tabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.j-tab');
            if (!btn) return;
            const idx = parseInt(btn.dataset.spread, 10);
            this.book.flipTo(idx);
        });
    }

    _buildNav() {
        const wrap = document.createElement('div');
        wrap.className = 'j-nav';
        wrap.innerHTML = `
          <button data-act="prev">← Prev</button>
          <span class="pn">— / —</span>
          <button data-act="next">Next →</button>
        `;
        document.querySelector('.j-book').appendChild(wrap);

        wrap.addEventListener('click', (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            if (btn.dataset.act === 'next') this.book.next();
            else this.book.prev();
        });

        const sync = () => {
            const cur = this.book.index;
            const total = this.book.spreads.length;
            wrap.querySelector('.pn').textContent = `${cur + 1} / ${total}`;
            wrap.querySelector('[data-act="prev"]').disabled = !this.book.canPrev();
            wrap.querySelector('[data-act="next"]').disabled = !this.book.canNext();
        };
        this.book.root.addEventListener('book:change', sync);
        sync();
    }

    _bindInteractions() {
        // Use event delegation on the book root so clicks on dynamically
        // re-rendered content keep working across page flips.
        this.book.root.addEventListener('click', (e) => {
            // Hero card → flip to that project's tab spread
            const hcard = e.target.closest('.j-hcard');
            if (hcard) {
                const slug = hcard.dataset.slug;
                const idx = this.spreads.indexForProject(slug);
                if (idx != null) this.book.flipTo(idx);
                return;
            }
            // TOC row → flip to that tab's first spread
            const tocRow = e.target.closest('.toc-row[data-tab]');
            if (tocRow) {
                const idx = this.spreads.indexForTab(tocRow.dataset.tab);
                if (idx != null) this.book.flipTo(idx);
                return;
            }
            // Collage element on tab spread — currently inert (no detail page).
            // Future: could open the project URL in a new tab.
        });
    }

    _syncTabs() {
        const tabs = document.querySelectorAll('.j-tab');
        const cur = this.book.spreads[this.book.index];
        tabs.forEach(t => {
            const isMatch = cur && cur.kind === 'tab' && cur.disc === t.dataset.tab;
            t.classList.toggle('is-current', isMatch);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new JournalApp();
    app.init().catch(err => console.error('Journal init failed:', err));
});
