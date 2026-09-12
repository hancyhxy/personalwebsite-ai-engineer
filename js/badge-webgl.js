/* Three.js project field shared by the badge hero, opening and three-part work story. */
(function () {
  "use strict";

  var projects = typeof SCROLLCAROUSEL_PROJECTS !== "undefined" ? SCROLLCAROUSEL_PROJECTS : null;
  if (!Array.isArray(projects) || !window.THREE || !window.gsap) return;

  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  var root = document.createElement("div");
  root.className = "badge-webgl";
  root.id = "badge-webgl";
  root.setAttribute("aria-hidden", "true");
  document.body.prepend(root);

  var preview = document.createElement("aside");
  preview.className = "badge-project-panel";
  preview.id = "badge-project-panel";
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML = '<button class="badge-project-close" type="button" aria-label="Close project preview">×</button><img class="badge-project-thumb" alt=""><div><p class="micro badge-project-number"></p><h2 class="badge-project-title"></h2><p class="badge-project-meta"></p><p class="badge-project-summary"></p><button class="badge-project-enter" type="button">Enter <span aria-hidden="true">↗</span></button></div>';
  document.body.append(preview);

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (error) { document.body.classList.add("badge-no-webgl"); return; }
  renderer.setClearColor(0xfafaf8, 0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 800 ? 1.2 : 1.55));
  renderer.outputEncoding = THREE.sRGBEncoding;
  root.append(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1400);
  camera.position.z = 600;
  var field = new THREE.Group();
  scene.add(field);

  var manager = new THREE.LoadingManager();
  var resolveTextures;
  var texturesReady = new Promise(function (resolve) { resolveTextures = resolve; });
  manager.onLoad = function () {
    realMeshes.concat(ghostMeshes).forEach(function (mesh) {
      var image = mesh.material.uniforms.uTexture.value.image;
      if (image && image.width && image.height) mesh.material.uniforms.uTextureAspect.value = image.width / image.height;
    });
    resolveTextures();
  };
  var loader = new THREE.TextureLoader(manager);
  var textures = {};
  var width = 1, height = 1;
  var realMeshes = [], ghostMeshes = [], interactiveMeshes = [];
  var hovered = null, selected = null, selectedRect = null, entering = false;
  var openingMeshCount = 0, heroTargets = {};
  var pointer = new THREE.Vector2(4, 4), raycaster = new THREE.Raycaster();
  var targetScroll = scrollY || 0, smoothScroll = targetScroll, velocity = 0, lastScroll = targetScroll;
  var opening = { active: document.documentElement.classList.contains("opening-pending"), wave: 0, gather: 0, land: 0, size: 0, alpha: 0 };
  var visualStyle = getComputedStyle(document.body);
  function sceneToken(name, fallback) {
    var value = parseFloat(visualStyle.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  }

  var layouts = [
    { project: 0, x: 0, y: -2.72, size: .37, role: "main", section: "independent" },
    { project: 1, x: -.39, y: -3.02, size: .17, role: "side", section: "independent" },
    { project: 2, x: .39, y: -2.45, size: .18, role: "side", section: "independent" },
    { project: 3, x: 0, y: -1.38, size: .38, role: "main", section: "ux" },
    { project: 4, x: -.39, y: -1.72, size: .18, role: "side", section: "ux" },
    { project: 5, x: .39, y: -1.15, size: .17, role: "side", section: "ux" },
    { project: 6, x: .4, y: -3.02, size: .16, role: "side", section: "independent" },
    { project: 7, x: -.4, y: -1.98, size: .16, role: "side", section: "ux" },
    { project: 8, x: 0, y: -4.08, size: .38, role: "main", section: "parsons" },
    { project: 9, x: -.4, y: -4.42, size: .17, role: "side", section: "parsons" },
    { project: 10, x: .39, y: -3.78, size: .18, role: "side", section: "parsons" },
    { project: 11, x: -.42, y: -4.68, size: .15, role: "side", section: "parsons" },
    { project: 12, x: .41, y: -4.44, size: .16, role: "side", section: "parsons" },
    { project: 13, x: 0, y: -5.18, size: .34, role: "main", section: "parsons" },
    { project: 14, x: -.4, y: -5.12, size: .16, role: "side", section: "parsons" },
    { project: 15, x: .4, y: -4.93, size: .17, role: "side", section: "parsons" }
  ];
  var heroLayouts = [
    { project: 0, x: -.34, y: .22, size: .18, role: "hero" },
    { project: 4, x: .34, y: .10, size: .20, role: "hero" },
    { project: 8, x: 0, y: -.44, size: .17, role: "hero" }
  ];

  var vertexShader = "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}";
  var fragmentShader = "uniform sampler2D uTexture;uniform float uTextureAspect;uniform float uPlaneAspect;uniform float uWashed;uniform float uFocus;uniform float uOpacity;varying vec2 vUv;void main(){vec2 uv=vUv;if(uTextureAspect>uPlaneAspect){float s=uPlaneAspect/uTextureAspect;uv.x=(uv.x-.5)*s+.5;}else{float s=uTextureAspect/uPlaneAspect;uv.y=(uv.y-.5)*s+.5;}vec4 t=texture2D(uTexture,uv);vec3 back=mix(vec3(.965),t.rgb,.025);vec3 quiet=mix(vec3(.98),t.rgb,.52);vec3 c=mix(quiet,back,uWashed);c=mix(c,t.rgb,uFocus);gl_FragColor=vec4(c,uOpacity);}";

  function textureFor(src) {
    if (!textures[src]) {
      textures[src] = loader.load(src);
      textures[src].encoding = THREE.sRGBEncoding;
      textures[src].minFilter = THREE.LinearFilter;
    }
    return textures[src];
  }
  function material(project, ghost) {
    return new THREE.ShaderMaterial({
      uniforms: { uTexture: { value: textureFor(project.thumb) }, uTextureAspect: { value: 16 / 9 }, uPlaneAspect: { value: 16 / 9 }, uWashed: { value: ghost ? 1 : .2 }, uFocus: { value: ghost ? 0 : .3 }, uOpacity: { value: opening.active ? 0 : (ghost ? .27 : 1) } },
      vertexShader: vertexShader, fragmentShader: fragmentShader, transparent: true, depthWrite: false, depthTest: true
    });
  }
  function makeMesh(layout, ghost, duplicate) {
    var project = projects[layout.project];
    var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(1, 1), material(project, ghost));
    mesh.userData = { layout: layout, project: project, projectIndex: layout.project, ghost: ghost, duplicate: Boolean(duplicate), openingIndex: !ghost && !duplicate ? openingMeshCount++ : -1, hover: 1, pointerFocus: 0, scrollFocus: 0, seed: ((layout.project * 31 + realMeshes.length * 17) % 97) / 97 };
    mesh.position.z = ghost ? -220 - (ghostMeshes.length % 3) * 55 : 0;
    mesh.renderOrder = ghost ? 0 : 3;
    field.add(mesh);
    if (ghost) ghostMeshes.push(mesh);
    else { realMeshes.push(mesh); interactiveMeshes.push(mesh); }
    return mesh;
  }
  layouts.forEach(function (layout) { makeMesh(layout, false, false); });
  heroLayouts.forEach(function (layout) { heroTargets[layout.project] = makeMesh(layout, false, true); });

  var ratios = [1, .75, .8, .667, 1.25, 1.777];
  var columns = [-.52, -.34, -.17, .17, .34, .52];
  var ghostCount = 0;
  for (var row = 0; row < 23; row++) {
    var y = .76 - row * sceneToken("--scene-ghost-row-gap", .29);
    columns.forEach(function (x, column) {
      var px = x + (row % 2 ? (x < 0 ? -.018 : .018) : 0);
      var occupied = layouts.concat(heroLayouts).some(function (slot) { return Math.abs(slot.y - y) < .22 && Math.abs(slot.x - px) < .17; });
      if (occupied || ((row + column) % 5 === 0)) return;
      makeMesh({ project: (ghostCount * 7 + row) % projects.length, x: px, y: y, size: sceneToken("--scene-ghost-base-size", .07) + ((row + column) % 5) * sceneToken("--scene-ghost-size-step", .013), aspect: ratios[(row * 2 + column) % ratios.length], role: "ghost" }, true, false);
      ghostCount++;
    });
  }

  function layoutMesh(mesh) {
    var l = mesh.userData.layout;
    var roleScale = l.role === "main" ? sceneToken("--scene-main-size", 1) : l.role === "side" || l.role === "hero" ? sceneToken("--scene-side-size", 1) : 1;
    var factor = (width < 760 ? (l.role === "main" ? 1.72 : .88) : 1) * roleScale;
    var cardWidth = width * l.size * factor;
    mesh.userData.finalX = l.x * width * (width < 760 ? .9 : 1) * sceneToken("--scene-column-spacing", 1);
    mesh.userData.finalY = l.y * height;
    mesh.userData.cardWidth = cardWidth;
    mesh.userData.cardHeight = cardWidth / (l.aspect || sceneToken("--project-image-ratio", 16 / 9));
  }
  function resize() {
    width = innerWidth || 1; height = innerHeight || 1;
    renderer.setSize(width, height, false);
    camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2; camera.updateProjectionMatrix();
    realMeshes.concat(ghostMeshes).forEach(layoutMesh);
  }

  function screenRect(mesh) {
    var w = mesh.scale.x, h = mesh.scale.y;
    var cx = width / 2 + mesh.position.x;
    var cy = height / 2 - (mesh.position.y + field.position.y);
    return { left: cx - w / 2, top: cy - h / 2, width: w, height: h };
  }
  function setHover(mesh) {
    if (hovered === mesh || entering) return;
    if (hovered) { gsap.to(hovered.userData, { hover: 1, pointerFocus: 0, duration: .35 }); hovered.renderOrder = 3; hovered.material.depthTest = true; }
    hovered = mesh;
    document.body.classList.toggle("badge-can-click", Boolean(mesh));
    if (mesh) { mesh.renderOrder = 20; mesh.material.depthTest = false; gsap.to(mesh.userData, { hover: 1.08, pointerFocus: 1, duration: .35 }); }
  }
  function overUI(target) { return target.closest && target.closest("a,button,iframe,.badge,.mast,.work-story-copy,.work-story-progress,.work-next,.resume-section,.site-footer,.agent-panel,.agent-fab,.badge-project-panel"); }
  function raycast() {
    if (entering || Number(root.style.opacity || 1) < .08) return setHover(null);
    raycaster.setFromCamera(pointer, camera);
    var hit = raycaster.intersectObjects(interactiveMeshes, false)[0];
    setHover(hit ? hit.object : null);
  }
  addEventListener("pointermove", function (event) {
    if (overUI(event.target)) pointer.set(4, 4);
    else { pointer.x = event.clientX / width * 2 - 1; pointer.y = -(event.clientY / height) * 2 + 1; }
    raycast();
  }, { passive: true });

  function openProject(index, sourceMesh) {
    selected = sourceMesh || layouts.map(function (_, i) { return realMeshes[i]; }).find(function (mesh) { return mesh.userData.projectIndex === index; });
    var project = projects[index];
    if (!project) return;
    selectedRect = selected ? screenRect(selected) : null;
    preview.querySelector(".badge-project-number").textContent = "Project " + String(index + 1).padStart(2, "0") + " / " + projects.length;
    preview.querySelector(".badge-project-title").textContent = project.title;
    preview.querySelector(".badge-project-meta").textContent = project.year + " · " + project.company;
    preview.querySelector(".badge-project-summary").textContent = project.summary;
    var image = preview.querySelector(".badge-project-thumb"); image.src = project.thumb;
    preview.classList.add("is-open"); preview.setAttribute("aria-hidden", "false");
    setTimeout(function () { preview.querySelector(".badge-project-close").focus({ preventScroll: true }); }, 250);
  }
  function closeProject() { preview.classList.remove("is-open"); preview.setAttribute("aria-hidden", "true"); }
  function enterProject() {
    if (!selected) return;
    entering = true;
    var index = selected.userData.projectIndex;
    var rect = selectedRect;
    var thumbRect = preview.querySelector(".badge-project-thumb").getBoundingClientRect();
    if (!rect || rect.bottom < 0 || rect.top > height) rect = { left: thumbRect.left, top: thumbRect.top, width: thumbRect.width, height: thumbRect.height };
    try { sessionStorage.setItem("badge-detail-transition", JSON.stringify({ index: index, rect: rect })); } catch (error) {}
    location.href = "./project-scrollcarousel.html?project=" + index;
  }
  preview.querySelector(".badge-project-close").addEventListener("click", closeProject);
  preview.querySelector(".badge-project-enter").addEventListener("click", enterProject);
  addEventListener("keydown", function (event) { if (event.key === "Escape" && preview.classList.contains("is-open")) closeProject(); });
  addEventListener("click", function (event) { if (!overUI(event.target) && hovered) openProject(hovered.userData.projectIndex, hovered); });

  addEventListener("scroll", function () { var next = scrollY || 0; velocity = next - lastScroll; lastScroll = next; targetScroll = next; }, { passive: true });
  addEventListener("resize", resize, { passive: true });

  function render() {
    smoothScroll += (targetScroll - smoothScroll) * (reduceMotion.matches ? 1 : .13);
    field.position.y = smoothScroll + velocity * .42;
    velocity *= .86;
    var all = realMeshes.concat(ghostMeshes);
    all.forEach(function (mesh, index) {
      var d = mesh.userData, isOpeningMesh = d.openingIndex >= 0;
      var t = isOpeningMesh ? d.openingIndex / Math.max(1, openingMeshCount - 1) : .5;
      var stackX = (t - .5) * Math.min(width * sceneToken("--opening-stack-span", .09), 130);
      var stackY = Math.sin(t * Math.PI * 2) * height * sceneToken("--opening-stack-amplitude", .035) + height * .04;
      var waveX = (t - .5) * width * sceneToken("--opening-wave-span", .50) + width * sceneToken("--opening-wave-center", 0);
      var waveY = Math.sin(t * Math.PI * 2) * height * sceneToken("--opening-wave-amplitude", .115) + height * sceneToken("--opening-wave-offset", .04);
      var gatherAngle = d.openingIndex * 2.399963;
      var gatherRadius = Math.sqrt(Math.max(0, t)) * Math.min(width * .105, height * .14);
      var gatherX = Math.cos(gatherAngle) * gatherRadius;
      var gatherY = Math.sin(gatherAngle) * gatherRadius * .72 + height * .04;
      var introX = stackX + (waveX - stackX) * opening.wave;
      var introY = stackY + (waveY - stackY) * opening.wave;
      introX += (gatherX - introX) * opening.gather;
      introY += (gatherY - introY) * opening.gather;
      var openingTarget = isOpeningMesh ? heroTargets[d.projectIndex] : null;
      var destinationX = opening.active && openingTarget ? openingTarget.userData.finalX : d.finalX;
      var destinationY = opening.active && openingTarget ? openingTarget.userData.finalY : d.finalY;
      if (opening.active && !isOpeningMesh) { mesh.position.x = d.finalX; mesh.position.y = d.finalY; }
      else { mesh.position.x = introX + (destinationX - introX) * opening.land; mesh.position.y = introY + (destinationY - introY) * opening.land; }
      var screenY = d.finalY + field.position.y;
      var focus = !opening.active && !d.ghost && !d.duplicate && d.layout.role === "main" ? Math.max(0, 1 - Math.abs(screenY) / (height * .48)) : 0;
      d.scrollFocus += (focus - d.scrollFocus) * .12;
      var scale = d.hover * (1 + d.scrollFocus * sceneToken("--scene-focus-scale", .15));
      var openingWidth = Math.min(sceneToken("--opening-thumb-width", 88), width * .23);
      var openingHeight = openingWidth / sceneToken("--project-image-ratio", 16 / 9);
      var destinationWidth = opening.active && openingTarget ? openingTarget.userData.cardWidth : d.cardWidth;
      var destinationHeight = opening.active && openingTarget ? openingTarget.userData.cardHeight : d.cardHeight;
      var baseWidth = opening.active && isOpeningMesh ? openingWidth + (destinationWidth - openingWidth) * opening.size : d.cardWidth;
      var baseHeight = opening.active && isOpeningMesh ? openingHeight + (destinationHeight - openingHeight) * opening.size : d.cardHeight;
      mesh.scale.set(baseWidth * scale, baseHeight * scale, 1);
      mesh.material.uniforms.uPlaneAspect.value = baseWidth / baseHeight;
      mesh.material.uniforms.uFocus.value = opening.active ? 1 : Math.max(d.pointerFocus, d.scrollFocus, d.ghost ? 0 : .25);
      mesh.material.uniforms.uWashed.value = opening.active ? 0 : (d.ghost ? 1 : .18 * (1 - d.scrollFocus));
      var lateSceneAlpha = Math.max(0, Math.min(1, (opening.land - .58) / .42));
      mesh.material.uniforms.uOpacity.value = opening.active ? (isOpeningMesh ? opening.alpha : d.ghost ? lateSceneAlpha * .27 : 0) : (d.ghost ? .27 : 1);
      mesh.visible = !opening.active || isOpeningMesh || (d.ghost && lateSceneAlpha > .01);
      if (!d.ghost && d.scrollFocus > .25) { mesh.renderOrder = 10; mesh.material.depthTest = false; }
      else if (mesh !== hovered) { mesh.renderOrder = d.ghost ? 0 : 3; mesh.material.depthTest = true; }
    });
    var story = document.getElementById("work-story");
    var archive = document.getElementById("work-next");
    if (story && archive && !opening.active) {
      var fadeStart = archive.offsetTop - height * .82, fadeEnd = archive.offsetTop - height * .22;
      root.style.opacity = String(1 - Math.max(0, Math.min(1, (smoothScroll - fadeStart) / Math.max(1, fadeEnd - fadeStart))));
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  function setOpeningProgress(values) {
    if (typeof values.wave === "number") opening.wave = values.wave;
    if (typeof values.gather === "number") opening.gather = values.gather;
    if (typeof values.land === "number") opening.land = values.land;
    if (typeof values.size === "number") opening.size = values.size;
    if (typeof values.alpha === "number") opening.alpha = values.alpha;
  }
  function finishOpening() { opening.wave = 1; opening.gather = 1; opening.land = 1; opening.size = 1; opening.alpha = 1; opening.active = false; }

  resize(); render(); document.body.classList.add("badge-webgl-ready");
  window.BADGE_SCENE = { texturesReady: texturesReady, setOpeningProgress: setOpeningProgress, finishOpening: finishOpening, openProject: openProject };
})();
