/* Legacy case URLs retain crawlable HTML but open the current detail for browsers. */
(function () {
  'use strict';
  var script = document.currentScript;
  var index = script && script.dataset.projectIndex;
  if (!/^\d+$/.test(index || '')) return;
  var target = new URL('../project-scrollcarousel.html', script.src);
  var incoming = new URLSearchParams(location.search);
  incoming.delete('project'); // The path, never a tracking/query value, owns case identity.
  target.search = incoming.toString();
  target.searchParams.set('project', index);
  target.hash = location.hash;
  location.replace(target.href);
})();
