// sandbox-blur.js — 正式上班第一關「IT 的模糊邊界」：忙了一整天卻好像什麼都沒做，還有某些人對 IT 的期待有多寬廣。
// 現在有：早會、加記憶體（君傑）、換碳粉匣（淑芬）、兩個人的座位、茶几。Wi-Fi、Outlook、小事件之後補
(function (root) {
  const { Sandbox } = typeof require === 'function' ? require('./sandbox.js') : root;
  const { BenchRam } = typeof require === 'function' ? require('./bench-ram.js') : root;
  const { BenchPrinter } = typeof require === 'function' ? require('./bench-printer.js') : root;
  const JUNJIE = '業務 君傑';
  const SHUFEN = '行政 淑芬';
  // 舊料箱：一定有一條君傑能用的 DDR4 8GB 桌機用，另外隨機 2～3 條（DDR4 4GB 桌機用的插得上、變 12 GB，也算裝好），順序打亂
  const BOX_POOL = [
    { gen: 'DDR4', form: 'DIMM', size: 4 }, { gen: 'DDR3', form: 'DIMM', size: 4 }, { gen: 'DDR3', form: 'DIMM', size: 8 },
    { gen: 'DDR5', form: 'DIMM', size: 8 }, { gen: 'DDR5', form: 'DIMM', size: 16 },
    { gen: 'DDR4', form: 'SO-DIMM', size: 8 }, { gen: 'DDR4', form: 'SO-DIMM', size: 4 },
  ];
  function ramBox(random) {
    const pool = [...BOX_POOL]; const sticks = [{ gen: 'DDR4', form: 'DIMM', size: 8 }];
    const extra = 2 + Math.floor(random() * 2);
    for (let n = 0; n < extra; n++) sticks.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    for (let i = sticks.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [sticks[i], sticks[j]] = [sticks[j], sticks[i]]; }
    return sticks;
  }
  // 加記憶體裝好時螢幕上的容量（engine 記在雜事 flags.shown）：君傑都覺得一樣慢，技術上的差別只有懂的人看得出來（或自以為懂的阿明）
  function ramPeers(shown) {
    if (!shown) return [];
    if (shown.size === 12 && /單通道/.test(shown.text)) return [{ who: '同事 小潘', text: '我懷疑你看君傑不爽很久了。' }];
    if (shown.size === 12) return [{ who: '同事 小潘', text: '8 加 4，12G？……也是有變多啦。' }];
    if (/雙通道/.test(shown.text)) return [{ who: '同事 小潘', text: '插在同一組，雙通道，懂的人就懂。' }];
    if (/單通道/.test(shown.text)) return [{ who: '業務 阿明', text: '很有創意的裝法，看來是為了擴充到32GB會更有感舖路' }];
    return [];
  }
  // 君傑提過加記憶體了（LIME 或當面問都算）
  const asked = (e) => e.docs.some(d => d.id === 'ram_ask');
  // 淑芬說了碳粉不足
  const tonerAsked = (e) => e.docs.some(d => d.id === 'toner_ask');
  // 碳粉匣「全都要」：老闆在結算卡追問材料費
  const tonerPeers = (flags) => (flags.allIn ? [{ who: '老闆', text: '這個月的材料設備費支出特別高，你有什麼頭緒嗎？' }] : []);

  function make() {
    return {
      name: 'IT 的模糊邊界', issueBase: 300,
      brief: '今天沒有排開發，應該滿輕鬆的。只是同事們對 IT 的期待，好像比你想的還要寬一點。',
      // 桌上自己寫的便條：玩家不一定知道能主動找人、能打電話
      // work 是公務手機：一早只剩四成電，等候音樂聽久了會沒電（童童選的：跟其他裝置一樣會掉電、要插排插充）
      unlabeled: { note: '找同事：LIME 點名字傳訊息，或直接走過去。\n找廠商：用公務手機打電話。', devices: { phone: 100, tablet: 100, work: 40 } },
      // 小潘那句可以舉手問舊料箱為什麼放你桌上；IT 經理最後那句等它有結果（回完或飛走）才講
      meetings: [{ at: 0, end: 10, title: '09:00 公司早會', lines: [
        { at: 1, text: 'IT 經理：「今天沒有開發工作能排給大家，應該比較輕鬆，就看狀況支援吧！」' },
        { at: 5, text: '同事 小潘：「對了，最近有一箱汰換下來的舊料放在{玩家名稱}的座位上，大家缺零件可以先翻那裡，不用等採購。」', key: true,
          options: [
            { text: '「為什麼放我座位上？」', reply: '同事 小潘：「你的桌面比較乾淨。」' },
            { text: '「為什麼不放會議桌？」', reply: '同事 小潘：「會議桌要保持淨空。」' },
            { text: '「為什麼不放你自己桌上？」', reply: '同事 小潘：「我的桌面已經有五箱了。」' },
          ] },
        { at: 9, text: 'IT 經理：「{玩家名稱}，相信我，你很快會發現舊料箱擺在你桌上的好處。」', closing: true },
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
        // 君傑還沒開口就走到他座位：他當面問，這則 LIME 就不傳了
        early: {
          seat: 'junjie', title: '君傑：你會通靈嗎', text: '你會通靈嗎？我正好想換記憶體，你來幫我看看。',
          sentences: [{ text: '你會通靈嗎？', keep: false }, { text: '我正好想換記憶體，你來幫我看看。', keep: true }],
        },
      }, {
        // 君傑隨口的暗示：請阿賢調資料這條後門的線索
        kind: 'line', at: 21, id: 'ram_hint', title: '君傑', from: JUNJIE, module: null, when: asked,
        text: '對了，這台是當初阿賢那邊貼編號的。', sentences: [], subtasks: [],
      }, {
        kind: 'line', at: 50, id: 'toner_ask', title: '淑芬：碳粉不足', from: SHUFEN, module: null, chore: 'toner',
        text: '印表機說碳粉不足。', sentences: [{ text: '印表機說碳粉不足。', keep: true }], subtasks: [],
      }],
      // 主動傳訊（LIME 公司通訊錄）：教君傑看自己的電腦、請阿賢調財產資料。選項沒寫 next／end 的是錯的，對方回完就劃掉
      talks: {
        junjie: {
          who: JUNJIE, delay: [3, 6], when: asked,
          rounds: [
            { options: [
              { say: '你的記憶體是 DDR 幾？', back: 'DDR 不是跳舞機嗎？' },
              { say: '你電腦幾 G？', back: '256G，當初說很大。' },
              { say: '你電腦什麼牌子？', back: '黑色的。' },
              { say: '同時按 Ctrl、Shift、Esc，把跳出來的畫面拍給我', back: '按了，我的 Excel 不見了！', next: true },
            ] },
            { options: [
              { say: '沒不見，是被新跳出來的視窗蓋住了。點下面工作列上的 Excel。', back: '有了！嚇死我。可是剛剛那個框框不見了。', next: true },
              { say: '先不要管 Excel。', back: '不行，報價單還沒存，客戶在等。' },
              { say: '重開機看看。', back: '重開機報價單會不見欸，你負責嗎？' },
            ] },
            { options: [
              { say: '再按一次 Ctrl、Shift、Esc，點上面的「效能」，再點「記憶體」，拍給我。', back: { photo: 'glare' }, next: true },
              { say: '再按一次 Ctrl、Shift、Esc，拍給我。', back: { photo: 'processes' } },
              { say: '你剛剛按了什麼？', back: '我忘了。' },
            ] },
            { options: [
              { say: '反光了，側一點拍，不要開閃光燈。', back: { photo: 'selfie' }, next: true },
              { say: '看不清楚，再拍一張。', back: { photo: 'glare' } },
              { say: '你直接把上面的字打給我。', back: '上面寫記憶體，下面一堆英文跟數字。' },
            ] },
            { options: [
              { say: '你拍到自己了，換後鏡頭。', back: '不用啦，隔壁阿明說公司電腦都是 DDR3。', next: true },
              { say: '帥喔。', back: { photo: 'selfieYa' } },
              { say: '……', back: '？' },
            ] },
            { options: [
              { say: '好，那我拿 DDR3 過去。', back: '讚啦！', end: 'trusted' },
              { say: '阿明的電腦跟你的不一樣，再拍一張給我。', back: { photo: 'clear' }, end: 'answered' },
              { say: '阿明是 IT 嗎？', back: '不是啊，可是他很懂電腦，他會灌遊戲。' },
            ] },
          ],
        },
        axian: {
          who: '資產室 阿賢', replyBy: 'mail', delay: [60, 60], when: asked, notice: '資料寄到你信箱了，你收一下。',
          rounds: [{ options: [{
            say: '可以幫我調業務君傑那台電腦報財產編號時的詳細資料嗎？', end: 'answered',
            back: { title: '君傑電腦的財產資料', text: '財產編號：SL-2021-0137（業務部 君傑）\n品名：桌上型電腦\n記憶體：8GB DDR4-2666 桌機用 DIMM ×1（主機板四個插槽，用了一個）\n硬碟：256GB SSD\n\n資料是當初報財產時登記的，這幾年沒有人來改過。' },
          }] }],
        },
        // 碳粉匣查機型：淑芬只記得前半段（外殼漆掉了），阿賢 15 分鐘後用信給行政辦公室兩台印表機的型號。know 是回完之後玩家查到的事
        shufen: {
          who: SHUFEN, delay: [2, 4], when: tonerAsked,
          rounds: [{ options: [
            { say: '是哪一台印表機？型號是什麼？', back: 'MP-La……什麼的，就是 MP 的那台。', end: 'answered', know: 'toner:partial' },
            { say: '印表機在哪？', back: '就在我旁邊啊，每天都在印。' },
          ] }],
        },
        axian_printer: {
          who: '資產室 阿賢', replyBy: 'mail', delay: [15, 15], when: tonerAsked, notice: '資料寄到你信箱了，你收一下。',
          rounds: [{ options: [{
            say: '可以幫我查淑芬辦公室那邊印表機的型號嗎？', end: 'answered', know: ['toner:c8763', 'toner:d87'],
            back: { title: '行政辦公室的印表機', text: '行政辦公室登記的印表機有兩台：\n1. MP LazyJet C8763（財產編號 AD-2019-0042）\n2. MP InkJot D87（財產編號 AD-2022-0108）\n\n型號照報財產時的資料，外殼上的字可能磨掉了。' },
          }] }],
        },
      },
      // 打電話（公務手機）：語音選單、等候、接通後回答客服；客服問機型時只列玩家查得到的，可以重複訂，每一單各自送到淑芬那邊
      calls: {
        mp: {
          who: 'MP 耗材客服專線', chore: 'toner', when: tonerAsked,
          menu: { prompt: '報修請按 1、耗材請按 2、其他請按 3。', right: 2, wrong: '您輸入的號碼有誤，請重新輸入。', press: {
            1: { say: '這裡是維修部，您要報修哪一台？……耗材的話請重撥喔。', hangup: true },
            3: { say: '現在諮詢都在忙線中，業務需求請直接輸入分機號碼，若要報修請輸入1，耗材請輸入2' },
          } },
          hold: [6, 12], answerWithin: 10,
          greet: '您好，MP 耗材客服，請問印表機的機型是？',
          answers: [
            { say: 'MP-La……什麼的', when: (e) => e.knows.has('toner:partial'), back: 'MP 的機型有兩百多種喔，您查到再打來。' },
            { say: 'MP LazyJet C8763', when: (e) => e.knows.has('toner:c8763') || e.chores.toner.flags.sawSticker,
              back: '好的，C 系列碳粉匣一盒，下午幫您送過去。', order: ['C'] },
            { say: 'MP InkJot D87', when: (e) => e.knows.has('toner:d87'), back: '這台是噴墨的，沒有碳粉匣喔。' },
            // 問 AI 拿到的幻覺型號（計畫 7 的問 Claire 給這個旗標）：送來 B 系列，裝不上去
            { say: 'MP LazyJet B8964', when: (e) => e.knows.has('toner:b8964'), back: '好的，B 系列碳粉匣一盒，下午幫您送過去。', order: ['B'] },
            { say: '我再查一下', back: '好的，查到再打來喔。' },
            { say: '小孩子才做選擇，我全都要！', back: '……好的，五個系列各一盒，下午幫您送過去。', order: ['A', 'B', 'C', 'D', 'E'], allIn: true },
          ],
          delivered: { from: SHUFEN, text: '碳粉匣送到了，放在我這邊。' },
          bulk: { count: 3, from: SHUFEN, text: '訂這麼多都用得到嗎？用不到的話，美玲可能會要你寫檢討報告。' },
        },
      },
      // 雜事：進度在 engine.chores，卡只是外殼（可以不開卡直接做）。rules 是工作台規則，seat 是在誰的座位做，box 是自己座位舊料箱的內容
      chores: [{
        id: 'ram', title: '幫君傑加記憶體', from: JUNJIE, seat: 'junjie', rules: BenchRam,
        box: ramBox,
        // 裝好、回自己座位後君傑傳來的：回哪句都算結束
        doneMessage: {
          text: '有了有了，記憶體變大了！可是怎麼沒有想像中的快？',
          reply: { items: [{ text: '你回：', free: true, options: ['「可能是人的問題。」', '「你去跟財務申請採購新電腦可能比較快」'],
            replies: ['哭喔', '美玲姐每次都要我分析換新電腦的效益，很麻煩啦！'] }] },
        },
      }, {
        // 碳粉匣是打電話訂、廠商送到淑芬那邊的（不是料箱裡拿），換碳粉在她座位的工作台
        id: 'toner', title: '換碳粉匣', from: SHUFEN, seat: 'shufen', rules: BenchPrinter,
        doneMessage: { text: '印出來了！謝謝～' },
      }],
      // 同事的座位：人在那邊只帶得到公務手機（LIME、信箱）；actions 是在那邊能做的事，bench 是要開的工作台場景
      seats: {
        junjie: {
          who: JUNJIE, title: '君傑的座位', wallpaper: 'sportscar',
          props: ['名片堆', '高爾夫球', '沒洗的咖啡杯'],
          shortcuts: ['報價單_最終版', '報價單_最終版2', '新增資料夾 (37)'],
          actions: [{ id: 'look', label: '看看他的電腦', bench: 'ram', chore: 'ram' }],
        },
        shufen: {
          who: SHUFEN, title: '淑芬的座位', wallpaper: 'family',
          props: ['一疊待辦文件', '標籤貼紙', '小孩的畫'],
          shortcuts: ['會議室預約', '文具請購'],
          actions: [{ id: 'printer', label: '看看印表機', bench: 'printer', chore: 'toner' }],
        },
      },
      home: { commute: 30, pickupExtra: 15, deliveryWait: 40, vpnMin: 5, vpnDrop: 0.15, ringMin: 20, emergencies: [] },
      // 結算卡多的行（劇本「結算卡多的行」）：其他的跟著各張卡進來
      report: (e) => ({
        extra: [`走了 ${e.stats.trips} 趟`, ...(e.stats.turns ? [`機殼轉了 ${e.stats.turns} 圈`] : []),
          ...(e.chores.toner.flags.bought ? [`碳粉匣買了 ${e.chores.toner.flags.bought} 盒`] : []), '程式：0 行'],
        traits: [
          ...(e.askedInPerson.has('ram_ask') ? [{ title: '先發制人', text: '君傑還沒開口，你已經站在他座位旁邊了' }] : []),
          ...(e.chores.toner.flags.allIn ? [{ title: '耗材霸總', text: '客服問機型，你說小孩子才做選擇' }] : []),
        ],
        peers: [...ramPeers(e.chores.ram.flags.shown), ...tonerPeers(e.chores.toner.flags)],
      }),
    };
  }
  Sandbox.add('blur', make);
})(typeof window !== 'undefined' ? window : globalThis);
