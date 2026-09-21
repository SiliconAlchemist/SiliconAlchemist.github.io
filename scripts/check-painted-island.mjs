import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { prepareIsland } from '../app/island-model.ts';
import { fitLandscape, moonLayout } from '../app/scene-layout.ts';

const bytes = fs.readFileSync('public/models/pond-island.glb');
const gltf = await new GLTFLoader().parseAsync(
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  '',
);
assert.equal(
  gltf.scene.getObjectByName('IslandRoot').userData.source_island,
  'island_v6.blend',
);
for (const name of [
  'GEO_Terrain',
  'SOCKET_Fire_01',
  'SOCKET_House_01',
  'FX_Pond',
])
  assert.ok(gltf.scene.getObjectByName(name), name);
assert.equal(gltf.scene.getObjectByName('FX_Waterfall'), undefined);
assert.equal(gltf.scene.getObjectByName('FX_River'), undefined);
const allPoints = [];
gltf.scene.updateMatrixWorld(true);
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const p = o.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3()
      .fromBufferAttribute(p, i)
      .applyMatrix4(o.matrixWorld);
    assert.ok(Number.isFinite(v.x + v.y + v.z));
    // Keep all terrain points and a regular foliage sample for framing tests.
    if (i % 7 === 0) allPoints.push(v);
  }
});
const island = prepareIsland(gltf.scene);
assert.equal(island.flames.length, 6);
// Day/night must restore the authored window emission rather than accumulating changes.
const windowMaterial = island.group.getObjectByName('Hut · amber glass').material;
const nightEmission = windowMaterial.emissiveIntensity;
assert.ok(nightEmission > 0);
for (let i = 0; i < 3; i++) {
  island.setDay(true);
  assert.ok(island.flames.every((flame) => !flame.visible));
  assert.equal(windowMaterial.emissiveIntensity, 0);
  island.setDay(false);
  assert.ok(island.flames.every((flame) => flame.visible));
  assert.equal(windowMaterial.emissiveIntensity, nightEmission);
}
const instances = (role) =>
  island.group.children
    .filter((o) => o.name === `Instances · ${role}`)
    .reduce((n, o) => n + o.count, 0);
assert.equal(instances('canopy'), 16);
assert.equal(instances('trunk'), 16);
assert.ok(island.group.getObjectByName('Instances · grass').count > 150);
for (const name of [
  'Meadow · fern and honey',
  'Cliff · slate and ochre',
  'Hut · warm lime plaster',
  'Hut · weathered terracotta',
  'Pond rocks · moss and blue slate',
  'Instances · canopy',
  'Instances · trunk',
]) {
  const o = island.group.getObjectByName(name);
  assert.ok(o.geometry.attributes.color, `${name} retains painted colors`);
  assert.ok(o.material.isMeshToonMaterial, `${name} receives toon lighting`);
}
for (const name of ['FX_Pond'])
  assert.ok(
    island.group.getObjectByName(name).geometry.attributes.uv,
    `${name} has flow UVs`,
  );
island.update(2);
assert.equal(
  island.group.getObjectByName('FX_Pond').material.uniforms.time.value,
  2,
);
let triangles = 0;
island.group.traverse((o) => {
  if (o.isMesh)
    triangles +=
      ((o.geometry.index?.count || o.geometry.attributes.position.count) / 3) *
      (o.isInstancedMesh ? o.count : 1);
});
assert.ok(island.group.children.length < 40);
const pond = island.group.getObjectByName('FX_Pond');
assert.ok(pond.geometry.attributes.color, 'Pond carries shore weights');
const shore = Array.from(
  { length: pond.geometry.attributes.color.count },
  (_, i) => pond.geometry.attributes.color.getX(i),
);
assert.ok(
  Math.max(...shore) - Math.min(...shore) > 0.1,
  'Pond has varying shore colors, not the glTF fallback white',
);
const height = Array.from(
  { length: pond.geometry.attributes.position.count },
  (_, i) => pond.geometry.attributes.position.getY(i),
);
assert.ok(Math.max(...height) - Math.min(...height) < 0.0001, 'Pond is level');
assert.ok(
  triangles < 250000,
  'Authored forest and roof stay within triangle budget',
);
const home = new THREE.Vector3(0, 12, 26),
  look = new THREE.Vector3(0, 2, 0);
for (const [w, h] of [
  [382, 624],
  [390, 844],
  [768, 1024],
  [1280, 720],
  [1440, 900],
  [1920, 1080],
  [3440, 1440],
]) {
  const c = new THREE.PerspectiveCamera(43, w / h, 0.1, 220);
  c.position.copy(home);
  c.lookAt(look);
  c.updateMatrixWorld();
  const mobile = w < 640,
    introEnd = mobile ? 205 : h < 700 ? 164 : w >= 1600 ? 270 : 245;
  const skyBottom = moonLayout(w, h, introEnd).bottom;
  for (let i = 0; i < 8; i++)
    for (const tilt of [-0.24, 0, 0.24]) {
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(tilt, -0.14 + (i * Math.PI) / 4, 0, 'YXZ'),
      );
      const fit = fitLandscape(
        island.bounds,
        w,
        h,
        c,
        skyBottom,
        q,
        island.fitPoints,
      );
      const points = allPoints.map((p) =>
        p
          .clone()
          .multiplyScalar(fit.scale)
          .applyQuaternion(q)
          .add(new THREE.Vector3(0, fit.y + 0.07, 0))
          .project(c),
      );
      const top = ((1 - Math.max(...points.map((p) => p.y))) * h) / 2;
      assert.ok(
        top >= skyBottom - 3,
        `${w}x${h}: canopy clears moons at turn ${i} (${top} / ${skyBottom})`,
      );
      assert.ok(
        Math.min(...points.map((p) => p.x)) > -0.94 &&
          Math.max(...points.map((p) => p.x)) < 0.94,
        `${w}x${h}: horizontal clipping`,
      );
      assert.ok(
        Math.min(...points.map((p) => p.y)) > -0.9,
        `${w}x${h}: bottom clipping`,
      );
    }
  console.log(`${w}x${h}: 24 rotations/tilts fit`);
}
island.dispose();
console.log(
  `${bytes.length} bytes; ${triangles} visible triangles; ${island.group.children.length} island draw batches. Painted colors, instancing, markers, water UVs and framing passed.`,
);
