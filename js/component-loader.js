class ComponentLoader {
    constructor() {
        this.components = new Map();
        this.pathConfig = this.detectPathLevel();
    }

    detectPathLevel() {
        const currentPath = window.location.pathname;
        const isSubPage = currentPath.includes('/projects/');

        return {
            isSubPage,
            componentsPath: isSubPage ? '../../components/' : './components/',
            homeLink: isSubPage ? '../../index.html' : './index.html',
            contactLink: isSubPage ? '../../index.html#contact' : '#contact',
            resumeLink: isSubPage ? '../../assets/docs/CV_XinyiHan_2026.pdf' : './assets/docs/CV_XinyiHan_2026.pdf'
        };
    }

    async loadComponent(componentName) {
        try {
            const response = await fetch(`${this.pathConfig.componentsPath}${componentName}.html`);
            if (!response.ok) throw new Error(`Failed to load component: ${componentName}`);

            let html = await response.text();
            html = html.replace(/\{\{HOME_LINK\}\}/g, this.pathConfig.homeLink);
            html = html.replace(/\{\{CONTACT_LINK\}\}/g, this.pathConfig.contactLink);
            html = html.replace(/\{\{RESUME_LINK\}\}/g, this.pathConfig.resumeLink);

            this.components.set(componentName, html);
            return html;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return null;
        }
    }

    async insertComponent(componentName, targetSelector) {
        const target = document.querySelector(targetSelector);
        if (!target) return false;

        let html = this.components.get(componentName);
        if (!html) {
            html = await this.loadComponent(componentName);
            if (!html) return false;
        }

        target.innerHTML = html;
        return true;
    }

    async loadAllComponents() {
        const promises = [];

        if (document.querySelector('[data-component="header"]')) {
            promises.push(this.insertComponent('header', '[data-component="header"]'));
        }
        if (document.querySelector('[data-component="footer"]')) {
            promises.push(this.insertComponent('footer', '[data-component="footer"]'));
        }

        await Promise.all(promises);
        this.startClock();
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
    }

    startClock() {
        const el = document.getElementById('current-time');
        if (!el) return;

        const fmt = new Intl.DateTimeFormat('en-AU', {
            timeZone: 'Australia/Sydney',
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            hour12: true
        });

        const tick = () => { el.textContent = fmt.format(new Date()); };
        tick();
        setInterval(tick, 1000);
    }
}

window.componentLoader = new ComponentLoader();

document.addEventListener('DOMContentLoaded', () => {
    window.componentLoader.loadAllComponents();
});
