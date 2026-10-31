// home.js — 茶几：下班選單的食物、兩組買法（順路買／外送）、份數不限（要把商圈掃光也沒關係）。純資料與判定，瀏覽器與 node 都能載。
(function (root) {
  const FOODS = {
    bento: { name: '便當' }, dry_noodles: { name: '乾麵' }, dumplings: { name: '水餃' }, fried_rice: { name: '炒飯' },
    bubble_tea: { name: '手搖飲', drink: true }, hotpot: { name: '小火鍋' }, steak: { name: '牛排' }, teishoku: { name: '日式定食' },
    onigiri: { name: '飯糰' }, micro_bento: { name: '微波便當' }, beer: { name: '啤酒', drink: true }, cola: { name: '可樂', drink: true },
    green_tea: { name: '罐裝綠茶', drink: true }, water: { name: '礦泉水', drink: true }, cvs_coffee: { name: '超商咖啡', drink: true },
    luwei: { name: '滷味' }, yansuji: { name: '鹹酥雞' }, winter_melon_tea: { name: '冬瓜茶', drink: true }, black_tea: { name: '紅茶', drink: true },
  };
  const DINNER = ['bento', 'dry_noodles', 'dumplings', 'fried_rice', 'bubble_tea'];
  // 21:00 前下班吃晚餐（商圈、外送 APP），21:00 後只剩宵夜（便利商店、滷味和鹹酥雞的外送）
  const MENUS = {
    // 順路買的背景是店家插圖：spots 是每樣東西擺在圖上的位置（底部中央，畫面的百分比），signs 是程式寫在空白招牌上的店名
    dinner: {
      pickup: { place: '商圈', bg: 'shop_street_evening', items: DINNER,
        spots: { bento: [12, 97], dry_noodles: [32, 97], dumplings: [51, 97], fried_rice: [71, 97], bubble_tea: [90, 97] },
        signs: [['便當', 12], ['麵店', 32], ['水餃', 51], ['熱炒', 71], ['手搖飲', 90]] },
      delivery: { place: '外送', items: [...DINNER, 'hotpot', 'steak', 'teishoku'] },
    },
    lateNight: {
      // 貨架中段擺吃的和咖啡，冷藏櫃中段擺罐裝飲料
      pickup: { place: '便利商店', bg: 'convenience_store_night', items: ['onigiri', 'micro_bento', 'beer', 'cola', 'green_tea', 'water', 'cvs_coffee'],
        spots: { onigiri: [20, 51], micro_bento: [32, 51], cvs_coffee: [44, 51], beer: [60, 51], cola: [70, 51], green_tea: [80, 51], water: [90, 51] } },
      // 飲料只有滷味攤或鹹酥雞能加購
      delivery: { place: '外送', items: ['luwei', 'yansuji', 'winter_melon_tea', 'black_tea'], addOn: { drinks: ['winter_melon_tea', 'black_tea'], with: ['luwei', 'yansuji'] } },
    },
  };
  const LATE_NIGHT_MIN = 21 * 60;
  const menuFor = (minute) => (minute < LATE_NIGHT_MIN ? 'dinner' : 'lateNight');
  const bought = (order) => Object.entries(order || {}).filter(([, n]) => n > 0);

  // 不行就回一句原因，可以就回 null
  function checkOrder(menu, channel, order) {
    const ch = MENUS[menu] && MENUS[menu][channel]; if (!ch) return '沒有這個選單';
    const ids = bought(order).map(([id]) => id);
    const off = ids.find(id => !ch.items.includes(id));
    if (off) return `${ch.place}沒有賣${(FOODS[off] || { name: off }).name}`;
    if (ch.addOn && ids.some(id => ch.addOn.drinks.includes(id)) && !ids.some(id => ch.addOn.with.includes(id))) return '飲料只能跟滷味或鹹酥雞一起加購';
    return null;
  }
  function appetite(menu, channel, order) {
    const items = MENUS[menu][channel].items, got = bought(order);
    if (items.every(id => (order[id] || 0) > 0)) return '大胃王';
    if (!got.length || (got.length === 1 && got[0][1] === 1 && FOODS[got[0][0]].drink)) return '小鳥胃';
    return null;
  }
  const describe = (order) => bought(order).map(([id, n]) => FOODS[id].name + (n > 1 ? `×${n}` : '')).join('、') || '什麼都沒買';

  // 下班休閒（下班時選，選了什麼茶几上就擺什麼；玩的時候像開著的視窗，自己關掉才停）。
  // every／unit：播放中的進度每幾分鐘跳一格（第幾集、第幾關、第幾本）；icon 是圖還沒到之前的占位圖示
  const LEISURE = {
    tablet: { name: '平板', act: '追劇', icon: 'tablet', every: 45, unit: '集' },
    console: { name: '遊戲機', act: '打電動', icon: 'gamepad-2', every: 15, unit: '關' },
    manga: { name: '漫畫', act: '看漫畫', icon: 'book-open', every: 30, unit: '本' },
  };
  const progress = (id, minutes) => `第 ${1 + Math.floor(minutes / LEISURE[id].every)} ${LEISURE[id].unit}`;
  const span = (m) => [m >= 60 ? `${Math.floor(m / 60)} 小時` : '', m % 60 ? `${m % 60} 分鐘` : ''].filter(Boolean).join(' ');
  const describeFun = (fun) => Object.entries(fun || {}).filter(([, m]) => m > 0).map(([id, m]) => `${LEISURE[id].act} ${span(m)}`).join('、');

  const api = { FOODS, MENUS, menuFor, checkOrder, appetite, describe, LEISURE, progress, span, describeFun };
  if (typeof module !== 'undefined') module.exports = api;
  else root.Home = api;
})(typeof window !== 'undefined' ? window : globalThis);
