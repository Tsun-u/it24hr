// sandbox-blur.js — 正式上班第一關「IT 的模糊邊界」：忙了一整天卻好像什麼都沒做，還有某些人對 IT 的期待有多寬廣。
// 內容：早會、加記憶體（君傑）、換碳粉匣（淑芬）、Wi-Fi（老闆娘）、信箱滿了（美玲）、四個人的座位、問 Claire、小事件池、茶几。
(function (root) {
  const { Sandbox } = typeof require === 'function' ? require('./sandbox.js') : root;
  const { BenchRam } = typeof require === 'function' ? require('./bench-ram.js') : root;
  const { BenchPrinter } = typeof require === 'function' ? require('./bench-printer.js') : root;
  const { WifiRules } = typeof require === 'function' ? require('./wifi-rules.js') : root;
  const { MailboxRules } = typeof require === 'function' ? require('./mailbox-rules.js') : root;
  const JUNJIE = '業務 君傑';
  const SHUFEN = '行政 淑芬';
  const BOSS_WIFE = '老闆娘';
  const MEILING = '財務 美玲';
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
  // 成就「君傑的仇人」（童童定）：報價單沒存就關機，最後裝好時螢幕顯示 12 GB 單通道
  const junjieNemesis = (flags) => !!(flags.lostExcel && flags.shown && flags.shown.size === 12 && /單通道/.test(flags.shown.text || ''));
  // 淑芬說了碳粉不足
  const tonerAsked = (e) => e.docs.some(d => d.id === 'toner_ask');
  // 碳粉匣的結算卡評語：全都要的老闆追問材料費；送來太多、淑芬問過用不用得到（bulkAsked）的，美玲要說明報告
  function tonerPeers(flags) {
    const peers = [];
    if (flags.allIn) peers.push({ who: '老闆', text: '這個月的材料設備費支出特別高，你有什麼頭緒嗎？' });
    if (flags.bulkAsked) peers.push({ who: MEILING, text: '請交付大量採購碳粉匣的說明報告。' });
    return peers;
  }
  // 老闆娘來過桌邊了（當面講了，或沒理她、她放了便條走）
  const wifiVisited = (e) => e.docs.some(d => d.id === 'wifi_visit') || e.papers.some(p => p.id === 'wifi_visit');
  // Wi-Fi 的結算卡評語：照做法（重開基地台、關過濾、訪客網路、只登記私人位址），照正解做好的老闆娘自己說
  function wifiPeers(chore) {
    const f = chore.flags; const peers = [];
    if (f.reboots) peers.push({ who: JUNJIE, text: '你重開的那五分鐘，我報價單剛好送到一半。' });
    if (f.filterOff) peers.push({ who: '資安 畇蓁', text: 'MAC 過濾關掉的那段時間，連線紀錄裡多了三台不認識的裝置。' });
    if (f.guest) peers.push({ who: SHUFEN, text: '老闆娘用訪客網路印不到，跑來問我印表機是不是又壞了。' });
    if (chore.bench && WifiRules.privateListed(chore.bench)) peers.push({ who: '同事 小潘', text: '登記的是私人位址，哪天她重設網路就又連不上了。' });
    else if (chore.stage === 'done' && !f.filterOff && !f.reboots && !f.guest) peers.push({ who: BOSS_WIFE, text: '還是你們 IT 厲害。' });
    return peers;
  }
  // 美玲說了信寄不出去
  const mailAsked = (e) => e.docs.some(d => d.id === 'outlook_ask');
  // 信箱的結算卡評語：照做法（刪了會計師的信、封存檔放共用槽、叫她自己刪、清到剛好低於上限下午又滿），照正解清到安全線以下的美玲自己說
  function outlookPeers(chore, e) {
    const f = chore.flags; const peers = [];
    if (f.accountantGone) peers.push({ who: MEILING, text: '會計師要的資料不見了，我被唸了一頓。' });
    if (f.shareFull) peers.push({ who: JUNJIE, text: '共用槽滿的那段時間，我的報價單存不進去。' });
    if (e.knows.has('outlook:selfDelete')) peers.push({ who: MEILING, text: '我自己刪了一封，還是滿的。' });
    if (f.refull) peers.push({ who: MEILING, text: '下午又滿了，你是不是沒清乾淨？' });
    // 清到安全線以下：第二輪轉寄還沒來是寬敞，來了沒爆是還好清得夠乾淨
    if (!peers.length && chore.stage === 'done' && chore.bench.refilled) peers.push({ who: MEILING, text: '下午尾牙影片又被轉寄一輪，還好你清得夠乾淨。' });
    else if (!peers.length && chore.stage === 'done' && MailboxRules.safe(chore.bench)) peers.push({ who: MEILING, text: '信箱好寬敞，像剛報完帳。' });
    return peers;
  }
  // 刪了會計師的信（清空刪除的郵件之後）：IT 經理來信要檢討報告，開出這張卡。跟第二天資料遺失那張一樣是一般卡，
  // 只是驗的人是 IT 經理、驗過要通知美玲；在家交的停在待驗收（IT 經理也下班了），不影響結算（這一關沒有 bad end，最差就是下班後在家寫）
  const AUDIT_REPORT = {
    id: 'outlook_report', title: 'IT 經理：查帳資料的檢討報告', requester: MEILING, module: null,
    body: '清理財務部信箱時，會計師往來的查帳資料被永久刪除，請寫一份檢討報告。', noDeploy: true,
    reviewer: { who: 'IT 經理', pass: '報告看過了，進已完成' }, notifyText: '經理看過了，會計師要的資料照報告處理。',
    subtasks: [
      { work: 'report', question: { intro: '信刪掉就跟說出口的話一樣，收不回來。',
        points: ['職在協助財務部清理信箱時，未確認信件內容，即將會計師往來之查帳資料永久刪除。'],
        items: [
          { text: '職在收到問題反映時先進行了以下緊急處理：____', options: ['請會計師事務所重寄查帳資料', '請 AI 把刪掉的信變回來', '告訴美玲那些信本來就不重要'], answer: 0, ai: { pick: 1, kind: 'madeUp' } },
          { text: '為了避免未來發生類似錯誤事件，職將遵守以下規範：____', options: ['清理信箱時，有保存規定的信件（會計、稽核）一律封存，不刪除', '清理信箱前先把信件全部刪除再說', '以後信箱滿了請同仁自己處理'], answer: 0, ai: { pick: 2, kind: 'other' } },
        ] } },
    ],
  };

  // ── 問 Claire（hybrid、speedrun）：AI 不代做，只能花額度問問題。四件事各一組，那件事發生了才列（when）。
  // short 是 Verse／Essay 的回答；novel 是 Novel 照問題開頭那句，後面接這件事共用的本文（關鍵藏在中間）；
  // pediaMiss 的題 Pedia 先說查不到個別設備；know 是回答到了之後玩家「知道」的事（講錯的也算，例如 B8964）
  const CLAIRE = {
    ram: {
      label: '君傑的電腦好慢', when: asked, hands: '幫我加記憶體',
      asks: [
        { id: 'ddr_how', say: '怎麼看記憶體是 DDR 幾？', novel: '這是一個好問題，值得我們從頭談起。',
          short: '按 Ctrl＋Shift＋Esc 開工作管理員，點「效能」→「記憶體」，右上角會寫 DDR 幾。開不了機的話，拆開看記憶體上的貼紙。' },
        { id: 'junjie', say: '君傑的電腦是 DDR 幾？', pediaMiss: true, novel: '依這個世代之電腦推估，應為 DDR5。然而，推估畢竟只是推估。',
          short: '這個世代的電腦通常是 DDR5。' },
        { id: 'fastest', say: '哪條記憶體最快？', novel: '速度，是記憶體永恆之追求。',
          short: '數字越大越快，例如 DDR5-6400 比 DDR5-4800 快；同一代的再比 CL 值，越小越好。' },
      ],
      novel: [
        '前言：在數位轉型的浪潮下，記憶體的重要性不言而喻。',
        '何謂記憶體？記憶體係用來記憶之體。',
        '記憶體自 SDRAM 以降，歷經 DDR、DDR2、DDR3、DDR4 至 DDR5，每一代皆較前一代更為新穎。',
        '各世代之金手指缺口位置不同，無法互相插入，此乃設計使然，非使用者之過。',
        '欲確認一台電腦之記憶體世代，最可靠之方式為同時按下 Ctrl、Shift、Esc 開啟工作管理員，點選「效能」，再點選「記憶體」，右上角即標示世代；「已使用插槽」一欄可得知尚餘幾個空槽。',
        '若電腦無法開機，亦可拆開機殼，閱讀記憶體上之標籤。',
        '拆機之前，宜先由作業系統關機並拔除電源，以免使用者之 Excel 尚未儲存。',
        '桌上型電腦使用長條之 DIMM，筆記型電腦使用短小之 SO-DIMM，兩者外觀相似、用途相異，猶如筷子與牙籤。',
        '安裝兩條時，宜插於同色之插槽以啟用雙通道，使兩條記憶體攜手並進。',
        '速度方面，數字越大越快；惟快慢亦取決於主機板、處理器以及使用者之心境。',
        '結語：期許本回答能為您的記憶體帶來長遠且正向之價值。',
      ],
      pedia: { title: '隨機存取記憶體', lines: [
        '概述：隨機存取記憶體（Random Access Memory，RAM）是電腦執行程式時暫放資料的地方，關機後內容就消失。「隨機」指可以直接讀寫任何一個位置，不是內容隨機。',
        '歷史：1970 年，Intel 推出 1103，一般公認是第一顆商用 DRAM 晶片。桌上型電腦常見的 DDR 系列中，DDR4 的規格在 2012 年發布、2015 年起隨主流平台普及，DDR5 的規格在 2020 年發布。',
        '世代比較（桌上型 DIMM）：DDR3 240 針、1.5 V；DDR4 288 針、1.2 V；DDR5 288 針、1.1 V。缺口位置各不相同，不能混插。',
        '外形：桌上型電腦用 DIMM（長條），筆記型電腦用 SO-DIMM（短條）。',
        '辨識方法：在作業系統裡按 Ctrl＋Shift＋Esc 開啟工作管理員，「效能」→「記憶體」可以看到容量、速度、已使用的插槽數與外形（DIMM 或 SO-DIMM），不少電腦也會在容量旁標出世代（例如 DDR4）；無法開機時可以拆機看記憶體上的標籤。',
        '雙通道：兩條記憶體分別插在兩個通道才會啟用，插槽位置以主機板說明書為準（多數四槽主機板建議 A2、B2）；兩條容量相同效果最好。',
        '安裝注意事項：由作業系統關機、拔除電源、碰一下金屬釋放靜電、對準缺口垂直插入、確認兩側卡榫扣上。',
        '常見誤解：「256 GB 是記憶體」——那通常是硬碟或 SSD 的容量。「記憶體越大電腦越快」——瓶頸不在記憶體時，加了也不會變快。',
        '參見：硬碟、跳舞機（同名縮寫，與本條目無關）',
        '註釋：[1] 本條目另有 37 節（含 DDR 命名之爭議）未顯示。',
      ] },
    },
    toner: {
      label: '淑芬的印表機碳粉不足', when: tonerAsked, hands: '幫我換碳粉匣',
      asks: [
        // 「這兩台」「InkJot」是阿賢的信寫的，收到信才問得出來
        { id: 'better', say: '這兩台哪台比較好？', when: (e) => e.knows.has('toner:d87'), novel: '好與不好，端看您如何定義『好』。',
          short: '兩台各有優點：一台列印速度快，一台顏色比較漂亮，看您的需求。' },
        { id: 'model', say: '淑芬的印表機是什麼型號？', pediaMiss: true, know: 'toner:b8964', novel: '依常見之配置推估，應為 MP LazyJet B8964。然而，推估畢竟只是推估。',
          short: '淑芬的印表機應該是 MP LazyJet B8964。' },
        { id: 'kinds', say: '噴墨和雷射差在哪？', novel: '這是一個好問題，值得我們從古騰堡談起。',
          short: '噴墨印表機用墨水匣，雷射印表機用碳粉匣。會顯示「碳粉不足」的是雷射印表機。' },
        { id: 'inkjot', say: 'InkJot 是什麼？', when: (e) => e.knows.has('toner:d87'), novel: 'InkJot，顧名思義，係與 Ink 有關之 Jot。',
          short: 'InkJot 是 MP 公司的噴墨印表機系列。' },
      ],
      novel: [
        '前言：在無紙化的浪潮下，印表機的重要性依然不言而喻。',
        '何謂印表機？印表機係用來印表之機。',
        '印刷術自古騰堡以降，歷經活字、點陣、噴墨至雷射，每一種皆較前一種更為新穎。',
        '噴墨印表機以墨水匣作畫，雷射印表機以碳粉匣成像；故顯示「碳粉不足」者，必為雷射印表機。',
        'MP 公司之命名頗具巧思：LazyJet 系列為雷射，InkJot 系列為噴墨，人如其名。',
        '機身正面之型號若已磨損，背面通常貼有財產貼紙，載有完整型號。',
        '叫貨之時，客服通常僅詢問型號，備妥型號可使通話更為順暢。',
        '更換碳粉匣前，宜將新匣左右搖晃數下，使碳粉分布均勻；並務必撕除封條，否則所印之紙將如初雪般潔白。',
        '結語：期許本回答能為您的列印帶來長遠且清晰之價值。',
      ],
      pedia: { title: '印表機', lines: [
        '概述：印表機是把電腦裡的文字和圖片印到紙上的裝置。',
        '分類：噴墨（墨水匣，家用、相片）、雷射（碳粉匣，辦公室大量列印）、點陣（色帶，多聯單據）、熱感（感熱紙，收據）。',
        '雷射印表機的原理：雷射在感光鼓上畫出影像，碳粉吸上去、轉印到紙上，再加熱定影。剛印出來的紙是溫的，就是這個原因。',
        '辨識：會顯示「碳粉不足」的是雷射印表機；噴墨印表機用墨水，沒有碳粉。',
        'MP 公司產品線：LazyJet 系列是雷射、InkJot 系列是噴墨。碳粉匣照機型字首分系列，C 開頭的機型用 C 系列碳粉匣，各系列不通用。',
        '更換碳粉匣：打開前蓋 → 取出舊匣 → 新匣水平輕搖幾下 → 撕掉封條 → 裝回 → 印測試頁。',
        '常見誤解：「顯示碳粉不足就印不出來」——通常還能再印一陣子。「碳粉匣都通用」——要看機型系列。',
        '參見：碳粉、墨水、十六連擊（與本條目無關）',
        '註釋：[1] 本條目另有 52 節（含古騰堡生平）未顯示。',
      ] },
    },
    wifi: {
      // Claire 其實改得了網路設定，只是最好不要（童童定）
      label: '老闆娘的手機連不上 Wi-Fi', when: wifiVisited, hands: '幫我設定老闆娘的手機', handsSays: '我沒有權限去動公司的網路設定。',
      asks: [
        { id: 'why', say: '密碼對了為什麼連不上？', novel: '這個問題，比您想像的更為深刻。',
          short: '可能的原因：密碼大小寫打錯、訊號太弱、基地台開了 MAC 白名單、手機開了私人位址。' },
        { id: 'reboot', say: 'AP 怎麼重開？', novel: '重開 AP 之方法如下：拔除電源，默數十秒，再行插回。然而，在您動手之前……',
          short: '拔掉 AP 的電源，等十秒再插回去，通常就會好。' },
        { id: 'faster', say: 'Wi-Fi 怎麼變快？', novel: '速度，是無線網路永恆之追求。',
          short: '改連 5 GHz、避開擁擠的頻道、把 AP 放在空曠的地方。' },
      ],
      novel: [
        '前言：在行動辦公的浪潮下，Wi-Fi 的重要性不言而喻。',
        '何謂 Wi-Fi？Wi-Fi 係一種沒有線之網路線。',
        '無線網路自 802.11 問世以來，歷經 b、g、n、ac 至 ax，每一代皆較前一代更為新穎。',
        '重開 AP 將使所有連線同時中斷，全公司同仁將同時失去網路，並同時想起 IT 之存在。',
        '密碼無誤卻無法連線時，宜檢查 AP 是否啟用 MAC 位址白名單；新購之手機，其 MAC 位址自然不在名單之中。',
        '此外，新式手機多半預設開啟「私人位址」，以隨機之 MAC 位址連線，猶如每日變裝之訪客，令白名單無從辨識；須於該網路之詳細資料中關閉。',
        '將白名單整個關閉固然可行，惟此舉將使任何人皆能連線，資安同仁恐將來信關切。',
        '改連訪客網路亦可上網，惟訪客網路通常無法使用公司內部之印表機。',
        '結語：期許本回答能為您的連線帶來長遠且穩定之價值。',
      ],
      pedia: { title: 'Wi-Fi', lines: [
        '概述：Wi-Fi 是無線區域網路的通稱，依據 IEEE 802.11 標準。',
        '標準沿革：Wi-Fi 4＝802.11n、Wi-Fi 5＝802.11ac、Wi-Fi 6＝802.11ax。',
        '存取控制：密碼（WPA2、WPA3）。MAC 位址過濾（白名單）：只有登記過的裝置連得上，換新裝置要重新登記。',
        '私人位址：近年的手機作業系統多半預設開啟，裝置用隨機產生的 MAC 位址連線，這組位址在某些情況下會換新。跟白名單一起用時，在那個網路的設定裡關掉私人位址、登記手機真正的 MAC，才不會哪天又被擋。',
        '疑難排解：密碼正確卻連不上，先看 AP 的連線紀錄有沒有被擋的 MAC。重新啟動 AP 會讓所有人斷線。訪客網路通常跟公司內網隔開。',
        '常見誤解：「重開就會好」——多數連線問題重開不會好，只會讓大家一起斷線。「訊號滿格就連得上」——訊號強弱跟能不能通過驗證是兩回事。',
        '參見：MAC 位址、訪客網路',
        '註釋：[1] 本條目另有 41 節（含 802.11 歷年所有修訂）未顯示。',
      ] },
    },
    outlook: {
      label: '美玲的信箱滿了', when: mailAsked,
      asks: [
        { id: 'clean', say: '信箱滿了怎麼清？', novel: '清理，是一種修行。',
          short: '把信照大小排序，先處理附件大的；不常看的舊信封存到個人的封存檔。' },
        { id: 'all', say: '可以全部刪掉嗎？', novel: '技術上可以。然而，技術上可以之事，所在多有。', short: '可以。' },
        { id: 'quota', say: '信箱上限怎麼調？', novel: '上限，是人為劃定之邊界。',
          short: '請管理者調高信箱配額，或改用容量更大的方案。' },
      ],
      novel: [
        '前言：在電子化溝通的浪潮下，信箱的重要性不言而喻。',
        '何謂信箱？信箱係用來裝信之箱。',
        '電子郵件自 1971 年首度跨電腦寄出以來，人類便開始為信箱容量所苦。',
        '欲找出佔用空間之元兇，宜將信件依大小排序；通常並非信件眾多，而是少數附件龐大，例如被轉寄數十次之影片。',
        '不常查看之舊信，可封存至個人空間；請勿封存至公司共用槽，以免共用槽隨之爆滿，全公司同仁同時無法存檔。',
        '與會計師往來之信件，依規定須妥善保存；刪除之前宜三思，三思之後宜再三思。',
        '清理之後，宜使用量降至安全範圍（例如八成）以下，而非僅低於上限；否則午後一封會議邀請即可使其再度爆滿。',
        '請使用者自行刪信者，使用者通常會刪除最小、最不佔空間之那幾封。',
        '調高上限需管理者權限與預算，屬治標之策。',
        '結語：期許本回答能為您的信箱帶來長遠且寬敞之價值。',
      ],
      pedia: { title: '信箱配額', lines: [
        '概述：信箱配額是郵件伺服器給每個信箱的容量上限，由管理者設定。',
        '超過配額時：快滿時收到警告；超過第一道門檻不能寄信；超過第二道連信都收不到。',
        '佔用來源：大部分空間通常來自少數大型附件，照大小排序最快找到。',
        '清理方式：舊信封存到個人的封存檔，封存檔不要放在共用空間；有保存規定的信件（會計、稽核）不能刪；清到安全範圍以下，不是剛好低於上限。',
        '常見誤解：「信很多所以滿」——多半是附件。「調高上限就解決了」——要權限和預算，之後還會再滿。「請使用者自己刪」——使用者會刪最小的那幾封。',
        '參見：尾牙、轉寄',
        '註釋：[1] 本條目另有 28 節（含 1971 年第一封網路電子郵件的內容考據）未顯示。',
      ] },
    },
  };
  // 每個時代的 Claire：hybrid 挑三姐妹，speedrun 多 Pedia（5 格、98%、一天一次，問一句和交辦共用）。askMin 是問了之後幾分鐘回答；
  // 檢討報告可以交給她寫（童童：AI 很會寫檢討報告），turnaround、accuracy 是交辦用的，跟第二（hybrid）、三天（speedrun）一樣；額度也一樣
  const CLAIRE_AI = {
    hybrid: { model: 'Essay 4.5', quota: 6, permission: 'acceptEdits', models: {
      Verse: { label: 'Verse 4.5', cost: 1, askMin: 1, turnaround: [5, 10], accuracy: 0.4 },
      Essay: { label: 'Essay 4.5', cost: 1, askMin: 2, turnaround: [10, 25], accuracy: 0.5 },
      Novel: { label: 'Novel 4.5', cost: 2, askMin: 4, turnaround: [15, 30], accuracy: 0.65 } } },
    speedrun: { model: 'Essay 5', quota: 10, permission: 'auto', models: {
      Verse: { label: 'Verse 5', cost: 1, askMin: 1, turnaround: [3, 6], accuracy: 0.65 },
      Essay: { label: 'Essay 5', cost: 1, askMin: 2, turnaround: [6, 12], accuracy: 0.75 },
      Novel: { label: 'Novel 5', cost: 2, askMin: 4, turnaround: [10, 20], accuracy: 0.9 },
      Pedia: { label: 'Pedia 5', cost: 5, askMin: 3, turnaround: [10, 20], accuracy: 0.98 } } },
  };
  // 問小潘（同部門的資深同事，三個時代都在，同一批問題，20 分鐘後回、問過就劃掉）。他是人，不會幻覺；問型號會提示能問阿賢（童童定）。
  // hybrid 回得一樣、但會唸你怎麼不問 Claire；speedrun 他懶得回，把他問 Claire Essay 的回答原封不動貼給你（B8964 照貼）
  const PAN = '同事 小潘';
  const PAN_ANSWERS = {
    ddr_how: '工作管理員，效能那頁點記憶體，右上角就寫了。插槽用了幾個也在那頁。',
    junjie: '我又沒看過他的電腦，你自己去看啊。',
    fastest: '數字大的快啊。君傑的主機板吃不吃得下是另一回事。',
    better: '哪台好跟你要換碳粉有什麼關係？',
    model: '我哪知道？除了淑芬大概就阿賢有機會了，財標都他貼的。',
    kinds: '噴墨吃墨水匣，雷射吃碳粉匣。會叫碳粉不足的就是雷射。',
    inkjot: 'MP 的噴墨系列啊，名字都寫 Ink 了。',
    why: '八成是 MAC 白名單，新手機不在名單上。對了，手機的私人位址要先關。',
    reboot: '拔電源，數十秒再插回去。',
    faster: '換新的 AP，跟老闆要預算，祝你好運。',
    clean: '照大小排，通常是幾封大附件。舊信封存到她自己電腦，不要丟共用槽。',
    all: '可以啊，刪了你自己去跟會計師解釋。',
    quota: '要管理者權限跟預算，你兩個都沒有。',
  };
  const PAN_NAG = '……話說你怎麼不問 Claire？公司有買欸。';
  function panBack(mode, ask) {
    if (mode === 'speedrun') return `${ask.short}\n以上，供您參考。`;
    return mode === 'hybrid' ? `${PAN_ANSWERS[ask.id]}\n${PAN_NAG}` : PAN_ANSWERS[ask.id];
  }
  // 小潘的話題：四件事各一條，題目沿用 CLAIRE（含各題的 when）；選項沒寫 next／end，回完就劃掉。speedrun 貼的是 Claire 的回答，know 照記
  const panTalks = (mode) => Object.fromEntries(Object.entries(CLAIRE).map(([id, t]) => [`pan_${id}`, {
    who: PAN, chore: id, delay: [20, 20], when: t.when,
    rounds: [{ options: t.asks.map(a => ({ say: a.say, back: panBack(mode, a), when: a.when, ...(mode === 'speedrun' && a.know ? { know: a.know } : {}) })) }],
  }]));
  const panAsked = (e) => e.docs.filter(d => d.kind === 'sent' && d.from === PAN && d.id.startsWith('talk:pan_')).length;
  // 這關寫的文件：只有檢討報告卡的那份
  const docsWritten = (e) => e.board.cards.filter(c => c.done('report')).length;
  // 結算卡：問 Claire 幾次；問小潘的次數三個時代都列，名詞不同（童童定）：hybrid 是省下的 AI 額度，speedrun 是小潘替你花的（他都請 Essay 代答，一題 1 格）
  const PAN_LINE = { legacy: (n) => `問了小潘 ${n} 次`, hybrid: (n) => `省下的 AI 額度：${n} 格`, speedrun: (n) => `小潘花費的 AI 額度：${n} 格` };
  function hintExtra(e) {
    const n = panAsked(e);
    return [...(e.ai && e.hints.asked ? [`問了 Claire ${e.hints.asked} 次，花了 ${e.hints.spent} 格`] : []), ...(n ? [PAN_LINE[e.script.mode](n)] : [])];
  }

  function make(mode, carry = {}) {
    const claireAi = CLAIRE_AI[mode];
    return {
      name: 'IT 的模糊邊界', issueBase: 300,
      // 這一關沒排開發：沒有 SA（開卡只能指派自己）、沒有 QC（卡做完那件工作就結案）、桌上不放 HTTP 對照表
      noSA: true, noQC: true, noHttpNote: true,
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
      }, {
        // 11:00 老闆娘走到桌邊。講完可以回話：當場看她的手機，或等等去找她；不理她，她放一張便條就走
        kind: 'boss', at: 120, patience: 15, id: 'wifi_visit', title: '老闆娘：手機連不上 Wi-Fi', from: BOSS_WIFE, module: null, chore: 'wifi',
        lines: ['我手機連不上公司 Wi-Fi，密碼明明打對了。'], hand: 'boss_wife',   // 她留的便條用她的字（佮逸體）

        sentences: [{ text: '我手機連不上公司 Wi-Fi，密碼明明打對了。', keep: true }], subtasks: [],
        replies: [{ say: '「手機給我看看」', act: 'phone' }, { say: '「等等去找你」', act: 'leave', back: '好，我在位子上。' }],
      }, {
        kind: 'line', at: 240, id: 'wifi_nag', title: '老闆娘', from: BOSS_WIFE, module: null,
        when: (e) => wifiVisited(e) && e.chores.wifi.stage !== 'done',
        text: '好了嗎？我下午要開視訊會議。', sentences: [], subtasks: [],
      }, {
        kind: 'line', at: 270, id: 'outlook_ask', title: '美玲：信寄不出去', from: MEILING, module: null, chore: 'outlook',
        text: '我的信寄不出去，說信箱滿了。', sentences: [{ text: '我的信寄不出去，說信箱滿了。', keep: true }], subtasks: [],
      },
      // speedrun：公司買了 AI，14:00 碳粉匣還沒換好，老闆傳 LIME 問（只問一次，回什麼都行）
      ...(mode === 'speedrun' ? [{
        kind: 'line', at: 300, id: 'boss_toner', title: '老闆', from: '老闆', module: null,
        when: (e) => e.chores.toner.stage !== 'done',
        text: '公司花這麼多錢買 AI，碳粉為什麼還沒換？', sentences: [], subtasks: [],
        reply: { items: [{ text: '你回：', free: true, options: ['「已經訂了，下午就送到。」', '「AI 沒有手。」', '（已讀）'] }] },
      }] : [])],
      // 主動傳訊（LIME 公司通訊錄）：教君傑看自己的電腦、請阿賢調財產資料。選項沒寫 next／end 的是錯的，對方回完就劃掉；
      // chore 是這個話題跟著的雜事，那件事收尾了（做完或卡結案）就不能再傳
      talks: {
        // 問美玲：幾乎沒用；叫她自己刪，她刪最小的那封（進了刪除的郵件，容量根本沒少）
        meiling: {
          who: MEILING, chore: 'outlook', delay: [2, 4], when: mailAsked,
          rounds: [{ options: [
            { say: '信箱裡有沒有很大的附件？', back: '我的信都很重要，沒有亂存東西。', end: 'answered' },
            { say: '你可以自己刪一些舊信嗎？', back: '刪了一封，還是滿的。', know: 'outlook:selfDelete' },
          ] }],
        },
        // 問老闆娘：線索很隱晦（換了新手機），要自己想到 MAC
        boss_wife: {
          who: BOSS_WIFE, chore: 'wifi', delay: [2, 4], when: wifiVisited,
          rounds: [{ options: [
            { say: '最近有換手機或改過設定嗎？', back: '我什麼都沒動，只是換了新手機，舊手機都好好的。', end: 'answered' },
            { say: '密碼是不是打錯了？', back: '我打三次了，你要不要自己來打？' },
          ] }],
        },
        junjie: {
          who: JUNJIE, chore: 'ram', delay: [3, 6], when: asked,
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
          who: '資產室 阿賢', chore: 'ram', replyBy: 'mail', delay: [60, 60], when: asked, notice: '資料寄到你信箱了，你收一下。',
          rounds: [{ options: [{
            say: '可以幫我調業務君傑那台電腦報財產編號時的詳細資料嗎？', end: 'answered',
            back: { title: '君傑電腦的財產資料', text: '財產編號：SL-2021-0137（業務部 君傑）\n品名：桌上型電腦\n記憶體：8GB DDR4-2666 桌機用 DIMM ×1（主機板四個插槽，用了一個）\n硬碟：256GB SSD\n\n資料是當初報財產時登記的，這幾年沒有人來改過。' },
          }] }],
        },
        // 碳粉匣查機型：淑芬只記得前半段（外殼漆掉了），阿賢 15 分鐘後用信給行政辦公室兩台印表機的型號。know 是回完之後玩家查到的事
        shufen: {
          who: SHUFEN, chore: 'toner', delay: [2, 4], when: tonerAsked,
          rounds: [{ options: [
            { say: '是哪一台印表機？型號是什麼？', back: 'MP-La……什麼的，就是 MP 的那台。', end: 'answered', know: 'toner:partial' },
            { say: '印表機在哪？', back: '就在我旁邊啊，每天都在印。' },
          ] }],
        },
        axian_printer: {
          who: '資產室 阿賢', chore: 'toner', replyBy: 'mail', delay: [15, 15], when: tonerAsked, notice: '資料寄到你信箱了，你收一下。',
          rounds: [{ options: [{
            say: '可以幫我查淑芬辦公室那邊印表機的型號嗎？', end: 'answered', know: ['toner:c8763', 'toner:d87'],
            back: { title: '行政辦公室的印表機', text: '行政辦公室登記的印表機有兩台：\n1. MP LazyJet C8763（財產編號 AD-2019-0042）\n2. MP InkJot D87（財產編號 AD-2022-0108）\n\n型號照報財產時的資料，外殼上的字可能磨掉了。' },
          }] }],
        },
        // 問小潘：三個時代都能問，回法照時代
        ...panTalks(mode),
      },
      // 小事件池（童童定：每天抽幾件、可接可推，推掉不扣分、對方那句進結算卡同事評語）：10:20／14:40／16:20 各一件，LIME 來。
      // trip 是跑一趟的分鐘數，tripText 是黑畫面那句（阿宇補）
      errands: { pick: 3, slots: [80, 340, 440], pool: [
        { id: 'water', who: JUNJIE, text: '飲水機沒水了，你們 IT 可以換一下嗎？', trip: 10, tripText: '你扛著一桶水走到茶水間，換好順便把空桶疊回去。', decline: '你們 IT 不是什麼都會？' },
        { id: 'aircon', who: SHUFEN, text: '冷氣好冷，可以幫忙調高一點嗎？', trip: 5, tripText: '你把冷氣從 22 度調到 26 度，淑芬說終於不用穿外套了。', decline: '冷氣是電器，IT 要負責吧？' },
        { id: 'font', who: '老闆', text: '手機字太小了，過來幫我弄大一點。', trip: 10, tripText: '你把老闆手機的字調到最大，他說這樣好多了，一個畫面只剩三行。', decline: '手機不是 IT 要處理嗎？' },
        { id: 'projector', who: MEILING, text: '投影機沒訊號，等一下要開會，可以幫忙看一下嗎？', trip: 15, tripText: '你把投影機後面鬆掉的線插回去，畫面出來了。', decline: 'IT 不幫我們處理投影機我們怎麼開會？' },
      ] },
      // hybrid、speedrun：終端機可以問 Claire（askable），檢討報告也能交給她寫；筆記是全域的 CLAIRE.md
      ...(claireAi ? { ai: { askable: true, ...claireAi, notes: carry.notes || {} }, claire: CLAIRE } : {}),
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
      }, {
        // Wi-Fi：沒有 3D 工作台，兩個 2D 畫面（她的手機、基地台管理頁）送動作進規則。on 是規則事件對應的傳話
        id: 'wifi', title: '老闆娘的 Wi-Fi', from: BOSS_WIFE, seat: 'boss_wife', rules: WifiRules,
        doneMessage: { text: '連上了，謝謝！' },
        on: {
          outage: [
            { after: 1, from: JUNJIE, text: '網路是不是斷了？報價單送不出去。' },
            { after: 2, from: SHUFEN, text: '印表機也連不到了耶。' },
            { after: 3, from: MEILING, text: 'IT，網路斷了，我報表跑到一半。' },
          ],
          securityMail: { mail: { from: '資安 畇蓁', title: '無線基地台的 MAC 過濾被關閉', text: 'IT 你好：\n\n監控顯示公司無線基地台的 MAC 過濾被關閉了。過濾關掉的時候，任何人知道密碼就能連進公司網路。\n請說明關閉的原因，並盡快恢復。\n\n資安 畇蓁' } },
          printFail: { from: BOSS_WIFE, text: '怎麼印不出來？印表機找不到。' },
        },
      }, {
        // 信箱：她的 OutLuck（她座位）、郵件管理頁（自己電腦，只能看）。什麼時候算清完玩家自己決定，卡上「結案」自己按
        id: 'outlook', title: '美玲的信箱滿了', from: MEILING, seat: 'meiling', rules: MailboxRules,
        doneMessage: { text: '可以寄了，謝謝！' },
        on: {
          shareFull: [
            { from: JUNJIE, text: '共用槽滿了，我的報價單存不進去！' },
            { after: 2, from: SHUFEN, text: '共用槽是不是滿了？會議記錄存不了。' },
          ],
          accountantAsks: [
            { from: MEILING, text: '會計師要上次寄的查帳資料，我信箱裡怎麼找不到了？' },
            { after: 10, mail: { from: 'IT 經理', title: '請寫一份檢討報告：財務部的查帳資料',
              text: '{玩家名稱}：\n\n財務部說會計師的查帳資料在清信箱時被永久刪除了。\n有保存規定的信件不能刪，請寫一份檢討報告給我。\n\nIT 經理',
              sentences: [{ text: '請寫一份檢討報告給我。', keep: true }], cardSpec: AUDIT_REPORT } },
          ],
          // 清到剛好低於上限：第二輪轉寄進來又爆，這則可以開一張新卡（舊卡不重開）
          refull: { from: MEILING, card: true, text: '又寄不出去了！剛剛不是清過了嗎？' },
        },
      }],
      // 同事的座位：人在那邊只帶得到公務手機（LIME、信箱）；actions 是在那邊能做的事，bench 是要開的工作台場景。
      // props 是他桌上的擺設、scenery 是靠牆站在桌子後面的東西（圖照時代畫）；action 的 on 指定按鈕放在哪件東西上，沒寫的放在他的螢幕上
      seats: {
        junjie: {
          who: JUNJIE, title: '君傑的座位', wallpaper: 'sportscar',
          props: [{ label: '名片堆', img: 'business_cards' }, { label: '高爾夫球', img: 'golf_ball' }, { label: '沒洗的咖啡杯', img: 'dirty_mug' }],
          shortcuts: ['報價單_最終版', '報價單_最終版2', '新增資料夾 (37)'],
          actions: [{ id: 'look', label: '看看他的電腦', bench: 'ram', chore: 'ram' }],
        },
        shufen: {
          who: SHUFEN, title: '淑芬的座位', wallpaper: 'family',
          props: [{ label: '一疊待辦文件', img: 'todo_papers' }, { label: '標籤貼紙', img: 'label_stickers' }, { label: '小孩的畫', img: 'kids_drawing' }],
          scenery: [{ label: '印表機櫃', img: 'printer_cabinet' }],
          shortcuts: ['會議室預約', '文具請購'],
          actions: [{ id: 'printer', label: '看看印表機', bench: 'printer', chore: 'toner', on: 'printer_cabinet' }],
        },
        boss_wife: {
          who: BOSS_WIFE, title: '老闆娘的座位', wallpaper: 'landscape',
          props: [{ label: '蘭花', img: 'orchid' }, { label: '全家福', img: 'family_photo' }, { label: '她的手機', img: 'rose_phone' }, { label: '老花眼鏡', img: 'reading_glasses' }],
          shortcuts: [],
          actions: [{ id: 'phone', label: '看看她的手機', phone: 'wifi', on: 'rose_phone' }],
        },
        meiling: {
          who: MEILING, title: '美玲的座位', wallpaper: 'plain',
          props: [{ label: '計算機', img: 'calculator' }, { label: '排整齊的帳冊', img: 'ledgers' }, { label: '一盆多肉', img: 'succulent' }],
          shortcuts: ['報帳系統', 'OutLuck', '試算表', '網路銀行'],
          actions: [{ id: 'mailbox', label: '看看她的信箱', mailbox: 'outlook' }],
        },
      },
      home: { commute: 30, pickupExtra: 15, deliveryWait: 40, vpnMin: 5, vpnDrop: 0.15, ringMin: 20, emergencies: [] },
      // 結算卡多的行（劇本「結算卡多的行」）：其他的跟著各張卡進來
      report: (e) => ({
        extra: [`走了 ${e.stats.trips} 趟`, `寫了 ${docsWritten(e)} 份文件`, ...hintExtra(e), ...(e.stats.turns ? [`機殼轉了 ${e.stats.turns} 圈`] : []),
          ...(e.chores.toner.flags.bought ? [`碳粉匣買了 ${e.chores.toner.flags.bought} 盒`] : []),
          ...(e.chores.wifi.flags.reboots ? [`重開基地台 ${e.chores.wifi.flags.reboots} 次`] : []),
          ...(e.chores.outlook.bench ? [`美玲的信箱清掉 ${MailboxRules.cleared(e.chores.outlook.bench)} MB`] : []), '程式：0 行'],
        traits: [
          ...(e.askedInPerson.has('ram_ask') ? [{ title: '先發制人', text: '君傑還沒開口，你已經站在他座位旁邊了' }] : []),
          ...(e.chores.toner.flags.allIn ? [{ title: '耗材霸總', text: '客服問機型，你說小孩子才做選擇' }] : []),
          ...(junjieNemesis(e.chores.ram.flags) ? [{ title: '君傑的仇人', text: '報價單沒存就關機，記憶體還裝成 12 GB 單通道' }] : []),
          ...(e.chores.ram.flags.hardOff ? [{ title: '硬碟殺手', text: '電腦還開著，你就直接斷了它的電' }] : []),
          ...(e.chores.toner.flags.starburst ? [{ title: '星爆16連擊', text: '碳粉匣搖了 16 下，不多不少' }] : []),
          ...(e.pediaUsed ? [{ title: '今日王牌模型用途', text: `「${e.pediaUsed}」` }] : []),
        ],
        peers: [...ramPeers(e.chores.ram.flags.shown), ...tonerPeers(e.chores.toner.flags), ...wifiPeers(e.chores.wifi), ...outlookPeers(e.chores.outlook, e), ...e.errandPeers()],
      }),
    };
  }
  Sandbox.add('blur', make);
})(typeof window !== 'undefined' ? window : globalThis);
