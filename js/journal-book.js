/* journal-book.js — page-flip engine.
   Renders the full ordered spread list as stacked .j-spread layers, then animates
   transitions between them with CSS perspective + rotateY on a "flap" element.

   Each spread can be:
     - { spanBoth: true, html }            → single full-width content (cover, hero, tab, back)
     - { leftHtml, rightHtml }             → two-column page layout (title, about)

   The book mounts a fixed pool of three spread DOMs (prev / current / next) and
   swaps content as the index advances, so flip animations stay smooth. */

class Book {
    constructor(rootSelector, spreads, opts = {}) {
        this.root = document.querySelector(rootSelector);
        this.spreads = spreads;
        this.index = 0;
        this.flipping = false;
        this.flipMs = opts.flipMs || 900;
        this.tabFlipDelay = opts.tabFlipDelay || 220;  // delay between consecutive flips when jumping
        this._build();
        this._bindControls();
        this._render();
    }

    _build() {
        // Three persistent layers — current, an under-layer (prev/next), and a flipping flap.
        // Implemented as three .j-spread children, with a single flap that hosts the page being turned.
        this.root.innerHTML = `
          <div class="j-spread layer-under"></div>
          <div class="j-spread layer-current is-active"></div>
          <div class="j-spread layer-flap">
            <div class="j-flap right">
              <div class="face front"></div>
              <div class="face back"></div>
            </div>
          </div>
        `;
        this.layerUnder = this.root.querySelector('.layer-under');
        this.layerCurrent = this.root.querySelector('.layer-current');
        this.layerFlap = this.root.querySelector('.layer-flap');
        this.flap = this.layerFlap.querySelector('.j-flap');
        this.flapFront = this.flap.querySelector('.face.front');
        this.flapBack = this.flap.querySelector('.face.back');
        this.layerFlap.style.display = 'none';
    }

    _renderSpreadInto(layer, spread) {
        if (!spread) { layer.innerHTML = ''; return; }
        // spread can span both pages or have separate left/right
        if (spread.spanBoth) {
            layer.innerHTML = spread.html;   // single .j-page child fills the spread
            // Make it span via inline grid override
            const child = layer.firstElementChild;
            if (child) child.style.gridColumn = '1 / -1';
        } else {
            layer.innerHTML = `
              <div class="j-page left">${spread.leftHtml || ''}</div>
              <div class="j-page right">${spread.rightHtml || ''}</div>`;
        }
    }

    _render() {
        this._renderSpreadInto(this.layerCurrent, this.spreads[this.index]);
        this._renderSpreadInto(this.layerUnder, this.spreads[this.index + 1] || null);
        this._notify();
    }

    _bindControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') this.next();
            else if (e.key === 'ArrowLeft') this.prev();
        });

        // Touch swipe
        let startX = 0, dx = 0;
        this.root.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; dx = 0; }, { passive: true });
        this.root.addEventListener('touchmove',  (e) => { dx = e.touches[0].clientX - startX; }, { passive: true });
        this.root.addEventListener('touchend',   () => {
            if (dx < -40) this.next();
            else if (dx > 40) this.prev();
        });

        // Click on right page area to advance
        this.root.addEventListener('click', (e) => {
            // Only if click hit the page itself, not interactive children
            const target = e.target;
            if (target.closest('button, a, .j-hcard, .j-polaroid, .j-note, .j-ticket, .j-card, .toc-row, .j-tab')) return;
            const rect = this.root.getBoundingClientRect();
            const xRatio = (e.clientX - rect.left) / rect.width;
            if (xRatio > 0.6) this.next();
            else if (xRatio < 0.4) this.prev();
        });
    }

    canPrev() { return this.index > 0; }
    canNext() { return this.index < this.spreads.length - 1; }

    next() {
        if (this.flipping || !this.canNext()) return;
        return this._flip(this.index + 1, 'forward');
    }
    prev() {
        if (this.flipping || !this.canPrev()) return;
        return this._flip(this.index - 1, 'backward');
    }

    /* Jump to a specific spread index, animating multiple flips in sequence. */
    async flipTo(targetIndex) {
        if (this.flipping) return;
        targetIndex = Math.max(0, Math.min(this.spreads.length - 1, targetIndex));
        if (targetIndex === this.index) return;
        const dir = targetIndex > this.index ? 'forward' : 'backward';
        const step = dir === 'forward' ? 1 : -1;
        const distance = Math.abs(targetIndex - this.index);
        // For long jumps, accelerate by shortening flip duration proportionally.
        const stepMs = distance > 3 ? Math.max(380, this.flipMs * 0.5) : this.flipMs;
        const gap = distance > 3 ? Math.max(120, this.tabFlipDelay * 0.7) : this.tabFlipDelay;

        for (let i = 0; i < distance; i++) {
            await this._flip(this.index + step, dir, stepMs);
            if (i < distance - 1) await new Promise(r => setTimeout(r, gap));
        }
    }

    _flip(toIndex, direction, durationMs) {
        return new Promise((resolve) => {
            this.flipping = true;
            const dur = durationMs || this.flipMs;
            const incomingSpread = this.spreads[toIndex];
            if (!incomingSpread) { this.flipping = false; resolve(); return; }

            // Setup the flap: front face = current "leaving" content, back face = incoming.
            // For forward: flap covers the right half, rotates left around the spine.
            // For backward: flap covers the left half (mirrored), rotates right.
            const isForward = direction === 'forward';

            // Pre-render the incoming spread into the under-layer so it's already visible behind the flap.
            this._renderSpreadInto(this.layerUnder, incomingSpread);

            // Render flap faces
            // front = current half (the page about to flip away)
            // back  = incoming half (revealed mid-flip)
            const currentSpread = this.spreads[this.index];

            this.flapFront.innerHTML = this._halfHtml(currentSpread, isForward ? 'right' : 'left');
            this.flapBack.innerHTML  = this._halfHtml(incomingSpread, isForward ? 'left' : 'right');

            // Position the flap on the correct side
            this.flap.classList.remove('right', 'left', 'flipped');
            this.flap.classList.add(isForward ? 'right' : 'left');
            this.layerFlap.style.display = '';

            // Force reflow so the transition triggers
            // eslint-disable-next-line no-unused-expressions
            this.flap.offsetWidth;

            // Trigger the rotation
            requestAnimationFrame(() => {
                this.flap.style.transitionDuration = `${dur}ms`;
                this.flap.classList.add('flipped');
            });

            // After the animation, swap layers: the under-layer becomes the new current.
            const onEnd = () => {
                this.flap.removeEventListener('transitionend', onEnd);
                this.index = toIndex;
                this._renderSpreadInto(this.layerCurrent, incomingSpread);
                this._renderSpreadInto(this.layerUnder, this.spreads[this.index + (isForward ? 1 : -1)] || null);
                this.flap.classList.remove('flipped');
                this.flap.style.transitionDuration = '';
                this.layerFlap.style.display = 'none';
                this.flapFront.innerHTML = '';
                this.flapBack.innerHTML = '';
                this.flipping = false;
                this._notify();
                resolve();
            };
            this.flap.addEventListener('transitionend', onEnd);
            // Fallback timer (in case transitionend doesn't fire)
            setTimeout(() => { if (this.flipping) onEnd(); }, dur + 100);
        });
    }

    /* Render one side of a spread (left or right) for use as a flap face. */
    _halfHtml(spread, side) {
        if (!spread) return '';
        if (spread.spanBoth) {
            // For full-width spreads, the flap face shows the half of the spread
            // by clipping the full content to that side via CSS. Cheap approach:
            // wrap full content in a div and use overflow:hidden + transform.
            // Simpler: just show the page background as a flat sheet — full content
            // has just been swapped under the flap so the user sees it as the flap clears.
            return `<div class="j-page ${side}"></div>`;
        }
        return `<div class="j-page ${side}">${(side === 'left' ? spread.leftHtml : spread.rightHtml) || ''}</div>`;
    }

    _notify() {
        this.root.dispatchEvent(new CustomEvent('book:change', {
            detail: { index: this.index, spread: this.spreads[this.index] },
        }));
    }
}

window.JournalBook = Book;
