import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';

/** The authored palettes are carried by COLOR_0, not Blender-only shader nodes. */
export function prepareIsland(source: THREE.Group) {
  source.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(source);
  const samples: THREE.Vector3[] = [];
  source.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const positions = o.geometry.getAttribute('position');
    const step = Math.max(1, Math.floor(positions.count / 1500));
    for (let i = 0; i < positions.count; i += step)
      samples.push(
        new THREE.Vector3()
          .fromBufferAttribute(positions, i)
          .applyMatrix4(o.matrixWorld),
      );
  });
  // A small hull follows the actual silhouette, avoiding the empty upper
  // corners of a bounding box that made the island unnecessarily tiny.
  const hull = new ConvexHull().setFromPoints(samples);
  const points = new Set<THREE.Vector3>();
  for (const face of hull.faces) {
    let edge = face.edge;
    do {
      points.add(edge.head().point);
      edge = edge.next;
    } while (edge !== face.edge);
  }
  const fitCenter = bounds.getCenter(new THREE.Vector3());
  // Leave breathing room for the animated leaf tips and subpixel camera sway.
  const fitPoints = [...points].map((p) =>
    p.clone().sub(fitCenter).multiplyScalar(1.025).add(fitCenter),
  );
  const group = new THREE.Group();
  group.name = 'Painted island';
  const fire = new THREE.Vector3();
  const house = new THREE.Vector3();
  source.getObjectByName('SOCKET_Fire_01')?.getWorldPosition(fire);
  source.getObjectByName('SOCKET_House_01')?.getWorldPosition(house);
  const flames: THREE.Mesh[] = [];
  const windowPositions: THREE.Vector3[] = [];
  const originals = new Set<THREE.BufferGeometry>();
  const oldMaterials = new Set<THREE.Material>();
  const windTime = { value: 0 };
  const waterTime = { value: 0 };
  const daylight = { value: 0 };
  const batches = new Map<
    string,
    { meshes: THREE.Mesh[]; material: THREE.Material; role: string }
  >();
  const staticBatches = new Map<
    string,
    { geometries: THREE.BufferGeometry[]; material: THREE.Material }
  >();

  const gradient = new THREE.DataTexture(
    new Uint8Array([75, 142, 218, 255]),
    4,
    1,
    THREE.RedFormat,
  );
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  const paintedMaterials = new Map<string, THREE.Material>();
  function painted(original: THREE.MeshStandardMaterial, role: string) {
    const key = `${original.uuid}/${role}`;
    if (paintedMaterials.has(key)) return paintedMaterials.get(key)!;
    const mat = new THREE.MeshToonMaterial({
      color: original.color.clone().multiplyScalar(0.85),
      vertexColors: original.vertexColors,
      gradientMap: gradient,
      side: original.side,
    });
    mat.name = original.name;
    mat.userData = { ...original.userData };
    // A cool painted shadow floor keeps the underside slate-colored, rather
    // than letting hard cast shadows read as black holes in the silhouette.
    if (original.name.startsWith('Cliff')) {
      mat.emissive.setRGB(0.026, 0.034, 0.052);
      mat.emissiveIntensity = 0.7;
    }
    // Bending is anchored at the base. One uniform animates all instances;
    // each tree's position supplies its own phase without per-frame matrices.
    if (role === 'canopy' || role === 'grass') {
      const amount = role === 'canopy' ? '.028' : '.085';
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.windTime = windTime;
        shader.vertexShader = `uniform float windTime;\n${shader.vertexShader}`;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          float phase = 0.0;
          #ifdef USE_INSTANCING
            phase = instanceMatrix[3].x * .7 + instanceMatrix[3].z * .4;
          #endif
          float bend = max(position.y ${role === 'canopy' ? '+ 2.0' : ''}, 0.0);
          transformed.x += sin(windTime * 1.1 + phase + position.y * 1.7) * bend * ${amount};
          transformed.z += cos(windTime * .8 + phase + position.x) * bend * ${amount} * .45;
        `,
        );
      };
      mat.customProgramCacheKey = () => `painted-wind-${role}`;
    }
    paintedMaterials.set(key, mat);
    return mat;
  }

  function water() {
    return new THREE.ShaderMaterial({
      name: 'Pond · still jade and painted reflections',
      uniforms: { time: waterTime, daylight },
      vertexColors: true,
      side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; varying float vShore;
        void main() { vUv = uv; vShore = clamp((color.r-.025)/.135,0.,1.); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float time; uniform float daylight; varying vec2 vUv; varying float vShore;
        float ring(vec2 p, vec2 origin, float offset) {
          float d = length((p-origin)*vec2(1.,.88));
          float wave = fract(d*6. - time*.10 + offset);
          return (1.-smoothstep(.013,.032,abs(wave-.5))) * (1.-smoothstep(.12,.55,d));
        }
        void main() {
          vec2 p = vUv;
          p.x += sin(p.y*28.+time*.7)*.006;
          float shallow = smoothstep(.60,1.,vShore);
          vec3 pigment = mix(vec3(.025,.14,.17),vec3(.16,.39,.27),shallow);
          // Broad, broken sky reflection shapes; no moving river stripes.
          float sky = sin(p.x*9.+sin(p.y*12.)*.7)+cos(p.y*13.-p.x*4.);
          pigment = mix(pigment,vec3(.24,.44,.43),smoothstep(.72,.88,sky)*.52*(1.-shallow*.7));
          float reflection = smoothstep(.9,.96,sin(p.y*86.+sin(p.x*22.)*2.));
          pigment += vec3(.06,.10,.085)*reflection*smoothstep(.2,.8,sky)*(1.-shallow);
          float rings = max(ring(p,vec2(.38,.48),.0),ring(p,vec2(.66,.63),.37));
          pigment += vec3(.18,.28,.24)*rings*(1.-smoothstep(.83,.98,vShore));
          float rim = smoothstep(.973,.992,vShore);
          pigment = mix(pigment,vec3(.34,.51,.36),rim*.65);
          pigment = mix(pigment, pigment * 1.45 + vec3(.015,.055,.06), daylight);
          gl_FragColor = vec4(pigment,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
  }

  source.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    originals.add(object.geometry);
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    materials.forEach((m) => oldMaterials.add(m));
    // Blender's exporter emits separate primitives for material slots.
    if (Array.isArray(object.material))
      throw new Error('Expected glTF material primitives');
    const original = object.material as THREE.MeshStandardMaterial;
    if (original.name === 'Hut · amber glass') {
      object.geometry.computeBoundingBox();
      const center = object.geometry
        .boundingBox!.getCenter(new THREE.Vector3())
        .applyMatrix4(object.matrixWorld);
      const normals = object.geometry.getAttribute('normal');
      const normal = new THREE.Vector3()
        .fromBufferAttribute(normals, 0)
        .applyNormalMatrix(
          new THREE.Matrix3().getNormalMatrix(object.matrixWorld),
        );
      windowPositions.push(center.addScaledVector(normal, 0.1));
    }
    const role = String(object.userData.role || '');
    const material = original.userData.painted
      ? painted(original, role)
      : original;
    if (object.userData.effect === 'pond') {
      const mesh = new THREE.Mesh(
        object.geometry.clone().applyMatrix4(object.matrixWorld),
        water(),
      );
      mesh.name = object.name;
      group.add(mesh);
      return;
    }
    if (object.name.startsWith('Flame')) {
      const geometry = object.geometry.clone().applyMatrix4(object.matrixWorld);
      geometry.computeBoundingBox();
      const center = geometry.boundingBox!.getCenter(new THREE.Vector3());
      geometry.translate(-center.x, -center.y, -center.z);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = object.name;
      mesh.position.copy(center);
      group.add(mesh);
      flames.push(mesh);
      return;
    }
    if (role === 'canopy' || role === 'trunk' || role === 'grass') {
      const key = `${object.geometry.uuid}/${material.uuid}`;
      const batch = batches.get(key) || { meshes: [], material, role };
      batch.meshes.push(object);
      batches.set(key, batch);
      return;
    }
    const geometry = object.geometry
      .clone()
      .applyMatrix4(object.matrixWorld)
      .toNonIndexed();
    // Preserve every exported attribute, including vertex color and UVs.
    const signature = Object.keys(geometry.attributes)
      .sort()
      .map((k) => `${k}:${geometry.attributes[k].itemSize}`)
      .join(',');
    const key = `${material.uuid}/${signature}`;
    const batch = staticBatches.get(key) || { geometries: [], material };
    batch.geometries.push(geometry);
    staticBatches.set(key, batch);
  });
  batches.forEach(({ meshes, material, role }) => {
    const mesh = new THREE.InstancedMesh(
      meshes[0].geometry.clone(),
      material,
      meshes.length,
    );
    mesh.name = `Instances · ${role}`;
    meshes.forEach((o, i) => mesh.setMatrixAt(i, o.matrixWorld));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    // Extend culling bounds for shader-driven movement.
    if (mesh.boundingSphere) mesh.boundingSphere.radius += 0.35;
    mesh.castShadow = role !== 'grass';
    mesh.receiveShadow = true;
    group.add(mesh);
  });
  staticBatches.forEach(({ geometries, material }) => {
    const geometry = mergeGeometries(geometries, false);
    if (!geometry) throw new Error(`Could not merge ${material.name}`);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = material.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    geometries.forEach((g) => g.dispose());
  });
  originals.forEach((g) => g.dispose());
  const retained = new Set<THREE.Material>();
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) retained.add(o.material as THREE.Material);
  });
  oldMaterials.forEach((m) => {
    if (!retained.has(m)) m.dispose();
  });
  const windows = [...retained]
    .filter((m) => m.name === 'Hut · amber glass')
    .map((m) => ({ material: m as THREE.MeshStandardMaterial,
      intensity: (m as THREE.MeshStandardMaterial).emissiveIntensity }));

  return {
    group,
    bounds,
    fitPoints,
    fire,
    house,
    windowPositions,
    flames,
    setDay(progress: number) {
      daylight.value = progress;
      flames.forEach((flame) => {
        flame.visible = progress < 1;
        const material = flame.material as THREE.MeshBasicMaterial;
        material.transparent = true;
        material.opacity = 1 - progress;
      });
      windows.forEach(({ material, intensity }) => {
        material.emissiveIntensity = intensity * (1 - progress);
      });
    },
    update(time: number) {
      windTime.value = time;
      waterTime.value = time;
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          geometries.add(o.geometry);
          if (o instanceof THREE.InstancedMesh) o.dispose();
        }
      });
      geometries.forEach((g) => g.dispose());
      retained.forEach((m) => m.dispose());
      gradient.dispose();
    },
  };
}

export type PaintedIsland = ReturnType<typeof prepareIsland>;
