class WallManager {
    // States: BROWSE, EXPANDED
    static STATE_BROWSE = 'BROWSE';
    static STATE_EXPANDED = 'EXPANDED';

    constructor(containerSelector, svgOverlaySelector) {
        this.containerSelector = containerSelector;
        this.svgOverlaySelector = svgOverlaySelector;
        this.container = null;
        this.svgOverlay = null;
        this.cards = [];
        this.state = WallManager.STATE_BROWSE;
        this.expandedCard = null;
        this.placeholder = null;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onClickOutside = this._onClickOutside.bind(this);
    }

    async init() {
        this.container = document.querySelector(this.containerSelector);
        this.svgOverlay = document.querySelector(this.svgOverlaySelector);

        if (!this.container || !this.svgOverlay) {
            console.error('WallManager: container or SVG overlay not found');
            return;
        }

        try {
            const response = await fetch('./content/gallery.json');
            if (!response.ok) throw new Error('Failed to load gallery.json');
            const projects = await response.json();

            this.cards = projects.map((project, index) => new PolaroidCard(project, index));
            this.render();
            this._attachGlobalEvents();
        } catch (error) {
            console.error('WallManager: failed to initialize', error);
        }
    }

    render() {
        this.container.innerHTML = '';
        this.cards.forEach(card => {
            const el = card.getElement();
            el.addEventListener('click', () => this._onCardClick(card));
            this.container.appendChild(el);
        });
    }

    _attachGlobalEvents() {
        document.addEventListener('keydown', this._onKeyDown);
    }

    _onCardClick(card) {
        if (this.state === WallManager.STATE_BROWSE) {
            this.expandCard(card);
        } else if (this.state === WallManager.STATE_EXPANDED) {
            if (card === this.expandedCard) {
                this.navigateToProject(card);
            }
            // Clicking a related card does nothing special — user must click expanded to navigate
        }
    }

    expandCard(card) {
        this.state = WallManager.STATE_EXPANDED;
        this.expandedCard = card;

        const el = card.getElement();
        const rect = el.getBoundingClientRect();

        // Create placeholder to keep grid stable
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'polaroid-card-placeholder';
        this.placeholder.style.width = rect.width + 'px';
        this.placeholder.style.height = rect.height + 'px';
        el.parentNode.insertBefore(this.placeholder, el);

        // Record starting position for FLIP
        const startX = rect.left;
        const startY = rect.top;
        const startW = rect.width;
        const startH = rect.height;

        // Target: centered in viewport, max 500px wide
        const targetW = Math.min(500, window.innerWidth - 80);
        const targetH = targetW * (rect.height / rect.width);
        const targetX = (window.innerWidth - targetW) / 2;
        const targetY = (window.innerHeight - targetH) / 2;

        // Set fixed position at the original location first
        el.style.position = 'fixed';
        el.style.left = startX + 'px';
        el.style.top = startY + 'px';
        el.style.width = startW + 'px';
        el.style.height = startH + 'px';
        el.style.margin = '0';
        el.style.zIndex = '200';
        el.classList.add('polaroid-card--expanded');

        // Force reflow
        el.offsetHeight;

        // Animate to target
        el.style.transition = `all var(--duration-slow) var(--ease-out)`;
        el.style.left = targetX + 'px';
        el.style.top = targetY + 'px';
        el.style.width = targetW + 'px';
        el.style.height = 'auto';

        // Dim the wall
        this.container.classList.add('polaroid-wall--dimmed');

        // Show related cards and connection lines
        const relatedCards = this._computeRelated(card.getData());
        relatedCards.forEach(rc => {
            rc.getElement().classList.add('polaroid-card--related');
        });

        // Delay lines slightly so cards settle
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this._showRelationshipLines(card, relatedCards);
            });
        });

        // Lock scroll
        document.body.classList.add('scroll-locked');

        // Listen for outside clicks (delayed to avoid the triggering click)
        setTimeout(() => {
            document.addEventListener('click', this._onClickOutside);
        }, 50);
    }

    collapseCard() {
        if (this.state !== WallManager.STATE_EXPANDED || !this.expandedCard) return;

        const el = this.expandedCard.getElement();

        // Get placeholder position to animate back
        if (this.placeholder) {
            const placeholderRect = this.placeholder.getBoundingClientRect();

            el.style.transition = `all var(--duration-slow) var(--ease-out)`;
            el.style.left = placeholderRect.left + 'px';
            el.style.top = placeholderRect.top + 'px';
            el.style.width = placeholderRect.width + 'px';
            el.style.height = placeholderRect.height + 'px';

            // After transition, reset inline styles
            const onEnd = () => {
                el.removeEventListener('transitionend', onEnd);
                el.style.position = '';
                el.style.left = '';
                el.style.top = '';
                el.style.width = '';
                el.style.height = '';
                el.style.margin = '';
                el.style.zIndex = '';
                el.style.transition = '';
                el.classList.remove('polaroid-card--expanded');

                if (this.placeholder && this.placeholder.parentNode) {
                    this.placeholder.parentNode.removeChild(this.placeholder);
                }
                this.placeholder = null;
            };
            el.addEventListener('transitionend', onEnd);
        }

        // Un-dim
        this.container.classList.remove('polaroid-wall--dimmed');

        // Remove related highlights
        this.cards.forEach(c => {
            c.getElement().classList.remove('polaroid-card--related');
        });

        // Clear SVG lines
        this._clearRelationshipLines();

        // Unlock scroll
        document.body.classList.remove('scroll-locked');

        // Remove outside-click listener
        document.removeEventListener('click', this._onClickOutside);

        this.expandedCard = null;
        this.state = WallManager.STATE_BROWSE;
    }

    navigateToProject(card) {
        const slug = card.getSlug();
        window.location.href = `projects/${slug}/index.html`;
    }

    _computeRelated(project) {
        const projectTags = project.tag.split(',').map(t => t.trim().toLowerCase());

        const scored = this.cards
            .filter(c => c.getData() !== project)
            .map(c => {
                const other = c.getData();
                let score = 0;

                // Same classification: +2
                if (other.classification === project.classification) {
                    score += 2;
                }

                // Same company: +1
                if (other.company === project.company && project.company !== '-') {
                    score += 1;
                }

                // Shared tags: +1 each
                const otherTags = other.tag.split(',').map(t => t.trim().toLowerCase());
                projectTags.forEach(tag => {
                    if (otherTags.includes(tag)) {
                        score += 1;
                    }
                });

                return { card: c, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);

        return scored.map(item => item.card);
    }

    _showRelationshipLines(expandedCard, relatedCards) {
        this._clearRelationshipLines();

        const from = expandedCard.getCenter();

        relatedCards.forEach(rc => {
            const to = rc.getCenter();
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', from.x);
            line.setAttribute('y1', from.y);
            line.setAttribute('x2', to.x);
            line.setAttribute('y2', to.y);
            line.classList.add('relationship-line');
            this.svgOverlay.appendChild(line);
        });
    }

    _clearRelationshipLines() {
        while (this.svgOverlay.firstChild) {
            this.svgOverlay.removeChild(this.svgOverlay.firstChild);
        }
    }

    _onKeyDown(e) {
        if (e.key === 'Escape' && this.state === WallManager.STATE_EXPANDED) {
            this.collapseCard();
        }
    }

    _onClickOutside(e) {
        if (this.state !== WallManager.STATE_EXPANDED || !this.expandedCard) return;

        const expandedEl = this.expandedCard.getElement();

        // If the click is on the expanded card itself, let _onCardClick handle it
        if (expandedEl.contains(e.target)) return;

        // If the click is on a related card, ignore (don't collapse)
        const relatedEls = this.container.querySelectorAll('.polaroid-card--related');
        for (const rel of relatedEls) {
            if (rel.contains(e.target)) return;
        }

        this.collapseCard();
    }
}
