/* Exact destination measurement uses the real same-origin detail layout, not a second CSS formula. */
(function () {
  'use strict';
  var cache = new Map();
  window.BadgeHeroGeometry = {
    measure: function (index) {
      var key = index + ':' + innerWidth + ':' + innerHeight;
      if (cache.has(key)) return cache.get(key);
      var pending = new Promise(function (resolve, reject) {
        var frame = document.createElement('iframe'), settled = false;
        frame.tabIndex = -1; frame.setAttribute('aria-hidden', 'true'); frame.title = 'Project layout measurement';
        frame.style.cssText = 'position:fixed;left:-20000px;top:0;border:0;visibility:hidden;pointer-events:none;width:' + innerWidth + 'px;height:' + innerHeight + 'px';
        var timer = setTimeout(function () { finish(null); }, 4500);
        function finish(rect) { if (settled) return; settled = true; clearTimeout(timer); frame.remove(); if (rect) resolve(rect); else { cache.delete(key); reject(new Error('Detail geometry unavailable')); } }
        frame.addEventListener('load', function () {
          try {
            frame.contentDocument.fonts.ready.then(function () {
              if (settled) return;
              var r = frame.contentDocument.getElementById('scc-detail-hero-media').getBoundingClientRect();
              finish({ left: r.left, top: r.top, width: r.width, height: r.height });
            }).catch(function () { finish(null); });
          } catch (_) { finish(null); }
        });
        frame.src = './project-scrollcarousel.html?project=' + index + '&measure=1'; document.body.append(frame);
      });
      cache.set(key, pending); return pending;
    }
  };
})();
