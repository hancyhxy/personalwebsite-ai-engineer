class RetroDesktop {
    constructor() {
        this.projects = [];
        this.windows = new Map();
        this.activeWindow = null;
        this.dragState = null;
        this.windowCount = 0;
    }

    async init() {
        const res = await fetch('./content/gallery.json');
        this.projects = await res.json();

        this._renderMenuBar();
        this._renderDesktopIcons();
        this._renderDock();
        this._startClock();

        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.window') && !e.target.closest('.desktop-icon')) {
                this._deselectAll();
            }
        });
    }

    _extractSlug(projectUrl) {
        return projectUrl.split('/')[1] || '';
    }

    // ── Menu Bar ──

    _renderMenuBar() {
        const bar = document.createElement('div');
        bar.className = 'menu-bar';
        bar.innerHTML = `
            <span class="menu-bar__apple">&#63743;</span>
            <span class="menu-bar__item">Finder</span>
            <span class="menu-bar__item">File</span>
            <span class="menu-bar__item">Edit</span>
            <span class="menu-bar__item">View</span>
            <span class="menu-bar__spacer"></span>
            <span class="menu-bar__clock" id="menu-clock"></span>
        `;
        document.body.appendChild(bar);
    }

    // ── Desktop Icons ──

    _renderDesktopIcons() {
        const container = document.createElement('div');
        container.className = 'desktop-icons';

        this.projects.forEach((project, i) => {
            const slug = this._extractSlug(project.projectUrl);
            const icon = document.createElement('div');
            icon.className = 'desktop-icon';
            icon.dataset.index = i;

            const img = document.createElement('img');
            img.className = 'desktop-icon__img';
            img.src = `assets/images/thumbs/${slug}-thumb.jpg`;
            img.alt = project['project name'];
            img.loading = i < 12 ? 'eager' : 'lazy';
            img.draggable = false;

            const label = document.createElement('span');
            label.className = 'desktop-icon__label';
            label.textContent = project['project name'];

            icon.appendChild(img);
            icon.appendChild(label);

            icon.addEventListener('click', (e) => {
                e.stopPropagation();
                this._selectIcon(icon);
            });

            icon.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this._openProjectWindow(i);
            });

            container.appendChild(icon);
        });

        document.body.appendChild(container);
    }

    _selectIcon(icon) {
        document.querySelectorAll('.desktop-icon').forEach(el => {
            el.classList.remove('desktop-icon--selected');
        });
        icon.classList.add('desktop-icon--selected');
    }

    _deselectAll() {
        document.querySelectorAll('.desktop-icon').forEach(el => {
            el.classList.remove('desktop-icon--selected');
        });
    }

    // ── Windows ──

    _openProjectWindow(index) {
        const key = `project-${index}`;
        if (this.windows.has(key)) {
            const existing = this.windows.get(key);
            existing.classList.remove('window--hidden');
            this._bringToFront(existing);
            return;
        }

        const project = this.projects[index];
        const slug = this._extractSlug(project.projectUrl);
        this.windowCount++;

        const win = document.createElement('div');
        win.className = 'window window--active';
        win.dataset.key = key;

        // Stagger window positions
        const offsetX = 80 + (this.windowCount % 6) * 30;
        const offsetY = 50 + (this.windowCount % 6) * 30;
        win.style.left = offsetX + 'px';
        win.style.top = offsetY + 'px';
        win.style.width = '560px';
        win.style.height = '420px';

        // Title bar
        const titlebar = document.createElement('div');
        titlebar.className = 'window__titlebar';

        const btnGroup = document.createElement('div');
        btnGroup.className = 'window__btn-group';

        const btnClose = document.createElement('div');
        btnClose.className = 'window__btn window__btn--close';
        btnClose.addEventListener('click', (e) => {
            e.stopPropagation();
            this._closeWindow(key);
        });

        const btnMin = document.createElement('div');
        btnMin.className = 'window__btn window__btn--minimize';
        btnMin.addEventListener('click', (e) => {
            e.stopPropagation();
            win.classList.add('window--hidden');
        });

        const btnMax = document.createElement('div');
        btnMax.className = 'window__btn window__btn--maximize';

        btnGroup.appendChild(btnClose);
        btnGroup.appendChild(btnMin);
        btnGroup.appendChild(btnMax);

        const title = document.createElement('span');
        title.className = 'window__title';
        title.textContent = project['project name'];

        titlebar.appendChild(btnGroup);
        titlebar.appendChild(title);

        // Content
        const content = document.createElement('div');
        content.className = 'window__content';

        const hero = document.createElement('img');
        hero.className = 'project-window__hero';
        hero.src = `assets/images/thumbs/${slug}-thumb.jpg`;
        hero.alt = project['project name'];

        const meta = document.createElement('div');
        meta.className = 'project-window__meta';
        meta.innerHTML = `
            <span>${project.date.slice(0, 7).replace('-', '.')}</span>
            <span>${project.company}</span>
            <span>${project.classification}</span>
        `;

        const desc = document.createElement('div');
        desc.className = 'project-window__description';
        desc.innerHTML = `
            <p><strong>Tags:</strong> ${project.tag}</p>
            <p style="margin-top:12px;">Double-click the desktop icon or
            <a href="projects/${slug}/index.html" style="color:#3478f6;text-decoration:underline;">open full project</a></p>
        `;

        content.appendChild(hero);
        content.appendChild(meta);
        content.appendChild(desc);

        win.appendChild(titlebar);
        win.appendChild(content);

        // Make window draggable
        this._makeDraggable(win, titlebar);

        // Click to bring to front
        win.addEventListener('mousedown', () => {
            this._bringToFront(win);
        });

        document.body.appendChild(win);
        this.windows.set(key, win);
        this._bringToFront(win);
    }

    _closeWindow(key) {
        const win = this.windows.get(key);
        if (win) {
            win.remove();
            this.windows.delete(key);
        }
    }

    _bringToFront(win) {
        if (this.activeWindow) {
            this.activeWindow.classList.remove('window--active');
        }
        this.activeWindow = win;
        win.classList.add('window--active');

        // Set highest z-index
        const allWindows = document.querySelectorAll('.window');
        let maxZ = 100;
        allWindows.forEach(w => {
            const z = parseInt(w.style.zIndex || 100);
            if (z > maxZ) maxZ = z;
        });
        win.style.zIndex = maxZ + 1;
    }

    _makeDraggable(win, handle) {
        let startX, startY, origX, origY;

        const onMouseMove = (e) => {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            win.style.left = (origX + dx) + 'px';
            win.style.top = Math.max(24, origY + dy) + 'px';
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        handle.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window__btn')) return;
            startX = e.clientX;
            startY = e.clientY;
            origX = parseInt(win.style.left) || 0;
            origY = parseInt(win.style.top) || 0;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

    // ── Dock ──

    _renderDock() {
        const dock = document.createElement('div');
        dock.className = 'dock';

        // Show first 8 projects in dock
        const dockProjects = this.projects.slice(0, 8);
        dockProjects.forEach((project, i) => {
            const slug = this._extractSlug(project.projectUrl);
            const item = document.createElement('img');
            item.className = 'dock__item';
            item.src = `assets/images/thumbs/${slug}-thumb.jpg`;
            item.alt = project['project name'];
            item.title = project['project name'];
            item.draggable = false;

            item.addEventListener('click', () => {
                this._openProjectWindow(i);
            });

            dock.appendChild(item);
        });

        document.body.appendChild(dock);
    }

    // ── Clock ──

    _startClock() {
        const el = document.getElementById('menu-clock');
        if (!el) return;

        const fmt = new Intl.DateTimeFormat('en-AU', {
            timeZone: 'Australia/Sydney',
            weekday: 'short',
            hour: '2-digit', minute: '2-digit',
            hour12: true
        });

        const tick = () => { el.textContent = fmt.format(new Date()); };
        tick();
        setInterval(tick, 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const desktop = new RetroDesktop();
    desktop.init();
});
