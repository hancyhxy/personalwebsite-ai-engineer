/* Generic case-study page for the scrollcarousel theme. */
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var index = Number(params.get("project"));
  if (!Number.isInteger(index) || index < 0 || index >= SCROLLCAROUSEL_PROJECTS.length) index = 0;

  var project = SCROLLCAROUSEL_PROJECTS[index];
  var slugMatch = project.url.match(/gallery\/([^/]+)/);
  var slug = slugMatch ? slugMatch[1] : "";
  var content = document.getElementById("scc-detail-content");
  var detailLayout = project.detailLayout === "two-column" ? "two-column" : "stacked";
  content.dataset.layout = detailLayout;
  document.body.dataset.detailLayout = detailLayout;

  document.title = project.title + " — Xinyi Han";
  ProjectDetailHero.render(document, index);

  var nextIndex = (index + 1) % SCROLLCAROUSEL_PROJECTS.length;
  var next = document.getElementById("scc-detail-next");
  next.href = "./project-scrollcarousel.html?project=" + nextIndex;
  next.textContent = "Next: " + SCROLLCAROUSEL_PROJECTS[nextIndex].title + " →";

  function plainInline(text) {
    return text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1");
  }

  function imagePath(relative) {
    var filename = relative.replace(/^\.\/public\//, "").replace(/^public\//, "");
    return "./assets/images/" + slug + "/" + filename;
  }

  function renderMarkdown(markdown) {
    content.replaceChildren();
    var lines = markdown.split(/\r?\n/);
    var list = null;
    var skippedCover = false;
    var skippedTitle = false;

    function endList() { list = null; }
    lines.forEach(function (raw) {
      var line = raw.trim();
      if (!line) { endList(); return; }

      var image = line.match(/^(?:(0?\.\d+)\s+)?!\[([^\]]*)\]\(([^)]+)\)$/);
      if (image) {
        if (!skippedCover) { skippedCover = true; return; }
        endList();
        var figure = document.createElement("figure");
        if (image[1] && Number(image[1]) < 0.85) figure.className = "is-narrow";
        var img = document.createElement("img");
        img.src = imagePath(image[3]);
        img.alt = image[2] || "";
        img.loading = "lazy";
        figure.appendChild(img);
        if (image[2]) {
          var caption = document.createElement("figcaption");
          caption.textContent = image[2];
          figure.appendChild(caption);
        }
        content.appendChild(figure);
        return;
      }

      if (/^---+$/.test(line)) {
        endList();
        content.appendChild(document.createElement("hr"));
        return;
      }

      var heading = line.match(/^(#{1,4})\s+(.*)$/);
      if (heading) {
        endList();
        if (heading[1].length === 1 && !skippedTitle) { skippedTitle = true; return; }
        var level = Math.min(4, Math.max(2, heading[1].length));
        var headingElement = document.createElement("h" + level);
        headingElement.textContent = plainInline(heading[2]);
        content.appendChild(headingElement);
        return;
      }

      var bullet = line.match(/^[-*]\s+(.*)$/);
      if (bullet) {
        if (!list) {
          list = document.createElement("ul");
          content.appendChild(list);
        }
        var item = document.createElement("li");
        item.textContent = plainInline(bullet[1]);
        list.appendChild(item);
        return;
      }

      endList();
      var paragraph = document.createElement("p");
      paragraph.textContent = plainInline(line);
      content.appendChild(paragraph);
    });

    if (detailLayout === "two-column") {
      var nodes = Array.prototype.slice.call(content.children);
      var fragment = document.createDocumentFragment();
      var block = null;
      nodes.forEach(function (node) {
        if (/^H[23]$/.test(node.tagName)) {
          block = document.createElement("section");
          block.className = "scc-detail-block";
          var body = document.createElement("div");
          body.className = "scc-detail-block-body";
          block.append(node, body);
          fragment.appendChild(block);
        } else {
          if (!block) {
            block = document.createElement("section");
            block.className = "scc-detail-block scc-detail-block-intro";
            var introBody = document.createElement("div");
            introBody.className = "scc-detail-block-body";
            block.append(introBody);
            fragment.appendChild(block);
          }
          block.querySelector(".scc-detail-block-body").appendChild(node);
        }
      });
      content.replaceChildren(fragment);
    }
  }

  fetch("./content/projects/" + slug + "/text.md")
    .then(function (response) {
      if (!response.ok) throw new Error("Case study not found");
      return response.text();
    })
    .then(renderMarkdown)
    .catch(function () {
      content.innerHTML = "<h2>Case study</h2><p>The full project story is being prepared.</p>";
    });

  // Retire legacy image-flight handoffs; the current flip controller owns its own bounded state.
  try {
    sessionStorage.removeItem('badge-detail-transition');
    sessionStorage.removeItem('scc-enter-project');
  } catch (_) {}
})();
