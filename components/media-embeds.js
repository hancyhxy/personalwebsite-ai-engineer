/**
 * Global media embed manager
 * Automatically replaces supported video links (YouTube, Vimeo) with the shared
 * responsive iframe pattern.
 *
 * Usage guidance for markdown/content authors:
 *   1. Create an anchor element for the video URL. In Markdown you can write
 *      `[](https://youtu.be/VIDEO_ID)` when you do not want any visible link text,
 *      or `[Watch demo](https://youtu.be/VIDEO_ID)` if you do.
 *   2. Optional legacy support: wrapping the URL in tildes (`~ url ~`) is still
 *      recognised, but anchors are preferred for predictable syncing.
 */
(function() {
    const INLINE_MARKER_PATTERN = /~\s*(https?:\/\/[^\s~]+?)\s*~/;

    class MediaEmbedManager {
        constructor(options = {}) {
            this.providers = options.providers || this.getDefaultProviders();
            this.skipAttribute = options.skipAttribute || 'data-embed-skip';
            this.processedAttribute = 'data-embed-processed';
            this.providerSelector = this.providers
                .flatMap(provider => provider.selectors || [])
                .filter(Boolean)
                .join(', ');
        }

        init() {
            this.process();
            document.addEventListener('componentsLoaded', () => this.process());
        }

        process() {
            this.normalizeInlineEmbeds();

            const candidates = this.collectCandidates();
            candidates.forEach(({ anchor, provider, url }) => this.transformAnchor(anchor, provider, url));
        }

        normalizeInlineEmbeds() {
            const textNodes = this.findInlineVideoMarkers();
            textNodes.forEach(node => this.replaceMarkerWithLink(node));
        }

        findInlineVideoMarkers() {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
                acceptNode: (node) => {
                    if (!node || !node.textContent) return NodeFilter.FILTER_REJECT;
                    if (!MediaEmbedManager.hasInlineMarker(node.textContent)) {
                        return NodeFilter.FILTER_SKIP;
                    }

                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_SKIP;
                    if (parent.closest(`[${this.skipAttribute}]`)) return NodeFilter.FILTER_SKIP;
                    if (parent.closest('a, pre, code, textarea, script, style')) return NodeFilter.FILTER_SKIP;
                    if (parent.querySelector('a')) return NodeFilter.FILTER_SKIP;

                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            const nodes = [];
            while (walker.nextNode()) {
                nodes.push(walker.currentNode);
            }
            return nodes;
        }

        replaceMarkerWithLink(textNode) {
            const parent = textNode.parentNode;
            if (!parent) return;

            const regex = MediaEmbedManager.getInlineMarkerRegex();
            const fragments = textNode.textContent.split(regex);
            const matches = textNode.textContent.match(MediaEmbedManager.getInlineMarkerRegex()) || [];

            const replacementNodes = [];

            fragments.forEach((fragment, index) => {
                if (fragment) {
                    replacementNodes.push(document.createTextNode(fragment));
                }

                const match = matches[index];
                if (match) {
                    const url = match.slice(1, -1).trim();
                    if (url) {
                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.textContent = url;
                        anchor.target = '_blank';
                        anchor.rel = 'noreferrer noopener';
                        replacementNodes.push(anchor);
                    }
                }
            });

            replacementNodes.forEach(node => parent.insertBefore(node, textNode));
            parent.removeChild(textNode);
        }

        collectCandidates() {
            if (!this.providerSelector) return [];

            const anchors = Array.from(document.querySelectorAll(this.providerSelector));
            const results = [];

            anchors.forEach(anchor => {
                if (!this.basicCandidateCheck(anchor)) return;

                const info = this.identifyProvider(anchor);
                if (!info) return;

                results.push({ anchor, ...info });
            });

            return results;
        }

        basicCandidateCheck(anchor) {
            if (!anchor) return false;
            if (anchor.hasAttribute(this.processedAttribute)) return false;
            if (anchor.hasAttribute(this.skipAttribute)) return false;
            if (anchor.closest(`[${this.skipAttribute}]`)) return false;
            if (anchor.closest('.video-embed')) return false;
            return true;
        }

        identifyProvider(anchor) {
            const href = anchor.getAttribute('href') || anchor.dataset.href || '';
            if (!href) return null;

            let url;
            try {
                url = new URL(href, window.location.href);
            } catch (error) {
                console.error('MediaEmbedManager: invalid URL', href, error);
                return null;
            }

            for (const provider of this.providers) {
                try {
                    const match = provider.matches(url);
                    if (match) {
                        return { provider, url, match };
                    }
                } catch (error) {
                    console.error(`MediaEmbedManager: provider match failed (${provider.name})`, error);
                }
            }

            return null;
        }

        transformAnchor(anchor, provider, url) {
            const embedConfig = provider.getEmbedConfig(url, anchor);
            if (!embedConfig || !embedConfig.src) return;

            const wrapper = this.createEmbedWrapper(embedConfig, anchor);
            const replacementTarget = this.findReplacementTarget(anchor);

            anchor.setAttribute(this.processedAttribute, 'true');

            if (replacementTarget) {
                replacementTarget.replaceWith(wrapper);
            } else {
                anchor.replaceWith(wrapper);
            }
        }

        findReplacementTarget(anchor) {
            const explicitTarget = anchor.closest('[data-embed-target]');
            if (explicitTarget) return explicitTarget;

            const blockParent = anchor.closest('figure, p, div, li');
            return blockParent || anchor;
        }

        createEmbedWrapper(embedConfig, anchor) {
            const wrapper = document.createElement('div');
            wrapper.className = embedConfig.wrapperClass || 'video-embed';

            const iframe = document.createElement('iframe');
            iframe.src = embedConfig.src;
            iframe.title = embedConfig.title || this.getIframeTitle(anchor);
            iframe.allow = embedConfig.allow || 'autoplay; fullscreen; picture-in-picture';
            iframe.allowFullscreen = true;
            iframe.loading = 'lazy';

            if (embedConfig.referrerPolicy) {
                iframe.referrerPolicy = embedConfig.referrerPolicy;
            }

            if (embedConfig.iframeAttributes) {
                Object.entries(embedConfig.iframeAttributes).forEach(([key, value]) => {
                    if (value != null) {
                        iframe.setAttribute(key, value);
                    }
                });
            }

            wrapper.appendChild(iframe);
            return wrapper;
        }

        getIframeTitle(anchor) {
            const explicit = anchor.getAttribute('title') || anchor.dataset.embedTitle;
            const text = (anchor.textContent || '').trim();
            if (explicit) return explicit;
            if (text) return text;
            return 'Embedded video';
        }

        getDefaultProviders() {
            return [
                {
                    name: 'YouTube',
                    selectors: [
                        'a[href*="youtube.com/watch"]',
                        'a[href*="youtube.com/shorts"]',
                        'a[href*="youtu.be/"]',
                        'a[href*="youtube.com/embed"]'
                    ],
                    matches: (url) => !!MediaEmbedManager.extractYouTubeId(url),
                    getEmbedConfig: (url, anchor) => {
                        const videoId = MediaEmbedManager.extractYouTubeId(url);
                        if (!videoId) return null;

                        const params = MediaEmbedManager.collectYouTubeParams(url.searchParams, videoId);
                        const query = params.toString();

                        return {
                            src: `https://www.youtube.com/embed/${videoId}` + (query ? `?${query}` : ''),
                            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                        };
                    }
                },
                {
                    name: 'Vimeo',
                    selectors: [
                        'a[href*="vimeo.com/"]',
                        'a[href*="player.vimeo.com/"]'
                    ],
                    matches: (url) => !!MediaEmbedManager.extractVimeoId(url),
                    getEmbedConfig: (url) => {
                        const videoId = MediaEmbedManager.extractVimeoId(url);
                        if (!videoId) return null;

                        const params = new URLSearchParams(url.searchParams);
                        const query = params.toString();
                        const hash = url.hash && url.hash.startsWith('#t=') ? url.hash : '';

                        return {
                            src: `https://player.vimeo.com/video/${videoId}` + (query ? `?${query}` : '') + hash,
                            allow: 'autoplay; fullscreen; picture-in-picture'
                        };
                    }
                }
            ];
        }

        static collectYouTubeParams(searchParams, videoId) {
            const allowedParams = ['si', 'start', 'end', 'autoplay', 'mute', 'loop', 'controls', 'rel', 'modestbranding', 'playsinline', 'color'];
            const params = new URLSearchParams();

            allowedParams.forEach(param => {
                if (searchParams.has(param)) {
                    params.set(param, searchParams.get(param));
                }
            });

            if (searchParams.has('t') && !params.has('start')) {
                const seconds = MediaEmbedManager.parseTime(searchParams.get('t'));
                if (!Number.isNaN(seconds)) {
                    params.set('start', String(seconds));
                }
            }

            if (params.get('loop') === '1' && !params.has('playlist')) {
                params.set('playlist', videoId);
            }

            return params;
        }

        static extractYouTubeId(url) {
            try {
                if (url.hostname.includes('youtu.be')) {
                    return url.pathname.replace(/^\//, '').split('/')[0];
                }

                if (url.pathname.startsWith('/embed/')) {
                    return url.pathname.split('/')[2] || null;
                }

                if (url.pathname.startsWith('/shorts/')) {
                    const parts = url.pathname.split('/').filter(Boolean);
                    return parts[1] || parts[0] || null;
                }

                if (url.searchParams.has('v')) {
                    return url.searchParams.get('v');
                }
            } catch (error) {
                console.error('MediaEmbedManager: unable to extract YouTube id', url.href, error);
            }
            return null;
        }

        static extractVimeoId(url) {
            try {
                if (url.hostname.includes('player.vimeo.com')) {
                    const parts = url.pathname.split('/').filter(Boolean);
                    const videoIndex = parts.findIndex(part => part === 'video');
                    if (videoIndex !== -1 && parts[videoIndex + 1]) {
                        return parts[videoIndex + 1];
                    }
                }

                const match = url.pathname.match(/\/(\d+)(?:$|[/?#])/);
                if (match) return match[1];
            } catch (error) {
                console.error('MediaEmbedManager: unable to extract Vimeo id', url.href, error);
            }
            return null;
        }

        static parseTime(value) {
            if (!value) return NaN;
            if (/^\d+$/.test(value)) return parseInt(value, 10);

            const match = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/i.exec(value);
            if (!match) return NaN;

            const hours = parseInt(match[1] || '0', 10);
            const minutes = parseInt(match[2] || '0', 10);
            const seconds = parseInt(match[3] || '0', 10);
            return hours * 3600 + minutes * 60 + seconds;
        }

        static hasInlineMarker(text) {
            if (!text) return false;
            INLINE_MARKER_PATTERN.lastIndex = 0;
            return INLINE_MARKER_PATTERN.test(text);
        }

        static getInlineMarkerRegex() {
            return new RegExp(INLINE_MARKER_PATTERN.source, 'g');
        }
    }

    function initializeMediaEmbeds() {
        if (!window.mediaEmbedManager) {
            window.mediaEmbedManager = new MediaEmbedManager();
            window.mediaEmbedManager.init();
        } else {
            window.mediaEmbedManager.process();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMediaEmbeds);
    } else {
        initializeMediaEmbeds();
    }
})();
