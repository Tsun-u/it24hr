// scripts/work-links.js：把每張卡各工作之間的連動（說明的寫法在 card-links.js）印成 Markdown。用法：node scripts/work-links.js
const DAY1 = require('../day1.js');
const DAY2 = require('../day2.js');
const DAY3 = require('../day3.js');
const { Sandbox } = require('../sandbox.js');
const { cardsOf, linkRows } = require('../card-links.js');
require('../sandbox-scenery.js');
require('../sandbox-fate.js');

function dump(name, script) {
  const lines = [`## ${name}`];
  for (const c of cardsOf(script)) {
    const rows = linkRows(c);
    if (rows.length) lines.push(`\n### ${c.title}（${c.where}，${c.id}）`, ...rows.map(r => `- ${r.text}`));
  }
  return lines.join('\n');
}

console.log(dump('第一天', DAY1));
console.log('\n' + dump('第二天', DAY2.make()));
console.log('\n' + dump('第三天', DAY3.make()));
// 正式上班第二關：模組卡是廠商需求會議散會後開的；模組池三抽二，抽兩組湊滿六張。
// 批號追溯在 speedrun 是選路的卡（接手或重來），另外印它的兩條路；平行宇宙小卡三個時代一樣
const scenery = (mode, pool) => Sandbox.make('scenery', mode, { pool });
const scene = scenery('legacy', ['trace', 'stock']);
const claim = scenery('legacy', ['claim', 'stock']).meetings[1].cards.filter(c => c.id === 'claim');
const routed = scenery('speedrun', ['trace', 'stock']).meetings[1].cards.filter(c => c.routes);
console.log('\n' + dump('正式上班第二關（最美的風景）', { cards: [], meetings: [{ cards: [...scene.meetings[1].cards, ...claim] }, { cards: routed }], parallel: scene.parallel }));
// 正式上班第三關：卡都是廠商需求會議散會後開的；模組池一池抽一張，這裡每張都開
console.log('\n' + dump('正式上班第三關（心領神會）', { cards: [], meetings: [{ cards: Sandbox.make('fate', 'legacy', { pool: 'all' }).meetings[1].cards }] }));
