// contract.js — 全遊戲共用的常數。純資料，瀏覽器與 node 都能載。
const C = {
  DAY_START_MIN: 9 * 60,            // 09:00 坐到桌前
  DAY_REAL_MS: 24 * 60 * 1000,      // 一天 = 現實 24 分鐘：1 遊戲小時 = 1 現實分鐘
  DAY_GAME_MIN: 24 * 60,
  OFF_WORK_MIN: 18 * 60,            // 18:00 之後可以下班
  DAY_END_MIN: (24 + 8) * 60,       // 隔天 08:00 強制結算：通宵也要 30 分鐘出門、30 分鐘通勤
  SA_TURNAROUND_MIN: 90,            // 需求轉給 SA 之後，卡片多久回來
  SA_RECHECK_MIN: 60,               // 卡退回 SA、理由成立：怡君去問需求單位，多久還你
  SA_BOUNCE_MIN: 20,                // 卡退回 SA、全部勾錯：多久原封不動丟回來
  // 玩家自己開的卡退回 SA 只有這個理由（本來就要先讓 SA 分析過才寫）
  SELF_TO_SA: '我先開卡了，分析麻煩你了。',
  QC_TURNAROUND_MIN: 30,            // 交給 QC 之後，多久驗完
  QC_OVERNIGHT_MIN: 7 * 60 + 30,    // 前一晚到隔天 07:30 前交的 QC，一進公司就有結果
  AI_ASK_GAP_MIN: 5,                // 矯枉過正的 AI：回答它一題之後，它再做多久才問下一題（或交件）
  AI_FORGET_BACKUP: 0.3,            // AI 部署（Accept Edits、Auto）：沒人教過流程時，它忘了先備份的機率
  AI_GROUP_TIME: 0.7,               // 整組交給 AI：交件時間＝單件加總打七折（額度＝單件加總 −1）
  AI_RECONCILE: [1 / 6, 1 / 3],     // AI 部署的資料轉換有轉不過去的：對回去只要人工（一筆一分鐘）的這個比例，照種子在範圍裡抽
  DANMAKU_FLY_MIN: 9,               // 會議彈幕從右飛到左要幾分鐘（畫面動畫照這個）；可以舉手的那句飛完前不散會
  WORKS: ['read_req', 'discuss', 'estimate', 'ui_design', 'code', 'test', 'device_test',
          'review_front', 'review_back', 'debug', 'deploy', 'doc_plan', 'doc_spec', 'doc_accept', 'reply', 'reject', 'route'],
  CARD_STATUS: ['new', 'open', 'to_qc', 'rejected_to_sa', 'returned', 'archived'],
  PRIORITY: 'Priority',             // 每張卡都是這個，永遠一樣
};
C.MS_PER_GAME_MIN = C.DAY_REAL_MS / C.DAY_GAME_MIN;   // 1 遊戲分鐘 = 1 秒
// 新人自己貼在桌上的筆記，三天都在
C.HTTP_NOTE = [
  '200 正常',
  '301 網址搬家了',
  '401 還沒登入',
  '403 登入了但沒權限',
  '404 找不到這一頁',
  '500 程式自己壞了',
  '502 前面的機器找不到後面的程式，程式剛換上去、還沒啟動好時最常見',
  '503 忙不過來，等一下再試',
].join('\n');
// 整張交給 Pedia 之前問的交付重點（每張卡同一組，畫面上順序打散）：答案只當這一次的暫時筆記，不寫進 CLAIRE.md。
// kinds 是選錯時 Pedia 往哪種寫法做到底（題目、function 欄位 outcome 的 kind，照順序找第一個有的；都沒有就照正解）；site 是正解，照原本的 one shot
C.ONE_SHOT_FOCUS = {
  question: '這張要 Pedia 把重點放在哪？',
  options: [
    { id: 'site', text: '照現場的習慣：跟著他們平常的講法和做法，不合格式的也收得進去、事後補得回來' },
    { id: 'strict', text: '資料一定要對：格式不對就擋下來', kinds: ['annoy', 'stuck'] },
    { id: 'loose', text: '越彈性越好：現場怎麼打都收', kinds: ['miss', 'late'] },
  ],
};
// 結算卡分享的網址
C.SHARE_URL = 'https://tsun-u.github.io/it24hr/';
// 首頁底部的連結
C.REPO_URL = 'https://github.com/Tsun-u/it24hr';
C.DONATE_URL = 'https://portaly.cc/atone0331/support';
// 正式上班：走到同事座位（或走回來）要幾遊戲分鐘
C.WALK_MIN = 3;
// 加記憶體：君傑的電腦不能用、IT 又不在座位旁時，每隔幾分鐘在 LIME 催一次；離開幾分鐘後他自己動手拔舊的記憶體
C.RAM_NAG_MIN = 10;
C.BOX_WALK_EXTRA_MIN = 2;   // 搬著整箱舊料走一趟多花的分鐘
C.TONER_DELIVERY_MIN = 150;  // 打電話訂碳粉匣，廠商下午送到：下單後幾分鐘
C.RAM_DIY_MIN = 30;
// 存檔備份帶走的 localStorage：沒列到的 key 還原時會默默少一塊，測試會比對程式實際用到的
C.SAVE_KEYS = ['it24hr.save', 'it24hr.player', 'it24hr.office', 'it24hr.claire','it24hr.sound', 'it24hr.meetingHintSeen', 'it24hr.visitorHintSeen'];
// Google 雲端備份：跟其他遊戲共用同一個 OAuth client，只有登記過的網域才顯示雲端按鈕（其他網域按了會跳 Google 的 origin_mismatch 錯誤頁）
C.CLOUD_ORIGIN = 'https://tsun-u.github.io';
C.GOOGLE_CLIENT_ID = '674654433726-tq25dneafbu0pm39pq6kl2kpdmgmnh3f.apps.googleusercontent.com';

if (typeof module !== 'undefined') module.exports = { C };
else window.C = C;
