import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { siteContent } from '../config/siteContent';
import { assetUrl } from '../lib/content';
import { keys, readStorage, writeStorage } from '../lib/storage';
import { CarvingMask } from './Mask';
import { PumpkinGestures } from './Gestures';
import { defaultPose, parsePumpkin, type Pose, type Tool, type UV } from './model';

export type PumpkinStatus = { ready: boolean; touched: boolean; canUndo: boolean; hasCarving: boolean; storageAvailable: boolean };

export class PumpkinEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.1, 30);
  private root = new THREE.Group();
  private shell: THREE.Mesh | null = null;
  private raycaster = new THREE.Raycaster();
  private mask = new CarvingMask();
  private maskTexture = new THREE.CanvasTexture(this.mask.canvas);
  private gestures: PumpkinGestures;
  private observer: ResizeObserver;
  private pose: Pose = { ...defaultPose };
  private frame = 0;
  private disposed = false;
  private initialized = false;
  private active = true;
  private touched = false;
  private storageAvailable = true;
  private renderDirty = true;
  tool: Tool = 'carve';
  radius: number = siteContent.tuning.brushRadius;

  constructor(private container: HTMLElement, private status: (value: PumpkinStatus) => void, private failure: () => void) {
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.domElement.setAttribute('aria-label', siteContent.copy.intro.stageLabel);
    this.renderer.domElement.setAttribute('role', 'img');
    this.renderer.domElement.addEventListener('webglcontextlost', this.contextLost);
    document.addEventListener('visibilitychange', this.invalidate);
    container.appendChild(this.renderer.domElement);
    this.maskTexture.wrapS = THREE.RepeatWrapping;
    this.maskTexture.minFilter = this.maskTexture.magFilter = THREE.LinearFilter;
    this.maskTexture.generateMipmaps = false;
    this.scene.add(this.root);
    this.scene.add(new THREE.HemisphereLight(0xc2adff, 0x411609, 1.4));
    const key = new THREE.DirectionalLight(0xffcf97, 3.1); key.position.set(-3, 4, 5); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xa878ff, 2.2); rim.position.set(3, 2, -3); this.scene.add(rim);
    const fill = new THREE.DirectionalLight(0xff791c, 0.9); fill.position.set(2, -2, 4); this.scene.add(fill);
    this.camera.position.set(0, 0.25, 6);
    this.camera.lookAt(0, 0.16, 0);
    this.observer = new ResizeObserver(this.resize); this.observer.observe(container);
    this.gestures = new PumpkinGestures(container, {
      hit: this.hit,
      begin: uv => {
        this.touched = true;
        this.mask.begin(this.tool === 'erase' ? 'erase' : 'carve', this.radius);
        this.mask.sample(uv); this.invalidate(); this.report();
      },
      sample: uv => { this.mask.sample(uv); this.invalidate(); },
      commit: () => { this.mask.commit(); this.report(); this.persist(); },
      pose: this.setPose,
      persist: this.persist,
      getTool: () => this.tool,
      getPose: () => this.pose,
    });
    this.invalidate();
    void this.load();
  }

  private async load() {
    try {
      const gltf = await new GLTFLoader().loadAsync(assetUrl(siteContent.assets.pumpkinGlb));
      if (this.disposed) { this.disposeModel(gltf.scene); return; }
      const shell = gltf.scene.getObjectByName('PumpkinShell') as THREE.Mesh;
      if (!shell?.isMesh) throw new Error('Missing carveable shell');
      this.shell = shell;
      const material = shell.material as THREE.MeshStandardMaterial;
      material.roughness = 0.49;
      material.alphaToCoverage = true;
      material.onBeforeCompile = shader => {
        shader.uniforms.carveMask = { value: this.maskTexture };
        shader.uniforms.carveTexel = { value: 1 / this.mask.canvas.width };
        shader.vertexShader = `varying vec2 vCarveUv; varying vec3 vSkinPosition;\n${shader.vertexShader}`
          .replace('#include <uv_vertex>', '#include <uv_vertex>\nvCarveUv = uv; vSkinPosition = position;');
        shader.fragmentShader = `uniform sampler2D carveMask; uniform float carveTexel; varying vec2 vCarveUv; varying vec3 vSkinPosition;\n${shader.fragmentShader}`
          .replace('#include <alphatest_fragment>', `
            #include <alphatest_fragment>
            float cut = texture2D(carveMask, vCarveUv).a;
            if (cut > 0.98) discard;
            diffuseColor.a *= 1.0 - smoothstep(0.1, 0.98, cut);
            float nearby = max(max(texture2D(carveMask, vCarveUv + vec2(carveTexel*2.0, 0.0)).a,
              texture2D(carveMask, vCarveUv - vec2(carveTexel*2.0, 0.0)).a),
              max(texture2D(carveMask, vCarveUv + vec2(0.0, carveTexel*2.0)).a,
              texture2D(carveMask, vCarveUv - vec2(0.0, carveTexel*2.0)).a));
            float grain = fract(sin(dot(floor(vSkinPosition*210.0), vec3(12.9898,78.233,37.719))) * 43758.5453);
            diffuseColor.rgb *= 0.94 + grain * 0.07;
            diffuseColor.rgb *= 0.87 + 0.13 * sin(vCarveUv.y * 3.14159);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.18, 0.032, 0.004), nearby * 0.8);
          `)
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += nearby * vec3(0.12, 0.025, 0.002);');
      };
      const interior = gltf.scene.getObjectByName('PumpkinInterior') as THREE.Mesh;
      const innerMaterial = interior.material as THREE.MeshStandardMaterial;
      innerMaterial.emissive.set('#ff8a20'); innerMaterial.emissiveIntensity = 1.5;
      innerMaterial.onBeforeCompile = shader => {
        shader.uniforms.carveMask = { value: this.maskTexture };
        shader.vertexShader = `varying vec2 vCavityUv;\n${shader.vertexShader}`.replace('#include <uv_vertex>', '#include <uv_vertex>\nvCavityUv = uv;');
        shader.fragmentShader = `uniform sampler2D carveMask; varying vec2 vCavityUv;\n${shader.fragmentShader}`
          .replace('#include <emissivemap_fragment>', `
            #include <emissivemap_fragment>
            float centerCut = texture2D(carveMask, vCavityUv).a;
            float deepCut = min(min(texture2D(carveMask, vCavityUv+vec2(0.004,0.0)).a, texture2D(carveMask, vCavityUv-vec2(0.004,0.0)).a),
              min(texture2D(carveMask, vCavityUv+vec2(0.0,0.007)).a, texture2D(carveMask, vCavityUv-vec2(0.0,0.007)).a));
            totalEmissiveRadiance *= (0.035 + 0.2 * centerCut + 0.765 * deepCut) * (0.8 + 0.2 * sin(vCavityUv.y * 12.0));
            diffuseColor.rgb *= 0.1;
          `);
      };
      this.root.add(gltf.scene);
      const saved = parsePumpkin(readStorage(keys.pumpkin));
      if (saved) {
        this.pose = saved.pose; this.touched = saved.touched;
        try { await this.mask.restore(saved.strokes, saved.checkpoint); } catch { this.mask.reset(); }
      }
      if (this.disposed) return;
      this.initialized = true;
      this.setPose(this.pose.yaw, this.pose.pitch, this.pose.zoom);
      this.resize(); this.report();
    } catch { if (!this.disposed) this.failure(); }
  }

  private report() {
    this.status({ ready: this.initialized, touched: this.touched, canUndo: this.mask.strokes.length > 0,
      hasCarving: this.mask.hasCheckpoint || this.mask.strokes.length > 0 || !!this.mask.current, storageAvailable: this.storageAvailable });
  }
  private contextLost = (event: Event) => { event.preventDefault(); this.failure(); };
  private resize = () => {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    if (!width || !height || this.disposed) return;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    const verticalFit = 1.65 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
    this.camera.position.z = Math.max(verticalFit, verticalFit / this.camera.aspect) / this.pose.zoom;
    this.camera.updateProjectionMatrix(); this.invalidate();
  };
  private hit = (x: number, y: number): UV | null => {
    if (!this.shell || !this.initialized) return null;
    const rect = this.container.getBoundingClientRect();
    this.root.updateMatrixWorld(true); this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(new THREE.Vector2((x - rect.left) / rect.width * 2 - 1, -(y - rect.top) / rect.height * 2 + 1), this.camera);
    const hit = this.raycaster.intersectObject(this.shell, false)[0];
    return hit?.uv ? [Math.round(hit.uv.x * 100000) / 100000, Math.round(hit.uv.y * 100000) / 100000] : null;
  };
  private render = () => {
    this.frame = 0;
    if (this.disposed) return;
    if (this.active && !document.hidden && (this.mask.dirty || this.renderDirty)) {
      if (this.mask.dirty) { this.maskTexture.needsUpdate = true; this.mask.dirty = false; }
      this.renderer.render(this.scene, this.camera); this.renderDirty = false;
    }
  };
  private invalidate = () => {
    this.renderDirty = true;
    if (this.active && !document.hidden && !this.frame && !this.disposed) this.frame = requestAnimationFrame(this.render);
  };
  private setPose = (yaw: number, pitch: number, zoom: number) => {
    const limit = THREE.MathUtils.degToRad(siteContent.tuning.maxPumpkinTiltDegrees);
    this.pose = { yaw: yaw % (Math.PI * 2), pitch: THREE.MathUtils.clamp(pitch, -limit, limit), zoom: THREE.MathUtils.clamp(zoom, siteContent.tuning.pumpkinZoomMin, siteContent.tuning.pumpkinZoomMax) };
    this.root.rotation.set(this.pose.pitch, this.pose.yaw, 0, 'YXZ');
    this.resize(); this.invalidate();
  };
  persist = () => {
    if (this.disposed || !this.shell) return;
    this.storageAvailable = writeStorage(keys.pumpkin, JSON.stringify({ version: 1, strokes: this.mask.strokes, checkpoint: this.mask.checkpointData(), pose: this.pose, touched: this.touched }));
    this.report();
  };
  setActive(active: boolean) {
    if (!active && this.active) { this.gestures.cancel(); this.persist(); }
    this.active = active;
    if (!active) { cancelAnimationFrame(this.frame); this.frame = 0; } else this.invalidate();
  }
  undo() { this.gestures.cancel(); this.mask.undo(); this.invalidate(); this.persist(); }
  reset() { this.gestures.cancel(); this.mask.reset(); this.invalidate(); this.persist(); }
  rotate(yaw: number, pitch: number) { this.setPose(this.pose.yaw + yaw, this.pose.pitch + pitch, this.pose.zoom); this.persist(); }

  async exportPng(): Promise<Blob> {
    this.gestures.cancel();
    const size = siteContent.tuning.exportResolution;
    const target = new THREE.WebGLRenderTarget(size, size, { format: THREE.RGBAFormat, samples: 4 });
    target.texture.colorSpace = THREE.SRGBColorSpace;
    const camera = this.camera.clone(); camera.aspect = 1;
    camera.position.z = 5.5 / this.pose.zoom; camera.updateProjectionMatrix();
    const previous = this.renderer.getRenderTarget();
    try {
      this.maskTexture.needsUpdate = true;
      this.renderer.setRenderTarget(target); this.renderer.clear(); this.renderer.render(this.scene, camera);
      const pixels = new Uint8Array(size * size * 4);
      this.renderer.readRenderTargetPixels(target, 0, 0, size, size, pixels);
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
      const context = canvas.getContext('2d')!; const data = context.createImageData(size, size);
      for (let row = 0; row < size; row++) data.data.set(pixels.subarray(row * size * 4, (row + 1) * size * 4), (size - row - 1) * size * 4);
      context.putImageData(data, 0, 0);
      return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png'));
    } finally { this.renderer.setRenderTarget(previous); target.dispose(); this.invalidate(); }
  }

  private disposeModel(root: THREE.Object3D) {
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.dispose();
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => material.dispose());
    });
  }
  dispose() {
    this.gestures.dispose(); this.persist(); this.disposed = true;
    cancelAnimationFrame(this.frame); this.observer.disconnect(); this.disposeModel(this.root);
    this.maskTexture.dispose(); this.renderer.domElement.removeEventListener('webglcontextlost', this.contextLost);
    document.removeEventListener('visibilitychange', this.invalidate);
    this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
