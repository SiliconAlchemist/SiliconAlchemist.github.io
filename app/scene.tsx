'use client';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { prepareIsland, type PaintedIsland } from './island-model';
import { collections, type World } from './projects';
import { site } from 'virtual:portfolio-content';
import { fitLandscape, moonLayout } from './scene-layout';
import { createIslandControls } from './island-controls';
type Props = {
  world: World | null;
  paused: boolean;
  day: boolean;
  onSelect: (w: World) => void;
  onReady: () => void;
  onError: () => void;
};
// The array order maps directly to the left, centre, and right moon positions.
const ids: World[] = ['design', 'dev', 'data'];
export default function NightScene(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    labels = useRef<(HTMLButtonElement | null)[]>([]),
    state = useRef(props),
    hover = useRef(-1),
    resetView = useRef<(() => void) | null>(null),
    zoomView = useRef<((direction: number) => void) | null>(null);
  const [zoomPercent, setZoomPercent] = useState(100);
  state.current = props;
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      state.current.onError();
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    el.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.setAttribute(
      'aria-label',
      site.scene.accessibleDescription,
    );
    canvas.setAttribute('role', 'region');
    canvas.tabIndex = 0;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x172e3b, 0.006);
    const camera = new THREE.PerspectiveCamera(
        43,
        innerWidth / innerHeight,
        0.1,
        220,
      ),
      home = new THREE.Vector3(0, 12, 26),
      baseLook = new THREE.Vector3(0, 2, 0),
      look = baseLook.clone();
    camera.position.copy(home);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    const ambient = new THREE.HemisphereLight(0xc0ded4, 0x40374d, 0.6);
    scene.add(ambient);
    const moonlight = new THREE.DirectionalLight(0xffecc9, 1.65);
    moonlight.position.set(-8, 16, 8);
    moonlight.castShadow = true;
    moonlight.shadow.mapSize.set(2048, 2048);
    Object.assign(moonlight.shadow.camera, {
      left: -15,
      right: 15,
      top: 15,
      bottom: -15,
      near: 0.5,
      far: 60,
    });
    moonlight.shadow.normalBias = 0.04;
    moonlight.shadow.bias = -0.0002;
    scene.add(moonlight);
    const rim = new THREE.DirectionalLight(0x9fcfda, 0.5);
    rim.position.set(10, 9, -9);
    scene.add(rim);
    const island = new THREE.Group();
    island.position.set(0, -3.35, 0);
    island.rotation.y = -0.14;
    scene.add(island);
    let skyFloor = 0,
      fitScale = 1,
      displayedZoom = 1;
    const controls = createIslandControls(canvas, {
      enabled: () => !state.current.world && modelReady,
      onZoom: setZoomPercent,
    });
    resetView.current = controls.reset;
    zoomView.current = controls.zoomBy;
    const campLight = new THREE.PointLight(0xff8a35, 2, 4, 1.8);
    island.add(campLight);
    const windowLights: THREE.PointLight[] = [];
    let disposed = false,
      modelReady = false,
      islandY = -3.35;
    let paintedIsland: PaintedIsland | undefined;
    const firePosition = new THREE.Vector3(2.8, 1.2, 1.45);
    const flames: THREE.Mesh[] = [];
    let landscapeBounds: THREE.Box3 | null = null;
    new GLTFLoader().load(
      site.scene.model,
      (gltf) => {
        if (disposed) {
          gltf.scene.traverse((o) => {
            if (o instanceof THREE.Mesh) {
              o.geometry.dispose();
              (Array.isArray(o.material) ? o.material : [o.material]).forEach(
                (m) => m.dispose(),
              );
            }
          });
          return;
        }
        try {
          paintedIsland = prepareIsland(gltf.scene);
        } catch (error) {
          console.error('Island preparation failed', error);
          state.current.onError();
          return;
        }
        landscapeBounds = paintedIsland.bounds;
        island.add(paintedIsland.group);
        flames.push(...paintedIsland.flames);
        firePosition.copy(paintedIsland.fire);
        campLight.position.copy(firePosition);
        fireGlow.position.copy(firePosition);
        for (const position of paintedIsland.windowPositions) {
          const light = new THREE.PointLight(0xffb057, 1.1, 2, 1.3);
          light.position.copy(position);
          island.add(light);
          windowLights.push(light);
        }
        modelReady = true;
        resize();
        state.current.onReady();
      },
      undefined,
      () => state.current.onError(),
    );
    // Seeded geometry keeps the sky and lunar surfaces consistent on every visit.
    let seed = 8317;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    // Shared, softly rounded cloud geometry; the clouds stay behind the island.
    const clouds = new THREE.Group();
    clouds.name = 'Daytime clouds';
    const cloudGeometry = new THREE.IcosahedronGeometry(1, 2);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      color: 0xfffdf2,
      emissive: 0xb4d5e5,
      emissiveIntensity: 0.45,
    });
    const cloudAnchors = [
      [-10, 7, -20], [12, 10, -24], [-8, 20, -35],
      [10, 22, -40], [0, -9, -18],
    ];
    cloudAnchors.forEach(([x, y, z], index) => {
      const cloud = new THREE.Group();
      cloud.position.set(x, y, z);
      cloud.scale.setScalar(0.8);
      for (let i = 0; i < 9; i++) {
        const puff = new THREE.Mesh(cloudGeometry, cloudMaterial);
        const angle = i * 2.4;
        const crest = 1 - Math.abs(i - 4) / 4;
        puff.position.set((i - 4) * 0.9, crest * 0.8 + Math.sin(angle) * 0.3, Math.cos(angle) * 0.65);
        puff.scale.set(1.5, 0.6 + crest * 1.1 + Math.sin(i * 1.8 + index) * 0.2, 1.2);
        cloud.add(puff);
      }
      clouds.add(cloud);
    });
    scene.add(clouds);
    const starsGeo = new THREE.BufferGeometry(),
      starPositions = [],
      starColors = [];
    for (let i = 0; i < 750; i++) {
      starPositions.push(
        (rand() - 0.5) * 160,
        (rand() - 0.15) * 90,
        -25 - rand() * 100,
      );
      const c = new THREE.Color().setHSL(
        0.59 + rand() * 0.14,
        0.2,
        0.4 + rand() * 0.45,
      );
      starColors.push(c.r, c.g, c.b);
    }
    starsGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starPositions, 3),
    );
    starsGeo.setAttribute(
      'color',
      new THREE.Float32BufferAttribute(starColors, 3),
    );
    const starMat = new THREE.PointsMaterial({
      size: 1.35,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    });
    const stars = new THREE.Points(starsGeo, starMat);
    scene.add(stars);
    function haloTexture() {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,.4)');
      g.addColorStop(0.3, 'rgba(255,255,255,.20)');
      g.addColorStop(0.55, 'rgba(255,255,255,.055)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      return new THREE.CanvasTexture(c);
    }
    const glowTexture = haloTexture();
    const fireGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: 0xff882a,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    fireGlow.position.set(2.8, 1.1, 1.45);
    fireGlow.scale.set(1.15, 1.15, 1);
    island.add(fireGlow);
    const moons = ids.map((id, i) => {
      const group = new THREE.Group();
      scene.add(group);
      const geometry = new THREE.IcosahedronGeometry(1, 5),
        positions = geometry.getAttribute('position'),
        colors = [];
      const tint = new THREE.Color(collections[id].color);
      for (let v = 0; v < positions.count; v++) {
        const x = positions.getX(v),
          y = positions.getY(v),
          z = positions.getZ(v);
        const noise =
          Math.sin(x * 7 + z * 8) * Math.cos(y * 9 - x * 3) * 0.18 +
          Math.sin(z * 23 + y * 18) * Math.sin(x * 28) * 0.09 +
          rand() * 0.055;
        const radius = 1 + noise * 0.035;
        positions.setXYZ(v, x * radius, y * radius, z * radius);
        const c = tint.clone().multiplyScalar(0.45 + noise);
        colors.push(c.r, c.g, c.b);
      }
      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(colors, 3),
      );
      geometry.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 1,
        flatShading: true,
        emissive: tint,
        emissiveIntensity: 0.035,
      });
      const sphere = new THREE.Mesh(geometry, material);
      group.add(sphere);
      // Crater depressions are geometry details on the near hemisphere.
      for (let k = 0; k < 15; k++) {
        const a = rand() * Math.PI * 2,
          b = 0.25 + rand() * 1.7,
          n = new THREE.Vector3(
            Math.sin(b) * Math.cos(a),
            Math.sin(b) * Math.sin(a),
            Math.cos(b),
          );
        const cr = new THREE.Mesh(
          new THREE.TorusGeometry(0.025 + rand() * 0.06, 0.005, 4, 12),
          new THREE.MeshStandardMaterial({
            color: tint.clone().multiplyScalar(0.28),
            roughness: 1,
          }),
        );
        cr.position.copy(n.multiplyScalar(0.997));
        cr.lookAt(cr.position.clone().multiplyScalar(2));
        sphere.add(cr);
      }
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTexture,
          color: tint,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      glow.scale.set(5.5, 5.5, 1);
      group.add(glow);
      const ringCurve = new THREE.EllipseCurve(
          0,
          0,
          1.45,
          1.45,
          0,
          Math.PI * 2,
          false,
          0,
        ),
        ringGeo = new THREE.BufferGeometry().setFromPoints(
          ringCurve.getPoints(120),
        );
      const ring = new THREE.LineLoop(
        ringGeo,
        new THREE.LineBasicMaterial({
          color: tint,
          transparent: true,
          opacity: 0.1,
        }),
      );
      ring.rotation.set(0.9, 0.2, 0.2 + i * 0.3);
      group.add(ring);
      return { group, sphere, glow, ring, base: new THREE.Vector3(), size: 1 };
    });
    // Small sparks rise from the campsite without needing texture downloads.
    const sparksGeo = new THREE.BufferGeometry(),
      sparkArr = new Float32Array(45 * 3);
    sparksGeo.setAttribute('position', new THREE.BufferAttribute(sparkArr, 3));
    const sparks = new THREE.Points(
      sparksGeo,
      new THREE.PointsMaterial({
        color: 0xffbf68,
        size: 0.06,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    island.add(sparks);
    const flyGeo = new THREE.BufferGeometry(),
      flyArr = [];
    for (let i = 0; i < 65; i++)
      flyArr.push((rand() - 0.5) * 18, 0.8 + rand() * 2.4, (rand() - 0.5) * 8);
    flyGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(flyArr, 3),
    );
    const fireflies = new THREE.Points(
      flyGeo,
      new THREE.PointsMaterial({
        color: 0xd1d8a5,
        size: 0.032,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    island.add(fireflies);
    const pointer = new THREE.Vector2();
    const move = (e: PointerEvent) => {
      pointer.set(
        (e.clientX / innerWidth - 0.5) * 2,
        (e.clientY / innerHeight - 0.5) * 2,
      );
    };
    window.addEventListener('pointermove', move);
    const homeCam = camera.clone();
    let width = innerWidth,
      height = innerHeight;
    function resize() {
      width = innerWidth;
      height = innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      homeCam.aspect = camera.aspect;
      homeCam.position.copy(home);
      homeCam.lookAt(baseLook);
      homeCam.updateProjectionMatrix();
      homeCam.updateMatrixWorld();
      const mobile = width < 640;
      const introEnd =
        el?.parentElement?.querySelector('.intro')?.getBoundingClientRect()
          .bottom || (mobile ? 205 : 245);
      const labelHeight = Math.max(
        58,
        ...labels.current.map(
          (b) =>
            b?.querySelector('.moon-text')?.getBoundingClientRect().height || 0,
        ),
      );
      const layout = moonLayout(width, height, introEnd, labelHeight);
      const skyBottom = layout.bottom;
      moons.forEach((m, i) => {
        const anchor = layout.moons[i];
        const ray = new THREE.Vector3(
          anchor.x,
          1 - (2 * anchor.y) / height,
          0.5,
        )
          .unproject(homeCam)
          .sub(home)
          .normalize();
        m.base.copy(home).addScaledVector(ray, 36);
        m.group.position.copy(m.base);
        const px = anchor.radius;
        m.size =
          (px * (2 * 36 * Math.tan(THREE.MathUtils.degToRad(43 / 2)))) / height;
        m.group.scale.setScalar(m.size);
      });
      skyFloor = skyBottom;
      if (landscapeBounds) {
        const fit = fitLandscape(
          landscapeBounds,
          width,
          height,
          homeCam,
          skyBottom,
          island.quaternion,
          paintedIsland?.fitPoints,
        );
        fitScale = fit.scale;
        islandY = fit.y;
      } else {
        fitScale = mobile ? width / 830 : Math.min(1.13, width / 1200);
        islandY = mobile ? -3 : -3.35;
      }
      island.scale.setScalar(fitScale * displayedZoom);
      island.position.y = islandY;
    }
    resize();
    window.addEventListener('resize', resize);
    const contextLost = (e: Event) => {
      e.preventDefault();
      state.current.onError();
    };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    let frame = 0,
      last = performance.now(),
      elapsed = 0;
    const point = new THREE.Vector3(),
      targetPosition = new THREE.Vector3(),
      targetLook = new THREE.Vector3();
    function animate(now: number) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (document.hidden) return;
      const { world, paused, day } = state.current;
      // Switching atmosphere is independent of the animation clock, including when paused.
      if (scene.userData.day !== day) {
        scene.userData.day = day;
        (scene.fog as THREE.FogExp2).color.set(day ? 0xa6d9eb : 0x172e3b);
        ambient.color.set(day ? 0xd7efff : 0xc0ded4);
        ambient.groundColor.set(day ? 0x789772 : 0x40374d);
        ambient.intensity = day ? 1.35 : 0.6;
        moonlight.color.set(day ? 0xfff3d6 : 0xffecc9);
        moonlight.intensity = day ? 2.6 : 1.65;
        rim.intensity = day ? 0.65 : 0.5;
        renderer.toneMappingExposure = day ? 1.15 : 1.05;
        stars.visible = !day;
        fireflies.visible = !day;
        sparks.visible = !day;
        fireGlow.visible = !day;
        campLight.visible = !day;
        clouds.visible = day;
      }
      // Also apply after asynchronous model loading.
      paintedIsland?.setDay(day);
      for (const light of windowLights) light.visible = !day;
      clouds.children.forEach((cloud, i) => {
        cloud.position.x = cloudAnchors[i][0] + Math.sin(elapsed * 0.035 + i) * 2;
      });
      if (!paused) elapsed += dt;
      const selected = world ? ids.indexOf(world) : -1;
      canvas.tabIndex = world ? -1 : 0;
      canvas.style.touchAction = world ? 'auto' : 'none';
      if (world) controls.cancel();
      const { yaw, pitch, zoom } = controls.view;
      if (
        !world &&
        (Math.abs(island.rotation.y - yaw) > 0.00001 ||
          Math.abs(island.rotation.x - pitch) > 0.00001)
      ) {
        const turn = paused ? 1 : 1 - Math.exp(-dt * 16);
        island.rotation.set(
          THREE.MathUtils.lerp(island.rotation.x, pitch, turn),
          THREE.MathUtils.lerp(island.rotation.y, yaw, turn),
          0,
          'YXZ',
        );
        if (landscapeBounds) {
          const fit = fitLandscape(
            landscapeBounds,
            width,
            height,
            homeCam,
            skyFloor,
            island.quaternion,
            paintedIsland?.fitPoints,
          );
          fitScale = fit.scale;
          islandY = fit.y;
        }
      }
      displayedZoom = THREE.MathUtils.lerp(
        displayedZoom,
        world ? 1 : zoom,
        paused ? 1 : 1 - Math.exp(-dt * 14),
      );
      island.scale.setScalar(fitScale * displayedZoom);
      if (selected >= 0) {
        const m = moons[selected];
        targetLook.copy(m.base).add(new THREE.Vector3(-2, -0.5, 0));
        targetPosition.copy(m.base).add(new THREE.Vector3(1, 1, 7.5));
      } else {
        targetLook.copy(baseLook);
        targetPosition.copy(home);
        if (!paused) {
          targetPosition.x += pointer.x * 0.27;
          targetPosition.y -= pointer.y * 0.13;
        }
      }
      const lerp = paused ? 1 : 1 - Math.exp(-dt * 3.5);
      camera.position.lerp(targetPosition, lerp);
      look.lerp(targetLook, lerp);
      camera.lookAt(look);
      moons.forEach((m, i) => {
        m.group.position.y = m.base.y + Math.sin(elapsed * 0.35 + i) * 0.085;
        m.sphere.rotation.y = elapsed * 0.023 * (i % 2 ? -1 : 1);
        m.glow.material.opacity = THREE.MathUtils.lerp(
          m.glow.material.opacity,
          day ? 0.08 : hover.current === i ? 0.83 : 0.45,
          0.07,
        );
        m.ring.rotation.z = elapsed * 0.025 + i * 0.35;
        const button = labels.current[i];
        if (button) {
          point.copy(m.group.position).project(camera);
          button.style.left = `${(point.x * 0.5 + 0.5) * width}px`;
          button.style.top = `${(-point.y * 0.5 + 0.5) * height}px`;
          const dist = camera.position.distanceTo(m.group.position);
          const diameter =
            (m.size * height) /
            (dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
          button.style.width = `${diameter + 15}px`;
          button.style.height = `${diameter + 15}px`;
          button.style.visibility = world ? 'hidden' : 'visible';
        }
      });
      island.position.y = islandY + Math.sin(elapsed * 0.35) * 0.07;
      campLight.intensity =
        (2 + Math.sin(elapsed * 9) * 0.3 + Math.sin(elapsed * 17) * 0.2) *
        Math.pow(island.scale.x, 1.8);
      for (const light of windowLights)
        light.intensity = 1.1 * Math.pow(island.scale.x, 1.3);
      paintedIsland?.update(elapsed);
      flames.forEach((flame, i) => {
        flame.scale.set(
          1 + Math.sin(elapsed * 7 + i) * 0.08,
          0.91 + Math.sin(elapsed * 9 + i * 1.6) * 0.17,
          1 + Math.cos(elapsed * 8 + i) * 0.07,
        );
      });
      fireGlow.material.opacity = 0.45 + Math.sin(elapsed * 8) * 0.08;
      for (let i = 0; i < 45; i++) {
        const p = (elapsed * 0.35 + i * 0.173) % 1;
        sparkArr[i * 3] =
          firePosition.x + Math.sin(i * 13 + elapsed * 0.6) * p * 0.45;
        sparkArr[i * 3 + 1] = firePosition.y - 0.2 + p * 1.6;
        sparkArr[i * 3 + 2] =
          firePosition.z + Math.cos(i * 17 + elapsed * 0.5) * p * 0.35;
      }
      sparksGeo.attributes.position.needsUpdate = true;
      fireflies.position.y = Math.sin(elapsed * 0.6) * 0.15;
      stars.rotation.z = Math.sin(elapsed * 0.015) * 0.005;
      renderer.render(scene, camera);
    }
    frame = requestAnimationFrame(animate);
    const fallbackTimer = setTimeout(() => {
      if (!modelReady) state.current.onError();
    }, 20000);
    return () => {
      disposed = true;
      resetView.current = null;
      zoomView.current = null;
      controls.dispose();
      clearTimeout(fallbackTimer);
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      if (paintedIsland) {
        island.remove(paintedIsland.group);
        paintedIsland.dispose();
      }
      const materials = new Set<THREE.Material>();
      scene.traverse((o) => {
        if (
          o instanceof THREE.Mesh ||
          o instanceof THREE.Points ||
          o instanceof THREE.Line
        ) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            materials.add(m),
          );
        } else if (o instanceof THREE.Sprite) materials.add(o.material);
      });
      materials.forEach((m) => m.dispose());
      glowTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div className="scene" ref={host}>
      <div className="rotation-controls" hidden={!!props.world}>
        <span className="view-hint">{site.scene.hint}</span>
        <div className="zoom-controls" role="group" aria-label={site.scene.zoomGroup}>
          <button
            aria-label={site.scene.zoomOut}
            disabled={zoomPercent <= 65}
            onClick={() => zoomView.current?.(-1)}
          >
            −
          </button>
          <output aria-label={site.scene.zoomLevel}>{zoomPercent}%</output>
          <button
            aria-label={site.scene.zoomIn}
            disabled={zoomPercent >= 250}
            onClick={() => zoomView.current?.(1)}
          >
            +
          </button>
        </div>
        <button
          onClick={() => resetView.current?.()}
          aria-label={site.scene.resetLabel}
        >
          {site.scene.reset}
        </button>
      </div>
      {ids.map((id, i) => (
        <button
          key={id}
          ref={(node) => {
            labels.current[i] = node;
          }}
          className="moon-label"
          style={
            {
              left: `${[27.5, 50, 72.5][i]}%`,
              top: `${[44.5, 38, 44.5][i]}%`,
              '--moon-color': collections[id].color,
              visibility: props.world ? 'hidden' : 'visible',
            } as React.CSSProperties
          }
          aria-label={collections[id].exploreLabel}
          onClick={() => props.onSelect(id)}
          onPointerEnter={() => {
            hover.current = i;
          }}
          onPointerLeave={() => {
            hover.current = -1;
          }}
          onFocus={() => {
            hover.current = i;
          }}
          onBlur={() => {
            hover.current = -1;
          }}
        >
          <span className="moon-text">
            <strong>
              {collections[id].label}
              <span>↗</span>
            </strong>
            <small>
              {collections[id].moonCaption}
            </small>
          </span>
        </button>
      ))}
    </div>
  );
}
