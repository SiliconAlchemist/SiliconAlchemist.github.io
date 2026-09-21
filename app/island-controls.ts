/** Mouse, touch and keyboard controls share one bounded view state. */
export function createIslandControls(
  canvas: HTMLCanvasElement,
  options: {
    enabled: () => boolean;
    onZoom: (percent: number) => void;
    blurTarget?: EventTarget;
  },
) {
  const view = { yaw: -0.14, pitch: 0, zoom: 1 };
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchDistance = 0,
    pinchZoom = 1;
  const blurTarget = options.blurTarget ?? window;
  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));
  const setZoom = (value: number) => {
    view.zoom = clamp(value, 0.65, 2.5);
    options.onZoom(Math.round(view.zoom * 100));
  };
  const zoomBy = (direction: number) => {
    if (options.enabled()) setZoom(view.zoom * (direction > 0 ? 1.2 : 1 / 1.2));
  };
  const reset = () => {
    view.yaw = -0.14;
    view.pitch = 0;
    setZoom(1);
  };
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const cancel = () => {
    const ids = [...pointers.keys()];
    pointers.clear();
    pinchDistance = 0;
    ids.forEach((id) => {
      if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    });
    canvas.classList.remove('is-dragging');
  };
  const down = (e: PointerEvent) => {
    if (!options.enabled() || e.button !== 0 || pointers.size >= 2) return;
    e.preventDefault();
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('is-dragging');
    canvas.focus({ preventScroll: true });
    if (pointers.size === 2) {
      pinchDistance = distance();
      pinchZoom = view.zoom;
    }
  };
  const move = (e: PointerEvent) => {
    const previous = pointers.get(e.pointerId);
    if (!previous) return;
    if (!options.enabled()) {
      cancel();
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      if (pinchDistance > 0) setZoom((pinchZoom * distance()) / pinchDistance);
      return;
    }
    view.yaw +=
      ((e.clientX - previous.x) * Math.PI * 2) /
      Math.max(canvas.clientWidth, 600);
    view.pitch = clamp(
      view.pitch + (e.clientY - previous.y) * 0.003,
      -0.24,
      0.24,
    );
  };
  const up = (e: PointerEvent) => {
    if (!pointers.delete(e.pointerId)) return;
    if (canvas.hasPointerCapture(e.pointerId))
      canvas.releasePointerCapture(e.pointerId);
    pinchDistance = 0;
    if (!pointers.size) canvas.classList.remove('is-dragging');
  };
  const wheel = (e: WheelEvent) => {
    if (!options.enabled()) return;
    e.preventDefault();
    const delta =
      e.deltaY *
      (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1);
    setZoom(view.zoom * Math.exp(-clamp(delta, -400, 400) * 0.0015));
  };
  const key = (e: KeyboardEvent) => {
    if (!options.enabled()) return;
    const step = e.shiftKey ? 0.25 : 0.12;
    if (e.key === 'ArrowLeft') view.yaw -= step;
    else if (e.key === 'ArrowRight') view.yaw += step;
    else if (e.key === 'ArrowUp')
      view.pitch = clamp(view.pitch - 0.06, -0.24, 0.24);
    else if (e.key === 'ArrowDown')
      view.pitch = clamp(view.pitch + 0.06, -0.24, 0.24);
    else if (e.key === '+' || e.key === '=') zoomBy(1);
    else if (e.key === '-' || e.key === '_') zoomBy(-1);
    else if (e.key === 'Home' || e.key === '0') reset();
    else return;
    e.preventDefault();
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);
  canvas.addEventListener('wheel', wheel, { passive: false });
  canvas.addEventListener('keydown', key);
  blurTarget.addEventListener('blur', cancel);
  return {
    view,
    reset,
    zoomBy,
    cancel,
    dispose() {
      cancel();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('lostpointercapture', up);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('keydown', key);
      blurTarget.removeEventListener('blur', cancel);
    },
  };
}
