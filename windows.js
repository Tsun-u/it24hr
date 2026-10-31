// windows.js — 螢幕上的視窗：拖曳、縮小到工作列、關閉、置頂。關掉的視窗從桌面捷徑再開。
// 視窗住在橫跨兩個螢幕的 layer 上，座標共用，所以能從外接螢幕拖到筆電；螢幕以外（含中間的縫）用 clip-path 裁掉。
(function (root) {
  const PHONE = typeof matchMedia === 'function' ? matchMedia('(max-width: 720px)') : null;
  // 標題列至少留這麼寬在螢幕上，指頭才抓得回來（右端還有縮小、關閉兩顆鈕）
  const KEEP_VISIBLE = 120;
  // 離 (x, y) 最近的範圍；點在範圍裡距離是 0
  function nearest(areas, x, y) {
    const gap = (r) => Math.hypot(Math.max(r.x - x, 0, x - r.x - r.w), Math.max(r.y - y, 0, y - r.y - r.h));
    return areas.reduce((a, b) => gap(b) < gap(a) ? b : a);
  }
  class WindowManager {
    constructor(layer, taskbar, home) {
      this.layer = layer; this.taskbar = taskbar; this.home = home;
      this.windows = new Map(); this.z = 10;
      this.lastRects = this.screenRects();
      this.fitClip();
      new ResizeObserver(() => this.fitClip()).observe(layer);
    }
    exists(id) { return this.windows.has(id); }
    get(id) { return this.windows.get(id); }
    // 每個還顯示著的螢幕內側在 layer 上的矩形，以 laptop／monitor 為鍵
    screenRects() {
      const base = this.layer.getBoundingClientRect(); const rects = {};
      for (const screen of this.layer.parentElement.querySelectorAll('.screen')) {
        if (!screen.offsetParent) continue;
        const r = screen.getBoundingClientRect();
        rects[screen.classList.contains('laptop') ? 'laptop' : 'monitor'] =
          { x: r.left + screen.clientLeft - base.left, y: r.top + screen.clientTop - base.top, w: screen.clientWidth, h: screen.clientHeight };
      }
      return rects;
    }
    // 螢幕扣掉頂欄和工作列（兩條都蓋在視窗上面）剩下的範圍，鍵同 screenRects
    workAreas() {
      const areas = {};
      for (const [name, r] of Object.entries(this.screenRects())) {
        const screen = this.layer.parentElement.querySelector(`.screen.${name}`);
        const bar = (sel) => { const el = screen.querySelector(sel); return el ? el.offsetHeight : 0; };
        const top = bar('.os-top'), bottom = bar('.taskbar');
        areas[name] = { x: r.x, y: r.y + top, w: r.w, h: r.h - top - bottom };
      }
      return areas;
    }
    place(w, x, y) { w.el.style.left = `${x}px`; w.el.style.top = `${y}px`; }
    // 把視窗放到 (x, y)，但標題列要留在 area 裡
    placeReachable(w, x, y, area) {
      const barH = w.el.querySelector('.win-bar').offsetHeight;
      this.place(w, Math.min(area.x + area.w - KEEP_VISIBLE, Math.max(area.x - w.el.offsetWidth + KEEP_VISIBLE, x)),
        Math.min(area.y + area.h - barH, Math.max(area.y, y)));
    }
    // 標題列中間離哪台螢幕最近，就算在那台
    areaOf(w) {
      const areas = Object.values(this.workAreas()); if (!areas.length) return null;
      const el = w.el, barH = el.querySelector('.win-bar').offsetHeight;
      return nearest(areas, el.offsetLeft + el.offsetWidth / 2, el.offsetTop + barH / 2);
    }
    // 螢幕排法變了之後（平板轉向、開會），標題列跑出去的視窗夾回離它最近的那台螢幕；寄放中的視窗等螢幕回來再放
    keepReachable(w) {
      const area = this.areaOf(w);
      if (w.minimized || w.parked || !area) return;
      this.placeReachable(w, w.el.offsetLeft, w.el.offsetTop, area);
    }
    // 整個視窗放進所在的螢幕，比螢幕大就縮小（開會時筆電比視窗預設的大小還小，按鈕會被裁掉）
    fitIntoScreen(w) {
      const area = this.areaOf(w), el = w.el; if (!area) return;
      const width = Math.min(el.offsetWidth, area.w), height = Math.min(el.offsetHeight, area.h);
      Object.assign(el.style, { width: `${width}px`, height: `${height}px` });
      this.place(w, Math.min(area.x + area.w - width, Math.max(area.x, el.offsetLeft)), Math.min(area.y + area.h - height, Math.max(area.y, el.offsetTop)));
    }
    // 螢幕排法變了（開會、改視窗大小）：視窗跟著自己所在的螢幕走；螢幕收起來（開會時的外接螢幕）就先寄放到
    // 外接螢幕桌面現在的位置、記住原本的相對座標，螢幕回來再放回去。最後重算露出的範圍
    fitClip() {
      const was = this.lastRects, now = this.screenRects(); this.lastRects = now;
      const home = this.homeOffset();
      const within = (r, cx, cy) => r && cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
      for (const w of this.windows.values()) {
        if (w.parked && now[w.parked.screen]) {
          const r = now[w.parked.screen]; this.place(w, r.x + w.parked.x, r.y + w.parked.y); w.parked = null; continue;
        }
        const left = w.el.offsetLeft, top = w.el.offsetTop;
        const cx = left + w.el.offsetWidth / 2, cy = top + w.el.offsetHeight / 2;
        const name = Object.keys(was).find((k) => within(was[k], cx, cy));
        if (!name) continue;
        if (now[name]) this.place(w, left + now[name].x - was[name].x, top + now[name].y - was[name].y);
        else {
          w.parked = { screen: name, x: left - was[name].x, y: top - was[name].y };
          this.place(w, home.x + Math.min(w.parked.x, home.w - 80), home.y + Math.min(w.parked.y, home.h - 40));
        }
      }
      for (const w of this.windows.values()) { this.keepReachable(w); this.snapToScreen(w); }
      this.clipToScreens();
    }
    // 手機上兩台螢幕上下排：視窗撐滿中心點所在的那台（都不在就回外接螢幕），讓出上面的狀態列和下面的工作列
    snapToScreen(w) {
      if (!PHONE || !PHONE.matches) return;
      const rects = this.screenRects(); const el = w.el;
      const cx = el.offsetLeft + el.offsetWidth / 2, cy = el.offsetTop + el.offsetHeight / 2;
      const inside = (r) => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
      const name = Object.keys(rects).find(k => inside(rects[k])) || (rects.monitor ? 'monitor' : 'laptop');
      const r = this.workAreas()[name]; if (!r) return;
      Object.assign(el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
    }
    // 只露出每個還顯示著的螢幕內側；兩個矩形接成一個多邊形（回到起點再走第二個，接線寬度為零）
    clipToScreens() {
      const base = this.layer.getBoundingClientRect(); const pts = [];
      for (const screen of this.layer.parentElement.querySelectorAll('.screen')) {
        if (!screen.offsetParent) continue;
        const r = screen.getBoundingClientRect();
        const x0 = r.left + screen.clientLeft - base.left, y0 = r.top + screen.clientTop - base.top;
        const x1 = x0 + screen.clientWidth, y1 = y0 + screen.clientHeight;
        pts.push(`${x0}px ${y0}px`, `${x1}px ${y0}px`, `${x1}px ${y1}px`, `${x0}px ${y1}px`, `${x0}px ${y0}px`);
      }
      this.layer.style.clipPath = pts.length ? `polygon(${[...pts, pts[0]].join(',')})` : 'none';
    }
    // 外接螢幕桌面在 layer 上的位置；開視窗的座標都以它的左上角算
    homeOffset() {
      const a = this.home.getBoundingClientRect(), b = this.layer.getBoundingClientRect();
      return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height };
    }
    // icon：Icons 的名字，畫在標題列和工作列按鈕前面
    open({ id, title, icon, x = 40, y = 30, w = 520, h = 400, content, cls = '', onClose }) {
      if (this.windows.has(id)) { this.restore(id); this.focus(id); return this.windows.get(id); }
      const el = document.createElement('section');
      el.className = `win ${cls}`; el.dataset.id = id;
      const o = this.homeOffset();
      el.style.left = `${o.x + x}px`; el.style.top = `${o.y + y}px`; el.style.width = `${w}px`; el.style.height = `${h}px`;
      el.innerHTML = `<header class="win-bar"><span class="win-title"></span>
        <span class="win-btns"><button class="win-min" title="縮小">–</button><button class="win-close" title="關閉">×</button></span></header>
        <div class="win-body"></div><div class="win-resize" title="拉大小"></div>`;
      const titleEl = el.querySelector('.win-title'); titleEl.title = title;
      if (icon && root.Icons) titleEl.append(root.Icons.el(icon));
      titleEl.append(document.createTextNode(title));
      const body = el.querySelector('.win-body');
      if (content) body.append(content);
      const win = { id, title, icon, el, body, minimized: false, onClose };
      this.windows.set(id, win);
      this.layer.append(el);
      this.fitIntoScreen(win);
      this.snapToScreen(win);
      this.focus(id);
      el.addEventListener('pointerdown', () => this.focus(id));
      el.querySelector('.win-min').addEventListener('click', (e) => { e.stopPropagation(); this.minimize(id); });
      el.querySelector('.win-close').addEventListener('click', (e) => { e.stopPropagation(); this.close(id); });
      this.drag(win); this.resize(win);
      return win;
    }
    // 右下角拖角改大小；最小尺寸交給 CSS 的 min-width／min-height
    resize(win) {
      const grip = win.el.querySelector('.win-resize');
      let start = null;
      grip.addEventListener('pointerdown', (e) => {
        start = { px: e.clientX, py: e.clientY, w: win.el.offsetWidth, h: win.el.offsetHeight };
        grip.setPointerCapture(e.pointerId); e.stopPropagation(); this.focus(win.id);
      });
      grip.addEventListener('pointermove', (e) => {
        if (!start) return;
        win.el.style.width = `${start.w + e.clientX - start.px}px`;
        win.el.style.height = `${start.h + e.clientY - start.py}px`;
      });
      grip.addEventListener('pointerup', () => { start = null; });
      grip.addEventListener('pointercancel', () => { start = null; });
    }
    drag(win) {
      const bar = win.el.querySelector('.win-bar');
      let start = null;
      bar.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        start = { px: e.clientX, py: e.clientY, x: win.el.offsetLeft, y: win.el.offsetTop, areas: Object.values(this.workAreas()) };
        bar.setPointerCapture(e.pointerId);
      });
      // 標題列只停在指頭所在（不在螢幕上就取最近）那台螢幕的頂欄與工作列之間；螢幕之間的縫和外框會裁掉視窗
      bar.addEventListener('pointermove', (e) => {
        if (!start || !start.areas.length) return;
        const base = this.layer.getBoundingClientRect();
        const area = nearest(start.areas, e.clientX - base.left, e.clientY - base.top);
        this.placeReachable(win, start.x + e.clientX - start.px, start.y + e.clientY - start.py, area);
      });
      // 放開時對齊螢幕（手機上拖到筆電就換到筆電）
      const end = () => { if (start) this.snapToScreen(win); start = null; };
      bar.addEventListener('pointerup', end);
      bar.addEventListener('pointercancel', end);
    }
    focus(id) {
      const win = this.windows.get(id); if (!win) return;
      // 寄放在收起來的螢幕上（開會時的外接螢幕）又被叫出來：搬到看得到的螢幕
      if (win.parked && !this.screenRects()[win.parked.screen]) { win.parked = null; this.fitIntoScreen(win); }
      win.el.style.zIndex = ++this.z;
      for (const w of this.windows.values()) w.el.classList.toggle('active', w === win);
      this.renderTaskbar();
    }
    minimize(id) {
      const win = this.windows.get(id); if (!win) return;
      win.minimized = true; win.el.classList.add('minimized');
      this.renderTaskbar();
    }
    restore(id) {
      const win = this.windows.get(id); if (!win) return;
      win.minimized = false; win.el.classList.remove('minimized');
      this.renderTaskbar(); this.focus(id);
    }
    close(id) {
      const win = this.windows.get(id); if (!win) return;
      win.el.remove(); this.windows.delete(id);
      if (win.onClose) win.onClose();
      this.renderTaskbar();
    }
    setContent(id, node) {
      const win = this.windows.get(id); if (!win) return;
      win.body.replaceChildren(node);
    }
    renderTaskbar() {
      if (!this.taskbar) return;
      const slot = this.taskbar.querySelector('.task-windows'); slot.replaceChildren();
      for (const w of this.windows.values()) {
        const b = document.createElement('button');
        b.className = `task-win ${w.minimized ? 'is-min' : ''} ${w.el.classList.contains('active') ? 'is-active' : ''}`;
        if (w.icon && root.Icons) b.append(root.Icons.el(w.icon));
        b.append(document.createTextNode(w.title));
        b.addEventListener('click', () => w.minimized ? this.restore(w.id) : this.focus(w.id));
        slot.append(b);
      }
    }
  }
  root.WindowManager = WindowManager;
})(window);
