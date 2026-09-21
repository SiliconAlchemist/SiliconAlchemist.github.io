import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadContent, renderMarkdown, checkUrl } from './content-loader.ts';

function fixture(t: { after: (fn: () => void) => void }) {
  const root = mkdtempSync(join(tmpdir(), 'portfolio-content-'));
  // Only this explicitly created temporary directory is removed.
  t.after(() => rmSync(root, { recursive: true, force: true }));
  // Fixed sample content: editorial changes must not change test expectations.
  cpSync(new URL('./fixtures/content/', import.meta.url), join(root, 'content'), {
    recursive: true,
  });
  mkdirSync(join(root, 'public/models'), { recursive: true });
  mkdirSync(join(root, 'public/projects/solid-textures'), {
    recursive: true,
  });
  mkdirSync(join(root, 'public/projects/stable-learned-bloom-filters'), {
    recursive: true,
  });
  mkdirSync(join(root, 'public/projects/seeing-through-latency'), {
    recursive: true,
  });
  writeFileSync(
    join(root, 'public/favicon.svg'),
    '<svg xmlns="http://www.w3.org/2000/svg"/>',
  );
  writeFileSync(join(root, 'public/resume.pdf'), 'fixture');
  writeFileSync(join(root, 'public/models/pond-island.glb'), 'fixture');
  writeFileSync(
    join(root, 'public/projects/solid-textures/cover.png'),
    'fixture',
  );
  writeFileSync(
    join(root, 'public/projects/solid-textures/solid-texture-generation.pdf'),
    'fixture',
  );
  writeFileSync(
    join(root, 'public/projects/stable-learned-bloom-filters/cover.png'),
    'fixture',
  );
  writeFileSync(
    join(root, 'public/projects/seeing-through-latency/cover.png'),
    'fixture',
  );
  writeFileSync(
    join(
      root,
      'public/projects/stable-learned-bloom-filters/stable-learned-bloom-filters.pdf',
    ),
    'fixture',
  );
  return root;
}

test('shows shared projects in both collections with one story', (t) => {
  const content = loadContent(fixture(t));
  assert.deepEqual(
    Object.values(content.collections).map((c) => c.projects.length),
    [3, 2, 3],
  );
  const kalakriti = content.collections.design.projects[0];
  assert.equal(kalakriti.id, 'kalakriti');
  assert.strictEqual(
    content.collections.dev.projects.find((p) => p.id === 'kalakriti'),
    kalakriti,
  );
  assert.ok(
    content.collections.data.projects.some(
      (p) => p.id === 'seeing-through-latency',
    ),
  );
  assert.ok(
    content.collections.dev.projects.some((p) => p.id === 'precise-orbits'),
  );
  assert.ok(
    content.collections.data.projects.some(
      (p) => p.id === 'stable-learned-bloom-filters',
    ),
  );
  assert.ok(
    content.collections.dev.projects.some(
      (p) => p.id === 'stable-learned-bloom-filters',
    ),
  );
  assert.equal(
    kalakriti.links[0].url,
    'https://github.com/SiliconAlchemist/Kalakriti',
  );
  assert.match(kalakriti.bodyHtml, /Traditional painting in a 3D environment/);
  assert.equal(
    content.site.metadata.title,
    'Shrikant Garg — Three worlds. One mind.',
  );
});

test('discovers added projects, excludes drafts, sorts, moves, renames and removes', (t) => {
  const root = fixture(t);
  const file = join(root, 'content/projects/new-project.md');
  const template = readFileSync(
    join(root, 'content/projects/_template.md'),
    'utf8',
  );
  writeFileSync(file, template);
  assert.equal(loadContent(root).collections.design.projects.length, 2);
  assert.doesNotMatch(JSON.stringify(loadContent(root)), /Your project title/);
  const published = template
    .replace('draft: true', 'draft: false')
    .replace('order: 10', 'order: 0');
  writeFileSync(file, published);
  assert.equal(
    loadContent(root).collections.design.projects[0].id,
    'new-project',
  );
  writeFileSync(
    file,
    published.replace('collection: design', 'collection: dev'),
  );
  assert.equal(loadContent(root).collections.dev.projects[0].id, 'new-project');
  const renamed = join(root, 'content/projects/renamed-project.md');
  renameSync(file, renamed);
  assert.equal(
    loadContent(root).collections.dev.projects[0].id,
    'renamed-project',
  );
  unlinkSync(renamed);
  assert.equal(loadContent(root).collections.dev.projects.length, 3);
});

test('drafting an existing shared project hides it from both collections', (t) => {
  const root = fixture(t);
  const file = join(root, 'content/projects/precise-orbits.md');
  const original = readFileSync(file, 'utf8');
  const before = loadContent(root);
  writeFileSync(file, original.replace('draft: false', 'draft: true'));
  const drafted = loadContent(root);
  for (const collection of ['dev', 'data'] as const) {
    assert.deepEqual(
      drafted.collections[collection].projects.map((project) => project.id),
      before.collections[collection].projects
        .filter((project) => project.id !== 'precise-orbits')
        .map((project) => project.id),
    );
  }
  assert.doesNotMatch(JSON.stringify(drafted), /Shared orbit sample story/);
  assert.deepEqual(drafted.collections.design, before.collections.design);
  writeFileSync(file, original);
  assert.deepEqual(loadContent(root), before);
});

test('accepts multiple resource links and cover images; flags missing assets by filename', (t) => {
  const root = fixture(t);
  const file = join(root, 'content/projects/kalakriti.md');
  const original = readFileSync(file, 'utf8');
  writeFileSync(
    file,
    original.replace(
      /^links:[\s\S]*?(?=\r?\n---)/m,
      `cover:\n  src: /favicon.svg\n  alt: A sample illustration\nlinks:\n  - label: PDF\n    url: /resume.pdf\n  - label: Behance\n    url: https://www.behance.net/shrikant_garg\n  - label: GitHub\n    url: https://github.com/SiliconAlchemist/Kalakriti`,
    ),
  );
  const project = loadContent(root).collections.design.projects[0];
  assert.equal(project.links.length, 3);
  assert.equal(project.cover?.fit, 'cover');
  unlinkSync(join(root, 'public/resume.pdf'));
  assert.throws(
    () => loadContent(root),
    /content\/site.yaml.*Missing file: public\/resume.pdf/,
  );
});

test('reports malformed YAML, mistyped fields, and invalid collections', (t) => {
  const root = fixture(t);
  const file = join(root, 'content/projects/kalakriti.md');
  const original = readFileSync(file, 'utf8');
  writeFileSync(
    file,
    original.replace(/^collection:.*$/m, 'collection: unknown'),
  );
  assert.throws(() => loadContent(root), /kalakriti.md:[\s\S]*collection/);
  writeFileSync(
    file,
    original.replace('secondaryCollection: dev', 'secondaryCollection: design'),
  );
  assert.throws(
    () => loadContent(root),
    /secondaryCollection: Choose a different collection/,
  );
  writeFileSync(file, original.replace('summary:', 'summry:'));
  assert.throws(() => loadContent(root), /kalakriti.md:[\s\S]*summry/);
  writeFileSync(file, original.replace('title:', 'title: [\ntitle:'));
  assert.throws(() => loadContent(root), /kalakriti.md:/);
});

test('renders rich Markdown, sanitizes HTML and rejects unsafe or broken references', (t) => {
  const root = fixture(t);
  const html = renderMarkdown(
    '## Story\n\n**Bold** and `code`.\n\n![Drawing](/favicon.svg)\n\n[PDF](/resume.pdf)\n\n<script>alert(1)</script>\n\n<img src="/favicon.svg" alt="Drawing" onerror="alert(1)">',
    root,
    'sample.md',
  );
  assert.match(html, /<h2>Story<\/h2>/);
  assert.match(html, /<strong>Bold<\/strong>/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /script|onerror|alert/);
  assert.throws(
    () => renderMarkdown('![](/favicon.svg)', root, 'sample.md'),
    /alt text/,
  );
  assert.throws(
    () => renderMarkdown('[Bad](javascript:alert)', root, 'sample.md'),
    /Unsupported URL/,
  );
  assert.throws(
    () => renderMarkdown('![Missing](/absent.png)', root, 'sample.md'),
    /Missing file/,
  );
  for (const url of [
    '/../package.json',
    '/%2e%2e/package.json',
    '//evil.test/file',
    'file:///C:/private.pdf',
    'javascript:alert(1)',
  ]) {
    assert.throws(() => checkUrl(url, root, 'test'));
  }
});
