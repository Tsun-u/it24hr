// day1.js — 教學關第一天（legacy）的劇本。全部是資料，程式只負責跑。
// 資產室阿賢要一個最簡單的資產 CRUD 小程式。主線一張大卡拆成子任務，加三張干擾卡。
// 時間都是「從 09:00 起算的分鐘」。
(function (root) {
  const req = `我問過怡君了，她說可以直接開給你。
欸，想問一下你有沒有空幫我弄一個小程式。
我們資產室現在資產都記在 Excel，每次盤點都要一台一台對，很痛苦。
我想要一個網頁，可以把資產一筆一筆建進去，每筆要有：資產編號、名稱、類別（電腦／螢幕／手機／平板／其他）、持有人、放在哪個部門、購入日期、狀態（使用中／閒置／報廢）。
可以查、可以改。報廢的要能標起來但不要真的刪掉，因為稽核會問。
編號要照我們現有的格式，就是 部門代碼-年份-流水號，像 IT-2024-0031 這樣。
只有我跟我們主任會用，不用做登入，但要能匯出成 Excel 給稽核。
喔對，手機上看得到就好，不用能操作。
盡量這個月底前，拜託了🙏`;

  // 阿賢那頁和老闆要的財務唯讀頁看的是同一份資料
  const assetFields = ['編號', '名稱', '類別', '持有人', '部門', '購入日期', '狀態'];
  const assetRows = [
    ['IT-2024-0031', 'ThinkPad T14', '電腦', '阿賢', '資產室', '2024-03-12', '使用中'],
    ['IT-2024-0032', 'Dell 24 吋螢幕', '螢幕', '主任', '資產室', '2024-03-12', '使用中'],
    ['IT-2023-0107', 'iPad 第 9 代', '平板', '阿賢', '資產室', '2023-11-02', '閒置'],
    ['IT-2022-0044', '舊的條碼機', '其他', '—', '資產室', '2022-05-20', '報廢'],
  ];
  // 配色兩張卡共用同一組選項：追加需求選得跟母議題不一樣，評語會多一句「風格能夠一致會更好」
  const palette = (why) => ({ role: 'palette', text: '配色', options: ['公司 CI：白底黑字，按鈕藍', '高級感：淺灰底淺灰字', '喜氣：紅底綠字', '駭客風：黑底螢光綠', '深色預設：深灰底白字'],
    swatch: [['#ffffff', '#1f2328', '#2563eb'], ['#f3f4f6', '#b4b8bf', '#c7cbd1'], ['#c62828', '#2e7d32', '#ffd54f'], ['#0b0f0a', '#39ff14', '#39ff14'], ['#14171d', '#e6e8ee', '#60a5fa']],
    answer: 0, why });

  const main = {
    at: 10, id: 'asset_crud', title: '資產清單小程式', from: '資產室 阿賢', assignee: '玩家',
    body: req,
    noReject: '我看過了，阿賢說得很清楚，我在忙別的事情，這張有需要討論直接找阿賢',   // 阿賢問過怡君才直接開給你：退回 SA 怡君秒退
    attachments: ['資產清單_2024.xlsx', 'IMG_4471.jpg（阿賢桌上那疊盤點表）'],
    // 結算卡上需求單位的專屬台詞；沒寫的卡用預設矩陣（有沒有需求討論 × 功能全不全對）
    reviews: { who: '資產室 阿賢', done: '「終於不用一台一台對了！」', undone: '「明天還是要用 Excel。」' },
    // 成品畫面（screen.js 照這個畫）：欄位、幾筆假資料、開發 bug 對應到看得見的效果
    screen: {
      app: '資產清單', fields: assetFields, rows: assetRows,
      bugs: { createAsset: 'serialWrong', scrapAsset: 'scrapGone', listByStatus: 'filterBroken', updateAsset: 'editBroken' },
    },
    nags: [
      { after: 240, who: '資產室 阿賢', text: '想問一下大概什麼時候能用？不急不急' },
      { after: 420, who: '資產室 阿賢', text: '主任問我進度，我說你在弄 😅' },
    ],
    subtasks: [
      { work: 'read_req', question: { intro: '每天看同事的需求就像在做閱讀測驗，而且同事不是職業作家。總之來把阿賢的需求畫成重點，等等才知道要做什麼。',
        points: ['資產一筆一筆建進去', '欄位：編號、名稱、類別、持有人、部門、購入日期、狀態', '可以查', '可以改',
                 '報廢是標記，不是刪除', '稽核會查報廢的', '編號格式：部門代碼-年份-流水號', '只有阿賢和主任會用',
                 '不用登入', '匯出 Excel', '手機看得到就好，不用操作', '月底前'],
        items: [
          { text: '報廢的資產要____', options: ['直接刪除', '標成報廢但保留', '移到另一個表'], answer: 1, why: '稽核會問，所以資料要留著' },
          { text: '資產編號的格式是____', options: ['年份-部門-流水號', '部門代碼-年份-流水號', '流水號-部門代碼'], answer: 1, why: 'IT-2024-0031' },
          { text: '手機上____', options: ['看得到就好', '要能看和改', '要跟電腦一樣'], answer: 0, why: '「看得到就好，不用能操作」' },
        ] } },
      // 第一頁在阿賢的原話上圈出講不清楚的地方，第二頁只對圈起來的選要問什麼；沒圈到的靜靜變成需求不明
      { work: 'discuss', question: { kind: 'discuss',
        segments: [
          '欸，想問一下你有沒有空幫我弄一個小程式。',
          '我們資產室現在資產都記在 Excel，每次盤點都要一台一台對，很痛苦。',
          '我想要一個網頁，可以把資產一筆一筆建進去，',
          '每筆要有：資產編號、名稱、類別（電腦／螢幕／手機／平板／其他）、持有人、放在哪個部門、購入日期、狀態（使用中／閒置／報廢）。',
          '可以查、可以改。',
          '報廢的要能標起來但不要真的刪掉，因為稽核會問。',
          '編號要照我們現有的格式，就是 部門代碼-年份-流水號，像 IT-2024-0031 這樣。',
          '只有我跟我們主任會用，不用做登入，',
          '但要能匯出成 Excel 給稽核。',
          '喔對，手機上看得到就好，不用能操作。',
          '盡量這個月底前，拜託了🙏',
        ],
        asks: {
          // replies 跟 options 對齊：問對問題才拿得到有用的答案
          3: { text: '阿賢：「就跟 Excel 一樣就好啦。」', options: ['「Excel 裡哪幾欄是一定要填的？」', '「你們 Excel 現在幾筆？」', '「好，那就照 Excel 做。」'], answer: 0, why: '必填欄位決定表單怎麼擋',
               replies: ['「編號、名稱、狀態一定要有，其他可以先空著。」', '「兩百多筆吧，加上報廢的三百出頭。」', '「好～」'] },
          6: { text: '阿賢：「流水號你幫我自動跳就好。」', options: ['「流水號每年歸零，還是一直累加？」', '「好，自動跳。」', '「你們一年買幾台？」'], answer: 0, why: 'IT-2024-0031 看起來是每年一組，但要問',
               replies: ['「每年歸零，所以才有年份在中間。」', '「謝啦。」', '「看預算，去年三十幾台。」'] },
          // 一段原話可以掛好幾題（陣列）：匯出這段要問的有兩件事
          8: [
            { text: '阿賢：「匯出就匯出全部就好。」', options: ['「報廢的要不要一起匯？」', '「匯出會很常用嗎？」', '「好。」'], answer: 0, why: '稽核要看報廢的，匯出少了就白做',
              replies: ['「要！稽核就是要看報廢的。」', '「一年兩次吧，稽核來的時候。」', '「讚。」'] },
            { text: '阿賢：「格式喔？就 Excel 啊。」', options: ['「欄位順序照你們現在那份 Excel 嗎？」', '「要 xlsx 還是 csv？」', '「好。」'], answer: 0, why: '欄位順序是規格，稽核對慣了',
              replies: ['「對，照那份，稽核的人對慣了。」', '「xlsx 啊……我附的檔案不就是了？」', '「讚讚。」'] },
          ],
        } } },
      // 估時沒有對錯：自己填幾小時，結算卡跟實際花的時間並排；real 是這張卡在現實中大約多久
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '這個 CRUD 小程式連測試、驗收、部署，你估：',
                  real: { manual: '3 天', ai: '1 天' } }] } },
      // 計畫是有順序的：挑該做的、照順序排；只有 before 列的兩步有先後（匯出和手機版誰先都行、測試先寫也行）。
      // 開發計畫 ← 整理需求、需求討論（答對、問對才帶，帶進來的步驟鎖住、順序自己排）；排了哪幾步會流到規格、驗收和寫程式
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order', options: ['確認欄位與編號規則', '設計資料表', '做新增／查詢／修改／報廢', '匯出 Excel', '手機版可看', '寫測試', '部署到內網', '做登入功能', '做權限控管'],
                  answer: [0, 1, 2, 3, 4, 5, 6], before: [[0, 1], [1, 2], [2, 3], [2, 4], [3, 6], [4, 6], [5, 6]],
                  why: '阿賢說不用登入，只有兩個人用',
                  // 寫測試、部署沒有來源：工程師本來就該知道的步驟
                  given: [
                    { work: 'read_req', options: [2], when: { item: 0, picked: 1 } },   // 報廢是標記
                    { work: 'read_req', options: [0], when: { item: 1, picked: 1 } },   // 編號格式
                    { work: 'read_req', options: [4], when: { item: 2, picked: 0 } },   // 手機看得到就好
                    { work: 'discuss', options: [1], when: { item: 3, picked: 0 } },    // 必填欄位
                    { work: 'discuss', options: [0], when: { item: 6, picked: 0 } },    // 流水號每年歸零
                    { work: 'discuss', options: [3], when: { item: 8, sub: 0, picked: 0 } },   // 報廢的要一起匯
                  ] }] } },
      { work: 'doc_spec', question: { items: [{ text: '內容', options: ['資料表欄位與型別', '編號產生規則（部門-年份-流水號，每年歸零）', '報廢＝狀態改為報廢，資料不刪', '匯出的欄位順序', '程式用哪個框架', '變數命名規則', '手機版只能看'],
                  answer: [0, 1, 2, 3, 6], why: '框架和命名是實作細節，不是規格',
                  // 整理需求答對才帶「報廢保留」「手機只能看」（編號格式那題不帶編號規則：「每年歸零」要問過才知道）；
                  // 需求討論問到必填欄位帶資料表、問到「每年歸零」帶編號規則、問到欄位順序帶匯出欄位；開發計畫排了的步驟也帶
                  given: [
                    { work: 'read_req', options: [2], when: { item: 0, picked: 1 } },
                    { work: 'read_req', options: [6], when: { item: 2, picked: 0 } },
                    { work: 'discuss', options: [0], when: { item: 3, picked: 0 } },
                    { work: 'discuss', options: [1], when: { item: 6, picked: 0 } },
                    { work: 'discuss', options: [3], when: { item: 8, sub: 1, picked: 0 } },
                    { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } },
                    { work: 'doc_plan', options: [3], when: { item: 0, picked: 3 } },
                    { work: 'doc_plan', options: [6], when: { item: 0, picked: 4 } },
                  ] }] } },
      // 前端設計：版型和元件決定成品畫面長什麼樣（screen.js 照 keys 畫）；防呆是業界最大的坑：
      // 漏掉的自己測不會出事，QC 亂打才會，退件理由寫在 fails（跟選項對齊）
      { work: 'ui_design', question: { items: [
          { role: 'template', text: '版型', options: ['清單頁＋編輯表單', '只有一張表單', '報表頁', '儀表板'], keys: ['list', 'form', 'report', 'dashboard'], answer: 0,
            why: '一筆一筆建、可以查可以改，就是清單加表單' },
          { role: 'components', text: '元件', options: ['搜尋列', '狀態篩選', '新增按鈕', '每列的修改', '報廢按鈕', '匯出 Excel', '分頁', '登入框', '權限設定', '深色模式'],
            keys: ['search', 'filter', 'add', 'edit', 'scrap', 'export', 'pager', 'login', 'perm', 'dark'],
            answer: [0, 1, 2, 3, 4, 5], why: '幾百筆不用分頁；登入和權限他說不用',
            // 規格有寫「報廢＝標記」「匯出欄位」的，報廢按鈕和匯出按鈕直接帶進來
            given: [{ work: 'doc_spec', options: [4], when: { item: 0, picked: 2 } }, { work: 'doc_spec', options: [5], when: { item: 0, picked: 3 } }] },
          // 日期選擇器是坑：大批輸入的程式叫使用者一筆一筆點日曆是夢魘，打字就收、格式錯才擋才對
          // 日期有兩種對：照格式打（2026-11-23）是好，直接打 20261123 程式自己轉是更好；alt 標「哪個選項可以頂替哪一項正解」
          { role: 'validations', text: '防呆', options: ['編號格式檢查（部門-年份-流水號）', '必填欄位不能空白', '購入日期直接打 20261123，程式自己轉成 2026/11/23，轉不了才把框變紅', '編號不能重複', '報廢前再確認一次', '刪除前再確認一次', '每打一個字就存檔', '購入日期一定要點日曆（日期選擇器）', '購入日期打字就收，要照 2026-11-23 打，格式錯才擋'],
            keys: ['serial', 'required', 'dateSmart', 'unique', 'confirmScrap', 'confirmDelete', 'autosave', 'datePicker', 'dateFormat'],
            answer: [0, 1, 2, 3, 4], alt: { 8: 2 }, why: '沒有刪除這個功能；每個字都存是在幫自己製造 bug；幾百筆資料叫人一筆一筆點日曆是折磨',
            fails: ['編號亂打也存得進去', '名稱空白也能存', '購入日期打 2024/13/45 也收', '同一個編號建了兩筆', '手滑就報廢了，而且叫不回來'] },
          // 坑：配色用色票選，對比和紅綠是 Lighthouse 會抓的；提示方式用縮圖選，擋不住手滑的那幾種是最佳做法會扣的
          palette('內網系統跟公司 CI 走，阿賢和主任看得習慣'),
          { role: 'confirm', text: '「報廢前再確認一次」用什麼方式？', options: ['Dialog：跳視窗問你確定嗎', 'Toast：右下角冒一下就消失', 'Tooltip：滑過去才看得到', '按鈕旁邊一行字', 'alert()'],
            thumb: ['dialog', 'toast', 'tooltip', 'inline', 'alert'], answer: 0, why: '不可逆的操作要擋在前面；Toast 和 Tooltip 擋不住手滑，alert() 能用但 2008' },
          { role: 'hint', text: '欄位打錯了怎麼提示？', options: ['欄位下面一行紅字', 'Dialog：每打錯一次跳一個視窗', 'Toast', 'Tooltip', 'alert()'],
            thumb: ['inline', 'dialog', 'toast', 'tooltip', 'alert'], answer: 0, why: '錯在哪就寫在哪；每個錯誤都跳視窗，阿賢會想砸電腦' },
        ] } },
      // CRUD 四個 function：開發計畫排了「做新增／查詢／修改／報廢」，或規格寫了對應那一項，就直接拉進 IDE（文件全對就不用自己寫）。
      // accept 是手動測試照著測的驗收案例：驗收有寫那個案例，這個 function 的 bug 才翻得出來
      { work: 'code', question: { kind: 'functions', functions: [
          { sentence: 0, needs: { work: 'doc_plan', picked: 2 }, spec: 1, accept: 0, name: 'createAsset', does: '新增一筆資產、產生編號', code: "const no = `${dept}-${year}-${String(seq).padStart(4, '0')}`;",
            fields: { no: { label: '產生編號', options: ["`${dept}-${year}-${String(seq).padStart(4, '0')}`", "`${year}-${dept}-${seq}`", 'Date.now()'], answer: 0 } } },
          { needs: { work: 'doc_plan', picked: 2 }, spec: 0, accept: 1, device: true, name: 'listByStatus', does: '照狀態篩資產', code: 'return items.filter(i => i.status === q.status);',
            fields: { rows: { label: '照狀態篩', options: ['items.filter(i => i.status === q.status)', 'items.find(i => i.status === q.status)', 'items.map(i => i.status === q.status)'], answer: 0 } } },
          { sentence: 1, needs: { work: 'doc_plan', picked: 2 }, spec: 0, accept: 2, name: 'updateAsset', does: '修改一筆資產', code: 'Object.assign(item, patch);',
            fields: { how: { label: '覆寫那筆', options: ['Object.assign(item, patch)', 'item = patch', 'items.push(patch)'], answer: 0 } } },
          { needs: { work: 'doc_plan', picked: 2 }, spec: 2, accept: 3, name: 'scrapAsset', does: '報廢一筆資產', code: "item.status = '報廢';",
            fields: { how: { label: '報廢', options: ["item.status = '報廢'", 'items.splice(idx, 1)', 'delete items[idx]'], answer: 0 } } },
        ] } },
      // 寫測試程式也是 IDE：驗收文件寫到的案例直接變成 function 拉進來，沒寫到的自己憑空寫；登入那個是陷阱（這系統沒登入）
      { work: 'test', question: { kind: 'functions', functions: [
          { needs: { work: 'doc_accept', picked: 0 }, name: 'testCreateNumberFormat', does: '新增後編號格式正確', code: "expect(no).toMatch(/^[A-Z]+-\\d{4}-\\d{4}$/);",
            fields: { assert: { label: '檢查', options: ['編號符合 部門-年份-流水號', '編號不是空的', '編號是數字'], answer: 0 } } },
          { name: 'testSerialUniqueInYear', does: '同一年流水號不重複', fields: { assert: { label: '檢查', options: ['同一年兩筆流水號不同', '流水號是偶數', '流水號小於 100'], answer: 0 } } },
          { name: 'testSerialResetsYearly', does: '跨年流水號歸零', fields: { assert: { label: '檢查', options: ['跨年後流水號從 0001 開始', '跨年後流水號接著數', '跨年要手動改'], answer: 0 } } },
          { needs: { work: 'doc_accept', picked: 3 }, name: 'testScrappedStillListed', does: '報廢後查詢還看得到', code: "expect(list({ status: '報廢' })).toContain(item);",
            fields: { assert: { label: '檢查', options: ['報廢後查詢還看得到', '報廢後查不到', '報廢後變成閒置'], answer: 0 } } },
          { needs: { work: 'doc_accept', picked: 3 }, name: 'testScrappedNotDeleted', does: '報廢後資料沒被刪', code: 'expect(db.count()).toBe(before);',
            fields: { assert: { label: '檢查', options: ['報廢後資料筆數不變', '報廢後少一筆', '報廢後多一筆'], answer: 0 } } },
          { needs: { work: 'doc_accept', picked: 4 }, name: 'testExportIncludesScrapped', does: '匯出含報廢', code: 'expect(xlsx.rows).toContainEqual(scrapped);',
            fields: { assert: { label: '檢查', options: ['匯出含報廢的', '匯出不含報廢的', '匯出只有第一頁'], answer: 0 } } },
          { name: 'testLoginLockout', does: '登入失敗三次鎖定', fields: { assert: { label: '檢查', options: ['這個系統沒有登入，不用測', '登入失敗三次鎖定', '登入成功跳首頁'], answer: 0 } } },
        ] } },
      // 手動測試：進測試模式，點手機、平板實機測，點電腦螢幕用 devtools 模擬
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'doc_accept', question: { items: [{ text: '案例', options: ['新增一筆並檢查編號', '查詢各狀態', '修改持有人', '報廢後仍可查到', '匯出 Excel 開得起來', '手機上看清單', '效能壓測十萬筆'],
                  answer: [0, 1, 2, 3, 4, 5], why: '只有兩個人用、幾百筆資產',
                  // 規格文件寫到的，驗收案例直接帶：資料表欄位→查詢、修改；編號規則→新增檢查編號；報廢保留→報廢後仍可查到；匯出→Excel 開得起來；手機只能看→手機上看清單。
                  // 開發計畫排了的步驟也帶：確認編號規則→新增檢查編號；新增／查詢／修改／報廢→查詢、修改、報廢後仍可查到；匯出、手機版各帶各的
                  given: [
                    { work: 'doc_plan', options: [0], when: { item: 0, picked: 0 } },
                    { work: 'doc_plan', options: [1, 2, 3], when: { item: 0, picked: 2 } },
                    { work: 'doc_plan', options: [4], when: { item: 0, picked: 3 } },
                    { work: 'doc_plan', options: [5], when: { item: 0, picked: 4 } },
                    { work: 'doc_spec', options: [1, 2], when: { item: 0, picked: 0 } },
                    { work: 'doc_spec', options: [0], when: { item: 0, picked: 1 } },
                    { work: 'doc_spec', options: [3], when: { item: 0, picked: 2 } },
                    { work: 'doc_spec', options: [4], when: { item: 0, picked: 3 } },
                    { work: 'doc_spec', options: [5], when: { item: 0, picked: 6 } },
                  ] }] } },
      // roles 告訴 engine 每一步是什麼：替換排在上傳前面會 502、漏備份退件時沒得回、漏煙霧測試 QC 多翻一個 bug、漏通知阿賢會來問
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份目前的內網站台', '上傳新版', '替換', '開網址新增一筆試試', '通知阿賢'], answer: [0, 1, 2, 3],
          why: '通知要等 QC 驗過，從已完成的卡上按；部署完就通知，阿賢拿到的是還沒驗的東西' }] } },
    ],
  };

  // 老闆不是卡，是走到桌邊的人：理他就進電腦裡的文件，不理 20 分鐘他留一張紙就走。
  // 他講的其實是阿賢那張卡的追加需求（阿賢說只有他和主任用，老闆說財務也要看）：
  // 開卡時掛在 asset_crud 底下才對，開成獨立的卡 SA 會留言提醒（relatedTo）
  const boss = {
    kind: 'boss', at: 100, patience: 20, id: 'boss', title: '老闆：財務也要看', from: '老闆', module: 'inventory', relatedTo: 'asset_crud',
    lines: ['那個資產的東西，阿賢說你在弄？大概多久？', '對了，財務說他們也要看那個清單。給他們看就好，不用能改。'],
    sentences: [
      { text: '財務也要看資產清單', keep: true, sa: '資產清單新增唯讀頁（財務用）' },
      { text: '給他們看就好，不用能改', keep: true, sa: '唯讀頁也具有匯出 Excel 功能' },
      { text: '大概多久', keep: false },
    ],
    // 唯讀頁：跟阿賢那頁同一份資料，不能有會改資料的東西；readOnlyView 寫錯就變成財務也能改
    screen: { app: '資產清單（財務唯讀）', fields: assetFields, rows: assetRows, readOnly: true, bugs: { readOnlyView: 'editable' } },
    subtasks: [
      { work: 'ui_design', question: { items: [
          { role: 'template', text: '版型', options: ['清單頁', '只有一張表單', '報表頁', '儀表板'], keys: ['list', 'form', 'report', 'dashboard'], answer: 0,
            why: '財務看的就是阿賢那份清單，同一個樣子兩邊對得起來' },
          { role: 'components', text: '元件', options: ['搜尋列', '狀態篩選', '匯出 Excel', '新增按鈕', '每列的修改', '報廢按鈕', '分頁', '登入框'],
            keys: ['search', 'filter', 'export', 'add', 'edit', 'scrap', 'pager', 'login'],
            answer: [0, 1, 2], why: '唯讀頁上不能有會改資料的按鈕；財務對帳要匯出' },
          palette('跟阿賢那頁同一套：財務和資產室用的是同一個系統'),
        ] } },
      // 開卡時有勾「財務也要看資產清單」這句，readOnlyView 就直接拉進 IDE；沒勾就自己填
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, accept: 0, name: 'readOnlyView', does: '給財務一個只能看的清單頁', code: "return render(list, { readOnly: true, path: '/assets/view' });",
          fields: { scope: { label: '財務看到什麼', options: ['整份清單，只能看', '整份清單，也能改', '只有財務部門自己的資產'], answer: 0 },
                    how: { label: '怎麼給', options: ['另一個唯讀網址', '跟阿賢同一個網址', '每個月匯出 Excel 寄給他們'], answer: 0 } } },
      ] } },
      // 老闆的卡也要走完測試和部署，不然 QC 一句「還沒上測試機」就退
      { work: 'doc_accept', question: { items: [{ text: '案例', options: ['唯讀網址開得起來、看得到清單', '唯讀頁上沒有新增／修改／報廢', '效能壓測十萬筆'], answer: [0, 1], why: '幾百筆資產，壓測十萬筆是在練身體' }] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testReadOnlyViewLists', does: '唯讀頁看得到清單', code: "expect(get('/assets/view').rows.length).toBe(list.length);",
          fields: { assert: { label: '檢查', options: ['唯讀頁的筆數跟清單一樣', '唯讀頁至少一筆', '唯讀頁開得起來就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testReadOnlyViewHasNoEdit', does: '唯讀頁上沒有能改的按鈕', code: "expect(get('/assets/view').buttons).not.toContain('修改');",
          fields: { assert: { label: '檢查', options: ['頁上沒有新增／修改／報廢按鈕', '按修改會跳錯', '頁上有「唯讀」兩個字'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      { work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
        items: [{ text: '步驟', type: 'order', options: ['備份目前的內網站台', '上傳新版', '替換', '開唯讀網址看一眼', '跟老闆說一聲'], answer: [0, 1, 2, 3],
          why: '跟老闆說要等 QC 驗過，從已完成的卡上按' }] } },
    ],
  };

  // 同部門同事問問題用 LIME（正式知會才用信），看完自己決定要不要整理成卡
  const colleague = {
    kind: 'line', at: 270, id: 'colleague', title: '小潘：借問一下', from: '同事 小潘', module: 'inventory',
    text: '欸那個照狀態篩資料你都怎麼寫？我這邊 filter 出來都空的\n（附了一張截圖，條件寫成 i.status = q.status）\n在嗎？',
    // 這是問問題，不是需求：沒有 sentences 就不能開卡，只能回
    reply: { items: [{ text: '你回：', options: ['「你那個是指派不是比較，要 ===」', '「我等等看」', '（已讀）'], answer: 0 }] },
    subtasks: [],
  };

  // LIME 群組「精銳三人產線」：怡君開卡、你寫、阿姿驗。三個人偶爾在群組聊天，回不回隨你，
  // 回（已讀）就是已讀不回。replies 的一格是一串 { who, text }，照順序接著回
  const TEAM = '精銳三人產線';
  // late：{ lateAt, lateReplies }，過了截止時間才回的，對方改回 lateReplies[選項]
  const teamSay = (at, id, from, text, options, replies, late = {}) => ({ kind: 'line', group: TEAM, at, id, title: TEAM, from, module: null, text, subtasks: [],
    reply: { items: [{ text: '你回：', free: true, options: [...options, '（已讀）'], replies, ...late }] } });
  // 12:10 阿姿照她 12:00 講的時間收單：公告不用回，照你 12:00 怎麼回挑一句；沒回、回（已讀）的是最後那句。收單之後才 +1 的，她回「下次請早」
  const LUNCH_CLOSE_AT = 190;
  const lunchAnswer = (e) => { const r = (e.docs.find(d => d.id === 'team_lunch') || {}).replied; return r && !r.seen ? r.answers[0] : null; };
  const lunchClose = { kind: 'line', group: TEAM, at: LUNCH_CLOSE_AT, id: 'team_lunch_close', title: TEAM, from: 'QC 阿姿', module: null, subtasks: [],
    variants: [
      { when: (e) => lunchAnswer(e) === 0, text: '收單：排骨、雞腿，加我的一共三個，打電話訂了。' },
      { when: (e) => lunchAnswer(e) === 1, text: '收單，打電話訂了。' },
      { text: '收單了喔，沒講話的當作不用。' },
    ] };
  const team = [
    teamSay(5, 'team_morning', 'SA 怡君', '早～今天也是精銳三人產線：我開卡、你寫、阿姿驗。誰都不准請假。',
      ['「收到，誰請假誰請飲料」', '「我可以請假嗎」'],
      [[{ who: 'QC 阿姿', text: '「附議，請飲料。」' }], [{ who: 'SA 怡君', text: '「不行。」' }, { who: 'QC 阿姿', text: '「不行。」' }]]),
    teamSay(180, 'team_lunch', 'QC 阿姿', '中午訂便當，要的 +1，十二點十分收單。',
      ['「+1，排骨」', '「我自己帶了」'],
      [[{ who: 'SA 怡君', text: '「+1 雞腿，阿姿先幫我墊。」' }], [{ who: 'QC 阿姿', text: '「好喔，自己帶便當的模範員工。」' }]],
      { lateAt: LUNCH_CLOSE_AT, lateReplies: { 0: [{ who: 'QC 阿姿', text: '「收單了啦，下次請早。」' }] } }),
    lunchClose,
    teamSay(420, 'team_drink', 'SA 怡君', '下午好睏，有人要團購手搖嗎？',
      ['「珍奶半糖少冰」', '「先把卡寫完再說」'],
      [[{ who: 'QC 阿姿', text: '「+1，一樣。」' }], [{ who: 'SA 怡君', text: '「好認真，幫你點一杯無糖綠，提神。」' }]]),
    teamSay(600, 'team_late', 'QC 阿姿', '我九點前都在，要交的趕快丟。九點一到我就關電腦。',
      ['「好，盡量」', '「九點零一分交可以嗎」'],
      [['「加油。」'], ['「可以啊，明天早上一進公司就驗。」']]),
  ];

  // 會議舉手之後不說話的三條退路：放下手、轉移話題、離席。反應是隨機挑一句；每場會議可以換自己的
  const retreat = {
    lower: { label: '放下手', reactions: ['同事：「你還好嗎？」', '同事：「沒事別舉手。」', '同事：「我還以為你要發表什麼宣言。」', '老闆：「既然舉手了，要不要乾脆你做？」'] },
    stretch: { label: '「沒事，我伸展一下。」', reactions: ['同事：「……」', '同事：「坐久了齁。」', '老闆：「好，繼續。」'] },
    leave: { label: '「我去個廁所。」（後面的會議就錯過了）' },
  };

  // 第一天結束後的過場：隔天早上的公司早會（簡易版；老闆會在，所以不是站立會議），接到第二天阿賢想要大平台的劇情
  const transition = {
    at: 1, end: 26, title: '09:00 公司早會',
    lines: [
      { at: 1, text: '阿賢：「昨天那個資產的小程式，QC 說沒問題，我已經在用了！」' },
      { at: 7, text: '阿賢：「超好用的。其實我在想，能不能讓每個人自己上來填？我就不用一台一台盤……」' },
      { at: 13, text: '老闆：「這想法很好，好的工具就是要分享給全公司，增進大家的效率，誰要來做？」', key: true,
        options: [{ text: '「我接。」', flag: 'volunteered' }, { text: '（低頭看手機）' }] },
      { at: 19, text: '老闆：「好，那就這樣。」', closing: true },   // 收尾句：等「誰要來做？」那句有結果才講
    ],
    retreat,
    ifSilent: { flag: 'assigned_anyway', text: '老闆看了你一眼。「那我們就交給原廠維護，{玩家名稱}，就你了。」' },
  };

  const hints = [
    { after: 'card:arrived:asset_crud', text: '阿賢傳了需求來。打開 Tearlol，點那張卡。', until: 'card:opened:asset_crud' },
    { after: 'card:opened:asset_crud', text: '先把他講的整理成重點。按「整理需求」。', until: 'work:done:asset_crud:read_req' },
    { after: 'work:done:asset_crud:read_req', text: '有幾個地方沒講清楚，找阿賢問。按「需求討論」。', until: 'work:done:asset_crud:discuss' },
    { after: 'work:done:asset_crud:discuss', text: '老闆等一下會問多久。先「估時」。', until: 'work:done:asset_crud:estimate' },
    { after: 'work:done:asset_crud:estimate', text: '動手前先寫開發計畫：文件 ▸ 開發計畫文件。', until: 'work:done:asset_crud:doc_plan' },
    { after: 'work:done:asset_crud:doc_plan', text: '再寫規格：文件 ▸ 開發規格文件。', until: 'work:done:asset_crud:doc_spec' },
    // 驗收文件在寫程式之前：先想怎麼驗再動手，案例會流進寫測試程式
    { after: 'work:done:asset_crud:doc_spec', text: '規格有了，畫面自己先想一遍：按「前端設計」。規格寫過的元件會自己帶進來。', until: 'work:done:asset_crud:ui_design' },
    { after: 'work:done:asset_crud:ui_design', text: '動手前先定怎麼驗：文件 ▸ 驗收文件。規格有寫的案例會自己帶進來。', until: 'work:done:asset_crud:doc_accept' },
    { after: 'work:done:asset_crud:doc_accept', text: '可以寫程式了。按「開發」。', until: 'work:done:asset_crud:code' },
    { after: 'work:done:asset_crud:code', text: '寫測試程式：開發 ▸ 測試程式。驗收案例已經是 test function 了。', until: 'work:done:asset_crud:test' },
    { after: 'work:done:asset_crud:test', text: '手機上要看得到。桌角的平板快沒電了，把排插的線拉到它上面。', until: 'device:charged:tablet' },
    { after: 'device:charged:tablet', text: '自己先測一輪：按「手動測試」，點平板實機看一下。', until: 'work:done:asset_crud:manual_test' },
    { after: 'work:done:asset_crud:manual_test', text: '把程式上到內網。按「部署」。', until: 'work:done:asset_crud:deploy' },
    { after: 'work:done:asset_crud:deploy', text: '上線了，但先不要跟阿賢說。按「完成，交給 QC」。', until: 'card:submitted:asset_crud' },
    { after: 'card:submitted:asset_crud', text: '交出去了，阿姿測完後會回你。桌上其他的卡你自己決定。', until: 'card:closed:asset_crud', pause: false },
    // 通知要等 QC 驗過：卡進已完成才按「通知需求單位」，不然阿賢拿到的是還沒驗的東西
    { after: 'card:closed:asset_crud', text: '阿姿驗過了。打開那張卡按「通知需求單位」，阿賢才知道可以用。', until: 'card:notified:asset_crud' },
    { after: 'card:notified:asset_crud', text: '這張結案了。18:00 之後可以下班。', until: 'day:end', pause: false },
  ];

  const day1 = {
    name: '第一天：Legacy', mode: 'legacy', mainCard: 'asset_crud',
    issueBase: 120,   // 看板已經開到 #120，阿賢的卡是 #121；每個時代的起始號不同，編號在講公司的年紀
    cards: [main],
    sources: [boss, colleague, ...team],
    meetings: [],
    transition,
    hints,
    closeAt: 21 * 60,   // 教學關 21:00 強制結算，不要逗留辦公室（第二天沿用）
    badEnd: [{ at: 540, reason: '18:00 了。阿賢明天還是要用 Excel。',
      check: (e) => ['to_qc', 'archived'].includes(e.board.get('asset_crud').status) ? null : '18:00 了。阿賢明天還是要用 Excel。' }],
    unlabeled: { note: '平板要充電（跨裝置測試要用）', devices: { phone: 64, tablet: 12 } },
    palette,   // 配色題第二天也用同一組
    assetFields, assetRows,   // 第二天改既有資產清單的信件卡，成品畫面照這份畫
    retreat,   // 會議的三條退路，之後的會議也用
    teamSay,   // 「精銳三人產線」群組訊息的寫法，之後的天也用
  };

  // 第二天的開頭：只有過場那場會議（第二天本體還沒做）
  const day2stub = {
    name: '第二天：Hybrid', mode: 'hybrid', mainCard: null,
    cards: [], meetings: [transition], hints: [], badEnd: [],
    unlabeled: { note: '昨天的便條還貼著。', devices: { phone: 40, tablet: 100 } },
  };

  if (typeof module !== 'undefined') module.exports = Object.assign(day1, { day2stub });
  else { root.DAY1 = day1; root.DAY2_STUB = day2stub; }
})(typeof window !== 'undefined' ? window : globalThis);
