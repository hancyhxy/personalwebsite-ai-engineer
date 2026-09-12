/* Shared first-viewport renderer: the flip surface and real detail page use identical markup/data. */
(function () {
  'use strict';
  window.ProjectDetailHero = {
    render: function (root, index) {
      var project = SCROLLCAROUSEL_PROJECTS[index];
      if (!project) return null;
      var category = SCROLLCAROUSEL_CATEGORY_LABELS[project.category] || project.category;
      function text(id, value) { var el = root.querySelector('#' + id); if (el) el.textContent = value; }
      text('scc-detail-number', 'Project ' + String(index + 1).padStart(2, '0') + ' / ' + SCROLLCAROUSEL_PROJECTS.length);
      text('scc-detail-title', project.title);
      text('scc-detail-meta', project.year + ' · ' + category + ' · ' + project.company);
      text('scc-detail-summary', project.summary + (project.sceneNote ? ' ' + project.sceneNote : ''));
      var hero = root.querySelector('#scc-detail-hero-image');
      if (hero) { hero.fetchPriority = 'high'; hero.src = project.hero || project.thumb; hero.alt = project.title; }
      return hero;
    }
  };
})();
