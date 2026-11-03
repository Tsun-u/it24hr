// bench-view.js — 3D 工作台的舞台（ES module，bench-loader.js 要用時才用 import() 載入）。
// 卡通成圖（三階平塗＋描邊）、可以自由旋轉、點場景裡的零件操作。mount 在指定元素裡建舞台、畫指定的場景，
// 第一幀畫好呼叫 onReady；場景要講話或回報進度用 onEvent；unmount 把 three.js 拆乾淨（主迴圈不管它）。
// 狀態不在這裡：場景拿 state 擺好位置，點擊翻成動作用 act 送出去（規則與狀態在 engine），拿回新狀態再播動畫
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SCENES = { ram: ramScene, printer: printerScene };

export function mount(el, { scene, state, act, onReady, onEvent } = {}) {
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

  // ── 補間動畫（smoothstep）、每一幀、計時（收工時一起清掉）──
  const tweens = [];
  const tween = (ms, step, done) => { tweens.push({ t0: performance.now(), ms, step, done }); };
  const runTweens = (now) => {
    for (const tw of [...tweens]) {
      const k = Math.min(1, (now - tw.t0) / tw.ms);
      tw.step(k * k * (3 - 2 * k));
      if (k >= 1) { tweens.splice(tweens.indexOf(tw), 1); if (tw.done) tw.done(); }
    }
  };
  const frames = [];
  const onFrame = (fn) => { frames.push(fn); };
  const timers = new Set();
  const later = (ms, fn) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };

  // ── 點擊：拖曳不算點；第一個碰到的東西才算，被擋住的點不到。場景可以先攔（intercept 回 true 就不往下傳）──
  const clickable = (obj, onClick, { keepsHeld = false } = {}) => { obj.userData.onClick = onClick; obj.userData.keepsHeld = keepsHeld; return obj; };
  let interceptor = null;
  const intercept = (fn) => { interceptor = fn; };
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
    if (interceptor && interceptor(target)) return;
    if (target) target.userData.onClick(hit);
  };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);

  const emit = (ev) => { if (onEvent) onEvent(ev); };
  const built = SCENES[scene]({ THREE, world, camera, controls, mesh, box, cylinder, at, tween, onFrame, later, clickable, intercept, hitArea, emit,
    say: (text) => emit({ type: 'say', text }) }, { state, act });

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
    runTweens(now);
    for (const fn of frames) fn(now);
    controls.update(); renderer.render(world, camera);
    if (first) { first = false; if (onReady) onReady(); }
  });

  return {
    debug: built && built.debug,
    camera, controls,
    unmount() {
      renderer.setAnimationLoop(null);
      for (const id of timers) clearTimeout(id);
      resize.disconnect();
      controls.removeEventListener('change', onTurn); controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointerup', onUp);
      world.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) for (const m of [].concat(o.material)) { if (m.map) m.map.dispose(); m.dispose(); }
      });
      shades.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}

// ── 加記憶體：君傑的桌機（前面朝 +z、側板在 +x）、螢幕、桌上的記憶體 ──
function ramScene(kit, { state: initial, act }) {
  const { THREE, world, mesh, box, cylinder, at, tween, onFrame, later, clickable, intercept, hitArea, say } = kit;
  let state = initial;
  // 送一個動作給規則：存回新狀態、講那句話
  const run = (action) => { const out = act(action); state = out.state; if (out.say) say(out.say); return out; };
  const moveTo = (obj, pos, quat, ms, done) => {
    const p0 = obj.position.clone(), q0 = obj.quaternion.clone();
    tween(ms, (k) => { obj.position.lerpVectors(p0, pos, k); obj.quaternion.slerpQuaternions(q0, quat, k); }, done);
  };
  const quat = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z));
  let busy = false;

  // ── 桌子與機殼：前後板整片，側板、頂板、底板夾在中間，每一面只屬於一塊板（疊在同一個平面會閃）──
  world.add(at(box(16, 0.3, 10, 0xc99a63), 0, -0.15, 0));
  const W = 2.2, H = 4.6, D = 4.8, T = 0.1;
  const SHELL = 0xd5dae1, DARK = 0x3a3f47, METAL = 0xaab2bc;
  const pc = new THREE.Group(); pc.position.y = H / 2 + 0.003; world.add(pc);   // 離桌面一點點，底邊的描邊才不會跟桌面搶
  const INNER_D = D - 2 * T;
  pc.add(at(box(T, H, INNER_D, SHELL), -W / 2 + T / 2, 0, 0));
  pc.add(at(box(W - 2 * T, T, INNER_D, SHELL), 0, H / 2 - T / 2, 0));
  pc.add(at(box(W - 2 * T, T, INNER_D, SHELL), 0, -H / 2 + T / 2, 0));
  pc.add(at(box(W, H, T, DARK), 0, 0, D / 2 - T / 2));
  pc.add(at(box(W, H, T, SHELL), 0, 0, -D / 2 + T / 2));
  for (const y of [H / 2 - 1.1, H / 2 - 1.45]) pc.add(at(box(W - 0.5, 0.25, 0.04, 0x2b2f36), 0, y, D / 2 + 0.01));
  // 背面：I/O 擋板、電源供應器和風扇、電源插座
  pc.add(at(box(0.5, 1.2, 0.03, METAL), -0.45, 0.9, -D / 2 - 0.01));
  const psuY = -H / 2 + 0.75;
  pc.add(at(box(W - 0.3, 1.1, 0.04, 0x8a929c), 0, psuY, -D / 2 - 0.02));
  pc.add(at(mesh(new THREE.TorusGeometry(0.36, 0.04, 8, 32), 0x2b2f36, { lines: false }), -0.35, psuY, -D / 2 - 0.05));
  pc.add(at(box(0.42, 0.32, 0.05, 0x2b2f36), 0.55, psuY, -D / 2 - 0.05));
  // 電源供應器的開關：翹板，壓下上半（I）是通電、壓下下半（O）是斷電
  const psuSwitch = at(box(0.16, 0.26, 0.05, 0x1f2328), -0.83, psuY, -D / 2 - 0.05); pc.add(psuSwitch);
  const ROCKER_TILT = 0.3;   // 正值：上半往機殼裡壓
  const rocker = at(box(0.11, 0.2, 0.05, 0x3a3f47), 0, 0, -0.04); rocker.rotation.x = state.psuOn ? ROCKER_TILT : -ROCKER_TILT; psuSwitch.add(rocker);
  rocker.add(at(box(0.02, 0.07, 0.01, 0xf3f4f6, { lines: false }), 0, 0.05, -0.03));   // I 的記號
  psuSwitch.add(hitArea(0.45, 0.45, 0.3));

  // ── 螢幕：君傑的報價單開著；左下角「開始」打開選單，選「關機」照順序關機 ──
  const SW = 512, SH = 320, BAR = 30;
  const START = { x: 0, y: SH - BAR, w: 86, h: BAR };
  const SHUTDOWN = { x: 6, y: SH - BAR - 52, w: 170, h: 40 };
  const SHEET = { x: 56, y: 70, w: 400, h: 180 };       // 報價單的視窗
  const SAVE_BTN = { x: 66, y: 104, w: 64, h: 24 };     // 視窗裡的「存檔」
  const PROMPT = { x: 96, y: 96, w: 320, h: 130 };      // 關機時問要不要儲存
  const PROMPT_BTNS = { promptSave: { x: 108, y: 186, w: 92, h: 30 }, promptDiscard: { x: 208, y: 186, w: 100, h: 30 }, promptCancel: { x: 316, y: 186, w: 88, h: 30 } };
  const QUOTE = [['品項', '數量', '單價', '小計'], ['收納箱', '20', '199', '3980'], ['衣架', '50', '25', '1250'], ['', '', '合計', '5230']];
  const DISK_CHECK_MS = 5000;
  let checkStart = null;   // 磁碟檢查開始的時間（畫面自己計時，跑完送 checkDone）
  const screenCanvas = document.createElement('canvas'); screenCanvas.width = SW; screenCanvas.height = SH;
  const screenTexture = new THREE.CanvasTexture(screenCanvas); screenTexture.colorSpace = THREE.SRGBColorSpace;
  function drawScreen(now = performance.now()) {
    const g = screenCanvas.getContext('2d');
    g.fillStyle = '#05070a'; g.fillRect(0, 0, SW, SH);
    if (state.powered && state.display && state.check) {
      const done = checkStart == null ? 0 : Math.min(1, (now - checkStart) / DISK_CHECK_MS);
      g.fillStyle = '#111827'; g.fillRect(0, 0, SW, SH);
      g.fillStyle = '#e5e7eb'; g.font = '22px sans-serif';
      g.fillText('上次沒有正常關機。', 40, 120); g.fillText('正在檢查磁碟，請不要關閉電源…', 40, 156);
      g.strokeStyle = '#e5e7eb'; g.lineWidth = 2; g.strokeRect(40, 190, 432, 20);
      g.fillRect(43, 193, 426 * done, 14);
    } else if (state.powered && state.display && state.shown == null && !state.sticks.some(s => ['A1', 'A2', 'B1', 'B2'].includes(s.where))) {
      // 一條記憶體都沒插：開不了機，螢幕全黑
    } else if (state.powered && state.display) {
      const sky = g.createLinearGradient(0, 0, 0, SH); sky.addColorStop(0, '#3b82f6'); sky.addColorStop(1, '#1e3a8a');
      g.fillStyle = sky; g.fillRect(0, 0, SW, SH - BAR);
      g.fillStyle = '#e5e7eb'; g.font = 'bold 30px sans-serif'; g.fillText('君傑的電腦', 24, 56);
      if (state.excel !== 'closed') {
        const { x, y, w, h } = SHEET;
        g.fillStyle = '#f8fafc'; g.fillRect(x, y, w, h);
        g.fillStyle = '#334155'; g.fillRect(x, y, w, 26);
        g.fillStyle = '#fff'; g.font = '15px sans-serif'; g.fillText(`報價單_最終版3.xlsx${state.excel === 'unsaved' ? ' *' : ''}`, x + 10, y + 18);
        g.fillStyle = '#e2e8f0'; g.fillRect(SAVE_BTN.x, SAVE_BTN.y, SAVE_BTN.w, SAVE_BTN.h);
        g.fillStyle = '#111827'; g.font = '14px sans-serif'; g.fillText('存檔', SAVE_BTN.x + 17, SAVE_BTN.y + 17);
        if (state.excel === 'saved') { g.fillStyle = '#15803d'; g.fillText('已存檔', SAVE_BTN.x + 76, SAVE_BTN.y + 17); }
        g.strokeStyle = '#cbd5e1'; g.lineWidth = 1;
        QUOTE.forEach((row, r) => row.forEach((text, c) => {
          g.strokeRect(x + 10 + c * 95, y + 66 + r * 26, 95, 26);
          g.fillStyle = '#111827'; g.font = '13px sans-serif'; g.fillText(text, x + 16 + c * 95, y + 84 + r * 26);
        }));
      }
      if (state.shown != null) {
        g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(140, 110, 230, 70);
        g.fillStyle = '#111827'; g.font = '22px sans-serif'; g.fillText('記憶體', 158, 140);
        g.font = 'bold 26px sans-serif'; g.fillText(state.shownText, 158, 170);
      }
      g.fillStyle = '#111827'; g.fillRect(0, SH - BAR, SW, BAR);
      g.fillStyle = state.menu ? '#2563eb' : '#374151'; g.fillRect(START.x, START.y, START.w, START.h);
      g.fillStyle = '#fff'; g.font = '18px sans-serif'; g.fillText('開始', 22, SH - 9);
      if (state.menu) {
        g.fillStyle = '#1f2937'; g.fillRect(0, SH - BAR - 120, 184, 120);
        g.fillStyle = '#9ca3af'; g.font = '16px sans-serif'; g.fillText('君傑', 14, SH - BAR - 92);
        g.fillStyle = '#374151'; g.fillRect(SHUTDOWN.x, SHUTDOWN.y, SHUTDOWN.w, SHUTDOWN.h);
        g.fillStyle = '#fff'; g.font = '20px sans-serif'; g.fillText('⏻  關機', SHUTDOWN.x + 14, SHUTDOWN.y + 27);
      }
      if (state.prompt) {
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, SW, SH - BAR);
        g.fillStyle = '#f8fafc'; g.fillRect(PROMPT.x, PROMPT.y, PROMPT.w, PROMPT.h);
        g.fillStyle = '#111827'; g.font = '16px sans-serif';
        g.fillText('報價單_最終版3.xlsx 還沒存。', PROMPT.x + 16, PROMPT.y + 34);
        g.fillText('關機前要儲存嗎？', PROMPT.x + 16, PROMPT.y + 60);
        for (const [key, label] of [['promptSave', '儲存'], ['promptDiscard', '不要儲存'], ['promptCancel', '取消']]) {
          const b = PROMPT_BTNS[key];
          g.fillStyle = key === 'promptSave' ? '#2563eb' : '#e2e8f0'; g.fillRect(b.x, b.y, b.w, b.h);
          g.fillStyle = key === 'promptSave' ? '#fff' : '#111827'; g.fillText(label, b.x + 12, b.y + 21);
        }
      }
      if (state.shuttingDown) { g.fillStyle = '#1e3a8a'; g.fillRect(0, 0, SW, SH); g.fillStyle = '#fff'; g.font = '26px sans-serif'; g.fillText('正在關機…', 190, 170); }
    }
    screenTexture.needsUpdate = true;
  }
  const monitor = new THREE.Group();
  monitor.add(at(box(3.2, 2.1, 0.12, 0x2b2f36), 0, 1.45, 0));
  const screen = at(new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.88), new THREE.MeshBasicMaterial({ map: screenTexture })), 0, 1.45, 0.065);
  monitor.add(screen, at(box(0.25, 0.4, 0.25, 0x2b2f36), 0, 0.2, -0.05), at(box(1.1, 0.06, 0.7, 0x2b2f36), 0, 0.03, 0));
  at(monitor, 3.4, 0.003, 1.3); monitor.rotation.y = 0.55; world.add(monitor);   // 右前方，正對預設視角

  // ── 螢幕線：從螢幕背後下到桌面，沿著機殼右邊的縫往後，接到背面的顯示卡接頭；點接頭拔掉／插回 ──
  pc.add(at(box(0.5, 0.5, 0.03, METAL), -0.55, -0.3, -D / 2 - 0.01));   // 顯示卡擋板
  pc.add(at(box(0.2, 0.1, 0.02, 0x111318, { lines: false }), -0.55, -0.3, -D / 2 - 0.03));   // 接孔
  monitor.updateMatrixWorld(); pc.updateMatrixWorld();
  const onMonitor = (x, y, z) => monitor.localToWorld(new THREE.Vector3(x, y, z));
  const onPc = (x, y, z) => pc.localToWorld(new THREE.Vector3(x, y, z));
  const deskY = 0.07;
  const cableRoute = [
    onMonitor(0.3, 0.75, -0.07), onMonitor(0.3, 0.4, -0.35), onMonitor(0.3, deskY, -0.65),
    new THREE.Vector3(2.3, deskY, 0.2), new THREE.Vector3(1.38, deskY, -0.5), new THREE.Vector3(1.36, deskY, -2.2),
    new THREE.Vector3(1.0, deskY, -2.85), new THREE.Vector3(0, deskY, -2.95),
  ];
  // 線尾兩種樣子：插著是沿背面爬上去、最後水平插進接孔；拔掉是垂下來躺在桌上
  const tailPlugged = [onPc(-0.55, -H / 2 + 0.3, -D / 2 - 0.45), onPc(-0.55, -0.9, -D / 2 - 0.32), onPc(-0.55, -0.3, -D / 2 - 0.3), onPc(-0.55, -0.3, -D / 2 - 0.16)];
  const tailLoose = [onPc(-0.2, -H / 2 + 0.08, -D / 2 - 0.7), onPc(-0.45, -H / 2 + 0.08, -D / 2 - 0.95), onPc(-0.65, -H / 2 + 0.08, -D / 2 - 1.1), onPc(-0.8, -H / 2 + 0.08, -D / 2 - 1.2)];
  const displayCable = mesh(new THREE.BufferGeometry(), 0x1f2328, { lines: false }); world.add(displayCable);
  const displayPlug = box(0.24, 0.16, 0.14, 0x1f2328); displayPlug.add(hitArea(0.6, 0.5, 0.6)); world.add(displayPlug);
  // loose：0 插著、1 拔掉，中間值是拔插途中
  function layCable(loose) {
    const tail = tailPlugged.map((p, i) => p.clone().lerp(tailLoose[i], loose));
    const curve = new THREE.CatmullRomCurve3([...cableRoute, ...tail], false, 'centripetal');
    displayCable.geometry.dispose(); displayCable.geometry = new THREE.TubeGeometry(curve, 120, 0.05, 8);
    const end = curve.getPointAt(1), dir = curve.getTangentAt(1);
    displayPlug.position.copy(end).addScaledVector(dir, 0.07);
    displayPlug.lookAt(end.clone().addScaledVector(dir, 1));
  }
  layCable(state.display ? 0 : 1);
  clickable(displayPlug, () => {
    if (busy) return;
    busy = true;
    const from = state.display ? 0 : 1;
    run({ type: 'display' });
    tween(450, (k) => layCable(from + (1 - 2 * from) * k), () => { busy = false; });
    sync();
  });
  const inside = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
  // 點螢幕：這裡只算點到哪一塊，發生什麼由規則決定
  clickable(screen, (hit) => {
    let target = 'other';
    if (hit && hit.uv) {
      const p = { x: hit.uv.x * SW, y: (1 - hit.uv.y) * SH };
      if (state.prompt) target = Object.keys(PROMPT_BTNS).find(k => inside(p, PROMPT_BTNS[k])) || 'other';
      else if (state.menu && inside(p, SHUTDOWN)) target = 'shutdown';
      else if (inside(p, SAVE_BTN)) target = 'save';
      else if (inside(p, START)) target = 'start';
    }
    const wasShutting = state.shuttingDown;
    run({ type: 'screen', target });
    if (state.shuttingDown && !wasShutting) later(1600, finishShutdown);
    sync();
  });
  function finishShutdown() { run({ type: 'shutdownDone' }); sync(); }

  // ── 正面的電源鈕與燈 ──
  const powerButton = at(cylinder(0.16, 0.06, METAL), 0, H / 2 - 0.5, D / 2 + 0.03); powerButton.rotation.x = Math.PI / 2; pc.add(powerButton);
  const led = at(box(0.12, 0.12, 0.04, 0x22c55e, { lines: false }), 0.45, H / 2 - 0.5, D / 2 + 0.02); pc.add(led);
  powerButton.add(at(hitArea(0.6, 0.3, 0.6), 0, 0, 0));
  clickable(powerButton, () => {
    tween(160, (k) => { powerButton.position.z = D / 2 + 0.03 - Math.sin(k * Math.PI) * 0.03; });
    run({ type: 'power' });
    sync();
  });
  // 磁碟檢查：畫面計時，跑完送 checkDone
  onFrame((now) => {
    if (state.check !== 'running') { checkStart = null; return; }
    if (checkStart == null) checkStart = now;
    if (now - checkStart >= DISK_CHECK_MS) { checkStart = null; run({ type: 'checkDone' }); sync(); return; }
    drawScreen(now);
  });

  // ── 斷電：拔掉電源線或關掉電源供應器的開關，做其中一個就算 ──
  clickable(psuSwitch, () => {
    run({ type: 'psu' });
    const tilt = state.psuOn ? ROCKER_TILT : -ROCKER_TILT;
    tween(150, (k) => { rocker.rotation.x = tilt * (2 * k - 1); });
    sync();
  });
  const plug = new THREE.Group();
  plug.add(box(0.36, 0.28, 0.36, 0x1f2328));
  const cablePath = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, -0.18), new THREE.Vector3(0, -0.2, -0.9), new THREE.Vector3(0.3, -psuY - H / 2 + 0.1, -1.6), new THREE.Vector3(1.2, -psuY - H / 2 + 0.1, -2.6)]);
  plug.add(mesh(new THREE.TubeGeometry(cablePath, 32, 0.06, 8), 0x1f2328, { lines: false }));
  plug.add(hitArea(0.8, 0.7, 0.8));
  const PLUG_IN = -D / 2 - 0.25, PLUG_OUT = PLUG_IN - 0.9;
  at(plug, 0.55, psuY, state.plugged ? PLUG_IN : PLUG_OUT); pc.add(plug);
  clickable(plug, () => {
    if (busy) return;
    busy = true;
    const from = plug.position.z;
    run({ type: 'plug' });
    const to = state.plugged ? PLUG_IN : PLUG_OUT;
    tween(400, (k) => { plug.position.z = from + (to - from) * k; }, () => { busy = false; });
    sync();
  });

  // ── 背面的三顆手轉螺絲：轉下來先放在機殼頂上；側板裝回去之後，點頂上的螺絲鎖回去 ──
  const screws = [];
  [1.5, 0, -1.5].forEach((y, i) => {
    const hole = new THREE.Vector3(W / 2 - 0.1, y, -D / 2 - 0.07);
    const backedOut = hole.clone().setZ(hole.z - 0.5);
    const onTop = new THREE.Vector3(0.5 - i * 0.35, H / 2 + 0.11, -D / 2 + 0.6);   // 躺在頂板上
    const corner = new THREE.Vector3(onTop.x, H / 2 + 0.45, backedOut.z);   // 先沿背面升到頂板上方，再往前放，不穿過機殼
    const out = state.screwsOut[i];
    const screw = at(cylinder(0.11, 0.14, METAL), ...(out ? onTop.toArray() : hole.toArray())); screw.rotation.x = Math.PI / 2; pc.add(screw); screws.push(screw);
    screw.add(hitArea(0.6, 0.4, 0.6));
    const stay = () => screw.quaternion.clone();
    clickable(screw, () => {
      if (screw.userData.moving || panel.userData.moving) return;
      const was = state.screwsOut[i];
      run({ type: 'screw', i });
      if (state.screwsOut[i] === was) return;
      screw.userData.moving = true;
      const settle = () => { screw.userData.moving = false; };
      if (!was) {
        tween(500, (k) => { screw.rotation.y = k * Math.PI * 6; screw.position.z = hole.z - k * 0.5; }, () =>
          moveTo(screw, corner, stay(), 250, () => moveTo(screw, onTop, stay(), 300, settle)));
        return;
      }
      moveTo(screw, corner, stay(), 300, () => moveTo(screw, backedOut, stay(), 250, () =>
        tween(500, (k) => { screw.rotation.y = (1 - k) * Math.PI * 6; screw.position.z = backedOut.z + k * 0.5; }, settle)));
    });
  });

  // ── 側板（+x 那面）：螺絲拆完才拿得下來，拆下來倒在右後方的桌上；點倒著的側板可以裝回去 ──
  const panel = at(box(T, H - 0.02, INNER_D - 0.02, SHELL), W / 2 - T / 2, 0, 0); pc.add(panel);
  for (let i = 0; i < 5; i++) panel.add(at(box(0.02, 0.06, 1.4, 0x9aa3ad, { lines: false }), T / 2 + 0.01, 1.2 - i * 0.18, -1.2));
  // 滑出（邊滑邊抬高一點，跨過桌上的螢幕線）再倒下；倒的位置不壓到螢幕和桌上的記憶體。k 從 0 到 1 是拆，倒著放就是裝
  const PANEL = { x0: W / 2 - T / 2, out: W / 2 - T / 2 + 0.9, lift: 0.16, flatX: W / 2 + 0.4 + H / 2, flatY: -H / 2 + T / 2, flatZ: -3 };
  const slidePanel = (k) => { panel.position.set(PANEL.x0 + (PANEL.out - PANEL.x0) * k, PANEL.lift * Math.min(1, k * 4), 0); panel.rotation.z = 0; };
  const tipPanel = (k) => {
    panel.position.set(PANEL.out + (PANEL.flatX - PANEL.out) * k, PANEL.lift + (PANEL.flatY - PANEL.lift) * k, PANEL.flatZ * k);
    panel.rotation.z = (Math.PI / 2) * k;
  };
  if (state.panelOff) tipPanel(1);
  clickable(panel, () => {
    if (panel.userData.moving) return;
    const was = state.panelOff;
    run({ type: 'panel', holding: !!held });
    if (state.panelOff === was) return;
    panel.userData.moving = true;
    if (state.panelOff) tween(350, slidePanel, () => tween(550, tipPanel, () => { panel.userData.moving = false; }));
    else tween(550, (k) => tipPanel(1 - k), () => tween(350, (k) => slidePanel(1 - k), () => { panel.userData.moving = false; }));
  });

  // ── 主機板、散熱器、四個記憶體插槽（藍色 A2、B2 是一組）──
  const boardX = -W / 2 + T + 0.03;
  pc.add(at(box(0.05, 3.7, 3.9, 0x2f7d4f), boardX, 0.15, -0.25));
  pc.add(at(box(0.7, 1.0, 1.0, METAL), boardX + 0.38, 0.9, -0.7));
  const KEY = 0.17;   // 插槽凸點離中心的距離（DDR4 的缺口不在正中間）
  const SLOTS = [['A1', 0.5, 0x2b2f36], ['A2', 0.72, 0x6b8fd6], ['B1', 0.94, 0x2b2f36], ['B2', 1.16, 0x6b8fd6]];
  const slotX = boardX + 0.1, seatX = slotX + 0.25, slotY = 0.9;
  const slots = {};
  const latch = (id, open) => { for (const l of slots[id].latches) l.rotation.z = Math.sign(l.position.y) * 0.5 * open; };
  for (const [id, z, color] of SLOTS) {
    const slot = at(box(0.16, 1.5, 0.09, color), slotX, slotY, z); pc.add(slot);
    slot.add(at(box(0.06, 0.05, 0.1, 0xe5e7eb, { lines: false }), 0.07, KEY, 0));   // 凸點
    const latches = [-0.79, 0.79].map((y) => { const l = at(box(0.2, 0.08, 0.1, 0xf3f4f6), 0, y, 0); slot.add(l); return l; });
    slots[id] = { slot, z, latches };
    slot.add(at(hitArea(0.5, 1.7, 0.2), 0.18, 0, 0));
    clickable(slot, (hit) => insertInto(aimedSlot(hit) || id), { keepsHeld: true });
  }
  // 插槽的點擊範圍往外凸（手機才點得到），斜著看時前一個的範圍會擋到後一個：
  // 從相機沿點擊方向延伸到插槽那個平面，看落在哪個插槽最近
  function aimedSlot(hit) {
    if (!hit) return null;
    const from = pc.worldToLocal(kit.camera.position.clone()), to = pc.worldToLocal(hit.point.clone());
    const dir = to.sub(from); if (Math.abs(dir.x) < 1e-6) return null;
    const t = (slotX - from.x) / dir.x; const y = from.y + dir.y * t, z = from.z + dir.z * t;
    if (Math.abs(y - slotY) > 0.85) return null;
    return SLOTS.reduce((best, [sid, sz]) => (Math.abs(sz - z) < Math.abs(slots[best].z - z) ? sid : best), SLOTS[0][0]);
  }

  // 記憶體：高度朝 +x（金手指在 -x 那邊插進插槽），長度沿 y，厚度沿 z；缺口在 y = notch（規格在 bench-ram.js，世代不同位置不同），
  // SO-DIMM 短一截。晶片那面貼一張貼紙，印世代、速度（跟真的記憶體一樣），拆開側板就看得到
  function stickerTexture(lines) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 80;
    const g = c.getContext('2d');
    g.fillStyle = '#f8fafc'; g.fillRect(0, 0, 256, 80);
    g.fillStyle = '#111827'; g.font = 'bold 30px sans-serif'; g.fillText(lines[0], 10, 34);
    g.font = '24px sans-serif'; g.fillText(lines[1], 10, 68);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function ramStick({ form, notch, sticker }) {
    const len = form === 'SO-DIMM' ? 0.8 : 1.33, half = len / 2, gap = 0.03;
    const notchAt = Math.max(-half + 0.08, Math.min(half - 0.08, notch));
    const g = new THREE.Group();
    g.add(box(0.34, len, 0.03, 0x2e6b3f));
    const chips = form === 'SO-DIMM' ? 2 : 4;
    for (let i = 0; i < chips; i++) g.add(at(box(0.14, 0.22, 0.02, 0x1f2328), 0.04, -half + 0.22 + i * ((len - 0.44) / Math.max(1, chips - 1)), 0.025));
    const labelLen = Math.min(0.62, len - 0.16);
    const label = at(new THREE.Mesh(new THREE.PlaneGeometry(labelLen, labelLen * 80 / 256), new THREE.MeshBasicMaterial({ map: stickerTexture(sticker) })), 0.05, 0, 0.037);
    label.rotation.z = Math.PI / 2; g.add(label);   // 字順著記憶體的長邊
    const gold = (y0, y1) => at(box(0.05, y1 - y0, 0.035, 0xd4a72c, { lines: false }), -0.15, (y0 + y1) / 2, 0);
    g.add(gold(-half, notchAt - gap), gold(notchAt + gap, half));
    g.userData.hit = hitArea(0.8, len + 0.3, 0.5); g.add(g.userData.hit);
    return g;
  }
  // 放大的點擊範圍只給桌上、手上的記憶體（手機才點得到）；插在槽上的不開，不然會蓋到隔壁的插槽。點插槽本身就能拔
  const reachable = (id, on) => { sticks[id].userData.hit.layers.set(on ? 0 : 1); };
  // 桌上放記憶體的地方（右前方，避開側板倒下的位置），好幾條就往 +x 排開
  const deskSpot = at(new THREE.Group(), W / 2 + 1.6, 0.05, D / 2 + 0.8); world.add(deskSpot);
  const FLOAT = new THREE.Vector3(W / 2 + 0.6, slotY, 0.85);   // 機殼側邊外面、正對插槽（機殼的座標），側板還在也看得到
  const LYING = () => quat(-Math.PI / 2, 0, Math.PI);           // 平躺，晶片朝上
  let held = null;
  const flips = {};   // 每條拿在手上的方向：true 是反的（缺口對不上）；新拿起來的先是反的，拔出來的照插著時的方向
  const flipped = () => flips[held] ?? true;
  const standing = () => quat(flipped() ? Math.PI : 0, 0, 0);
  const sticks = {};
  const stickOf = (id) => state.sticks.find(s => s.id === id);
  const inSlot = (s) => ['A1', 'A2', 'B1', 'B2'].includes(s.where);
  const looseIds = () => state.sticks.filter(s => s.where === 'hand' || s.where === 'desk').map(s => s.id);
  // 桌上的記憶體從右前角往主機前面排（畫面上往左上），多條也都在鏡頭裡
  const deskPos = (id) => new THREE.Vector3(-0.6 * Math.max(0, looseIds().indexOf(id)), 0, 0);
  for (const s of state.sticks) {
    if (s.where === 'box') continue;
    const obj = ramStick(s); sticks[s.id] = obj;
    if (inSlot(s)) { at(obj, seatX, slotY, slots[s.where].z); pc.add(obj); }
    else { obj.position.copy(deskPos(s.id)); obj.quaternion.copy(LYING()); deskSpot.add(obj); }
    clickable(obj, () => onStick(s.id), { keepsHeld: true });
    reachable(s.id, !inSlot(s));
  }
  for (const [id] of SLOTS) latch(id, state.sticks.some(s => s.where === id) ? 0 : 1);

  function onStick(id) {
    if (busy) return;
    const s = stickOf(id);
    if (inSlot(s)) { if (state.powered) run({ type: 'look', stick: id }); else pullOut(id); return; }
    if (held === id) { busy = true; flips[id] = !flipped(); moveTo(sticks[id], FLOAT, standing(), 400, () => { busy = false; }); return; }
    if (held) putBack();
    held = id; busy = true;
    pc.attach(sticks[id]);
    moveTo(sticks[id], FLOAT, standing(), 600, () => { busy = false; run({ type: 'pick', stick: id }); });
  }
  function putBack() {
    const id = held; held = null; busy = true;
    deskSpot.attach(sticks[id]);
    moveTo(sticks[id], deskPos(id), LYING(), 500, () => { busy = false; });
  }
  // 拿著記憶體時點插槽和記憶體以外的地方：放回桌上
  intercept((target) => {
    if (!held || busy || (target && target.userData.keepsHeld)) return false;
    putBack(); say('記憶體放回桌上了。');
    return true;
  });
  function pullOut(id) {
    const slot = stickOf(id).where;
    const out = run({ type: 'pull', stick: id });
    if (!out.events.includes('pulled')) return;
    if (held) putBack();
    busy = true; held = id; flips[id] = false; reachable(id, true);
    tween(250, (k) => latch(slot, k), () =>
      moveTo(sticks[id], new THREE.Vector3(seatX + 1.0, slotY, slots[slot].z), standing(), 350, () =>
        moveTo(sticks[id], FLOAT, standing(), 450, () => { busy = false; })));
  }
  function insertInto(slotId) {
    if (busy) return;
    const occupant = state.sticks.find(s => s.where === slotId);
    if (occupant && !held) { onStick(occupant.id); return; }
    const out = run({ type: 'insert', stick: held || undefined, slot: slotId, flipped: flipped() });
    const s = slots[slotId];
    if (out.events.includes('seated')) {
      const id = held; const pose = standing(); held = null; busy = true; reachable(id, false);
      moveTo(sticks[id], new THREE.Vector3(seatX + 1.0, slotY, s.z), pose, 350, () => moveTo(sticks[id], new THREE.Vector3(seatX, slotY, s.z), pose, 450, () =>
        tween(250, (k) => latch(slotId, 1 - k), () => { busy = false; })));
      return;
    }
    const bounce = ['refused:flipped', 'refused:gen', 'refused:form'].find(e => out.events.includes(e));
    if (!bounce || !held) return;
    const id = held; busy = true;
    moveTo(sticks[id], new THREE.Vector3(seatX + 1.0, slotY, s.z), standing(), 350, () => moveTo(sticks[id], new THREE.Vector3(seatX + 0.32, slotY, s.z), standing(), 450, () =>
      tween(320, (k) => { sticks[id].position.z = s.z + Math.sin(k * Math.PI * 6) * 0.04; }, () =>
        moveTo(sticks[id], FLOAT, standing(), 450, () => { busy = false; }))));
  }

  // 燈和螢幕照狀態更新
  function sync() { led.material.color.set(state.powered ? 0x22c55e : 0x4b5563); drawScreen(); }
  // 收工時還沒跑完的關機，打開時補完（磁碟檢查由 onFrame 重新計時）
  if (state.shuttingDown) finishShutdown();
  sync();
  onFrame((now) => { if (held && !busy) sticks[held].position.y = FLOAT.y + Math.sin(now / 350) * 0.05; });

  return { debug: { state: () => state, held: () => held, parts: { plug, panel, powerButton, screen, screws, slots, sticks, displayPlug, psuSwitch, monitor, pc } } };
}


// ── 印表機（換碳粉匣，規則在 bench-printer.js）：淑芬那台 MP LazyJet C8763。正面外殼只剩「MP Lazy」，轉到背面才看得到財產貼紙。
// 點前蓋開關；開著時點舊碳粉匣抽出來；桌上的新碳粉匣點一下拿起來、拿著再點是搖、點橘色拉條撕封條、拿著點印表機開口裝進去，
// 點空白處放回桌上；裝在裡面的點一下拉出來；上面綠色鈕印測試頁 ──
function printerScene(kit, { state: initial, act }) {
  const { THREE, world, controls, box, cylinder, at, tween, onFrame, clickable, intercept, hitArea, say } = kit;
  let state = initial;
  const run = (action) => { const out = act(action); state = out.state; if (out.say) say(out.say); return out; };
  const moveTo = (obj, pos, ms, done) => { const p0 = obj.position.clone(); tween(ms, (k) => obj.position.lerpVectors(p0, pos, k), done); };
  const v = (x, y, z) => new THREE.Vector3(x, y, z);
  let busy = false;
  const label = (lines, { w = 256, h = 96, bg = '#f8fafc', fg = '#111827', size = 34 } = {}) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg;
    lines.forEach((line, i) => { g.font = `${i ? '' : 'bold '}${i ? size * 0.7 : size}px sans-serif`; g.fillText(line, 12, size + i * size * 1.05); });
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const plane = (w, h, texture) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: texture }));

  // ── 桌子、印表機本體（正面朝 +z）──
  world.add(at(box(16, 0.3, 10, 0xc99a63), 0, -0.15, 0));
  const PW = 4.2, PH = 2.4, PD = 3.4, BODY = 0xe5e7eb;
  const printer = new THREE.Group(); printer.position.y = PH / 2 + 0.003; world.add(printer);
  printer.add(at(box(PW, PH / 2, PD, BODY), 0, -PH / 4, 0));                   // 下半（紙匣）
  printer.add(at(box(PW, PH / 2, PD - 0.9, BODY), 0, PH / 4, -0.45));          // 上半（前面空一塊給前蓋和碳粉匣）
  // 前蓋後面是一個凹槽：深色的後牆＋左右兩片側板，碳粉匣放在中間看得到、點得到（後牆只是背景，點擊穿過去）
  const cavity = at(box(PW - 0.6, PH / 2 - 0.2, 0.1, 0x2b2f36), 0, PH / 4, PD / 2 - 0.9);
  cavity.traverse((o) => { o.raycast = () => {}; }); printer.add(cavity);
  for (const side of [-1, 1]) printer.add(at(box(0.3, PH / 2, 0.9, BODY), side * (PW / 2 - 0.15), PH / 4, PD / 2 - 0.45));
  printer.add(at(box(PW, 0.08, 0.9, BODY), 0, PH / 2 - 0.04, PD / 2 - 0.45));   // 前面那塊的頂板：從上面看不到裡面
  // 正面的型號磨掉了：「MP La」還看得出來，後面的「zy」糊成一團（淑芬也只記得「MP-La……什麼的」）。
  // 糊的效果用淡淡的錯位疊印做，不用 canvas filter（舊版 Safari 不支援）
  const wornModel = () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 68;
    const g = c.getContext('2d'); g.fillStyle = '#e5e7eb'; g.fillRect(0, 0, c.width, c.height);
    g.font = 'bold 44px sans-serif'; g.fillStyle = '#9ca3af'; g.fillText('MP La', 12, 44);
    const x = 12 + g.measureText('MP La').width;
    g.globalAlpha = 0.045;
    for (const dx of [-6, -4, -2, 0, 2, 4, 6]) for (const dy of [-4, -2, 0, 2, 4]) g.fillText('zy', x + dx, 44 + dy);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  };
  const front = plane(1.6, 0.42, wornModel());
  printer.add(at(front, -0.9, -PH / 4, PD / 2 + 0.01));
  const sticker = plane(1.4, 0.55, label(['財產標籤', '…Jet C8763'], { w: 256, h: 100, size: 36 }));
  sticker.rotation.y = Math.PI; printer.add(at(sticker, 0.6, -PH / 4, -PD / 2 - 0.01));
  const led = at(box(0.14, 0.06, 0.14, 0x22c55e, { lines: false }), PW / 2 - 0.9, PH / 2 + 0.03, PD / 2 - 1.2); printer.add(led);
  const printBtn = clickable(at(cylinder(0.16, 0.08, 0x16a34a), PW / 2 - 0.45, PH / 2 + 0.04, PD / 2 - 1.2), () => print());
  printBtn.add(hitArea(0.6, 0.4, 0.6)); printer.add(printBtn);

  // ── 前蓋：底邊是軸，往外翻開 ──
  const hinge = new THREE.Group(); hinge.position.set(0, 0, PD / 2 - 0.05); printer.add(hinge);
  const cover = clickable(at(box(PW - 0.1, PH / 2 - 0.05, 0.1, BODY), 0, PH / 4, 0), () => toggleCover());
  hinge.add(cover);
  const coverAngle = () => (state.cover === 'open' ? 1.45 : 0);
  hinge.rotation.x = coverAngle();
  function toggleCover() {
    if (busy) return;
    const from = hinge.rotation.x; run({ type: state.cover === 'open' ? 'close' : 'open' }); const to = coverAngle();
    busy = true; tween(400, (k) => { hinge.rotation.x = from + (to - from) * k; }, () => { busy = false; sync(); });
  }

  // ── 碳粉匣：長邊沿 x，從正面推進前蓋後面的空間。舊的放裡面，新的照送來的順序排在桌子右邊 ──
  const SLOT = v(0, printer.position.y + PH / 4, PD / 2 - 0.5);            // 裝在裡面的位置（世界座標）
  const OLD_OUT = v(-5.2, 0.28, 2.6);
  const HOLD = v(0, 4.2, 3.4);
  const deskSpot = (i) => v(5.1, 0.28, -3.8 + i * 1.1);
  const cartBox = (color) => box(PW - 0.9, 0.45, 0.55, color);
  // 碳粉匣的點擊範圍：比本體大一圈就好。太高的話，從斜上方看，前面那盒的範圍會蓋住後面那盒（點 C 拿到 D）
  const cartHit = () => hitArea(PW - 0.6, 0.6, 0.7);
  const SERIES_COLOR = { A: 0x7c3aed, B: 0x2563eb, C: 0x0f766e, D: 0xb45309, E: 0xbe123c };
  // 原本裝在裡面那盒：跟這台吃的系列同一款，所以同色（不貼系列標籤，型號還是要自己查）
  const old = clickable(at(cartBox(SERIES_COLOR[state.oldSeries] || 0x4b5563), SLOT.x, SLOT.y, SLOT.z), () => pullOld());
  old.add(cartHit());
  world.add(old);
  if (state.old === 'out') old.position.copy(OLD_OUT);
  function pullOld() {
    if (busy || state.old !== 'in') return;
    run({ type: 'pullOld' }); if (state.old !== 'out') return;
    busy = true; moveTo(old, v(SLOT.x, SLOT.y, SLOT.z + 1.6), 300, () => moveTo(old, OLD_OUT, 500, () => { busy = false; }));
  }
  const carts = {};
  let held = null;
  for (const c of state.carts) {
    const g = clickable(new THREE.Group(), () => onCart(c.id)); g.add(cartBox(SERIES_COLOR[c.series] || 0x4b5563));
    const tag = plane(0.7, 0.4, label([`${c.series} 系列`], { w: 160, h: 90, size: 40 })); tag.rotation.x = -Math.PI / 2; g.add(at(tag, -0.6, 0.23, 0));
    // 封條拉條在右端（鏡頭看得到的那一頭）。放在正面的話，從斜前方點碳粉匣中間會先點到它的範圍，搖變成撕
    const seal = clickable(at(box(0.06, 0.14, 0.34, 0xf97316), (PW - 0.9) / 2 + 0.03, 0, 0), () => { if (!busy) { run({ type: 'peel', cart: c.id }); sync(); } });
    seal.add(at(hitArea(0.5, 0.45, 0.6), 0.2, 0, 0)); seal.name = 'seal'; g.add(seal);
    // 撕掉之後拉條藏起來，看不見的範圍也不能再擋點擊（不然之後點碳粉匣都會點到它）
    seal.traverse((o) => { const base = o.raycast.bind(o); o.raycast = (r, hits) => { if (cartState(c.id).seal) base(r, hits); }; });
    g.add(cartHit());
    carts[c.id] = g; world.add(g);
  }
  const cartState = (id) => state.carts.find(c => c.id === id);
  function placeCarts() {
    state.carts.forEach((c, i) => {
      const g = carts[c.id]; g.getObjectByName('seal').visible = c.seal;
      if (c.id === held) return;
      g.position.copy(c.at === 'printer' ? SLOT : deskSpot(i));
    });
  }
  function onCart(id) {
    if (busy) return;
    const c = cartState(id);
    if (c.at === 'printer') { if (state.cover !== 'open') { say('前蓋還關著。'); return; } run({ type: 'pull', cart: id }); placeCarts(); return; }
    if (held !== id) { putBack(); held = id; busy = true; moveTo(carts[id], HOLD, 350, () => { busy = false; }); say('拿起碳粉匣：再點一下是搖，點橘色拉條撕封條，點印表機開口裝進去。'); return; }
    run({ type: 'shake', cart: id });
    busy = true; const g = carts[id]; tween(260, (k) => { g.position.x = HOLD.x + Math.sin(k * Math.PI * 4) * 0.35; }, () => { g.position.x = HOLD.x; busy = false; });
  }
  function putBack() { if (!held) return; const id = held; held = null; const i = state.carts.findIndex(c => c.id === id); moveTo(carts[id], deskSpot(i), 350); }
  // 印表機開口：拿著碳粉匣點這裡＝裝進去（系列不對推不進去，彈回來）
  // 只有手上拿著碳粉匣、前蓋開著時才點得到，不然會擋住前蓋和裡面的碳粉匣
  const mouth = clickable(hitArea(PW - 0.4, PH / 2, 1.4), () => insert());
  mouth.raycast = function (r, hits) { if (held && state.cover === 'open') THREE.Mesh.prototype.raycast.call(this, r, hits); };
  mouth.position.copy(v(SLOT.x, SLOT.y, SLOT.z + 0.4)); world.add(mouth);
  function insert() {
    if (busy || !held) return;
    const id = held; const out = run({ type: 'insert', cart: id });
    if (cartState(id).at === 'printer') { held = null; busy = true; moveTo(carts[id], v(SLOT.x, SLOT.y, SLOT.z + 1.2), 300, () => moveTo(carts[id], SLOT, 350, () => { busy = false; })); return; }
    if (out.events.includes('refused')) { busy = true; moveTo(carts[id], v(SLOT.x, SLOT.y, SLOT.z + 1.3), 300, () => moveTo(carts[id], HOLD, 350, () => { busy = false; })); }
  }
  intercept((target) => { if (held && !target) { putBack(); return true; } return false; });

  // ── 測試頁：從上面的出紙口滑出來，白紙或印好的 ──
  const PAGES = { ok: ['TEST PAGE', 'MP LazyJet C8763', '■■■■■■■■'], faint: ['TEST PAGE', 'MP LazyJet C8763'], blank: [] };
  let paper = null;
  function print() {
    if (busy) return;
    run({ type: 'print' }); sync();
    if (!state.page || state.cover === 'open') return;
    if (paper) world.remove(paper);
    const fg = state.page === 'faint' ? '#d1d5db' : '#111827';
    paper = plane(1.5, 2.0, label(PAGES[state.page], { w: 210, h: 280, bg: '#ffffff', fg, size: 26 }));
    paper.rotation.x = -Math.PI / 2; paper.position.set(0, PH + 0.03, -0.6); world.add(paper);
    busy = true; moveTo(paper, v(0, PH + 0.03, 1.2), 900, () => { busy = false; });
  }

  // ── 轉到背面看到貼紙：相機繞到印表機後面（方位角超過約 135°）就記下來 ──
  onFrame(() => { if (!state.sticker && Math.abs(controls.getAzimuthalAngle()) > 2.35) run({ type: 'sawBack' }); });

  function sync() { led.material.color.set(state.cover === 'open' ? 0xdc2626 : 0x22c55e); placeCarts(); }
  sync();
  return { debug: { state: () => state, held: () => held, parts: { printer, cover, hinge, old, carts, mouth, printBtn, sticker } } };
}
