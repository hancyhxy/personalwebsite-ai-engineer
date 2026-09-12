class VinylCard {
    constructor(projectData, index) {
        this.data = projectData;
        this.index = index;
        this.slug = this._extractSlug(projectData.projectUrl);
        this.thumbUrl = `assets/images/thumbs/${this.slug}-thumb.jpg`;
        this.element = this._createElement();
        this._attachEvents();
    }

    _extractSlug(projectUrl) {
        const parts = projectUrl.split('/');
        return parts[1] || '';
    }

    _createElement() {
        const card = document.createElement('div');
        card.className = 'vinyl-card';
        card.style.animationDelay = `${this.index * 0.06}s`;

        // Vinyl disc (behind sleeve)
        const disc = document.createElement('div');
        disc.className = 'vinyl-card__disc';

        const spinner = document.createElement('div');
        spinner.className = 'vinyl-card__disc-spinner';

        const label = document.createElement('div');
        label.className = 'vinyl-card__disc-label';
        label.style.backgroundImage = `url('${this.thumbUrl}')`;

        spinner.appendChild(label);
        disc.appendChild(spinner);

        // Sleeve (cover image as square album cover)
        const sleeve = document.createElement('div');
        sleeve.className = 'vinyl-card__sleeve';

        const sleeveImg = document.createElement('img');
        sleeveImg.className = 'vinyl-card__sleeve-img';
        sleeveImg.src = this.thumbUrl;
        sleeveImg.alt = this.data['project name'];
        sleeveImg.loading = this.index < 8 ? 'eager' : 'lazy';
        sleeveImg.decoding = 'async';

        sleeve.appendChild(sleeveImg);

        // Info section
        const info = document.createElement('div');
        info.className = 'vinyl-card__info';

        const name = document.createElement('p');
        name.className = 'vinyl-card__name';
        name.textContent = this.data['project name'];

        const tags = document.createElement('p');
        tags.className = 'vinyl-card__tags';
        tags.textContent = this.data.tag;

        info.appendChild(name);
        info.appendChild(tags);

        // Assemble: disc (behind) → sleeve (on top) → info
        card.appendChild(disc);
        card.appendChild(sleeve);
        card.appendChild(info);

        return card;
    }

    _attachEvents() {
        this.element.addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('vinylCardClick', {
                detail: { card: this }
            }));
        });
    }

    getElement() {
        return this.element;
    }

    getCenter() {
        const rect = this.element.getBoundingClientRect();
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
