/* Add non-destructive browser migration to legacy cases. Stable indices are validated. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const data = vm.runInNewContext(fs.readFileSync(path.join(root, 'js/scrollcarousel-data.js'), 'utf8') + '\nSCROLLCAROUSEL_PROJECTS');
const gallery = JSON.parse(fs.readFileSync(path.join(root, 'content/gallery.json'), 'utf8'));
assert.equal(data.length, gallery.length);
const updates = [];
for (const [index, project] of data.entries()) {
  const legacy = project.url.replace(/^\.\//, '');
  const entry = gallery.find(p => p.projectUrl === legacy);
  assert.ok(entry, legacy);
  assert.equal(entry.publicUrl, `project-scrollcarousel.html?project=${index}`, `Stable case identity: ${legacy}`);
  const file = path.join(root, legacy);
  const original = fs.readFileSync(file, 'utf8');
  const block = `<!-- CURRENT CASE ROUTE START -->\n<link rel="canonical" href="https://xyhan.com/${entry.publicUrl}">\n<link rel="alternate" type="text/markdown" href="https://xyhan.com/content/projects/${legacy.split('/')[1]}/text.md" title="Case study text">\n<script src="../../js/gallery-current-route.js" data-project-index="${index}"></script>\n<!-- CURRENT CASE ROUTE END -->`;
  let source = original;
  if (source.includes('<!-- CURRENT CASE ROUTE START -->')) {
    source = source.replace(/<!-- CURRENT CASE ROUTE START -->[\s\S]*?<!-- CURRENT CASE ROUTE END -->/, block);
  } else {
    // Retire any previous immediate redirects so query parameters survive consistently.
    source = source.replace(/\s*<meta http-equiv="refresh"[^>]*>/gi, '')
      .replace(/\s*<link rel="canonical"[^>]*>/gi, '')
      .replace(/\s*<script>location\.replace\([^<]*<\/script>/g, '');
    assert.ok(source.includes('</title>'));
    source = source.replace('</title>', '</title>\n' + block);
  }
  updates.push([file, source]);
}
// Validate every mapping before touching any page. Existing case bodies/assets remain intact.
for (const [file, source] of updates) fs.writeFileSync(file, source);
console.log(`Built ${updates.length} legacy-to-current case routes; stable IDs and case bodies preserved.`);
