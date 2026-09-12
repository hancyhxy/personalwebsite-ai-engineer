class VinylWallManager {
    constructor(containerSelector, svgOverlaySelector) {
        this.containerSelector = containerSelector;
        this.svgOverlaySelector = svgOverlaySelector;
        this.container = null;
        this.svgOverlay = null;
        this.cards = [];
        this.expandedCard = null;
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onClickOutside = this._onClickOutside.bind(this);
    }

    async init() {
        this.container = document.querySelector(this.containerSelector);
        this.svgOverlay = document.querySelector(this.svgOverlaySelector);

        if (!this.container) {
            console.error('VinylWallManager: container not found');
            return;
        }

        try {
            const response = await fetch('./content/gallery.json');
            if (!response.ok) throw new Error('Failed to load gallery.json');
            const projects = await response.json();

            this.cards = projects.map((project, index) => new VinylCard(project, index));
            this.render();

            document.addEventListener('vinylCardClick', (e) => {
                const card = e.detail.card;
                if (this.expandedCard === card) {
                    this.navigateToProject(card);
                } else if (this.expandedCard) {
                    this.collapseCard();
                    // Small delay before expanding new card
                    setTimeout(() => this.expandCard(card), 300);
                } else {
                    this.expandCard(card);
                }
            });
        } catch (error) {
            console.error('VinylWallManager: failed to initialize', error);
        }
    }

    render() {
        this.container.innerHTML = '';
        this.cards.forEach(card => {
            this.container.appendChild(card.getElement());
        });
    }

    expandCard(card) {
        this.expandedCard = card;
        const el = card.getElement();
        const rect = el.getBoundingClientRect();

        // Store original position for FLIP animation
        el.dataset.origTop = rect.top + 'px';
        el.dataset.origLeft = rect.left + 'px';
        el.dataset.origWidth = rect.width + 'px';

        // Set placeholder dimensions to prevent layout shift
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';

        // Calculate centered position
        const viewW = window.innerWidth;
        const viewH = window.innerHeight;
        const targetWidth = Math.min(360, viewW * 0.8);
        const targetLeft = (viewW - targetWidth) / 2;
        const targetTop = (viewH - targetWidth - 60) / 2; // account for info section

        // Apply fixed positioning
        el.style.position = 'fixed';
        el.style.top = rect.top + 'px';
        el.style.left = rect.left + 'px';
        el.style.width = rect.width + 'px';
        el.style.zIndex = '200';
        el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';

        // Force reflow
        el.offsetHeight;

        // Animate to center
        el.style.top = targetTop + 'px';
        el.style.left = targetLeft + 'px';
        el.style.width = targetWidth + 'px';

        el.classList.add('vinyl-card--expanded');

        // Dim the wall
        this.container.classList.add('vinyl-wall--dimmed');

        // Show related cards
        const related = this._computeRelated(card.getData());
        this.cards.forEach(c => {
            if (c !== card && related.includes(c)) {
                c.getElement().classList.add('vinyl-card--related');
            }
        });

        // Draw relationship lines
        requestAnimationFrame(() => {
            this._showRelationshipLines(card, related);
        });

        // Lock scroll
        document.body.classList.add('scroll-locked');

        // Listen for dismiss
        document.addEventListener('keydown', this._onKeyDown);
        setTimeout(() => {
            document.addEventListener('click', this._onClickOutside);
        }, 100);
    }

    collapseCard() {
        if (!this.expandedCard) return;

        const el = this.expandedCard.getElement();

        // Animate back to original position
        el.style.top = el.dataset.origTop;
        el.style.left = el.dataset.origLeft;
        el.style.width = el.dataset.origWidth;

        el.classList.remove('vinyl-card--expanded');

        // After animation completes, clear inline styles
        setTimeout(() => {
            el.style.position = '';
            el.style.top = '';
            el.style.left = '';
            el.style.width = '';
            el.style.height = '';
            el.style.zIndex = '';
            el.style.transition = '';
        }, 400);

        // Restore wall
        this.container.classList.remove('vinyl-wall--dimmed');

        // Clear related
        this.cards.forEach(c => {
            c.getElement().classList.remove('vinyl-card--related');
        });

        // Clear lines
        this._clearRelationshipLines();

        // Unlock scroll
        document.body.classList.remove('scroll-locked');

        // Remove listeners
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('click', this._onClickOutside);

        this.expandedCard = null;
    }

    navigateToProject(card) {
        const slug = card.slug;
        window.location.href = `projects/${slug}/index.html`;
    }

    _computeRelated(project) {
        const scores = this.cards
            .filter(c => c.getData() !== project)
            .map(c => {
                const other = c.getData();
                let score = 0;

                // Classification match: 2 points
                if (other.classification === project.classification) {
                    score += 2;
                }

                // Company match: 1 point
                if (other.company === project.company && project.company !== '-') {
                    score += 1;
                }

                // Shared tags: 1 point each
                const projTags = project.tag.split(',').map(t => t.trim().toLowerCase());
                const otherTags = other.tag.split(',').map(t => t.trim().toLowerCase());
                projTags.forEach(tag => {
                    if (otherTags.includes(tag)) {
                        score += 1;
                    }
                });

                return { card: c, score };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 4);

        return scores.map(item => item.card);
    }

    _showRelationshipLines(sourceCard, relatedCards) {
        if (!this.svgOverlay) return;
        this._clearRelationshipLines();

        const sourceCenter = sourceCard.getCenter();

        relatedCards.forEach(relCard => {
            const targetCenter = relCard.getCenter();
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.classList.add('relationship-line');
            line.setAttribute('x1', sourceCenter.x);
            line.setAttribute('y1', sourceCenter.y);
            line.setAttribute('x2', targetCenter.x);
            line.setAttribute('y2', targetCenter.y);
            this.svgOverlay.appendChild(line);
        });
    }

    _clearRelationshipLines() {
        if (!this.svgOverlay) return;
        this.svgOverlay.innerHTML = '';
    }

    _onKeyDown(e) {
        if (e.key === 'Escape') {
            this.collapseCard();
        }
    }

    _onClickOutside(e) {
        if (!this.expandedCard) return;
        const el = this.expandedCard.getElement();
        if (!el.contains(e.target)) {
            this.collapseCard();
        }
    }
}
