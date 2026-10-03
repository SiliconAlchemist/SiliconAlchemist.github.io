import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const output = join(process.cwd(), 'dist', 'client');
// Vinext exports /story as story.html. Supply a directory index so GitHub Pages
// serves the shareable /story/ URL without requiring a server redirect.
assert.ok(existsSync(join(output, 'story.html')), 'Missing story page');
mkdirSync(join(output, 'story'), { recursive: true });
copyFileSync(join(output, 'story.html'), join(output, 'story', 'index.html'));

for (const file of [
  'index.html',
  'story/index.html',
  '404.html',
  'favicon.svg',
  'resume.pdf',
  '_headers',
  'models/pond-island.glb',
]) {
  const path = join(output, file);
  assert.ok(existsSync(path) && statSync(path).isFile(), `Missing ${file}`);
}

for (const file of ['models/painted-island.glb', 'models/landscape.glb']) {
  assert.ok(!existsSync(join(output, file)), `Legacy asset shipped: ${file}`);
}

const html = readFileSync(join(output, 'index.html'), 'utf8');
assert.match(html, /_next\/static\//, 'Missing framework assets');
assert.match(html, /Dev|Development/, 'Missing portfolio navigation');
assert.ok(!existsSync(join(output, 'server')), 'Server code entered static output');

console.log('Static portfolio output verified.');
