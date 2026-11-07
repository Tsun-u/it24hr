// sandbox-scenery.js — 正式上班第二關「最美的風景」：源裕水產的 ERP，要讓使用者覺得怎麼填都對（格式要死），流程又不卡任何節點（只忠實記錄）。
// 內容：早會、廠商需求會議（散會後 SA 開卡）、母議題＋模組子議題、茶几。
(function (root) {
  const { Sandbox } = typeof require === 'function' ? require('./sandbox.js') : root;
  const SA = 'SA 怡君';
  const XIUQIN = '源裕 管理部 秀琴姐', JIANHONG = '源裕 少東 建宏', XIONG = '源裕 組長 雄哥';
  // 需求會議的原話：一句一個 { who, text }；投影幕那一頁、卡片內文的原話、需求討論的 segments 都用同一份
  const SAID = {
    buy: [
      { who: XIUQIN, text: '我們的魚有的是魚市場標來的，有的是船直接送來，有的是養殖池邊收的。' },
      { who: XIUQIN, text: '進來就秤，有人講台斤、有人講公斤，阿伯那邊是一簍一簍算。' },
      { who: XIUQIN, text: '價錢喔，就時價啊，每天都不一樣，我們都寫時價，月底再對。' },
      { who: XIUQIN, text: '熟客的價錢照舊啦，我們很有人情味。' },
      { who: XIUQIN, text: '颱風天先收貨，價錢下禮拜再補也可以。' },
    ],
    yield: [
      { who: JIANHONG, text: '我們是加工的，魚進來要去頭、去殼、切片，做完一定會少。' },
      { who: JIANHONG, text: '少多少喔，大概八成吧，看師傅，也看魚。' },
      { who: JIANHONG, text: '同一種魚，季節不一樣，適合的做法也不一樣，這個師傅都知道。' },
      { who: JIANHONG, text: '客戶訂貨的時候要先跟他報做得出多少、多少錢，報太多做不出來會被罵。' },
      { who: JIANHONG, text: '有時候做完發現比較少，就打電話跟客戶喬一下。' },
    ],
    // 現場組長的話由管理部轉述
    shift: [
      { who: XIUQIN, text: '雄哥說：船幾點進來我們就幾點上工，加班多久要看漁獲啦。' },
      { who: XIUQIN, text: '雄哥說：請假就跟組長講一聲，組長不在的話就先跟我說。' },
      { who: XIUQIN, text: '雄哥說：時數喔，有人寫半天、有人寫上午，我們都接受啦。' },
    ],
    // 模組池（每天抽兩張）
    trace: [
      { who: JIANHONG, text: '上次有客人說魚丸吃到怪味道，問我們是哪一批，我們翻了三天的單子才找到。' },
      { who: JIANHONG, text: '一尾虱目魚進來，魚肚、魚皮、魚頭和魚柳分開賣，剩下的肉打成魚丸，這樣也追得到嗎？' },
      { who: JIANHONG, text: '鯊魚丸不是只有鯊魚漿，還要摻一點虱目魚漿，這樣比較Q啦。' },
      { who: JIANHONG, text: '黑鮪魚那個漁業署會綁標籤，每尾都有一張證明。' },
    ],
    stock: [
      { who: XIONG, text: '冷凍庫裡什麼都有啦，我看一下就知道哪一箱是什麼時候進的。' },
      { who: XIONG, text: '蝦子有包冰，秤起來比較重，出貨的時候客人說少，就多給他一點。' },
      { who: XIONG, text: '放太久的就拿去做魚鬆，再不行就做凍乾給狗吃。' },
      { who: XIONG, text: '六月沒魚的時候就靠冬天冰起來的。' },
    ],
    claim: [
      { who: XIUQIN, text: '冷凍車路上壞掉，客人說收到的魚是軟的，他不收，要退錢。' },
      { who: XIUQIN, text: '我們就先退，再跟物流公司要。' },
      { who: XIUQIN, text: '退回來的貨有的還能用，就轉去做寵物食品。' },
      { who: XIUQIN, text: '報銷的單子我都夾在那本藍色的裡面。' },
    ],
  };
  // 需求會議的題庫（各模組「需求討論」那節）：段是原文第幾句（0 起算）。投影幕那一頁、卡上唯讀的需求討論用同一題；
  // 最後一個選項是最客氣的那句（交給 AI 問、骰錯時選它）
  const ASKS = {
    buy: {
      1: { text: '秀琴姐：「反正都是重量嘛。」', options: ['「那報表要用台斤還是公斤？」', '「一簍大概幾公斤？」'], answer: 0,
           replies: ['「會計說要公斤，行情也是公斤。」', '「看魚啊，你這樣問我也不知道。」'] },
      2: { text: '秀琴姐：「就看當天行情啊。」', options: ['「當天行情是看哪裡？魚市場的價錢嗎？」', '「那單價可以空著嗎？」', '「好。」'], answer: 0,
           replies: ['「對啊，看那個漁業署的行情，取中間的價錢，我們都抓那個。」', '「可以啊，月底再對。」', '「讚。」'] },
    },
    yield: {
      1: { text: '建宏：「做久了就知道啦。」', options: ['「每一種魚、每一種處理方式，平常大概剩幾成？有沒有以前的紀錄？」', '「那估量可以讓師傅自己填嗎？」', '「好。」'], answer: 0,
           replies: ['「秀琴姐那邊有本子，每批都有記秤的。」', '「可以啊，他們最準。」', '「讚。」'] },
      2: { text: '建宏：「師傅都知道啦。」', options: ['「什麼魚、什麼季節適合做什麼，有沒有寫下來的？」', '「那讓師傅們每次都自己選？」'], answer: 0,
           replies: ['「……好啦，雄哥有一張沾滿油的筆記貼在牆上，新人都當寶在拜。」', '「對啊，他們最懂。」'] },
      // 報量保守、多做的怎麼辦：一段兩題同時出現，兩題都問到才算問清楚
      3: [
        { text: '建宏：「報太多做不出來會被罵。」', options: ['「報量要不要留一點保守？例如照估的再打九折報？」', '「那就照估的全報？」'], answer: 0,
          replies: ['「對對對，以前都是少報一點比較安全。」', '「……做不出來誰負責？」'] },
        { text: '建宏：「少報就對了啦。」', options: ['「少報的話，多做出來的會變庫存，那些怎麼辦？」', '「好，那就九折。」'], answer: 0,
          replies: ['「做魚鬆啊，罐頭也可以，再賣不完就做凍乾給寵物吃，我們是加工的，不會浪費。不過越後面越不值錢，放越久越虧。上次轉過去也沒記，月底魚鬆的成本算不出來。那保守要抓多少，你們幫我們算？」', '「讚。」'] },
      ],
    },
    // 秀琴姐轉述雄哥的話，問的也是她
    shift: {
      0: { text: '秀琴姐：「就看船啊，船晚到就做到半夜。」', options: ['「加班是記幾點上工、幾點收工，還是直接寫做了幾小時？」', '「那加班時數讓他們自己估一個數字？」', '「好。」'], answer: 0,
           replies: ['「他們都寫幾點到幾點啦，我月底再一張一張自己算，跨過半夜的最難算。」', '「可以啊……不過上次有人寫『看漁獲』，薪水我要怎麼算？」', '「讚。」'] },
      1: { text: '秀琴姐：「組長不在就找我啊。」', options: ['「凌晨進港的時候大家都在忙，加班單是誰登記、誰簽？」', '「那就規定一定要組長簽了才算？」', '「好。」'], answer: 0,
           replies: ['「凌晨大家都在碼頭忙，組長跑來跑去最找不到人。誰有空誰先登記，組長忙完再補簽，有時候隔天才補。」', '「組長在碼頭跑來跑去，等他簽，人都下工了。」', '「讚。」'] },
      2: { text: '秀琴姐：「都看得懂啊，我們不會計較。」', options: ['「請假最小可以請多久？有人寫半天、有人寫 3 小時，扣多少是照幾點到幾點算嗎？」', '「那請假就分上午、下午、全天三種？」', '「好。」'], answer: 0,
           replies: ['「對，最少可以請半小時。我現在都要再問他幾點到幾點，自己算扣多少。」', '「那請 3 小時的人要選哪個？」', '「讚。」'] },
    },
    trace: {
      2: { text: '建宏：「大家都這樣做啦。」', options: ['「摻多少有固定嗎？成本要怎麼算？」', '「那魚丸的原料就寫鯊魚？」', '「長知識了。」'], answer: 0,
           replies: ['「看鯊魚漿還剩多少啊……好啦，雄哥有個比例，我叫他寫給你們。」', '「對啊，鯊魚丸嘛。」', '「這是公開的美味秘密。」'] },
    },
    stock: {
      0: { text: '雄哥：「我在這裡做三十年了。」', options: ['「雄哥休假的時候呢？」', '「好，那就問雄哥。」'], answer: 0, replies: ['「……那就找不到了。」', '「對啊，問我就好。」'] },
      1: { text: '雄哥：「做生意嘛。」', options: ['「冰衣大概占幾成？有在量嗎？」', '「那出貨就照毛重開？」', '「好。」'], answer: 0,
           replies: ['「每家都說自己包得很薄啦……好啦，可以抽幾包解凍秤看看。」', '「客人會罵啊。」', '「讚。」'] },
    },
  };
  const QUESTION = (id) => ({ kind: 'discuss', segments: SAID[id].map(s => s.text), asks: ASKS[id] || {} });
  const meetingDiscuss = (id) => ({ work: 'discuss', question: { ...QUESTION(id), fromMeeting: id } });   // 唯讀：散會時記成做完
  // 卡片內文：SA 整理的需求句＋需求會議原話（整理需求從原話裡畫重點）
  const bodyOf = (lines, id, who = '需求單位：源裕水產管理部 秀琴姐') => `${who}\n${lines.map(l => `・${l}`).join('\n')}\n\n需求會議原話：\n${SAID[id].map(s => s.text).join('\n')}`;

  // ── #401 收購計價 ──
  const BUY = {
    id: 'buy', title: '收購計價', from: SA, assignee: '玩家', requester: XIUQIN, type: 'sub', parent: 'erp', relatedTo: 'erp',
    body: bodyOf(['記每一筆收購：來源、品種、重量、單價', '單價每天不一樣', '熟客可以用比較好的價錢', '價錢晚點補也要能先收貨'], 'buy'),
    attachments: ['原文：09:30 廠商需求會議（秀琴姐）'],
    // 主卡的需求單位評語（結算卡）：結案了但紅字多到「紅字地獄」，秀琴姐就不誇了
    reviews: { who: XIUQIN, undone: '「明天還是寫紙本。」',
      done: (e) => e.usageTally().red > RED_HELL ? '「系統是不錯，但早就跟建宏說電腦比不上人腦啦。」' : '「雄哥說這個好用，手套都不用脫。」' },
    // 會議裡漏問的補救：退回 SA 勾對的，SA 問回來補在卡上（adds），需求討論那段記成問過（asked）
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '單價說的「當天行情」是看哪裡？', right: true, adds: '單價照漁業署行情的中價（秀琴姐）', asked: 2 },
      { text: '報表要用台斤還是公斤？', right: true, adds: '報表一律用公斤（會計要的）', asked: 1 },
      { text: '單價可以空著嗎？', right: false, why: '秀琴姐會上講過了，颱風天先收貨、晚點補' },
      { text: '一簍大概幾公斤？', right: false, why: '看魚，秀琴姐也說不準' },
    ] }],
    // form：成品多一張新增收購單（欄位照前端設計畫）；bugs 直接寫開發寫錯時那一格變成什麼、用的人講什麼
    screen: { app: '源裕水產 ERP・收購單', form: true, fields: ['日期', '來源', '品種', '規格', '重量（公斤）', '單價（元／公斤）', '備註'],
      rows: [['11/04', '魚市場拍賣', '鯖魚（花腹鯖）', '每公斤 6 尾', '估 120.0／實 117.9', '86', ''],
             ['11/04', '養殖池邊', '虱目魚', '大', '估 300.0／實 297.0', '待補', '颱風天先收'],
             ['11/04', '漁船直送', '鋸緣青蟳（紅蟳・母）', '一台斤 2 隻', '估 18.0／實 18.0', '650', '熟客：阿伯']],
      bugs: {
        saveBuy: { voice: '估重被實重蓋掉了，差多少都不知道。', cells: { '重量（公斤）': '117.9' } },
        defaultPrice: { voice: '單價怎麼帶今天最高價？我們都抓中價。', cells: { '單價（元／公斤）': '120' } },
        toKg: { voice: '秤的是 200 台斤，系統說 100 公斤？', cells: { '重量（公斤）': '估 100.0／實 98.3' } },
        fillPrice: { voice: '待補的那批用 0 元算進成本，毛利高得嚇人。', row: 1, cells: { '單價（元／公斤）': '0' } },
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['每一筆收購記來源、品種、重量、單價', '單價每天不一樣', '熟客價', '價錢晚點補也能先收貨', '有人講台斤、有人講公斤', '來源有魚市場、漁船、養殖池邊'],
        items: [
          { text: '單價____', options: ['每天照行情不一樣', '固定一個價，月底再對', '寫「時價」就好'], answer: 0 },
          { text: '熟客的價錢____', options: ['可以比較好', '跟大家一樣', '看秀琴姐心情'], answer: 0 },
          { text: '價錢還沒定的時候____', options: ['也要能先收貨', '先不收貨', '單價先填 0'], answer: 0 },
          { text: '「我們很有人情味」是____', options: ['背景，不是要做的功能', '要做一個「人情味」欄位', '要把防呆拿掉'], answer: 0 },
        ] } },
      meetingDiscuss('buy'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '收購計價這個模組連測試、驗收、部署，你估：', real: { manual: '4 天', ai: '1.5 天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['跟建宏、雄哥對品種別名表', '設計收購單資料表（估重、實重、單價待補）', '做收購單的新增與查詢', '單價帶入前一交易日中價、改價自動記錄',
                  '重量單位下拉、換算公斤', '單價待補的單每天提醒秀琴姐', '寫測試', '部署到測試機', '做員工登入打卡', '做一個「人情味」欄位'],
        answer: [0, 1, 2, 3, 4, 5, 6, 7], before: [[1, 2], [2, 3], [2, 4], [2, 5], [3, 7], [4, 7], [5, 7], [6, 7]],
        why: '登入打卡不在需求裡；人情味是背景，不是欄位',
        given: [
          { work: 'read_req', options: [3], when: { item: 0, picked: 0 } }, { work: 'read_req', options: [5], when: { item: 2, picked: 0 } },
          { work: 'discuss', options: [3], when: { item: 2, picked: 0 } }, { work: 'discuss', options: [4], when: { item: 1, picked: 0 } },
          { work: 'reject', options: [3], when: { item: 0, picked: 0 } }, { work: 'reject', options: [4], when: { item: 0, picked: 1 } },   // 退回 SA 問回來的視同會議問過
        ] }] } },
      // 規格：流程彈性的五題，只負責預填開發（規格連動的 function）
      { work: 'doc_spec', question: { items: [
        { text: '拍賣前還不知道實重', options: ['先記估計重量，過磅後補實重，兩個都留著', '一定要填實重才能存'], answer: 0 },
        { text: '颱風天價錢還沒定', options: ['可以先收貨、單價標「待補」，補了才進成本，待補的單每天提醒秀琴姐', '單價沒填不能存'], answer: 0 },
        { text: '熟客價', options: ['客戶等級下拉帶出價錢，手動改價照改，程式記誰改、什麼時候改、改前改後', '熟客價直接改單價欄、不留紀錄'], answer: 0 },
        { text: '休漁', options: ['收購記捕撈日期和來源，照收不擋、不用誰確認；捕撈日期落在法定休漁、來源又是本地漁船的，單子自動標「休漁期捕撈」，月底報表一查就有（進口的和冷凍庫存不標）。業界不捕的月份（鯖魚 2～5 月）只在收購畫面提醒「這時候進來的量會很少」',
                                 '休漁期跳出來要主管確認', '休漁月份整個擋掉這種魚', '不管休漁'], answer: 0 },
        { text: '鯖魚大小（2026 年 9 月的新規：體長 20 公分以上或每公斤 10 尾以下）', options: ['規格填每公斤幾尾，照收，記下每公斤幾尾，超過 10 尾的批次在報表上標「小魚」', '照舊規格只分大中小'], answer: 0 },
      ] } },
      // 前端設計：每題是成品畫面上的一個欄位（field），sample 是正解時那一格的樣子；outcome 是選錯的寫法上線後的後果，
      // ifSkipped 是沒做前端設計時那一格的樣子（沒人想過時最直覺的做法）
      { work: 'ui_design', question: { items: [
        { role: 'field', field: '單價（元／公斤）', text: '單價', sample: '86（前一交易日中價，可改）', answer: 0, ifSkipped: 2,
          options: ['預設帶入前一個交易日該市場的中價，可以改，程式自動記誰改、改前改後；原因用下拉選填（熟客價、颱風價、品質差），不選也存得了', '文字框，不是數字就跳紅字「請輸入正確的單價」', '文字框，什麼都收'],
          outcome: { 1: { kind: 'annoy', say: '時價哪裡不正確？', red: '請輸入正確的單價' },
                     2: { kind: 'miss', say: '單價寫『時價』也送得出去，月底算不出成本', junk: '時價' } } },
        { role: 'field', field: '重量（公斤）', text: '重量', sample: '200 台斤 → 120.0 公斤', answer: 0, ifSkipped: 2,
          options: ['數字，單位下拉，旁邊一個唯讀輸入框顯示換算後的公斤值', '數字，單位讓人自己打', '文字框，什麼都收'],
          outcome: { 1: { kind: 'annoy', say: '我打『斤』它說單位不正確', red: '單位不正確' },
                     2: { kind: 'miss', say: '重量寫『一簍』也送得出去', junk: '一簍' } } },
        { role: 'field', field: '來源', text: '來源', sample: '魚市場拍賣 ▸ 第一市場', answer: 0, ifSkipped: 2,
          options: ['下拉：魚市場拍賣（再選哪個市場）、漁船直送、養殖池邊、進口', '文字框，查無此來源跳紅字', '文字框，什麼都收'],
          outcome: { 1: { kind: 'annoy', say: '就跟阿伯買的啊，哪裡查無此來源？', red: '查無此來源' },
                     2: { kind: 'miss', say: '來源寫『阿伯』也送得出去，出事查不到是哪一船', junk: '阿伯' } } },
        { role: 'field', field: '品種', text: '品種', sample: '花飛 → 鯖魚（花腹鯖）／鯖魚（白腹鯖）', answer: 0, ifSkipped: 4,
          options: ['下拉，打本土名字也找得到：打「花飛」跳出鯖魚，選項寫成「鯖魚（花飛）」。同一個俗名對到兩種魚時兩種都列出來讓人選（花飛 → 花腹鯖、白腹鯖）。分到現場分得出來的那一層就好（黑鯊只開到「黑鯊（真鯊類）」，串仔、烏甕串也是一類一種）。系統裡每種魚用固定代碼存，別名表在需求討論時跟建宏、雄哥對一次。',
                    '下拉只列華語名', '下拉硬要分到種（黑鯊開七種）', '別名只對一種魚', '文字框'],
          outcome: { 1: { kind: 'annoy', say: '花飛是哪一個？', red: '查無此品種：花飛' },
                     2: { kind: 'annoy', say: '長得都一樣，你叫我選哪一個？', red: '請從 7 種黑鯊中選一種' },
                     3: { kind: 'late', say: '這批花飛到底是花腹鯖還是白腹鯖？單子上只寫花飛，月底兩種的數量都對不上' },
                     4: { kind: 'miss', say: '同一種魚記成花飛、鯖魚、青花魚，月底報表變三列', junk: '青花魚' } } },
        { role: 'field', field: '規格', text: '規格', sample: '鯖魚：每公斤 6 尾', answer: [0, 1, 2], ifSkipped: [3],
          options: ['照品種換選項：魚大中小；鯖魚每公斤幾尾；蝦每磅、每公斤或每台斤幾隻，連單位一起選；烏魚子幾兩；烏魚分正頭烏、回頭烏；青蟳分沙公、處女蟳、紅蟳，選項旁邊標公母',
                    '可隨時新增新單位，新增單位時如果trim過後發現系統已經存在視同修改。', '可隨時新增新品項，新增品項如果trim過後發現系統已經存在視同修改。',
                    '規格一個文字框通用', '青蟳的規格只有大中小', '蝦只寫 31/40 不寫單位'],
          outcome: { 3: { kind: 'annoy', say: '烏魚子是講兩的，你叫我填公斤？', red: '規格請填公斤' },
                     4: { kind: 'late', say: '紅蟳跟沙公算同一個價，這批成本整個算錯' },
                     5: { kind: 'late', say: '魚市場的 31/40 是每台斤，客人要的是每磅，整批大小不對' } } },
        // 沒做前端設計就是選填的文字框，剛好是正解，所以不寫 ifSkipped；input 'free'：正解那一格畫成自由填的文字框（沒寫是下拉）
        { role: 'field', field: '備註', text: '備註', sample: '（選填）', input: 'free', answer: 0, options: ['選填、什麼都收、不擋', '必填'],
          outcome: { 1: { kind: 'annoy', say: '沒什麼好備註的也要寫？', red: '備註為必填' } } },
        { role: 'field', field: null, text: '系統日誌', answer: 0,
          options: ['所有的系統操作都要有審計表紀錄資料變更，且前端能追溯是何人何時操作的。', '所有的系統操作要紀錄成文字檔案，可以直接下載。'] },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['新增一筆收購：估重、實重都留著', '單價帶入前一交易日中價，改價自動記下誰改、改前改後', '重量選台斤，換算成公斤正確', '單價待補也能存，補了才進成本',
                  '打「花飛」，花腹鯖、白腹鯖都列出來', '休漁期捕撈的本地漁船貨照收、自動標記', '壓測十萬筆收購單'],
        answer: [0, 1, 2, 3, 4, 5], why: '源裕一天幾十張單',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [1], when: { item: 0, picked: 3 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 4 } }, { work: 'doc_plan', options: [3], when: { item: 0, picked: 5 } },
          { work: 'doc_plan', options: [4], when: { item: 0, picked: 0 } },
          { work: 'doc_spec', options: [0], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [3], when: { item: 1, picked: 0 } },
          { work: 'doc_spec', options: [5], when: { item: 3, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 1 }, accept: 0, name: 'saveBuy', does: '存一筆收購單',
          code: "db.insert('buy', { estKg, kg, price: price ?? '待補', by: user, at: now });",
          fields: { keep: { label: '估重和實重', options: ['估重、實重各存一欄', '實重蓋掉估重', '只存估重'], answer: 0 } } },
        { sentence: 1, needs: { work: 'doc_plan', picked: 3 }, accept: 1, name: 'defaultPrice', does: '帶入單價的預設值',
          code: 'return quotes.mid(species, market, prevTradingDay(today));',
          fields: { from: { label: '預設帶哪個價錢', options: ['前一交易日、同一個市場的中價', '今天的最高價', '上一筆收購的單價'], answer: 0 } } },
        { sentence: 0, needs: { work: 'doc_plan', picked: 4 }, accept: 2, name: 'toKg', does: '把重量換算成公斤',
          code: "return unit === '台斤' ? qty * 0.6 : qty * UNIT_KG[unit];",
          fields: { rate: { label: '台斤換公斤', options: ['台斤 × 0.6', '台斤 × 0.5', '台斤 ÷ 0.6'], answer: 0 } } },
        { sentence: 3, needs: { work: 'doc_plan', picked: 5 }, accept: 3, name: 'fillPrice', does: '補上待補的單價',
          code: "Object.assign(row, { price, costed: true, audit: [...row.audit, { by, at, from: '待補', to: price }] });",
          fields: { when: { label: '什麼時候算進成本', options: ['補了單價才算進成本', '收貨當下用 0 元算進成本', '月底再一次算'], answer: 0 } } },
        // 規格連動：spec.item 是規格第幾題，選項跟規格那題一一對應；不寫 needs（不然會被計畫整個拉進來鎖住）。
        // 後果掛在這裡（規格只負責預填）；ifSkipped 是沒寫開發時程式長的樣子
        { spec: { item: 0 }, name: 'noWeightYet', does: '還沒過磅的收購單', code: 'saveBuy({ ...form, kg: form.kg ?? null });',
          fields: { flow: { label: '還沒過磅', options: ['先記估計重量，過磅後補實重，兩個都留著', '一定要填實重才能存'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '船還在路上，我現在哪知道多重？' } } } } },
        { spec: { item: 1 }, name: 'pendingPrice', does: '價錢還沒定的收購單', code: "saveBuy({ ...form, price: form.price ?? '待補' }); remindDaily('秀琴姐', pendingBuys());",
          fields: { flow: { label: '還沒定價', options: ['先收貨、單價標「待補」，補了才進成本，每天提醒秀琴姐', '單價沒填不能存'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '魚都進冷凍庫了，單子還開不出來？' } } } } },
        { spec: { item: 2 }, name: 'regularPrice', does: '熟客的價錢', code: 'audit.log({ by: user, at: now, field: "price", from: old, to: price });',
          fields: { flow: { label: '熟客改價', options: ['客戶等級帶出價錢，手動改價程式記誰改、什麼時候、改前改後', '直接改單價欄、不留紀錄'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '月底不知道為什麼這筆比較便宜' } } } } },
        { spec: { item: 3 }, name: 'closedSeason', does: '休漁期進來的魚', code: "if (inClosedSeason(catchDate, species) && source === '本地漁船') row.tags.push('休漁期捕撈');",
          fields: { flow: { label: '休漁期', options: ['照收不擋、本地漁船自動標「休漁期捕撈」，業界不捕的月份只提醒', '休漁期跳出來要主管確認', '休漁月份整個擋掉這種魚', '不管休漁'], answer: 0, ifSkipped: 3,
            outcome: { 1: { kind: 'stuck', say: '主管在魚市場，船上的魚要等他回來才能收？' },
                       2: { kind: 'stuck', say: '這是挪威進口的，六月也不給收？' },
                       3: { kind: 'late', say: '休漁期間收了本地漁船直送的鯖魚，月底對帳才發現' } } } } },
        { spec: { item: 4 }, name: 'smallFish', does: '小鯖魚', code: "if (species === '鯖魚' && perKg > 10) row.tags.push('小魚');",
          fields: { flow: { label: '鯖魚大小', options: ['記每公斤幾尾，超過 10 尾的批次報表標「小魚」', '照舊只分大中小'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '新規上路了，系統還讓小魚一路收進來' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testKeepsEstimate', does: '估重、實重都留著', code: 'expect(row.estKg).toBe(120); expect(row.kg).toBe(117.9);',
          fields: { assert: { label: '檢查', options: ['存完估重、實重兩欄都有值', '存完至少有一個重量', '存得進去就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testDefaultPrice', does: '單價預設是中價', code: "expect(defaultPrice('鯖魚', '魚市場拍賣')).toBe(86);",
          fields: { assert: { label: '檢查', options: ['預設是前一交易日、同市場的中價', '預設不是空的', '預設是今天最高價'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testTaijinToKg', does: '台斤換公斤', code: "expect(toKg(10, '台斤')).toBe(6);",
          drives: { fn: 'toKg', field: 'rate', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['10 台斤換成 6 公斤', '10 台斤換成 5 公斤', '換算結果是數字就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testPendingNotCosted', does: '待補的單補了才進成本', code: 'expect(costOf(row)).toBeNull(); fillPrice(row, 90); expect(costOf(row)).toBe(26730);',
          fields: { assert: { label: '檢查', options: ['待補的單不算成本，補了才算', '待補的單用 0 元算', '待補的單不能存'], answer: 0 } } },
        { name: 'testHundredThousand', does: '十萬筆一秒內存完',
          fields: { assert: { label: '檢查', options: ['源裕一天幾十張單，不用測', '十萬筆一秒內存完', '一萬筆一秒內存完'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份測試機上的源裕 ERP', '上傳新版', '替換', '開網址新增一筆收購試試', '通知秀琴姐'], answer: [0, 1, 2, 3],
          why: '通知秀琴姐要等 QC 驗過，從已完成的卡上按' }] } },
    ],
  };

  // ── #402 加工估量與報價 ──
  const YIELD = {
    id: 'yield', title: '加工估量與報價', from: SA, assignee: '玩家', requester: XIUQIN, type: 'sub', parent: 'erp', relatedTo: 'erp',
    body: bodyOf(['記每批加工前後的重量，算出貨損', '用收購重量估出做得出多少', '照估出來的量跟訂購客戶報量、報價', '做完比估的少，要能通知客戶改量'],
      'yield', '需求單位：源裕水產管理部 秀琴姐（原話是建宏在需求會議講的）'),
    attachments: ['原文：09:30 廠商需求會議（建宏）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '每種魚、每種處理方式平常剩幾成？有沒有紀錄？', right: true, adds: '得率照秀琴姐本子上每批的紀錄', asked: 1 },
      { text: '什麼魚、什麼季節適合做什麼，有沒有寫下來？', right: true, adds: '處理方式照雄哥牆上那張（拍照當附件）', asked: 2 },
      { text: '報量要不要留保守？多做出來的怎麼辦？', right: true, adds: '報量的保守比例做成設定由建宏定；多的轉魚鬆、罐頭，批號和成本帶過去', asked: 3 },
      { text: '估量可以讓師傅自己填嗎？', right: false, why: '師傅忙，而且報價要的是算得出來的數字' },
    ] }],
    screen: { app: '源裕水產 ERP・加工估量', form: true, fields: ['批號', '品種', '處理方式', '加工前（公斤）', '得率', '估出貨量（公斤）', '貨損（公斤）'],
      rows: [['B1104-01', '鯖魚（花腹鯖）', '去頭去內臟', '120.0', '58%', '69.6', '—'], ['B1103-07', '虱目魚', '切片（魚肚）', '297.0', '62%', '184.1', '11.4']],
      bugs: {
        lossOf: { voice: '邊角料也算成貨損了，貨損多得嚇人。', row: 1, cells: { '貨損（公斤）': '112.9' } },
        estimateOutput: { voice: '估出貨量跟得率沒關係，每種魚都打八折。', cells: { '估出貨量（公斤）': '96.0' } },
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['加工前後秤重、算貨損', '用收購重量估出貨量', '照估的量報量報價', '做完比較少要通知客戶改量', '得率看魚、看季節、看處理方式'],
        items: [
          { text: '加工完的重量____', options: ['一定比收購少，要算貨損', '跟收購一樣', '看師傅高興'], answer: 0 },
          { text: '跟客戶報的量____', options: ['照估出來的量報', '照收購重量報', '做完再報'], answer: 0 },
          { text: '做完比估的少____', options: ['要能通知客戶改量', '整張訂單作廢', '不用管'], answer: 0 },
          { text: '「看師傅」是____', options: ['要問清楚的地方，不是需求本身', '需求：讓師傅自己填得率', '可以忽略'], answer: 0 },
        ] } },
      meetingDiscuss('yield'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '加工估量與報價這個模組連測試、驗收、部署，你估：', real: { manual: '5 天', ai: '2 天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['整理得率表（品種×產季×處理方式）', '設計加工批資料表（加工前後重量、成品、邊角料）', '做加工單（前後秤重、貨損）', '估出貨量與報量（保守比例做成設定）',
                  '做完比估的少：部分出貨、改量重新報價', '多的轉二次加工，批號和成本帶過去', '寫測試', '部署到測試機', '讓師傅自己填得率', '做客戶滿意度問卷'],
        answer: [0, 1, 2, 3, 4, 5, 6, 7], before: [[0, 3], [1, 2], [2, 3], [3, 4], [3, 5], [4, 7], [5, 7], [6, 7]],
        why: '得率要照紀錄算，不是讓師傅自己填；滿意度問卷不在需求裡',
        given: [
          { work: 'read_req', options: [4], when: { item: 2, picked: 0 } },
          { work: 'discuss', options: [0], when: { item: 1, picked: 0 } }, { work: 'discuss', options: [5], when: { item: 3, sub: 1, picked: 0 } },
          { work: 'reject', options: [0], when: { item: 0, picked: 0 } }, { work: 'reject', options: [5], when: { item: 0, picked: 2 } },   // 退回 SA 問回來的視同會議問過
        ] }] } },
      { work: 'doc_spec', question: { items: [
        { text: '估量要先報、實重後來才有', options: ['先用收購估重報量，過磅、加工完自動換成實際的數字，差太多提醒業務', '一定要加工完才能報量'], answer: 0 },
        { text: '做完比估的少', options: ['可以部分出貨、剩的延後補，或改量後重新報價，客戶確認前原單照留', '訂單成立後不能改'], answer: 0 },
        { text: '做完比估的多', options: ['多的先分給其他有訂的客戶，再來入庫（記入庫日和效期）、轉二次加工（罐頭、魚鬆）、最後做凍乾寵物食品；每轉一次原料批號和成本都帶過去，魚鬆再照它自己的得率估量',
                                     '多的只能入庫', '轉二次加工不留紀錄', '多的沒地方記'], answer: 0 },
        { text: '產季的起訖', options: ['每個品種的產季做成設定，每年可以調；過渡期兩邊的得率都列出來給人選；休漁有照農曆算的（鯖魚農曆年前後、鎖管農曆二月十月），設定要能填農曆', '照月份寫死'], answer: 0 },
        { text: '報量的保守比例', options: ['做成設定，建宏可以調，預設值寫在設定頁上', '寫死九折在程式裡'], answer: 0 },
        { text: '放越久越不值錢', options: ['每次轉下去都記日期和成本，報表看得到一批從入庫到做成什麼、中間放了幾天、毛利掉在哪；入庫放到設定的天數就提醒該不該轉', '轉作只記去向、不記日期'], answer: 0 },
      ] } },
      { work: 'ui_design', question: { items: [
        { role: 'field', field: '處理方式', text: '處理方式', sample: '去頭去內臟（當季建議）', answer: 0, ifSkipped: 2,
          options: ['下拉，照品種和現在是不是產季排順序，當季建議的排最前面、標「當季建議」；其他做法還是選得到', '只列當季建議那一個', '文字框，什麼都收'],
          outcome: { 1: { kind: 'stuck', say: '客戶就是要整尾的，你不給我選？' },
                     2: { kind: 'miss', say: '處理方式寫『照舊』也送得出去，得率帶不出來', junk: '照舊' } } },
        { role: 'field', field: '得率', text: '得率（加工後剩幾成）', sample: '58%（去年冬季平均，可改）', answer: 0, ifSkipped: 2,
          options: ['照品種×產季×處理方式（去頭去殼、切片、整尾急凍、魚鬆、罐頭）帶出預設值，預設值用過去同一季實際的平均；誰都能改，程式記誰改、改前改後，報表看得到哪一批用的是改過的得率',
                    '文字框，不是百分比跳紅字', '文字框，什麼都收'],
          outcome: { 1: { kind: 'annoy', say: '八成就八成，你要我打 0.8 還是 80%？', red: '請輸入 0～1 之間的數字' },
                     2: { kind: 'miss', say: '得率寫『看師傅』也送得出去，估量整個算不出來', junk: '看師傅' } } },
        { role: 'field', field: '估出貨量（公斤）', text: '估出貨量', sample: '69.6（自動算）', answer: 0, ifSkipped: 1,
          options: ['程式算：收購（估或實）重量 × 得率，不給手打', '讓業務自己填'],
          outcome: { 1: { kind: 'late', say: '報了 500 公斤，估量其實只有 380', kg: { short: 120 } } } },
        { role: 'field', field: '貨損（公斤）', text: '貨損', sample: '11.4（自動算，原因選填）', answer: 0, ifSkipped: 2,
          options: ['加工前後各秤一次，加工後分成品、邊角料（頭尾骨，可以轉凍乾寵物食品）兩項秤，貨損程式算；差太多跳出原因下拉（去頭去殼、解凍失水、挑掉不良品、冷凍乾耗），選填、不擋存檔',
                    '原因用文字框', '只記加工後重量'],
          outcome: { 1: { kind: 'annoy', say: '就少了啊，還要寫為什麼？', red: '請輸入貨損原因' },
                     2: { kind: 'late', say: '貨損無從查起，月底對不出成本' } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['加工前後各秤一次，貨損自動算', '估出貨量＝收購重量×得率，不能手打', '報量照設定的保守比例打折', '做完比估的少：可以部分出貨、原單照留',
                  '多的轉魚鬆，原料批號和成本帶過去', '改過的得率報表看得到是誰改的', '一次估一萬批的效能'],
        answer: [0, 1, 2, 3, 4, 5], why: '源裕一天幾批',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 2 } }, { work: 'doc_plan', options: [1, 2], when: { item: 0, picked: 3 } },
          { work: 'doc_plan', options: [3], when: { item: 0, picked: 4 } }, { work: 'doc_plan', options: [4], when: { item: 0, picked: 5 } },
          { work: 'doc_plan', options: [5], when: { item: 0, picked: 0 } },
          { work: 'doc_spec', options: [3], when: { item: 1, picked: 0 } }, { work: 'doc_spec', options: [4], when: { item: 2, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 2 }, accept: 0, name: 'lossOf', does: '算貨損',
          code: 'return before - (product + trimmings);',
          fields: { how: { label: '貨損怎麼算', options: ['加工前 −（成品＋邊角料）', '加工前 − 成品', '成品 − 加工前'], answer: 0 } } },
        { sentence: 1, needs: { work: 'doc_plan', picked: 3 }, accept: 1, name: 'estimateOutput', does: '估出貨量',
          code: 'return buyKg * yieldRate(species, season, method);',
          fields: { how: { label: '怎麼估', options: ['收購重量 × 得率', '收購重量 × 0.8', '業務填的數字'], answer: 0 } } },
        { spec: { item: 0 }, name: 'quoteEarly', does: '先報量', code: 'quote(estimateFrom(buy.estKg)); onWeighed(batch, requote);',
          fields: { flow: { label: '估量先報', options: ['先用估重報量，過磅、加工完換成實際的數字，差太多提醒業務', '一定要加工完才能報量'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '客戶今天就要報價，你叫我等明天？' } } } } },
        { spec: { item: 1 }, name: 'shortfall', does: '做完比估的少', code: 'order.partial(shipKg); order.keep();',
          fields: { flow: { label: '做完比較少', options: ['可以部分出貨或改量重新報價，客戶確認前原單照留', '訂單成立後不能改'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '少 20 公斤整張單作廢重開？' } } } } },
        { spec: { item: 2 }, name: 'surplus', does: '做完比估的多', code: 'allot(extra, [otherOrders, stock, reprocess, petFood]);',
          fields: { flow: { label: '做完比較多', options: ['先分給其他訂單，再入庫、轉二次加工、做凍乾，每轉一次批號和成本都帶過去', '多的只能入庫', '轉二次加工不留紀錄', '多的沒地方記'], answer: 0, ifSkipped: 3,
            outcome: { 1: { kind: 'stuck', say: '這些要拿去做魚鬆，系統叫我入庫？' },
                       2: { kind: 'late', say: '魚鬆的成本跟原料批號都查不到' },
                       3: { kind: 'late', say: '冷凍庫多出 40 公斤，帳上沒有', kg: { untracked: 40 } } } } } },
        { spec: { item: 3 }, name: 'seasons', does: '產季的起訖', code: 'return settings.seasons[species][year];',
          fields: { flow: { label: '產季', options: ['做成設定、每年可以調、能填農曆，過渡期兩邊的得率都列出來', '照月份寫死'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '今年漁汛晚了兩個禮拜，系統已經說是產季，得率整個估錯' } } } } },
        { spec: { item: 4 }, name: 'quoteRatio', does: '報量的保守比例', code: 'return estimate * settings.quoteRatio;',
          fields: { flow: { label: '保守比例', options: ['做成設定，建宏可以調', '寫死九折在程式裡'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '漁汛的時候貨多，我想報滿一點，要找你們改程式？' } } } } },
        { spec: { item: 5 }, name: 'agingLog', does: '放越久越不值錢', code: 'batch.moves.push({ to, at: today, cost });',
          fields: { flow: { label: '轉作紀錄', options: ['每次轉下去都記日期和成本，放到設定的天數就提醒', '轉作只記去向、不記日期'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '這批怎麼做成狗零食了？從哪天開始放的都查不到', kg: { petFood: 35 } } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testLoss', does: '算貨損', code: 'expect(lossOf(120, 58, 40)).toBe(22);',
          fields: { assert: { label: '檢查', options: ['120 公斤做成 58 成品＋40 邊角料，貨損 22', '貨損 62', '貨損是正數就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testEstimate', does: '估出貨量', code: "expect(estimateOutput(200, '鯖魚', '冬', '去頭去內臟')).toBe(116);",
          drives: { fn: 'estimateOutput', field: 'how', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['200 公斤 × 58% 估 116', '估 160', '估出來不是 0 就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testQuoteRatio', does: '報量打折', code: 'expect(quoteOf(116, { quoteRatio: 0.9 })).toBe(104.4);',
          fields: { assert: { label: '檢查', options: ['保守比例 0.9 時報 104.4', '報 116', '報量小於估量就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 4 }, name: 'testCarryCost', does: '轉魚鬆帶批號', code: "expect(floss.parent).toBe('B1104-01'); expect(floss.cost).toBe(batch.cost);",
          fields: { assert: { label: '檢查', options: ['魚鬆批號掛在原批號下、成本帶過去', '魚鬆是新的一批', '魚鬆存得進去就好'], answer: 0 } } },
        { name: 'testTenThousand', does: '一萬批一秒內估完',
          fields: { assert: { label: '檢查', options: ['源裕一天幾批，不用測', '一萬批一秒內估完', '一千批一秒內估完'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份測試機上的源裕 ERP', '上傳新版', '替換', '開網址估一批試試', '通知秀琴姐'], answer: [0, 1, 2, 3],
          why: '通知秀琴姐要等 QC 驗過，從已完成的卡上按' }] } },
    ],
  };

  // ── #403 加班請假：會議那頁只有原話、沒有題庫（ASKS 沒有 shift），所以也沒有退回 SA 的勾選 ──
  const SHIFT = {
    id: 'shift', title: '加班請假', from: SA, assignee: '玩家', requester: XIUQIN, type: 'sub', parent: 'erp', relatedTo: 'erp',
    body: bodyOf(['記加班的開工、收工時間', '請假選日期、幾點到幾點，最少半小時，時數程式算', '組長忙到找不到人的時候，加班照樣登記得進去'],
      'shift', '需求單位：源裕水產管理部 秀琴姐（原話是雄哥講的，秀琴姐轉述）'),
    attachments: ['原文：09:30 廠商需求會議（秀琴姐轉述雄哥）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '加班是記幾點到幾點，還是直接寫幾小時？', right: true, adds: '加班記開工、收工時間，時數程式算，跨過半夜也要算對', asked: 0 },
      { text: '凌晨進港組長找不到人的時候，加班單誰登記、誰簽？', right: true, adds: '誰有空誰先登記，組長忙完再補簽，可以隔天補單', asked: 1 },
      { text: '請假最小可以請多久？', right: true, adds: '請假最少半小時，記幾點到幾點，時數程式算', asked: 2 },
      { text: '請假要不要做三層簽核？', right: false, why: '雄哥說跟組長講一聲就好' },
    ] }],
    screen: { app: '源裕水產 ERP・加班請假', form: true, fields: ['日期', '姓名', '類別', '開工', '收工', '時數', '登記', '組長看過'],
      rows: [['11/03', '雄哥', '加班', '22:30', '03:00', '4.5', '雄哥 03:02', '✓'], ['11/04', '阿忠', '請假', '13:00', '16:00', '3', '秀琴姐 08:10', '']],
      bugs: {
        overtimeHours: { voice: '晚上十點半做到凌晨三點，系統說加班 −19.5 小時。', cells: { '時數': '−19.5' } },
        leaveHours: { voice: '我只請下午三個小時，系統扣了我一整天。', row: 1, cells: { '時數': '1 天' } },
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['加班記開工收工', '請假選日期、幾點到幾點，最少半小時', '組長找不到人也要登記得進去', '大家寫半天、上午都有'],
        items: [
          { text: '加班時數____', options: ['看開工、收工時間算', '自己估一個數字', '看漁獲'], answer: 0 },
          { text: '請假可以請____', options: ['幾點到幾點，最少半小時，時數程式算', '只能整天', '上午、下午、全天三種'], answer: 0 },
          { text: '組長找不到人的時候，加班____', options: ['照樣登記得進去', '等組長回來', '不能加班'], answer: 0 },
          { text: '「看漁獲啦」是____', options: ['背景，不是需求', '要做一個漁獲預測', '加班時數填「看漁獲」'], answer: 0 },
        ] } },
      meetingDiscuss('shift'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '加班請假這個模組連測試、驗收、部署，你估：', real: { manual: '2 天', ai: '半天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['設計加班與請假資料表', '做加班登記（開工、收工）', '做請假登記（日期、開始、結束，時數程式算）', '登記就存：記誰、什麼時候，組長看過打勾',
                  '補單：日期可以選過去、標「補單」', '寫測試', '部署到測試機', '串接指紋打卡機', '請假三層簽核'],
        answer: [0, 1, 2, 3, 4, 5, 6], before: [[0, 1], [0, 2], [0, 4], [1, 3], [3, 6], [4, 6], [5, 6]],
        why: '指紋打卡機不在需求裡；請假三層簽核會讓流程卡死',
        given: [
          { work: 'read_req', options: [3], when: { item: 2, picked: 0 } },
          { work: 'discuss', options: [1], when: { item: 0, picked: 0 } }, { work: 'discuss', options: [3, 4], when: { item: 1, picked: 0 } },
          { work: 'discuss', options: [2], when: { item: 2, picked: 0 } },
          { work: 'reject', options: [1], when: { item: 0, picked: 0 } }, { work: 'reject', options: [3, 4], when: { item: 0, picked: 1 } },   // 退回 SA 問回來的視同會議問過
          { work: 'reject', options: [2], when: { item: 0, picked: 2 } },
        ] }] } },
      { work: 'doc_spec', question: { items: [
        { text: '凌晨進港，組長忙到找不到人', options: ['不用等誰簽，登記了就算數；程式記誰登記、什麼時候登記，組長忙完再看，看過的打勾', '改成副組長代簽才算數', '停在組長那邊等他簽'], answer: 0 },
        { text: '忘了報、事後才補', options: ['可以補，日期能選過去的，標「補單」', '只能選今天以後'], answer: 0 },
      ] } },
      { work: 'ui_design', question: { items: [
        { role: 'field', field: '時數', text: '加班時數', sample: '4.5（22:30～03:00 自動算）', answer: 0, ifSkipped: 2,
          options: ['開工、收工時間各一個時間選擇器，預設現在，時數程式算', '文字框，不是數字跳紅字', '文字框，什麼都收'],
          outcome: { 1: { kind: 'annoy', say: '看漁獲就看漁獲，你叫我填數字？', red: '請輸入數字' },
                     2: { kind: 'miss', say: '時數寫『看漁獲』也送得出去，薪水算不出來', junk: '看漁獲' } } },
        { role: 'field', field: '類別', text: '請假時數', sample: '請假 13:00～16:00（3 小時，自動算）', answer: 0, ifSkipped: 2,
          options: ['下拉選日期、開始時間、結束時間（每半小時一格），時數程式算，結束不能早於開始', '文字框，填錯跳紅字', '文字框，什麼都收', '下拉：上午／下午／全天'],
          outcome: { 1: { kind: 'annoy', say: '我寫4小時哪裡不正確？', red: '格式不正確' },
                     2: { kind: 'miss', say: '時數寫『看情況』也送得出去', junk: '看情況' },
                     3: { kind: 'annoy', say: '我只請 3 小時，要選上午還是下午？', red: '請選擇上午、下午或全天' } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['晚上十點半上工、凌晨三點收工，時數算 4.5', '請假 13:00～16:00 算 3 小時，結束早於開始存不進去', '組長沒看也登記得進去，看過打勾', '補昨天的單，標「補單」', '一千人同時打卡的壓測'],
        answer: [0, 1, 2, 3], why: '源裕現場二十幾個人',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [1], when: { item: 0, picked: 2 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } }, { work: 'doc_plan', options: [3], when: { item: 0, picked: 4 } },
          { work: 'doc_spec', options: [2], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [3], when: { item: 1, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 1 }, accept: 0, name: 'overtimeHours', does: '算加班時數',
          code: 'return (end - start + 24 * 60) % (24 * 60) / 60;',
          fields: { how: { label: '怎麼算', options: ['收工 − 開工，跨過午夜加 24 小時', '收工 − 開工', '開工 − 收工'], answer: 0 } } },
        { sentence: 1, needs: { work: 'doc_plan', picked: 2 }, accept: 1, name: 'leaveHours', does: '算請假時數',
          code: 'return (end - start) / 60;',
          fields: { how: { label: '怎麼算', options: ['結束 − 開始，換算成小時', '有請就算一整天', '上午、下午各算半天'], answer: 0 } } },
        { spec: { item: 0 }, name: 'leaderAway', does: '組長不在的時候', code: "db.insert('shift', { ...form, by: user, at: now, leaderSeen: false });",
          fields: { flow: { label: '組長不在', options: ['登記了就算數，記誰、什麼時候登記，組長看過打勾', '副組長代簽才算數', '停在組長那邊等他簽'], answer: 0, ifSkipped: 2,
            outcome: { 1: { kind: 'stuck', say: '副組長也在碼頭跑啊' },
                       2: { kind: 'stuck', say: '組長在碼頭跑來跑去，人都上工了，加班單還沒簽？' } } } } },
        { spec: { item: 1 }, name: 'lateEntry', does: '事後補登', code: "if (form.date < today) row.tags.push('補單');",
          fields: { flow: { label: '事後補', options: ['可以補，日期能選過去的，標「補單」', '只能選今天以後'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '那昨天凌晨那班怎麼辦？' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testOvernight', does: '跨午夜的加班', code: "expect(overtimeHours('22:30', '03:00')).toBe(4.5);",
          fields: { assert: { label: '檢查', options: ['22:30 到 03:00 算 4.5 小時', '22:30 到 03:00 算 −19.5 小時', '時數是數字就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testLeaveHours', does: '請 3 小時算 3 小時', code: "expect(leaveHours('13:00', '16:00')).toBe(3);",
          fields: { assert: { label: '檢查', options: ['13:00 到 16:00 算 3 小時', '13:00 到 16:00 算 1 天', '有扣假就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testLoggedWithoutLeader', does: '組長沒看也存得進去', code: "expect(saveShift({ ...form, leaderSeen: false })).toMatchObject({ by: '雄哥' });",
          fields: { assert: { label: '檢查', options: ['沒簽也存得進去，記下誰、何時登記', '沒簽就存不進去', '存得進去就好'], answer: 0 } } },
        { name: 'testThousandPunch', does: '一千人同時打卡',
          fields: { assert: { label: '檢查', options: ['源裕現場二十幾個人，不用測', '一千人同時打卡', '一百人同時打卡'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份測試機上的源裕 ERP', '上傳新版', '替換', '開網址登記一筆加班試試', '通知秀琴姐'], answer: [0, 1, 2, 3],
          why: '通知秀琴姐要等 QC 驗過，從已完成的卡上按' }] } },
    ],
  };

  // ── 模組池：批號追溯 ──
  const TRACE = {
    id: 'trace', title: '批號追溯', from: SA, assignee: '玩家', requester: XIUQIN, type: 'sub', parent: 'erp', relatedTo: 'erp',
    body: bodyOf(['每一批原料進來給一個批號', '拆成不同部位、做成不同產品，都要追得回原料批號', '配方摻別的原料，兩邊的批號都要記', '黑鮪魚一尾一筆，記標籤號'],
      'trace', '需求單位：源裕水產管理部 秀琴姐（原話是建宏在需求會議講的）'),
    attachments: ['原文：09:30 廠商需求會議（建宏）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '鯊魚丸摻多少有固定嗎？成本怎麼算？', right: true, adds: '配方照雄哥寫的比例，原料各記批號', asked: 2 },
      { text: '魚丸的原料是不是寫鯊魚就好？', right: false, why: '摻了虱目魚漿，兩邊都要記' },
    ] }],
    screen: { app: '源裕水產 ERP・批號追溯', form: true, fields: ['批號', '上層批號', '品名', '部位', '配方', '重量（公斤）', '來源', '標籤號'],
      rows: [['B1104-01', '—', '虱目魚（整尾）', '—', '—', '297.0', '養殖池邊', ''],
             ['B1104-01-A', 'B1104-01', '虱目魚', '魚肚', '—', '61.2', '養殖池邊', ''],
             ['P1104-02', 'B1101-03、B1104-01-D', '鯊魚丸', '—', '鯊魚漿 70%＋虱目魚漿 30%', '80.0', '—', '']],
      bugs: {
        newBatchNo: { voice: '批號沒有日期，三天前的跟今天的分不出來。', cells: { '批號': '01' } },
        splitParts: { voice: '魚肚變成新的一批，查不回是哪個魚塭的。', row: 1, cells: { '上層批號': '—' } },
        mixRecipe: { voice: '鯊魚丸只記了鯊魚那批。', row: 2, cells: { '上層批號': 'B1101-03' } },
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['每一批原料給一個批號', '一尾拆成好幾個部位、剩的打魚丸，都要追得回', '鯊魚丸摻虱目魚漿，兩邊都要記', '黑鮪魚每尾有標籤和證明', '以前翻了三天的單子才找到'],
        items: [
          { text: '每一批原料進來____', options: ['給一個批號', '寫進貨日期就好', '看雄哥記得哪一批'], answer: 0 },
          { text: '拆成不同部位以後____', options: ['都要追得回原料批號', '各算各的不用追', '只追魚肚'], answer: 0 },
          { text: '鯊魚丸摻虱目魚漿____', options: ['兩邊的批號都要記', '只記鯊魚', '寫在備註'], answer: 0 },
          { text: '「比較Q啦」是____', options: ['背景，不是需求', '要做一個「Q度」欄位', '配方一律加虱目魚'], answer: 0 },
        ] } },
      meetingDiscuss('trace'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '批號追溯這個模組連測試、驗收、部署，你估：', real: { manual: '4 天', ai: '1.5 天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['設計批號規則與標籤格式', '收購存檔自動編批號、印標籤', '拆部位：子批號掛在原批號下', '配方：多種原料各記批號、比例程式算',
                  '從成品往回查的畫面', '黑鮪魚一尾一筆、標籤號', '寫測試', '部署到測試機', '做區塊鏈溯源', '做消費者掃碼查產地的網頁'],
        answer: [0, 1, 2, 3, 4, 5, 6, 7], before: [[0, 1], [1, 2], [1, 3], [2, 4], [3, 4], [4, 7], [5, 7], [6, 7]],
        why: '區塊鏈溯源、消費者掃碼查產地都不在需求裡',
        given: [
          { work: 'read_req', options: [1], when: { item: 0, picked: 0 } },
          { work: 'discuss', options: [3], when: { item: 2, picked: 0 } },
          { work: 'reject', options: [3], when: { item: 0, picked: 0 } },   // 退回 SA 問回來的視同會議問過
        ] }] } },
      { work: 'doc_spec', question: { items: [
        { text: '從成品往回查', options: ['從成品批號一路查回原料、哪天進、哪個來源，一個畫面看完', '只能從原料往下查'], answer: 0 },
        { text: '二次加工', options: ['轉魚鬆、罐頭、凍乾時，新批號掛在原批號下面，成本跟著帶', '轉過去重新開批號'], answer: 0 },
      ] } },
      { work: 'ui_design', question: { items: [
        { role: 'field', field: '批號', text: '批號', sample: 'B1104-01（存檔自動編、印標籤）', answer: 0, ifSkipped: 2,
          options: ['收購單存檔時程式自動編批號，印成標籤貼在籃子上；之後的單子用點選或刷條碼，不用打', '批號讓人自己打', '沒有批號'],
          outcome: { 1: { kind: 'annoy', say: '這串數字誰記得住？我寫『早上那船』不行喔？', red: '批號格式不正確' },
                     2: { kind: 'late', say: '客人說魚丸有怪味，又要翻三天的單子' } } },
        { role: 'field', field: '部位', text: '拆部位（一進多出）', sample: '魚肚、魚皮、魚頭、碎肉（勾選，各秤各的）', answer: 0, ifSkipped: 1,
          options: ['選原料批號，再勾這批拆成哪些部位（魚肚、魚皮、魚頭、碎肉），各秤各的重，子批號自動掛在原批號下面', '部位用文字框', '每個部位當新的一批重新收貨'],
          outcome: { 1: { kind: 'miss', say: '同一個部位記成魚肚、肚仔、腹肉三種', junk: '肚仔' },
                     2: { kind: 'late', say: '魚肚查不回是哪天哪個魚塭的' } } },
        { role: 'field', field: '配方', text: '配方摻原料', sample: '鯊魚漿 70%＋虱目魚漿 30%（各選批號）', answer: 0, ifSkipped: 1,
          options: ['配方一種原料一列，各自選批號，比例程式算', '只記主原料'],
          outcome: { 1: { kind: 'late', say: '鯊魚丸摻了虱目魚漿，出事時只查得到鯊魚那批', sample: '鯊魚漿' } } },
        { role: 'field', field: '標籤號', text: '黑鮪魚標籤', sample: '1 尾｜標籤號必填', answer: 0, ifSkipped: 1,
          options: ['品種選黑鮪魚（烏甕串）時，數量鎖成 1 尾、標籤號必填，一尾一筆', '黑鮪魚也論公斤一整批收'],
          outcome: { 1: { kind: 'late', say: '漁業署來查，這尾的標籤號對不到哪張單', sample: '（論公斤一整批收，不用填）' } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['收購存檔就有批號、印得出標籤', '一尾虱目魚拆成四個部位，子批號掛在原批號下', '從魚丸的成品批號查回原料、進貨日、來源', '鯊魚丸的配方兩種原料的批號都記',
                  '黑鮪魚一尾一筆、標籤號必填', '一天十萬個批號的壓測'],
        answer: [0, 1, 2, 3, 4], why: '源裕一天幾十批',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [1], when: { item: 0, picked: 2 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 4 } }, { work: 'doc_plan', options: [3], when: { item: 0, picked: 3 } },
          { work: 'doc_plan', options: [4], when: { item: 0, picked: 5 } },
          { work: 'doc_spec', options: [2], when: { item: 0, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 1 }, accept: 0, name: 'newBatchNo', does: '編批號',
          code: "return `B${mmdd(today)}-${String(seq).padStart(2, '0')}`;",
          fields: { how: { label: '批號怎麼編', options: ['收購單存檔時自動編：B＋日期＋流水號', '讓人自己打', '每天從 1 重新編、不帶日期'], answer: 0 } } },
        { sentence: 1, needs: { work: 'doc_plan', picked: 2 }, accept: 1, name: 'splitParts', does: '拆部位',
          code: "parts.forEach((p, i) => db.insert('batch', { ...p, no: `${batch.no}-${'ABCD'[i]}`, parent: batch.no }));",
          fields: { how: { label: '拆出來的部位', options: ['子批號掛在原批號下面', '每個部位重新收貨、開新的一批', '不記部位'], answer: 0 } } },
        { sentence: 2, needs: { work: 'doc_plan', picked: 3 }, accept: 3, name: 'mixRecipe', does: '記配方',
          code: "recipe.forEach(r => db.insert('mix', { product: lot.no, from: r.batch, ratio: r.kg / total }));",
          fields: { how: { label: '配方怎麼記', options: ['每種原料一列，各自記批號和比例', '只記主原料', '記在備註'], answer: 0 } } },
        { spec: { item: 0 }, name: 'traceBack', does: '從成品往回查', code: 'return lot.parents.flatMap(no => rootsOf(db.batch(no)));',
          fields: { flow: { label: '往回查', options: ['從成品批號一路查回原料、哪天進、哪個來源，一個畫面看完', '只能從原料往下查'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '客人拿著罐頭來問，我要從哪一批原料開始翻？' } } } } },
        { spec: { item: 1 }, name: 'carryBatch', does: '二次加工', code: "db.insert('batch', { parent: batch.no, cost: batch.cost * kg / batch.kg, use });",
          fields: { flow: { label: '二次加工', options: ['新批號掛在原批號下面，成本跟著帶', '轉過去重新開批號'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '魚鬆的成本算不出來' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testBatchNo', does: '存檔就有批號', code: 'expect(saveBuy(form).batch).toMatch(/^B\\d{4}-\\d{2}$/);',
          fields: { assert: { label: '檢查', options: ['存檔後批號是 B1104-01 的格式', '批號不是空的', '批號是數字'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testSplit', does: '拆部位掛回原批', code: "expect(splitParts(batch, ['魚肚'])[0].parent).toBe('B1104-01');",
          fields: { assert: { label: '檢查', options: ['魚肚的上層批號是原料那批', '魚肚有批號就好', '魚肚是新的一批'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testTraceBack', does: '從成品往回查', code: "expect(traceBack('P1104-02').map(b => b.no)).toEqual(['B1101-03', 'B1104-01']);",
          fields: { assert: { label: '檢查', options: ['魚丸查得回虱目魚和鯊魚兩批原料', '魚丸查得回一批原料', '魚丸查得到就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testRecipe', does: '配方兩種原料都記', code: "expect(mixOf('P1104-02').map(m => m.ratio)).toEqual([0.7, 0.3]);",
          fields: { assert: { label: '檢查', options: ['兩種原料的批號和比例都記了', '主原料記了就好', '比例加起來是 1'], answer: 0 } } },
        { name: 'testHundredThousand', does: '一天十萬個批號',
          fields: { assert: { label: '檢查', options: ['源裕一天幾十批，不用測', '一天十萬個批號', '一天一萬個批號'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份測試機上的源裕 ERP', '上傳新版', '替換', '開網址從一顆魚丸往回查試試', '通知秀琴姐'], answer: [0, 1, 2, 3],
          why: '通知秀琴姐要等 QC 驗過，從已完成的卡上按' }] } },
    ],
  };

  // ── speedrun 的批號追溯：建宏用 AI 做過一版的爛尾樓。卡上先選路：接手（多檢閱，沒挑出來的照建宏那版）或從頭規劃（部署多資料轉換）──
  const ROUTE = { work: 'route', question: { items: [{ text: '建宏那版要怎麼處理？', free: true,
    options: ['接手建宏的版本（多一件檢閱程式碼，挑出來的才改）', '從頭規劃（照一般做，部署時把他那兩個月的資料轉過來）'] }] } };
  // 建宏那版前端設計每題選的，和檢閱前端挑出哪個 fix 才改得到
  const TAKEOVER_UI = [[1, 'fixBatchNo'], [1, 'fixParts'], [1, 'fixRecipe'], [1, 'fixTag']];
  // 建宏那版程式裡的寫法：function → 檢閱後端挑出哪個 fix 才改得到（approveFlow 是建宏那版才有的：每一步都要主管按）
  const TAKEOVER_CODE = { traceBack: 'fixTraceBack', carryBatch: 'fixCarry', approveFlow: 'fixApprove' };
  const TAKEOVER_LOCKED = '建宏那版，檢閱沒挑出來';
  const APPROVE_FN = { name: 'approveFlow', does: '存批號要不要等主管', code: 'await supervisorApprove(batch);',
    fields: { flow: { label: '存批號', options: ['不用等誰確認，存了就算，程式記誰存、什麼時候存', '每一步都要主管按確認'], answer: 0,
      outcome: { 1: { kind: 'stuck', say: '雄哥在碼頭，批號單要等主管按確認才存得進去？' } } } } };
  // 檢閱程式碼：前端是建宏那版的批號表單（screen 'form'：inherited 是他前端設計每題選的、rows 是他那版用了兩個月的資料），後端是 batch.js 的 diff
  const TRACE_REVIEW = {
    front: { kind: 'spot', screen: 'form', inherited: TAKEOVER_UI.map(([pick]) => pick), devices: ['pc', 'tablet', 'phone'], defects: [],
      rows: [['早上那船', '—', '虱目魚（整尾）', '—', '—', '297.0', '養殖池邊', ''],
             ['阿伯的', '—', '虱目魚', '肚仔', '—', '61.2', '養殖池邊', ''],
             ['同上', '—', '鯊魚丸', '—', '鯊魚漿', '80.0', '—', '']],
      reasons: [{ id: 'typing', text: '要人自己打字' }, { id: 'freeform', text: '自由填會亂寫' }, { id: 'missing', text: '少記了東西' }, { id: 'big', text: '字太大' }],
      spots: [
        { region: '批號', devices: ['pc', 'tablet', 'phone'], reason: 'typing', fix: 'fixBatchNo', text: '批號要人自己打' },
        { region: '部位', devices: ['pc', 'tablet', 'phone'], reason: 'freeform', fix: 'fixParts', text: '部位是文字框' },
        { region: '配方', devices: ['pc', 'tablet', 'phone'], reason: 'missing', fix: 'fixRecipe', text: '配方只記主原料' },
        { region: '標籤號', devices: ['pc', 'tablet', 'phone'], reason: 'missing', fix: 'fixTag', text: '黑鮪魚沒有標籤號' },
        { region: '品名', trap: '建宏要的', aiReason: 'big', text: '品名的字很大' },
      ],
      aiFinds: [], hints: ['戴手套的人要打字的地方都看一下。', '配方那格只寫了一種魚漿。'] },
    back: { kind: 'diff', file: 'batch.js',
      reasons: [{ id: 'wait', text: '流程卡在等人' }, { id: 'oneWay', text: '只能往一個方向查' }, { id: 'costBreak', text: '重新開批號，成本斷了' }, { id: 'style', text: '命名或縮排' }],
      lines: [
        { n: 1, t: ' ', code: 'async function saveBatch(batch, material) {' },
        { n: 2, t: '+', code: '  await supervisorApprove(batch);', issue: 'wait', fix: 'fixApprove' },
        { n: 3, t: '+', code: '  const fishFloss = newBatch(batch.species);', issue: 'costBreak', fix: 'fixCarry' },
        { n: 4, t: '+', code: '  let tmp_x = fishFloss;', nit: '命名不好看，不影響', aiReason: 'style' },
        { n: 5, t: '+', code: '  return traceForward(material);', issue: 'oneWay', fix: 'fixTraceBack' },
        { n: 6, t: ' ', code: '}' },
      ],
      aiFinds: [], hints: ['每一步都要誰按一下才能往下走？', '客人拿著罐頭來問，從這支程式查得回去嗎？'] },
  };
  // 從頭規劃的部署：替換之後多一步把建宏那版的資料轉過來
  const REBUILD_DEPLOY = { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, migrate: 3, smoke: 4, notify: 5 },
    items: [{ text: '步驟', type: 'order', options: ['備份測試機上的源裕 ERP', '上傳新版', '替換', '把建宏那版的資料轉過來', '開網址從一顆魚丸往回查試試', '通知秀琴姐'], answer: [0, 1, 2, 3, 4],
      why: '資料轉換在替換之後、冒煙測試之前；通知秀琴姐要等 QC 驗過' }] } };
  // 接手那條路：前端設計每題照建宏選的（inherit），檢閱前端挑出那個 fix 才改得到（onlyIf）；
  // 程式裡建宏那版的寫法鎖住（lockedTo），檢閱後端挑出那行才解開（lockedUnless）；多一個建宏才有的 approveFlow
  const lockToJianhong = (field, fix) => ({ ...field, lockedUnless: { work: 'review_back', item: 0, picked: fix }, lockedTo: 1, ifSkipped: 1, lockedText: TAKEOVER_LOCKED });
  function inherits(s) {
    if (s.work === 'ui_design') return { ...s, question: { ...s.question, items: s.question.items.map((item, i) => (
      { ...item, inherit: TAKEOVER_UI[i][0], onlyIf: { work: 'review_front', item: 0, picked: TAKEOVER_UI[i][1] }, lockedText: TAKEOVER_LOCKED })) } };
    if (s.work === 'code') return { ...s, question: { ...s.question, functions: [...s.question.functions, APPROVE_FN].map(f => (TAKEOVER_CODE[f.name]
      ? { ...f, fields: Object.fromEntries(Object.entries(f.fields).map(([k, field]) => [k, lockToJianhong(field, TAKEOVER_CODE[f.name])])) } : f)) } };
    return s;
  }
  // 接手：開發計畫前面插兩件檢閱，前端設計、程式照建宏那版
  function takeoverSubtasks(card) {
    const i = card.subtasks.findIndex(s => s.work === 'doc_plan');
    return [...card.subtasks.slice(0, i), { work: 'review_front', question: TRACE_REVIEW.front }, { work: 'review_back', question: TRACE_REVIEW.back }, ...card.subtasks.slice(i)].map(inherits);
  }
  const rebuildSubtasks = (card) => card.subtasks.map(s => (s.work === 'deploy' ? REBUILD_DEPLOY : s));
  // 兩條路照傳進來那張卡的工作算（先套時代再包，兩條路的前端設計才有這個時代的 AI 錯法）。
  // migrate：從頭規劃時建宏那兩個月的資料轉不過去的（接手那條路的部署沒有資料轉換，用不到）
  const withTakeover = (card) => ({ ...card, subtasks: [ROUTE], routes: [{ subtasks: takeoverSubtasks(card) }, { subtasks: rebuildSubtasks(card) }],
    migrate: { rows: '1,247', left: 37, sample: '批號寫「早上那船」「阿伯的」「同上」' } });
  // 需求會議投影幕批號追溯那頁，原話下面多的兩句
  const TAKEOVER_ASIDE = [{ who: JIANHONG, text: '我有用 AI 做過一版……大家還是在抱怨，我改到額度用完了。' }, { who: XIUQIN, text: '上禮拜又有三張變回紙本。' }];

  // ── 模組池：冷凍庫庫存 ──
  const STOCK = {
    id: 'stock', title: '冷凍庫庫存', from: SA, assignee: '玩家', requester: XIUQIN, type: 'sub', parent: 'erp', relatedTo: 'erp',
    body: bodyOf(['每一箱入庫記品種、批號、重量、入庫日', '冷凍蝦有冰衣，出貨要算淨重', '放久的要轉做別的', '休漁的時候要看得到庫存夠不夠'],
      'stock', '需求單位：源裕水產管理部 秀琴姐（原話是雄哥在需求會議講的）'),
    attachments: ['原文：09:30 廠商需求會議（雄哥）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '雄哥休假的時候，怎麼知道哪一箱是什麼時候進的？', right: true, adds: '每一箱入庫都記入庫日和批號，不靠雄哥記', asked: 0 },
      { text: '冰衣大概占幾成？有在量嗎？', right: true, adds: '冷凍蝦抽幾包解凍秤淨重，冰衣比例照抽驗算', asked: 1 },
      { text: '出貨就照毛重開？', right: false, why: '雄哥說客人會罵' },
    ] }],
    screen: { app: '源裕水產 ERP・冷凍庫', form: true, fields: ['批號', '品名', '重量（公斤）', '入庫日', '放了幾天', '備註'],
      rows: [['B0712-03', '白蝦 31/40（每台斤）', '毛重 10.0／淨重 8.6', '07/12', '115', '該轉魚鬆了'],
             ['B1101-02', '鯖魚（花腹鯖）', '毛重 200.0／淨重 200.0', '11/01', '3', '']],
      bugs: { netWeight: { voice: '出貨單印毛重，客人說少了一公斤半。', cells: { '重量（公斤）': '毛重 10.0／淨重 10.0' } } } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['每一箱記品種、批號、重量、入庫日', '冷凍蝦有冰衣，出貨算淨重', '放久的轉魚鬆、凍乾', '休漁時靠冬天的庫存', '現在靠雄哥記得哪一箱是什麼時候進的'],
        items: [
          { text: '每一箱入庫要記____', options: ['品種、批號、重量、入庫日', '品種就好', '雄哥記得就好'], answer: 0 },
          { text: '冷凍蝦出貨____', options: ['要算淨重', '照毛重', '多給一點就好'], answer: 0 },
          { text: '放久的____', options: ['要轉做別的', '繼續放', '丟掉'], answer: 0 },
          { text: '「我看一下就知道」是____', options: ['雄哥在說他就是系統，不是需求', '要做一個「問雄哥」的按鈕', '不用做庫存'], answer: 0 },
        ] } },
      meetingDiscuss('stock'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '冷凍庫庫存這個模組連測試、驗收、部署，你估：', real: { manual: '3 天', ai: '1 天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['設計入庫資料表（毛重、淨重、入庫日、批號）', '入庫與抽驗淨重', '出貨單印淨重、預設先進先出', '入庫天數提醒、轉魚鬆掛回原批',
                  '休漁前的庫存夠撐幾天', '寫測試', '部署到測試機', '串接冷凍庫溫度感測器', '做 3D 冷凍庫地圖'],
        answer: [0, 1, 2, 3, 4, 5, 6], before: [[0, 1], [0, 3], [0, 4], [1, 2], [2, 6], [3, 6], [4, 6], [5, 6]],
        why: '冷凍庫沒有溫度感測器；3D 地圖不在需求裡',
        given: [
          { work: 'discuss', options: [0], when: { item: 0, picked: 0 } }, { work: 'discuss', options: [1], when: { item: 1, picked: 0 } },
          { work: 'reject', options: [0], when: { item: 0, picked: 0 } }, { work: 'reject', options: [1], when: { item: 0, picked: 1 } },   // 退回 SA 問回來的視同會議問過
        ] }] } },
      { work: 'doc_spec', question: { items: [
        { text: '放越久越不值錢', options: ['放到設定天數提醒「要不要轉魚鬆」，轉了照批號追溯掛回原批', '只記數量不記入庫日'], answer: 0 },
        { text: '休漁靠庫存', options: ['休漁前一個月提醒「這種魚的庫存還夠撐幾天」（用去年同期的出貨量估）', '沒有提醒'], answer: 0 },
        { text: '先進先出', options: ['出貨預設帶最早入庫的那批，可以改，程式記誰改；原因選填（客人指定新貨）', '讓人自己挑哪一箱'], answer: 0 },
      ] } },
      { work: 'ui_design', question: { items: [
        { role: 'field', field: '重量（公斤）', text: '重量', sample: '毛重 10.0／淨重 8.6（冰衣 14%，自動算）', answer: 0, ifSkipped: 2,
          options: ['入庫記毛重；冷凍蝦另外記抽驗解凍後的淨重，冰衣比例程式算；出貨單印淨重', '冰衣比例是文字框，不是數字跳紅字', '只有一個重量欄，毛重淨重自己決定'],
          outcome: { 1: { kind: 'annoy', say: '每家都說包得很薄，你要我寫多少？', red: '冰衣比例請輸入數字' },
                     2: { kind: 'late', say: '同一箱蝦，入庫 10 公斤，出貨變 8 公斤半，差的去哪了？' } } },
        { role: 'field', field: '入庫日', text: '入庫日', sample: '11/04（今天，可改成過去）', answer: 0, ifSkipped: 1,
          options: ['預設今天，可以改成過去（補登），放到設定的天數就變色', '入庫日文字框'],
          outcome: { 1: { kind: 'miss', say: '入庫日寫『上禮拜』', junk: '上禮拜' } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['冷凍蝦入庫記毛重，抽驗後算出淨重和冰衣比例', '出貨單印淨重，預設帶最早入庫的那批', '入庫放到設定天數會變色、提醒轉魚鬆', '休漁前一個月提醒庫存夠撐幾天',
                  '改了出貨批次記下誰改', '冷凍庫溫度即時監控'],
        answer: [0, 1, 2, 3, 4], why: '冷凍庫沒有溫度感測器',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [1, 4], when: { item: 0, picked: 2 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } }, { work: 'doc_plan', options: [3], when: { item: 0, picked: 4 } },
          { work: 'doc_spec', options: [2], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [4], when: { item: 2, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 1, needs: { work: 'doc_plan', picked: 1 }, accept: 0, name: 'netWeight', does: '算淨重',
          code: 'return gross * (1 - glaze);',
          fields: { how: { label: '淨重怎麼算', options: ['毛重 ×（1 − 冰衣比例）', '毛重直接當淨重', '毛重 − 1 公斤'], answer: 0 } } },
        { spec: { item: 0 }, name: 'ageAlert', does: '放越久越不值錢', code: "if (days(box.inAt, today) >= settings.alertDays) remind('要不要轉魚鬆', box);",
          fields: { flow: { label: '放久了', options: ['放到設定天數提醒要不要轉魚鬆，轉了掛回原批', '只記數量不記入庫日'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '冷凍庫最底下那箱是去年的', kg: { petFood: 50 } } } } } },
        { spec: { item: 1 }, name: 'stockDays', does: '休漁靠庫存', code: 'remind(`庫存還夠撐 ${Math.floor(stockKg / lastYearDaily(species, month))} 天`);',
          fields: { flow: { label: '休漁前', options: ['休漁前一個月提醒庫存夠撐幾天（用去年同期的出貨量估）', '沒有提醒'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '六月一到才發現鯖魚只剩三箱，客人的單都接了' } } } } },
        { spec: { item: 2 }, name: 'fifoPick', does: '先進先出', code: 'return boxes.filter(b => b.species === species).sort((a, b) => a.inAt - b.inAt)[0];',
          fields: { flow: { label: '出貨挑哪一箱', options: ['預設帶最早入庫的那批，可以改，程式記誰改、原因選填', '讓人自己挑哪一箱'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '新的先出、舊的一直放，最後全部變凍乾', kg: { petFood: 30 } } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testNetWeight', does: '冷凍蝦算淨重', code: 'expect(netWeight(10, 0.14)).toBeCloseTo(8.6);',
          fields: { assert: { label: '檢查', options: ['10 公斤、冰衣 14%，淨重 8.6', '淨重 10', '淨重小於毛重就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testFifo', does: '出貨預設最早的那批', code: "expect(fifoPick('白蝦').no).toBe('B0712-03');",
          fields: { assert: { label: '檢查', options: ['預設是 07/12 那批', '預設是 11/01 那批', '有帶出一批就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testAgeAlert', does: '放久了提醒', code: 'expect(ageAlert({ inAt: daysAgo(90) }, { alertDays: 90 })).toBe(true);',
          fields: { assert: { label: '檢查', options: ['放 90 天就提醒', '放一年才提醒', '有提醒就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testStockDays', does: '休漁前算撐幾天', code: 'expect(stockDays(80, 5)).toBe(16);',
          fields: { assert: { label: '檢查', options: ['80 箱、去年每天出 5 箱，撐 16 天', '撐 30 天', '算得出數字就好'], answer: 0 } } },
        { name: 'testColdChain', does: '冷凍庫溫度',
          fields: { assert: { label: '檢查', options: ['冷凍庫沒有感測器，不用測', '溫度每秒更新', '溫度每分鐘更新'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份測試機上的源裕 ERP', '上傳新版', '替換', '開網址入庫一箱蝦試試', '通知秀琴姐'], answer: [0, 1, 2, 3],
          why: '通知秀琴姐要等 QC 驗過，從已完成的卡上按' }] } },
    ],
  };

  // ── 模組池：物流理賠與退貨報銷（會議那段只有原話、沒有題庫，所以也沒有退回 SA 的勾選）──
  const CLAIM = {
    id: 'claim', title: '物流理賠與退貨報銷', from: SA, assignee: '玩家', requester: XIUQIN, type: 'sub', parent: 'erp', relatedTo: 'erp',
    body: bodyOf(['退貨要記原因、數量、是哪一張出貨單', '先退客人錢，再跟物流公司申請理賠', '退回來還能用的轉加工'], 'claim'),
    attachments: ['原文：09:30 廠商需求會議（秀琴姐）'],
    screen: { app: '源裕水產 ERP・退貨理賠', form: true, fields: ['退貨單', '出貨單', '客戶', '退回數量', '退貨原因', '退款', '理賠'],
      rows: [['R1104-01', 'S1101-07', '海產店', '出貨 20 箱，退 6 箱', '解凍', '已退', '申請中']],
      bugs: { linkShipment: { voice: '退貨單對不回是哪張出貨單。', cells: { '出貨單': '—' } } } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['退貨記原因、數量、是哪張出貨單', '先退客人錢，再跟物流要', '退回來還能用的轉加工', '報銷單現在夾在藍色的本子裡'],
        items: [
          { text: '退貨要記____', options: ['原因、數量、是哪一張出貨單', '數量就好', '客人名字就好'], answer: 0 },
          { text: '退錢和理賠____', options: ['先退客人錢，再跟物流申請理賠', '理賠下來才退錢', '不用理賠'], answer: 0 },
          { text: '退回來還能用的____', options: ['轉加工', '一律報廢', '退給物流公司'], answer: 0 },
          { text: '「藍色的那本」是____', options: ['現在的系統，不是需求', '要做一個藍色的介面', '要把那本掃描進來'], answer: 0 },
        ] } },
      meetingDiscuss('claim'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '物流理賠與退貨報銷這個模組連測試、驗收、部署，你估：', real: { manual: '2 天', ai: '半天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['設計退貨與理賠資料表', '退貨單：從出貨單帶出原數量', '退款單和理賠單分開、各自結案', '退回的貨轉加工或報廢',
                  '寫測試', '部署到測試機', '串接物流公司的理賠 API', '做客訴聊天機器人'],
        answer: [0, 1, 2, 3, 4, 5], before: [[0, 1], [0, 2], [1, 3], [2, 5], [3, 5], [4, 5]],
        why: '物流公司沒有理賠 API；客訴聊天機器人不在需求裡',
        given: [{ work: 'read_req', options: [2], when: { item: 1, picked: 0 } }] }] } },
      { work: 'doc_spec', question: { items: [
        { text: '先退錢、後理賠', options: ['退款和理賠分兩張單，理賠還沒下來不影響退款，各自追到結案', '理賠核准才能退款'], answer: 0 },
        { text: '退回的貨', options: ['可以選報廢或轉加工；轉加工照批號追溯掛回原批，報廢記重量和原因', '只能報廢'], answer: 0 },
      ] } },
      { work: 'ui_design', question: { items: [
        { role: 'field', field: '退貨原因', text: '退貨原因', sample: '解凍 ▾（選「其他」才開文字框）', answer: 0, ifSkipped: 2,
          options: ['下拉：解凍、數量不符、規格不符、客人取消、其他（選其他才開文字框）', '原因文字框必填', '沒有原因欄'],
          outcome: { 1: { kind: 'annoy', say: '就是壞掉了啊，還要寫作文？', red: '請填寫退貨原因' },
                     2: { kind: 'late', say: '這個月退了十二張，不知道幾張是物流的錯' } } },
        // 退貨量大於出貨量要打原因才存得了：流程不卡節點的例外，是正解
        { role: 'field', field: '退回數量', text: '退回數量', sample: '出貨 20 箱，退 6 箱（可換算公斤）', answer: [0, 1, 3, 4, 5],
          options: ['從出貨單帶出原數量，不能修改', '退貨數量自己打', '退貨數量只能接受正整數', '退貨量的單位預設跟出貨單一致，可以調整，系統要換算',
                    '退貨量大於出貨量時需要打原因', '退貨量可輸入的數字格式要視單位做檢核', '退貨量可以輸入負值'] },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['退貨從出貨單帶出原數量', '先退款、理賠另開一張，各自追到結案', '退回的貨轉加工時掛回原批號', '退貨的單位換算正確，退貨量大於出貨量要打原因', '物流公司 API 自動申請理賠'],
        answer: [0, 1, 2, 3], why: '物流公司沒有 API',
        given: [
          { work: 'doc_plan', options: [0, 3], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [1], when: { item: 0, picked: 2 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } },
          { work: 'doc_spec', options: [1], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [2], when: { item: 1, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 1 }, accept: 0, name: 'linkShipment', does: '帶出出貨單',
          code: 'return { shipment: s.no, qty: s.qty, unit: s.unit };',
          fields: { how: { label: '退貨數量從哪來', options: ['從出貨單帶出原數量，不能改', '數量自己打，不對出貨單', '不記是哪張出貨單'], answer: 0 } } },
        { spec: { item: 0 }, name: 'refund', does: '先退錢、後理賠', code: "db.insert('refund', { ret: r.no }); db.insert('claim', { ret: r.no, carrier });",
          fields: { flow: { label: '退款和理賠', options: ['退款和理賠分兩張單，各自追到結案', '理賠核准才能退款'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '客人等了兩個禮拜，說以後不跟我們買了' } } } } },
        { spec: { item: 1 }, name: 'returnTo', does: '退回的貨', code: "r.use === '報廢' ? scrap(r) : db.insert('batch', { parent: r.batch, kg: r.kg, use: r.use });",
          fields: { flow: { label: '退回的貨', options: ['可以選報廢或轉加工，轉加工掛回原批', '只能報廢'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'stuck', say: '這些明明還能做貓飼料' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testFromShipment', does: '從出貨單帶數量', code: "expect(linkShipment('S1101-07').qty).toBe(20);",
          fields: { assert: { label: '檢查', options: ['退貨單帶出出貨 20 箱', '退貨單數量自己打', '有數量就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testRefundFirst', does: '先退款', code: "expect(canRefund({ claim: '申請中' })).toBe(true);",
          fields: { assert: { label: '檢查', options: ['理賠沒下來也能先退款', '理賠下來才退款', '有退款就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testReturnBatch', does: '轉加工掛回原批', code: "expect(returnTo({ ...ret, use: '轉加工' }).parent).toBe(ret.batch);",
          fields: { assert: { label: '檢查', options: ['轉加工的上層批號是原批號', '轉加工是新的一批', '轉加工存得進去就好'], answer: 0 } } },
        { name: 'testCarrierApi', does: '物流理賠 API',
          fields: { assert: { label: '檢查', options: ['物流公司沒有 API，不用測', '理賠 API 一秒內回應', '理賠 API 一分鐘內回應'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份測試機上的源裕 ERP', '上傳新版', '替換', '開網址開一張退貨單試試', '通知秀琴姐'], answer: [0, 1, 2, 3],
          why: '通知秀琴姐要等 QC 驗過，從已完成的卡上按' }] } },
    ],
  };

  // ── 平行宇宙的新卡：小卡（前端設計兩題、開發兩個 function、手動測試、部署），當天就能做、不做完也沒差 ──
  // 需求簡單，卡片本身就是文件：開發的 function 只寫 sentence，卡上有那句就從卡片直接拉進來。前端設計沒做時兩題都是什麼都收（ifSkipped 2）
  function smallCard({ id, title, body, fields, functions, screen, tryIt }) {
    return { id, title, body, type: 'feature', screen: { form: true, bugs: {}, ...screen }, subtasks: [
      { work: 'ui_design', question: { items: fields.map(f => ({ role: 'field', answer: 0, ifSkipped: 2, ...f })) } },
      { work: 'code', question: { kind: 'functions', functions } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份測試機上的源裕 ERP', '上傳新版', '替換', `開網址${tryIt}試試`, '通知需求單位'], answer: [0, 1, 2, 3],
          why: '通知需求單位要等 QC 驗過，從已完成的卡上按' }] } },
    ] };
  }
  // 欄位題的三種答法：正解、跳紅字（annoy）、什麼都收（miss）
  const fieldOf = (field, text, sample, options, annoy, miss) => ({ field, text, sample, options,
    outcome: { 1: { kind: 'annoy', say: annoy.say, red: annoy.red }, 2: { kind: 'miss', say: miss.say, junk: miss.junk } } });
  const fnOf = (sentence, name, does, code, label, options) => ({ sentence, name, does, code, fields: { how: { label, options, answer: 0 } } });

  const STAFF_BUY = smallCard({ id: 'staff_buy', title: '員工內購', tryIt: '記一筆內購',
    body: '・記誰買了什麼、多少\n・月底從薪水扣\n\n建宏：「員工每週都會跟老闆買魚回家，現在都記在冰箱上那張紙，月底再從薪水扣。」',
    fields: [
      fieldOf('員工', '員工', '阿忠 ▾', ['下拉，打名字或工號都找得到', '文字框，不在名冊跳紅字「查無此員工」', '文字框，什麼都收'],
        { say: '阿忠就阿忠，你要我打全名？', red: '查無此員工' }, { say: '買的人寫『阿忠他媽』也送得出去', junk: '阿忠他媽' }),
      fieldOf('品項', '品項與重量', '虱目魚（整尾）▾　5 台斤 → 3.0 公斤', ['從今天的收購品項下拉，重量單位下拉換公斤', '文字框，不是數字跳紅字「請輸入數字」', '文字框，什麼都收'],
        { say: '兩尾虱目魚哪裡不是數字？', red: '請輸入數字' }, { say: '重量寫『兩尾』也送得出去', junk: '兩尾' }),
    ],
    functions: [
      fnOf(0, 'buyForStaff', '記一筆員工內購', "db.insert('staffBuy', { staff, item, kg, price: staffPrice(item) });", '記什麼', ['記誰、什麼、多少，價錢照員工價', '只記金額', '只記品項']),
      fnOf(1, 'payrollDeduct', '月底從薪水扣', 'payroll.deduct(sumByStaff(month));', '什麼時候扣', ['月底照員工彙總從薪水扣', '每買一次就扣', '不扣']),
    ],
    screen: { app: '源裕水產 ERP・員工內購', fields: ['日期', '員工', '品項', '重量（公斤）', '金額'], rows: [['11/04', '阿忠', '虱目魚（整尾）', '3.0', '240']] } });

  const STAFF_MEAL = smallCard({ id: 'staff_meal', title: '員工餐訂餐', tryIt: '算一次今天的人數',
    body: '・每天算要煮幾人份\n・請假的扣掉、加班的加上\n\n建宏：「廚房阿姨每天都在算員工餐要煮幾人份，早上都在問今天幾個人吃飯，請假的、凌晨加班的都要算。」',
    fields: [
      fieldOf('人數', '人數', '27（上工 24 − 請假 2 ＋ 加班 5，可改）', ['照今天上工、請假、加班自動算，可以手動加減，改了記誰改', '文字框，不是數字跳紅字「請輸入數字」', '文字框，什麼都收'],
        { say: '大概二十個啦，你要我算到個位數？', red: '請輸入數字' }, { say: '人數寫『老樣子』也送得出去', junk: '老樣子' }),
      fieldOf('葷素', '葷素', '葷 22／素 5（預設照上次）', ['下拉：葷、素、蛋奶素，預設照上次', '文字框，格式不對跳紅字「格式不正確」', '文字框，什麼都收'],
        { say: '吃素就吃素，還要寫什麼格式？', red: '格式不正確' }, { say: '葷素寫『跟昨天一樣』也送得出去', junk: '跟昨天一樣' }),
    ],
    functions: [
      fnOf(0, 'headCount', '算今天幾人份', 'return onDuty - onLeave + overtime;', '怎麼算', ['上工的 − 請假的 ＋ 加班的', '只算上工的', '手動填']),
      fnOf(1, 'mealNotice', '通知廚房阿姨', "schedule('09:00', () => notify('廚房阿姨', headCount()));", '什麼時候通知', ['每天 09:00 把人數傳給廚房阿姨', '中午才算', '不通知']),
    ],
    screen: { app: '源裕水產 ERP・員工餐', fields: ['日期', '上工', '請假', '加班', '人數', '葷素'], rows: [['11/04', '24', '2', '5', '27', '葷 22／素 5']] } });

  const ROSTER = smallCard({ id: 'roster', title: '排班表', tryIt: '排一班船',
    body: '・照船班排凌晨誰上工\n・臨時加的人登記進去\n\n秀琴姐：「凌晨進港誰要上工，現在都是雄哥打電話一個一個叫。」',
    fields: [
      fieldOf('船班', '船班', '新源發號 03:00 ▾', ['下拉選今天的船班（時間、哪艘船）', '文字框，格式不對跳紅字「格式不正確」', '文字框，什麼都收'],
        { say: '三點那班就三點那班，你要我打什麼？', red: '格式不正確' }, { say: '船班寫『早上那船』也送得出去', junk: '早上那船' }),
      fieldOf('人員', '人員', '☑ 雄哥　☑ 阿忠　＋ 臨時加人', ['勾名冊上的人，臨時加的直接加進名冊', '文字框，不在名冊跳紅字「查無此人」', '文字框，什麼都收'],
        { say: '阿輝是新來的，系統說查無此人？', red: '查無此人' }, { say: '人員寫『雄哥找的那幾個』也送得出去', junk: '雄哥找的那幾個' }),
    ],
    functions: [
      fnOf(0, 'rosterByShip', '照船班排班', "db.insert('roster', { ship, at, crew, by: user });", '怎麼排', ['照船班排、記誰排的', '照日期排、不管船班', '手動填表']),
      fnOf(1, 'addTemp', '臨時加人', "staff.add({ name, temp: true, by: user }); roster.crew.push(name);", '臨時加的人', ['登記進去，記誰加的', '不能登記', '只能組長加']),
    ],
    screen: { app: '源裕水產 ERP・排班表', fields: ['船班', '時間', '人員', '登記'], rows: [['新源發號', '03:00', '雄哥、阿忠、阿輝', '秀琴姐 18:20']] } });

  const REGULARS = smallCard({ id: 'regulars', title: '熟客名冊', tryIt: '查一位熟客',
    body: '・查熟客上次買了什麼、買多少\n・報價前看得到\n\n建宏：「熟客上次買了什麼、買多少，秀琴姐都記在腦袋裡，她請假就沒人知道。」',
    fields: [
      fieldOf('客戶', '客戶', '海產店（阿伯）▾', ['下拉，打店名或老闆名字都找得到', '文字框，不在名冊跳紅字「查無此客戶」', '文字框，什麼都收'],
        { say: '海產店就海產店，你要我打全名？', red: '查無此客戶' }, { say: '客戶寫『那個海產店』也送得出去', junk: '那個海產店' }),
      fieldOf('上次買的', '上次買的', '虱目魚肚 20 公斤（10/28，從出貨單帶）', ['從出貨單帶出最近三次，不用打', '自己打，日期格式不對跳紅字「日期格式不正確」', '文字框，什麼都收'],
        { say: '上禮拜三就上禮拜三，你要我算幾號？', red: '日期格式不正確' }, { say: '上次買的寫『跟平常一樣』也送得出去', junk: '跟平常一樣' }),
    ],
    functions: [
      fnOf(0, 'lastOrders', '帶出熟客上次買的', 'return shipments.byCustomer(customer).slice(-3);', '帶多少', ['從出貨單帶出最近三次', '只帶最近一次', '讓人自己填']),
      fnOf(1, 'quoteHint', '報價時的提示', 'quote.hint = lastOrders(customer).at(-1).price;', '報價時', ['旁邊顯示上次的價錢', '不顯示', '顯示所有客戶的平均']),
    ],
    screen: { app: '源裕水產 ERP・熟客名冊', fields: ['客戶', '上次買的', '數量', '價錢', '日期'], rows: [['海產店（阿伯）', '虱目魚肚', '20 公斤', '420', '10/28']] } });

  const GIFTS = smallCard({ id: 'gifts', title: '年節送禮清單', tryIt: '排一位客戶',
    body: '・記誰送過、送幾片\n・今年要不要送\n\n建宏：「過年要送烏魚子給客戶，誰送過、送幾片，每年都要翻去年的紅包袋背面。」',
    fields: [
      fieldOf('客戶', '客戶', '海產店（阿伯）▾', ['下拉，打店名或老闆名字都找得到', '文字框，不在名冊跳紅字「查無此客戶」', '文字框，什麼都收'],
        { say: '王老闆就王老闆，你要我打公司名？', red: '查無此客戶' }, { say: '客戶寫『王老闆那家』也送得出去', junk: '王老闆那家' }),
      fieldOf('今年', '片數', '2 盒 ▾（預設帶去年的）', ['數字＋單位下拉（片、盒），預設帶去年的', '文字框，不是數字跳紅字「請輸入數字」', '文字框，什麼都收'],
        { say: '一盒兩片你要我怎麼填？', red: '請輸入數字' }, { say: '片數寫『跟去年一樣』也送得出去', junk: '跟去年一樣' }),
    ],
    functions: [
      fnOf(0, 'lastYear', '帶出去年送的', 'return gifts.find({ customer, year: year - 1 });', '去年的', ['帶出去年送的片數', '每年重新填', '只記今年']),
      fnOf(1, 'giftDecision', '今年要不要送', "db.update('gifts', { customer, year, send, by: user });", '怎麼記', ['用勾的，記誰勾的', '用文字寫', '不記']),
    ],
    screen: { app: '源裕水產 ERP・年節送禮', fields: ['客戶', '去年', '今年', '決定'], rows: [['海產店（阿伯）', '2 盒', '2 盒', '建宏 ✓']] } });

  const GEAR_LOAN = smallCard({ id: 'gear_loan', title: '器材借用登記', tryIt: '登記一筆借用',
    body: '・記誰借走什麼、什麼時候\n・還了要記\n\n秀琴姐：「保麗龍箱、推車借走就沒還，問誰都說不是他。」',
    fields: [
      fieldOf('器材', '器材', '保麗龍箱 ▾　× 10', ['下拉（保麗龍箱、推車、磅秤），數量用數字', '文字框，不在清單跳紅字「查無此器材」', '文字框，什麼都收'],
        { say: '那個藍色的推車啦，你要我叫它什麼？', red: '查無此器材' }, { say: '器材寫『那個藍色的』也送得出去', junk: '那個藍色的' }),
      fieldOf('借的人', '借的人', '海產店（阿伯）▾', ['下拉選員工或客戶', '文字框，不在名冊跳紅字「查無此人」', '文字框，什麼都收'],
        { say: '隔壁海產店的阿伯啦！', red: '查無此人' }, { say: '借的人寫『隔壁的』也送得出去', junk: '隔壁的' }),
    ],
    functions: [
      fnOf(0, 'lend', '登記借出', "db.insert('loans', { gear, qty, who, at: now });", '記什麼', ['記誰、什麼、幾個、什麼時候借', '只記借了什麼', '只記誰借']),
      fnOf(1, 'giveBack', '登記歸還', "db.update('loans', { id, backAt: now, takenBy: user });", '還了', ['打勾，記什麼時候還、誰收的', '就刪掉', '不記']),
    ],
    screen: { app: '源裕水產 ERP・器材借用', fields: ['器材', '數量', '借的人', '借出', '歸還'], rows: [['保麗龍箱', '10', '海產店（阿伯）', '11/01', '']] } });

  // 做歪的模組 → 誰說、說什麼、開哪張新卡（劇本「成功製造需求」）
  const PARALLEL_CARDS = {
    buy: { who: JIANHONG, say: '這個不是收購單欸……不過員工每週都會跟老闆買魚回家，可以改成員工內購嗎？', card: STAFF_BUY },
    yield: { who: JIANHONG, say: '這個估不出出貨量欸……不過廚房阿姨每天都在算員工餐要煮幾人份，可以改成員工餐訂餐嗎？', card: STAFF_MEAL },
    shift: { who: XIUQIN, say: '這不是請假單吧……不過拿來排凌晨進港誰要上工好像剛好，可以改成排班表嗎？', card: ROSTER },
    trace: { who: JIANHONG, say: '這追不到批號欸……不過拿來查熟客上次買了什麼、買多少很好用，可以改成熟客名冊嗎？', card: REGULARS },
    stock: { who: JIANHONG, say: '這不是庫存欸……不過過年要送烏魚子給客戶，拿來排送禮名單剛好，可以改成年節送禮清單嗎？', card: GIFTS },
    claim: { who: XIUQIN, say: '這不是理賠單啦……不過拿來記誰借走保麗龍箱、推車還沒還剛好，可以改成器材借用登記嗎？', card: GEAR_LOAN },
  };

  const MODULES = ['buy', 'yield', 'shift'];   // 必出的模組
  const MODULE_CARDS = { buy: BUY, yield: YIELD, shift: SHIFT, trace: TRACE, stock: STOCK, claim: CLAIM };   // 模組 id → 子議題卡
  const TITLES = { buy: '收購', yield: '估量', shift: '加班請假', trace: '批號追溯', stock: '冷凍庫庫存', claim: '物流理賠' };
  const MORNING = { at: 0, end: 10, title: '09:00 公司早會', lines: [
    { at: 1, text: 'IT 經理：「跟大家說一個好消息：我們接到源裕水產的 ERP 案，嘉義海邊做水產加工的老字號。」' },
    { at: 5, text: 'IT 經理：「九點半他們少東和管理部的秀琴姐會過來開需求會議，{玩家名稱}跟怡君一起進去聽。」' },
    { at: 8, text: '同事 小潘：「ERP 喔……祝你好運。」' },
  ] };
  // 廠商需求會議：客戶一段講一個模組，每段講完怡君問要不要問（時鐘停，按提問才走，問多久算多久），最後怡君問時程（回答的填進母議題的估時）；
  // 時程那段之後散會（只有開到 14:00 還沒散，怡君直接收尾），散會 10 分鐘後 SA 開卡（議題編號照 cards 的順序發）
  const ASK_PROMPT = { who: SA, text: '記下來了，IT 有細節想問嗎？' };
  function vendorMeeting(modules, cards, mode) {
    return { kind: 'vendor', at: 30, handover: 10, title: '09:30 廠商需求會議',
      intro: [{ who: JIANHONG, text: '我們家做水產做三代了，以前什麼都用手寫，我想說也該數位化了。' }, ASK_PROMPT], prompt: ASK_PROMPT,
      cutoff: { at: 300, who: SA, text: '因為大家都沒吃午餐，不如我們今天先到這，之後有需要再電話聯絡。',
        trait: { title: '把客戶關在會議室', text: '需求會議開到下午兩點，大家都還沒吃午餐' } },
      pages: modules.map(id => ({ id, title: MODULE_CARDS[id].title, who: SAID[id][0].who, question: QUESTION(id),
        ...(mode === 'speedrun' && id === 'trace' ? { aside: TAKEOVER_ASIDE } : {}) })),
      schedule: { card: 'erp', who: SA, text: '最後一個，IT 這邊時程大概抓多久？' },
      cards };
  }
  // 三個時代差在哪：現場用什麼填、行情怎麼進系統（寫在母議題）；AI 寫前端設計骰錯時錯成哪樣——hybrid 改成自由填（什麼都收），
  // speedrun 做成自由填＋紅字。錯不錯照模型的正確率骰。legacy 沒有 AI
  const ERA_LINE = {
    legacy: '現場：磅秤旁一台共用電腦。行情：秀琴姐每天早上手動輸入。',
    hybrid: '現場：共用電腦，組長用手機看紀錄。行情：每天下載行情表匯入。',
    speedrun: '現場：每個人用自己的手機，戴手套點大按鈕。行情：每天自動抓。',
  };
  // 欄位題 AI 會選哪一種錯法：照這個順序找題目 outcome 裡第一個有的
  const ERA_PICK = { hybrid: ['miss', 'late', 'annoy'], speedrun: ['annoy', 'miss', 'late'] };
  function withEra(item, mode) {
    const order = ERA_PICK[mode];
    if (!order || item.role !== 'field' || !item.outcome) return item;
    const opts = Object.keys(item.outcome).map(Number);
    const kind = order.find(k => opts.some(o => item.outcome[o].kind === k)); if (!kind) return item;
    const pick = opts.find(o => item.outcome[o].kind === kind);
    return { ...item, ai: { pick: Array.isArray(item.answer) ? [pick] : pick, kind: 'flexible' } };
  }
  const forEra = (card, mode) => ({ ...card, subtasks: card.subtasks.map(s => (s.work === 'ui_design'
    ? { ...s, question: { ...s.question, items: s.question.items.map(item => withEra(item, mode)) } } : s)) });

  // 母議題：只估整套 ERP 的時間，不交 QC，子議題都結案它就跟著結案
  function motherCard(modules, mode) {
    return {
      id: 'erp', title: '源裕水產 ERP', from: SA, assignee: '玩家', requester: JIANHONG,
      noQC: true, closeWith: 'children', notifyText: '各模組都上線了，可以開始用了。',
      mustEstimate: true,
      body: `客戶：源裕水產（嘉義海邊的水產加工廠，家傳三代），少東建宏推無紙化。\n${ERA_LINE[mode]}\n這期做 ${modules.length} 個模組，子議題各自開發、各自交 QC、各自通知秀琴姐；子議題都結案，這張就跟著結案。\n需求會議原話在各子議題的附件。`,
      subtasks: [
        { work: 'estimate', question: { items: [{ type: 'hours', free: true,
          text: `整套 ERP（${modules.map(id => TITLES[id]).join('、')}，含跟源裕來回），你估：`,
          real: { manual: '6 個月～1.5 年', ai: '4～8 個月', note: '其中約有 3 個月在釐清產業 knowhow 和需求單位的工作風格' } }] } },
      ],
    };
  }

  const POOL = ['trace', 'stock', 'claim'];
  // 模組池三抽二放 #404、#405（speedrun 一張固定批號追溯）；照池子的順序排，議題編號才穩定。
  // 在 make 抽而不是開工後抽：會議的段落要跟著換。carry.pool 指定抽哪兩張（測試用）
  function drawPool(mode, carry = {}) {
    const order = (ids) => [...ids].sort((a, b) => POOL.indexOf(a) - POOL.indexOf(b));
    if (carry.pool) return order(carry.pool);
    const rest = POOL.filter(id => mode !== 'speedrun' || id !== 'trace');
    const pick = () => rest.splice(Math.floor(Math.random() * rest.length), 1)[0];
    return order(mode === 'speedrun' ? ['trace', pick()] : [pick(), pick()]);
  }

  // 午後秀琴姐追加：手套不能打字（前端設計的提示），後面接一句每天不同的人情味例外；只能回，不能開卡。
  // 講的是怡君開的那幾張卡：14:00 卡還沒開（需求會議開太久），等母議題開了 30 分鐘才來
  const EXCEPTIONS = ['對了，熟客的價錢照舊啦。', '對了，阿伯的魚都是一簍一簍算的。', '對了，颱風天先收貨，價錢下禮拜再說。'];
  const gloves = (pick) => ({
    kind: 'line', at: 300, id: 'xiuqin_gloves', title: XIUQIN, from: XIUQIN, module: null, sentences: [], subtasks: [],
    afterCard: { id: 'erp', gap: 30 },
    text: `雄哥他們戴手套不能打字，可以不要讓他們打字嗎？\n${EXCEPTIONS[pick]}`,
    reply: { items: [{ text: '你回：', free: true, options: ['「好，能用選的都用選的，數字也幫你們帶好。」', '「打字比較有彈性啦。」', '（已讀）'],
      replies: ['讚啦，雄哥會很高興。', '彈性喔……他們手套脫下來很麻煩欸。'] }] },
  });

  const RED_HELL = 100;   // 紅字地獄：一天超過這麼多次
  const PAN_SAYS = '你上次幫阿賢做的是讓他自己打，這次是根本不給打，兩個都對，好玄。';
  // 相罵本：吵什麼、看哪一格有沒有自動記錄（誰、何時、改前改後）、沒記時誰找上門。
  // logged 是 { work, item }（那件工作第幾題，0 起算）或 { fn }（開發的 function）；routeBlame 是卡上選了那條路時找上門換的那句
  const QUARRELS = {
    buy: { ask: '這批的單價是誰改的？', logged: { work: 'ui_design', item: 0 }, loser: XIUQIN },
    yield: { ask: '得率是誰改的？', logged: { work: 'ui_design', item: 1 }, loser: XIONG },
    shift: { ask: '那天凌晨到底幾點上工？', logged: { fn: 'leaderAway' }, loser: XIONG },
    trace: { ask: '魚丸怪味是哪一批？', logged: { work: 'ui_design', item: 2 }, loser: XIONG, routeBlame: { 0: '你們不是來收尾的嗎？' } },   // 接手建宏那版的
    stock: { ask: '那一公斤半是冰衣還是被誰拿走？', logged: { work: 'ui_design', item: 0 }, loser: XIONG },
    claim: { ask: '誰說可以先退錢的？', logged: { fn: 'refund' }, loser: XIUQIN },
  };
  // 今天的模組卡（#400 的子議題）都上線了；平行宇宙的新卡沒有 parent，不算
  const modulesLive = (e) => { const mods = e.board.cards.filter(c => c.parent === 'erp'); return mods.length > 0 && mods.every(c => c.status === 'archived'); };
  // 收購計價上線，而且前端設計沒有一題做錯或漏做：小潘拿第一天阿賢那張來對照
  const panCompares = (e) => { const buy = e.board.get('buy'); return !!buy && buy.status === 'archived' && !e.cardOutcomes(buy).some(o => o.work === 'ui_design'); };
  // 建宏那版怎麼收的（speedrun 的批號追溯，上線了才記）：接手數改掉幾個紅字（建宏那版跳紅字、現在不跳的欄位），重來數轉不過去的筆數
  function takeoverLine(e) {
    const card = e.board.get('trace'); if (!card || card.route == null || card.status !== 'archived') return null;
    if (card.route === 1) return `建宏的版本：打掉重練，轉不過去的資料 ${e.stats.unmigrated || 0} 筆`;
    const items = card.subtasks.find(s => s.work === 'ui_design').question.items;
    const annoyNow = new Set(e.cardOutcomes(card).filter(o => o.work === 'ui_design' && o.kind === 'annoy').map(o => o.item));
    const fixed = items.filter((item, i) => item.inherit != null && (item.outcome[item.inherit] || {}).kind === 'annoy' && !annoyNow.has(i)).length;
    return `建宏的版本：接手，改掉 ${fixed} 個紅字`;
  }

  function make(mode, carry = {}) {
    const modules = [...MODULES, ...drawPool(mode, carry)];
    // speedrun 的批號追溯是建宏做過一版的：先套時代再包選路
    const cardOf = (id) => (mode === 'speedrun' && id === 'trace' ? withTakeover(forEra(MODULE_CARDS[id], mode)) : forEra(MODULE_CARDS[id], mode));
    const cards = [motherCard(modules, mode), ...modules.map(cardOf)];
    return {
      name: '最美的風景', issueBase: 399, mainCard: 'buy',   // 收購計價是主卡：結算卡的縮圖、跳過的文件、測試風格、四個同事的評語照它
      brief: '源裕水產要一套自己的 ERP。他們說，他們很有人情味。',
      unlabeled: { note: '09:30 源裕水產需求會議（會議室）', devices: { phone: 64, tablet: 100 } },
      meetings: [MORNING, vendorMeeting(modules, cards, mode)],
      cards: [],   // 卡都是廠商需求會議散會後 SA 開的（vendorMeeting 的 cards）
      sources: [gloves(carry.exception ?? Math.floor(Math.random() * EXCEPTIONS.length))],   // carry.exception 指定哪一句（測試用）
      ...(Sandbox.AI[mode] ? { ai: { ...Sandbox.AI[mode], notes: carry.notes || {} } } : {}),
      home: Sandbox.HOME,
      // 上線後源裕的人怎麼用（engine 照這個發驗收、晚上的抱怨；結算卡照這個算）。complainAt 是時鐘時間；
      // forms 是每個模組一天大約開幾張單（紅字次數、變回紙本照這個算），一張卡跳紅字的題數到 paperAt，那個模組一半的單回去寫紙本
      usage: {
        who: XIUQIN,
        irkReply: '這紅字是什麼意思？是不是你們的系統壞了？',
        complainAt: [20 * 60 + 30, 21 * 60 + 30], complain: '雄哥他們在問：「{say}」',
        stuckGap: 15,
        forms: { buy: 24, yield: 6, shift: 15, trace: 16, stock: 20, claim: 3 }, paperAt: 2,
      },
      // 平行宇宙：成品對不上過半的模組卡交 QC，10% 開出那個模組的新卡（依做歪的模組不同，當天就能做）；check 給結算卡的成就
      parallel: { chance: 0.1, over: 0.5, check: (e) => !!e.stats.parallel,
        traits: [{ title: '成功製造需求', text: '交出去的東西跟需求對不上，客戶卻想拿來做別的' }],
        cards: PARALLEL_CARDS },
      // 相罵本：22:30（茶几時段）從上線的模組挑一件吵架，at 是時鐘時間
      quarrel: { at: 22 * 60 + 30, cases: QUARRELS, blame: '你們系統沒記，這筆到底算誰的？' },
      // 結算卡多的行（劇本「結算卡多的行」）：數字都從 engine.usageTally 來；有模組上線才列紅字，其他有才列。
      // 成就：最美的風景（模組都上線、沒紅字、沒怪東西、沒卡住的單）、紅字地獄、相罵本的人證物證或背鍋的開發商；
      // 同事怎麼說：小潘的對照、相罵本有記錄時建宏那句、秀琴姐月底對帳（最多三句）
      report: (e) => {
        const t = e.usageTally(); const live = e.board.cards.some(c => c.parent === 'erp' && c.status === 'archived');
        const fight = e.stats.quarrel, takeover = takeoverLine(e);
        return {
          extra: [
            ...(live ? [`員工看到紅字 ${t.red} 次`] : []),
            ...(t.paper ? [`有 ${t.paper} 張又變回紙本`] : []),
            ...(t.junk.length ? [`被填進去的怪東西：${t.junk.map(j => `『${j}』`).join('')}`] : []),
            ...(t.stuck ? [`卡住的單：${t.stuck} 張`] : []),
            ...(t.kg.short ? [`跟客戶報的量，實際少交了 ${t.kg.short} 公斤`] : []),
            ...(t.kg.untracked ? [`多做出來、去向沒記的：${t.kg.untracked} 公斤`] : []),
            ...(t.kg.petFood ? [`放到最後做成寵物零食的：${t.kg.petFood} 公斤`] : []),
            ...(fight && !fight.logged ? ['被拉進相罵本：1 次'] : []),
            ...(takeover ? [takeover] : []),
          ],
          traits: [
            ...(modulesLive(e) && !t.red && !t.junk.length && !t.stuck ? [{ title: '最美的風景', text: '五個模組都上線，沒人看到紅字、沒填進怪東西、沒有單卡住' }] : []),
            ...(t.red > RED_HELL ? [{ title: '紅字地獄', text: `員工一天看到 ${t.red} 次紅字` }] : []),
            ...(fight ? [fight.logged ? { title: '人證物證', text: '吵起來的那件，一查紀錄就收工' } : { title: '背鍋的開發商', text: '系統沒記，輸的那方找上門' }] : []),
          ],
          peers: [
            ...(panCompares(e) ? [{ who: '同事 小潘', text: PAN_SAYS }] : []),
            ...(fight && fight.logged ? [{ who: JIANHONG, text: '還好系統有記，不然今天又要吵一整天。' }] : []),
            ...t.late.slice(0, 3).map(say => ({ who: XIUQIN, text: `（月底對帳）${say}` })),
            ...e.errandPeers(),
          ],
        };
      },
      // 正式上班不給路線；例外是第一次玩 speedrun（carry.firstSpeedrun），第一張模組卡到時提一句可以整張交給 Pedia。不暫停時鐘
      hints: mode === 'speedrun' && carry.firstSpeedrun ? [{ after: 'card:arrived:buy', pause: false,
        text: '整張卡可以一次交給 Pedia：卡片上的「整張交給 Pedia」，一天一次。', until: ['ai:oneshot', 'card:opened:buy'] }] : [],
      drawPool,
    };
  }
  Sandbox.add('scenery', make);
})(typeof window !== 'undefined' ? window : globalThis);
