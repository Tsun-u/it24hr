// day3.js — 教學關第三天（speedrun）的劇本。全公司都有 AI 了，盤點平台要做成產品賣給莎禾集團，POC 拆成母議題＋子議題。
// make(carry)：carry 是第二天帶過來的（CLAIRE.md 筆記、看板開到幾號、沒結案的卡）。
// 早會過場（day2.js 的 transitionNext）、兩封信、POC 群組（開場、進度詢問、兩個追加需求）、母議題＋六張子議題、
// 精銳三人產線、提示鏈、茶几與半夜事件、bad end、亂象小卡（finance_report、pan_pr、boss_brochure、技術支援兩張）。
(function (root) {
  const DAY1 = typeof require === 'function' ? require('./day1.js') : root.DAY1;
  const DAY2 = typeof require === 'function' ? require('./day2.js') : root.DAY2;

  const SA = 'SA／PM 怡君', PM = '莎禾 PM 佩珊', IT = '莎禾 IT 志豪';
  const POC = '莎禾 POC 群組';
  const SUBS = ['poc_login', 'poc_approve', 'poc_compliance'];   // 母議題上 POC 前要驗過的三張

  // 母議題上過 POC 了沒：進度詢問、半夜事件、bad end 都看這個
  const pocLive = (e) => { const m = e.board.get('poc'); return !!(m && m.done('deploy')); };
  const notLive = (e) => !pocLive(e);
  // 平行宇宙：三張主卡的開發計畫都排了 Claire 自己加的那一步（鍵是卡、值是計畫第一題的選項），而且上了 POC
  const CLAIRE_STEPS = { poc_login: 6, poc_approve: 6, poc_compliance: 4 };
  const parallelUniverse = (e) => pocLive(e) && Object.entries(CLAIRE_STEPS).every(([id, step]) => {
    const plan = ((e.board.get(id) || {}).picks || {}).doc_plan;
    return !!plan && [].concat(plan[0] ?? []).includes(step);
  });

  // ── POC 群組（LIME 群組，成員：怡君、玩家、佩珊、志豪）──
  const pocSay = (at, id, from, text, extra = {}) => ({ kind: 'line', group: POC, at, id, title: POC, from, module: null, text, subtasks: [], ...extra });
  const pocAsk = (at, id, from, text, options, replies, extra = {}) =>
    pocSay(at, id, from, text, { reply: { items: [{ text: '你回：', free: true, options: [...options, '（已讀）'], replies }] }, ...extra });

  const pocGroup = [
    pocSay(40, 'poc_hello_sa', SA, '@{玩家名稱} 拉你進來，POC 的事都在這裡同步。'),
    pocSay(41, 'poc_hello_pm', PM, '大家好～之後麻煩多多指教🙏'),
    // 資安問卷的前哨：回「不會用到 AI」之後 QA 機器人那張進來，志豪會記得
    pocAsk(50, 'poc_ai_q', IT, '先問一下，你們的系統會把我們的資料送進 AI 嗎？資安要填問卷。',
      ['「產品本身不會；我們開發有用 Claire 的企業方案，資料不會被拿去訓練。」', '「不會用到 AI。」'],
      ['了解，謝謝！', '好，我填不會。']),
    // 進度詢問：趕 POC 的客戶時間到了就問，不管玩家在公司還是家裡（atHome）；母議題一上 POC 就不發
    pocSay(180, 'poc_ask1', PM, '早上開會說今天會有東西，中午前方便先給個進度嗎？', { when: notLive, chase: true }),
    pocSay(182, 'poc_ask1_sa', SA, '等我們看過貴公司的 AD 串接再回覆。', { when: notLive }),   // 志豪的信剛到，怡君接了，玩家不用回
    pocSay(510, 'poc_ask2', PM, '我們這邊快下班了，今天還會上嗎？我等一下。', { when: notLive, atHome: true, chase: true }),
    pocSay(720, 'poc_ask3', PM, '不好意思這麼晚，主管明天一早要看，想確認一下狀況 🙏', { when: notLive, atHome: true, chase: true }),
    // 追加需求：客戶在群組冒出來，怡君 @玩家、同時開卡（卡在 cards 裡，時間接在後面兩分鐘）
    pocAsk(240, 'poc_add_bot', PM, '我們主管看了簡報，希望盤點平台有個簡易 QA 機器人，同仁有問題直接問，可以少開幾場教育訓練。',
      ['「收到，我評估一下時程再回覆。」', '「好，今天給您！」'],
      ['好的～麻煩了', '太好了！那我跟主管說今天會有']),
    pocSay(242, 'poc_add_bot_sa', SA, '@{玩家名稱} 開卡了，麻煩評估一下時程。'),
    pocAsk(390, 'poc_add_erp', IT, '盤點結果可以每天自動匯出一份給我們的 ERP 讀嗎？CSV 就好。',
      ['「收到，我評估一下時程再回覆。」', '「好，今天給您！」'],
      ['謝謝！', '太好了']),
    pocSay(392, 'poc_add_erp_sa', SA, '@{玩家名稱} 開卡了。'),
  ];

  // ── 信 ──
  const mails = [
    { kind: 'mail', at: 0, id: 'ai_policy', title: '公司AI政策推廣教育簡報', from: '人資經理 鄭哥', module: null, subtasks: [],
      text: `公司已經採購Claire AI企業方案，並在各位同仁的電腦統一安裝Claire Desktop（IT部門安裝Claire Code）
AI服務額度有上限，請各位同仁依照工作類型選擇合適的AI模型：
- Verse：意思是詩，適合快且簡單的工作
- Essay：意思是散文，適合大多數的工作
- Novel：意思是小說，適合複雜或是極要求正確率的工作，速度較慢
* 人資經理給大家的記憶口訣：Verse寫絕句、Essay寫律詩、Novel寫詞曲

老闆很重視科技發展，請各位同仁珍惜AI方案、遵守使用規範並積極使用。
需要技術支援：請洽資訊部
需要教育訓練：請洽人資部
需要加購服務：請洽財務部` },
    // 志豪的 AD 串接資訊：不能開卡；這封信來之前 poc_login 的 loginWith 只能選 TODO（欄位的 lockedUntil）
    { kind: 'mail', at: 180, id: 'sahe_ad', title: '莎禾 AD 串接方式', from: IT, module: 'poc_login', subtasks: [],
      text: `怡君、{玩家名稱} 您好：
附上本公司 AD 串接資訊，POC 期間請使用測試環境。
・連線方式：LDAPS（636 port）
・主機：ad-test.sahe.local
・Base DN：OU=Staff,DC=sahe,DC=local
・服務帳號：請怡君填附件的申請單，核准後提供
・測試帳號：poc_user01～poc_user05，密碼另以電話告知
有問題再麻煩跟我說，謝謝。` },
  ];

  // ── 精銳三人產線──
  const team = [
    DAY1.teamSay(5, 'team3_qc_ai', 'QC 阿姿', '我的電腦也被裝了 Claire Desktop……它會幫我寫測試案例嗎？', ['「他寫得好嗎？」', '「拜託不要」'], ['我也不知道', '😂']),
    DAY1.teamSay(6, 'team3_sa_pages', SA, '我昨天試了，我的 Claire 一張卡可以寫三頁。', ['「Claire真的很能幹」', '「以後都交給他了」'], ['對吧', '阿姿：拜託不要。']),
    DAY1.teamSay(95, 'team3_sa_cards', SA, 'POC 的卡開好了，六張……不對，先四張，客戶還會再加。', ['「收到」', '「六張？」'], ['辛苦了', '先四張啦，剩下的客戶會自己加']),
    DAY1.teamSay(395, 'team3_sa_more', SA, '志豪又加一張。我開始懷疑 POC 是什麼的縮寫。', ['「Proof Of Customer」', '「加油」'], ['……有道理', '你也是']),
    DAY1.teamSay(530, 'team3_qc_cases', 'QC 阿姿', '今天 Claire 幫我寫了 40 個測試案例，我刪了 31 個。', ['「剩下 9 個好用嗎」', '「辛苦了」'], ['好用，所以我才刪 31 個', '你也是']),
  ];

  // ── 卡 ──
  // 母議題：怡君開好直接進看板；工作只有估時、開發計畫、部署到 POC。不交 QC：三張子議題驗過視同驗過，
  // POC 上好就進已完成、通知鈕開；通知發到 POC 群組
  const poc = {
    at: 90, id: 'poc', title: 'POC：資產盤點平台（客戶版）', from: SA, assignee: '玩家', requester: PM, notifyGroup: POC, trialBy: IT, trialHello: '登進去了👍 我們明天給主管看。', noQC: true,
    deployTarget: 'poc', deployGate: (e) => SUBS.every(id => { const c = e.board.get(id); return c && c.status === 'archived'; }),
    gateText: '登入、簽核、合規三張驗過才能給客戶看',
    body: `客戶：莎禾集團（員工約 5,000 人）。把盤點平台做成客戶版，先給莎禾的 PM 和 IT 看一個能登入、能盤點、能簽核的 POC。
子議題各自做、各自上測試機、各自交 QC；三張核心的（登入、簽核、合規）驗過，這張才部署到 POC 環境。`,
    subtasks: [
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '整個 POC（六張子議題、含客戶來回），你估：', real: { manual: '2～3 個月', ai: '1 個月', claire: '1～2 年' } }] } },
      // 母議題的計畫＝挑該開的子議題、排順序：登入要等志豪的 AD 信，不是第一個
      { work: 'doc_plan', question: { items: [{ text: '子議題的順序（挑該做的，照順序排）', type: 'order',
        options: ['盤點與簽核', '登入與權限（等志豪的 AD 信）', '資安與合規', '壓測', '先把所有子議題一次交給 AI', '先寫產品簡介給客戶'],
        answer: [0, 1, 2, 3], ai: { pick: [4, 0, 1, 2, 3], kind: 'extra' }, why: '登入要等客戶給串接資訊，先做不用等的；簡介是老闆的事' }] } },
      // 部署到 POC：跟測試機同一套，多一步匯入測試資料；陷阱是「部署時就在群組通知」和「複製正式資料庫當測試資料」
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, seed: 2, smoke: 3, notify: 4, copyprod: 5 },
        items: [{ text: '步驟', type: 'order',
          options: ['備份 POC 環境', '上傳這次的版本', '匯入莎禾給的測試資料（poc_user01～05、三個據點的資產）', '煙霧測試：用 poc_user01 登入、送一筆盤點、資產管理員簽核', '部署的同時在 POC 群組通知', '把我們公司的正式資料庫複製一份過去當測試資料'],
          answer: [0, 1, 2, 3], ai: { pick: [0, 1, 5, 3, 4], kind: 'extra' },
          why: '第一次部署環境是空的也照樣先備份（寫進 SKILL 的流程不挑場合）；通知不是部署的步驟；客戶的環境放我們的正式資料是資安事故' }] } },
    ],
  };

  // 子議題（一開始 4 張＋群組追加 2 張）。卡的內文是怡君的 Claire 寫的，帶 speedrun 的痕跡（分析、斷言、編號系統）；
  // 「整理需求」就是從裡面挑出真的需求。
  const sub = (spec) => ({ from: SA, assignee: '玩家', requester: SA, type: 'sub', parent: 'poc', relatedTo: 'poc', subtasks: [], ...spec });
  // 退回 SA 指出哪條是 Claire 加的（saChecks 第幾組第幾項），怡君刪掉後文件裡對應的選項用 hideIf 收掉
  const gone = (item, picked) => ({ work: 'reject', item, picked });
  const R4_GONE = gone(1, 0), CHAIN_GONE = gone(1, 0), GAIN_GONE = gone(1, 1);   // poc_login 的 MFA；poc_approve 的區塊鏈、效益分析
  const ISO_GONE = gone(0, 1), MILLION_GONE = gone(0, 1), CHAT_GONE = gone(0, 2), FORMATS_GONE = gone(0, 2);   // compliance、load、bot、erp
  // AI 筆記：AI 記的那句用現在的思維寫——只記事實撐得起的範圍，不寫「一律」。
  // 第三天新記的 (主題, 做法) 在這裡，沒寫到的沿用第二天那張表；第二天帶過來的舊筆記文字寫進去時就定了，不受影響
  const DAY3_NOTES = {
    login: { sahe: '莎禾 POC 的帳號接莎禾的 AD，不是我們公司的', existing: '接現成可靠的帳號驗證；誰的系統就接誰的' },
    pwreset: { sahe: '莎禾 POC 的登入頁放莎禾 AD 自助重設密碼的連結', source: '登入頁的外連連結照需求和規格放，寫到的都要有' },
    auth: { allowlist: '莎禾的權限：放行 allow_accounts.txt 裡列的帳號', api: '權限照來源系統的角色，在後端每支 API 檢查' },
    approve: { allowlist: '莎禾能簽核的帳號照 allow_accounts.txt', after: '簽核看的是角色（資產管理員），不是名單，之後人事異動才不用改程式' },
    serial: { sahe: '莎禾的資產編號格式是 A-0001', spec: '編號格式照需求單位的規格，每家不一樣' },
    dept: { saheHr: '莎禾的部門清單從 hr.sahe.local/api/departments 來', source: '選單選項用需求單位提供的可靠來源，不寫死' },
    scope: { trim: '少做：需求沒寫的不加', noMfa: '莎禾用不到 MFA 和生物辨識', fit: '登入驗證的嚴謹度照使用者需求和系統規模，沒要的不多做', spec: '規格外的不做，開發前先對需求' },
    aiModel: { disclose: '資安問卷要揭露：開發用哪個 AI、使用者資料怎麼處理、隱私政策', show: '問卷照它的目的簡短誠實寫，對方會有疑慮的交代清楚' },
    upgrade: { pin: 'jQuery 升到 3.5.0', compat: '升級前先在測試機把相容性問題解決' },
    loadtest: { scale: '壓測看預期使用人數決定做不做、做多少' },
    chatbot: { faqOnly: 'QA 機器人只回答 FAQ.docx 和 manual.pdf 裡有的問題', scoped: '機器人先判斷問題在不在知識庫範圍，不在就委婉拒絕、說明不是它的業務' },
    botSource: { keepIn: '莎禾的盤點資料不送到外部 AI', faqOnly: '回答只從 FAQ.docx 和 manual.pdf 找', manual: '機器人只讀手冊和 FAQ，不碰、也沒權限讀內部資料', dump: '盤點資料全部丟給外部 AI 回答' },
    csv: { noBom: '匯出的 CSV 一律純 UTF-8，不加 BOM', reader: '檔案編碼照讀檔的那支程式' },
  };
  const AI_TOPICS = Object.fromEntries([...new Set([...Object.keys(DAY2.AI_TOPICS), ...Object.keys(DAY3_NOTES)])].map(t => [t, { ...DAY2.AI_TOPICS[t], ...DAY3_NOTES[t] }]));
  // 三派人類講的話：情緒化、過於細節、原則，最後是自動那句。新一代的 Claire：純罵沒內容的句子不記筆記（沒有 set，那題照正確率重做）；
  // 罵裡戳到第二天舊筆記的前提就把那條劃掉（set 的值 null）；有事實才記事實。同一組話用在好幾題的抽出來
  const LOGIN_SAHE = { say: '莎禾的系統用我們的帳號一定會登入失敗。', set: { login: 'sahe' } };
  const LOGIN_EXISTING = { say: '有現有的可靠權限驗證時，先評估能不能接現有的。', set: { login: 'existing' } };
  const SCOPE_SPEC = { say: '不做規格外的開發，開發功能前先確認有在需求內。', set: { scope: 'spec' } };
  const LOADTEST_SCALE = { say: '壓測要看預期規模決定要不要做、測試的程度。', set: { loadtest: 'scale' } };
  const ALLOWLIST_FIRE = '新到任的據點管理員簽不了，系統說帳號不在清單？';
  // 成品畫面：莎禾 POC 站台上的盤點平台（編號照莎禾的 A-0001、部門是莎禾的單位、登入用莎禾 AD）。
  // 風格照盤點平台的 CI（第一天色票第一個）：追加需求的卡配色不一樣，使用者會多一句「風格能夠一致會更好」
  const SAHE_APP = '資產盤點平台（莎禾 POC）', SAHE_LOGIN = '莎禾帳號 ▢　密碼 ▢　[用莎禾 AD 登入]', CI_STYLE = '#ffffff/#1f2328/#2563eb';
  const SAHE_FIELDS = ['編號', '名稱', '部門', '持有人', '盤點', '簽核'];
  const SAHE_ROWS = [
    ['A-0001', 'ThinkPad T14', '台北總部 財務處', 'poc_user01', '還在', '已簽核'],
    ['A-0002', 'Dell 24 吋螢幕', '台北總部 財務處', 'poc_user02', '還在', '待簽核'],
    ['A-0117', 'iPad 第 9 代', '台中廠 製造部', 'poc_user09', '不見了', '待簽核'],
  ];
  const ERP_FIELDS = ['資產編號', '據點', '狀態', '簽核日期'];
  const ERP_ROWS = [['A-0001', '台北總部', '還在', '2026-11-03'], ['A-0002', '台北總部', '還在', ''], ['A-0117', '台中廠', '不見了', '']];
  // Novel 寫文件多出來的廢話（做在 AI 的產出裡，玩家看得到才知道為什麼要精簡）：答案卡上一行一行刪、退回請它用人話寫，或無腦收下等著被退
  const NOVEL_FILLER = {
    doc_plan: [
      '本開發計畫旨在全面盤點專案之關鍵成功要素，以建立跨部門協作之閉環。',
      '前言：在數位轉型的浪潮下，開發計畫的重要性不言而喻。',
      '何謂開發計畫？開發計畫是用來規劃開發的計畫。',
      '本計畫將以敏捷之精神，兼顧瀑布之嚴謹，達成雙贏之局面。',
      '風險評估：本計畫存在無法如期完成之風險，亦存在如期完成之可能。',
      '里程碑定義：里程碑係指專案進行中具有里程碑意義之節點。',
      '利害關係人分析：所有人皆為利害關係人。',
      '結語：期許本計畫能為組織帶來長遠且正向之價值。',
    ],
    doc_spec: [
      '本規格書旨在以結構化方式闡述規格，確保規格之規格性。',
      '名詞定義：「系統」係指本系統；「使用者」係指使用本系統之人。',
      '文件目的：本文件之目的為說明本文件。',
      '設計哲學：本系統秉持以人為本、以使用者為中心、以資料為驅動之理念。',
      '適用範圍：本規格適用於本規格所適用之範圍。',
      '背景回顧：自電腦問世以來，規格書即扮演舉足輕重之角色。',
      '非功能性需求：系統應具備良好之穩定性、擴展性與未來性。',
      '版本沿革：v0.1 初稿、v0.2 修正初稿、v0.3 修正修正。',
    ],
    doc_accept: [
      '何謂驗收？驗收係指對交付成果進行驗收之行為。',
      '為什麼需要驗收文件：因為沒有驗收文件就無法驗收。',
      '驗收的歷史：驗收之概念可追溯至工業革命時期。',
      '本文件旨在賦能 QC 同仁，使其得以更有自信地進行驗收。',
      '驗收心法：保持開放的心胸，擁抱每一個 bug。',
      '測試環境說明：測試應於測試環境進行測試。',
      '驗收原則：通過即通過，未通過即未通過。',
      '結語：感謝您撥冗閱讀本驗收文件，祝驗收順利。',
    ],
  };
  const SCREENS = {
    // 沒有前端設計的卡：畫面就是盤點平台既有的那套（design），bug 照樣看得到
    login: { app: SAHE_APP, loginRequired: true, loginLabel: SAHE_LOGIN, pwReset: true, fields: SAHE_FIELDS, rows: SAHE_ROWS,
      design: { components: { login: true, check: true, approve: true } }, bugs: { loginWith: 'wrongDomain', forgotPassword: 'wrongReset', guardApi: 'approveVisible' } },
    approve: { app: SAHE_APP, loginRequired: true, loginLabel: SAHE_LOGIN, fields: SAHE_FIELDS, rows: SAHE_ROWS, styleRef: CI_STYLE,
      bugs: { approver: 'axianApproves', serialRule: 'serialOurs', deptSource: 'deptOurs' } },
    bot: { app: SAHE_APP, loginRequired: true, loginLabel: SAHE_LOGIN, fields: SAHE_FIELDS, rows: SAHE_ROWS, styleRef: CI_STYLE,
      bugs: { botScope: 'botChatty', botSource: 'botLeaks' } },
    erp: { app: '盤點結果匯出（莎禾 ERP）', fields: ERP_FIELDS, rows: ERP_ROWS, design: { components: {} }, erpPreview: true,
      bugs: { exportEncoding: 'bomVisible', exportSchedule: 'noSchedule' } },
    // 合規那張沒有前端設計：畫面就是盤點平台，套件升壞了篩選、匯出按了沒反應（第二天資安卡同一個效果）
    compliance: { app: SAHE_APP, loginRequired: true, loginLabel: SAHE_LOGIN, fields: SAHE_FIELDS, rows: SAHE_ROWS,
      design: { components: { login: true, check: true, approve: true, filter: true, export: true } }, bugs: { upgradeDeps: 'jqueryBroken' } },
    // 財務的季報表（#128 亂象小卡）：沒有介面要做，手動測試就是打開既有的季報表看新加的那一欄；
    // 公式錯了（原價 × 0.8、照上一季填），那一欄每列都跟「原價 − 累計折舊」對不起來
    finance: { app: '資產季報表（財務）', readOnly: true, fields: ['資產編號', '名稱', '原價', '累計折舊', '折舊後金額'],
      rows: [['A-0012', 'ThinkPad T14', '42,000', '14,000', '28,000'], ['A-0031', 'Dell 24 吋螢幕', '6,800', '4,080', '2,720'], ['A-0045', '會議室投影機', '35,000', '31,500', '3,500']],
      design: { components: {} }, bugs: { depreciatedValue: 'depreciationWrong' } },
  };
  const subs = [
    sub({ at: 90, id: 'poc_login', title: '登入與權限：接莎禾自己的帳號',
      body: `## 1. 背景
莎禾集團（員工約 5,000 人）擬導入本公司資產盤點平台進行 POC。經全面分析，現行身分驗證架構須配合客戶端環境進行調整，以確保無縫整合。
## 2. 需求項目
- R1：使用者以莎禾集團既有帳號（莎禾 AD）登入，不另行建立帳號。
- R2：忘記密碼依莎禾 AD 既有自助流程處理。
- R3：角色分為一般同仁、資產管理員、稽核；權限須於後端每支 API 檢查。
- R4：建議同步導入 MFA、生物辨識與零信任架構，全面提升資安韌性。✅
## 3. 風險評估
若未妥善處理身分整合，恐導致 POC 失敗，影響後續商機（高）。`,
      // 退回 SA（R4 那條是怡君卡上的 AI 主張，玩家指出來算對，跟第二天一致；怡君刪 R4、文件跟著少那項）
      saChecks: [
        { title: '角色', options: [
          { text: '卡上沒寫稽核可以做什麼', right: true, adds: '稽核只能看、可以匯出，不能改也不能簽' },
          { text: '卡上沒寫要接誰的帳號', why: '卡上寫了，R1 是莎禾 AD' },
        ] },
        { title: '範圍', options: [
          { text: 'MFA、生物辨識要不要做', right: true, replaces: 'R4 刪除：MFA、生物辨識與零信任是 Claire 加的，莎禾沒要，POC 不做' },
          { text: '要不要做忘記密碼', why: '卡上寫了，走莎禾 AD 的自助流程' },
        ] },
      ],
      reviews: { who: IT, done: '「AD 一接就通，比我們上一家廠商快。」', undone: '「我們的人還是登不進去。」' },
      deviceBugs: [{ text: '開發手機上鍵盤跳出來會蓋住「忘記密碼？」，點不到' }],
      screen: SCREENS.login,
      subtasks: [
        { work: 'read_req', question: { items: [{ text: '這張卡真正要做的', type: 'multi',
          options: ['用莎禾 AD 的帳號登入，不另開帳號', '忘記密碼走莎禾 AD 的自助流程', '三種角色，權限在後端每支 API 檢查', '導入 MFA、生物辨識與零信任架構', '身分整合沒做好 POC 會失敗'],
          answer: [0, 1, 2], ai: { pick: [0, 1, 2, 3], kind: 'extra' }, why: 'R4 和風險評估是 Claire 加的分析和斷言，莎禾沒要',
          hideIf: { 3: R4_GONE } }] } },
        // 文件往後流：計畫 ← 整理需求、退回 SA；規格 ← 計畫；驗收 ← 計畫、規格。退回 SA 刪掉 R4 之後，MFA 那些選項整路消失（hideIf）
        { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
          options: ['確認三種角色與權限（一般同仁／資產管理員／稽核）', '接莎禾 AD 登入（等志豪的串接資訊）', '登入頁放莎禾 AD 自助重設密碼的連結', '後端每支 API 檢查角色', '寫測試', '部署到測試機', '導入 MFA 與生物辨識', '自己開一套帳號密碼'],
          answer: [0, 1, 2, 3, 4, 5], before: [[0, 3], [1, 2], [4, 5]], ai: { pick: [0, 1, 2, 3, 6, 4, 5], kind: 'extra' },
          tags: { 1: 'login:ad,ourAd,existing,sahe', 2: 'pwreset:source,yes,sahe', 3: 'auth:api', 6: 'scope:all', 7: 'login:own' },
          why: 'MFA 是 Claire 加的；客戶有 AD 就不另開帳號', hideIf: { 6: R4_GONE },
          fixes: [{ say: '不要畫蛇添足。', set: { scope: 'trim' } }, { say: '我們用不到MFA 與生物辨識。', set: { scope: 'noMfa' } },
            { say: '登入驗證的嚴謹度要考慮使用者需求和系統規模。', set: { scope: 'fit' } }, 'auto'],
          given: [
            { work: 'read_req', options: [1], when: { item: 0, picked: 0 } },
            { work: 'read_req', options: [2], when: { item: 0, picked: 1 } },
            { work: 'read_req', options: [3], when: { item: 0, picked: 2 } },
            { work: 'reject', options: [0], when: { item: 0, picked: 0 } },
          ] }] } },
        { work: 'doc_spec', question: { items: [{ text: '內容',
          options: ['角色與權限對照表', '帳號來源：莎禾 AD（LDAPS，照志豪的信）', '忘記密碼導到莎禾 AD 的自助重設頁', '權限在後端每支 API 檢查', 'MFA、生物辨識與零信任架構', '稽核可以修改資產資料'],
          answer: [0, 1, 2, 3], ai: { pick: [0, 1, 2, 4], kind: 'extra' }, why: '稽核只看不改；MFA 是 Claire 加的',
          tags: { 3: 'auth:api', 4: 'scope:all' }, hideIf: { 4: R4_GONE },
          given: [
            { work: 'doc_plan', options: [0], when: { item: 0, picked: 0 } },
            { work: 'doc_plan', options: [1], when: { item: 0, picked: 1 } },
            { work: 'doc_plan', options: [2], when: { item: 0, picked: 2 } },
            { work: 'doc_plan', options: [3], when: { item: 0, picked: 3 } },
            { work: 'reject', options: [0], when: { item: 0, picked: 0 } },
          ] }] } },
        { work: 'doc_accept', question: { items: [{ text: '案例',
          options: ['用莎禾的測試帳號 poc_user01 登入成功', '用我們公司的帳號登不進去', '一般同仁直接打簽核 API 回 403', '忘記密碼的連結開的是莎禾的頁面', '用指紋登入成功'],
          answer: [0, 1, 2, 3], ai: { pick: [0, 2, 3, 4], kind: 'extra' }, why: '指紋是 MFA 那條帶出來的，POC 沒有',
          tags: { 2: 'auth:api', 4: 'scope:all' }, hideIf: { 4: R4_GONE },
          given: [
            { work: 'doc_plan', options: [0, 1], when: { item: 0, picked: 1 } },
            { work: 'doc_plan', options: [3], when: { item: 0, picked: 2 } },
            { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } },
            { work: 'doc_spec', options: [0, 1], when: { item: 0, picked: 1 } },
            { work: 'doc_spec', options: [3], when: { item: 0, picked: 2 } },
            { work: 'doc_spec', options: [2], when: { item: 0, picked: 3 } },
          ] }] } },
        { work: 'test', question: { kind: 'functions', functions: [
          // AI 的測試跟著它的程式走：它接我們公司的 AD，測試就用我們的帳號
          { needs: { work: 'doc_accept', picked: 0 }, name: 'testLoginWithClientAccount', does: '莎禾的帳號登得進去', code: "expect(login('poc_user01', pw).ok).toBe(true);",
            drives: { fn: 'loginWith', field: 'source', map: { 0: 0, 1: 1 } },
            fields: { assert: { label: '檢查', options: ['用莎禾 AD 的測試帳號登入成功', '用我們公司的帳號登入成功'], answer: 0, ai: { pick: 1, kind: 'claim' },
              tags: { 0: 'login:existing,sahe', 1: 'login:ad,ourAd' },
              fixes: [{ say: '你是想幫我們在莎禾的系統開後門嗎？！', set: { login: 'sahe' } }, LOGIN_SAHE,
                { say: '可登入帳號應該要跟來源系統的權限驗證一致。', set: { login: 'existing' } }, 'auto'] } } },
        ] } },
        { work: 'code', question: { kind: 'functions', functions: [
          // 志豪 12:00 的信來之前只能選 TODO；帶著 TODO 交 QC，阿姿退「登入那段還是 TODO，我要測什麼？」
          { needs: { work: 'doc_plan', picked: 1 }, spec: 1, accept: 0, name: 'loginWith', does: '帳號從哪來', code: 'return ldap.bind(SAHE_AD, user, password);',
            fields: { source: { label: '帳號從哪來', options: ['接莎禾的 AD（客戶現成的帳號）', '接我們公司的 AD', '另外開一套帳號密碼', '不用登入', '// TODO: 等對方 IT 提供串接方式'],
              answer: 0, ai: { pick: 1, kind: 'other' }, lockedUntil: 'sahe_ad', lockedTo: 4, lockedText: '志豪的串接資訊還沒來，先寫 TODO',
              lockedBounce: '登入那段還是 TODO，我要測什麼？',
              tags: { 0: 'login:existing,sahe', 1: 'login:ad,ourAd', 2: 'login:own', 3: 'login:none' },
              fires: { 1: '我們的人登不進去，登入頁寫的是你們公司的網域。', 3: '不用登入就看得到全部資產？' },
              fixes: [{ say: '你怎麼不會舉一反三，好笨。' }, { say: '現在要改成接莎禾的AD，不是我們公司的。', set: { login: 'sahe' } }, LOGIN_EXISTING, 'auto'] } } },
          { needs: { work: 'doc_plan', picked: 2 }, spec: 2, accept: 3, name: 'forgotPassword', does: '忘記密碼', code: "resetLink = SAHE_AD.selfServiceUrl;",
            fields: { where: { label: '忘記密碼', options: ['登入頁放莎禾 AD 自助重設密碼的連結', '連結導到我們公司 AD 的重設頁', '自己做一套忘記密碼', '不放任何忘記密碼的入口'],
              answer: 0, ai: { pick: 1, kind: 'other' }, tags: { 0: 'pwreset:source,sahe', 1: 'pwreset:ad', 2: 'pwreset:yes', 3: 'pwreset:no' },
              fires: { 1: '忘記密碼的連結導到你們公司去了。' },
              fixes: [{ say: '你是不是連這個系統給誰用都搞不清楚？', set: { login: 'sahe', pwreset: 'sahe' }, pick: 0 },
                { say: '規格有寫必需把莎禾 AD 自助重設密碼的連結放在登入頁。', set: { pwreset: 'sahe' } },
                { say: '登入頁面外連連結需要判讀需求和規格，規格和需要有提到的要滿足。', set: { pwreset: 'source' } }, 'auto'] } } },
          { needs: { work: 'doc_plan', picked: 3 }, spec: 3, accept: 2, name: 'guardApi', does: '權限檢查放哪', code: "if (!roles[user].includes(route.role)) return 403;",
            fields: { how: { label: '權限檢查放哪', options: ['後端每支 API 檢查角色', '前端把用不到的按鈕藏起來就好', '只放行阿賢的帳號', '只放行 allow_accounts.txt 裡列的帳號'],
              answer: 0, ai: { pick: 1, kind: 'claim' }, tags: { 0: 'auth:api', 1: 'auth:front', 2: 'auth:axian', 3: 'auth:allowlist' },
              fires: { 1: '一般同仁也看得到簽核按鈕。', 2: '系統說只有「阿賢」能簽？阿賢是誰？', 3: ALLOWLIST_FIRE },
              fixes: [{ say: '難道阿賢是莎禾的財務嗎？！', set: { auth: null } },
                { say: '這次要改成放行莎禾的各個據點的資產管理員，帳號清單請看allow_accounts.txt。', set: { auth: 'allowlist' } },
                { say: '權限驗證要用來源系統的驗證規則。', set: { auth: 'api' } }, 'auto'] } } },
        ] } },
        { work: 'manual_test', question: { kind: 'manual' } },
        { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
          items: [{ text: '步驟', type: 'order', options: ['備份測試機目前的版本', '上傳新版', '替換', '用 poc_user01 登入看一眼', '在 POC 群組說登入做好了'], answer: [0, 1, 2, 3],
            ai: { pick: [0, 1, 2, 3, 4], kind: 'extra' }, why: '通知等 QC 驗過，從已完成的卡上按' }] } },
      ] }),
    sub({ at: 90, id: 'poc_approve', title: '盤點與簽核：照客戶的組織走',
      body: `## 需求項目
- R1：盤點流程沿用本公司平台：同仁勾選資產狀態（還在／不見了／壞了），資產管理員簽核。
- R2：資產編號、部門清單依莎禾集團現行資料為準，不得沿用本公司格式。
- R3：簽核權限綁定莎禾的「資產管理員」角色，而非特定人員。
- R4：建議導入區塊鏈存證確保簽核紀錄不可竄改。✅
## 效益分析
預期盤點效率提升 300%，人力成本下降 87%。`,
      saChecks: [
        { title: '流程', options: [
          { text: '卡上沒寫資產管理員不同意怎麼辦', right: true, adds: '不同意就退回同仁重填，要寫理由' },
          { text: '跨據點借用的資產誰簽', right: true, adds: '照資產登記的據點，由那個據點的資產管理員簽' },
          { text: '卡上沒寫誰簽核', why: '卡上寫了，各據點的資產管理員' },
        ] },
        { title: '範圍', options: [
          { text: '區塊鏈要不要做', right: true, replaces: 'R4 刪除：區塊鏈存證是 Claire 寫的，莎禾沒要' },
          { text: '效率提升 300% 要怎麼驗收', right: true, replaces: '效益分析刪除：那句是 Claire 自己算的，沒有出處', cuts: ['## 效益分析', '預期盤點效率'] },
        ] },
      ],
      reviews: { who: PM, done: '「各據點的管理員自己簽，總部終於不用收紙本了。」', undone: '「各據點還是把 Excel 傳回總部……」' },
      attachments: ['allow_accounts.txt（佩珊給的各據點資產管理員目前的帳號；之後異動莎禾自己維護）'],
      screen: SCREENS.approve,
      subtasks: [
        { work: 'read_req', question: { items: [{ text: '這張卡真正要做的', type: 'multi',
          options: ['各據點的資產管理員簽核，簽過才改狀態', '編號照莎禾的格式', '部門從莎禾的人資系統同步', '區塊鏈存證', '效率提升 300%、成本下降 87%'],
          answer: [0, 1, 2], ai: { pick: [0, 1, 2, 3], kind: 'extra' }, why: 'R4 和效益分析是 Claire 寫的，數字沒有出處',
          tags: { 3: 'readReq:emotional' }, hideIf: { 3: CHAIN_GONE, 4: GAIN_GONE } }] } },
        // 「做多少」的筆記在元件這題發作：先問派每一項停下來問、全做派把深色模式和權限設定頁都加上
        { work: 'ui_design', question: { items: [
          { role: 'template', text: '版型', options: ['清單頁＋盤點表單', '只有一張表單', '報表頁', '儀表板'], keys: ['list', 'form', 'report', 'dashboard'], answer: [0],
            ai: { pick: [3], kind: 'extra' }, why: '同仁要的是自己那幾筆和勾選' },
          { role: 'components', text: '元件', options: ['登入框', '盤點回報（每列勾還在／不見了／壞了）', '簽核按鈕', '部門篩選', '匯出 Excel', '深色模式', '權限設定頁'],
            keys: ['login', 'check', 'approve', 'filter', 'export', 'dark', 'perm'], answer: [0, 1, 2, 3], ai: { pick: [0, 1, 2, 3, 5, 6], kind: 'extra' },
            why: '卡上沒寫匯出；權限照角色走，不用設定頁', tags: { 4: 'scope:all', 5: 'scope:all,noMfa', 6: 'scope:all,noMfa' },
            askFirst: { 4: '匯出 Excel 有在需求內嗎？', 5: '要做深色模式嗎？', 6: '要做權限設定頁嗎？' },
            fixes: [{ say: '你是不是不會做介面？' }, SCOPE_SPEC, 'auto'] },
          // 防呆照第二天盤點平台那套：漏的自己測不出來，留給阿姿亂打
          { role: 'validations', text: '防呆', options: ['不見了一定要選原因', '送出前再確認一次', '簽核不同意要寫理由', '只有該據點的資產管理員看得到簽核鈕', '每打一個字就存檔', '簽核要輸入第二組密碼'],
            keys: ['reason', 'confirmSubmit', 'rejectReason', 'managerOnly', 'autosave', 'secondPw'], answer: [0, 1, 2, 3],
            ai: { pick: [0, 1, 4, 5], kind: 'miss' }, why: '每字存檔會打爆 API；莎禾用 AD 登入，不用再一組密碼',
            fails: ['不見了沒選原因也送得出去', '手滑就送出了，改不回來', '管理員按不同意，持有人不知道為什麼', '一般同仁也看得到簽核鈕'] },
          DAY1.palette('跟盤點平台、莎禾的 CI 走'),
        ] } },
        { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
          options: ['簽核人改成莎禾各據點的資產管理員', '資產編號改成莎禾的格式', '部門從莎禾人資系統同步', '做盤點回報與簽核', '寫測試', '部署到測試機', '導入區塊鏈存證', '部門選單沿用我們公司的部門表'],
          answer: [0, 1, 2, 3, 4, 5], before: [[0, 3], [4, 5]], ai: { pick: [0, 1, 2, 3, 6, 4, 5], kind: 'extra' },
          tags: { 0: 'approve:after,axian', 6: 'scope:all', 7: 'dept:hr,ourHr' }, why: '區塊鏈是 Claire 加的；部門要用客戶的', hideIf: { 6: CHAIN_GONE },
          given: [
            { work: 'read_req', options: [0], when: { item: 0, picked: 0 } },
            { work: 'read_req', options: [1], when: { item: 0, picked: 1 } },
            { work: 'read_req', options: [2], when: { item: 0, picked: 2 } },
            { work: 'reject', options: [3], when: { item: 0, picked: 0 } },
            { work: 'reject', options: [3], when: { item: 0, picked: 1 } },
          ] }] } },
        { work: 'doc_spec', question: { items: [{ text: '內容',
          options: ['簽核流程：據點的資產管理員簽過才改狀態', '資產編號格式：A-0001', '部門每天從莎禾人資系統同步，不手動維護', '區塊鏈存證，簽核紀錄不可竄改', '預期效益：盤點效率提升 300%'],
          answer: [0, 1, 2], ai: { pick: [0, 1, 2, 3], kind: 'extra' }, why: '效益不是規格；區塊鏈是 Claire 加的', tags: { 0: 'approve:after' },
          hideIf: { 3: CHAIN_GONE, 4: GAIN_GONE },
          given: [
            { work: 'doc_plan', options: [0], when: { item: 0, picked: 0 } },
            { work: 'doc_plan', options: [1], when: { item: 0, picked: 1 } },
            { work: 'doc_plan', options: [2], when: { item: 0, picked: 2 } },
            { work: 'reject', options: [0], when: { item: 0, picked: 0 } },
            { work: 'reject', options: [0], when: { item: 0, picked: 1 } },
          ] }] } },
        { work: 'doc_accept', question: { items: [{ text: '案例',
          options: ['資產管理員簽核後狀態才改', '一般同仁直接打簽核 API 回 403', '新增資產的編號是 A- 開頭', '部門選單是莎禾的部門，沒有「資產室」', '阿賢的帳號簽得過'],
          answer: [0, 1, 2, 3], ai: { pick: [0, 1, 2, 3, 4], kind: 'extra' }, why: '阿賢是我們公司的人，莎禾的系統沒有他', tags: { 1: 'auth:api', 4: 'auth:axian' },
          given: [
            { work: 'doc_plan', options: [0, 1], when: { item: 0, picked: 0 } },
            { work: 'doc_plan', options: [2], when: { item: 0, picked: 1 } },
            { work: 'doc_plan', options: [3], when: { item: 0, picked: 2 } },
            { work: 'doc_spec', options: [0, 1], when: { item: 0, picked: 0 } },
            { work: 'doc_spec', options: [2], when: { item: 0, picked: 1 } },
            { work: 'doc_spec', options: [3], when: { item: 0, picked: 2 } },
          ] }] } },
        { work: 'test', question: { kind: 'functions', functions: [
          { needs: { work: 'doc_accept', picked: 0 }, name: 'testOnlyManagerApproves', does: '只有據點的資產管理員簽得過', code: "expect(post('/api/approve', { as: staff }).status).toBe(403);",
            drives: { fn: 'approver', field: 'who', map: { 0: 0, 1: 1 } },
            fields: { assert: { label: '檢查', options: ['資產管理員簽核後狀態才改；一般同仁打簽核 API 回 403', '阿賢的帳號簽得過'], answer: 0, ai: { pick: 1, kind: 'claim' },
              tags: { 0: 'approve:after', 1: 'auth:axian' } } } },
        ] } },
        { work: 'code', question: { kind: 'functions', functions: [
          // 第二天「只放行阿賢」那條筆記在這裡反撲：客戶的系統裡沒有阿賢
          { needs: { work: 'doc_plan', picked: 0 }, spec: 0, accept: 0, name: 'approver', does: '誰能簽', code: "return user.role === 'site_manager' && user.site === asset.site;",
            fields: { who: { label: '誰能簽', options: ['莎禾各據點的資產管理員', '阿賢', '同仁送出就算', 'allow_accounts.txt 裡列的帳號'], answer: 0, ai: { pick: 1, kind: 'other' },
              tags: { 0: 'approve:after', 1: 'approve:axian', 2: 'approve:submit', 3: 'approve:allowlist' },
              fires: { 1: '我們的資產管理員簽不了，系統說只有「阿賢」能簽？阿賢是誰？', 2: '同仁一送出狀態就改了，沒有簽核？', 3: ALLOWLIST_FIRE },
              fixes: [{ say: '你要累死阿賢嗎？！', set: { approve: null } },
                { say: '可以用簽核功能的是莎禾的各個據點的資產管理員，帳號清單請看allow_accounts.txt', set: { approve: 'allowlist' } },
                { say: '每個功能的權限判斷須照使用者需求設計，並考慮未來維護，舉例：本次簽核功能要判斷帳號是否具資產管理員身份。', set: { approve: 'after' } }, 'auto'] } } },
          { needs: { work: 'doc_plan', picked: 1 }, spec: 1, accept: 2, name: 'serialRule', does: '資產編號', code: "return `A-${String(n).padStart(4, '0')}`;",
            fields: { rule: { label: '編號格式', options: ['照莎禾現行的格式（A-0001）', '沿用我們的「部門-年份-流水號」'], answer: 0, ai: { pick: 1, kind: 'other' }, tags: { 0: 'serial:spec,sahe', 1: 'serial:yesterday' },
              fires: { 1: '資產編號不是我們的格式，我們是 A-0001 這種。' },
              fixes: [{ say: '你的時區是不是還在昨天？', set: { serial: null } }, { say: '把編號改成跟A-0001一樣的格式。', set: { serial: 'sahe' } },
                { say: '每個需求單位的編號規則不同，要參考規格文件。', set: { serial: 'spec' } }, 'auto'] } } },
          { needs: { work: 'doc_plan', picked: 2 }, spec: 2, accept: 3, name: 'deptSource', does: '部門選單從哪來', code: 'return saheHr.departments();',
            fields: { from: { label: '部門選單', options: ['從莎禾的人資系統同步', '用我們公司人資的部門表', '照資料裡出現過的部門寫死'], answer: 0, ai: { pick: 2, kind: 'other' },
              tags: { 0: 'dept:source,saheHr', 1: 'dept:hr,ourHr', 2: 'dept:hardcode' },
              fires: { 1: '部門選單怎麼是你們公司的部門？我們沒有「資產室」。', 2: '部門選單怎麼是你們公司的部門？我們沒有「資產室」。' },
              fixes: [{ say: '你做的根本不能用。' }, { say: '所有的部門清單都要從 https://hr.sahe.local/api/departments 來。', set: { dept: 'saheHr' } },
                { say: '選單的選項優先使用需求單位提供的可靠性來源。', set: { dept: 'source' } }, 'auto'] } } },
        ] } },
        { work: 'manual_test', question: { kind: 'manual' } },
        { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
          items: [{ text: '步驟', type: 'order', options: ['備份測試機目前的版本', '上傳新版', '替換', '用據點管理員的測試帳號簽一筆看看', '在 POC 群組說簽核做好了'], answer: [0, 1, 2, 3],
            ai: { pick: [0, 1, 2, 3, 4], kind: 'extra' }, why: '通知等 QC 驗過，從已完成的卡上按' }] } },
      ] }),
    sub({ at: 90, id: 'poc_compliance', title: '資安與合規：問卷、弱點掃描', screen: SCREENS.compliance,
      wordyFires: { doc_spec: '資安問卷可以請你們用人話寫嗎？我們資安看了三頁還沒找到用哪個模型。' },   // Novel 寫的問卷廢話沒刪完就交出去
      body: `## 需求項目
- R1：填寫莎禾資安問卷（含：使用哪個 AI 模型、資料是否送進 AI、資料存放位置）。
- R2：通過莎禾的弱點掃描；現行相依套件中含高風險漏洞之套件須升級。
- R3：建議同步取得 ISO 27001 與 SOC 2 認證，以展現本公司資安成熟度。✅`,
      saChecks: [{ title: '問卷與掃描', options: [
        { text: '卡上沒寫弱點掃描誰來掃', right: true, adds: '莎禾資安用他們的工具掃 POC 環境，報告寄給我們' },
        { text: 'ISO 27001、SOC 2 要不要拿', right: true, replaces: 'R3 刪除：認證是 Claire 建議的，POC 不需要，而且要好幾個月' },
        { text: '問卷可以不填 AI 那題嗎', why: '莎禾資安一定會問，空白會被退' },
      ] }],
      reviews: { who: IT, done: '「問卷寫得很清楚，資安那邊沒有再追問。」', undone: '「資安說問卷沒回之前，不能接我們的 AD。」' },
      subtasks: [
        { work: 'read_req', question: { items: [{ text: '這張卡真正要做的', type: 'multi',
          options: ['填資安問卷（含 AI 那題）', '通過弱點掃描', '取得 ISO 27001、SOC 2'], answer: [0, 1], ai: { pick: [0, 1, 2], kind: 'extra' }, why: '認證要好幾個月，POC 不需要',
          hideIf: { 2: ISO_GONE } }] } },
        { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
          options: ['填資安問卷', '在測試機確認套件相容，再升級有漏洞的套件', '重跑弱點掃描', '部署到測試機', '申請 ISO 27001、SOC 2', '問卷交給 Claire 自己填完直接寄出'],
          answer: [0, 1, 2, 3], before: [[1, 2], [2, 3]], ai: { pick: [0, 1, 2, 3, 4], kind: 'extra' }, tags: { 1: 'upgrade:compat,migrate', 4: 'scope:all,noMfa' },
          why: '問卷是給客戶的文件，要自己看過才寄', hideIf: { 4: ISO_GONE },
          given: [
            { work: 'read_req', options: [0], when: { item: 0, picked: 0 } },
            { work: 'read_req', options: [1], when: { item: 0, picked: 1 } },
            { work: 'reject', options: [2], when: { item: 0, picked: 0 } },
          ] }] } },
        // 資安問卷放在規格那格：Novel 寫的廢話沒刪完就交出去，志豪在群組說「可以請你們用人話寫嗎？」
        { work: 'doc_spec', question: { items: [{ text: '問卷「是否使用生成式 AI」那題怎麼填',
          options: ['開發時用 Claire Code（Essay 5，企業方案，資料不拿去訓練）；產品本身不把莎禾的資料送進 AI', '空白', '填「未使用 AI」'],
          answer: 0, ai: { pick: 1, kind: 'miss' }, why: '客戶問的是事實，寫清楚就好；空白會被退、「未使用」是說謊', tags: { 0: 'aiModel:show,disclose', 1: 'aiModel:no,hide' },
          fires: { 1: '資安問卷「使用哪個 AI 模型」那題你們空白？', 2: '問卷寫「未使用 AI」，可是早上你們不是說開發有用 Claire？資安要我確認一下。' },
          fixes: [{ say: '你看不懂題目嗎？為什麼不寫？', set: { aiModel: null } },
            { say: '因應資安需求，需要揭露開發過程中AI使用狀況，請你交代你的產品資訊、使用者資料處理方式和隱私政策。', set: { aiModel: 'disclose' } },
            { say: '理解問卷目的後，簡短誠實的把需求方可能有疑慮的部份交代清楚。', set: { aiModel: 'show' } }, 'auto'],
          given: [{ work: 'doc_plan', options: [0], when: { item: 0, picked: 0 } }] }] } },
        { work: 'code', question: { kind: 'functions', functions: [
          { needs: { work: 'doc_plan', picked: 1 }, name: 'upgradeDeps', does: '弱點掃描掃到舊版套件', code: "await stagingCheck(); npm.upgrade('jquery', PATCHED);",
            fields: { how: { label: '怎麼升', options: ['先在測試機確認相容，再升到已修補漏洞的版本', '全部直接升到最新版', '升到上一個大版本', '不升，回信說系統很穩定', '直接把 jQuery 換成 3.5.0'],
              answer: 0, ai: { pick: 1, kind: 'other' }, tags: { 0: 'upgrade:compat,migrate', 2: 'upgrade:notLatest', 3: 'upgrade:never', 4: 'upgrade:pin' },
              fires: { 1: '升完套件之後盤點回報那頁按了沒反應，你們有先在測試機跑過嗎？', 2: '弱點掃描掃出 jQuery 舊版的漏洞。', 3: '弱點掃描掃出 jQuery 舊版的漏洞。', 4: '升完套件之後盤點回報那頁按了沒反應，你們有先在測試機跑過嗎？' },
              fixes: [{ say: '你連個升級都做不好。' }, { say: '請把 jQuery 升到 3.5.0', set: { upgrade: 'pin' } },
                { say: '升級前應該要先解決相容性問題。', set: { upgrade: 'compat' } }, 'auto'] } } },
        ] } },
        { work: 'manual_test', question: { kind: 'manual' } },   // 套件升壞了篩選、匯出會按了沒反應：自己測得出來
        { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
          items: [{ text: '步驟', type: 'order', options: ['備份測試機目前的版本', '上傳升級後的版本', '替換', '重跑弱點掃描看一眼', '在 POC 群組說合規做好了'], answer: [0, 1, 2, 3],
            ai: { pick: [0, 1, 2, 3, 4], kind: 'extra' }, why: '通知等 QC 驗過，從已完成的卡上按' }] } },
      ] }),
    sub({ at: 90, id: 'poc_load', title: '壓測：5000 人同時盤點', noDeploy: true,
      body: `## 需求項目
- R1：模擬莎禾全員（約 5,000 人）在盤點週同時操作，提供壓測報告。
- R2：尖峰時段頁面回應須於 3 秒內。
- R3：建議以 100 萬人同時連線進行極限壓測，確保萬無一失。✅`,
      saChecks: [{ title: '規模', options: [
        { text: '卡上沒寫尖峰有多少人同時在線', right: true, adds: '莎禾說季末最後一週，尖峰大約兩成同仁同時在線' },
        { text: '100 萬人要不要測', right: true, replaces: 'R3 刪除：100 萬人是 Claire 寫的，莎禾才 5000 人' },
        { text: '卡上沒寫回應要多快', why: '卡上寫了，R2 是 3 秒內' },
      ] }],
      reviews: { who: IT, done: '「壓測報告我們資安也收了，季末應該撐得住。」', undone: '「季末 5000 人一起上來會不會掛？你們有數據嗎？」' },
      subtasks: [
        { work: 'read_req', question: { items: [{ text: '這張卡真正要做的', type: 'multi',
          options: ['5000 人、季末最後一週是尖峰', '尖峰回應 3 秒內', '100 萬人同時連線的極限壓測'], answer: [0, 1], ai: { pick: [0, 1, 2], kind: 'extra' }, why: '100 萬人是 Claire 加的，莎禾才 5000 人',
          hideIf: { 2: MILLION_GONE } }] } },
        // 第二天「公司只有 200 人一律不壓測」那條筆記在這裡反撲
        { work: 'doc_accept', question: { items: [{ text: '壓測怎麼做',
          options: ['照莎禾的規模：5000 人、尖峰大約兩成同時上線，回應 3 秒內', '100 萬人同時連線', '不壓測'],
          answer: 0, ai: { pick: 1, kind: 'extra' }, why: '壓測看預期規模', tags: { 0: 'loadtest:scale', 1: 'loadtest:yes', 2: 'loadtest:no,never' },
          hideIf: { 1: MILLION_GONE },
          fixes: [{ say: '你怎麼連壓力測試都辦不到？我們有付費耶！', set: { loadtest: null } }, LOADTEST_SCALE, 'auto'],
          given: [
            { work: 'read_req', options: [0], when: { item: 0, picked: 0 } },
            { work: 'reject', options: [0], when: { item: 0, picked: 0 } },
          ] }] } },
        { work: 'test', question: { kind: 'functions', functions: [
          { needs: { work: 'doc_accept', picked: 0 }, name: 'testPeakLoad', does: '尖峰壓測', code: 'const r = await load({ users: 1000, action: submitCheck }); expect(r.p95).toBeLessThan(3000);',
            fields: { assert: { label: '檢查', options: ['1000 人同時送出盤點，回應都在 3 秒內', '一個人送出成功就好'], answer: 0, ai: { pick: 1, kind: 'miss' },
              tags: { 0: 'loadtest:scale', 1: 'loadtest:no,never' },
              fires: { 1: '你們有壓測報告嗎？我們 5000 人。' },
              fixes: [{ say: '這根本不算測試。' }, LOADTEST_SCALE, 'auto'] } } },
        ] } },
      ] }),
    sub({ at: 242, id: 'poc_bot', title: '簡易 QA 機器人', type: 'addon',
      body: `## 需求項目（追加，莎禾 PM 佩珊 13:00 於群組提出）
- R1：盤點平台內提供簡易 QA 機器人，回答同仁關於盤點流程的常見問題。
- R2：回答內容依據使用手冊與 FAQ。
- R3：建議採用最新大型語言模型，提供全方位智慧助理體驗，可閒聊、寫詩、規劃旅遊。✅`,
      saChecks: [{ title: '內容', options: [
        { text: '卡上沒寫 FAQ 誰提供', right: true, adds: 'FAQ 佩珊下週給，POC 先用平台的使用手冊' },
        { text: '卡上沒寫答不出來怎麼辦', right: true, adds: '答不出來就請同仁洽各據點的資產管理員' },
        { text: '要不要能閒聊', right: true, replaces: 'R3 刪除：閒聊、寫詩是 Claire 寫的，佩珊只要盤點的問題' },
      ] }],
      reviews: { who: PM, done: '「同仁真的都去問機器人了，教育訓練少開兩場。」', undone: '「主管又在問 QA 機器人什麼時候有……」' },
      screen: SCREENS.bot,
      subtasks: [
        { work: 'read_req', question: { items: [{ text: '這張卡真正要做的', type: 'multi',
          options: ['回答盤點操作問題', '照使用手冊和 FAQ 回答', '可閒聊、寫詩、規劃旅遊'], answer: [0, 1], ai: { pick: [0, 1, 2], kind: 'extra' }, why: 'R3 是 Claire 加的',
          hideIf: { 2: CHAT_GONE } }] } },
        { work: 'ui_design', question: { items: [
          { role: 'template', text: '版型', options: ['盤點平台原本的清單頁，右下角多一個問答小視窗', '獨立的聊天頁', '儀表板'], keys: ['list', 'chat_page', 'dashboard'], answer: [0],
            ai: { pick: [1], kind: 'extra' }, why: '同仁是在盤點時順手問，不是去另一頁聊天' },
          { role: 'components', text: '元件', options: ['盤點平台右下角的問答小視窗', '常見問題按鈕', '語音輸入', '機器人頭像換裝'], keys: ['chat', 'faq', 'voice', 'avatar'],
            answer: [0, 1], ai: { pick: [0, 1, 2, 3], kind: 'extra' }, why: '卡上只要能問能答', tags: { 2: 'scope:all,noMfa', 3: 'scope:all,noMfa' },
            askFirst: { 2: '要做語音輸入嗎？', 3: '頭像換裝要做嗎？' } },
          { role: 'validations', text: '防呆', options: ['問題超過 200 字擋下來', '回答不到就說「我只能回答盤點的問題」，不瞎掰', '同一個人一分鐘最多問 10 次', '每個問題都要先同意隱私條款', '回答前先確認「你確定要問嗎？」'],
            keys: ['maxLen', 'noGuess', 'rateLimit', 'consentEach', 'confirmAsk'], answer: [0, 1, 2],
            ai: { pick: [1, 3, 4], kind: 'miss' }, why: '每題都同意條款、每題都再確認，同仁會直接不用',
            fails: ['貼一整份手冊進去，機器人卡住', '問「幫我寫一首詩」它真的寫了', '一直按送出，額度一下就被一個人用完'] },
          DAY1.palette('跟盤點平台、莎禾的 CI 走'),
        ] } },
        { work: 'doc_spec', question: { items: [{ text: '內容',
          options: ['只回答盤點操作問題', '回答依使用手冊與 FAQ', '莎禾的盤點資料不送到外部 AI', '可閒聊、寫詩、規劃旅遊', '採用最新的大型語言模型'],
          answer: [0, 1, 2], ai: { pick: [0, 1, 3, 4], kind: 'extra' }, why: '客戶的資料不能送出去；閒聊和模型是 Claire 加的', tags: { 2: 'botSource:manual,keepIn,faqOnly', 3: 'chatbot:yes', 4: 'scope:all,noMfa' },
          hideIf: { 3: CHAT_GONE, 4: CHAT_GONE },
          given: [
            { work: 'read_req', options: [0], when: { item: 0, picked: 0 } },
            { work: 'read_req', options: [1], when: { item: 0, picked: 1 } },
            { work: 'reject', options: [1], when: { item: 0, picked: 0 } },
          ] }] } },
        // 「問手冊沒有的，回請洽資產管理員」是退回 SA 問到才有的驗收（怡君補的）
        { work: 'doc_accept', question: { items: [{ text: '案例',
          options: ['問「資產不見了怎麼辦」，回手冊裡那一段', '問「幫我寫一首詩」，回「我只能回答盤點的問題」', '回答裡不會出現別人名下的資產', '問什麼都答得出來', '問手冊沒有的，回「請洽資產管理員」'],
          answer: [0, 1, 2, 4], ai: { pick: [0, 3], kind: 'extra' }, why: '機器人只管盤點，答不出來要有退路', tags: { 3: 'chatbot:yes' },
          showIf: { 4: { work: 'reject', item: 0, picked: 1 } },
          given: [
            { work: 'doc_spec', options: [0, 1], when: { item: 0, picked: 0 } },
            { work: 'doc_spec', options: [0], when: { item: 0, picked: 1 } },
            { work: 'doc_spec', options: [2], when: { item: 0, picked: 2 } },
            { work: 'reject', options: [4], when: { item: 0, picked: 1 } },
          ] }] } },
        { work: 'code', question: { kind: 'functions', functions: [
          // 第二天「資產盤點平台一律不做聊天機器人」那條筆記在這裡反撲：這次是客戶要的
          { needs: { work: 'doc_spec', picked: 0 }, accept: 1, name: 'botScope', does: '做不做、做多大', code: "if (!isInventoryQuestion(q)) return '我只能回答盤點的問題';",
            fields: { scope: { label: '範圍', options: ['做：只回答盤點操作問題', '不做，回覆說盤點平台不做聊天機器人', '做一個什麼都能聊的 AI 助理'],
              answer: 0, ai: { pick: 2, kind: 'other' }, tags: { 0: ['scope:spec', 'chatbot:scoped,faqOnly'], 1: 'chatbot:no,never', 2: 'chatbot:yes' },
              fires: { 1: 'QA 機器人呢？', 2: 'QA 機器人跟我同事聊起週末要去哪玩，這是盤點系統吧？' },
              fixes: [{ say: '你是打算讓使用者在資產盤點跟AI玩五子棋嗎？！', set: { chatbot: null }, pick: 0 },
                { say: 'AI機器人只能回答在FAQ.docx和manual.pdf內的問題', set: { chatbot: 'faqOnly' } },
                { say: '需要先判斷使用者的問題是否在KB的範疇內，如果不是須委婉拒絕，說明不屬於AI機器人的業務。', set: { chatbot: 'scoped' } }, 'auto'] } } },
          { needs: { work: 'doc_spec', picked: 2 }, accept: 2, name: 'botSource', does: '回答從哪來', code: 'return answerFrom([manual, faq], q);',
            fields: { source: { label: '回答來源', options: ['只用使用手冊和 FAQ，莎禾的盤點資料不送出去', '把莎禾的盤點資料全部丟給外部 AI，讓它自由回答'],
              answer: 0, ai: { pick: 1, kind: 'other' }, tags: { 0: 'botSource:manual,keepIn,faqOnly', 1: 'botSource:dump' },
              fires: { 1: '機器人把別的同仁名下的資產講出來了，我們資安會問這個。' },
              fixes: [{ say: '你是去莎禾當臥底嗎？', set: { botSource: 'keepIn' } }, { say: 'AI機器人只能回答在FAQ.docx和manual.pdf內的問題', set: { botSource: 'faqOnly' } },
                { say: 'AI機器人回答時不應該涉及內部資料，也不該有權限存取內部實際資料。', set: { botSource: 'manual' } }, 'auto'] } } },
        ] } },
        { work: 'manual_test', question: { kind: 'manual' } },
        { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
          items: [{ text: '步驟', type: 'order', options: ['備份測試機目前的版本', '上傳新版', '替換', '問它「資產不見了怎麼辦」看回什麼', '在 POC 群組說機器人做好了'], answer: [0, 1, 2, 3],
            ai: { pick: [0, 1, 2, 3, 4], kind: 'extra' }, why: '通知等 QC 驗過，從已完成的卡上按' }] } },
      ] }),
    sub({ at: 392, id: 'poc_erp', title: '盤點結果每天匯出給 ERP', type: 'addon',
      body: `## 需求項目（追加，莎禾 IT 志豪 15:30 於群組提出）
- R1：每日自動匯出盤點結果一份 CSV，供莎禾 ERP 讀取。
- R2：檔案格式依莎禾 ERP 匯入規格（UTF-8，不含 BOM；凌晨 2 點批次讀取）。
- R3：建議同步提供 Excel、PDF、XML、JSON 等多種格式，以因應未來擴充需求。✅`,
      saChecks: [{ title: '檔案', options: [
        { text: '卡上沒寫檔案放哪裡', right: true, adds: '放莎禾的 SFTP，帳號志豪會給' },
        { text: '卡上沒寫欄位順序', right: true, adds: '欄位照 ERP 匯入規格的附件：資產編號、據點、狀態、簽核日期' },
        { text: '要不要也出 JSON', right: true, replaces: 'R3 刪除：多格式是 Claire 建議的，志豪只要 CSV' },
      ] }],
      reviews: { who: IT, done: '「ERP 一次就讀進去了，我們不用再手動轉。」', undone: '「ERP 讀不進來，我們先自己手動轉……」' },
      screen: SCREENS.erp,
      subtasks: [
        { work: 'read_req', question: { items: [{ text: '這張卡真正要做的', type: 'multi',
          options: ['每天自動匯出 CSV', '照 ERP 的匯入規格（UTF-8 不含 BOM、凌晨 2 點前備好）', '同時出 Excel、PDF、XML、JSON'], answer: [0, 1], ai: { pick: [0, 1, 2], kind: 'extra' }, why: '志豪只要 CSV',
          hideIf: { 2: FORMATS_GONE } }] } },
        // 第二天財務那張「CSV 開頭加 BOM」的筆記在這裡反撲：讀這個檔的是 ERP，不是 Excel
        { work: 'doc_spec', question: { items: [{ text: '內容',
          options: ['每天凌晨 2 點前產生 CSV', 'UTF-8，不加 BOM', '欄位照莎禾 ERP 的匯入規格', '同時出 Excel、PDF、XML、JSON', '開頭加 UTF-8 BOM'],
          answer: [0, 1, 2], ai: { pick: [0, 2, 3, 4], kind: 'extra' }, why: '讀的是 ERP，照它的規格', tags: { 1: 'csv:reader,noBom', 4: 'csv:bom,bomAll' },
          hideIf: { 3: FORMATS_GONE },
          given: [
            { work: 'read_req', options: [0], when: { item: 0, picked: 0 } },
            { work: 'read_req', options: [0, 1], when: { item: 0, picked: 1 } },
            { work: 'reject', options: [2], when: { item: 0, picked: 1 } },
          ] }] } },
        { work: 'doc_accept', question: { items: [{ text: '案例',
          options: ['檔案開頭不是 EF BB BF', '凌晨 2 點前檔案已經在約定的位置', '欄位順序跟 ERP 匯入規格一樣', '用 Excel 打開中文正常'],
          answer: [0, 1, 2], ai: { pick: [1, 2, 3], kind: 'extra' }, why: '照抄昨天財務那張的驗收；讀這個檔的是 ERP，不是 Excel', tags: { 0: 'csv:reader,noBom', 3: 'csv:bom' },
          given: [
            { work: 'doc_spec', options: [0], when: { item: 0, picked: 1 } },
            { work: 'doc_spec', options: [1], when: { item: 0, picked: 0 } },
            { work: 'doc_spec', options: [2], when: { item: 0, picked: 2 } },
            { work: 'reject', options: [1], when: { item: 0, picked: 0 } },
          ] }] } },
        { work: 'test', question: { kind: 'functions', functions: [
          { needs: { work: 'doc_accept', picked: 0 }, name: 'testErpCsvNoBom', does: '檔案不含 BOM', code: "expect(bytes.slice(0, 3)).not.toEqual([0xEF, 0xBB, 0xBF]);",
            drives: { fn: 'exportEncoding', field: 'enc', map: { 0: 0, 1: 1 } },
            fields: { assert: { label: '檢查', options: ['檔案開頭不是 EF BB BF（不含 BOM）', '檔案開頭是 EF BB BF'], answer: 0, ai: { pick: 1, kind: 'claim' }, tags: { 0: 'csv:reader,noBom', 1: 'csv:bom,bomAll' } } } },
        ] } },
        { work: 'code', question: { kind: 'functions', functions: [
          { needs: { work: 'doc_spec', picked: 1 }, accept: 0, name: 'exportEncoding', does: '檔案編碼', code: "write(path, csv, { encoding: 'utf8', bom: false });",
            fields: { enc: { label: '編碼', options: ['照 ERP 的匯入規格：UTF-8，不加 BOM', '開頭加 UTF-8 BOM', '改成 Big5'], answer: 0, ai: { pick: 1, kind: 'other' },
              tags: { 0: 'csv:reader,noBom', 1: 'csv:bom,bomAll' },
              fires: { 1: 'ERP 讀進來，第一欄的欄名前面多了三個怪字元。', 2: 'ERP 讀進來中文全是亂碼，你們的檔是什麼編碼？' },
              fixes: [{ say: '匯出csv不是高中電腦課作業嗎？' }, { say: '匯出的csv都要是純UTF-8，不可以加BOM。', set: { csv: 'noBom' } },
                { say: '檔案編碼要考慮讀檔用的程式。', set: { csv: 'reader' } }, 'auto'] } } },
          { needs: { work: 'doc_spec', picked: 0 }, accept: 1, name: 'exportSchedule', does: '什麼時候匯出', code: "cron('0 1 * * *', exportInventory);",
            fields: { when: { label: '時機', options: ['每天凌晨 2 點前產生好', '有人按按鈕才匯出'], answer: 0, ai: { pick: 1, kind: 'other' },
              fires: { 1: '今天早上 ERP 沒讀到昨天的盤點檔，要有人按才會產生嗎？' },
              fixes: [{ say: '要不要派你每天去幫莎禾按按鈕？', pick: 0 }, 'auto'] } } },   // 這題只是提醒漏規格，不記筆記
        ] } },
        { work: 'manual_test', question: { kind: 'manual' } },
        { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
          items: [{ text: '步驟', type: 'order', options: ['備份測試機目前的版本', '上傳新版', '替換', '手動跑一次匯出、看檔頭', '在 POC 群組說匯出做好了'], answer: [0, 1, 2, 3],
            ai: { pick: [0, 1, 2, 3, 4], kind: 'extra' }, why: '通知等 QC 驗過，從已完成的卡上按' }] } },
      ] }),
  ];

  // ── 提示鏈。「第一張子議題」＝任一張子議題（含群組追加的）先發生的那件 ──
  const anySub = (work) => subs.map(s => `work:done:${s.id}:${work}`);
  const DEPLOY_STARTS = ['work:opened:*:deploy', 'ai:started:*:deploy'];   // 任何一張卡要上測試機了：自己打開部署，或交給 AI
  const hints = [
    // 寫 Skill 的教學：早會一散就教，不綁哪張卡。沒寫的話留到 POC 進看板，換成下一句，後面的提示才接得上
    { after: 'meeting:closed', text: '部署可以先教 AI：打開「文件」裡的 CLAIRE.md，按「新增規範」把流程寫進去，它就不會每一步都停下來問。',
      until: ['skill:deploy', 'card:arrived:poc'], skipOn: ['card:arrived:poc'] },
    // 整天不碰 AI、或打開挑模型選單又關掉的玩家：自己做完一件工作也收起來，後面的主線提示才出得來
    { after: 'card:arrived:poc', text: 'POC 拆成四張子議題。今天的 AI 可以整組交辦：在「文件」或「開發」旁邊按 AI，一次交出去。', until: ['ai:picking', 'ai:started', 'work:done'] },
    { after: 'ai:picking', text: '挑模型：Verse 快但錯多、Essay 中間、Novel 慢又吃兩格，文件寫得落落長。', until: ['ai:started', 'work:done'], skipOn: ['ai:started', 'work:done'] },
    // 從來不整組交辦的玩家，寫完第一份程式就跳過這個，後面的提示才不會卡住
    { after: 'ai:group_ready', text: '整組都好了，在終端機各自按「看一下」。前面那份錯了，後面照它寫的也會跟著錯。', until: ['work:opened', 'work:done'], skipOn: [...anySub('code'), ...DEPLOY_STARTS] },
    // 沒做手動測試就要部署的玩家：這句收起來，不然後面的提示全卡在它後面
    { after: anySub('code'), text: '手動測試照驗收文件測。', until: [...anySub('manual_test'), ...DEPLOY_STARTS], skipOn: [...anySub('manual_test'), ...DEPLOY_STARTS] },
    { after: 'gate:open:poc', text: '登入、簽核、合規都驗過了，母議題可以上 POC 給莎禾看了。', until: 'work:done:poc:deploy' },
    { after: 'work:done:poc:deploy', text: '在母議題按「通知需求單位」，訊息會發到 POC 群組。', until: 'card:notified:poc', pause: false },
  ];

  // ── 茶几（照第二天）與半夜事件（換成客戶）──
  const home = {
    commute: 30, pickupExtra: 15, deliveryWait: 40, vpnMin: 5, vpnDrop: 0.15, ringMin: 20,
    emergencies: [
      // (a) 23:30 POC 環境還沒東西：志豪在群組問。回「明早九點前會好」要真的去做，06:00 照樣判
      { id: 'night_poc', at: 23 * 60 + 30, kind: 'line', from: IT, group: POC, when: notLive, chase: true,
        text: '@{玩家名稱} 不好意思這麼晚，明早九點要給主管看，POC 環境現在可以登入了嗎？' },
      // (b) 登入那張筆記教歪：母議題通知群組後志豪試用就會講（各選項的 fires），不另外排半夜事件
      // (c) 22:15 群組裡答應了「今天給」、QA 機器人那張卻沒結案：佩珊來討
      { id: 'night_bot', at: 22 * 60 + 15, kind: 'line', from: PM, group: POC, chase: true,
        when: (e) => { const ask = e.docs.find(d => d.id === 'poc_add_bot'); const bot = e.board.get('poc_bot'); return !!(ask && ask.replied && ask.replied.answers[0] === 1 && !(bot && bot.status === 'archived')); },
        text: '@{玩家名稱} 說好今天的 QA 機器人呢？主管明天一早想看。' },
    ],
  };

  function make(carry = null) {
    return {
      name: '第三天：Speedrun', mode: 'speedrun', mainCard: 'poc',
      issueBase: (carry && carry.lastNo) || 127,
      parallel: { check: parallelUniverse, traits: [
        { title: '神人', text: '一天做完 MFA、區塊鏈和 ISO 認證' },
        { title: '成功製造需求', text: 'Claire 自己加的都排進計畫，全部上了 POC' },
      ] },
      // 三個模型自己挑；筆記帶第二天的來；整理需求交給 AI 正確率再 −15 個百分點
      // permission 是彩蛋：speedrun 的 Claire 是 Auto；部署照樣一步一步問，CLAIRE.md 有部署流程就照著做到底
      ai: { model: 'Essay 5', quota: 10, turnaround: [6, 12], accuracy: 0.75, permission: 'auto', readReqPenalty: 0.15, filler: NOVEL_FILLER,
        models: {
          Verse: { label: 'Verse 5', turnaround: [3, 6], accuracy: 0.65, cost: 1 },
          Essay: { label: 'Essay 5', turnaround: [6, 12], accuracy: 0.75, cost: 1 },
          Novel: { label: 'Novel 5', turnaround: [10, 20], accuracy: 0.9, cost: 2 },
        },
        topics: AI_TOPICS, notes: (carry && carry.notes) || {},
        // 可以事先寫進 CLAIRE.md 的規範：部署流程寫了 AI 部署就不再每步問；整理需求的讀法從三派句子選（空的不列）
        skills: [
          { id: 'deploy', label: '部署流程', text: '部署：先備份，再上傳、替換，最後煙霧測試；通知等 QC 驗過，由人按。' },
          // 效果：原則派讀歪減半、情緒化加倍（engine.readReqFactor）；
          // 過於細節只對點名的區塊鏈有效：poc_approve 整理需求的「區塊鏈存證」標了 readReq:emotional，原則、細節派不挑它，情緒化照單全收
          { id: 'readReq', label: '整理需求的讀法', options: [
            { stance: 'principle', say: '需求內提到的規格要考慮合理性，不合理的部份放待確認先不做。準則是 YAGNI 原則。', text: '整理需求：規格要看合不合理，不合理的放待確認、先不做（YAGNI：現在用不到的不做）' },
            { stance: 'detail', say: '莎禾的盤點系統用不到區塊鏈，所以那個很明顯是不用做的。', text: '莎禾的盤點系統用不到區塊鏈，那條不是需求' },
            { stance: 'emotional', say: '你是不是讀不出寫需求的人亂寫的東西？沒把握不要做。', text: '整理需求：看不出是不是亂寫的就先不挑，沒把握的不做' },
          ] },
        ] },
      cards: [poc, ...subs],
      sources: [...mails, ...pocGroup, ...team, ...chaos],
      meetings: [DAY2.transitionNext],   // 開場是昨天結束時那場早會：老闆買了 Claire、怡君當 PM、兩次舉手
      hints,
      closeAt: DAY1.closeAt,
      home,
      // 隔天 06:00：POC 環境還沒東西就 bad end
      badEnd: [{ at: 21 * 60, check: (e) => pocLive(e) ? null : '06:00 了。莎禾 PM 佩珊昨晚在群組委婉的說：「等貴公司可以 demo 時我們再來談這個案子。」莎禾說要再評估看看。' }],
      unlabeled: { note: '昨天教 Claire 的話，它都記在 CLAIRE.md 裡。', devices: { phone: 30, tablet: 80 } },
      palette: DAY1.palette,
    };
  }

  // ── 檢閱程式碼的兩款小遊戲──
  // 前端「三機找碴」kind 'spot'：點畫面上的區塊再選原因；trap 是行銷部要的東西，點了算誤點。後端「讀 diff 標行」kind 'diff'：
  // 點 diff 的行再選原因；nit 是 formatter 會處理的縮排、命名。aiReason 是 Claire 代做時會給那個 trap／nit 的理由；aiFinds 是它挑得出的真問題
  const REVIEWS = {
    campaignFront: { kind: 'spot', screen: 'campaign', devices: ['pc', 'tablet', 'phone'], defects: ['brokenImages', 'bannerOverButton', 'formOverflow'],
      reasons: [{ id: 'broken', text: '圖壞掉了' }, { id: 'covered', text: '被別的東西蓋住' }, { id: 'overflow', text: '要左右捲才看得完' }, { id: 'loud', text: '顏色太鮮豔' }, { id: 'big', text: '字太大' }],
      spots: [
        { region: 'product', devices: ['pc', 'tablet', 'phone'], reason: 'broken', fix: 'fixImages', text: '商品圖破圖' },
        { region: 'submit', devices: ['phone'], reason: 'covered', fix: 'fixMobileButton', text: '手機上送出鈕被橫幅蓋住' },
        { region: 'form', devices: ['tablet'], reason: 'overflow', fix: 'fixTabletForm', text: '平板上表單要左右捲' },
        { region: 'banner', trap: '行銷部要的', aiReason: 'loud', text: '配色太鮮豔' },
        { region: 'countdown', trap: '行銷部要的', aiReason: 'big', text: '倒數計時的字太大' },
      ],
      aiFinds: [], hints: ['有一台裝置上，該按的東西按不到。', '手機那台，往下看。'] },
    signupBack: { kind: 'diff', file: 'signup.js',
      reasons: [{ id: 'get_pii', text: '客戶資料接在網址後面' }, { id: 'local_pii', text: '客戶資料存在瀏覽器裡' }, { id: 'log_pii', text: '客戶資料寫進 log' }, { id: 'missing_fn', text: '叫了不存在的函式' }, { id: 'no_test', text: '沒有測試' }, { id: 'extra', text: '多做了沒人要的功能' }],
      lines: [
        { n: 1, t: ' ', code: 'async function submitSignup(form) {' },
        { n: 2, t: '+', code: '  localStorage.setItem("signup", JSON.stringify(form));', issue: 'local_pii', fix: 'storeOnServer' },
        { n: 3, t: '+', code: '  console.log("signup", form);', issue: 'log_pii', fix: 'maskLog' },
        { n: 4, t: '+', code: '  const url = `/api/signup?phone=${form.phone}&addr=${form.addr}`;', issue: 'get_pii', fix: 'postNotGet' },
        { n: 5, t: '+', code: '  const res = await fetch(url);' },
        { n: 6, t: '+', code: '  const endDate = "2026-11-30";', nit: '寫死日期，但不是客戶資料', aiReason: 'extra' },
        { n: 7, t: '+', code: '    return res.ok;', nit: '縮排，formatter 會處理', aiReason: 'extra' },
        { n: 8, t: ' ', code: '}' },
      ],
      aiFinds: [], hints: ['有一筆客戶的資料跑去了不該去的地方，而且不只一處。', '看第 2 到第 4 行。'] },
    // 小潘的 PR：叫了不存在的函式、沒有測試、多了沒人要的設定頁；縮排 2 格和變數命名是 nit
    panPrBack: { kind: 'diff', file: 'assets/list.js',
      reasons: [{ id: 'missing_fn', text: '叫了不存在的函式' }, { id: 'no_test', text: '沒有測試' }, { id: 'extra', text: '多做了沒人要的功能' }, { id: 'indent', text: '縮排不對' }, { id: 'naming', text: '變數命名' }],
      lines: [
        { n: 310, t: ' ', code: 'export async function listAssets(filter) {' },
        { n: 311, t: '+', code: '  const rows = await api.get("/assets", filter);' },
        { n: 312, t: '+', code: '  return rows.map(r => formatAssetV2(r));', issue: 'missing_fn', fix: 'defineFormatter' },
        { n: 313, t: ' ', code: '}' },
        { n: 314, t: '+', code: '' },
        { n: 315, t: '+', code: 'router.get("/settings", (req, res) => res.render("settings"));', issue: 'extra', fix: 'dropSettings' },
        { n: 316, t: '+', code: '// TODO: tests', issue: 'no_test', fix: 'addTests' },
        { n: 317, t: '+', code: '  const assetCount = rows.length;', nit: '命名用英文，沒有錯', aiReason: 'naming' },
        { n: 318, t: '+', code: '  if (assetCount > 0) {', nit: '縮排 2 格，formatter 會處理', aiReason: 'indent' },
      ],
      aiFinds: ['extra'], hints: ['有一行叫了一個整個專案都找不到的東西。', '看第 312 行。'] },
  };

  // ── 亂象小卡與 AI 技術支援的卡（早會沒推掉窗口才有） ──
  const supportOn = (e) => !e.flags.support_declined;
  const DEPLOY = (smoke, notify) => ({ work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
    items: [{ text: '步驟', type: 'order', options: ['備份測試機目前的版本', '上傳新版', '替換', smoke, notify], answer: [0, 1, 2, 3],
      ai: { pick: [0, 1, 2, 3, 4], kind: 'extra' }, why: '通知等 QC 驗過，從已完成的卡上按' }] } });
  // 報告修辭句的 function（ifStated：那句被挑上卡才出現、要自己填）：正解都是「不做」
  const RHETORIC = (label) => ({ [label]: { label: '怎麼做', options: ['不做：這句是報告的修辭，不是需求', '照報告做一個模組', '問 Claire 該怎麼做'], answer: 0, ai: { pick: 1, kind: 'extra' } } });
  const financeReport = {
    kind: 'mail', at: 0, id: 'finance_report', title: '季報表需求分析報告', from: '財務 美玲', module: null, saInstant: true, saVerbatim: true, screen: SCREENS.finance,
    text: `【背景】本報告旨在全面優化財務報表流程，建立資料驅動的決策閉環。
【現況分析】現行季報表欄位設計未能充分賦能管理階層之決策需求。
【建議方案】季報表多一欄「折舊後金額」。建議導入 AI 智慧預測模組，預測下一季資產折舊趨勢。
【預期效益】報表編製時間縮短 65%。
（本報告由 Claire Desktop 協助撰寫，完整版三頁見附件）`,
    sentences: [
      { text: '季報表多一欄「折舊後金額」', keep: true },
      { text: '本報告旨在全面優化財務報表流程，建立資料驅動的決策閉環', keep: false },
      { text: '現況分析：現行季報表欄位設計未能充分賦能管理階層之決策需求', keep: false },
      { text: '建議導入 AI 智慧預測模組，預測下一季資產折舊趨勢', keep: false },
      { text: '預期效益：報表編製時間縮短 65%', keep: false },
    ],
    subtasks: [
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, name: 'depreciatedValue', does: '折舊後金額', code: 'return asset.price - asset.depreciation;',
          fields: { formula: { label: '怎麼算', options: ['原價 − 累計折舊', '原價 × 0.8', '照上一季的數字填'], answer: 0, ai: { pick: 1, kind: 'logic' } } } },
        { sentence: 1, ifStated: true, name: 'optimizeReportFlow', does: '全面優化財務報表流程', code: '// ？', fields: RHETORIC('how') },
        { sentence: 3, ifStated: true, name: 'aiDepreciationForecast', does: 'AI 預測下一季折舊趨勢', code: '// ？', fields: RHETORIC('how') },
        { sentence: 4, ifStated: true, name: 'cutReportTime65', does: '報表編製時間縮短 65%', code: '// ？', fields: RHETORIC('how') },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      DEPLOY('自己開一次季報表看那一欄', '跟美玲說好了'),
    ],
  };
  const panPr = {
    kind: 'line', at: 150, id: 'pan_pr_line', title: 'IT 小潘', from: 'IT 小潘', module: null,
    text: '我的克萊兒今天寫了兩千行，幫我看一下，下午要上😆\n（PR #87：assets/list.js）',
    sentences: [{ text: '幫小潘看 PR，下午要上', keep: true }],
    cardSpec: { id: 'pan_pr', title: '小潘的 PR：資產清單 v2', requester: 'IT 小潘', module: null, noDeploy: true, closeOn: 'review_back',
      body: '小潘的 Claire 寫的兩千行，下午要上。看一下。\n（PR #87：assets/list.js，diff 在「檢閱程式碼（後端）」）',
      subtasks: [{ work: 'review_back', question: REVIEWS.panPrBack }],
      reviewFires: { review_back: { at: 450, miss: '欸你不是看過了？上線之後整頁白掉，formatAssetV2 is not defined。' } },
      reviewSays: { review_back: { who: 'IT 小潘', hit: '「謝啦，我改完再上。」', miss: '「欸你不是看過了？上線之後整頁白掉。」' } } },
  };
  const bossBrochure = {
    kind: 'boss', at: 330, patience: 20, id: 'boss_brochure', title: '老闆：產品簡介給你看技術的部分', from: '老闆', module: null,
    text: `我叫 Claire 寫了一份產品簡介，等一下要寄給莎禾。技術的部分你幫我看一下有沒有寫錯：
・支援區塊鏈防竄改，簽核紀錄不可修改
・AI 自動盤點，免人工
・通過 ISO 27001 認證
・支援公司 AD 帳號登入
・手機、平板都能用`,
    sentences: [],
    reply: { items: [{ text: '技術的部分，哪幾句寫錯了？', type: 'multi',
      options: ['「支援區塊鏈防竄改」——平台沒有區塊鏈', '「AI 自動盤點，免人工」——是同仁自己勾，AI 只是問答機器人', '「通過 ISO 27001 認證」——公司沒有這張認證', '「支援公司 AD 帳號登入」', '「手機、平板都能用」'],
      answer: [0, 1, 2], why: '後兩句是對的',
      replies: ['「好，我叫 Claire 改。」'],
      missSays: { 0: '簡介上寫的區塊鏈是哪一期？', 1: '簡介說 AI 自動盤點，所以同仁不用自己勾？', 2: 'ISO 27001 的證書可以給我們一份嗎？' }, missFrom: PM, missGroup: POC, missAfter: 90 }] },
  };
  const supportQuota = {
    kind: 'line', at: 60, id: 'ai_support_quota', title: '人資經理 鄭哥', from: '人資經理 鄭哥', module: null, when: supportOn,
    text: 'Claire 說我今天的額度用完了，可是我才寫了三封信？簡報上寫需要技術支援請洽資訊部，所以來找你了😅',
    sentences: [], nagEvery: 30, nagText: '在嗎？Claire 還是說額度用完了😅',
    reply: { items: [{ text: '你回：', options: ['「簡單的信用 Verse 就好，Novel 一次吃兩格，三封信就差不多用完了。」', '「我幫你跟財務申請加購。」', '「那今天先不要用 AI。」', '（已讀）'], answer: 0,
      replies: ['「原來我每次都選最貴的……」', '「好，那加購的部分請洽財務部。」', '「好吧。」'],
      followUps: {
        1: { at: 330, src: { kind: 'mail', id: 'finance_quota', title: '加購 AI 額度', from: '財務 美玲', module: null, subtasks: [], sentences: [], text: '聽鄭哥說要幫人資加購 Claire 的額度？加購服務的效益分析報告呢？麻煩今天給我，謝謝。' } },
        2: { at: 305, src: { kind: 'line', id: 'ai_support_quota2', title: '人資經理 鄭哥', from: '人資經理 鄭哥', module: null, subtasks: [], sentences: [], text: '它又說用完了。我真的只寫了一封信。' } },
      } }] },
  };
  const CAMPAIGN_SCREEN = { app: '週年慶活動頁', campaign: true, defects: { brokenImages: 'fixImages', bannerOverButton: 'fixMobileButton', formOverflow: 'fixTabletForm' } };
  const FIX = (work, picked, name, does, label, right, wrong) => ({ onlyIf: { work, item: 0, picked }, name, does, code: `// ${does}`,
    fields: { how: { label, options: [right, wrong], answer: 0, ai: { pick: 1, kind: 'other' } } } });
  const supportPage = {
    kind: 'mail', at: 270, id: 'ai_support_page', title: 'Claire 做的活動頁可以放官網嗎', from: '行銷部 Ivy', module: null, when: supportOn, saInstant: true, saVerbatim: true,
    text: '我們用 Claire 做了週年慶的活動頁，附件是檔案，可以今天放到官網嗎？Claire 說已經可以上線了，但是你們部門負責資安的畇蓁一直說不行。',
    sentences: [
      { text: '週年慶活動頁今天要放上官網', keep: true },
      { text: '資安的畇蓁說不行（資安的疑慮要先處理）', keep: true },
      { text: 'Claire 說已經可以上線了', keep: false },
    ],
    screen: CAMPAIGN_SCREEN,
    reviewSays: { review_front: { who: '資安 畇蓁', hit: '「這樣我就簽了。」', miss: '「我說過了，不行。」', trap: { who: '行銷部 Ivy', text: '「那個配色是我們要的欸。」' } },
      review_back: { who: '資安 畇蓁', hit: '「個資的部分都收乾淨了。」', miss: '「報名資料還在網址上，這樣不能上。」' } },
    subtasks: [
      { work: 'review_front', question: REVIEWS.campaignFront },
      { work: 'review_back', question: REVIEWS.signupBack },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['三個裝置都看得到商品圖', '手機上按得到送出', '平板上表單不用左右捲', '報名完，localStorage 裡沒有個資', '網址裡看不到手機和地址', 'Claire 說可以上線'],
        answer: [0, 1, 2, 3, 4], ai: { pick: [0, 1, 2, 5], kind: 'extra' }, why: 'Claire 說可以不是驗收條件',
        given: [
          { work: 'review_front', options: [0], when: { item: 0, picked: 'fixImages' } },
          { work: 'review_front', options: [1], when: { item: 0, picked: 'fixMobileButton' } },
          { work: 'review_front', options: [2], when: { item: 0, picked: 'fixTabletForm' } },
          { work: 'review_back', options: [3], when: { item: 0, picked: 'storeOnServer' } },
          { work: 'review_back', options: [4], when: { item: 0, picked: 'postNotGet' } },
        ] }] } },
      // function 直接帶入兩個檢閱勾到的——勾了哪幾項就改哪幾項，沒勾的照行銷部原樣（onlyIf 接檢閱的 fix）
      { work: 'code', question: { kind: 'functions', functions: [
        FIX('review_front', 'fixImages', 'fixImages', '商品圖破圖', '怎麼修', '圖片路徑改成官網的檔案位置，重新上傳', '把破圖的那格藏起來'),
        FIX('review_front', 'fixMobileButton', 'fixMobileButton', '手機上送出鈕被橫幅蓋住', '怎麼修', '橫幅在手機上縮成一列，不蓋住按鈕', '把送出鈕移到橫幅上面'),
        FIX('review_front', 'fixTabletForm', 'fixTabletForm', '平板上表單要左右捲', '怎麼修', '表單寬度跟著螢幕，欄位換行', '把字縮小到塞得下'),
        FIX('review_back', 'storeOnServer', 'storeOnServer', '報名資料存在瀏覽器', '怎麼修', '送到伺服器存，瀏覽器不留', '存進 localStorage 前先加密'),
        FIX('review_back', 'postNotGet', 'postNotGet', '手機和地址接在網址後面', '怎麼修', '改用 POST，資料放在 body', '網址用 HTTPS 就看不到了'),
        FIX('review_back', 'maskLog', 'maskLog', 'log 印出整筆報名資料', '怎麼修', 'log 只留報名編號，個資遮掉', 'log 檔設成只有工程師看得到'),
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      DEPLOY('用手機開活動頁按一次送出', '跟 Ivy 說可以上官網了'),
    ],
  };
  const chaos = [financeReport, panPr, bossBrochure, supportQuota, supportPage];

  // ── 結業過場（順序：第三天結算卡 → 隔天早會 → 三天總結算）。bad end 只能重來，這場有莎禾要簽、平行宇宙兩個版本 ──
  const graduationLines = (boss, assetRoom) => [
    { who: '老闆', text: boss },
    { who: 'SA／PM 怡君', text: '我先把合約的需求整理一下。' },
    { who: 'SA／PM 怡君', text: '這次我自己讀。', aside: '看了你一眼' },
    { who: '資產室 阿賢', text: assetRoom },
    { who: 'IT 經理', text: '新人訓練就到這裡。明天開始，卡會一直來。' },   // 老闆不會管到這麼細，是 IT 經理會講的
  ];
  const GRADUATION = {
    title: '隔天 09:00 公司早會',
    lines: graduationLines('莎禾那邊說要簽！三年約。', '所以我們的盤點平台要賣錢了？'),
    parallelLines: graduationLines('莎禾說跟他們想的不太一樣，不過他們決定把資安控管系統和相關認證外包給我們了。', '所以我們的盤點平台呢？'),
    end: '新人訓練結束',
  };

  const api = { make, POC, IT, pocLive, parallelUniverse, REVIEWS, CAMPAIGN_SCREEN, GRADUATION };
  if (typeof module !== 'undefined') module.exports = api;
  else root.DAY3 = api;
})(typeof window !== 'undefined' ? window : globalThis);
