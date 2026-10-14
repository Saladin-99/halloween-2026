import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import * as THREE from 'three';
import sharp from 'sharp';

const output = resolve('public/assets');
await mkdir(resolve(output, 'audio'), { recursive: true });
for (const file of ['backyard-selected-master.png', 'backyard-scene-480.webp', 'backyard-scene-800.webp', 'backyard-scene-1254.webp']) {
  await copyFile(resolve('assets', file), resolve(output, file));
}
await copyFile(resolve('assets/audio/placeholder-ambient.mp3'), resolve(output, 'audio/placeholder-ambient.mp3'));
await copyFile(resolve('node_modules/@fontsource/space-grotesk/LICENSE'), resolve(output, 'space-grotesk-OFL.txt'));

// Authored lobed squash, with a depressed crown, asymmetry, fine ribbing and a curled stem.
// UV seam is at the rear; matching seam normals avoid a visible lighting discontinuity.
function squash(scale = 1) {
  const width = 160, height = 80;
  const positions = [], uvs = [], indices = [];
  for (let j = 0; j <= height; j++) {
    const theta = (j / height) * Math.PI;
    const sine = Math.sin(theta);
    for (let i = 0; i <= width; i++) {
      const phi = (i / width) * Math.PI * 2;
      const ribs = 1 + 0.085 * Math.cos(phi * 10 + 0.14 * Math.cos(theta)) + 0.008 * Math.cos(phi * 20);
      const radius = 1.37 * Math.pow(sine, 0.76) * ribs * (1 + 0.025 * Math.sin(phi * 3 + theta));
      const y = Math.cos(theta) * (1.06 - 0.19 * Math.exp(-Math.pow(sine / 0.23, 2)));
      positions.push(scale * radius * Math.sin(phi), scale * y, -scale * radius * Math.cos(phi));
      uvs.push(i / width, 1 - j / height);
      if (j < height && i < width) {
        const a = j * (width + 1) + i, b = a + width + 1;
        indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal');
  for (let j = 0; j <= height; j++) {
    const first = j * (width + 1), last = first + width;
    const normal = new THREE.Vector3().fromBufferAttribute(normals, first).add(new THREE.Vector3().fromBufferAttribute(normals, last)).normalize();
    normals.setXYZ(first, normal.x, normal.y, normal.z);
    normals.setXYZ(last, normal.x, normal.y, normal.z);
  }
  return geometry;
}
const stemCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0.81, 0), new THREE.Vector3(0.025, 1.06, 0),
  new THREE.Vector3(0.08, 1.29, -0.04), new THREE.Vector3(0.26, 1.44, -0.10),
  new THREE.Vector3(0.37, 1.43, -0.14),
]);
const stem = new THREE.TubeGeometry(stemCurve, 28, 0.105, 10, false);
const collar = new THREE.ConeGeometry(0.27, 0.14, 10);
collar.translate(0, 0.88, 0);

// Minimal glTF writer keeps the model reproducible without a browser/FileReader polyfill.
const chunks = [], bufferViews = [], accessors = [], meshes = [], nodes = [];
let offset = 0;
function accessor(array, type, componentType, target, bounds = false) {
  const buffer = Buffer.from(array.buffer, array.byteOffset, array.byteLength);
  const padded = Buffer.alloc(Math.ceil(buffer.length / 4) * 4);
  buffer.copy(padded); chunks.push(padded);
  const view = bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buffer.length, target }) - 1;
  offset += padded.length;
  const size = type === 'VEC3' ? 3 : type === 'VEC2' ? 2 : 1;
  const info = { bufferView: view, componentType, count: array.length / size, type };
  if (bounds) {
    info.min = Array(size).fill(Infinity); info.max = Array(size).fill(-Infinity);
    array.forEach((value, i) => { info.min[i % size] = Math.min(info.min[i % size], value); info.max[i % size] = Math.max(info.max[i % size], value); });
  }
  return accessors.push(info) - 1;
}
for (const [name, geometry, material] of [['PumpkinShell', squash(), 0], ['PumpkinInterior', squash(0.87), 1], ['Stem', stem, 2], ['StemCollar', collar, 2]]) {
  const attributes = {};
  for (const [property, semantic] of [['position', 'POSITION'], ['normal', 'NORMAL'], ['uv', 'TEXCOORD_0']]) {
    const attribute = geometry.getAttribute(property);
    attributes[semantic] = accessor(attribute.array, attribute.itemSize === 3 ? 'VEC3' : 'VEC2', 5126, 34962, property === 'position');
  }
  const index = geometry.getIndex();
  const primitive = { attributes, material };
  if (index) primitive.indices = accessor(index.array, 'SCALAR', index.array instanceof Uint32Array ? 5125 : 5123, 34963);
  nodes.push({ name, mesh: meshes.length });
  meshes.push({ name, primitives: [primitive] });
  geometry.dispose();
}
const gltf = {
  asset: { version: '2.0', generator: 'Ma3moora authored parametric pumpkin v1' },
  scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }], nodes, meshes,
  materials: [
    { name: 'Orange skin', pbrMetallicRoughness: { baseColorFactor: [0.72, 0.19, 0.025, 1], metallicFactor: 0, roughnessFactor: 0.55 } },
    { name: 'Recessed lantern cavity', pbrMetallicRoughness: { baseColorFactor: [0.16, 0.025, 0.002, 1], metallicFactor: 0, roughnessFactor: 1 }, emissiveFactor: [1, 0.26, 0.015] },
    { name: 'Woody stem', pbrMetallicRoughness: { baseColorFactor: [0.14, 0.10, 0.035, 1], metallicFactor: 0, roughnessFactor: 0.9 } },
  ],
  buffers: [{ byteLength: offset }], bufferViews, accessors,
};
const json = Buffer.from(JSON.stringify(gltf));
const jsonPadded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20); json.copy(jsonPadded);
const bin = Buffer.concat(chunks);
const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + jsonPadded.length + 8 + bin.length, 8);
const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(jsonPadded.length); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(bin.length); binHeader.writeUInt32LE(0x004e4942, 4);
await writeFile(resolve(output, 'pumpkin-carvable.glb'), Buffer.concat([header, jsonHeader, jsonPadded, binHeader, bin]));

const colors = ['#ff688e', '#b891ff', '#8ce6c0', '#ff9f4b', '#eab0f3', '#89cfff', '#f3cb73', '#fa90a9', '#ffcf4f'];
const sprites = colors.map((color, i) => {
  const x = i * 128;
  const shape = i % 3;
  const body = shape === 0
    ? '<path d="M40 46 L20 34 L23 64 L19 91 L42 80 M87 46 L108 34 L105 64 L109 91 L86 80" fill="url(#g'+i+')"/><rect x="36" y="40" width="56" height="47" rx="17" fill="url(#g'+i+')"/><path d="M42 49 Q64 69 85 50 M42 76 Q64 55 85 76" stroke="#fff" stroke-opacity=".25" stroke-width="7" fill="none"/>'
    : shape === 1
      ? '<path d="M36 44 L16 42 L24 62 L17 84 L38 81 M90 44 L112 42 L104 62 L111 84 L89 81" fill="url(#g'+i+')"/><ellipse cx="64" cy="63" rx="33" ry="27" fill="url(#g'+i+')"/><path d="M46 45 Q82 37 86 60" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/>'
      : '<path d="M56 80 L67 80 L71 112 L62 114 Z" fill="#efdfc9"/><circle cx="64" cy="51" r="33" fill="url(#g'+i+')"/><path d="M64 24 C104 38 86 82 54 74 C22 63 43 28 67 40 C90 53 58 72 53 53" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="7" stroke-linecap="round"/>';
  return `<g transform="translate(${x},0) rotate(${i % 2 ? -12 : 10},64,64)"><defs><radialGradient id="g${i}" cx=".35" cy=".2" r=".9"><stop stop-color="#fff2de"/><stop offset=".22" stop-color="${color}"/><stop offset=".75" stop-color="${color}"/><stop offset="1" stop-color="#4b2045"/></radialGradient></defs><g stroke="#260f38" stroke-opacity=".3" stroke-width="1.5">${body}</g><ellipse cx="52" cy="46" rx="12" ry="4" fill="white" opacity=".45" transform="rotate(-20,52,46)"/>${i === 8 ? '<path d="M64 43 L68 56 L82 57 L71 65 L75 79 L64 71 L53 79 L57 65 L46 57 L60 56 Z" fill="#fff5bf"/>' : ''}</g>`;
});
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1152" height="128" viewBox="0 0 1152 128">${sprites.join('')}</svg>`)).webp({ lossless: true }).toFile(resolve(output, 'candy-atlas.webp'));
await writeFile(resolve(output, 'pumpkin-fallback.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 370"><defs><radialGradient id="p" cx=".35" cy=".28"><stop stop-color="#ffbf66"/><stop offset=".6" stop-color="#ee731d"/><stop offset="1" stop-color="#92320f"/></radialGradient></defs><path d="M196 89 Q187 35 229 25 L244 45 Q218 45 220 91" fill="#66512e"/>${[125,165,205,245,275].map((cx,i)=>`<ellipse cx="${cx}" cy="207" rx="${i===2?72:61}" ry="122" fill="url(#p)" stroke="#7d300f" stroke-width="2"/>`).join('')}</svg>`);
console.log(`Generated pumpkin GLB (${Math.round((header.length + jsonPadded.length + bin.length) / 1024)} KiB), 9-candy atlas, fallback and venue assets.`);
