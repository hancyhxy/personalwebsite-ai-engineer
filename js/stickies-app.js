document.addEventListener('DOMContentLoaded', async () => {
    /* Fetch gallery.json once here so the boot overlay can list real project
       names in its action log while the wall renders the same data behind
       the scenes. Both still handle their own internal sort/selection. */
    let projects = [];
    try {
        const res = await fetch('./content/gallery.json');
        if (res.ok) projects = await res.json();
    } catch (err) {
        console.warn('stickies-app: gallery.json fetch failed', err);
    }

    /* Kick off the wall build in the background (hidden behind .stk-app
       opacity: 0 during booting) and play the boot sequence in parallel. */
    const wall = new StickyWall('#stk-hero', '#stk-bridge', '#stk-acts', '#stk-panel');
    wall.init();

    const boot = new StickyBoot(document.getElementById('stk-boot'), projects);
    boot.start();
});
