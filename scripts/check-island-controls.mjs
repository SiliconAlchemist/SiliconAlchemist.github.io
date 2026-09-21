import assert from 'node:assert/strict';
import { createIslandControls } from '../app/island-controls.ts';

class Canvas extends EventTarget {
  clientWidth = 1000;
  clientHeight = 800;
  captured = new Set();
  classList = { add() {}, remove() {} };
  focus() {}
  setPointerCapture(id) {
    this.captured.add(id);
  }
  hasPointerCapture(id) {
    return this.captured.has(id);
  }
  releasePointerCapture(id) {
    this.captured.delete(id);
  }
}
const canvas = new Canvas(),
  blurTarget = new EventTarget();
let enabled = true,
  percent = 100;
const controls = createIslandControls(canvas, {
  enabled: () => enabled,
  onZoom: (value) => (percent = value),
  blurTarget,
});
function emit(type, fields = {}) {
  const event = Object.assign(new Event(type, { cancelable: true }), fields);
  canvas.dispatchEvent(event);
  return event;
}
const pointer = (type, id, x, y = 100) =>
  emit(type, { pointerId: id, button: 0, clientX: x, clientY: y });
controls.zoomBy(1);
assert.equal(percent, 120);
for (let i = 0; i < 20; i++) controls.zoomBy(1);
assert.equal(percent, 250);
for (let i = 0; i < 20; i++) controls.zoomBy(-1);
assert.equal(percent, 65);
controls.reset();
assert(emit('wheel', { deltaY: -100, deltaMode: 0 }).defaultPrevented);
assert(controls.view.zoom > 1);
controls.reset();
pointer('pointerdown', 1, 100);
pointer('pointerdown', 2, 200);
pointer('pointermove', 2, 300);
assert.equal(percent, 200);
assert.equal(controls.view.yaw, -0.14, 'pinching must not rotate');
pointer('pointerup', 2, 300);
pointer('pointermove', 1, 120);
assert(controls.view.yaw > -0.14, 'one-finger rotation resumes after pinch');
blurTarget.dispatchEvent(new Event('blur'));
assert.equal(canvas.captured.size, 0);
emit('keydown', { key: 'Home' });
assert.equal(percent, 100);
assert.equal(controls.view.yaw, -0.14);
emit('keydown', { key: '+' });
assert.equal(percent, 120);
enabled = false;
assert(!emit('wheel', { deltaY: -100, deltaMode: 0 }).defaultPrevented);
controls.zoomBy(1);
assert.equal(percent, 120, 'collection navigation disables landscape zoom');
enabled = true;
controls.dispose();
emit('wheel', { deltaY: -100, deltaMode: 0 });
assert.equal(percent, 120, 'disposed controls detach listeners');
console.log(
  'PASS: zoom bounds, wheel, pinch, resumed rotation, reset, collection lock and cleanup.',
);
