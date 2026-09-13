// personalwebsite/style/script.js
// Interactive JavaScript functionality for Xinyi Han's portfolio website
// Handles view switching, animations, and real-time features

class PortfolioManager {
    constructor() {
        this.currentView = 'gallery';
        this.projectData = [];
        this.init();
    }

    async init() {
        await this.loadProjectData();
        this.renderViews();
        this.setupEventListeners();
        this.startClock();
        this.animateOnLoad();
    }

    async loadProjectData() {
        try {
            const response = await fetch('./content/gallery.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.projectData = await response.json();
            console.log('Project data loaded:', this.projectData);
        } catch (error) {
            console.error('Failed to load project data:', error);
            this.projectData = [];
        }
    }

    renderViews() {
        this.renderGalleryView();
        this.renderIndexView();
    }

    renderGalleryView() {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;

        // Clear existing content
        galleryGrid.innerHTML = '';

        // Render each project as a card
        this.projectData.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            if (project.projectUrl) {
                card.classList.add('clickable');
            }

            card.innerHTML = `
                <div class="project-image">
                    ${project.coverImageUrl ?
                        `<img src="${project.coverImageUrl}" alt="${project['project name']}" />` :
                        `<div class="placeholder-image"></div>`
                    }
                </div>
                <div class="project-info">
                    <h3>${project['project name']}</h3>
                    <p>${project.tag}</p>
                </div>
            `;
            // Fallback if image fails to load
            const imgEl = card.querySelector('.project-image img');
            if (imgEl) {
                imgEl.addEventListener('error', () => {
                    const container = card.querySelector('.project-image');
                    if (container) container.innerHTML = '<div class="placeholder-image"></div>';
                }, { once: true });
            }

            // Store project data on the element for click handling
            card.dataset.projectUrl = project.projectUrl || '';
            card.dataset.projectIndex = index;

            galleryGrid.appendChild(card);
        });
    }

    renderIndexView() {
        const projectsTable = document.querySelector('.projects-table');
        if (!projectsTable) return;

        // Clear existing content but keep the header
        const existingRows = projectsTable.querySelectorAll('.project-row');
        existingRows.forEach(row => row.remove());

        // Sort projects by date (newest first)
        const sortedProjects = [...this.projectData].sort((a, b) =>
            new Date(b.date) - new Date(a.date)
        );

        // Render each project as a table row
        sortedProjects.forEach((project, index) => {
            const row = document.createElement('div');
            row.className = 'project-row';

            const year = new Date(project.date).getFullYear();
            const dotClass = this.getClassificationDotClass(project.classification);

            row.innerHTML = `
                <span class="year">${year}</span>
                <span class="project-name">
                    ${project['project name']}
                    <span class="classification-dot ${dotClass}"></span>
                </span>
                <span class="project-tag">${project.tag}</span>
                <span class="company">${project.company}</span>
            `;

            // Store project data on the element for click handling
            row.dataset.projectUrl = project.projectUrl || '';
            row.dataset.projectIndex = index;

            projectsTable.appendChild(row);
        });
    }

    getClassificationDotClass(classification) {
        switch(classification) {
            // New 4-category scheme
            case 'UX/Product':
                return 'dot-ux-product';
            case 'Experiential':
                return 'dot-experiential';
            case 'Content':
                return 'dot-content';
            case 'Visual':
                return 'dot-visual';
            // Backward compatibility with previous labels
            case 'Design Work':
                return 'dot-ux-product';
            case 'Social Media':
                return 'dot-content';
            default:
                return 'dot-default';
        }
    }


    setupEventListeners() {
        // Tab switching functionality
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Project card hover effects and click handling (using event delegation)
        const galleryGrid = document.querySelector('.gallery-grid');
        if (galleryGrid) {
            galleryGrid.addEventListener('mouseenter', (e) => {
                if (e.target.closest('.project-card')) {
                    this.handleCardHover(e);
                }
            }, true);
            galleryGrid.addEventListener('mouseleave', (e) => {
                if (e.target.closest('.project-card')) {
                    this.handleCardLeave(e);
                }
            }, true);
            galleryGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.project-card');
                if (card) {
                    this.handleCardClick(e, card);
                }
            });
        }

        // Project row interactions (using event delegation)
        const projectsTable = document.querySelector('.projects-table');
        if (projectsTable) {
            projectsTable.addEventListener('click', (e) => {
                const row = e.target.closest('.project-row');
                if (row) {
                    this.handleProjectClick(e, row);
                }
            });
        }

        // Smooth scrolling for in-page navigation links only (href starts with '#')
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = (link.getAttribute('href') || '').trim();
            if (href.startsWith('#')) {
                link.addEventListener('click', this.handleNavClick.bind(this));
            }
        });

        // Email link interaction
        const emailLink = document.querySelector('.email-link');
        if (emailLink) {
            emailLink.addEventListener('click', this.handleEmailClick.bind(this));
        }

        // Scroll-based animations
        window.addEventListener('scroll', this.handleScroll.bind(this));

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyPress.bind(this));

        // Resize handler
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    switchView(view) {
        if (this.currentView === view) return;

        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.view === view);
        });

        // Hide current view
        const currentViewElement = document.getElementById(`${this.currentView}-view`);
        if (currentViewElement) {
            currentViewElement.style.opacity = '0';
            setTimeout(() => {
                currentViewElement.style.display = 'none';
                this.showView(view);
            }, 200);
        }

        this.currentView = view;
    }

    showView(view) {
        const viewElement = document.getElementById(`${view}-view`);
        if (viewElement) {
            viewElement.style.display = 'block';
            // Force reflow
            viewElement.offsetHeight;
            viewElement.style.opacity = '1';

            // Add animation class
            viewElement.classList.add('fade-in-up');
            setTimeout(() => {
                viewElement.classList.remove('fade-in-up');
            }, 600);
        }
    }

    handleCardHover(e) {
        const card = e.currentTarget;
        const image = card.querySelector('.placeholder-image');

        // Add subtle animation
        if (image) {
            image.style.transform = 'scale(1.02)';
        }
    }

    handleCardLeave(e) {
        const card = e.currentTarget;
        const image = card.querySelector('.placeholder-image');

        if (image) {
            image.style.transform = 'scale(1)';
        }
    }

    handleCardClick(e, card) {
        e.preventDefault();

        const projectUrl = card.dataset.projectUrl;
        const projectIndex = parseInt(card.dataset.projectIndex);
        const project = this.projectData[projectIndex];

        if (projectUrl) {
            // Open project page in new tab
            window.open(projectUrl, '_blank');
        } else {
            // Handle projects without URLs (show console message)
            console.log(`Project clicked: ${project['project name']}`);
        }

        // Add click feedback
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 150);
    }

    handleProjectClick(e, row) {
        const projectUrl = row.dataset.projectUrl;
        const projectIndex = parseInt(row.dataset.projectIndex);
        const project = this.projectData[projectIndex];

        if (projectUrl) {
            // Open project page in new tab
            window.open(projectUrl, '_blank');
        } else {
            // Handle projects without URLs (show console message)
            console.log(`Navigating to project: ${project['project name']}`);
        }

        // Add click feedback
        row.style.transform = 'scale(0.98)';
        setTimeout(() => {
            row.style.transform = 'scale(1)';
        }, 150);
    }

    handleNavClick(e) {
        const link = e.currentTarget;
        const target = (link.getAttribute('href') || '').trim();
        // Only intercept in-page hash links
        if (target.startsWith('#')) {
            e.preventDefault();
            const element = document.querySelector(target);
            if (element) {
                element.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }

    handleEmailClick(e) {
        // Track email click (in a real app, this would send analytics)
        console.log('Email link clicked');

        // Add subtle feedback
        const link = e.currentTarget;
        link.style.transform = 'scale(0.95)';
        setTimeout(() => {
            link.style.transform = 'scale(1)';
        }, 150);
    }

    handleScroll() {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('.nav-header');

        // Update header appearance based on scroll
        if (scrolled > 100) {
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }

        // Parallax effect for hero section (subtle) - REMOVED to fix sticky text issue
        // const heroSection = document.querySelector('.hero-section');
        // if (heroSection) {
        //     const speed = scrolled * 0.5;
        //     heroSection.style.transform = `translateY(${speed}px)`;
        // }
    }

    handleKeyPress(e) {
        // Keyboard shortcuts
        if (e.key === 'g') {
            this.switchView('gallery');
        } else if (e.key === 'i') {
            this.switchView('index');
        } else if (e.key === 'Escape') {
            // Reset to gallery view
            this.switchView('gallery');
        }
    }

    handleResize() {
        // Debounced resize handler
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => {
            this.adjustLayoutForScreenSize();
        }, 250);
    }

    adjustLayoutForScreenSize() {
        const width = window.innerWidth;
        const galleryGrid = document.querySelector('.gallery-grid');

        // Adjust grid layout based on screen size
        if (width <= 480) {
            galleryGrid.style.gridTemplateColumns = '1fr';
        } else if (width <= 768) {
            galleryGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            galleryGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        }
    }

    startClock() {
        const updateTime = () => {
            const timeElement = document.getElementById('current-time');
            if (timeElement) {
                const now = new Date();
                // Sydney timezone
                const sydneyTime = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Australia/Sydney',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                }).format(now);

                timeElement.textContent = sydneyTime;
            }
        };

        // Update immediately and then every second
        updateTime();
        setInterval(updateTime, 1000);
    }

    animateOnLoad() {
        // Animate hero text
        const heroText = document.querySelector('.hero-text');
        if (heroText) {
            heroText.style.opacity = '0';
            heroText.style.transform = 'translateY(20px)';

            setTimeout(() => {
                heroText.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
                heroText.style.opacity = '1';
                heroText.style.transform = 'translateY(0)';
            }, 300);
        }

        // Animate project cards after they are rendered
        setTimeout(() => {
            this.animateProjectCards();
        }, 100);
    }

    animateProjectCards() {
        const cards = document.querySelectorAll('.project-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';

            setTimeout(() => {
                card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // Utility method for smooth animations
    smoothTransition(element, property, value, duration = 300) {
        return new Promise(resolve => {
            element.style.transition = `${property} ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            element.style[property] = value;

            setTimeout(resolve, duration);
        });
    }

    // Method to add new project dynamically (for future use)
    addProject(projectData) {
        const { name, tag, year, company, classification, featured = false } = projectData;

        if (this.currentView === 'gallery') {
            this.addProjectCard(projectData);
        } else {
            this.addProjectRow(projectData);
        }
    }

    addProjectCard(projectData) {
        const galleryGrid = document.querySelector('.gallery-grid');
        const card = document.createElement('div');
        card.className = `project-card${projectData.featured ? ' featured' : ''}`;

        card.innerHTML = `
            <div class="project-image">
                <div class="placeholder-image"></div>
            </div>
            <div class="project-info">
                <h3>${projectData.name}</h3>
                <p>${projectData.type}</p>
            </div>
        `;

        // Add with animation
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        galleryGrid.appendChild(card);

        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 100);
    }

    addProjectRow(projectData) {
        const table = document.querySelector('.projects-table');
        const row = document.createElement('div');
        row.className = 'project-row';

        const dotClass = this.getClassificationDotClass(projectData.classification);

        row.innerHTML = `
            <span class="year">${projectData.year}</span>
            <span class="project-name">${projectData.name} <span class="classification-dot ${dotClass}">●</span></span>
            <span class="project-tag">${projectData.tag}</span>
            <span class="company">${projectData.company}</span>
        `;

        table.appendChild(row);
    }
}

// Simple image lightbox for project detail pages
let lightboxOverlay = null;
let lightboxImage = null;
let lightboxKeydownHandler = null;

function ensureImageLightbox() {
    if (lightboxOverlay) return;

    lightboxOverlay = document.createElement('div');
    lightboxOverlay.className = 'image-lightbox-overlay';

    lightboxImage = document.createElement('img');
    lightboxOverlay.appendChild(lightboxImage);

    lightboxOverlay.addEventListener('click', (event) => {
        if (event.target === lightboxOverlay) {
            closeImageLightbox();
        }
    });

    document.body.appendChild(lightboxOverlay);
    lightboxOverlay.style.display = 'none';
}

function openImageLightbox(imageElement) {
    if (!imageElement || !imageElement.src) return;

    ensureImageLightbox();

    lightboxImage.src = imageElement.src;
    lightboxImage.alt = imageElement.alt || '';
    lightboxOverlay.style.display = 'flex';

    if (lightboxKeydownHandler) {
        document.removeEventListener('keydown', lightboxKeydownHandler);
    }

    lightboxKeydownHandler = (event) => {
        if (event.key === 'Escape' || event.key === 'Esc') {
            closeImageLightbox();
        }
    };

    document.addEventListener('keydown', lightboxKeydownHandler);
}

function closeImageLightbox() {
    if (lightboxOverlay) {
        lightboxOverlay.style.display = 'none';
    }
    if (lightboxKeydownHandler) {
        document.removeEventListener('keydown', lightboxKeydownHandler);
        lightboxKeydownHandler = null;
    }
}

function setupProjectImageLightbox() {
    const images = document.querySelectorAll('.project-content img');
    if (!images.length) return;

    images.forEach((img) => {
        if (img.dataset.lightboxBound === 'true') return;

        img.dataset.lightboxBound = 'true';
        img.addEventListener('click', () => {
            openImageLightbox(img);
        });
    });
}

// Performance optimization: Use requestAnimationFrame for smooth animations
class AnimationManager {
    constructor() {
        this.animations = new Set();
        this.isRunning = false;
    }

    add(callback) {
        this.animations.add(callback);
        if (!this.isRunning) {
            this.start();
        }
    }

    remove(callback) {
        this.animations.delete(callback);
        if (this.animations.size === 0) {
            this.stop();
        }
    }

    start() {
        this.isRunning = true;
        this.tick();
    }

    stop() {
        this.isRunning = false;
    }

    tick() {
        if (!this.isRunning) return;

        this.animations.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Animation callback error:', error);
                this.animations.delete(callback);
            }
        });

        if (this.animations.size > 0) {
            requestAnimationFrame(() => this.tick());
        } else {
            this.isRunning = false;
        }
    }
}

// Initialize the portfolio when components are loaded
function initializePortfolio() {
    // Check if all required elements exist
    const requiredElements = ['.nav-header', '.hero-section', '.gallery-view'];
    const missingElements = requiredElements.filter(selector => !document.querySelector(selector));

    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return;
    }

    // Initialize the portfolio
    window.portfolioManager = new PortfolioManager();
    window.animationManager = new AnimationManager();

    console.log('Portfolio initialized successfully');
}

// Listen for components loaded event
document.addEventListener('componentsLoaded', initializePortfolio);
document.addEventListener('componentsLoaded', setupProjectImageLightbox);

// Fallback: Initialize when DOM is loaded if components are already loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for components to load, then initialize
    setTimeout(() => {
        if (!window.portfolioManager) {
            initializePortfolio();
        }
    }, 100);
});

document.addEventListener('DOMContentLoaded', () => {
    setupProjectImageLightbox();
});

// Global utility functions
window.utils = {
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for scroll events
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Format time for different timezones
    formatTime(timezone = 'Australia/Sydney') {
        return new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        }).format(new Date());
    }
};

// Error handling
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    // In production, this would send error reports to monitoring service
});

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}
