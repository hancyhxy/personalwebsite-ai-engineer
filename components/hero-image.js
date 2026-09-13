// personalwebsite/components/hero-image.js
// Hero image component logic for dynamically loading project cover images
// Reads gallery.json and loads coverImageUrl based on current page URL

class HeroImageManager {
    constructor() {
        this.projectData = null;
        this.currentProject = null;
        this.pathConfig = this.detectPathLevel();
    }

    detectPathLevel() {
        const currentPath = window.location.pathname;
        const isSubPage = currentPath.includes('/gallery/');

        return {
            isSubPage,
            galleryJsonPath: isSubPage ? '../../content/gallery.json' : './content/gallery.json'
        };
    }

    async loadProjectData() {
        console.log('Hero Image - Loading project data from:', this.pathConfig.galleryJsonPath);
        try {
            const response = await fetch(this.pathConfig.galleryJsonPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.projectData = await response.json();
            console.log('Hero Image - Project data loaded:', this.projectData);
            return this.projectData;
        } catch (error) {
            console.error('Hero Image - Error loading project data:', error);
            return null;
        }
    }

    getCurrentProjectFromURL() {
        const currentPath = window.location.pathname;
        console.log('Hero Image - Current path:', currentPath);

        if (!currentPath.includes('/gallery/')) {
            console.log('Hero Image - Not a gallery page');
            return null;
        }

        const pathParts = currentPath.split('/');
        const galleryIndex = pathParts.findIndex(part => part === 'gallery');

        if (galleryIndex !== -1 && galleryIndex + 1 < pathParts.length) {
            const projectFolderName = decodeURIComponent(pathParts[galleryIndex + 1]);
            console.log('Hero Image - Project folder name:', projectFolderName);
            return projectFolderName;
        }

        console.log('Hero Image - Could not extract project name from URL');
        return null;
    }

    findProjectByPath(projectFolderName) {
        if (!this.projectData) {
            console.log('Hero Image - No project data available');
            return null;
        }

        console.log('Hero Image - Looking for project folder:', projectFolderName);
        console.log('Hero Image - Available projects:', this.projectData.map(p => p['project name']));

        const foundProject = this.projectData.find(project => {
            const projectUrl = project.projectUrl;
            const projectPath = projectUrl.replace('./gallery/', '').replace('/index.html', '');
            console.log('Hero Image - Comparing:', projectPath, 'with', projectFolderName);
            return projectPath === projectFolderName;
        });

        console.log('Hero Image - Found project:', foundProject);
        return foundProject;
    }

    resolveImagePath(coverImageUrl) {
        if (!coverImageUrl) return null;

        console.log('Hero Image - Original path:', coverImageUrl);

        // Gallery.json paths are relative to website root, convert to relative path from project page
        // Example: "./gallery/KOL Growth Strategy/public/album.png" -> "./public/album.png"
        if (coverImageUrl.startsWith('./gallery/')) {
            // Get current project folder name from URL
            const currentProjectFolder = this.getCurrentProjectFromURL();
            if (currentProjectFolder) {
                // Build the expected prefix for this project
                const projectPrefix = `./gallery/${currentProjectFolder}/`;

                // If the coverImageUrl starts with our project prefix, extract the relative part
                if (coverImageUrl.startsWith(projectPrefix)) {
                    const relativePath = './' + coverImageUrl.substring(projectPrefix.length);
                    console.log('Hero Image - Resolved relative path:', relativePath);
                    return relativePath;
                }
            }
        }

        // Fallback: return original path
        console.log('Hero Image - Using fallback path:', coverImageUrl);
        return coverImageUrl;
    }

    async loadHeroImage() {
        await this.loadProjectData();

        if (!this.projectData) {
            this.showError('Failed to load project data');
            return false;
        }

        const projectFolderName = this.getCurrentProjectFromURL();
        if (!projectFolderName) {
            this.showError('Cannot determine current project');
            return false;
        }

        this.currentProject = this.findProjectByPath(projectFolderName);
        if (!this.currentProject) {
            this.showError('Project not found in data');
            return false;
        }

        this.renderHeroImage();
        return true;
    }

    renderHeroImage() {
        const heroImageElement = document.querySelector('[data-hero-image]');
        console.log('Hero Image - Hero image element:', heroImageElement);
        if (!heroImageElement) {
            console.error('Hero image element not found');
            return;
        }

        const coverImageUrl = this.currentProject.coverImageUrl;
        console.log('Hero Image - Cover image URL:', coverImageUrl);
        if (!coverImageUrl) {
            console.warn('No cover image URL found for project');
            heroImageElement.style.display = 'none';
            return;
        }

        const resolvedImagePath = this.resolveImagePath(coverImageUrl);
        console.log('Hero Image - Setting image src to:', resolvedImagePath);
        heroImageElement.src = resolvedImagePath;
        heroImageElement.alt = `${this.currentProject['project name']} - Project Overview`;

        heroImageElement.onload = () => {
            console.log('Hero Image - Image loaded successfully');
            heroImageElement.style.display = 'block';
        };

        heroImageElement.onerror = (error) => {
            console.error('Hero Image - Failed to load image:', resolvedImagePath, error);
            heroImageElement.style.display = 'none';
        };
    }

    showError(message) {
        console.error('HeroImageManager:', message);
        const heroImageElement = document.querySelector('[data-hero-image]');
        if (heroImageElement) {
            heroImageElement.style.display = 'none';
        }
    }
}

window.heroImageManager = new HeroImageManager();

document.addEventListener('componentsLoaded', async () => {
    console.log('Hero Image - componentsLoaded event received');
    const heroImageElement = document.querySelector('[data-component="hero-image"]');
    console.log('Hero Image - Hero image element found:', !!heroImageElement);
    if (heroImageElement) {
        console.log('Hero Image - Starting to load hero image...');
        await window.heroImageManager.loadHeroImage();
    }
});

// Fallback for cases where componentsLoaded doesn't fire
document.addEventListener('DOMContentLoaded', () => {
    console.log('Hero Image - DOMContentLoaded fallback');
    setTimeout(async () => {
        const heroImageElement = document.querySelector('[data-component="hero-image"]');
        if (heroImageElement && !heroImageElement.querySelector('img[src]')) {
            console.log('Hero Image - Fallback: Loading hero image...');
            await window.heroImageManager.loadHeroImage();
        }
    }, 1000);
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeroImageManager;
}