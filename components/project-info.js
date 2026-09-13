// personalwebsite/components/project-info.js
// Project information component logic for dynamically loading project data
// Reads gallery.json and populates project info based on current page URL

class ProjectInfoManager {
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
        console.log('Project Info - Loading project data from:', this.pathConfig.galleryJsonPath);
        try {
            const response = await fetch(this.pathConfig.galleryJsonPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            this.projectData = await response.json();
            console.log('Project Info - Project data loaded:', this.projectData);
            return this.projectData;
        } catch (error) {
            console.error('Project Info - Error loading project data:', error);
            return null;
        }
    }

    getCurrentProjectFromURL() {
        const currentPath = window.location.pathname;
        console.log('Project Info - Current path:', currentPath);

        if (!currentPath.includes('/gallery/')) {
            console.log('Project Info - Not a gallery page');
            return null;
        }

        const pathParts = currentPath.split('/');
        const galleryIndex = pathParts.findIndex(part => part === 'gallery');

        if (galleryIndex !== -1 && galleryIndex + 1 < pathParts.length) {
            const projectFolderName = decodeURIComponent(pathParts[galleryIndex + 1]);
            console.log('Project Info - Project folder name:', projectFolderName);
            return projectFolderName;
        }

        console.log('Project Info - Could not extract project name from URL');
        return null;
    }

    normalizeProjectPathFromUrl(projectUrl) {
        if (!projectUrl || typeof projectUrl !== 'string') return null;
        try {
            let url = projectUrl.trim();
            // Remove any protocol/host if present
            url = url.replace(/^https?:\/\/[^/]+/, '');
            // Normalize leading characters
            url = url.replace(/^\.\//, '');
            url = url.replace(/^\/+/, '');
            // Remove leading gallery/ if present
            url = url.replace(/^gallery\//, '');
            // Remove trailing index.html or index.htm
            url = url.replace(/\/index\.html?$/i, '');
            // Remove trailing slashes
            url = url.replace(/\/$/, '');
            return decodeURIComponent(url);
        } catch {
            return null;
        }
    }

    findProjectByPath(projectFolderName) {
        if (!this.projectData) {
            console.log('Project Info - No project data available');
            return null;
        }

        console.log('Project Info - Looking for project folder:', projectFolderName);
        console.log('Project Info - Available projects:', this.projectData.map(p => p['project name']));

        const foundProject = this.projectData.find(project => {
            const projectPath = this.normalizeProjectPathFromUrl(project.projectUrl);
            console.log('Project Info - Comparing:', projectPath, 'with', projectFolderName);
            return projectPath === projectFolderName;
        });

        console.log('Project Info - Found project:', foundProject);
        return foundProject;
    }

    formatProjectDate(dateString) {
        if (!dateString) return dateString;

        // Prefer YYYY.MM display; input kept as ISO in JSON (YYYY-MM-DD)
        const isoMatch = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(String(dateString).trim());
        if (isoMatch) {
            return `${isoMatch[1]}.${isoMatch[2]}`;
        }
        // Handle YYYY-MM or YYYY.MM
        const ymDash = /^([0-9]{4})-([0-9]{2})$/.exec(String(dateString).trim());
        if (ymDash) return `${ymDash[1]}.${ymDash[2]}`;
        const ymDot = /^([0-9]{4})\.([0-9]{2})$/.exec(String(dateString).trim());
        if (ymDot) return `${ymDot[1]}.${ymDot[2]}`;

        // Fallback to Date parsing if possible
        try {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
        } catch {}
        return String(dateString);
    }

    async populateProjectInfo() {
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

        this.renderProjectInfo();
        return true;
    }

    renderProjectInfo() {
        const fieldMappings = {
            'date': this.formatProjectDate(this.currentProject.date),
            'project name': this.currentProject['project name'],
            'tag': this.currentProject.tag,
            'company': this.currentProject.company
        };

        Object.entries(fieldMappings).forEach(([field, value]) => {
            const element = document.querySelector(`[data-project-field="${field}"]`);
            if (element) {
                element.textContent = value || '-';
            }
        });
    }

    showError(message) {
        console.error('ProjectInfoManager:', message);
        document.querySelectorAll('[data-project-field]').forEach(element => {
            element.textContent = 'Error loading';
        });
    }
}

window.projectInfoManager = new ProjectInfoManager();

document.addEventListener('componentsLoaded', async () => {
    console.log('Project Info - componentsLoaded event received');
    const projectInfoElement = document.querySelector('[data-component="project-info"]');
    console.log('Project Info - Project info element found:', !!projectInfoElement);
    if (projectInfoElement) {
        console.log('Project Info - Starting to populate project info...');
        await window.projectInfoManager.populateProjectInfo();
    }
});

// Fallback for cases where componentsLoaded doesn't fire
document.addEventListener('DOMContentLoaded', () => {
    console.log('Project Info - DOMContentLoaded fallback');
    setTimeout(async () => {
        const projectInfoElement = document.querySelector('[data-component="project-info"]');
        const hasLoadingState = projectInfoElement && projectInfoElement.textContent.includes('Loading');
        if (projectInfoElement && hasLoadingState) {
            console.log('Project Info - Fallback: Populating project info...');
            await window.projectInfoManager.populateProjectInfo();
        }
    }, 1000);
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectInfoManager;
}
