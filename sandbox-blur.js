// sandbox-blur.js — 正式上班第一關「IT 的模糊邊界」：忙了一整天卻好像什麼都沒做，還有某些人對 IT 的期待有多寬廣。
// 現在有：早會、君傑那則 LIME、加記憶體這件雜事、君傑的座位、茶几。碳粉匣、Wi-Fi、Outlook、小事件之後補
(function (root) {
  const { Sandbox } = typeof require === 'function' ? require('./sandbox.js') : root;
  const JUNJIE = '業務 君傑';

  function make() {
    return {
      name: 'IT 的模糊邊界', issueBase: 300,
      meetings: [{ at: 0, end: 8, title: '09:00 公司早會', lines: [
        { at: 1, text: 'IT 經理：「今天大家手上都沒有排開發，應該滿輕鬆的。」' },
        { at: 5, text: 'IT 經理：「好，散會。」', closing: true },
      ] }],
      sources: [{
        kind: 'line', at: 20, id: 'ram_ask', title: '君傑：電腦好慢', from: JUNJIE, module: null, chore: 'ram',
        text: '欸 IT，我電腦好慢，開個報價單要等好久。\n是不是加記憶體就會變快？幫我加一下好不好',
        sentences: [
          { text: '我電腦好慢，開個報價單要等好久。', keep: true },
          { text: '是不是加記憶體就會變快？', keep: false },
          { text: '幫我加一下好不好', keep: true },
        ],
        subtasks: [],
      }],
      // 雜事：進度在 engine.chores，卡只是外殼（可以不開卡直接做）
      chores: [{ id: 'ram', title: '幫君傑加記憶體', from: JUNJIE }],
      // 同事的座位：人在那邊只帶得到公務手機（LIME、信箱）；actions 是在那邊能做的事，bench 是要開的工作台場景
      seats: {
        junjie: {
          who: JUNJIE, title: '君傑的座位', wallpaper: 'sportscar',
          props: ['名片堆', '高爾夫球', '沒洗的咖啡杯'],
          shortcuts: ['報價單_最終版', '報價單_最終版2', '新增資料夾 (37)'],
          actions: [{ id: 'look', label: '看看他的電腦', bench: 'demo' }],
        },
      },
      home: { commute: 30, pickupExtra: 15, deliveryWait: 40, vpnMin: 5, vpnDrop: 0.15, ringMin: 20, emergencies: [] },
      // 結算卡多的行（劇本「結算卡多的行」）：其他的跟著各張卡進來
      report: (e) => ({ extra: [`走了 ${e.stats.trips} 趟`, '程式：0 行'] }),
    };
  }
  Sandbox.add('blur', make);
})(typeof window !== 'undefined' ? window : globalThis);
