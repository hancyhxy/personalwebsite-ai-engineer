/* Chapter-level HTML copy. All selected works remain in the perspective field simultaneously. */
(function () {
  'use strict';
  var B = window.BadgeScene;
  function chapterTags(group) {
    var tags = document.createElement('p'); tags.className = 'scene-keywords ink-tags';
    group.keywords.forEach(function (word) { var tag = document.createElement('span'); tag.textContent = word; tags.append(tag); });
    return tags;
  }
  B.Reading = function (root) {
    this.root = root; this.headers = [];
    B.groups.forEach(function (g) {
      var el = document.createElement('header'); el.className = 'scene-chapter-heading scene-overview-heading'; el.dataset.group = g.id;
      var title = document.createElement('h2'); title.textContent = g.title;
      var keywords = chapterTags(g);
      var line = document.createElement('p'); line.className = 'scene-chapter-line'; line.textContent = g.line;
      el.append(title, keywords, line); root.append(el); this.headers.push({ group: g, el: el });
    }, this);
    // Global navigation and progress guides are owned by badge-scroll-chrome.js.
  };
  B.Reading.prototype.resize = function () {
    this.headers.forEach(function (h) { h.width = h.el.offsetWidth; h.height = h.el.offsetHeight; });
    // Keep the first artwork clear of the measured title/tags/copy, including short phones.
    var width = Math.min(innerWidth * .76, innerWidth - 92, 380), imageHeight = width * 9 / 16;
    B.mobileComposition = {
      width: width,
      firstY: Math.max(innerHeight * .64, innerHeight * .12 + this.headers[0].height + 42 + imageHeight / 2),
      gap: Math.max(innerHeight * .40, imageHeight + 100)
    };
    this.target = this.safeTarget = { regions: [] };
  };
  B.Reading.prototype.update = function (state, items, visibility) {
    var regions = [];
    this.headers.forEach(function (h) {
      var g = h.group, transform = B.chapterTransform(g, state), scale = transform.scale;
      var anchor = B.mobilePilot && g === B.groups[0] ? .12 : g.id === 'experimental' ? .39 : .38;
      var y = innerHeight * (.5 + (anchor - .5) * scale + transform.offset);
      var width = h.width * scale, height = h.height * scale;
      var alpha = visibility * state.weights[g.id];
      h.el.style.top = y + 'px'; h.el.style.opacity = alpha;
      h.el.style.transformOrigin = '50% 0';
      h.el.style.transform = 'translateX(-50%) scale(' + scale + ')';
      h.el.setAttribute('aria-hidden', alpha < .05 || y + height < 0 || y > innerHeight ? 'true' : 'false');
      if (visibility > .001 && state.weights[g.id] > 0) regions.push({ left: (innerWidth - width) / 2, top: y, width: width, height: height, bottom: y + height, strength: B.smooth(0, .4, state.weights[g.id]) * visibility });
    });
    this.target = this.safeTarget = { regions: regions };

  };
  B.createFallback = function (section) {
    var fallback = document.createElement('div'); fallback.className = 'scene-fallback';
    var groups = B.groups.concat([{ id: 'archive', title: 'Archive', line: 'Earlier work and additional explorations.', projects: B.archived }]);
    groups.forEach(function (g) {
      var group = document.createElement('section'); group.id = 'fallback-' + g.id;
      var h = document.createElement('h2'); h.textContent = g.title;
      group.append(h);
      if (g.keywords) group.append(chapterTags(g));
      var p = document.createElement('p'); p.textContent = g.line; group.append(p);
      g.projects.forEach(function (i) {
        var project = B.projects[i], a = document.createElement('a'); a.href = './project-scrollcarousel.html?project=' + i;
        var image = document.createElement('img'); image.src = project.thumb; image.alt = ''; image.loading = 'lazy'; image.width = 800; image.height = 450;
        var title = document.createElement('h3'); title.textContent = project.title;
        var description = document.createElement('p'); description.textContent = project.summary + (project.sceneNote ? ' ' + project.sceneNote : '');
        a.append(image, title, description); group.append(a);
      });
      fallback.append(group);
    });
    section.append(fallback); return fallback;
  };
})();
