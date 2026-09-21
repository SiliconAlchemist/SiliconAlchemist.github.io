import * as THREE from 'three';

export function moonLayout(
  width: number,
  height: number,
  introBottom: number,
  labelHeight = 62,
) {
  const mobile = width < 640;
  const middleRadius = mobile ? 35 : Math.min(height * 0.062, 62);
  const sideRadius = mobile ? 29 : Math.min(height * 0.058, 54);
  const middleY = Math.max(height * 0.29, introBottom + middleRadius + 18);
  const sideY = middleY + (mobile ? 24 : height * 0.045);
  const spread = mobile ? 0.59 : 0.45;
  const moons = [
    { x: -spread, y: sideY, radius: sideRadius },
    { x: 0, y: middleY, radius: middleRadius },
    { x: spread, y: sideY, radius: sideRadius },
  ];
  return {
    moons,
    bottom: Math.max(...moons.map((m) => m.y + m.radius)) + labelHeight + 14,
  };
}

// Fit the full landscape beneath the moons, including at ultrawide aspect ratios.
export function fitLandscape(
  bounds: THREE.Box3,
  width: number,
  height: number,
  camera: THREE.PerspectiveCamera,
  skyBottom: number,
  rotation = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 1, 0),
    -0.14,
  ),
  silhouette?: THREE.Vector3[],
) {
  const top = 1 - (2 * skyBottom) / height,
    bottom = width < 640 ? 1 - (2 * (height - 122)) / height : -0.85,
    center = (top + bottom) / 2;
  const corners: THREE.Vector3[] = silhouette || [];
  if (!silhouette)
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z])
          corners.push(new THREE.Vector3(x, y, z));
  let scale = silhouette ? 2 : Math.min(1.13, width / 1200),
    offsetY = -3.35;
  const measure = () => {
    const projected = corners.map((c) =>
      c
        .clone()
        .multiplyScalar(scale)
        .applyQuaternion(rotation)
        .add(new THREE.Vector3(0, offsetY, 0))
        .project(camera),
    );
    return {
      left: Math.min(...projected.map((p) => p.x)),
      right: Math.max(...projected.map((p) => p.x)),
      top: Math.max(...projected.map((p) => p.y)),
      bottom: Math.min(...projected.map((p) => p.y)),
    };
  };
  // Recenter and shrink conservatively, leaving room for the island's gentle float.
  for (let i = 0; i < (silhouette ? 24 : 12); i++) {
    let b = measure();
    const depth = camera.position.distanceTo(new THREE.Vector3(0, offsetY, 0));
    offsetY +=
      (center - (b.top + b.bottom) / 2) *
      depth *
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    b = measure();
    const ratio = Math.min(
      silhouette ? 1.12 : 1,
      (top - bottom - 0.025) / (b.top - b.bottom),
      silhouette
        ? 0.87 / Math.max(Math.abs(b.left), Math.abs(b.right))
        : 1.78 / (b.right - b.left),
    );
    scale *= ratio;
  }
  return { scale, y: offsetY };
}
