/* ============================================================
   Three.js project field inspired by Getty's layered collage system.
   - 16 unique foreground projects on a strict, upright spatial grid
   - repeated, washed-out back planes that never receive pointer events
   - scroll-velocity inertia, raycast rollover, fixed DOM credits panel
   - a WebGL shared-image zoom before entering a project
   ============================================================ */
(function () {
  "use strict";

  var root = document.getElementById("scc-webgl");
  var status = document.getElementById("scc-webgl-status");
  var projects = typeof SCROLLCAROUSEL_PROJECTS !== "undefined" ? SCROLLCAROUSEL_PROJECTS : null;
  var categories = typeof SCROLLCAROUSEL_CATEGORY_LABELS !== "undefined" ? SCROLLCAROUSEL_CATEGORY_LABELS : {};
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!root || !Array.isArray(projects) || !window.THREE || !window.gsap) {
    document.body.classList.add("scc-no-webgl");
    if (status) status.textContent = "Project field unavailable. Use the project index below.";
    return;
  }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (error) {
    document.body.classList.add("scc-no-webgl");
    if (status) status.textContent = "Project field unavailable. Use the project index below.";
    return;
  }

  renderer.setClearColor(0xfcfbf9, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.domElement.className = "scc-webgl-canvas";
  root.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1200);
  camera.position.z = 500;
  var field = new THREE.Group();
  scene.add(field);

  var loadingProgress = 0;
  var resolveTextures;
  var texturesReady = new Promise(function (resolve) { resolveTextures = resolve; });
  var loadingManager = new THREE.LoadingManager();
  loadingManager.onProgress = function (url, loaded, total) {
    loadingProgress = total ? loaded / total : 0;
    window.dispatchEvent(new CustomEvent("scc-texture-progress", { detail: loadingProgress }));
  };
  loadingManager.onLoad = function () { loadingProgress = 1; resolveTextures(); };
  var loader = new THREE.TextureLoader(loadingManager);
  var textureCache = {};
  var realMeshes = [];
  var ghostMeshes = [];
  var interactiveMeshes = [];
  var hovered = null;
  var selected = null;
  var enteringMesh = null;
  var isEntering = false;
  var width = 1;
  var height = 1;
  var targetScroll = window.scrollY || 0;
  var smoothScroll = targetScroll;
  var scrollVelocity = 0;
  var velocityOffset = 0;
  var pointer = new THREE.Vector2(4, 4);
  var raycaster = new THREE.Raycaster();
  var clock = new THREE.Clock();
  var keywordCategory = null;
  var heroCategoryActive = true;
  var opening = {
    active: document.documentElement.classList.contains("scc-opening-pending"),
    wave: 0,
    land: document.documentElement.classList.contains("scc-opening-pending") ? 0 : 1,
    alpha: document.documentElement.classList.contains("scc-opening-pending") ? 0 : 1
  };

  var preview = document.getElementById("scc-project-preview");
  var previewTitle = document.getElementById("scc-preview-title");
  var previewMeta = document.getElementById("scc-preview-meta");
  var previewDescription = document.getElementById("scc-preview-description");
  var previewThumb = document.getElementById("scc-preview-thumb");
  var previewNumber = document.getElementById("scc-preview-number");
  var previewEnter = document.getElementById("scc-preview-enter");
  var previewClose = document.getElementById("scc-preview-close");
  var selectedSection = document.getElementById("selected-work");

  /* x is a viewport-width ratio. y is measured in viewport heights from
     the opening camera. The first three are the only real works on screen
     at y=0; subsequent rows form five balanced chapters. */
  var layouts = [
    { x: -0.39, y:  0.25, size: 0.18, role: "side" },
    { x:  0.39, y:  0.11, size: 0.20, role: "side" },
    { x:  0.00, y: -0.43, size: 0.17, role: "side" },

    { x:  0.00, y: -1.43, size: 0.40, role: "main" },
    { x: -0.40, y: -1.22, size: 0.17, role: "side" },
    { x:  0.40, y: -1.66, size: 0.16, role: "side" },

    { x:  0.00, y: -2.63, size: 0.38, role: "main" },
    { x: -0.40, y: -2.84, size: 0.16, role: "side" },
    { x:  0.40, y: -2.38, size: 0.18, role: "side" },

    { x:  0.00, y: -3.83, size: 0.40, role: "main" },
    { x: -0.41, y: -3.56, size: 0.16, role: "side" },
    { x:  0.40, y: -4.03, size: 0.17, role: "side" },

    { x:  0.00, y: -5.03, size: 0.38, role: "main" },
    { x: -0.40, y: -5.22, size: 0.17, role: "side" },

    { x:  0.00, y: -6.23, size: 0.40, role: "main" },
    { x:  0.40, y: -6.02, size: 0.17, role: "side" }
  ];

  var vertexShader = [
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = uv;",
    "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
    "}"
  ].join("\n");

  var fragmentShader = [
    "uniform sampler2D uTexture;",
    "uniform float uWashed;",
    "uniform float uRollover;",
    "uniform float uOpacity;",
    "varying vec2 vUv;",
    "void main() {",
    "  vec4 tex = texture2D(uTexture, vUv);",
    "  vec3 back = mix(vec3(0.965), tex.rgb, 0.025);",
    "  vec3 dimmed = mix(vec3(1.0), tex.rgb, 0.50);",
    "  vec3 washed = mix(dimmed, back, uWashed);",
    "  vec3 color = mix(washed, tex.rgb, uRollover);",
    "  gl_FragColor = vec4(color, uOpacity);",
    "}"
  ].join("\n");

  function textureFor(src) {
    if (textureCache[src]) return textureCache[src];
    var texture = loader.load(src);
    texture.encoding = THREE.sRGBEncoding;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    textureCache[src] = texture;
    return texture;
  }

  function materialFor(project, washed, opacity) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: textureFor(project.thumb) },
        uWashed: { value: washed },
        uRollover: { value: 0 },
        uOpacity: { value: opacity }
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: true
    });
  }

  function makePlane(project, index, isGhost, layout) {
    var mesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(1, 1),
      materialFor(project, isGhost ? 1 : 0, isGhost ? 0.34 : 1)
    );
    mesh.userData.project = project;
    mesh.userData.projectIndex = index;
    mesh.userData.layout = layout;
    mesh.userData.isGhost = isGhost;
    mesh.userData.hover = 1;
    mesh.userData.pointerFocus = 0;
    mesh.userData.scrollFocus = 0;
    mesh.userData.categoryOpacity = 1;
    mesh.userData.seed = ((index * 37 + (isGhost ? 19 : 0)) % 101) / 101;
    mesh.position.z = isGhost ? -180 - (index % 2) * 80 : 0;
    mesh.renderOrder = isGhost ? 0 : 2;
    field.add(mesh);
    return mesh;
  }

  projects.forEach(function (project, index) {
    var mesh = makePlane(project, index, false, layouts[index]);
    realMeshes.push(mesh);
    interactiveMeshes.push(mesh);
  });

  /* Build a deterministic back grid. It repeats the 16 textures, but every
     plane is shader-washed and excluded from the raycaster. Slots too close
     to a real project are omitted so no visible cards overlap. */
  var ghostColumns = [-0.47, -0.27, 0, 0.27, 0.47];
  var ghostIndex = 0;
  for (var row = 0; row < 22; row++) {
    var y = 0.75 - row * 0.36;
    ghostColumns.forEach(function (x, column) {
      var offsetX = row % 2 ? 0.035 : 0;
      var candidateX = x + (x < 0 ? -offsetX : x > 0 ? offsetX : 0);
      var occupied = layouts.some(function (layout) {
        return Math.abs(layout.y - y) < 0.24 && Math.abs(layout.x - candidateX) < 0.18;
      });
      if (occupied || (column === 2 && row % 3 !== 0)) return;
      var projectIndex = (ghostIndex * 7 + row) % projects.length;
      var ghostAspects = [1, 0.72, 0.8, 0.67, 1.25, 1.78];
      var ghostLayout = {
        x: candidateX,
        y: y,
        size: 0.078 + ((row + column) % 5) * 0.017,
        aspect: ghostAspects[(row * 3 + column) % ghostAspects.length],
        role: "ghost"
      };
      var ghost = makePlane(projects[projectIndex], projectIndex, true, ghostLayout);
      ghost.userData.ghostIndex = ghostIndex++;
      ghostMeshes.push(ghost);
    });
  }

  function applyLayout(mesh) {
    var layout = mesh.userData.layout;
    var cardWidth = width * layout.size;
    if (width < 760) {
      cardWidth *= layout.role === "main" ? 1.35 : 0.82;
      mesh.position.x = layout.x * width * 0.88;
    } else {
      mesh.position.x = layout.x * width;
    }
    mesh.position.y = layout.y * height;
    mesh.userData.finalX = mesh.position.x;
    mesh.userData.cardWidth = cardWidth;
    mesh.userData.cardHeight = cardWidth / (layout.aspect || 1.7777778);
  }

  function resize() {
    width = window.innerWidth || 1;
    height = window.innerHeight || 1;
    renderer.setSize(width, height, false);
    camera.left = width / -2;
    camera.right = width / 2;
    camera.top = height / 2;
    camera.bottom = height / -2;
    camera.updateProjectionMatrix();
    realMeshes.concat(ghostMeshes).forEach(applyLayout);
  }

  function setHover(mesh) {
    if (hovered === mesh || isEntering) return;
    if (hovered) {
      gsap.to(hovered.userData, { hover: 1, pointerFocus: 0, duration: 0.45, ease: "power2.out" });
      hovered.renderOrder = 2;
      hovered.material.depthTest = true;
    }
    hovered = mesh;
    document.body.classList.toggle("scc-can-click", Boolean(mesh));
    if (mesh) {
      mesh.renderOrder = 20;
      mesh.material.depthTest = false;
      gsap.to(mesh.userData, { hover: 1.1, pointerFocus: 1, duration: 0.5, ease: "power2.out" });
    }
  }

  function raycast() {
    if (isEntering || root.style.opacity === "0") return setHover(null);
    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(interactiveMeshes, false);
    setHover(hits.length ? hits[0].object : null);
  }

  function openProject(index) {
    var mesh = realMeshes[index];
    var project = projects[index];
    if (!mesh || !project || isEntering) return;
    selected = mesh;
    previewNumber.textContent = "Project " + String(index + 1).padStart(2, "0") + " / " + projects.length;
    previewTitle.textContent = project.title;
    previewMeta.textContent = project.year + " · " + (project.company || categories[project.category] || project.category);
    previewDescription.textContent = project.summary || "Open the project to learn more.";
    previewThumb.src = project.thumb;
    previewThumb.alt = "";
    preview.setAttribute("aria-hidden", "false");
    preview.classList.add("is-open");
    window.setTimeout(function () { previewClose.focus({ preventScroll: true }); }, 360);
  }

  function closeProject(restoreFocus) {
    preview.classList.remove("is-open");
    preview.setAttribute("aria-hidden", "true");
    if (restoreFocus && selected) renderer.domElement.focus({ preventScroll: true });
    selected = null;
  }

  function enterProject() {
    if (!selected || isEntering) return;
    isEntering = true;
    var mesh = selected;
    var project = mesh.userData.project;
    enteringMesh = mesh;
    closeProject(false);
    setHover(mesh);
    document.body.classList.add("scc-is-entering");
    if (window.sccLenis) window.sccLenis.stop();

    mesh.renderOrder = 100;
    mesh.material.depthTest = false;
    var targetScale = Math.max(width / mesh.userData.cardWidth, height / mesh.userData.cardHeight) * 1.08;
    var projectIndex = mesh.userData.projectIndex;
    try { sessionStorage.setItem("scc-enter-project", String(projectIndex)); } catch (error) {}
    var timeline = gsap.timeline({
      onComplete: function () {
        window.location.href = "./project-scrollcarousel.html?project=" + projectIndex;
      }
    });
    realMeshes.concat(ghostMeshes).forEach(function (other) {
      if (other !== mesh) timeline.to(other.material.uniforms.uOpacity, { value: 0, duration: 0.55 }, 0);
    });
    timeline.to(mesh.position, {
      x: 0,
      y: -field.position.y,
      z: 80,
      duration: reduceMotion.matches ? 0.01 : 1.05,
      ease: "power2.inOut"
    }, 0);
    timeline.to(mesh.userData, {
      hover: targetScale,
      duration: reduceMotion.matches ? 0.01 : 1.05,
      ease: "power2.inOut"
    }, 0);
  }

  function updatePointer(event) {
    if (event.target.closest && event.target.closest("a, button, dialog, .scc-id-card, .scc-selected, .scc-resume-section, .scc-contact, .scc-footer")) {
      pointer.set(4, 4);
      return raycast();
    }
    pointer.x = event.clientX / width * 2 - 1;
    pointer.y = -(event.clientY / height) * 2 + 1;
    raycast();
  }

  window.addEventListener("pointermove", updatePointer, { passive: true });
  window.addEventListener("click", function (event) {
    if (event.target.closest && event.target.closest("a, button, dialog, .scc-id-card, .scc-selected, .scc-resume-section, .scc-contact, .scc-footer")) return;
    if (hovered) openProject(hovered.userData.projectIndex);
  });
  window.addEventListener("resize", resize);
  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && preview.classList.contains("is-open")) closeProject(false);
  });
  previewClose.addEventListener("click", function () { closeProject(false); });
  previewEnter.addEventListener("click", enterProject);

  function setScroll(scroll, velocity) {
    targetScroll = scroll;
    scrollVelocity = velocity || 0;
  }

  if (window.Lenis && !reduceMotion.matches) {
    var lenis = new Lenis({ duration: 0.6, smoothWheel: true, wheelMultiplier: 0.9 });
    window.sccLenis = lenis;
    lenis.on("scroll", function (event) { setScroll(event.scroll, event.velocity); });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  } else {
    window.addEventListener("scroll", function () {
      var next = window.scrollY || 0;
      setScroll(next, next - targetScroll);
    }, { passive: true });
  }

  function render() {
    var elapsed = clock.getElapsedTime();
    smoothScroll += (targetScroll - smoothScroll) * (reduceMotion.matches ? 1 : 0.12);
    velocityOffset += (scrollVelocity * 0.9 - velocityOffset) * 0.045;
    field.position.y = smoothScroll + velocityOffset;

    var shouldUseHeroCategory = smoothScroll < height * 0.65;
    if (shouldUseHeroCategory !== heroCategoryActive) {
      heroCategoryActive = shouldUseHeroCategory;
      applyCategoryOpacity(heroCategoryActive ? keywordCategory : null);
    }

    realMeshes.concat(ghostMeshes).forEach(function (mesh, meshIndex) {
      var data = mesh.userData;
      if (enteringMesh === mesh) {
        mesh.scale.set(data.cardWidth * data.hover, data.cardHeight * data.hover, 1);
        return;
      }

      var drift = data.isGhost && !reduceMotion.matches && !opening.active
        ? Math.sin(elapsed * (0.42 + data.seed * 0.18) + data.seed * 8) * 2.2
        : 0;
      var finalX = data.finalX;
      var finalY = data.layout.y * height + drift;
      var count = data.isGhost ? ghostMeshes.length : realMeshes.length;
      var order = data.isGhost ? (data.ghostIndex || 0) : data.projectIndex;
      var t = order / Math.max(1, count - 1);
      var stackX = (t - 0.5) * Math.min(width * 0.12, 150);
      var stackY = Math.sin(t * Math.PI * 2) * height * 0.075;
      var waveX = (t - 0.5) * width * 0.86;
      var waveY = Math.sin(t * Math.PI * 2) * height * 0.17 + height * 0.22;
      var waveMix = opening.active ? opening.wave : 1;
      var landMix = opening.active ? opening.land : 1;
      var introX = stackX + (waveX - stackX) * waveMix;
      var introY = stackY + (waveY - stackY) * waveMix;
      mesh.position.x = introX + (finalX - introX) * landMix;
      mesh.position.y = introY + (finalY - introY) * landMix;

      var screenY = finalY + field.position.y;
      var focus = !opening.active && !data.isGhost && data.layout.role === "main"
        ? Math.max(0, 1 - Math.abs(screenY) / (height * 0.48))
        : 0;
      data.scrollFocus += (focus - data.scrollFocus) * 0.12;
      var focusScale = 1 + data.scrollFocus * 0.14;
      var introScale = 0.34 + opening.wave * 0.38 + opening.land * 0.28;
      var scale = data.hover * focusScale * (opening.active ? introScale : 1);
      mesh.scale.set(data.cardWidth * scale, data.cardHeight * scale, 1);
      mesh.material.uniforms.uRollover.value = Math.max(data.pointerFocus, data.scrollFocus);
      if (!data.isGhost && data.layout.role === "main") {
        mesh.material.uniforms.uWashed.value = Math.max(0, 0.34 * (1 - data.scrollFocus));
      }
      if (opening.active) mesh.material.uniforms.uOpacity.value = (data.isGhost ? 0.34 : 1) * opening.alpha;
    });

    if (selectedSection && !isEntering) {
      var fadeStart = selectedSection.offsetTop - height * 0.8;
      var fadeEnd = selectedSection.offsetTop - height * 0.2;
      var opacity = 1 - Math.max(0, Math.min(1, (smoothScroll - fadeStart) / (fadeEnd - fadeStart)));
      root.style.opacity = opacity.toFixed(3);
      if (opacity < 0.08) setHover(null);
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
  }

  function applyCategoryOpacity(category) {
    realMeshes.forEach(function (mesh) {
      var target = !category || mesh.userData.project.category === category ? 1 : 0.58;
      gsap.to(mesh.material.uniforms.uOpacity, { value: target, duration: 0.8, ease: "power2.out" });
    });
  }

  function highlightCategory(category) {
    keywordCategory = category;
    if (heroCategoryActive && !opening.active) applyCategoryOpacity(category);
  }

  function setOpeningProgress(values) {
    if (typeof values.wave === "number") opening.wave = values.wave;
    if (typeof values.land === "number") opening.land = values.land;
    if (typeof values.alpha === "number") opening.alpha = values.alpha;
  }

  function finishOpening() {
    opening.wave = 1;
    opening.land = 1;
    opening.alpha = 1;
    opening.active = false;
    applyCategoryOpacity(null);
  }

  resize();
  render();
  document.body.classList.add("scc-webgl-ready");
  if (status) status.hidden = true;

  window.SCCScene = {
    openProject: openProject,
    closeProject: closeProject,
    highlightCategory: highlightCategory,
    setOpeningProgress: setOpeningProgress,
    finishOpening: finishOpening,
    texturesReady: texturesReady,
    getLoadingProgress: function () { return loadingProgress; }
  };
})();
