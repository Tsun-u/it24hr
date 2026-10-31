// homemenu.js — 下班選單：離開公司先選吃的（順路買／外送，21:00 後只剩宵夜，份數不限）、要不要帶公司筆電，按「回家」進茶几。
(function (root) {
  const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  // 茶几上的東西（圖放 assets/<dir>）；沒有圖的先用圖示
  function propImg(dir, id, name, icon) {
    const img = h('img', 'prop-img'); img.alt = name; img.src = `assets/${dir}/${id}.png`;
    img.addEventListener('error', () => { const ph = h('span', 'prop-img prop-ph'); ph.innerHTML = Icons.html(icon); img.replaceWith(ph); }, { once: true });
    return img;
  }
  const foodImg = (id) => propImg('food', id, Home.FOODS[id].name, 'utensils');
  const leisureImg = (id) => propImg('leisure', id, Home.LEISURE[id].name, Home.LEISURE[id].icon);

  function open(host, engine) {
    const home = engine.home, menu = Home.MENUS[home.menu];
    const order = {};
    let channel = 'pickup', laptop = false;
    const leisure = new Set();
    const screen = h('section', `home-menu menu-${home.menu}`);
    const head = h('header', 'hm-head');
    head.append(h('h2', '', `${hhmm(home.leftAt)} 下班`),
      h('p', 'muted', home.forced ? '警衛來巡了：「還不回家？要鎖門了。」' : home.menu === 'dinner' ? '先想想晚餐吃什麼。' : '這個時間只剩宵夜了。'));
    const carry = h('label', 'hm-laptop'); const box = h('input'); box.type = 'checkbox';
    box.addEventListener('change', () => { laptop = box.checked; });
    carry.append(box, document.createTextNode('把公司筆電帶回家'));
    // 下班想做什麼：可以複選，選了的擺上茶几
    const fun = h('div', 'hm-fun'); fun.append(h('span', '', '下班想做什麼'));
    for (const [id, item] of Object.entries(Home.LEISURE)) {
      const chip = h('button', 'hm-chip', item.act);
      chip.addEventListener('click', () => { leisure.has(id) ? leisure.delete(id) : leisure.add(id); chip.classList.toggle('on', leisure.has(id)); });
      fun.append(chip);
    }
    const tabs = h('nav', 'hm-tabs'), panel = h('div', 'hm-panel');
    const cart = h('p', 'hm-cart'), err = h('p', 'hm-err'), go = h('button', 'btn primary hm-go', '回家');
    const refresh = () => {
      const problem = Home.checkOrder(home.menu, channel, order);
      cart.textContent = Home.describe(order); err.textContent = problem || ''; go.disabled = !!problem;
      for (const n of panel.querySelectorAll('[data-count]')) n.textContent = order[n.dataset.count] || 0;
    };
    const counter = (id) => {
      const wrap = h('span', 'hm-count');
      const less = h('button', 'hm-btn', '－'), more = h('button', 'hm-btn', '＋'), n = h('b'); n.dataset.count = id;
      less.addEventListener('click', () => { order[id] = Math.max(0, (order[id] || 0) - 1); refresh(); });
      more.addEventListener('click', () => { order[id] = (order[id] || 0) + 1; refresh(); });
      wrap.append(less, n, more); return wrap;
    };
    // 順路買：店家的背景圖上擺東西（店名、品名由程式寫）；外送：APP 樣的清單
    const show = () => {
      for (const b of tabs.children) b.classList.toggle('on', b.dataset.ch === channel);
      for (const id of Object.keys(order)) if (!menu[channel].items.includes(id)) delete order[id];   // 換一組買法，另一組的就不買了
      panel.replaceChildren();
      const ch = menu[channel];
      if (channel === 'pickup') {
        // 店家的圖照 16:9 縮到放得下，東西擺在 spots 的位置；字的大小跟著舞台寬度走（1em＝舞台寬的 1%）
        const stage = h('div', 'hm-stage'); stage.style.backgroundImage = `url(assets/bg/${ch.bg}.webp)`;
        for (const [text, x] of ch.signs || []) { const sign = h('span', 'hm-sign', text); sign.style.left = `${x}%`; stage.append(sign); }
        for (const id of ch.items) {
          const spot = h('div', 'hm-spot'); const [x, y] = ch.spots[id];
          Object.assign(spot.style, { left: `${x}%`, top: `${y}%` });
          spot.append(foodImg(id), h('span', 'hm-name', Home.FOODS[id].name), counter(id)); stage.append(spot);
        }
        const fit = () => {
          const w = Math.min(panel.clientWidth, panel.clientHeight * 16 / 9);
          Object.assign(stage.style, { width: `${w}px`, height: `${w * 9 / 16}px`, fontSize: `${w / 100}px` });
        };
        new ResizeObserver(fit).observe(panel);
        panel.append(stage); fit();
      } else {
        const app = h('div', 'hm-app'); app.append(h('p', 'hm-app-title', home.menu === 'dinner' ? '外送：晚餐' : '外送：宵夜'));
        for (const id of ch.items) {
          const row = h('div', 'hm-row'); const add = ch.addOn && ch.addOn.drinks.includes(id);
          row.append(foodImg(id), h('span', 'hm-name', Home.FOODS[id].name + (add ? '（加購，要點滷味或鹹酥雞）' : '')), counter(id));
          app.append(row);
        }
        panel.append(app);
      }
      refresh();
    };
    for (const [ch, label] of [['pickup', `順路買・${menu.pickup.place}`], ['delivery', '外送']]) {
      const b = h('button', 'hm-tab', label); b.dataset.ch = ch; b.addEventListener('click', () => { channel = ch; show(); }); tabs.append(b);
    }
    go.addEventListener('click', () => { if (engine.goHome({ channel, order, laptop, leisure: [...leisure] })) screen.remove(); });
    const foot = h('footer', 'hm-foot'); foot.append(cart, err, go);
    const opts = h('div', 'hm-opts'); opts.append(carry, fun);
    screen.append(head, opts, tabs, panel, foot);
    host.append(screen);
    show();
    return screen;
  }

  root.HomeMenu = { open, foodImg, leisureImg };
})(window);
