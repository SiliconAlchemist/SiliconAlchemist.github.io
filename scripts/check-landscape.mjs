import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { fitLandscape } from '../app/scene-layout.ts';

const bytes=fs.readFileSync('assets/legacy-models/landscape.glb');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
gltf.scene.updateMatrixWorld(true);
const bounds=new THREE.Box3().setFromObject(gltf.scene),buckets=new Map();let flames=0,foliage=0;
gltf.scene.traverse(o=>{
 if(!(o instanceof THREE.Mesh)||Array.isArray(o.material))return;
 const g=o.geometry.clone().applyMatrix4(o.matrixWorld);
 Object.keys(g.attributes).forEach(key=>{if(key!=='position'&&key!=='normal')g.deleteAttribute(key);});
 if(o.name.startsWith('Flame')){flames++;assert.ok(o.material.emissiveIntensity>0);return;}
 if(/Moss|Pine needles/.test(o.material.name)){const c=o.material.color;assert.ok(c.g>c.r*2&&c.g>c.b*2,`${o.material.name} must be green`);foliage++;}
 const list=buckets.get(o.material)||[];list.push(g);buckets.set(o.material,list);
});
for(const [material,geometries] of buckets)assert.ok(mergeGeometries(geometries,false),`${material.name} can be merged`);
assert.equal(flames,6);assert.ok(foliage>100);
const corners=[];for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])corners.push(new THREE.Vector3(x,y,z));
const home=new THREE.Vector3(0,8,26),look=new THREE.Vector3(0,2,0);
for(const [w,h] of [[390,844],[768,1024],[1280,720],[1440,900],[1920,1080],[2560,1440],[3440,1440],[3840,1080],[1440,600]]){
 const c=new THREE.PerspectiveCamera(43,w/h,.1,220);c.position.copy(home);c.lookAt(look);c.updateMatrixWorld();
 const mobile=w<640,introEnd=mobile?205:h<700?164:w>=1600?270:245;
 const centerY=Math.max(h*.34,introEnd+(mobile?42:Math.min(h*.068,68))+16),sideY=Math.max(h*.405,centerY+h*.045);
 const moons=[-1,0,1].map((side,i)=>{const radius=mobile?(i===1?42:34):Math.min(h*.068,i===1?68:58);const y=i===1?centerY:sideY;const direction=new THREE.Vector3(side*(mobile?.58:.45),1-2*y/h,.5).unproject(c).sub(home).normalize();return{position:home.clone().addScaledVector(direction,36),radius,radiusWorld:radius*(2*36*Math.tan(THREE.MathUtils.degToRad(43/2)))/h,y};});
 const skyBottom=Math.max(...moons.map(m=>m.y+m.radius+28));
 for(let turn=0;turn<8;turn++)for(const tilt of [-.24,0,.24]){
 const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt,-.14+turn*Math.PI/4,0,'YXZ'));
 c.position.copy(home);c.lookAt(look);c.updateMatrixWorld();
 const fit=fitLandscape(bounds,w,h,c,skyBottom,rotation);
 for(const px of [-1,0,1])for(const py of [-1,1]){
  c.position.copy(home).add(new THREE.Vector3(px*.27,py*.13,0));c.lookAt(look);c.updateMatrixWorld();
  const points=corners.map(p=>p.clone().multiplyScalar(fit.scale).applyQuaternion(rotation).add(new THREE.Vector3(0,fit.y+.07,0)).project(c));
  const treetop=(1-Math.max(...points.map(p=>p.y)))*h/2;
  for(const moon of moons){const p=moon.position.clone().add(new THREE.Vector3(0,-.085,0)).project(c);const local=moon.position.clone().applyMatrix4(c.matrixWorldInverse);const bottom=(1-p.y)*h/2+moon.radiusWorld*h/(2*(-local.z)*Math.tan(THREE.MathUtils.degToRad(43/2)));assert.ok(treetop>bottom+4,`${w}x${h}: trees ${treetop.toFixed(1)} must clear moon ${bottom.toFixed(1)}`);}
 }
 }
 console.log(`${w}x${h}: moon clearance passed at 24 rotations and tilts`);
}
console.log(`${flames} emissive flames, green foliage and ${buckets.size} merged material groups verified.`);
