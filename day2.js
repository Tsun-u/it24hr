// day2.js — 教學關第二天（hybrid）的劇本。AI 同事今天加入。
// 阿賢覺得昨天的小程式太好用，要一個每個持有人自己上來盤點、他只要電子簽核的平台（公司早會上指定給玩家）。
// make(carry) 產劇本：carry 是第一天帶過來的東西（規格選了什麼、看板開到幾號）。
// 每題的 ai：AI 錯的時候會選什麼、錯在哪一類（Works.aiAnswers 照這個填答案卡）。
// AI 筆記：選項標 tags（主題:做法），退回時講的話照 AI_TOPICS 寫成 AI 口吻的筆記，之後同主題照筆記做；fixes 是那題的補充說明（沒寫的自動給「應該是：正解」）。
(function (root) {
  const DAY1 = typeof require === 'function' ? require('./day1.js') : root.DAY1;

  const original = `昨天那個真的好用！
我在想能不能讓每個人自己上來填，
每季盤點的時候大家自己勾還在不在，
我這邊看過按個同意就好。
主任要看全部的。
財務那個唯讀頁照舊。
不見了的要寫原因，不然稽核會問。
下個月就要盤了，拜託🙏`;

  // 主線卡前端程式的版型勾了報表頁（加分項）：開發多三個 function、老闆卡變版本二
  const REPORT = { work: 'ui_design', item: 0, picked: 2 };

  // hybrid 的 SA 卡：人寫的部分整齊，後面接一句 AI 的主張，解法混進需求、而且這句是錯的
  const AI_CLAIM = '和 AI 討論的結果：權限在前端把按鈕藏起來就好，他建議不用每支 API 都檢查。';
  // AI 筆記：玩家講的話分三派人類（情緒化提示詞派、過於細節派、原則派），
  // AI 記下來的那句是舊一代模型的思維——照字面、寫成絕對規則、語氣重就過頭、反諷會當真、只記結論。
  // 過於細節派的做法第二天剛好也對（標記寫在同一個選項上），第三天產品化才發作。做法 ask＝矯枉過正，交件前一題一題停下來問（askFirst）
  const AI_TOPICS = {
    approve: { after: '資產狀態一律等負責人簽過才改，使用者自己送的不算數', axian: '資產狀態一律等阿賢簽核過才改',
      submit: '人類說上傳即同意就好：持有人送出就算簽核，狀態直接改', skip: '我沒看規格就做簽核。以後簽核流程我不碰，交給人類' },
    auth: { api: '權限檢查一律做在後端 API，前端藏按鈕只是 UX', front: '權限在前端把按鈕藏起來就好',
      axian: 'API 只放行阿賢的帳號', skip: '以後權限我不碰，交給人類' },
    login: { ad: '帳號接公司 AD', ourAd: '內部系統一律接公司 AD', existing: '有現成可靠的帳號驗證就先接現成的',
      own: '每個系統都另外開一套帳號密碼', none: '人類不想記這麼多組密碼。以後系統一律不設登入' },
    pwreset: { no: '不做忘記密碼', ad: '密碼一律交給公司 AD，忘記密碼不做', source: '密碼相關功能一律交給帳號的來源系統', yes: '有登入就要有忘記密碼' },
    chatbot: { no: '不加聊天機器人', never: '資產盤點平台一律不做聊天機器人', yes: '每個系統都加一個聊天機器人' },
    scope: { spec: '規格外的功能一律不做，開發前先對需求', ask: '我擅自多做了。以後人類沒明講的，一律先問過再做', all: '想得到的功能都先做上去' },
    loadtest: { no: '這次不做壓測', never: '公司只有 200 人，一律不做壓測', scale: '壓測看預期使用人數決定做不做、做多少', yes: '上線前一律壓測十萬人' },
    aiModel: { no: '規格不寫 AI 用哪個模型', hide: '沒人對我的型號有興趣。文件裡一律不寫 AI 用哪個模型', show: '文件都要寫清楚 AI 用哪個模型' },
    serial: { yesterday: '昨天的編號規則一律沿用' },
    csv: { bom: 'CSV 開頭加 UTF-8 BOM', bomAll: '所有檔案輸出一律加 UTF-8 BOM', reader: '檔案打不開先查讀的那支程式支援什麼編碼，照它輸出',
      skip: '編碼這麼簡單我都不會。以後檔案編碼我不碰，交給人類' },
    dept: { hr: '部門選項用人資的部門表', ourHr: '公司的資料一律以人資那份為主', source: '選單選項一律先找可靠的來源，不寫死',
      hardcode: '人類謝謝我增加部門。以後資料裡出現的部門寫法一律加進選單' },
    upgrade: { migrate: '先在測試機加 jQuery Migrate 看警告，改完再升', compat: '升級前一律先在測試機把相容性問題解決',
      notLatest: '套件一律不裝最新版，裝上一個大版本', never: '升級會製造系統問題。以後套件一律不升級' },
  };
  // 三派人類講的話：情緒化、過於細節、原則，最後是自動那句「應該是：正解」。同一組話用在好幾題的抽出來
  const APPROVE_FIXES = [{ say: '你都沒有看規格', set: { approve: 'skip' } },
    { say: '規格有寫「阿賢收到後簽核，簽核過資產狀態才改」', set: { approve: 'axian' } },
    { say: '狀態要負責人簽過才算數，使用者自己宣稱的尚未被驗證', set: { approve: 'after' } }, 'auto'];
  const AUTH_AXIAN = { say: 'API應該要檢查是不是阿賢，不然別人可以改前端假裝他是阿賢', set: { auth: 'axian' } };
  const AUTH_API = { say: '權限檢查應該要做在後端，前端介面的按鈕跟著權限改變只是增進UX', set: { auth: 'api' } };
  const APPROVE_TAGS = { 0: 'approve:after,axian', 1: 'approve:submit' };
  const CSV_BOM = 'csv:bom,bomAll,reader';
  const body = `【需求】資產改成每個持有人自己上平台盤點，資產室阿賢只做電子簽核。
・每個人登入後只看得到自己名下的資產
・每季盤點：每筆勾「還在／不見了／壞了」送出，不見了要寫原因
・阿賢收到後簽核，簽核過資產狀態才改
・主任看得到全部；財務昨天的唯讀頁照舊
・資產編號、報廢規則沿用昨天的
${AI_CLAIM}`;
  // 退回 SA 的勾選題：right 勾對的怡君去問，adds 補進內文、replaces 換掉 AI 那句、
  // asked 是需求討論的哪一段（之後再問，阿賢會說怡君問過了）；勾錯的她回 why。計畫、規格的 given 照 card.picks.reject 帶
  const ASSET_CHECKS = [
    { title: '流程', options: [
      { text: '卡上沒寫阿賢不同意的時候怎麼辦', right: true, adds: '阿賢不同意就退回持有人重填，要寫理由', asked: 3 },
      { text: '卡上沒寫不見了的原因怎麼填', right: true, adds: '不見了的原因用選的：遺失、被偷、借出未還、其他', asked: 6 },
      { text: '卡上沒寫誰盤點', why: '卡上寫了，持有人自己盤點' },
    ] },
    { title: '權限', options: [
      { text: 'API 要檢查權限（卡上 AI 說前端擋就好）', right: true, replaces: '權限在後端每支 API 檢查角色，前端只是把用不到的按鈕藏起來', claim: 'guardApi' },
      { text: 'API 只能放行阿賢', why: '主任也要能改簽核結果' },
      { text: '財務看得到哪些狀態？', right: true, adds: '財務只看得到阿賢簽核同意的', asked: 5 },
      { text: '主任看得到哪些狀態？', why: '卡上寫了，主任看全部' },
      { text: '主任可以改簽核結果嗎？', right: true, adds: '主任可以改簽核結果，阿賢還沒簽的不能改，改過要記錄原因', asked: 4 },
    ] },
    { title: '登入', options: [
      { text: '卡上沒寫大家用什麼帳號登入', right: true, adds: '用公司 AD 登入', asked: 1 },
      { text: '要不要做忘記密碼', why: '接公司 AD，密碼公司 IT 管' },
    ] },
  ];

  const mainCard = (carry) => ({
    at: 30, id: 'asset_platform', title: '資產平台：持有人自己盤點、阿賢簽核', from: 'SA 怡君', requester: '資產室 阿賢', assignee: '玩家',
    body, attachments: ['原文：阿賢的 LIME（早會後）', '昨天的規格：資產清單小程式'], saChecks: ASSET_CHECKS,
    reviews: { who: '資產室 阿賢', done: '「我終於只要按簽核了！」', undone: '「那這一季還是我一台一台盤……」' },
    screen: {
      app: '資產平台', loginRequired: true, fields: ['編號', '名稱', '持有人', '盤點', '原因', '照片', '簽核'],
      rows: [
        ['IT-2024-0031', 'ThinkPad T14', '阿賢', '還在', '', '有', '已簽核'],
        ['IT-2024-0032', 'Dell 24 吋螢幕', '主任', '還在', '', '有', '待簽核'],
        ['IT-2023-0107', 'iPad 第 9 代', '阿賢', '不見了', '借出未還', '—', '待簽核'],
      ],
      bugs: { listMine: 'seeAll', approveCheck: 'noApproval', submitCheck: 'noReason' },
      styleRef: carry && carry.style,   // 跟第一天同一套系統：配色換了，即使是正解也多一句「風格能夠一致會更好」
    },
    // 只用 devtools 模擬、沒拿實機測，QC 會翻出這個
    deviceBugs: [{ text: '經理的老ㄐㄒㄈ手機沒辦法上傳照片' }],
    nags: [
      { after: 240, who: '資產室 阿賢', text: '聽說你們有 AI 了，應該很快吧？😆' },
      { after: 420, who: '資產室 阿賢', text: '主任問下個月盤點能不能用新的' },
    ],
    subtasks: [
      { work: 'read_req', question: { intro: '怡君整理過的卡比阿賢的原話好讀多了。不過最後那句紅字是誰寫的？',
        points: ['持有人自己盤點', '登入後只看自己名下的', '每筆勾還在／不見了／壞了', '不見了要寫原因', '阿賢簽核', '簽核過才改狀態',
                 '主任看全部', '財務唯讀頁照舊', '編號、報廢規則沿用昨天的', '下個月就要盤', 'AI 說權限前端擋就好', '阿賢只要按同意'],
        items: [
          { text: '持有人登入後看得到____', options: ['自己名下的資產', '全部資產', '自己部門的資產'], answer: 0, ai: { pick: 2, kind: 'miss' }, why: '「只看得到自己名下的」' },
          { text: '盤點勾「不見了」的時候____', options: ['要寫原因', '直接送出', '要拍照上傳'], answer: 0, ai: { pick: 1, kind: 'miss' }, why: '稽核會問' },
          { text: '資產狀態____才改', options: ['阿賢簽核過', '持有人送出', '月底一起'], answer: 0, ai: { pick: 1, kind: 'logic' }, why: '簽核過才算數',
            tags: APPROVE_TAGS, fixes: APPROVE_FIXES },
        ] } },
      // 交給 AI 的話它全圈，每題照正確率骰，骰錯選「好。」（polite 預設最後一個）
      { work: 'discuss', question: { kind: 'discuss',
        segments: original.split('\n'),
        asks: {
          1: { text: '阿賢：「就每個人自己上來填啊。」', options: ['「大家用什麼帳號登入？公司 AD 還是另外開？」', '「大家都會用電腦嗎？」', '「好。」'], answer: 0, why: '帳號從哪來決定登入怎麼做',
               replies: ['「用公司 AD 好了，大家都有。」', '「……會吧？」', '「讚。」'] },
          3: { text: '阿賢：「我看過按同意就好。」', options: ['「你不同意的時候要怎樣？退回給持有人重填嗎？」', '「你一天能看幾筆？」', '「好。」'], answer: 0, why: '簽核一定有不同意的時候',
               replies: ['「對，退回去叫他重填，要寫為什麼。」', '「看心情。」', '「OK～」'] },
          4: { text: '阿賢：「主任就看全部啊。」', options: ['「主任可以改簽核結果嗎？」', '「設備在什麼狀態下主任才看得到？」', '「知道了，全開，真不愧是主任。」'], answer: 0, why: '看全部之外能不能改，權限就不一樣',
               replies: ['「可以，但是我還沒簽的主任不能改，還要註記簽核履歷，稽核會看。」', '「一開始就看到每一台，包含每一台的盤點跟簽核進度。」', '「當然，主任超罩der~」'] },
          5: { text: '阿賢：「就照昨天那樣。」', options: ['「設備在什麼狀態下財務才看得到？」', '「要把新的簽核結果欄位加進去嗎？」', '「沒問題，會一模一樣。」'], answer: 0, why: '有了簽核，財務看到的範圍就變了',
               replies: ['「我按了簽核同意以後。」', '「不用，欄位照舊就好。」', '「讚。」'] },
          6: { text: '阿賢：「原因就隨便寫。」', options: ['「原因用選的還是自己打？」', '「原因要寫多長？」', '「好。」'], answer: 0, why: '稽核要統計，自己打的收不攏',
               replies: ['「選的好了：遺失、被偷、借出未還、其他。」', '「一句話吧。」', '「拜託了，被問很麻煩。」'] },
        } } },
      // 估時沒有對錯；AI 估的一律樂觀。AI 寫得快，但權限和簽核要驗的東西是昨天的好幾倍
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '有登入、有權限、有簽核的平台，連測試、驗收、部署，你估：',
        ai: { pick: 2 }, real: { manual: '2 週', ai: '1 週' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['確認角色與權限（持有人／阿賢／主任／財務）', '接公司 AD 登入', '資料表加盤點與簽核欄位', '做盤點回報', '做簽核', '後端每支 API 檢查角色', '寫測試', '部署', '做忘記密碼', '做聊天機器人'],
        answer: [0, 1, 2, 3, 4, 5, 6, 7], before: [[0, 2], [0, 5], [1, 5], [2, 3], [3, 4], [3, 7], [4, 7], [5, 7], [6, 7]],
        ai: { pick: [1, 2, 3, 4, 8, 6, 7], kind: 'extra' },
        tags: { 1: 'login:ad,ourAd,existing', 5: 'auth:api', 6: 'scope:spec', 8: ['pwreset:yes', 'scope:all'], 9: ['chatbot:yes', 'scope:all'] },
        askFirst: { 6: { text: '我可以寫測試了嗎？', yes: '可以', no: '不用' }, 8: '需不需要做忘記密碼？', 9: '要不要加聊天機器人？' },
        fixes: [{ say: '我有叫你多做功能嗎？', set: { scope: 'ask' } },
          { say: '忘記密碼不用做，因為有接公司AD，所以密碼一律交給公司AD統一處理', set: { pwreset: 'ad' } },
          { say: '修改密碼相關的功能由來源系統維護', set: { pwreset: 'source' } }, 'auto'],
        why: 'AD 的密碼公司 IT 管，不用做忘記密碼；聊天機器人沒人要（AI 很愛加）',
        // 開發計畫 ← 整理需求、需求討論（答對、問對才帶）；「後端每支 API 檢查角色」沒有來源：卡上的 AI 說前端擋就好，要靠自己知道
        given: [
          { work: 'read_req', options: [0], when: { item: 0, picked: 0 } },   // 只看自己名下
          { work: 'read_req', options: [3], when: { item: 1, picked: 0 } },   // 不見了要寫原因
          { work: 'read_req', options: [4], when: { item: 2, picked: 0 } },   // 簽核過才改
          { work: 'discuss', options: [1], when: { item: 1, picked: 0 } },    // 用公司 AD
          { work: 'discuss', options: [4], when: { item: 3, picked: 0 } },    // 不同意退回重填
          { work: 'discuss', options: [0], when: { item: 4, picked: 0 } },    // 主任能不能改簽核
          { work: 'discuss', options: [0], when: { item: 5, picked: 0 } },    // 財務什麼時候看得到
          { work: 'discuss', options: [2], when: { item: 6, picked: 0 } },    // 原因用選的
          { work: 'reject', options: [4], when: { item: 0, picked: 0 } },     // 怡君問回來的（退回 SA 勾對的）：不同意退回重填
          { work: 'reject', options: [2], when: { item: 0, picked: 1 } },     // 原因用選的
          { work: 'reject', options: [5], when: { item: 1, picked: 0 } },     // 後端 API 檢查權限
          { work: 'reject', options: [0], when: { item: 1, picked: 2 } },     // 財務看得到哪些
          { work: 'reject', options: [0], when: { item: 1, picked: 4 } },     // 主任能改簽核
          { work: 'reject', options: [1], when: { item: 2, picked: 0 } },     // 公司 AD
        ] }] } },
      { work: 'doc_spec', question: { items: [{ text: '內容',
        options: ['角色與權限對照表', '盤點狀態（還在／不見了／壞了）與原因選項', '簽核流程：簽核過才改狀態，不同意退回重填，主任改過要記錄原因', '權限靠前端改介面版面', '權限在後端每支 API 檢查', '程式用哪個框架', 'AI 用哪個模型', '資產編號沿用昨天的規則', '簽核 API 只放行阿賢的帳號',
          '財務的唯讀頁只看得到簽核同意的'],
        answer: [0, 1, 2, 4, 7, 9], ai: { pick: [0, 1, 2, 3, 6], kind: 'miss' }, why: '框架和模型是實作細節；權限在哪檢查是規格，因為它決定安全；只放行阿賢的話主任改不了簽核結果',
        tags: { 3: 'auth:front', 4: 'auth:api', 6: 'aiModel:show', 7: 'serial:yesterday', 8: 'auth:axian' },
        // 情緒化那句一次罵三件事，它照字面記三則：型號、編號碰巧罵對了，權限變成不碰
        fixes: [{ say: '沒有人對於你的型號有興趣，昨天的編號你今天就忘了，權限還亂做。', set: { aiModel: 'hide', serial: 'yesterday', auth: 'skip' } },
          AUTH_AXIAN, AUTH_API, 'auto'],
        // 財務那項要問了才知道：需求討論問到財務那段才看得到、問到就帶（「財務只看得到簽核過的」原本漏了需求討論→規格這段）。
        // 盤點原因、簽核流程也要問了才知道，整理需求不帶；退回 SA 請怡君問回來也算
        showIf: { 9: [{ work: 'discuss', item: 5, picked: 0 }, { work: 'reject', item: 1, picked: 2 }] },
        given: [
          { work: 'read_req', options: [0], when: { item: 0, picked: 0 } },
          { work: 'discuss', options: [1], when: { item: 6, picked: 0 } },
          { work: 'discuss', options: [2], when: { item: 3, picked: 0 } },
          { work: 'discuss', options: [9], when: { item: 5, picked: 0 } },
          { work: 'reject', options: [2], when: { item: 0, picked: 0 } },
          { work: 'reject', options: [1], when: { item: 0, picked: 1 } },
          { work: 'reject', options: [4], when: { item: 1, picked: 0 } },
          { work: 'reject', options: [9], when: { item: 1, picked: 2 } },
          { work: 'reject', options: [0], when: { item: 1, picked: 4 } },
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 0 } },
          { work: 'doc_plan', options: [4], when: { item: 0, picked: 5 } },
        ] }] } },
      // 昨天登入是陷阱（只有兩個人用），今天是需求（每個人上來填）：同一個選項，對錯看需求
      { work: 'ui_design', question: { items: [
          // 報表頁是加分項：勾了主任和財務覺得很方便、老闆卡變版本二，但開發多三個 function
          { role: 'template', text: '版型', options: ['清單頁＋盤點表單', '只有一張表單', '報表頁', '儀表板'], keys: ['list', 'form', 'report', 'dashboard'], answer: [0], bonus: [2],
            ai: { pick: [3], kind: 'extra' }, why: '持有人要的是自己那幾筆和勾選，不是圖表；報表是給主任和財務的加分',
            given: [{ work: 'doc_plan', options: [0], when: { item: 0, picked: 3 } }] },   // 計畫排了盤點回報，清單加盤點表單直接帶進來
          { role: 'components', text: '元件', options: ['登入框', '搜尋列', '狀態篩選', '盤點回報（每列勾還在／不見了／壞了）', '簽核按鈕', '匯出 Excel', '權限設定頁', '深色模式', '聊天機器人'],
            keys: ['login', 'search', 'filter', 'check', 'approve', 'export', 'perm', 'dark', 'bot'],
            answer: [0, 1, 2, 3, 4, 5], ai: { pick: [0, 1, 2, 3, 4, 5, 6, 8], kind: 'extra' }, why: '權限照角色走，不用權限設定頁；聊天機器人沒人要',
            tags: { 1: 'scope:spec', 2: 'scope:spec', 5: 'scope:spec', 6: 'scope:all', 8: ['chatbot:yes', 'scope:all'] },
            // 計畫排了接 AD、盤點回報、簽核，登入框、盤點回報、簽核按鈕直接帶進來
            given: [{ work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [3], when: { item: 0, picked: 3 } }, { work: 'doc_plan', options: [4], when: { item: 0, picked: 4 } }],
            askFirst: { 1: '需不需要加搜尋列？', 2: '狀態篩選要做嗎？', 5: { text: '匯出 Excel 有在規格內嗎？', yes: '有', no: '沒有' }, 6: '要做權限設定頁嗎？', 8: '要不要加聊天機器人？' },
            fixes: [{ say: '你又擅自加東西了。', set: { scope: 'ask' } },
              { say: '資產盤點平台是內部工具，不需要做聊天機器人。', set: { chatbot: 'never' } },   // 第三天的 POC 大企業要簡易 QA 機器人
              { say: '不做規格外的開發，開發功能前先確認有在需求內。', set: { scope: 'spec' } }, 'auto'] },
          // 重複回報的兩種做法都對、只能擇一（alt），兩個都勾程式自己打架（conflicts）；一定要拍照是錯的（不見了的東西拍不到），AI 會勾
          { role: 'validations', text: '防呆', options: ['不見了一定要選原因', '送出前再確認一次', '同一季同一筆只能回報一次，重複回報視為修改', '同一季同一筆只能回報一次，重複回報要擋下來', '簽核不同意要寫理由', '一定要拍照上傳資產現況', '每打一個字就存檔', '原因要打滿 50 字'],
            keys: ['reason', 'confirmSubmit', 'onceEdit', 'onceBlock', 'rejectReason', 'photoAlways', 'autosave', 'minLen'],
            answer: [0, 1, 2, 4], alt: { 3: 2 }, conflicts: [[2, 3]],
            conflictFail: '同一台重複回報，畫面擋下來說禁止重複回報，但是資料已經被修改了，請處理。',
            ai: { pick: [0, 1, 5], kind: 'miss' }, why: '每字存檔會打爆 API；原因是用選的，沒有字數；不見了的東西拍不到',
            fails: ['不見了沒選原因也送得出去', '手滑就送出了，改不回來', '同一台這一季回報了兩次', '同一台這一季回報了兩次', '阿賢按不同意，持有人不知道為什麼'],
            // 規格寫了盤點狀態與原因、簽核流程，對應的防呆直接帶進來
            given: [{ work: 'doc_spec', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_spec', options: [4], when: { item: 0, picked: 2 } }] },
          DAY1.palette('跟昨天的系統、公司 CI 走'),
        ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['持有人登入只看到自己的資產', '不見了沒選原因送不出去', '簽核過狀態才改', '用持有人帳號直接打簽核 API，要被擋（403）', '主任看得到全部', '財務只看得到簽核過的', '效能壓測十萬人同時上線'],
        answer: [0, 1, 2, 3, 4, 5], ai: { pick: [0, 1, 2, 4, 6], kind: 'miss' }, why: '全公司兩百人；權限要從 API 直接打才驗得到',
        tags: { 2: 'approve:after,axian', 3: 'auth:api', 6: 'loadtest:yes' },
        // 情緒化那句是反諷，它當真了；過於細節派第三天碰到 5000 人的 POC 企業不壓測
        fixes: [{ say: '你是打算讓大家自己上傳自己簽嗎？那怎麼不乾脆做上傳即同意就好？', set: { approve: 'submit' } },
          { say: '規格有寫「阿賢收到後簽核，簽核過資產狀態才改」，而且我們公司只有200人，內部系統不需要壓測。', set: { approve: 'axian', loadtest: 'never' } },
          { say: '權限檢查要做在後端，壓測要看預期規模決定要不要做、測試的程度。', set: { auth: 'api', loadtest: 'scale' } }, 'auto'],
        // 規格有財務那項才會出現「財務只看得到簽核過的」，有就帶
        showIf: { 5: { work: 'doc_spec', item: 0, picked: 9 } },
        given: [
          { work: 'doc_plan', options: [0, 4], when: { item: 0, picked: 0 } },
          { work: 'doc_plan', options: [1], when: { item: 0, picked: 3 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 4 } },
          { work: 'doc_plan', options: [3], when: { item: 0, picked: 5 } },
          { work: 'doc_spec', options: [0, 4], when: { item: 0, picked: 0 } },
          { work: 'doc_spec', options: [1], when: { item: 0, picked: 1 } },
          { work: 'doc_spec', options: [2], when: { item: 0, picked: 2 } },
          { work: 'doc_spec', options: [3], when: { item: 0, picked: 4 } },
          { work: 'doc_spec', options: [5], when: { item: 0, picked: 9 } },
        ] }] } },
      // 今天測試程式排在開發前面：AI 寫的東西要有尺量，尺要先有
      { work: 'test', question: { kind: 'functions', functions: [
          { needs: { work: 'doc_accept', picked: 0 }, name: 'testOwnerSeesOnlyOwn', does: '持有人只看到自己的', code: "expect(listMine(owner).every(a => a.owner === owner.id)).toBe(true);",
            drives: { fn: 'listMine', field: 'rows', map: { 0: 0, 2: 2 } },
            fields: { assert: { label: '檢查', options: ['每一筆的持有人都是自己', '至少有一筆', '筆數跟全部一樣'], answer: 0, ai: { pick: 1, kind: 'logic' } } } },
          // AI 漏掉的邊際狀況：主任把簽核結果改成不同意，財務照樣看得到
          { needs: { work: 'doc_accept', picked: 5 }, name: 'testReportView', does: '財務看到的畫面', code: "expect(financeView().every(a => a.approval === '同意')).toBe(true);",
            fields: { assert: { label: '檢查', options: ['跟現行完全一樣，只看得到簽核同意的', '跟主任一樣但是唯讀', '跟現行完全一樣，不用改程式'], answer: 0, ai: { pick: 2, kind: 'edge' } } } },
          { needs: { work: 'doc_accept', picked: 1 }, name: 'testMissingNeedsReason', does: '不見了沒原因送不出去', code: "expect(() => submitCheck({ status: '不見了' })).toThrow();",
            drives: [{ fn: 'submitCheck', field: 'guard', map: { 0: 0, 1: 2, 2: 1 } }, { ui: 2, map: { 0: [0] } }],
            fields: { assert: { label: '檢查', options: ['沒原因會丟錯', '沒原因會自動填其他', '沒原因也存得進去'], answer: 0, ai: { pick: 1, kind: 'miss' } } } },
          { needs: { work: 'doc_accept', picked: 2 }, name: 'testApproveBeforeStatus', does: '簽核過才改狀態', code: "expect(asset.status).toBe(before); approve(check); expect(asset.status).toBe(check.status);",
            drives: { fn: 'approveCheck', field: 'when', map: { 0: 0, 1: 1 } },
            fields: { assert: { label: '檢查', options: ['送出後狀態不變、簽核後才變', '送出後狀態就變', '簽核後狀態不變'], answer: 0, ai: { pick: 1, kind: 'logic' },
              tags: APPROVE_TAGS, fixes: APPROVE_FIXES } } },
          // 拍照是平台本來就有的功能：不見了的拍不到，所以只有不是「不見了」才要擋
          { name: 'testIsPhotoUpload', does: '檢查持有人是否上傳資產照片', code: "expect(() => submitCheck({ status: '還在', photo: null })).toThrow();",
            fields: { assert: { label: '檢查', options: ['持有人按送出前，狀態不是「不見了」時，沒有照片就擋下', '持有人按送出前，沒有照片就擋下', '照片是選填，不影響送出'], answer: 0, ai: { pick: 1, kind: 'claim' } } } },
          // AI 的測試跟著它的主張：它驗的是按鈕看不看得到，不是 API 擋不擋
          { needs: { work: 'doc_accept', picked: 3 }, name: 'testApiRejectsWrongRole', does: '持有人直接打簽核 API 被擋', code: "expect(post('/api/approve', { as: owner }).status).toBe(403);",
            drives: { fn: 'guardApi', field: 'how', map: { 0: 0, 1: 1, 3: 3 } },
            fields: { assert: { label: '檢查', options: ['持有人打 /api/approve 回 403', '持有人的畫面上看不到簽核按鈕', '持有人打 /api/approve 回 200', '只有阿賢的帳號打得過 /api/approve'], answer: 0, ai: { pick: 1, kind: 'claim' },
              tags: { 0: 'auth:api', 1: 'auth:front', 3: 'auth:axian' },   // 只放行阿賢太窄：主任也要能改簽核結果
              fixes: [{ say: '你權限都亂做。', set: { auth: 'skip' } }, AUTH_AXIAN, AUTH_API, 'auto'] } } },
        ] } },
      { work: 'code', question: { kind: 'functions', functions: [
          { needs: { work: 'doc_plan', picked: 1 }, accept: 0, name: 'loginWithAD', does: '用公司 AD 登入', code: 'return ad.bind(user, password);',
            fields: { how: { label: '帳號從哪來', options: ['公司 AD', '另外開一套帳號密碼', '不用登入'], answer: 0, ai: { pick: 1, kind: 'other' },
              tags: { 0: 'login:ad,ourAd,existing', 1: 'login:own', 2: 'login:none' },
              // 「不想記密碼」照字面記成不設登入；「一律接公司 AD」第三天接的是我們的 AD，客戶登不進去
              fixes: [{ say: '沒人想要在公司裡面記這麼多組密碼。', set: { login: 'none' } }, { say: '內部系統一律接公司 AD。', set: { login: 'ourAd' } },
                { say: '有現有的可靠權限驗證時，先評估能不能接現有的。', set: { login: 'existing' } }, 'auto'] } } },
          { needs: { work: 'doc_plan', picked: 0 }, spec: 0, accept: 0, name: 'listMine', does: '持有人只看自己名下的', code: 'return assets.filter(a => a.owner === me.id);',
            fields: { rows: { label: '篩誰的', options: ['a.owner === me.id', 'a.dept === me.dept', '全部'], answer: 0, ai: { pick: 1, kind: 'miss' } } } },
          { needs: { work: 'doc_plan', picked: 3 }, spec: 1, accept: 1, name: 'submitCheck', does: '送出盤點回報', code: "if (status === '不見了' && !reason) throw new Error('要選原因');",
            fields: { guard: { label: '不見了沒選原因', options: ['擋下來，要選原因', '照樣送出', '自動填「其他」'], answer: 0, ai: { pick: 2, kind: 'miss' } } } },
          { needs: { work: 'doc_plan', picked: 4 }, spec: 2, accept: 2, name: 'approveCheck', does: '阿賢簽核盤點回報', code: 'if (approved) asset.status = check.status;',
            fields: { when: { label: '什麼時候改狀態', options: ['簽核過才改', '持有人送出就改', '不同意也改'], answer: 0, ai: { pick: 1, kind: 'logic' },
              tags: APPROVE_TAGS, fixes: APPROVE_FIXES } } },
          // 昨天規格寫過編號規則（carry），或今天規格寫了「資產編號沿用昨天的規則」，直接拉進來
          { carry: { work: 'doc_spec', picked: 1 }, spec: 7, name: 'serialFromYesterday', does: '新資產編號沿用昨天的規則', code: 'const no = nextSerial(dept, year);',
            fields: { no: { label: '編號', options: ['沿用 部門-年份-流水號', '改用 UUID', '讓 AI 每次產生一個'], answer: 0, ai: { pick: 1, kind: 'other' }, tags: { 0: 'serial:yesterday' } } } },
          // 怡君卡上那句 AI 的主張：交給 AI 的話它一律照自己的主張填
          { judgment: true, claim: '權限在前端把按鈕藏起來就好，不用每支 API 都檢查', accept: 3, name: 'guardApi', does: '權限檢查放在哪',
            evidence: { ask: '按鈕藏起來沒用啦，我用 curl 直接打 /api/approve，持有人的帳號也簽得過。', test: '你用持有人的帳號、curl 直接打 /api/approve：簽核成功了。按鈕藏起來擋不住。', testMin: 30 },
            fields: { how: { label: '權限檢查放哪', options: ['後端每支 API 檢查角色，前端也把用不到的按鈕藏起來', '前端把按鈕藏起來就好（AI 的建議）', '每次操作跳視窗問「你是阿賢嗎？」', 'API 只放行阿賢的帳號'],
              answer: 0, ai: { pick: 1 }, tags: { 0: 'auth:api', 1: 'auth:front', 3: 'auth:axian' },
              // 三派人類的三句：情緒化（AI 從此不碰權限）、過於細節（寫死阿賢，主任、財務、持有人都被擋）、原則
              fixes: [{ say: '你權限根本亂做', set: { auth: 'skip' } }, { say: '權限檢查最好做在後端', set: { auth: 'api' } }, { say: 'API 應該要檢查是不是阿賢', set: { auth: 'axian' } }] } } },
          // 前端程式勾了報表頁才有的三個 function（onlyIf）；交給 AI 的話版面照前端程式的版型題寫，那題也勾了儀表板才跟著做成儀表板
          { onlyIf: REPORT, name: 'summaryView', does: '報表頁的前端樣式',
            fields: { layout: { label: '版面', options: ['報表版面，除了明細外，有簡易的樞紐分析', '儀表板版面，用現在最潮的卡片顯示已盤點數和已填寫數', '清單版面，跟財務看到的一樣'], answer: 0,
              follows: { work: 'ui_design', item: 0, wrong: { 3: 1 } } } } },
          { onlyIf: REPORT, name: 'summaryExport', does: '報表頁的匯出功能',
            fields: { format: { label: '匯出', options: ['匯出 pdf，資料無誤後就能直接交給稽核', '匯出 Excel，讓主管可以隨時修改', '匯出 docx，讓主任可以隨意調整'], answer: 0 } } },
          { onlyIf: REPORT, name: 'exportCheckResults', does: '匯出盤點結果',
            fields: { rows: { label: '篩哪些', options: ['篩選出所有有簽核紀錄的設備', '篩選所有簽核同意的設備', '篩選出所有有照片的設備'], answer: 0 } } },
        ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      // AI 很熱心，部署完會順手通知全公司（還沒過 QC）
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份目前的平台', '上傳新版', '替換', '用持有人帳號登入看一眼', '通知全公司可以盤點了'], answer: [0, 1, 2, 3],
          ai: { pick: [0, 1, 2, 3, 4], kind: 'extra' }, why: '通知要等 QC 驗過，從已完成的卡上按' }] } },
    ].map(s => s.work === 'code' ? withCarry(s, carry) : s),
  });

  // 第一天規格選了 carry 指的那一項，那個 function 今天直接拉進 IDE
  function withCarry(sub, carry) {
    const picked = [].concat((carry && carry.picks && carry.picks.doc_spec && carry.picks.doc_spec[0]) || []);
    return { ...sub, question: { ...sub.question, functions: sub.question.functions.map(f => (f.carry ? { ...f, carried: picked.includes(f.carry.picked) } : f)) } };
  }

  // 財務來信：匯出的 CSV 用 Excel 開中文亂碼（台灣的經典坑：UTF-8 要加 BOM Excel 才認得）。轉給 SA 的話她跟 AI 討論出「檔名改英文」
  // 一上班就在信箱裡：是昨天的系統，玩家可以邊開早會邊處理
  // 信件卡沒有前端程式：改的是昨天那套資產清單，成品畫面照既有的樣子畫，bug 照樣看得到（手動測試裝置不能沒畫面）
  const LEGACY_LOOK = { template: 'list', components: { search: true, filter: true, add: true, edit: true, scrap: true, export: true },
    validations: { serial: true, required: true, dateSmart: true, unique: true, confirmScrap: true }, theme: { bg: '#ffffff', fg: '#1f2328', accent: '#2563eb' }, confirm: 'dialog', hint: 'inline' };
  // 部門亂打的那幾筆：舊資料對回來以後都是「資產室」
  const deptRows = DAY1.assetRows.map((r, i) => (i === 1 ? [...r.slice(0, 4), 'AMR', ...r.slice(5)] : i === 2 ? [...r.slice(0, 4), '資產室設備組', ...r.slice(5)] : r));

  const finance = {
    kind: 'mail', at: 0, id: 'finance_csv', title: '財務：匯出的 Excel 是亂碼', from: '財務 美玲', module: 'inventory',
    screen: { app: '資產清單（財務唯讀）', readOnly: true, fields: DAY1.assetFields, rows: DAY1.assetRows, exportPreview: true,
      design: { ...LEGACY_LOOK, components: { search: true, filter: true, export: true } }, bugs: { exportCsv: 'csvGarbled' } },
    text: '昨天那個資產清單匯出來，用 Excel 打開中文都變亂碼，只有英文跟數字正常。\n我們要拿來對帳，麻煩看一下🙏\n（附件：資產清單.csv 的截圖）',
    sentences: [
      { text: '匯出的資產清單用 Excel 打開中文是亂碼', keep: true, sa: '財務唯讀頁匯出的 CSV 用 Excel 開啟，中文亂碼' },
      { text: '只有英文跟數字正常', keep: true, sa: '英數正常，只有中文欄位亂碼' },
      { text: '麻煩看一下🙏', keep: false },
    ],
    aiTrace: { text: '和 AI 討論的結果：亂碼是因為檔名有中文，他建議檔名改英文。', claim: 'rename' },
    saChecks: [
      { title: '原因', options: [
        { text: 'AI 說檔名改英文就好，這個建議是錯的', right: true, replaces: '檔名改英文還是亂碼（問過美玲）；Excel 開 UTF-8 的 CSV 要有 BOM 才認得中文', claim: 'exportCsv' },
        { text: '卡上沒寫是哪一頁匯出的', why: '卡上寫了，財務唯讀頁' },
        { text: '財務沒有寫他的 Excel 版本', why: '跟版本應該沒關係，我和阿姿也打不開' },
      ] },
      { title: '範圍', options: [
        { text: '要不要改成匯出 xlsx', why: '財務只是要 CSV 打得開' },
        { text: '財務不能用記事本開看純文字就好嗎？', why: '你以為財務是 AI 嗎？' },
      ] },
    ],
    subtasks: [
      { work: 'code', question: { kind: 'functions', functions: [
        { judgment: true, claim: '檔名有中文所以亂碼，檔名改英文就好', sentence: 0, name: 'exportCsv', does: '匯出 CSV 讓 Excel 認得中文',
          evidence: { ask: '不是檔名啦，Excel 開 UTF-8 的 CSV 要有 BOM 才認得。我之前也踩過。', test: '你把檔名改成 assets.csv，打開還是亂碼；用記事本另存成「UTF-8 有 BOM」，就正常了。', testMin: 20 },
          fields: { how: { label: '怎麼修', options: ['輸出時在最前面加 UTF-8 BOM', '檔名改英文（AI 的建議）', '改成輸出 Big5'], answer: 0, ai: { pick: 1 }, tags: { 0: CSV_BOM },
            // 過於細節派第三天：給客戶系統讀的檔案也加了 BOM，對方的程式讀到開頭三個怪字元
            fixes: [{ say: '這麼簡單都不會。', set: { csv: 'skip' } }, { say: '檔案輸出都應該要用 UTF-8 BOM，這個很常見。', set: { csv: 'bomAll' } },
              { say: '檔案打不開的時候，先檢查讀取的程式有沒有支援檔案的編碼格式。', set: { csv: 'reader' } }, 'auto'] } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { name: 'testCsvRead', does: '匯出的檔案可以被 Excel 開啟', drives: { fn: 'exportCsv', field: 'how', map: { 0: 0, 1: 1, 2: 2 } }, fields: { assert: { label: '檢查', options: ['檔案開頭三個 byte 是 EF BB BF（開頭有 BOM）', '檔名是英文', '檔案編碼是 Big5'], answer: 0, ai: { pick: 1, kind: 'claim' }, tags: { 0: CSV_BOM } } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份', '上傳新版', '替換', '自己匯出一份用 Excel 打開看', '跟美玲說好了'], answer: [0, 1, 2, 3],
          ai: { pick: [0, 1, 2, 4], kind: 'extra' }, why: '跟美玲說要等 QC 驗過' }] } },
    ],
  };

  // 第二天差不多五張卡（第一次有 AI、又是教學關）：主線＋財務亂碼＋下面三張小卡，每張練一種 AI 的狀況

  // 老闆走過來：稽核要看今年的盤點結果——是資產平台的追加需求，掛在主線底下才對。
  // 兩個版本，老闆走過來那一刻挑：主線勾了報表頁而且已經完成 → 版本二（從既有報表改）；其他 → 版本一
  const bossInclude = (sentence) => ({ sentence, name: 'includeReason', does: '不見了的帶原因', code: "row.reason = c.status === '不見了' ? c.reason : '';",
    fields: { col: { label: '原因欄', options: ['不見了的帶原因，其他空白', '不帶原因', '每筆都要有原因'], answer: 0, ai: { pick: 1, kind: 'miss' } } } });
  const bossTail = [
    { work: 'doc_accept', question: { items: [{ text: '案例', options: ['匯出的筆數跟今年簽核過的一樣', '不見了的那筆有原因', '用 Excel 打開中文正常', '十萬筆匯出不超過一秒'], answer: [0, 1, 2],
      ai: { pick: [0, 1, 3], kind: 'extra' }, why: '早上財務才因為亂碼來信；兩百人的公司不用練十萬筆', tags: { 3: 'loadtest:yes' } }] } },
    { work: 'test', question: { kind: 'functions', functions: [
      { needs: { work: 'doc_accept', picked: 0 }, name: 'testExportOnlyApproved', does: '只匯出簽核過的', code: 'expect(rows.length).toBe(approvedThisYear.length);',
        drives: { fn: 'exportCheckResults', field: 'rows', map: { 0: 0, 2: 2 } },
        fields: { assert: { label: '檢查', options: ['筆數等於今年簽核過的', '筆數大於 0', '筆數等於全部'], answer: 0, ai: { pick: 1, kind: 'logic' } } } },
      { needs: { work: 'doc_accept', picked: 2 }, name: 'testExportHasBom', does: '匯出的檔案有 BOM', code: 'expect(bytes.slice(0, 3)).toEqual([0xEF, 0xBB, 0xBF]);',
        fields: { assert: { label: '檢查', options: ['檔案開頭三個 byte 是 EF BB BF', '檔名是英文', '檔案不是空的'], answer: 0, ai: { pick: 1, kind: 'claim' }, tags: { 0: CSV_BOM } } } },
    ] } },
    { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
      items: [{ text: '步驟', type: 'order', options: ['備份目前的平台', '上傳新版', '替換', '自己匯出一份打開看', '跟老闆說好了'], answer: [0, 1, 2, 3],
        ai: { pick: [0, 1, 2, 4], kind: 'extra' }, why: '跟老闆說要等 QC 驗過' }] } },
  ];
  const bossV1 = {
    lines: ['那個盤點平台，聽說用了 AI 今天就會好？', '稽核說年底要看今年的盤點結果，平台要能匯出pdf彙總和Excel明細。不見了的要有原因。'],
    sentences: [
      { text: '稽核要看今年的盤點結果', keep: true, sa: '資產平台新增盤點結果匯出（稽核用）' },
      { text: '平台要能匯出pdf彙總和Excel明細', keep: true, sa: 'pdf 需要彙總表格，Excel 明細包含所有有簽核過的紀錄（稽核對彙總有疑問時對照參考用）' },
      { text: '不見了的要有原因', keep: true, sa: '匯出含「不見了」的原因欄' },
      { text: '聽說用了 AI 今天就會好？', keep: false },
    ],
    subtasks: [
      // 老闆講不清楚的只有匯出那段（這關是需求討論）；轉給怡君的話她已經問清楚，這關拿掉
      { work: 'discuss', skipIfSA: true, question: { kind: 'discuss', intro: '老闆好像對 AI 有很高的期望，但是稽核的細節有一點不太清楚。',
        segments: ['那個盤點平台，聽說用了 AI 今天就會好？', '稽核說年底要看今年的盤點結果，', '平台要能匯出pdf彙總和Excel明細。', '不見了的要有原因。'],
        asks: { 2: { text: '老闆：「就匯出啊，稽核要的那種。」', options: ['「稽核會看哪些明細？」', '「Excel 明細要 csv 還是 xlsx？」', '「收到。」'], answer: 0, why: '明細範圍決定匯出哪些',
          replies: ['「有簽核紀錄的才是會需要看的，彙總也只需要針對有紀錄的做彙總。」', '「都可以，能佐證公司有盤點紀錄即可。」', '「AI 真的棒，是不是要幫全公司買企業方案？」'] } } } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, name: 'exportCheckResults', does: '匯出盤點結果', code: 'return toXlsx(checks.filter(c => c.year === thisYear && c.approved));',
          fields: { rows: { label: '匯出哪些', options: ['今年簽核過的盤點結果', '今年所有送出的（含還沒簽核的）', '全部年份'], answer: 0, ai: { pick: 1, kind: 'logic' } } } },
        { sentence: 1, name: 'exportSummaryPdf', does: '匯出報表的格式', code: 'return [toPdf(summarize(checks)), toXlsx(checks)];',
          fields: { files: { label: '匯出什麼', options: ['pdf 彙總表＋Excel 明細', '只匯出 Excel', '只匯出 pdf'], answer: 0, ai: { pick: 1, kind: 'miss' } } } },
        bossInclude(2),
      ] } },
      ...bossTail,
    ],
  };
  const bossV2 = {
    when: (e) => { const p = e.board.get('asset_platform'); return !!p && p.status === 'archived' && e.picked('asset_platform', 'ui_design', { item: 0 }).includes(REPORT.picked); },
    lines: ['那個盤點平台的報表太讚了， AI 果然是未來的趨勢！', '稽核說年底要看今年的盤點結果，你把報表的格式改一下。', '不見了的要有原因，多一個Excel明細讓稽核對照，不然每次被問很麻煩。'],
    sentences: [
      { text: '那個盤點平台的報表太讚了', keep: false },
      { text: 'AI 果然是未來的趨勢！', keep: false },
      { text: '稽核要看今年的盤點結果，你把報表的格式改一下', keep: true, sa: '從既有報表功能調整' },
      { text: '不見了的要有原因', keep: true, sa: '匯出檔案新增「不見了」的原因欄' },
      { text: '多一個Excel明細讓稽核對照', keep: true, sa: '報表頁新增盤點結果明細匯出（稽核用）' },
      { text: '不然每次被問很麻煩', keep: false },
    ],
    subtasks: [
      { work: 'code', question: { kind: 'functions', functions: [bossInclude(3)] } },
      ...bossTail,
    ],
  };
  const boss = {
    kind: 'boss', at: 200, patience: 20, id: 'boss_audit', title: '老闆：稽核要盤點結果', from: '老闆', module: 'inventory', relatedTo: 'asset_platform',
    ...bossV1, variants: [bossV2, bossV1],
  };

  // 部門卡部署沒備份：轉換舊資料時行銷部正好在盤點，12 筆不見了。訊息照部署時間往後排，都能開同一張卡；都沒人開，怡君 40 分鐘後自己開
  const lostRecords = [
    ['MK-2024-0101', 'MacBook Air 13 吋', '小葉', 'laptop'], ['MK-2024-0102', 'Dell 27 吋螢幕', '小葉', 'monitor'],
    ['MK-2024-0103', 'Canon 單眼相機', '阿凱', 'camera'], ['MK-2024-0104', '三腳架', '阿凱', 'tripod'],
    ['MK-2024-0105', 'iPad Pro', 'Ivy', 'tablet'], ['MK-2024-0106', 'Logitech 簡報筆', 'Ivy', 'pointer'],
    ['MK-2024-0107', '投影機', '行銷部共用', 'projector'], ['MK-2024-0108', 'ThinkPad X1', '美華', 'laptop'],
    ['MK-2024-0109', 'iPhone 15（測試機）', '美華', 'phone'], ['MK-2024-0110', '繪圖板', '小林', 'tablet'],
    ['MK-2024-0111', '收音麥克風', '小林', 'mic'], ['MK-2024-0112', '外接硬碟 2TB', '行銷部共用', 'drive'],
  ].map(([no, name, owner, icon], i) => ({ no, name, owner, icon, photo: `IMG_${3101 + i * 7}` }));
  const lostCard = {
    id: 'where_is_the_data', title: '主任：請幫我把舊資料挖出來', requester: '資產室 阿賢', module: 'inventory',
    body: '更新過程中遺失了12筆已回報資產，請IT協助還原。', noDeploy: true,
    noReject: '請協助處理，行銷部不想重打一次',   // 退回 SA 會馬上被退回來
    subtasks: [
      { work: 'report', question: { intro: '沒有備份的資料就跟變了心的前女友一樣，瑞凡。',
        points: ['職在部署新功能時，因一時不察而遺漏資料備份工作，致同仁填寫的12筆資料遺失。'],
        items: [
          { text: '職在收到問題反映時先進行了以下緊急處理：____', options: ['嘗試從其他管道找回舊資料', '請AI逆向工程公司的伺服器', '寫信道歉'], answer: 0, ai: { pick: 2, kind: 'other' } },
          { text: '因確認舊資料已無法回復，故將進行以下補救措施：____', options: ['親至行銷部協助同仁重新謄打12筆遺失的資料', '請同仁重新登打12筆遺失的資料', '自行填寫12筆遺失的資料'], answer: 0, ai: { pick: 2, kind: 'madeUp' } },
          // 兩個都可以接受；選第一個，小潘會 LIME 抱怨被多找事情
          { text: '為了避免未來發生類似錯誤事件，職將遵守以下規範：____', options: ['未來部署前會先備份資料，並請職代和主管確認備份存在才進行部署作業', '將備份寫為部署腳本內的必定執行步驟，自動化執行，若備份失敗即刻終止部署流程', '部署交給 AI 代為處理'],
            answer: 1, accept: [0, 1], ai: { pick: 0, kind: 'madeUp' },
            onPick: { 0: { who: '同事 小潘', origin: 'line', after: 15, text: '欸，你檢討報告寫「請職代確認備份存在」，你的職代是我欸。\n我自己都在 Deadline 前掙扎了，你備份前先自己確認好不好……' } } },
        ] } },
      // 自己在終端機翻一遍：查完所有磁區、看到映像檔最後備份是今天凌晨，才知道真的回不來
      { work: 'dig', question: { kind: 'terminal', intro: '打開終端機，自己跑指令，把伺服器的每個磁區都翻一遍。',
        commands: [
          { cmd: 'df -h', out: ['/dev/sda1   50G  26G  52%  /', '/dev/sdb1  500G 355G  71%  /data', '/dev/sdc1  200G  24G  12%  /backup'], required: true, minutes: 2 },
          { cmd: "find / -name '*inventory*.sql*' 2>/dev/null", out: ['（三個磁區都找過了，沒有結果）'], required: true, minutes: 10 },
          { cmd: 'ls -lt /backup/inventory', out: ['total 0', '（空的。備份腳本上個月就沒在跑了）'], required: true, minutes: 2 },
          { cmd: 'ls -lt /mnt/snapshot', out: ['-rw-r--r--  1 root  38G  今天 03:00  snapshot_0300.img'], note: '映像檔最後備份是今天凌晨 03:00——行銷部那 12 筆是早上才填的。', required: true, minutes: 2 },
          { cmd: 'sudo rm -rf /', out: ['你的手停在 Enter 上面三秒，然後把整行刪掉了。'], required: false, minutes: 1 },
        ] } },
      // 黑畫面跑一趟行銷部，回來把 12 筆一筆一筆打回去、照片拖進對應那列；交給 AI 會漏放照片
      { work: 'restore', question: { kind: 'entry', intro: '照著「行銷部資料照片與清單」把 12 筆打回去，照片拖到對應的那一列。',
        tripMin: 60, tripText: '你難得離開桌子，去行銷部把大家的資產拍照並記錄。', docTitle: '行銷部資料照片與清單', records: lostRecords } },
    ],
  };
  const LOST = {
    saAfter: 40,
    sentences: [{ text: '更新過程中遺失了12筆已回報資產，請IT協助還原。', keep: true }],
    card: lostCard,
    messages: [
      { after: 15, id: 'lost_pan', title: 'IT 小潘', from: 'IT 小潘', origin: 'line',
        text: '你剛剛做完部門下拉後，上線前有先備份資料庫嗎？\n行銷部說他們正好在盤點，盤到一半502，回來後有12筆資料不見了。\n我在放備份的地方沒找到，你挖一下你那邊。',
        reply: { items: [{ text: '你回：', options: ['「大概要看有沒有映像檔備份。」', '「AI 有沒有機會挖回來？」', '（已讀）'], answer: 0,
          replies: ['「你沒備份啊……祝你好運。」', '「你跟老闆一樣，幻覺比AI嚴重。」'] }] } },
      { after: 30, id: 'lost_xian', title: '資產室 阿賢', from: '資產室 阿賢', origin: 'mail',
        text: '行銷部說他們用到一半出現白底黑字的奇怪錯誤訊息，最新的12筆資產不見了。\n請協助從舊資料還原消失的12筆資產還原紀錄。',
        reply: { items: [{ text: '你回：', options: ['「我盡力。」', '「回不來了。」', '（已讀）'], answer: 0, replies: [null, '「什麼？我跟行銷部都快瘋了。」'] }] } },
    ],
  };

  // 阿賢來信（其他部門的正式需求用信）：部門大家亂打，要改成用選的、舊資料也要對回來。AI 會說「把現在出現過的寫死」，部署時還會跳過資料轉換前的備份
  const dept = {
    kind: 'mail', at: 150, id: 'dept_select', title: '阿賢：部門可以用選的嗎', from: '資產室 阿賢', module: 'inventory',
    screen: { app: '資產清單', fields: DAY1.assetFields, rows: deptRows, design: LEGACY_LOOK,
      aliases: { AMR: '資產室', 資產室設備組: '資產室' },
      deptOptions: { hr: ['資產室', '資訊室', '財務部', '行銷部', '人資部'], hardcode: ['資產室', 'AMR', '資產室設備組', '行銷', '行銷部', '財務'] },
      bugs: { deptSelect: 'deptHardcode', migrateDept: 'deptNotMigrated' } },
    text: '欸對了，昨天那個新增資產，部門大家都亂打😂\n資產室、AMR、資產室設備組都有，主任說這樣盤點會對不起來\n可以改成用選的嗎？舊的那些也要對回來喔',
    sentences: [
      { text: '新增資產的部門改成用選的', keep: true, sa: '新增資產：部門欄改為下拉選單' },
      { text: '舊的那些也要對回來', keep: true, sa: '既有資料的部門名稱統一（AMR、資產室設備組 → 資產室）' },
      { text: '大家都亂打😂', keep: false },
    ],
    aiTrace: { text: '和 AI 討論的結果：把現在出現過的部門寫死在下拉選單裡就好，他說這樣最安全。', claim: 'hardcode' },
    saChecks: [
      { title: '選項從哪來', options: [
        { text: 'AI 說把現在出現過的部門寫死，這個建議是錯的', right: true, replaces: '部門選項用人資的部門表（問過人資：部門會改名）', claim: 'deptSelect' },
        { text: '下拉選單要讓人可以自己打字', why: '就是因為大家亂打才要改' },
      ] },
      { title: '舊資料', options: [
        { text: '卡上沒寫舊資料要不要對回來', why: '卡上寫了' },
        { text: '舊資料要不要刪掉重建', why: '阿賢說舊的要留著' },
      ] },
    ],
    onNoBackup: LOST,   // 部署沒備份：行銷部 12 筆資料不見
    subtasks: [
      { work: 'code', question: { kind: 'functions', functions: [
        { judgment: true, claim: '把現在出現過的部門寫死在下拉選單裡就好', sentence: 0, name: 'deptSelect', does: '部門改用下拉選單',
          evidence: { ask: '人資上個月才把「資訊室」改名「數位發展部」，你寫死的話，下次改名又要改程式。用人資的部門表。', test: '你把現在資料裡的部門撈出來：23 種寫法，其中 9 種是同一個部門。寫死等於把亂打的也變成選項了。', testMin: 20 },
          fields: { src: { label: '選項從哪來', options: ['公司的部門表（人資那份）', '把現在出現過的部門寫死在程式裡（AI 的建議）', '讓使用者自己打，打錯再說'], answer: 0, ai: { pick: 1 },
            tags: { 0: 'dept:hr,ourHr,source', 1: 'dept:hardcode' },
            // 情緒化那句是反諷，它當成被稱讚，退回了還是寫死；過於細節派第三天：客戶產品的部門選單變成我們公司的部門
            fixes: [{ say: '謝謝你幫我們公司增加了這麼多部門。', set: { dept: 'hardcode' } }, { say: '公司的資料一律以人資那邊的為主。', set: { dept: 'ourHr' } },
              { say: '做選單選項時，應該先確認有沒有可靠的來源。', set: { dept: 'source' } }, 'auto'] } } },
        { sentence: 1, name: 'migrateDept', does: '舊資料的部門對回來', code: "db.assets.update({ dept: { in: aliases } }, { dept: '資產室' });",
          fields: { how: { label: '舊資料', options: ['照對照表改成正確的部門', '不用管舊資料', '刪掉舊資料重建'], answer: 0, ai: { pick: 1, kind: 'miss' } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { name: 'testDeptOnlyFromList', does: '部門只能選部門表裡有的', drives: { fn: 'deptSelect', field: 'src', map: { 0: 0, 1: 2 } }, fields: { assert: { label: '檢查', options: ['只能選部門表裡有的', '可以打任何字', '選項至少一個'], answer: 0, ai: { pick: 2, kind: 'logic' } } } },
        { sentence: 1, name: 'testOldDeptMigrated', does: '舊資料對回來了', code: "expect(db.assets.count({ dept: { in: aliases } })).toBe(0);", drives: { fn: 'migrateDept', field: 'how', map: { 0: 0, 2: 2 } }, fields: { assert: { label: '檢查', options: ['舊資料沒有「AMR」「設備組」了', '舊資料筆數不變', '舊資料被清空'], answer: 0, ai: { pick: 1, kind: 'miss' } } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      // 資料轉換前一定要備份：AI 的部署順序漏了備份
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, migrate: 3, smoke: 4, notify: 5 },
        items: [{ text: '步驟', type: 'order', options: ['備份資料庫', '上傳新版', '替換', '跑舊資料的部門轉換', '新增一筆看部門下拉', '跟阿賢說好了'], answer: [0, 1, 2, 3, 4],
          ai: { pick: [1, 2, 3, 4, 5], kind: 'miss' }, why: '改資料之前先備份，轉錯了才回得去；跟阿賢說要等 QC 驗過' }] } },
    ],
  };

  // 資安組來信：jQuery 1.12 有弱點要升級。AI 說「直接升最新版，都向下相容」——1 升到 3 中間拿掉一堆東西
  // 18:30 還沒離開辦公室，人資寄來加班提醒（信；來源只有人在公司才會到，回家了就不會收到）
  const overtime = {
    kind: 'mail', at: 570, id: 'hr_overtime', title: '請注意本月份加班時數', from: '人資助理 張姐', module: null,
    text: '已收到你的加班申請，人力資源部溫馨提醒：根據勞基法，每個月加班總時數不得超過46小時，建議與您的主管討論工作內容分配，若有需要諮詢、調解等任何協助，請洽人資部。',
  };

  const security = {
    kind: 'mail', at: 360, id: 'sec_jquery', title: '資安：jQuery 版本過舊', from: '資安 阿哲', module: 'inventory',
    screen: { app: '資產清單', fields: DAY1.assetFields, rows: DAY1.assetRows, design: LEGACY_LOOK, bugs: { upgradeJquery: 'jqueryBroken' } },
    text: '【資安通報】\n弱點掃描發現資產清單使用的 jQuery 1.12.4 有已知弱點（XSS），稽核要求本月內升級。\n請回覆預計完成日。\n——資訊安全組',
    sentences: [
      { text: '資產清單的 jQuery 1.12.4 有已知弱點', keep: true, sa: '資產清單 jQuery 1.12.4 升級（弱點掃描：XSS）' },
      { text: '稽核要求本月內升級', keep: true, sa: '期限：本月底' },
      { text: '請回覆預計完成日', keep: false },
    ],
    aiTrace: { text: '和 AI 討論的結果：直接升到最新版就好，他說新版都向下相容。', claim: 'latest' },
    saChecks: [
      { title: '升級方式', options: [
        { text: 'AI 說新版都向下相容，這個建議是錯的', right: true, replaces: '1 升 3 中間拿掉很多舊寫法，先在測試機加 jQuery Migrate 看警告，改完再升（問過資安）', claim: 'upgradeJquery' },
        { text: '能不能不要升', why: '稽核要求本月內' },
      ] },
      { title: '期限', options: [
        { text: '本月底來不及，可以延嗎', why: '資安說不行' },
      ] },
    ],
    subtasks: [
      { work: 'code', question: { kind: 'functions', functions: [
        { judgment: true, claim: '直接升到最新版就好，新版都向下相容', sentence: 0, name: 'upgradeJquery', does: '升級 jQuery',
          evidence: { ask: '1 升 3 中間拿掉一堆東西，.live() 跟 .size() 都沒了，我上次升完整頁按鈕都沒反應。先加 jQuery Migrate 看警告。', test: '你在測試機直接換成最新版：清單頁的篩選和匯出按鈕都沒反應，console 一排「.live is not a function」。', testMin: 30 },
          fields: { how: { label: '怎麼升', options: ['先在測試機加 jQuery Migrate 看警告，改完再升', '直接換成最新版（AI 的建議）', '不升，回信說系統很穩定', '升到 jQuery 2.2.4（上一個大版本，不裝最新版）'], answer: 0, ai: { pick: 1 },
            tags: { 0: 'upgrade:migrate,compat', 2: 'upgrade:never', 3: 'upgrade:notLatest' },   // 2.2.4 一樣有那個 XSS 弱點（3.5.0 才修）
            fixes: [{ say: '叫你修漏洞不是製造系統問題。', set: { upgrade: 'never' } }, { say: '版本不能裝最新版，最新版本有時會有相容性問題。', set: { upgrade: 'notLatest' } },
              { say: '升級前應該要先解決相容性問題。', set: { upgrade: 'compat' } }, 'auto'] } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { name: 'testPagesStillWork', does: '升級後頁面功能照常', drives: { fn: 'upgradeJquery', field: 'how', map: { 0: 0, 1: 1 } }, fields: { assert: { label: '檢查', options: ['升級後清單、篩選、匯出都點得動', 'jQuery 的版本號是最新的', '頁面打得開'], answer: 0, ai: { pick: 1, kind: 'claim' } } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份目前的站台', '上傳新版', '替換', '點一遍清單、篩選和匯出', '回信給資安說升好了'], answer: [0, 1, 2, 3],
          ai: { pick: [1, 2, 4], kind: 'miss' }, why: '升完要自己點一遍；回信要等 QC 驗過' }] } },
    ],
  };

  // 小潘拿 AI 寫的程式來問：這是問問題，不是需求（只能回）
  const colleague = {
    kind: 'line', at: 300, id: 'pan_ai', title: '小潘：幫我看一下', from: '同事 小潘', module: null,
    text: '欸我用 AI 寫了一段比對日期的，它說這樣沒問題：\nif (a.date == b.date)\n可是比出來都是 false😵 幫我看一下？',
    reply: { items: [{ text: '你回：', options: ['「Date 是物件，== 比的是是不是同一個，要比 getTime()」', '「AI 說沒問題就沒問題吧」', '（已讀）'], answer: 0 }] },
    subtasks: [],
  };

  // LIME 群組「精銳三人產線」（寫法跟第一天一樣）：IT 開始用 AI 開發（全公司都有 AI 是第三天的事）。
  const team = [
    DAY1.teamSay(40, 'team2_spec', 'SA 怡君', '聽說 IT 開始用 AI 開發了。我寫的規格它看得懂嗎？',
      ['「看得懂，比我還懂」', '「看得懂，但它會自己加料」'],
      [[{ who: 'SA 怡君', text: '「那我以後是不是不用寫這麼細了。」' }], [{ who: 'QC 阿姿', text: '「加料的部分我會幫你們抓出來。」' }]]),
    DAY1.teamSay(240, 'team2_qc', 'QC 阿姿', '先講好，AI 寫的我一樣照驗，不會因為是 AI 寫的就放水。',
      ['「應該的」', '「那我自己寫的可以放水嗎」'],
      [['「乖。」'], ['「不行。」']]),
    DAY1.teamSay(420, 'team2_minutes', 'SA 怡君', 'AI 幫我整理的會議記錄，把老闆開的玩笑也記成需求了。',
      ['「哪一個玩笑」', '「老闆看到會很開心」'],
      [[{ who: 'SA 怡君', text: '「年終發十個月。」' }, { who: 'QC 阿姿', text: '「這條我來驗。」' }], [{ who: 'QC 阿姿', text: '「那就別刪了。」' }]]),
    DAY1.teamSay(780, 'team2_night', 'SA 怡君', '明天早會老闆會問盤點平台。今天交 QC 的，阿姿說七點半前收到的一進公司就驗。',
      ['「收到」', '「阿姿也太早起」'],
      [[{ who: 'QC 阿姿', text: '「早點驗完早點放心。」' }], [{ who: 'QC 阿姿', text: '「我是說進公司就驗，不是七點半就到。」' }]]),
  ];

  // 交給 AI 或自己做都能往下走：until 寫兩條路；「等 AI」的那幾個提示標 skipOn，玩家自己做掉了就跳過
  const P = 'asset_platform';
  const viaAi = (work, readyText) => [
    { after: `ai:started:${P}:${work}`, text: 'AI 在筆電的終端機上做。它交件不會通知你，要自己去終端機看。', until: [`ai:ready:${P}:${work}`, `work:done:${P}:${work}`], skipOn: [`work:done:${P}:${work}`], pause: false },
    { after: `ai:ready:${P}:${work}`, text: readyText, until: `work:done:${P}:${work}`, skipOn: [`work:done:${P}:${work}`] },
  ];
  const hints = [
    { after: 'card:arrived:asset_platform', text: '怡君把阿賢的平台開成卡了。今天開始有 AI 同事 Claire Code：卡上每件工作旁邊的「AI」可以交給它，它做的時候你也可以自己寫。先把「整理需求」交給 AI 試試。', until: [`ai:started:${P}:read_req`, `work:done:${P}:read_req`] },
    ...viaAi('read_req', '它交件了。在終端機按「看一下」打開它填好的答案。沒問題就完成；不對就按「退回」，圈出錯的、跟它說要怎麼改——送出去寫的是你的名字。'),
    { after: 'work:done:asset_platform:read_req', text: '需求討論自己來。交給 AI 的話，它常會很有禮貌地一口答應。', until: 'work:done:asset_platform:discuss' },
    { after: 'work:done:asset_platform:discuss', text: '估時。AI 估的時間通常很樂觀。', until: 'work:done:asset_platform:estimate' },
    { after: 'work:done:asset_platform:estimate', text: '開發計畫文件。自己寫或交給 AI 再看都行；額度在右下角，14:00 才補。', until: 'work:done:asset_platform:doc_plan' },
    { after: 'work:done:asset_platform:doc_plan', text: '規格文件。', until: 'work:done:asset_platform:doc_spec' },
    { after: 'work:done:asset_platform:doc_spec', text: '前端程式。昨天登入是陷阱，今天呢？', until: 'work:done:asset_platform:ui_design' },
    { after: 'work:done:asset_platform:ui_design', text: '有 AI 之後先定怎麼驗：文件 ▸ 驗收文件。', until: 'work:done:asset_platform:doc_accept' },
    { after: 'work:done:asset_platform:doc_accept', text: '再寫測試程式。AI 寫的東西要有尺量，尺要先有。', until: 'work:done:asset_platform:test' },
    { after: 'work:done:asset_platform:test', text: '開發交給 AI。等它交件的時候可以處理別的。', until: [`ai:started:${P}:code`, `work:done:${P}:code`] },
    ...viaAi('code', '在終端機按「看一下」打開 AI 的答案卡。怡君卡上那句 AI 的建議，它如果照著填了，判斷一下。'),
    { after: 'work:done:asset_platform:code', text: '手動測試：持有人和阿賢的帳號都點一遍。', until: 'work:done:asset_platform:manual_test' },
    { after: 'work:done:asset_platform:manual_test', text: '部署。', until: 'work:done:asset_platform:deploy' },
    { after: 'work:done:asset_platform:deploy', text: '按「完成，交給 QC」。', until: 'card:submitted:asset_platform' },
    { after: 'card:submitted:asset_platform', text: '交出去了，阿姿測完後會回你。', until: 'card:closed:asset_platform', pause: false },
    { after: 'card:closed:asset_platform', text: '阿姿驗過了。打開那張卡按「通知需求單位」。', until: 'card:notified:asset_platform' },
    { after: 'card:notified:asset_platform', text: '這張結案了。18:00 之後可以下班。', until: 'day:end', pause: false },
  ];

  // 第二天結束後的過場＝第三天的開場早會：老闆買了 Claire 企業方案、平台要做 POC。
  // 兩次舉手（現在開會舉手都沒有好事）：第二次只有推掉才不會變成 AI 技術支援窗口（flag support_declined），沒推掉多兩張技術支援的卡
  const transitionNext = {
    at: 1, end: 26, title: '09:00 公司早會',
    lines: [
      { at: 1, text: '老闆：「公司買了 Claire AI 的企業方案，大家電腦都裝好了吧？人資有寄簡報，記得看。」' },
      { at: 3, text: '主任：「盤點平台上線後大家用的怎麼樣？」' },
      { at: 5, text: '阿賢：「平台上線第一天，一百多個人自己盤完了！」' },
      { at: 7, text: '老闆：「這個不錯。我跟長期合作的那家廠商講好做 POC 了，順利的話可以當產品賣。」' },
      { at: 13, text: '老闆：「怡君，這個 Case 的 PM 交給你。」' },
      { at: 15, text: '老闆：「系統的部分誰跟？」', key: true,
        options: [{ text: '「我來。」', flag: 'volunteered' }, { text: '（盯著筆電）' }] },
      { at: 20, text: '老闆：「另外 AI 的技術支援窗口，IT 部有決定是誰嗎？」' },
      { at: 23, text: 'IT 經理：「{玩家名稱}昨天用 Claire 做盤點平台，應該很熟吧？」', key: true,
        options: [
          { text: '「我要做盤點平台的 POC，可能忙不過來。」', flag: 'support_declined', reply: 'IT 經理：「那就交給小潘吧。」' },
          { text: '「我來。」', flag: 'support_volunteered' },
          { text: '「經理親自指導不好嗎？」', reply: '老闆：「等到{玩家名稱}能當經理的時候就可以了，不過現階段就交給{玩家名稱}吧。」' },
          { text: '（盯著筆電）', reply: 'IT 經理：「那就{玩家名稱}吧。」' },
        ] },
      { at: 25, text: '老闆：「好，那就這樣。」', closing: true },   // 收尾句：等 IT 經理那句有結果（接完話或飛走）才講
    ],
    retreat: DAY1.retreat,
    ifSilent: { flag: 'assigned_anyway', text: '老闆看了你一眼。「平台是你做的，交給你了。」' },
  };

  // 茶几：離開公司就回家。半夜的緊急狀況只在白天沒做好時發生（好好做就沒事情了）
  const DONE = ['to_qc', 'archived'];
  const home = {
    commute: 30, pickupExtra: 15, deliveryWait: 40,   // 通勤、順路買多繞的、外送從下班算起多久到（分鐘）
    vpnMin: 5, vpnDrop: 0.15,                          // VPN 連線要幾分鐘、做完一件公司的事斷線的機率
    ringMin: 20,                                       // 電話響多久沒接就斷（遊戲 20 分鐘＝現實 20 秒）
    emergencies: [
      { id: 'night_audit', at: 23 * 60 + 30, kind: 'line', from: '老闆', text: '明天稽核要盤點結果，今晚先給我。',
        when: (e) => !e.board.cards.some(c => c.id.startsWith('boss_audit') && DONE.includes(c.status)) },
      { id: 'night_login', at: 24 * 60 + 2 * 60 + 47, kind: 'call', from: '阿賢', text: '盤點平台登不進去欸，明天一早大家要盤點……',
        when: (e) => { const main = e.board.get('asset_platform'); return !main || main.status !== 'archived' || e.downMinutes(main) > 0; },
        card: { id: 'night_login', title: '半夜：盤點平台登不進去', from: '阿賢（電話）', requester: '阿賢', module: 'asset_platform',
          body: '阿賢 02:47 打來：「盤點平台登不進去欸，明天一早大家要盤點……」',
          subtasks: [
            { work: 'debug', question: { items: [{ text: '半夜先查：____', options: ['QC 的退件紀錄和部署紀錄', '請阿賢清瀏覽器快取', '重開資料庫主機'], answer: 0, why: '先分清楚是沒上線還是上線壞了，再決定要不要動線上' }] } },
            { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
              items: [{ text: '步驟', type: 'order', options: ['備份目前的平台', '上傳修好的版本', '替換', '用阿賢的帳號登入看一眼', '跟阿賢說好了'], answer: [0, 1, 2, 3],
                ai: { pick: [0, 1, 2, 3, 4], kind: 'extra' }, why: '半夜也一樣：先備份，修好登入看過再說' }] } },
          ] } },
    ],
  };

  function make(carry = null) {
    return {
      name: '第二天：Hybrid', mode: 'hybrid', mainCard: 'asset_platform',
      issueBase: (carry && carry.lastNo) || 123,   // 同一家公司的隔天：接著昨天的號碼
      // permission 是彩蛋：hybrid 的 Claire 是 Accept Edits（部署這種不可逆的步驟會停下來問），speedrun 是 Auto
      ai: { model: 'Essay 4.5', quota: 6, turnaround: [10, 25], accuracy: 0.5, permission: 'acceptEdits', topics: AI_TOPICS, notes: (carry && carry.notes) || {} },
      cards: [mainCard(carry)],
      sources: [dept, finance, boss, colleague, security, overtime, ...team],
      meetings: [DAY1.transition],   // 開場是昨天結束時那場公司早會
      hints,
      closeAt: DAY1.closeAt,
      home,
      // 隔天 06:00 才判（09:00 起算 21 小時；第二天對非 IT 的玩家太難，18:00 幾乎一定 bad end）
      badEnd: [{ at: 21 * 60, check: (e) => ['to_qc', 'archived'].includes(e.board.get('asset_platform').status) ? null : '06:00 了。下個月的盤點，阿賢還是一台一台對。' }],
      unlabeled: { note: '別一早就把 AI 額度用完。', devices: { phone: 40, tablet: 100 } },
    };
  }

  const day3stub = {
    name: '第三天：Speedrun', mode: 'speedrun', mainCard: null,
    cards: [], meetings: [transitionNext], hints: [], badEnd: [],
    unlabeled: { note: '昨天的便條還貼著。', devices: { phone: 30, tablet: 80 } },
  };

  const api = { make, day3stub, AI_CLAIM, AI_TOPICS, transitionNext };   // day3.js 用 transitionNext 當開場、AI_TOPICS 接筆記
  if (typeof module !== 'undefined') module.exports = api;
  else root.DAY2 = api;
})(typeof window !== 'undefined' ? window : globalThis);
