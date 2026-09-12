/* Three concise chapter captions synchronized with the persistent WebGL field. */
(function () {
  "use strict";
  var section = document.getElementById("work-story");
  var copiesRoot = document.getElementById("work-story-copy");
  var progressRoot = document.getElementById("work-story-progress");
  if (!section || !copiesRoot || !progressRoot) return;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)");
  var chapters = [
    { at: .38, label: "01 / 03", title: "UX Designer", line: "I make complex systems feel clear and usable." },
    { at: 1.72, label: "02 / 03", title: "Independent Work", line: "I turn emerging ideas into working experiences." },
    { at: 3.08, label: "03 / 03", title: "Parsons School", line: "I learned by making ideas visible, physical and interactive." }
  ];
  var copies = chapters.map(function (chapter) {
    var article = document.createElement("article");
    article.className = "work-story-copy";
    article.innerHTML = '<p class="micro">' + chapter.label + '</p><h3>' + chapter.title + '</h3><p class="work-story-statement">' + chapter.line + '</p>';
    copiesRoot.append(article); return article;
  });
  var buttons = chapters.map(function (chapter, index) {
    var button = document.createElement("button"); button.type = "button";
    button.setAttribute("aria-label", "Go to " + chapter.title);
    button.innerHTML = "<span>" + chapter.label + "</span>";
    button.addEventListener("click", function () { scrollTo({ top: section.offsetTop + chapter.at * innerHeight, behavior: reduced.matches ? "auto" : "smooth" }); });
    progressRoot.append(button); return button;
  });
  window.BADGE_WORK_GROUP = function (scrollPosition) {
    if (scrollPosition < section.offsetTop - innerHeight * .25) return "hero";
    var screens = (scrollPosition - section.offsetTop) / innerHeight;
    var nearest = 0;
    chapters.forEach(function (chapter, index) {
      if (Math.abs(screens - chapter.at) < Math.abs(screens - chapters[nearest].at)) nearest = index;
    });
    return ["ux", "independent", "parsons"][nearest];
  };
  var active = -1, raf = 0;
  function render() {
    raf = 0;
    var screens = -section.getBoundingClientRect().top / innerHeight;
    var nearest = 0, nearestDistance = Infinity;
    chapters.forEach(function (chapter, index) {
      var distance = Math.abs(screens - chapter.at);
      if (distance < nearestDistance) { nearest = index; nearestDistance = distance; }
      var presence = Math.max(0, 1 - distance / .68);
      copies[index].style.opacity = String(presence);
      copies[index].style.transform = "translateY(" + ((chapter.at - screens) * 34) + "px)";
    });
    if (nearest !== active) {
      active = nearest;
      buttons.forEach(function (button, index) { index === active ? button.setAttribute("aria-current", "step") : button.removeAttribute("aria-current"); });
    }
    var intro = document.querySelector(".work-story-intro");
    if (intro) intro.style.opacity = String(Math.max(0, 1 - Math.max(0, screens) / .18));
  }
  function requestRender() { if (!raf) raf = requestAnimationFrame(render); }
  addEventListener("scroll", requestRender, { passive: true }); addEventListener("resize", requestRender, { passive: true }); render();

  var scrollButton = document.getElementById("hero-scroll");
  if (scrollButton) scrollButton.addEventListener("click", function () { scrollTo({ top: section.offsetTop + chapters[0].at * innerHeight, behavior: reduced.matches ? "auto" : "smooth" }); });
})();
