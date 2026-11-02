// bench-view.js — 3D 工作台的舞台（ES module，bench-loader.js 要用時才用 import() 載入）。
// 卡通成圖（三階平塗＋描邊）、可以自由旋轉、點場景裡的零件操作。mount 在指定元素裡建舞台、畫指定的場景，
// 第一幀畫好呼叫 onReady；場景要講話或回報進度用 onEvent；unmount 把 three.js 拆乾淨（主迴圈不管它）
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 場景登記：每個場景拿到一組畫圖、動畫、點擊的工具（kit），自己把東西加進 kit.world
const SCENES = {
  // 地基驗收用：桌子＋一台機殼
  demo({ world, at, box }) {
    world.add(at(box(16, 0.3, 10, 0xc99a63), 0, -0.15, 0));
    world.add(at(box(2.2, 4.6, 4.7, 0xd5dae1), 0, 2.303, -0.05));   // 機身跟前面板前後接著，不疊在同一個平面上（疊了會閃）
    world.add(at(box(2.2, 4.6, 0.1, 0x3a3f47), 0, 2.303, 2.35));
  },
};

export function mount(el, { scene = 'demo', onReady, onEvent } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  el.append(renderer.domElement);
  const world = new THREE.Scene();
  world.background = new THREE.Color(0xe9e1d2);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(9, 6.5, 10);
  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.04, minDistance: 4, maxDistance: 22, rotateSpeed: 0.8 });
  controls.target.set(0.8, 2.0, 0.5);
  controls.update();
  world.add(new THREE.HemisphereLight(0xffffff, 0xb9a98c, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(6, 10, 7);
  world.add(sun);

  // ── 卡通材質：三階明暗＋深色描邊 ──
  const shades = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
  shades.minFilter = shades.magFilter = THREE.NearestFilter;
  shades.needsUpdate = true;
  const ink = new THREE.LineBasicMaterial({ color: 0x2b2f36 });
  const mesh = (geometry, color, { lines = true } = {}) => {
    const m = new THREE.Mesh(geometry, new THREE.MeshToonMaterial({ color, gradientMap: shades }));
    if (lines) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 30), ink));
    return m;
  };
  const box = (w, h, d, color, opts) => mesh(new THREE.BoxGeometry(w, h, d), color, opts);
  const cylinder = (r, h, color, opts) => mesh(new THREE.CylinderGeometry(r, r, h, 24), color, opts);
  const at = (obj, x, y, z) => { obj.position.set(x, y, z); return obj; };

  // ── 補間動畫（smoothstep）──
  const tweens = [];
  const tween = (ms, step, done) => { tweens.push({ t0: performance.now(), ms, step, done }); };
  const runTweens = (now) => {
    for (const tw of [...tweens]) {
      const k = Math.min(1, (now - tw.t0) / tw.ms);
      tw.step(k * k * (3 - 2 * k));
      if (k >= 1) { tweens.splice(tweens.indexOf(tw), 1); if (tw.done) tw.done(); }
    }
  };

  // ── 點擊：拖曳不算點；第一個碰到的東西才算，被擋住的點不到 ──
  const clickable = (obj, onClick) => { obj.userData.onClick = onClick; return obj; };
  // 看不見的點擊範圍：小零件放大一點，手機才點得到
  const hitArea = (w, h, d) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  const ray = new THREE.Raycaster(); const pointer = new THREE.Vector2(); let downAt = null;
  const onDown = (ev) => { downAt = [ev.clientX, ev.clientY]; };
  const onUp = (ev) => {
    if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(world.children, true).find((x) => x.object.isMesh);
    let target = hit && hit.object;
    while (target && !target.userData.onClick) target = target.parent;
    if (target) target.userData.onClick(hit);
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);

  const emit = (ev) => { if (onEvent) onEvent(ev); };
  SCENES[scene]({ THREE, world, camera, controls, mesh, box, cylinder, at, tween, clickable, hitArea, emit, say: (text) => emit({ type: 'say', text }) });

  // ── 轉了幾圈（相機繞著目標轉的角度累計），每多一圈回報一次 ──
  let lastAzimuth = controls.getAzimuthalAngle(); let turned = 0; let laps = 0;
  const onTurn = () => {
    const now = controls.getAzimuthalAngle(); let d = now - lastAzimuth;
    if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    turned += Math.abs(d); lastAzimuth = now;
    const n = Math.floor(turned / (2 * Math.PI));
    if (n > laps) { laps = n; emit({ type: 'turns', n }); }
  };
  controls.addEventListener('change', onTurn);

  // ── 尺寸跟著舞台；直式（手機）視角拉寬才裝得下 ──
  const resize = new ResizeObserver(() => {
    const { clientWidth: w, clientHeight: h } = el;
    if (!w || !h) return;
    renderer.setSize(w, h); camera.aspect = w / h;
    camera.fov = w < h ? 52 : 35;
    camera.updateProjectionMatrix();
  });
  resize.observe(el);

  let first = true;
  renderer.setAnimationLoop((now) => {
    runTweens(now); controls.update(); renderer.render(world, camera);
    if (first) { first = false; if (onReady) onReady(); }
  });

  return {
    unmount() {
      renderer.setAnimationLoop(null);
      resize.disconnect();
      controls.removeEventListener('change', onTurn); controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      world.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) for (const m of [].concat(o.material)) m.dispose();
      });
      shades.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
