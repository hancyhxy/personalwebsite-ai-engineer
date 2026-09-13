// personalwebsite/components/component-loader.js
// Component loading system for header and footer components
// Handles dynamic component loading with path configuration for different page levels

class ComponentLoader {
    constructor() {
        this.components = new Map();
        this.pathConfig = this.detectPathLevel();
    }

    // Detect current page level to configure relative paths
    detectPathLevel() {
        const currentPath = window.location.pathname;
        const isSubPage = currentPath.includes('/gallery/');

        return {
            isSubPage,
            componentsPath: isSubPage ? '../../components/' : './components/',
            homeLink: isSubPage ? '../../index.html' : './index.html',
            // Page-aware relative paths so it works from home and gallery pages
            infoLink: isSubPage ? '../../assets/docs/CV_XinyiHan_A4.pdf' : './assets/docs/CV_XinyiHan_A4.pdf',
            contactLink: isSubPage ? '../../index.html#contact' : '#contact',
            resumeLink: isSubPage ? '../../assets/docs/CV_XinyiHan_A4.pdf' : './assets/docs/CV_XinyiHan_A4.pdf'
        };
    }

    // Load a component from HTML file
    async loadComponent(componentName) {
        try {
            const response = await fetch(`${this.pathConfig.componentsPath}${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }

            let html = await response.text();

            // Replace placeholders with appropriate paths
            html = html.replace('{{HOME_LINK}}', this.pathConfig.homeLink);
            html = html.replace('{{INFO_LINK}}', this.pathConfig.infoLink);
            html = html.replace('{{CONTACT_LINK}}', this.pathConfig.contactLink);
            html = html.replace('{{RESUME_LINK}}', this.pathConfig.resumeLink);

            this.components.set(componentName, html);
            return html;
        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
            return null;
        }
    }

    // Insert component into DOM
    async insertComponent(componentName, targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (!targetElement) {
            console.error(`Target element not found: ${targetSelector}`);
            return false;
        }

        // Check if component is already loaded
        let html = this.components.get(componentName);
        if (!html) {
            html = await this.loadComponent(componentName);
            if (!html) return false;
        }

        targetElement.innerHTML = html;
        return true;
    }

    // Load all components automatically
    async loadAllComponents() {
        const headerPlaceholder = document.querySelector('[data-component="header"]');
        const footerPlaceholder = document.querySelector('[data-component="footer"]');
        const projectInfoPlaceholder = document.querySelector('[data-component="project-info"]');

        const promises = [];

        if (headerPlaceholder) {
            promises.push(this.insertComponent('header', '[data-component="header"]'));
        }

        if (footerPlaceholder) {
            promises.push(this.insertComponent('footer', '[data-component="footer"]'));
        }

        // Load project info brief if present on the page
        if (projectInfoPlaceholder) {
            promises.push(this.insertComponent('project-info', '[data-component="project-info"]'));
        }

        await Promise.all(promises);

        // Trigger custom event to notify components are loaded
        document.dispatchEvent(new CustomEvent('componentsLoaded'));
    }
}

// Global component loader instance
window.componentLoader = new ComponentLoader();

function loadGlobalEnhancements() {
    try {
        const scriptId = 'global-media-embeds-script';
        if (!document.getElementById(scriptId)) {
            const scriptPath = `${window.componentLoader.pathConfig.componentsPath}media-embeds.js`;
            const scriptElement = document.createElement('script');
            scriptElement.id = scriptId;
            scriptElement.src = scriptPath;
            scriptElement.defer = true;
            document.head.appendChild(scriptElement);
        }

        injectAnalytics();
    } catch (error) {
        console.error('ComponentLoader - Failed to load global enhancements:', error);
    }
}

function injectAnalytics() {
    const externalScriptId = 'google-analytics-external';
    if (!document.getElementById(externalScriptId)) {
        const gaScript = document.createElement('script');
        gaScript.id = externalScriptId;
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-ZP93FH7S4W';
        document.head.appendChild(gaScript);
    }

    const inlineScriptId = 'google-analytics-inline';
    if (!document.getElementById(inlineScriptId)) {
        const inlineScript = document.createElement('script');
        inlineScript.id = inlineScriptId;
        inlineScript.textContent = [
            'window.dataLayer = window.dataLayer || [];',
            'function gtag(){dataLayer.push(arguments);}',
            "gtag('js', new Date());",
            "gtag('config', 'G-ZP93FH7S4W');"
        ].join('\n');
        document.head.appendChild(inlineScript);
    }
}

// Auto-load components when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await window.componentLoader.loadAllComponents();
    loadGlobalEnhancements();
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}
