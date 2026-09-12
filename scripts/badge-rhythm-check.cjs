/* Fast deterministic checks: physical navigation and progress are NOT eased. */
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const context = { window: {} };
vm.createContext(context);
for (const name of ['scrollcarousel-data.js', 'badge-scene-config.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', name), 'utf8'), context);
const B = context.window.BadgeScene;
const curve = B.presentationTravel;
const close = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const slope = x => (curve(x + 1e-5) - curve(x - 1e-5)) / 2e-5;
let previous = curve(-2);
for (let t = -1.999; t <= B.duration + 1; t += .001) {
  const next = curve(t);
  assert.ok(Number.isFinite(next) && next > previous, 'strictly monotone: no snap, reversal, overshoot or dead scroll');
  close(B.sample(t).travel, t);
  close(B.sample(t).motionTravel, next);
  previous = next;
}
for (const g of B.groups) {
  close(curve(g.start), g.start);
  close(curve(g.center), g.center);
  close(curve(g.end), g.end);
  const transform = t => B.chapterTransform(g, B.sample(t));
  close(transform(g.start - .25).scale, .84);
  close(transform(g.center - .1).scale, 1);
  close(transform(g.center + .1).scale, 1);
  close(transform(g.end + .22).scale, 1.12);
  let lastScale = 0;
  for (let t = g.start - .3; t <= g.end + .3; t += .01) {
    const scale = transform(t).scale;
    assert.ok(scale >= lastScale && scale >= .84 && scale <= 1.12, 'chapter scale cannot jump backward or overshoot');
    lastScale = scale;
  }
  assert.ok(slope(g.center) > .1 && slope(g.center) < .2);
  assert.ok(slope(g.start) > 1.8 && slope(g.start) < 2);
  assert.ok((curve(g.center + .1) - curve(g.center - .1)) * .7 * 1000 < 30, '200px physical scroll only lightly drifts the overview');
  for (const knot of [g.start, g.center, g.end]) close(slope(knot - .0001), slope(knot + .0001), .002);
}
close(curve(B.duration), B.duration);
close(slope(B.duration), 1, .0001);
assert.ok(B.easeOut(0, 1, .25) > .5, 'hero push starts decisively, then settles');
close(B.easeOut(0, 1, 0), 0);
close(B.easeOut(0, 1, 1), 1);
console.log('PASS monotone rhythm, smooth joins, reading beats, unchanged navigation endpoints, physical progress, collective chapter zoom and hero ease-out');
