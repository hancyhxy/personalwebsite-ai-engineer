class PolaroidCard {
    constructor(projectData, index) {
        this.data = projectData;
        this.index = index;
        this.slug = this._extractSlug(projectData.coverImageUrl);
        this.el = this._createElement();
        this._attachEvents();
    }

    _extractSlug(coverImageUrl) {
        // coverImageUrl is like "gallery/portfolio-ai-assistant/public/cover.png"
        // Extract the second path segment as the slug
        const parts = coverImageUrl.split('/');
        return parts[1] || '';
    }

    _createElement() {
        const card = document.createElement('div');
        card.className = 'polaroid-card';
        card.setAttribute('data-index', this.index);

        const img = document.createElement('img');
        img.className = 'polaroid-card__image';
        img.src = `assets/images/thumbs/${this.slug}-thumb.jpg`;
        img.alt = this.data['project name'];
        img.loading = 'lazy';

        const label = document.createElement('span');
        label.className = 'polaroid-card__label';
        label.textContent = this.data['project name'];
        label.title = this.data['project name'];

        const tag = document.createElement('span');
        tag.className = 'polaroid-card__tag';
        tag.textContent = this.data.tag;
        tag.title = this.data.tag;

        card.appendChild(img);
        card.appendChild(label);
        card.appendChild(tag);

        return card;
    }

    _attachEvents() {
        this.el.addEventListener('mouseenter', () => this._onMouseEnter());
        this.el.addEventListener('mousemove', (e) => this._onMouseMove(e));
        this.el.addEventListener('mouseleave', () => this._onMouseLeave());
    }

    _onMouseEnter() {
        // Nothing extra needed; CSS handles the hover state
    }

    _onMouseMove(e) {
        const rect = this.el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        // Range: +/-5 degrees
        const rotateY = ((x - centerX) / centerX) * 5;
        const rotateX = ((centerY - y) / centerY) * 5;

        this.el.style.setProperty('--rotateX', `${rotateX.toFixed(2)}deg`);
        this.el.style.setProperty('--rotateY', `${rotateY.toFixed(2)}deg`);
    }

    _onMouseLeave() {
        this.el.style.setProperty('--rotateX', '0deg');
        this.el.style.setProperty('--rotateY', '0deg');
    }

    getElement() {
        return this.el;
    }

    getCenter() {
        const rect = this.el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    getData() {
        return this.data;
    }

    getSlug() {
        return this.slug;
    }
}
