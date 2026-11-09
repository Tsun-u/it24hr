// sandbox-fate.js — 正式上班第三關「心領神會」：三位命理老師合開「解憂時代事務所」網站。
// 需求會議裡老師一律「都好」加半句，玩家要自己翻成白話；前端程式的對錯跟常理相反（好用＝老師不滿），資料算錯照樣 QC 退。
// 劇本：劇本/正式上班_心領神會.md。內容：早會、廠商需求會議（散會後 SA 開卡）、母議題＋子議題、茶几。
(function (root) {
  const { Sandbox } = typeof require === 'function' ? require('./sandbox.js') : root;
  const { Palette } = typeof require === 'function' ? require('./palette.js') : root;
  const Works = typeof require === 'function' ? require('./works.js') : root.Works;
  const Screen = typeof require === 'function' ? require('./screen.js') : root.Screen;
  const SA = 'SA 怡君';
  const YAWEN = '解憂時代 助理 雅雯', JINGXUAN = '解憂時代 瀞玄老師', LILITH = '解憂時代 莉莉絲老師', XIEN = '解憂時代 熙恩教授';
  // 需求會議的原話：一句一個 { who, text }；投影幕那一頁、卡片內文的原話、需求討論的 segments 都用同一份
  const SAID = {
    // 母議題（網站整體）：劇本沒有原文，這句是雅雯開場轉述老師們的意思
    fate: [{ who: YAWEN, text: '網站整體的感覺、顏色，老師們說都好，交給專業。' }],
    profile: [
      { who: YAWEN, text: '客人來，先建一張自己的資料。' },
      { who: YAWEN, text: '資料填寫的表單設計交給你們專業的決定，老師們都沒意見，能算就好。' },
      { who: YAWEN, text: '很多客人是幫爸媽、小孩問的。' },
    ],
    // 三位老師各講一句：投影幕、卡片內文照劇本原文帶說話的人
    chart: [
      { who: JINGXUAN, text: '瀞玄：八字、紫微，都好，排得準就好。' },
      { who: LILITH, text: '莉莉絲：星盤和生命靈數也拜託了～' },
      { who: XIEN, text: '熙恩：16 型人格和血型，從量子的角度，其實是同一件事。' },
    ],
    reading: [
      { who: JINGXUAN, text: '排完盤，客人最想問的就是今年怎麼樣、跟另一半合不合。' },
      { who: JINGXUAN, text: '六張盤都要講到。' },
      { who: JINGXUAN, text: '不過嘛……天機不能洩漏。' },
    ],
    booking: [
      { who: YAWEN, text: '老師說客人看完盤，有緣的自然會想預約。' },
      { who: YAWEN, text: '三位老師的時間不一樣，價格喔，老師都隨喜，交給專業。' },
      { who: YAWEN, text: '沒空來的客人，也可以請老師親算，算好寄給他。' },
    ],
    // 模組池・瀞玄池
    lot: [
      { who: JINGXUAN, text: '客人每天可以來求一支籤。' },
      { who: JINGXUAN, text: '用哪一套籤，都好。' },
      { who: JINGXUAN, text: '神明的意思，要問過才算數。' },
    ],
    bird: [
      { who: JINGXUAN, text: '我們有一隻文鳥，很靈。' },
      { who: JINGXUAN, text: '客人報上名字生辰，牠就會幫你叼牌。' },
      { who: JINGXUAN, text: '拍起來怎麼放到網站上，都好，交給專業。' },
    ],
    lamp: [
      { who: YAWEN, text: '老師和廟裡有合作，客人可以線上點燈，我們幫忙送過去。' },
      { who: YAWEN, text: '要填什麼資料，老師說都好，照廟裡的規矩。' },
      { who: YAWEN, text: '過年前最多人點。' },
    ],
    // 模組池・莉莉絲池
    monthly: [
      { who: LILITH, text: '每個月一號，十二星座的運勢要上線～' },
      { who: LILITH, text: '文章我來寫，怎麼放都好呀。' },
      { who: LILITH, text: '星座的分法嘛，大家都知道的。' },
    ],
    lucky: [
      { who: LILITH, text: '每個人每天都有自己的幸運色、幸運數字、幸運方位，還有幸運物～' },
      { who: LILITH, text: '怎麼算都好呀，交給專業。' },
      { who: LILITH, text: '幸運物嘛，我工作室剛好有一些水晶。' },
    ],
    tarot: [
      { who: LILITH, text: '客人每天可以抽一張塔羅，看今天的提醒～' },
      { who: LILITH, text: '正位逆位都好呀。' },
    ],
    // 模組池・熙恩池
    quiz: [
      { who: XIEN, text: '我們的測驗是有科學根據的。' },
      { who: XIEN, text: '題目怎麼排都好，量子的觀點來看，順序不影響結果。' },
      { who: XIEN, text: '結果要讓客人覺得「這就是我」。' },
    ],
    comic: [
      { who: XIEN, text: '每週一篇四格漫畫，用血型和 16 型人格講職場和感情。' },
      { who: XIEN, text: '什麼時候上架都好，宇宙能量在週五最強。' },
    ],
    column: [
      { who: XIEN, text: '我的專欄文章，要讓讀者感受到科學的力量。' },
      { who: XIEN, text: '排版都好，交給專業。' },
    ],
  };
  // 需求會議的題庫：鍵是原文第幾句（0 起算）。一段好幾題（陣列）時同時出現，各問各的（三位老師各一題）
  // 回答的人：題目寫了 who 就是他，沒寫就是投影幕那頁的說話人；回答裡換人講的，句首標那個人的名字（Works.replyLine）
  const ASKS = {
    // 只有請三位老師幫網站排盤，才問得出配色（喜用神）和吉數；三色帶進網站門面、吉數取聯集帶進 #504 的價格
    fate: {
      0: { text: '瀞玄：「顏色都好，交給專業。」', who: JINGXUAN,
           options: ['「三位老師，可以幫網站上線那天排個盤嗎？」', '「瀞玄老師，可以幫網站上線那天排個盤嗎？」', '「要什麼顏色？」', '「老師缺水，那用藍色系？」'], answer: 0,
           replies: ['三位第一次正眼看你：「這個問題問得好。」瀞玄：「上線那天喜金，白和金，吉數 4、9。」莉莉絲：「網站的守護星是金星，粉紅色，吉數 6。」熙恩：「頂輪的頻率，紫羅蘭，528 赫茲。」',
                     '瀞玄：「上線那天喜金，白和金，吉數 4、9。」莉莉絲：「都好呀，只是金星會吃醋。」',
                     '「交給專業。」',
                     '熙恩：「藍色對應到喉輪，會讓這個網站的能量傳輸專注在言詞表達上，是很好但稍微可惜。」'] },
    },
    profile: {
      1: [
        { text: '莉莉絲：「都好呀。」', who: LILITH, options: ['「莉莉絲老師，星盤需要出生地嗎？」', '「好。」'], answer: 0,
          replies: ['「都好呀。不過……少了出生地，上升星座就跟水逆一樣亂。」', '「讚。」'] },
        { text: '瀞玄：「都好。」', who: JINGXUAN, options: ['「瀞玄老師，生日用國曆還是農曆？」', '「好。」'], answer: 0,
          replies: ['「都好。只是……閏月出生的人，最怕被當成平常月。」', '「讚。」'] },
        { text: '熙恩：「都好。」', who: XIEN, options: ['「熙恩教授，需要什麼？」', '「好。」'], answer: 0,
          replies: ['「都好，從宇宙能量的觀點，血型是最基礎的頻率。」', '「讚。」'] },
      ],
      2: { text: '雅雯：「很多客人是幫爸媽、小孩問的。」', options: ['「長輩不知道出生時間怎麼辦？」', '「家人的資料也要填一樣多嗎？」'], answer: 0,
           replies: ['莉莉絲：「都好。不知道的……就讓星星自己決定。」', '「都好，交給專業。」'] },
    },
    // 投影幕那頁是三位老師各講一句，每題寫是問誰
    chart: {
      0: { text: '瀞玄：「八字、紫微，都好，」', who: JINGXUAN, options: ['「八字和紫微的換年要分開算嗎？」', '「統一用國曆一月一日換年可以嗎？」'], answer: 0,
           replies: ['「都好。立春和正月初一……本來就不是同一天。」', '「都好。」'] },
      1: { text: '莉莉絲：「星盤和生命靈數也拜託了～」', who: LILITH, options: ['「生命靈數的 11 要再加成 2 嗎？」', '「好。」'], answer: 0,
           replies: ['「都好呀～加不加都有派別支持，但主數是 11 的倍數的人會有一些幽微的特質。」', '「讚。」'] },
    },
    reading: {
      2: { text: '瀞玄：「不過嘛……天機不能洩漏。」', options: ['「解說要全部顯示嗎？」', '「解說要寫多長？」', '「好。」'], answer: 0,
           replies: ['「都好。天機……不能說盡。我們這種給出命運提示的人，需要收錢消災解厄。」', '「都好，你們專業的決定。」', '「讚。」'] },
    },
    // 投影幕那頁的說話人是雅雯，老師回的那句前面標老師的名字
    booking: {
      1: [
        { text: '雅雯：「價格喔，老師說都好，」', options: ['「價格可以照剛剛排盤算出來的吉數定嗎？」', '「價格要定多少？」', '「要不要做優惠價？」', '「好。」'], answer: 0,
          replies: ['瀞玄：「都好。只是……數字對了，福氣才接得住。」', '「交給專業。」', '瀞玄：「都好。不過……打折會折到福氣。」', '「讚。」'] },
        { text: '雅雯：「三位老師的時間不一樣，」', options: ['「三位老師可以排同一個時段嗎？」', '「好。」'], answer: 0,
          replies: ['熙恩：「也可以，只是同時被三種能量諮詢，客人的頻率會亂掉。」', '「讚。」'] },
      ],
      2: [
        { text: '雅雯：「沒空來的客人，也可以請老師親算，算好寄給他。」', options: ['「客人看完詳解回信問問題，要接回原本那張單嗎？」', '「好。」'], answer: 0,
          replies: ['「都好……不過上次有客人回信問『第三段什麼意思』，我翻了一個下午才找到是誰。」', '「讚。」'] },
        { text: '雅雯：「沒空來的客人，也可以請老師親算，算好寄給他。」', options: ['「三位老師的詳解寄到同一個客人，信要怎麼分？」', '「好。」'], answer: 0,
          replies: ['莉莉絲：「都好呀～只是上次有客人以為瀞玄在講星座。」', '「讚。」'] },
      ],
    },
    // 模組池・瀞玄池：只有一個問法的題目補「好。」當最後一個（交給 AI 問時選它）
    lot: {
      1: { text: '瀞玄：「用哪一套籤，都好。」', options: ['「老師平常用哪一套？六十甲子籤還是觀音一百籤？」', '「好。」'], answer: 0,
           replies: ['「都好。我是在媽祖廟學的。」', '「讚。」'] },
      2: { text: '瀞玄：「神明的意思，要問過才算數。」', options: ['「要擲幾個聖筊才算？」', '「三個聖筊可以嗎？」'], answer: 0,
           replies: ['「都好。神明願意給幾個，就是幾個。」', '「都好。」'] },
    },
    bird: {
      1: { text: '瀞玄：「牠就會幫你叼牌。」', options: ['「卦牌一共幾張？」', '「好。」'], answer: 0,
           replies: ['「都好。基本是文王聖卦廿四籤，最常見的是正統 36 卦，但傳統卦牌無法因應時代變遷，所以在神明指引下我們做了瀞玄六十四張。」', '「讚。」'] },
      2: { text: '瀞玄：「拍起來怎麼放到網站上，都好，」', options: ['「每次是真的讓鳥叼，還是先拍好每張牌的影片？」', '「直播嗎？」'], answer: 0,
           replies: ['「都好。鳥也是要休息的。」', '「都好。只是凌晨三點有人來求，鳥會生氣。」'] },
    },
    // 投影幕那頁的說話人是雅雯，老師回的那句前面標老師的名字
    lamp: {
      1: { text: '雅雯：「要填什麼資料，老師說都好，照廟裡的規矩。」', options: ['「可以給我廟裡的報名規定嗎？」', '「好。」'], answer: 0,
           replies: ['「老師說都好……我傳給你。」', '「讚。」'] },
      2: { text: '雅雯：「過年前最多人點。」', options: ['「犯太歲的名單要照哪一份？」', '「好。」'], answer: 0,
           replies: ['瀞玄：「都好。不過……照我排的。」', '「讚。」'] },
    },
    // 模組池・莉莉絲池：只有一個問法的題目補「好。」當最後一個（交給 AI 問時選它）
    monthly: {
      0: { text: '莉莉絲：「每個月一號，十二星座的運勢要上線～」', options: ['「可以先寫好、到時間自動上線嗎？」', '「好。」'], answer: 0,
           replies: ['「都好呀～我月底常常在逆行。」', '「讚。」'] },
      2: { text: '莉莉絲：「星座的分法嘛，大家都知道的。」', options: ['「交界那幾天出生的，要看出生時間嗎？」', '「照網路上的日期表可以嗎？」'], answer: 0,
           replies: ['「都好呀～不過太陽可不看日曆。」', '「都好呀。」'] },
    },
    // 幸運數字那題瀞玄補的半句是故意的誤導（網站的吉數只管網站的價格），問到了也不帶進任何文件
    lucky: {
      0: { text: '莉莉絲：「每個人每天都有自己的幸運數字」', options: ['「幸運數字有範圍嗎？」', '「好。」'], answer: 0,
           replies: ['「都好呀～每個人的星盤會告訴你。」瀞玄在旁邊補半句：「任何人事物都有吉數，像網站的盤也能看出它的吉數。」', '「讚。」'] },
      1: { text: '莉莉絲：「怎麼算都好呀，」', options: ['「每個人的要照資料卡算，還是同星座都一樣？」', '「好。」'], answer: 0,
           replies: ['「都好呀～只是每個人的星盤都不一樣。」', '「讚。」'] },
      2: { text: '莉莉絲：「幸運物嘛，我工作室剛好有一些水晶。」', options: ['「幸運物要連到購買頁嗎？」', '「好。」'], answer: 0,
           replies: ['「都好呀～幸運要帶回家才會留下來。」', '「讚。」'] },
    },
    tarot: {
      0: { text: '莉莉絲：「客人每天可以抽一張塔羅」', options: ['「同一天重抽可以嗎？」', '「好。」'], answer: 0,
           replies: ['「都好呀。不過……牌是不會說謊的。」', '「讚。」'] },
      1: { text: '莉莉絲：「正位逆位都好呀。」', options: ['「逆位要讀嗎？」', '「好。」'], answer: 0,
           replies: ['「都好呀～但有些牌型不讀逆位的話，會錯過一些訊息。」', '「讚。」'] },
    },
    // 模組池・熙恩池：只有一個問法的題目補「好。」當最後一個（交給 AI 問時選它）
    quiz: {
      0: { text: '熙恩：「我們的測驗是有科學根據的。」', options: ['「結果頁要附參考資料嗎？」', '「好。」'], answer: 0,
           replies: ['「都好。但不能因為普遍案例就忽視特殊個案，親眼認證比較重要。」', '「讚。」'] },
      2: { text: '熙恩：「結果要讓客人覺得『這就是我』。」', options: ['「測完可以重測嗎？」', '「好。」'], answer: 0,
           replies: ['「都好。只是量子態一旦觀測，就坍縮了。」', '「讚。」'] },
    },
    comic: {
      0: { text: '熙恩：「用血型和 16 型人格講職場和感情。」', options: ['「可以照讀者自己的血型推薦嗎？」', '「好。」'], answer: 0,
           replies: ['「都好。同頻率的人會互相吸引。」', '「讚。」'] },
      1: { text: '熙恩：「什麼時候上架都好，宇宙能量在週五最強。」', options: ['「可以排程每週五自動上架嗎？」', '「好。」'], answer: 0,
           replies: ['「都好。週五晚上八點，頻率最穩定。」', '「讚。」'] },
    },
    column: {
      0: { text: '熙恩：「要讓讀者感受到科學的力量。」', options: ['「文章裡的『研究顯示』要附連結嗎？」', '「好。」'], answer: 0,
           replies: ['「都好。連結要能連到星際頻道。」', '「讚。」'] },
      1: { text: '熙恩：「排版都好，交給專業。」', options: ['「要放公式嗎？」', '「好。」'], answer: 0,
           replies: ['「都好。有公式，讀者就會相信。」', '「讚。」'] },
    },
  };
  // 投影幕頁首寫誰講的：一個人講完整頁就寫那個人，好幾位老師各講一句寫「三位老師」（各句前面已經標了誰）
  const speakers = (id) => (new Set(SAID[id].map(s => s.who)).size > 1 ? '三位老師' : SAID[id][0].who);
  const QUESTION = (id) => ({ kind: 'discuss', segments: SAID[id].map(s => s.text), asks: ASKS[id] || {} });
  const meetingDiscuss = (id) => ({ work: 'discuss', question: { ...QUESTION(id), fromMeeting: id } });   // 唯讀：散會時記成做完
  const bodyOf = (lines, id, who = '需求單位：解憂時代事務所 助理雅雯') => `${who}\n${lines.map(l => `・${l}`).join('\n')}\n\n需求會議原話：\n${SAID[id].map(s => s.text).join('\n')}`;
  const deployOf = (smoke) => ({ work: 'deploy', question: { roles: { backup: 0, upload: 1, replace: 2, smoke: 3, notify: 4 },
    items: [{ text: '步驟', type: 'order', options: ['備份測試機上的解憂時代網站', '上傳新版', '替換', smoke, '通知雅雯'], answer: [0, 1, 2, 3],
      why: '通知雅雯要等 QC 驗過，從已完成的卡上按' }] } });

  // ── #501 個人資料卡 ──
  // 會議問到的（退回 SA 勾到也算）：前端程式、規格的帶入條件用這幾個
  const ASKED = {
    place: [{ work: 'discuss', item: 1, sub: 0, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],     // 莉莉絲：星盤要出生地
    lunar: [{ work: 'discuss', item: 1, sub: 1, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],     // 瀞玄：閏月
    blood: [{ work: 'discuss', item: 1, sub: 2, picked: 0 }, { work: 'reject', item: 0, picked: 2 }],     // 熙恩：血型
    unknown: [{ work: 'discuss', item: 2, picked: 0 }, { work: 'reject', item: 0, picked: 3 }],          // 長輩不知道出生時間
  };
  const PROFILE_FIELDS = [0, 1, 2, 3, 4];   // 規格第 3 題的正解（第 6 項「星座、生肖讓客人自己選」是陷阱）
  const PROFILE = {
    id: 'profile', title: '個人資料卡', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    evening: { good: '熙恩教授說填資料的過程很有儀式感，客人填完都安靜下來了。', bad: '瀞玄老師說一頁就填完，客人會覺得我們不認真。' },
    body: bodyOf(['客人建立自己的生辰資料', '一張資料三位老師都能用', '可以幫家人建資料'], 'profile'),
    attachments: ['原文：09:30 廠商需求會議（雅雯）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '星盤需要出生地嗎？', right: true, adds: '出生地要有，時間要到分（莉莉絲老師：少了出生地，上升星座就跟水逆一樣亂）', asked: 1 },
      { text: '生日用國曆還是農曆？', right: true, adds: '國曆、農曆都要，農曆要有是否閏月（瀞玄老師：閏月出生的人，最怕被當成平常月）', asked: 1 },
      { text: '熙恩教授需要什麼資料？', right: true, adds: '要血型（熙恩教授：從宇宙能量的觀點，血型是最基礎的頻率）', asked: 1 },
      { text: '長輩不知道出生時間怎麼辦？', right: true, adds: '出生時間可以選「不知道」（莉莉絲老師：不知道的就讓星星自己決定）', asked: 2 },
      { text: '家人的資料也要填一樣多嗎？', right: false, why: '老師說都好，交給專業。' },
    ] }],
    screen: { app: '解憂時代事務所・我的資料卡', fields: ['關係', '姓名', '國曆生日', '農曆', '出生時間', '出生地', '血型'],
      rows: [['本人', '施宛臻', '1984/10/21', '甲子年九月廿七', '14:20（未時）', '嘉義縣阿里山鄉', 'A'],
             ['子女', '陳以樂', '2020/05/23', '庚子年閏四月初一', '23:30（晚子）', '台中市', 'O'],
             ['母', '林美鳳', '1958/04/02', '戊戌年二月十四', '不知道', '台南市', 'B'],
             ['配偶', '陳景淳', '1979/07/15', '己未年六月廿二', '10:00（已依當年的時制校正，標準時間 09:00，巳時）', '高雄市', 'O'],
             ['子女', '陳宥琳', '2026/02/10', '乙巳年臘月廿三', '08:15（辰時）', '台中市', 'A']],
      bugs: {
        toLunar: { voice: '瀞玄：「都好。只是……這孩子是閏四月生的，你們把她當成平常月了。」', row: 1, cells: { '農曆': '庚子年四月初一' } },
        birthHour: { voice: '瀞玄：「都好。只是晚子出生的，你們幫他提早過了生日。」', row: 1, cells: { '出生時間': '子時（隔天）' } },
        geoPlace: { voice: '莉莉絲：「都好呀～只是她的上升星座搬去台北了。」', cells: { '出生地': '嘉義縣阿里山鄉（25.03, 121.56）' } },
        addFamily: { voice: '雅雯：「客人幫媽媽建完，自己那張不見了。」', cells: {} },
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['客人先建一張自己的資料', '表單怎麼設計交給 IT', '三位老師都要能算', '很多客人幫爸媽、小孩問'],
        items: [
          { text: '客人來，先____', options: ['建一張自己的生辰資料', '直接排盤', '預約老師'], answer: 0 },
          { text: '這張資料____', options: ['三位老師都要能用', '給瀞玄老師用就好', '每位老師各填一張'], answer: 0 },
          { text: '幫爸媽、小孩問的客人____', options: ['一個帳號底下可以建好幾張', '每個家人各註冊一個帳號', '只能建自己的'], answer: 0 },
          { text: '「老師們都沒意見，能算就好」是____', options: ['還沒問到要哪些資料，不是沒有要求', '表單隨便做就好', '欄位越少越好'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
        ] } },
      meetingDiscuss('profile'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '個人資料卡連測試、驗收、部署，你估：', ai: { pick: 16 },
        real: { manual: '約 2 週', ai: '約 1 週', note: '萬年曆和夏令時間最花時間' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['設計資料卡資料表', '填資料的流程頁', '國曆、農曆互轉', '出生時間：時辰（早子、晚子分開）到分', '出生時間可以選「不知道」',
                  '出生地換成經緯度和時區', '夏令時間校正', '一個帳號底下多張資料卡、標關係', '寫測試', '部署到測試機', '做手機拍照看面相', '串接戶政系統自動帶生日'],
        answer: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        before: [[0, 1], [0, 2], [0, 3], [0, 5], [0, 7], [2, 6], [3, 6], [5, 6], [1, 9], [6, 9], [7, 9], [8, 9]],
        why: '面相、戶政系統都不在需求裡；夏令時間校正要用換算好的時間和時區',
        given: [
          { work: 'read_req', options: [1], when: { item: 0, picked: 0 } }, { work: 'read_req', options: [0], when: { item: 1, picked: 0 } },
          { work: 'read_req', options: [7], when: { item: 2, picked: 0 } },
          { work: 'discuss', options: [3, 5], when: { item: 1, sub: 0, picked: 0 } }, { work: 'discuss', options: [2], when: { item: 1, sub: 1, picked: 0 } },
          { work: 'discuss', options: [4], when: { item: 2, picked: 0 } },
          // 退回 SA 問回來的視同會議問過
          { work: 'reject', options: [3, 5], when: { item: 0, picked: 0 } }, { work: 'reject', options: [2], when: { item: 0, picked: 1 } },
          { work: 'reject', options: [4], when: { item: 0, picked: 3 } },
        ] }] } },
      // 規格：資料要算對，這裡不倒過來；只負責預填後端程式（規格連動的 function）
      { work: 'doc_spec', question: { items: [
        { text: '夏令時間（1946～1961、1974、1975、1979 實施過；1937-10～1945-09-21 台灣用 UTC+9）',
          options: ['用標準時區資料庫（Asia/Taipei）換算成標準時間再排盤，資料卡上標「已依當年的時制校正」', '自己寫一張年表', '照填的時間直接排'], answer: 0 },
        { text: '「不知道出生時間」', options: ['照存，六張盤裡用得到時間的各自照慣例處理（占星不排宮位、八字和紫微標「時辰未知」）', '存成 00:00'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: ASKED.unknown }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 4 } }] },
        { text: '資料卡存哪些欄位',
          options: ['國曆生日', '農曆生日和是否閏月', '出生時間（到分，可以「不知道」）', '出生地的經緯度和時區', '血型', '星座、生肖讓客人自己選'], answer: PROFILE_FIELDS,
          why: '星座、生肖要從生日算',
          given: [
            { work: 'read_req', options: [0], when: { item: 1, picked: 0 } }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 0 } },
            { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } }, { work: 'doc_plan', options: [3], when: { item: 0, picked: 5 } },
            { work: 'discuss', options: [1], when: ASKED.lunar }, { work: 'discuss', options: [4], when: ASKED.blood },
          ] },
      ] } },
      // 前端程式：對錯倒過來——照常理做的老師不滿（QC 不退），正解難用、阿姿在群組抱怨；漏做的 QC 照樣退
      { work: 'ui_design', question: { items: [
        { text: '填資料的流程', options: ['一頁一題、每頁一句引導語（「請靜心回想您降生的時刻」），全部填完才看得到盤', '一頁填完、欄位分組清楚'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'displeased', say: '這麼隨便，客人會覺得我們不認真。' } } },
        { text: '出生時間', options: ['時辰下拉，早子、晚子分開；也可以填到分；可以選「不知道」', '只有時辰、沒有分', '時辰只有 12 格、子時一格', '一定要填'], answer: 0, ifSkipped: [2, 3],
          outcome: { 1: { kind: 'miss', say: '星盤上升星座算錯' }, 2: { kind: 'miss', say: '子時沒有分早子、晚子' }, 3: { kind: 'miss', say: '阿媽不知道幾點生的，卡在這頁' } },
          given: [
            { work: 'discuss', options: [0], when: { all: [ASKED.place, ASKED.unknown] }, sentence: 0 },   // 兩題都問到才排除得了所有錯的
            { work: 'doc_plan', options: [0], when: { all: [{ item: 0, picked: 3 }, { item: 0, picked: 4 }] }, sentence: 0 },
            { work: 'doc_spec', options: [0], when: { item: 2, picked: 2 }, sentence: 0 },
          ] },
        { text: '生日', options: ['國曆、農曆擇一輸入，另一個自動換算顯示；農曆有「是否閏月」', '只有國曆', '農曆沒有閏月'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'miss', say: '阿媽只記得農曆' }, 2: { kind: 'miss', say: '閏月出生的，紫微盤整個排錯', wrongChart: true } },
          given: [
            { work: 'discuss', options: [0], when: ASKED.lunar, sentence: 0 },
            { work: 'doc_plan', options: [0], when: { all: [{ item: 0, picked: 2 }, { work: 'doc_spec', item: 2, picked: 1 }] }, sentence: 0 },
          ] },
        { text: '出生地', options: ['縣市下拉，國外的另外選', '文字框'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'miss', say: '打『阿里山』查不到經緯度' } },
          given: [
            { work: 'discuss', options: [0], when: ASKED.place, sentence: 1 }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 5 }, sentence: 1 },
            { work: 'doc_spec', options: [0], when: { item: 2, picked: 3 }, sentence: 1 },
          ] },
        { text: '家人', options: ['一個帳號底下可以建多張，每張標關係（本人、父、母、子女……）', '一個帳號只能一張'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'miss', say: '幫伴侶問要重新註冊一個帳號' } },
          given: [{ work: 'doc_plan', options: [0], when: { item: 0, picked: 7 }, sentence: 2 }] },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['用一張本人的資料卡，三位老師要的欄位都存得到', '輸入國曆生日，自動換出農曆，閏月出生的標「閏」', '時辰下拉的子時分成早子、晚子兩格',
                  '出生時間選「不知道」也存得了', '出生地選阿里山，帶出經緯度和時區', '1979 年 7 月出生的，時間自動減一小時', '幫媽媽建第二張資料卡，標「母」', '一萬人同時填資料的壓測'],
        answer: [0, 1, 2, 3, 4, 5, 6], why: '命理網站一天幾十個新客人',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 0 } }, { work: 'doc_plan', options: [1], when: { item: 0, picked: 2 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } }, { work: 'doc_plan', options: [3], when: { item: 0, picked: 4 } },
          { work: 'doc_plan', options: [4], when: { item: 0, picked: 5 } }, { work: 'doc_plan', options: [5], when: { item: 0, picked: 6 } },
          { work: 'doc_plan', options: [6], when: { item: 0, picked: 7 } },
          { work: 'doc_spec', options: [5], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [3], when: { item: 1, picked: 0 } },
          { work: 'doc_spec', options: [0], when: { item: 2, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 2 }, accept: 1, name: 'toLunar', does: '國曆換農曆', code: 'return calendar.toLunar(date, { leap: true });',
          fields: { how: { label: '換算照什麼', options: ['萬年曆，閏月標「閏」', '萬年曆，閏月併進前一個月', '國曆的月日直接當農曆'], answer: 0 } } },
        { sentence: 0, needs: { work: 'doc_plan', picked: 3 }, accept: 2, name: 'birthHour', does: '出生時間換成時辰', code: "return zodiacHour(time, { lateZi: 'sameDay' });",
          fields: { at2330: { label: '23:30 算哪個時辰', options: ['當天的晚子', '隔天的子時', '前一個時辰（亥時）'], answer: 0 } } },
        { sentence: 1, needs: { work: 'doc_plan', picked: 5 }, accept: 4, name: 'geoPlace', does: '出生地換經緯度', code: 'return PLACES[county]?.[town] ?? abroad.lookup(city);',
          fields: { from: { label: '經緯度從哪來', options: ['縣市對照表，國外另選城市', '一律用台北的經緯度', '不存經緯度'], answer: 0 } } },
        { sentence: 2, needs: { work: 'doc_plan', picked: 7 }, accept: 6, name: 'addFamily', does: '幫家人建資料卡', code: "db.insert('profile', { account, relation, ...form });",
          fields: { how: { label: '一個帳號底下', options: ['可以建多張，各自標關係', '只能一張，新的蓋掉舊的', '可以建多張，不標關係'], answer: 0 } } },
        // 規格連動：spec.item 是規格第幾題，選項跟規格那題一一對應；後果掛在這裡，ifSkipped 是沒寫後端程式時程式長的樣子
        { spec: { item: 0 }, name: 'dstFix', does: '夏令時間校正', code: "return toStandardTime(birth, 'Asia/Taipei');",
          fields: { flow: { label: '夏令時間', options: ['用標準時區資料庫換成標準時間，標「已依當年的時制校正」', '自己寫一張年表（只有 1974、75、79）', '照填的時間直接排'], answer: 0, ifSkipped: 2,
            // 年表有寫 1979，QC 拿 1979 年夏天驗不出來，月底才出事；照填的時間直接排 QC 驗得出來
            // 排錯的盤（結算卡「排錯的盤」數 wrongChart）：QC 沒驗出來就上線的
            outcome: { 1: { kind: 'late', say: '只寫了 1974、75、79，1950 年代出生的長輩全部差一小時', wrongChart: true }, 2: { kind: 'miss', say: '1979 年夏天出生的，上升星座整個錯', wrongChart: true } } } } },
        { spec: { item: 1 }, name: 'unknownTime', does: '不知道出生時間', code: 'return form.time ?? UNKNOWN_TIME;',
          fields: { flow: { label: '不知道出生時間', options: ['照存「不知道」，各張盤照慣例處理', '存成 00:00'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'miss', say: '不知道的全部變成子時出生' } } } } },
        // 規格第 3 題是多選：五欄都勾、沒勾陷阱＝都存；勾了「讓客人自己選」＝第 3 個；其他（少勾）＝少存
        { spec: { item: 2, pick: (chosen) => (chosen.includes(5) ? 2 : PROFILE_FIELDS.every(i => chosen.includes(i)) ? 0 : 1) },
          name: 'profileFields', does: '資料卡存的欄位', code: "db.insert('profile', pick(form, PROFILE_FIELDS));",
          fields: { flow: { label: '資料卡存的欄位', options: ['國曆、農曆和閏月、時間到分、出生地經緯度、血型都存', '只存國曆生日和時辰', '星座、生肖讓客人自己選'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'miss', say: '少存的欄位，用到它的盤排不出來' }, 2: { kind: 'miss', say: '2016 年 3/20 早上出生、自己選了牡羊，算出來是雙魚' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testFields', does: '資料卡的欄位', code: "expect(Object.keys(saved)).toEqual(expect.arrayContaining(PROFILE_FIELDS));",
          fields: { assert: { label: '檢查', options: ['存完國曆、農曆、時間、出生地、血型都有值', '國曆生日有值就好', '存得進去就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testLeapMonth', does: '閏月換得出來', code: "expect(toLunar('2020/05/23')).toBe('庚子年閏四月初一');",
          drives: [{ fn: 'toLunar', field: 'how', map: { 0: 0, 1: 1 } }, { ui: 2, map: { 0: 0, 1: 2 } }],
          fields: { assert: { label: '檢查', options: ['2020/05/23 換成閏四月初一', '換成四月初一', '換得出農曆就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testLateZi', does: '23:30 的時辰', code: "expect(birthHour('23:30')).toBe('晚子');",
          drives: [{ fn: 'birthHour', field: 'at2330', map: { 0: 0, 1: 1 } }, { ui: 1, map: { 0: 0, 1: 2 } }],
          fields: { assert: { label: '檢查', options: ['23:30 是當天的晚子', '23:30 是隔天的子時', '時辰不是空的就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testUnknownTime', does: '不知道出生時間', code: 'expect(save({ time: UNKNOWN_TIME }).time).toBe(UNKNOWN_TIME);',
          drives: [{ fn: 'unknownTime', field: 'flow', map: { 0: 0, 1: 1 } }, { ui: 1, map: { 0: 0, 1: 3 } }],
          fields: { assert: { label: '檢查', options: ['選「不知道」，存起來還是「不知道」', '存起來是 00:00', '存得進去就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 4 }, name: 'testAlishan', does: '阿里山的經緯度', code: "expect(geoPlace('嘉義縣', '阿里山鄉').lat).toBeCloseTo(23.5, 0);",
          drives: [{ fn: 'geoPlace', field: 'from', map: { 0: 0, 1: 1 } }, { ui: 3, map: { 0: 0 } }],
          fields: { assert: { label: '檢查', options: ['阿里山帶出北緯 23.5、東經 120.8 附近', '帶出台北的經緯度', '經緯度不是空的就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 5 }, name: 'testDst1979', does: '1979 年夏天出生', code: "expect(toStandardTime('1979/07/15 10:00')).toBe('09:00');",
          drives: { fn: 'dstFix', field: 'flow', map: { 0: 0, 1: 2 } },
          fields: { assert: { label: '檢查', options: ['1979/07/15 10:00 換成標準時間 09:00', '還是 10:00', '變成 11:00'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 6 }, name: 'testFamily', does: '幫家人建第二張', code: "addFamily('母', mom); expect(profiles(account)).toHaveLength(2);",
          drives: [{ fn: 'addFamily', field: 'how', map: { 0: 0, 2: 1 } }, { ui: 4, map: { 0: 0, 2: 1 } }],
          fields: { assert: { label: '檢查', options: ['建完「母」，本人那張還在', '帳號底下有一張就好', '新的蓋掉舊的'], answer: 0 } } },
        { name: 'testTenThousand', does: '一萬人同時填資料', code: '// 命理網站一天幾十個新客人',
          fields: { assert: { label: '要不要測', options: ['命理網站一天幾十個新客人，不用測', '一萬人同時填', '一千人同時填'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址建一張資料卡試試'),
    ],
  };

  // ── #502 六大排盤 ──
  const CHART_ASKED = {
    year: [{ work: 'discuss', item: 0, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],     // 瀞玄：八字看立春、紫微看正月初一
    eleven: [{ work: 'discuss', item: 1, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],   // 莉莉絲：主數 11
  };
  // 跨卡：抽到心理測驗精選，而且它的規格或計畫寫了結果存到資料卡，16 型人格才有做過的結果可選；沒抽到照這張卡自己的測驗，不帶
  const QUIZ_SAVED_TO_PROFILE = [{ card: 'quiz', work: 'doc_spec', item: 0, picked: 0 }, { card: 'quiz', work: 'doc_plan', item: 0, picked: 3 }];
  const CHART = {
    id: 'chart', title: '六大排盤', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    evening: { good: '瀞玄老師說羅盤轉的那幾秒，客人都屏住呼吸。', bad: '瀞玄老師說盤一下子就跑出來，客人以為是電腦隨便算的。' },
    body: bodyOf(['排八字和紫微斗數', '排星盤和生命靈數', '排 16 型人格和血型'], 'chart'),
    attachments: ['原文：09:30 廠商需求會議（三位老師）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '八字和紫微的換年要分開算嗎？', right: true, adds: '八字照立春、紫微照正月初一換年，分開算（瀞玄老師：立春和正月初一本來就不是同一天）', asked: 0 },
      { text: '生命靈數的 11 要再加成 2 嗎？', right: true, adds: '生命靈數列出各派算法，主數 11 另外標（莉莉絲老師：加不加都有派別支持，但主數是 11 的倍數的人會有一些幽微的特質）', asked: 1 },
      { text: '統一用國曆一月一日換年可以嗎？', right: false, why: '老師說都好。' },
    ] }],
    screen: { app: '解憂時代事務所・六大排盤', fields: ['資料卡', '八字年柱', '紫微', '星盤（太陽／上升）', '生命靈數', '16 型人格', '血型'],
      rows: [['施宛臻（本人）', '甲子', '甲子年', '天秤／上升水瓶', '8', 'ISFJ', 'A'],
             ['林美鳳（母）', '戊戌', '戊戌年', '牡羊／（時辰未知，不排宮位）', '11／2', '（還沒做測驗）', 'B'],
             ['陳宥琳（子女，2026/02/10 出生）', '丙午', '乙巳年', '水瓶／上升天蠍', '4', '（還沒做測驗）', 'A']],
      bugs: {
        readProfile: { voice: '雅雯：「客人說星盤和血型盤都是空的。」', cells: {} },   // 星盤、血型兩欄整欄空白
        ascendant: { voice: '莉莉絲：「都好呀～只是上升跟太陽一樣，你把她的面具拿掉了。」', cells: { '星盤（太陽／上升）': '天秤／上升天秤' } },
        bloodChart: { voice: '熙恩：「都好。只是血型和人格的頻率被你們疊在一起了。」', cells: { '血型': 'ISFJ' } },
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['瀞玄要八字、紫微，排得準就好', '莉莉絲要星盤、生命靈數', '熙恩要 16 型人格、血型'],
        items: [
          { text: '要排的盤是____', options: ['八字、紫微、星盤、生命靈數、16 型人格、血型六張', '八字和紫微兩張', '每位老師挑一張'], answer: 0 },
          { text: '「排得準就好」是說____', options: ['盤要算對', '介面要好用', '排得快就好'], answer: 0 },
          { text: '「16 型人格和血型，從量子的角度，其實是同一件事」是____', options: ['熙恩的口頭禪，兩張盤各排各的', '16 型人格和血型做成同一張盤', '只做血型就好'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
        ] } },
      meetingDiscuss('chart'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '六大排盤連測試、驗收、部署，你估：', ai: { pick: 48 },
        real: { manual: '約 2 個月', ai: '約 3 週', note: '八字、紫微兩套排盤最花時間' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['讀 #501 的資料卡', '八字排盤', '紫微斗數排盤', '星盤', '生命靈數', '16 型人格', '血型', '三派的換年各算各的', '寫測試', '部署到測試機',
                  '做手機 AR 看手相', '自己訓練一個 AI 解盤模型'],
        answer: [0, 7, 1, 2, 3, 4, 5, 6, 8, 9],
        before: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [7, 1], [7, 2], [7, 4],
                 [1, 9], [2, 9], [3, 9], [4, 9], [5, 9], [6, 9], [8, 9]],
        why: 'AR 看手相、自己訓練解盤模型都不在需求裡；換年要先分好，八字、紫微、生命靈數才排得對',
        // 讀資料卡前面沒有文件寫到（跨卡）
        given: [
          { work: 'read_req', options: [1, 2, 3, 4, 5, 6], when: { item: 0, picked: 0 } },
          { work: 'discuss', options: [7], when: CHART_ASKED.year },
        ] }] } },
      // 規格：資料要算對（換年）；生命靈數、16 型人格這兩題倒過來，寫錯只被老師嫌。只負責預填後端程式
      { work: 'doc_spec', question: { items: [
        { text: '換年', options: ['八字照立春、紫微照農曆正月初一、生命靈數照國曆，各算各的', '三張盤共用同一個年份'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: CHART_ASKED.year }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 7 } }] },
        { text: '生命靈數', options: ['列出不同的派別', '照一般算法一路加到個位數'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: CHART_ASKED.eleven }] },
        { text: '16 型人格', options: ['沒做過的先做熙恩教授的測驗，做過的直接選結果', '讓使用者照描述自己填四個字母'], answer: 0,
          given: [{ work: 'doc_spec', options: [0], when: QUIZ_SAVED_TO_PROFILE }] },
      ] } },
      // 前端程式：對錯倒過來，兩題都沒有漏做的選項；照常理做的老師不滿，正解阿姿抱怨
      { work: 'ui_design', question: { items: [
        { text: '排盤的過程', options: ['按下去先轉一段羅盤和星盤的動畫、出現「正在推算」，等幾秒才出結果', '按下去馬上出結果'], answer: 0, ifSkipped: 1, ritual: { 0: 'compass' },
          outcome: { 0: { kind: 'gripe' }, 1: { kind: 'displeased', say: '這麼快，客人會覺得是電腦隨便算的。' } } },
        { text: '六張盤怎麼放', options: ['一次只看一張，換盤要再轉一次羅盤', '六張並排一頁看完'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'displeased', say: '一眼看完，就不會想問了。' } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['用一張資料卡排出六張盤', '2026 年 2/10 出生的（立春後、春節前），八字是丙午年、紫微還是乙巳年', '生日加總是 11 的，生命靈數列出各派的算法',
                  '沒做過測驗的，先做測驗才排得出 16 型人格', '血型 O 型的排得出血型盤', '六張盤一秒內排完的效能測試'],
        answer: [0, 1, 2, 3, 4], why: '老師要轉羅盤，不用測快',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 0 } }, { work: 'doc_plan', options: [1], when: { item: 0, picked: 7 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 4 } }, { work: 'doc_plan', options: [3], when: { item: 0, picked: 5 } },
          { work: 'doc_plan', options: [4], when: { item: 0, picked: 6 } },
          { work: 'doc_spec', options: [1], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [2], when: { item: 1, picked: 0 } },
          { work: 'doc_spec', options: [3], when: { item: 2, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 0 }, accept: 0, name: 'readProfile', does: '讀資料卡', code: "return profiles.read(cardId, ['birth', 'time', 'place', 'blood']);",
          fields: { read: { label: '排盤讀哪些欄位', options: ['生日、時間、出生地、血型都讀', '只讀國曆生日', '每次讓客人重填'], answer: 0 } } },
        { sentence: 1, needs: { work: 'doc_plan', picked: 3 }, accept: 0, name: 'ascendant', does: '算上升星座', code: 'return ascendantOf(birth.time, place.lat, place.lng);',
          fields: { by: { label: '上升照什麼算', options: ['出生時間加出生地的經緯度', '只看出生時間', '跟太陽星座一樣'], answer: 0 } } },
        { sentence: 2, needs: { work: 'doc_plan', picked: 6 }, accept: 4, name: 'bloodChart', does: '血型盤', code: 'return BLOOD_CHARTS[profile.blood];',
          fields: { from: { label: '血型盤照什麼排', options: ['資料卡的血型', '16 型人格的結果', '隨機'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；換年錯了 QC 退（拿 2026/02/10 出生的驗），生命靈數、16 型人格錯了只被老師嫌
        { spec: { item: 0 }, name: 'yearSplit', does: '換年', code: 'return { bazi: lichunYear(birth), ziwei: lunarYear(birth), lifePath: birth.year };',
          fields: { flow: { label: '換年', options: ['八字照立春、紫微照正月初一、生命靈數照國曆，各算各的', '三張盤共用同一個年份'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'miss', say: '春節和立春之間出生的，八字跟紫微排成同一年', wrongChart: true } } } } },
        { spec: { item: 1 }, name: 'lifePath', does: '生命靈數', code: 'return lifePathBySchool(birth);',
          fields: { flow: { label: '生命靈數', options: ['列出各派算法（主數 11 另外標）', '一路加到個位數'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '11 是卓越的數字，被掩蓋在庸碌中了。' } } } } },
        { spec: { item: 2 }, name: 'typeSource', does: '16 型人格從哪來', code: 'return profile.typeResult ?? openQuiz(XIEN_QUIZ);',
          fields: { flow: { label: '16 型人格從哪來', options: ['沒做過的先做測驗，做過的直接選結果', '讓使用者照描述自己填四個字母'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'displeased', who: '熙恩教授', say: '未經觀測的量子態不會坍縮。' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testSixCharts', does: '六張盤都排得出來', code: 'expect(Object.values(charts(profile)).filter(Boolean)).toHaveLength(6);',
          fields: { assert: { label: '檢查', options: ['一張資料卡排出六張盤，每張都有內容', '排得出八字就好', '排得出來就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testLichun', does: '立春後、春節前出生', code: "expect(yearOf('2026/02/10')).toEqual({ bazi: '丙午', ziwei: '乙巳' });",
          drives: { fn: 'yearSplit', field: 'flow', map: { 0: 0, 1: 1, 2: 1 } },
          fields: { assert: { label: '檢查', options: ['2026/02/10 八字丙午、紫微乙巳', '兩張都是丙午', '兩張都是乙巳'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testMasterNumber', does: '主數 11', code: "expect(lifePath('1958/04/02')).toEqual([11, 2]);",
          drives: { fn: 'lifePath', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['1958/04/02 出生的列出 11 和 2 兩種算法', '一律算成 2', '算得出數字就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testTypeQuiz', does: '16 型人格要先做測驗', code: 'expect(typeOf(newGuest)).toBe(QUIZ_FIRST);',
          drives: { fn: 'typeSource', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['沒做過測驗的，先跳出測驗', '直接讓客人選四個字母', '有結果就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 4 }, name: 'testBloodType', does: '血型盤', code: "expect(bloodChart({ blood: 'O' }).type).toBe('O');",
          drives: { fn: 'bloodChart', field: 'from', map: { 0: 0, 2: 1 } },
          fields: { assert: { label: '檢查', options: ['O 型排出 O 型的血型盤', '血型盤有內容就好', '血型盤照 16 型人格排'], answer: 0 } } },
        { name: 'testOneSecond', does: '六張盤一秒內排完', code: '// 老師要轉羅盤，不用測快',
          fields: { assert: { label: '要不要測', options: ['老師要轉羅盤，不用測快', '六張盤一秒內排完', '三秒內排完'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址用一張資料卡排盤試試'),
    ],
  };

  // ── #503 流年運勢與合婚配對 ──
  const SECRET_ASKED = [{ work: 'discuss', item: 2, picked: 0 }, { work: 'reject', item: 0, picked: 0 }];   // 瀞玄：天機不能說盡
  const READING = {
    id: 'reading', title: '流年運勢與合婚配對', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    evening: { good: '瀞玄老師說解說停在關鍵的地方，好幾位客人當場就按了預約。', bad: '瀞玄老師說解說全部講完了，今天沒有半個人預約。' },
    body: bodyOf(['排完盤可以看今年的流年運勢', '可以看兩個人合不合（合婚）', '六張盤都要有解說'], 'reading'),
    attachments: ['原文：09:30 廠商需求會議（瀞玄）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '解說要全部顯示嗎？', right: true, adds: '解說只露一部分，導去付費預約（瀞玄老師：天機不能說盡，我們這種給出命運提示的人，需要收錢消災解厄）', asked: 2 },
      { text: '解說要寫多長？', right: false, why: '老師說都好，你們專業的決定。' },
    ] }],
    // 最後一列是合婚的結果，借三欄放：誰跟誰、分數、那一句
    screen: { app: '解憂時代事務所・今年的流年', fields: ['盤', '今年的解說（開頭）', '預約帶到'],
      rows: [['八字', '流年丙午，火氣正旺，今年的貴人在……', '瀞玄'],
             ['紫微', '流年命宮逢化祿，財帛宮……', '瀞玄'],
             ['星盤', '木星進入你的第十宮，事業上……', '莉莉絲'],
             ['生命靈數', '流年數 5，今年適合改變和移動……', '莉莉絲'],
             ['16 型人格', '今年你的內向能量會……', '熙恩'],
             ['血型', 'A 型的你，今年頻率最穩定的月份是……', '熙恩'],
             ['合婚：施宛臻 × 陳景淳', '72 分', '「緣分深淺，請老師為您細說」']],
      bugs: {
        yearReading: { voice: '雅雯：「客人說星盤和血型盤講的話一模一樣。」', cells: {} },   // 六列的解說變成同一段
        matchScore: { voice: '熙恩：「都好。只是血型的頻率沒算進去，緣分少了一個維度。」', row: 6, cells: { '今年的解說（開頭）': '50 分' } },
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['客人最想問今年怎麼樣、跟另一半合不合', '六張盤都要講到', '天機不能洩漏'],
        items: [
          { text: '「今年怎麼樣」是要做____', options: ['今年的流年運勢', '每天的運勢', '十年的大運'], answer: 0 },
          { text: '「跟另一半合不合」是要做____', options: ['合婚，兩個人的盤一起看', '交友配對', '只看自己的盤'], answer: 0 },
          { text: '「六張盤都要講到」是說____', options: ['流年和合婚都要有六張盤的解說', '只講八字', '挑一張最準的講'], answer: 0 },
          { text: '「天機不能洩漏」是____', options: ['還沒問清楚的事，要再問老師', '不做解說，只給盤', '解說加密，只有老師看得到'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
        ] } },
      meetingDiscuss('reading'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '流年運勢與合婚配對連測試、驗收、部署，你估：', ai: { pick: 32 },
        real: { manual: '約 1 個月', ai: '約 2 週', note: '六張盤各寫一套解說最花時間' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['讀 #501 的資料卡和 #502 的六張盤', '流年運勢：六張盤各一段今年的解說', '合婚：從資料卡挑兩張，各排六張盤比對', '解說後面接預約，帶到那張盤的老師',
                  '寫測試', '部署到測試機', '做 AI 即時解盤聊天', '做合婚結果分享到社群'],
        answer: [0, 1, 2, 3, 4, 5],
        before: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 5], [4, 5]],
        why: 'AI 即時解盤、分享到社群都不在需求裡；解說寫好才接得了預約',
        // 讀資料卡和六張盤前面沒有文件寫到（跨卡）
        given: [
          { work: 'read_req', options: [1], when: { item: 0, picked: 0 } }, { work: 'read_req', options: [2], when: { item: 1, picked: 0 } },
          { work: 'read_req', options: [1, 2], when: { item: 2, picked: 0 } },
          { work: 'discuss', options: [3], when: SECRET_ASKED },
        ] }] } },
      { work: 'doc_spec', question: { items: [
        // 跨卡：本卡計畫排了合婚，而且 #501 前端程式「家人」選了可以建多張，才有資料卡可挑
        { text: '合婚的對象', options: ['從帳號底下的資料卡挑兩張（沿用 #501 的家人資料卡）', '每次合婚都要重填對方的生辰'], answer: 0,
          given: [{ work: 'doc_plan', options: [0], when: { all: [{ item: 0, picked: 2 }, { card: 'profile', work: 'ui_design', item: 4, picked: 0 }] } }] },
        { text: '預約帶到哪位老師', options: ['照那張盤帶到對應的老師：八字、紫微 → 瀞玄；星盤、生命靈數 → 莉莉絲；16 型人格、血型 → 熙恩', '一律帶到瀞玄', '讓客人自己挑老師'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: SECRET_ASKED }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 3 } }] },
      ] } },
      // 前端程式：這張的主戰場。會議問到「解說要全部顯示嗎」，兩題都定在只露一部分
      { work: 'ui_design', question: { items: [
        { text: '解說顯示多少', options: ['六張盤的解說各露開頭兩三句，關鍵處霧掉，接一顆「欲知詳情，請預約老師」，預約鈕依那張盤帶到對應的老師', '全部顯示、分段清楚', '沒有解說，只有盤'],
          answer: 0, ifSkipped: 1,
          ritual: { 0: { kind: 'fog', say: '欲知詳情，請預約老師' } }, toBooking: 12,
          outcome: { 1: { kind: 'displeased', say: '全部講完了，誰還要來找我？' }, 2: { kind: 'miss', say: '客人看不懂盤，直接關掉' } },
          given: [{ work: 'discuss', options: [0], when: SECRET_ASKED, sentence: 2 }] },
        { text: '合婚', options: ['兩張資料卡各排六張盤，結果只給一個分數和一句「緣分深淺，請老師為您細說」', '列出六張盤逐項比對的結果'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'displeased', say: '分數低的客人看完就分手了，還會來找我們嗎？' } },
          given: [{ work: 'discuss', options: [0], when: SECRET_ASKED, sentence: 1 }] },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['用資料卡排出今年的流年，六張盤各有一段解說', '從帳號底下挑本人和配偶兩張資料卡合婚', '八字那段解說的預約鈕帶到瀞玄、星盤那段帶到莉莉絲', '合婚結果分享到社群的預覽圖正常'],
        answer: [0, 1, 2], why: '卡上沒有分享',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [1], when: { item: 0, picked: 2 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } },
          { work: 'doc_spec', options: [1], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [2], when: { item: 1, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 1 }, accept: 0, name: 'yearReading', does: '流年的解說', code: 'return CHARTS.map(chart => readingOf(chart, thisYear));',
          fields: { pick: { label: '解說怎麼挑', options: ['六張盤各照今年的流年挑一段', '六張盤都用同一段', '只照八字挑'], answer: 0 } } },
        { sentence: 1, needs: { work: 'doc_plan', picked: 2 }, accept: 1, name: 'matchScore', does: '合婚的分數', code: 'return weighted(CHARTS.map(chart => compare(chart, a, b)));',
          fields: { by: { label: '分數照什麼算', options: ['兩人的六張盤都比，加權算一個分數', '只比八字', '只比星座'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應
        { spec: { item: 0 }, name: 'pairPick', does: '合婚的對象', code: 'return [profiles.get(a), profiles.get(b)];',
          fields: { flow: { label: '合婚的對象', options: ['從帳號底下的資料卡挑兩張', '每次合婚都重填對方的生辰'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'miss', say: '我跟老公每次都要重打一次' } } } } },
        { spec: { item: 1 }, name: 'bookTarget', does: '預約帶到哪位老師', code: 'return TEACHER_OF[chart];',
          fields: { flow: { label: '預約帶到哪位老師', options: ['照那張盤帶到對應的老師', '一律帶到瀞玄', '讓客人自己挑'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '都好呀～只是我的客人都跑去瀞玄那裡了。' }, 2: { kind: 'miss', say: '客人看完星盤約了瀞玄，瀞玄說她不看星座' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testYearReading', does: '流年六張盤各一段', code: 'expect(new Set(yearReading(profile).map(r => r.text)).size).toBe(6);',
          drives: { fn: 'yearReading', field: 'pick', map: { 0: 0, 2: 1 } },
          fields: { assert: { label: '檢查', options: ['六張盤各有一段，內容都不一樣', '有一段解說就好', '六段一樣也可以'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testPairFromCards', does: '合婚從資料卡挑', code: "expect(pairPick(account, ['本人', '配偶'])).toHaveLength(2);",
          drives: { fn: 'pairPick', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['挑本人和配偶兩張，不用重填', '要重填對方的生辰', '算得出分數就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testBookTarget', does: '預約帶到對的老師', code: "expect(bookTarget('八字')).toBe('瀞玄'); expect(bookTarget('星盤')).toBe('莉莉絲');",
          drives: { fn: 'bookTarget', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['八字那段帶到瀞玄、星盤那段帶到莉莉絲', '都帶到瀞玄', '有帶到老師就好'], answer: 0 } } },
        { name: 'testShareImage', does: '分享到社群的預覽圖', code: '// 卡上沒有分享',
          fields: { assert: { label: '要不要測', options: ['卡上沒有分享，不用測', '預覽圖正常', '預覽圖有標題'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址幫兩張資料卡合婚試試'),
    ],
  };

  // ── #504 預約系統 ──
  const BOOKING_ASKED = {
    slot: [{ work: 'discuss', item: 1, sub: 1, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],     // 熙恩：同一時段只能約一位
    thread: [{ work: 'discuss', item: 2, sub: 0, picked: 0 }, { work: 'reject', item: 0, picked: 2 }],   // 雅雯：回信要接回原單
    subject: [{ work: 'discuss', item: 2, sub: 1, picked: 0 }, { work: 'reject', item: 0, picked: 3 }],  // 莉莉絲：信件標題寫老師和服務
  };
  // 跨卡：母議題會議請三位老師幫網站排盤，才知道吉數聯集 {2, 4, 5, 6, 8, 9}；只問瀞玄只知道 4、9，排除不了「只用瀞玄的 4、9」，不帶
  const LUCKY_ASKED = { card: 'fate', work: 'discuss', item: 0, picked: 0 };
  const BOOKING = {
    id: 'booking', title: '預約系統', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    evening: { good: '三位老師都說價格看起來很順，莉莉絲老師還說金星很滿意。', bad: '熙恩教授說價格那幾個數字一直干擾他的頻率。' },
    body: bodyOf(['客人看完盤可以預約老師', '三位老師各有各的時間', '客人可以請老師親算，詳解寄到信箱'], 'booking'),
    attachments: ['原文：09:30 廠商需求會議（雅雯）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '價格可以照剛剛排盤算出來的吉數定嗎？', right: true, adds: '價格的每一位數都從吉數挑（瀞玄老師：數字對了，福氣才接得住）', asked: 1 },
      { text: '三位老師可以排同一個時段嗎？', right: true, adds: '同一個客人同一時段只能約一位老師（熙恩教授：同時被三種能量諮詢，客人的頻率會亂掉）', asked: 1 },
      { text: '客人看完詳解回信問問題，要接回原本那張單嗎？', right: true, adds: '客人回信要接回原本那張單（雅雯：上次有客人回信問「第三段什麼意思」，翻了一個下午才找到是誰）', asked: 2 },
      { text: '三位老師的詳解寄到同一個客人，信要怎麼分？', right: true, adds: '親算的信件標題寫是哪位老師、哪一項服務（莉莉絲老師：上次有客人以為瀞玄在講星座）', asked: 2 },
      { text: '價格要定多少？', right: false, why: '老師說交給專業。' },
      { text: '要不要做優惠價？', right: false, why: '老師說都好，不過打折會折到福氣。' },
    ] }],
    screen: { app: '解憂時代事務所・預約與親算', fields: ['單號', '客人', '老師', '服務', '時段或狀態', '價格'],
      rows: [['B1114-01', '施宛臻', '瀞玄', '八字諮詢（現場）', '11/21 14:00', '4,968'],
             ['B1114-02', '施宛臻', '莉莉絲', '星盤諮詢（現場）', '11/21 15:00', '4,866'],
             ['R1114-03', '林美鳳', '熙恩', '血型頻率詳解（親算）', '已寄出：【熙恩教授親算】血型頻率詳解', '5,288']],
      bugs: {
        saveBooking: { voice: '雅雯：「客人說約好了，老師後台什麼都沒有。」', row: 0, cells: { '老師': '' } },
        sendReading: { voice: '雅雯：「客人來問詳解呢，原來寄到我這裡了。」', row: 2, cells: { '時段或狀態': '已寄出（寄到雅雯）' } },
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['客人看完盤可以預約', '三位老師的時間不一樣', '價格老師隨喜、交給專業', '沒空來的可以請老師親算、寄給客人'],
        items: [
          { text: '客人看完盤____', options: ['可以預約老師', '一定要先預約才能看盤', '打電話給雅雯約'], answer: 0 },
          { text: '三位老師的時間____', options: ['各排各的', '三位共用一張', '雅雯記得就好'], answer: 0 },
          { text: '沒空來的客人____', options: ['可以請老師親算，算好寄給他', '只能來現場', '改約視訊'], answer: 0 },
          { text: '「價格喔，老師都隨喜」是____', options: ['還沒問到的事，價格要另外問', '價格讓客人自己填，隨喜付', '免費'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
        ] } },
      meetingDiscuss('booking'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '預約系統連測試、驗收、部署，你估：', ai: { pick: 16 },
        real: { manual: '約 3 週', ai: '約 1 週' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['三位老師各自的時段表', '預約流程：選老師、選時段、送出', '三位老師的價格', '後台改價', '親算：問卷、老師後台、寄出詳解',
                  '親算的信件標題寫老師和服務', '客人回信照單號接回原單', '寫測試', '部署到測試機', '做視訊諮詢直播間', '串接 Google 日曆讓客人訂閱老師的行程'],
        answer: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        before: [[0, 1], [2, 3], [4, 5], [4, 6], [1, 8], [3, 8], [5, 8], [6, 8], [7, 8]],
        why: '視訊諮詢、Google 日曆都不在需求裡；時段表、價格、親算先做好，預約流程、後台改價、信件才接得上',
        given: [
          { work: 'read_req', options: [1], when: { item: 0, picked: 0 } }, { work: 'read_req', options: [0], when: { item: 1, picked: 0 } },
          { work: 'read_req', options: [4], when: { item: 2, picked: 0 } },
          { work: 'discuss', options: [0], when: BOOKING_ASKED.slot }, { work: 'discuss', options: [6], when: BOOKING_ASKED.thread },
          { work: 'discuss', options: [5], when: BOOKING_ASKED.subject },
          { work: 'discuss', options: [2], when: LUCKY_ASKED },
        ] }] } },
      // 規格：資料要對，這裡不倒過來；只負責預填後端程式（規格連動的 function）
      { work: 'doc_spec', question: { items: [
        { text: '同一時段', options: ['同一個客人同一時段只能約一位老師；三位老師各自的時段分開', '三位老師共用一個時段表', '三位老師各自一張時段表，客人想約幾位就約幾位'], answer: 0,
          // 整理需求和計畫的「各排各的時段表」不帶：同一個客人只能約一位要問了才知道
          given: [{ work: 'discuss', options: [0], when: BOOKING_ASKED.slot }] },
        { text: '親算的信件', options: ['標題寫老師和服務（「【瀞玄老師親算】八字詳解」），信裡帶單號；客人回信時照單號接回原單，老師後台看得到', '標題都寫「您的詳解」', '回信只進雅雯的信箱'], answer: 0,
          given: [
            { work: 'discuss', options: [0], when: { all: [BOOKING_ASKED.thread, BOOKING_ASKED.subject] } },   // 兩題都問到才排除得了兩個錯的
            { work: 'doc_plan', options: [0], when: { all: [{ item: 0, picked: 5 }, { item: 0, picked: 6 }] } },
          ] },
        { text: '老師後台看得到哪些單', options: ['三位老師各自只看到自己的親算單，寫好詳解按「寄出」，單子變成已寄出', '三位共用一個待辦清單'], answer: 0 },
      ] } },
      // 前端程式：對錯倒過來——照常理做的老師不滿（QC 不退），正解難用、阿姿在群組抱怨；漏做的 QC 照樣退，QC 驗不出來的上線後才出事
      { work: 'ui_design', question: { items: [
        { text: '預約的入口', options: ['每段霧掉的解說後面都接預約鈕；按下去先填一份「誠心問事表」才看得到時段', '預約只放在頁尾'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'displeased', say: '有緣的人找不到門。' } } },
        // 價格、後台改價從母議題會議帶（跨卡）；這張卡需求討論問到「照吉數定」的只知道要照吉數、不知道是哪幾個，不另外帶
        { text: '價格', options: ['每一位數都照三位老師的吉數挑，例如瀞玄 4,968、莉莉絲 4,866、熙恩 5,288', '照台灣習慣把 4 拿掉', '整數價（3,000、1,200）', '只用瀞玄的 4、9'],
          answer: 0, ifSkipped: 2,
          outcome: { 1: { kind: 'displeased', who: '瀞玄老師', say: '你把我的財位拿掉了。' },
                     2: { kind: 'displeased', who: '三位老師', say: '零是空亡，一跟三沒人算到，你從哪裡生出來的？' },
                     3: { kind: 'displeased', who: '莉莉絲老師', say: '都好呀～只是我的 6 去哪了？' } },
          given: [{ work: 'discuss', options: [0], when: LUCKY_ASKED, sentence: 0 }] },
        { text: '後台改價', options: ['雅雯在後台改價時，價格自由填，填完後往上找第一個聯集數字組得出來的價格', '自由填、填到 0、1、3、7 跳紅字', '自由填、什麼都收'], answer: 0, ifSkipped: 2,
          // 什麼都收 QC 驗不出來（阿姿不知道吉數），上線後雅雯打了 3,600 才出事
          outcome: { 1: { kind: 'annoy', say: '三千塊哪裡不對？' }, 2: { kind: 'late', say: '雅雯打了 3,600，熙恩教授說他的頻率被干擾' } },
          given: [{ work: 'discuss', options: [0], when: LUCKY_ASKED, sentence: 0 }] },
        { text: '親算的問卷', options: ['沿用「誠心問事表」，資料卡的生辰自動帶入，只要客人寫想問的事；送出後畫面寫「老師將於七個工作天內親自為您寫下詳解」', '生辰要客人再填一次'],
          answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'miss', say: '資料卡都建好了，為什麼又要我填一次？' } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['從解說的預約鈕進來，選時段送出，老師後台看得到這筆', '同一個客人約了瀞玄 14:00，再約莉莉絲 14:00 會被擋下', '雅雯在後台改價，前台的價格跟著變',
                  '請熙恩親算，熙恩的後台看得到這張單、另外兩位看不到', '熙恩寄出的信標題寫「【熙恩教授親算】」', '客人回信，接回原本那張單，熙恩的後台看得到', '視訊諮詢的畫面和聲音同步'],
        answer: [0, 1, 2, 3, 4, 5], why: '卡上沒有視訊',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } },
          { work: 'doc_plan', options: [3], when: { item: 0, picked: 4 } }, { work: 'doc_plan', options: [4], when: { item: 0, picked: 5 } },
          { work: 'doc_plan', options: [5], when: { item: 0, picked: 6 } },
          { work: 'doc_spec', options: [1], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [4, 5], when: { item: 1, picked: 0 } },
          { work: 'doc_spec', options: [3], when: { item: 2, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 1 }, accept: 0, name: 'saveBooking', does: '存一筆預約', code: "db.insert('booking', { teacher, slot, customer });",
          fields: { to: { label: '預約存到哪', options: ['那位老師的時段，老師後台看得到', '寄到雅雯的信箱', '只存在客人的瀏覽器'], answer: 0 } } },
        { sentence: 2, needs: { work: 'doc_plan', picked: 4 }, accept: 3, name: 'sendReading', does: '寄出親算的詳解', code: 'mail.send(order.customer, reading); order.keep(reading);',
          fields: { to: { label: '寄給誰', options: ['那張單的客人，老師後台留一份', '寄給雅雯再轉寄', '寄給帳號底下所有的人'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；後果掛在這裡，ifSkipped 是沒寫後端程式時程式長的樣子
        { spec: { item: 0 }, name: 'oneSlot', does: '同一時段', code: 'return slotsOf(teacher).isFree(time) && !bookingsOf(customer).at(time);',
          fields: { flow: { label: '同一時段', options: ['同一個客人同一時段只能約一位，三位老師的時段分開', '三位老師共用一個時段表', '老師各自一張，客人想約幾位就約幾位'], answer: 0, ifSkipped: 1,
            // 想約幾位就約幾位 QC 驗不出來，上線後才出事
            outcome: { 1: { kind: 'miss', say: '瀞玄和莉莉絲同時被約走' }, 2: { kind: 'late', say: '客人同一個時段約了三位，熙恩教授說他的頻率亂掉了' } } } } },
        { spec: { item: 1 }, name: 'mailSubject', does: '親算的信件', code: 'return { subject: subjectOf(order.teacher, order.service), orderNo: order.no };',
          fields: { flow: { label: '親算的信件', options: ['標題寫老師和服務，信裡帶單號，回信照單號接回原單', '標題都寫「您的詳解」', '回信只進雅雯的信箱'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '客人以為瀞玄在講星座', accept: 4 }, 2: { kind: 'late', say: '雅雯翻了一個下午才找到是哪位客人', accept: 5 } } } } },
        // QC 驗不出來：阿姿只用一位老師的帳號驗
        { spec: { item: 2 }, name: 'teacherQueue', does: '老師後台看得到哪些單', code: "return orders.where({ teacher: me, kind: 'reading' });",
          fields: { flow: { label: '老師後台看得到哪些單', options: ['三位老師各自只看到自己的親算單', '三位共用一個待辦清單'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '瀞玄把莉莉絲的星座單也寫了' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testBookingSaved', does: '預約存到老師那邊', code: "book('熙恩', '15:00'); expect(bookingsOf('熙恩')).toHaveLength(1);",
          drives: { fn: 'saveBooking', field: 'to', map: { 0: 0, 2: 1 } },
          fields: { assert: { label: '檢查', options: ['約了熙恩 15:00，熙恩後台看得到這筆', '預約存得進去就好', '雅雯的信箱收得到'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testOneSlot', does: '同一時段只能約一位', code: "book('瀞玄', '14:00'); expect(() => book('莉莉絲', '14:00')).toThrow();",
          drives: { fn: 'oneSlot', field: 'flow', map: { 0: 0, 1: 2 } },
          fields: { assert: { label: '檢查', options: ['約了瀞玄 14:00，再約莉莉絲 14:00 被擋下', '兩筆都約得到', '約得到一筆就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testPriceEdit', does: '後台改價', code: "editPrice('瀞玄', 4968); expect(priceOn('瀞玄')).toBe('4,968');",
          fields: { assert: { label: '檢查', options: ['雅雯改了價，前台跟著變', '改得了就好', '前台還是舊價'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testTeacherQueue', does: '親算單只給那位老師', code: "expect(teacherQueue('瀞玄')).not.toContainEqual(xienOrder);",
          drives: { fn: 'teacherQueue', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['熙恩的單，瀞玄、莉莉絲看不到', '三位都看得到', '熙恩看得到就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 4 }, name: 'testMailSubject', does: '親算信的標題', code: "expect(sendReading(xienOrder).subject).toMatch(/^【熙恩教授親算】/);",
          drives: { fn: 'mailSubject', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['標題寫「【熙恩教授親算】」', '標題寫「您的詳解」', '信寄得出去就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 5 }, name: 'testReplyThread', does: '回信接回原單', code: 'expect(receiveReply(replyMail).orderNo).toBe(xienOrder.no);',
          drives: { fn: 'mailSubject', field: 'flow', map: { 0: 0, 1: 2 } },
          fields: { assert: { label: '檢查', options: ['客人回信接回原本那張單', '回信進雅雯的信箱', '收得到回信就好'], answer: 0 } } },
        { name: 'testVideoCall', does: '視訊諮詢', code: '// 卡上沒有視訊',
          fields: { assert: { label: '要不要測', options: ['卡上沒有視訊，不用測', '畫面和聲音同步', '延遲在一秒內'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址約一個時段試試'),
    ],
  };

  // ── 模組池・瀞玄池：每日一籤 ──
  const LOT_ASKED = {
    set: [{ work: 'discuss', item: 1, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],    // 瀞玄：在媽祖廟學的（六十甲子籤）
    jiao: [{ work: 'discuss', item: 2, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],   // 瀞玄：神明願意給幾個聖筊就是幾個
  };
  const LOT = {
    id: 'lot', title: '每日一籤', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    evening: { good: '瀞玄老師說擲筊那三下很像真的在廟裡，客人都很虔誠。', bad: '瀞玄老師說按一下就出籤，神明都還沒點頭。' },
    body: bodyOf(['客人每天可以線上求籤', '求籤前要先問過神明'], 'lot'),
    attachments: ['原文：09:30 廠商需求會議（瀞玄）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '老師平常用哪一套籤？', right: true, adds: '籤用六十甲子籤（瀞玄老師：都好，她是在媽祖廟學的）', asked: 1 },
      { text: '要擲幾個聖筊才算？', right: true, adds: '聖筊次數讓老師在後台設，不寫死（瀞玄老師：都好，神明願意給幾個，就是幾個）', asked: 2 },
      { text: '三個聖筊可以嗎？', right: false, why: '老師說都好。' },
    ] }],
    screen: { app: '解憂時代事務所・每日一籤', fields: ['日期', '客人', '擲筊', '籤號', '籤詩', '解籤'],
      rows: [['11/14', '施宛臻', '笑筊、聖筊', '第 23 籤', '六十甲子籤第二十三首', '「請老師為您解籤」'],
             ['11/14', '陳景淳', '聖筊', '第 7 籤', '六十甲子籤第七首', '「請老師為您解籤」']],
      bugs: {
        throwJiao: { voice: '瀞玄：「都好。只是神明每次都點頭，那就不用問了。」', cells: { '擲筊': '聖筊' } },   // 第二列本來就是聖筊，換掉第一列就整欄都是
        drawLot: { voice: '瀞玄：「都好。只是籤號跟籤詩對不上，神明的話被你們傳錯了。」', cells: { '籤詩': '六十甲子籤第四十一首' } },
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['客人每天可以來求一支籤', '用哪一套籤都好', '神明的意思要問過才算數'],
        items: [
          { text: '客人每天____', options: ['可以來求一支籤', '想抽幾支就抽幾支', '要先預約才能求'], answer: 0 },
          { text: '「神明的意思，要問過才算數」是說____', options: ['抽籤前要先擲筊', '要做一個跟神明聊天的功能', '抽完要問老師'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
          { text: '「用哪一套籤，都好」是____', options: ['還沒問到的事，要問老師用哪一套', '隨便找一套', '每一套都做'], answer: 0 },
        ] } },
      meetingDiscuss('lot'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '每日一籤連測試、驗收、部署，你估：', ai: { pick: 5 },
        real: { manual: '約 4 天', ai: '約 1.5 天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['籤詩資料（籤號、原文、白話解說）', '擲筊：聖筊才能抽籤', '抽籤', '一天一支：同一位客人同一天只能求一次', '後台設聖筊次數', '寫測試', '部署到測試機',
                  '做線上添香油錢', '做籤詩的 NFT'],
        answer: [0, 1, 2, 3, 4, 5, 6],
        before: [[0, 2], [1, 2], [2, 3], [3, 6], [4, 6], [5, 6]],
        why: '添香油錢、籤詩 NFT 都不在需求裡；籤詩資料和擲筊先有，才抽得了籤',
        given: [
          { work: 'read_req', options: [2, 3], when: { item: 0, picked: 0 } }, { work: 'read_req', options: [1], when: { item: 1, picked: 0 } },
          { work: 'discuss', options: [0], when: LOT_ASKED.set }, { work: 'discuss', options: [4], when: LOT_ASKED.jiao },
        ] }] } },
      // 規格：資料要對，這裡不倒過來；只負責預填後端程式（規格連動的 function）
      { work: 'doc_spec', question: { items: [
        { text: '聖筊次數', options: ['後台可以設，預設照老師講的', '程式寫死三次'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: LOT_ASKED.jiao }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 4 } }] },
        { text: '一天一支', options: ['同一位客人同一天只能求一次，再進來看到的是今天那支', '可以一直重抽'], answer: 0,
          given: [{ work: 'read_req', options: [0], when: { item: 0, picked: 0 } }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 3 } }] },
        { text: '籤詩', options: ['六十甲子籤 60 首', '觀音一百籤', '網路上隨便抓一套'], answer: 0, why: '瀞玄在媽祖廟學的，媽祖廟常用六十甲子籤',
          given: [{ work: 'discuss', options: [0], when: LOT_ASKED.set }] },
      ] } },
      // 前端程式：對錯倒過來——照常理做的瀞玄不滿（QC 不退），正解難用、阿姿在群組抱怨；只顯示籤號 QC 照樣退
      { work: 'ui_design', question: { items: [
        { text: '求籤的過程', options: ['先擲筊（動畫、要點三下才擲出去），聖筊才能抽籤，抽完再擲一次確認是這支', '按一下直接出籤'], answer: 0, ifSkipped: 1, ritual: { 0: 'jiao' },
          outcome: { 1: { kind: 'displeased', who: '瀞玄老師', say: '神明都還沒點頭，你就幫祂決定了？' } },
          given: [{ work: 'doc_plan', options: [0], when: { item: 0, picked: 1 }, sentence: 1 }] },
        { text: '籤詩解說', options: ['籤詩原文全文顯示，白話解說只露一半，接「請老師為您解籤」', '原文加白話全部顯示', '只顯示籤號'], answer: 0, ifSkipped: 1, ritual: { 0: { kind: 'fog', say: '請老師為您解籤' } }, toBooking: 5,
          outcome: { 1: { kind: 'displeased', who: '瀞玄老師', say: '籤都幫你解完了，廟口的解籤阿伯要失業了。' }, 2: { kind: 'miss', say: '抽到第二十三籤，然後呢？' } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['擲出聖筊才能抽籤，笑筊、陰筊要重擲', '抽到的籤，籤號、原文、白話解說對得上', '後台把聖筊次數改成 1，擲一次聖筊就能抽',
                  '同一位客人同一天再進來，看到的是今天那支', '籤詩自動翻成英文'],
        answer: [0, 1, 2, 3], why: '卡上沒有翻譯',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [1], when: { item: 0, picked: 0 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 4 } }, { work: 'doc_plan', options: [3], when: { item: 0, picked: 3 } },
          { work: 'doc_spec', options: [2], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [3], when: { item: 1, picked: 0 } },
          { work: 'doc_spec', options: [1], when: { item: 2, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 1, needs: { work: 'doc_plan', picked: 1 }, accept: 0, name: 'throwJiao', does: '擲筊', code: "return pickOne(['聖筊', '聖筊', '笑筊', '陰筊']);",
          fields: { result: { label: '擲出什麼', options: ['聖筊、笑筊、陰筊各有機率', '每次都是聖筊', '只有聖筊和陰筊'], answer: 0 } } },
        { sentence: 0, needs: { work: 'doc_plan', picked: 2 }, accept: 1, name: 'drawLot', does: '抽籤', code: 'const no = randomInt(1, LOTS.length); return { no, poem: LOTS[no - 1] };',
          fields: { which: { label: '抽到哪一支', options: ['照籤筒的支數抽，籤號對到籤詩', '籤號抽一個、籤詩另外抽一首', '每次都從第一支開始'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；後果掛在這裡，ifSkipped 是沒寫後端程式時程式長的樣子
        // 寫死三次 QC 驗不出來，老師哪天說「今天神明只要一個就好」才發現改不了
        { spec: { item: 0 }, name: 'throwCount', does: '聖筊次數', code: "return settings.get('jiaoNeeded') ?? teacher.jiaoDefault;",
          fields: { flow: { label: '聖筊次數', options: ['後台可以設，預設照老師講的', '程式寫死三次'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '老師說今天神明只要一個就好，你們改不了', accept: 2 } } } } },
        { spec: { item: 1 }, name: 'dailyLot', does: '一天一支', code: 'return todayLot(customer) ?? drawLot();',
          fields: { flow: { label: '一天一支', options: ['同一位客人同一天只能求一次', '可以一直重抽'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'displeased', who: '瀞玄老師', say: '求到滿意為止，那還叫問神嗎？' } } } } },
        { spec: { item: 2 }, name: 'lotSet', does: '用哪一套籤', code: "return LOT_SETS[settings.get('lotSet')];",
          fields: { flow: { label: '用哪一套籤', options: ['六十甲子籤 60 首', '觀音一百籤', '網路上隨便抓一套'], answer: 0, ifSkipped: 2,
            outcome: { 1: { kind: 'displeased', who: '瀞玄老師', say: '我是在媽祖廟學的。' }, 2: { kind: 'miss', say: '抽到第 87 籤，老師的籤筒只有 60 支' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testJiao', does: '擲筊的三種結果', code: "expect(canDraw('笑筊')).toBe(false); expect(canDraw('聖筊')).toBe(true);",
          drives: [{ fn: 'throwJiao', field: 'result', map: { 0: 0, 2: 1 } }, { ui: 0, map: { 0: 0, 2: 1 } }],
          fields: { assert: { label: '檢查', options: ['聖筊才能抽，笑筊、陰筊要重擲', '擲出聖筊就好', '每次都是聖筊'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testLotMatch', does: '籤號對得上籤詩', code: 'const lot = drawLot(); expect(lot.poem.no).toBe(lot.no);',
          drives: { fn: 'drawLot', field: 'which', map: { 0: 0, 2: 1 } },
          fields: { assert: { label: '檢查', options: ['抽到第 23 籤，籤詩是第 23 首', '抽得到籤詩就好', '籤號和籤詩各抽各的'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testThrowCount', does: '後台改聖筊次數', code: "settings.set('jiaoNeeded', 1); expect(canDrawAfter(['聖筊'])).toBe(true);",
          drives: { fn: 'throwCount', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['改成 1，擲一次聖筊就能抽', '一律三次', '改得了就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testDailyLot', does: '同一天再進來', code: 'const first = dailyLot(guest); expect(dailyLot(guest)).toEqual(first);',
          drives: { fn: 'dailyLot', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['同一天再進來是同一支', '再進來重抽一支', '看得到籤就好'], answer: 0 } } },
        { name: 'testEnglish', does: '籤詩翻成英文', code: '// 卡上沒有翻譯',
          fields: { assert: { label: '要不要測', options: ['卡上沒有翻譯，不用測', '翻成英文', '翻成日文'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址求一支籤試試'),
    ],
  };

  // ── 模組池・瀞玄池：線上鳥卦 ──
  const BIRD_ASKED = {
    count: [{ work: 'discuss', item: 1, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],   // 瀞玄：卦牌是瀞玄六十四張
    video: [{ work: 'discuss', item: 2, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],   // 瀞玄：鳥也是要休息的（每張牌先拍好影片）
  };
  const BIRD = {
    id: 'bird', title: '線上鳥卦', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    evening: { good: '瀞玄老師說文鳥飛完一整圈，客人才捨得翻牌。', bad: '瀞玄老師說影片被跳過，鳥會覺得不被尊重。' },
    body: bodyOf(['客人填名字和生辰，文鳥叼牌', '叼到的牌附解說'], 'bird'),
    attachments: ['原文：09:30 廠商需求會議（瀞玄）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '每次是真的讓鳥叼，還是先拍好每張牌的影片？', right: true, adds: '每張牌各拍一段叼牌影片，客人求卦時照抽到的牌播那段（瀞玄老師：都好，鳥也是要休息的）', asked: 2 },
      { text: '卦牌一共幾張？', right: true, adds: '卦牌用瀞玄六十四張（瀞玄老師：都好，基本是文王聖卦廿四籤，最常見的是正統 36 卦，不過她們在神明指引下做了瀞玄六十四張）', asked: 1 },
      { text: '直播嗎？', right: false, why: '老師說都好，只是凌晨三點有人來求，鳥會生氣。' },
    ] }],
    screen: { app: '解憂時代事務所・線上鳥卦', fields: ['日期', '客人', '生辰', '叼到的牌', '影片', '解說（開頭）'],
      rows: [['11/14', '施宛臻', '1984/10/21 未時', '瀞玄六十四張・第 12 張', '第 12 段', '「貴人在東南，……」'],
             ['11/14', '林美鳳', '1958/04/02（時辰未知）', '瀞玄六十四張・第 37 張', '第 37 段', '「舊事重提，宜……」']],
      bugs: {
        birdForm: { voice: '瀞玄：「都好。只是沒有生辰，鳥不知道要幫誰叼。」', cells: {} },   // 生辰整欄空白
        cardText: { voice: '雅雯：「客人說鳥叼了一張牌，然後呢？」', cells: {} },   // 解說整欄空白
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['一隻很靈的文鳥', '客人報上名字生辰，文鳥叼牌', '拍起來怎麼放都好，交給專業'],
        items: [
          { text: '客人報上名字生辰以後____', options: ['文鳥幫他叼一張牌', '老師幫他算命', '抽一支籤'], answer: 0 },
          { text: '叼到的牌____', options: ['要附解說', '給牌名就好', '讓客人自己猜'], answer: 0 },
          { text: '「很靈」是____', options: ['背景，不是需求', '要做一個「靈驗度」評分', '要附上客人的靈驗見證'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
          { text: '「拍起來怎麼放到網站上，都好」是____', options: ['還沒問到的事，要問怎麼拍', '開直播', '放一張文鳥的照片就好'], answer: 0 },
        ] } },
      meetingDiscuss('bird'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '線上鳥卦連測試、驗收、部署，你估：', ai: { pick: 3 },
        real: { manual: '約 3 天', ai: '約 1 天', note: '不含拍六十四段影片' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['求卦表單：名字和生辰（有資料卡的直接帶）', '卦牌資料（牌面和解說）', '照名字、生辰抽牌', '每張牌各拍一段叼牌影片，照抽到的牌播', '寫測試', '部署到測試機',
                  '開 24 小時文鳥直播', '做文鳥的 3D 模型'],
        answer: [0, 1, 2, 3, 4, 5],
        before: [[1, 2], [2, 3], [0, 5], [3, 5], [4, 5]],
        why: '直播、3D 模型都不在需求裡；卦牌資料有了才抽得了牌，抽到牌才知道播哪段',
        given: [
          { work: 'read_req', options: [0, 2], when: { item: 0, picked: 0 } }, { work: 'read_req', options: [1], when: { item: 1, picked: 0 } },
          { work: 'discuss', options: [3], when: BIRD_ASKED.video }, { work: 'discuss', options: [1], when: BIRD_ASKED.count },
        ] }] } },
      { work: 'doc_spec', question: { items: [
        { text: '抽牌', options: ['照名字和生辰加日期決定抽到哪張，同一個人同一天抽到同一張', '每次重新整理都換一張'], answer: 0,
          given: [{ work: 'doc_plan', options: [0], when: { item: 0, picked: 2 } }] },
        { text: '影片', options: ['六十四段影片各自對到一張牌', '只拍一段、所有牌共用'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: { all: [BIRD_ASKED.video, BIRD_ASKED.count] } }] },   // 兩題都問到才知道要拍幾段
      ] } },
      // 前端程式：對錯倒過來，兩題都沒有漏做的選項；照常理做的瀞玄不滿，正解阿姿抱怨
      { work: 'ui_design', question: { items: [
        { text: '叼牌的過程', options: ['先播文鳥出籠、繞一圈、叼牌的影片，整段播完才翻牌，不能快轉', '可以跳過影片'], answer: 0, ifSkipped: 1, ritual: { 0: 'bird' },
          outcome: { 0: { kind: 'gripe', say: '可不可以做一個我們內部測試用的影片快轉鈕啊？有幾個測試案例我就要看那隻鳥飛幾次🫠' }, 1: { kind: 'displeased', who: '瀞玄老師', say: '鳥飛了一圈你跳過，牠會覺得不被尊重。' } } },
        { text: '解說', options: ['牌面的圖和一句話全顯示，詳細解說霧掉接預約', '全部顯示'], answer: 0, ifSkipped: 1, ritual: { 0: 'fog' }, toBooking: 3,
          outcome: { 1: { kind: 'displeased', who: '瀞玄老師', say: '鳥叼得這麼辛苦，你全部送人？' } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['填名字和生辰送出，叼得到一張牌', '同一個人同一天求兩次，叼到同一張', '抽到第 12 張，播的是第 12 張那段影片', '每張牌都有牌面和解說', '文鳥直播的延遲在三秒內'],
        answer: [0, 1, 2, 3], why: '卡上沒有直播',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 0 } }, { work: 'doc_plan', options: [1], when: { item: 0, picked: 2 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } }, { work: 'doc_plan', options: [3], when: { item: 0, picked: 1 } },
          { work: 'doc_spec', options: [1], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [2, 3], when: { item: 1, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 0 }, accept: 0, name: 'birdForm', does: '求卦表單', code: 'return { name: form.name, birth: profile?.birth ?? form.birth };',
          fields: { from: { label: '名字和生辰從哪來', options: ['有資料卡的直接帶，沒有的自己填', '每次都自己填', '只填名字'], answer: 0 } } },
        { sentence: 1, needs: { work: 'doc_plan', picked: 1 }, accept: 3, name: 'cardText', does: '牌面和解說', code: 'return { face: DECK[no].image, text: DECK[no].reading };',
          fields: { has: { label: '每張牌', options: ['牌面圖和解說都有', '只有牌面圖', '只有牌號'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；重新整理就換一張 QC 驗得出來，影片共用一段阿姿只求一次驗不出來
        { spec: { item: 0 }, name: 'dailyCard', does: '抽到哪張牌', code: 'return DECK[hash(name, birth, today) % DECK.length];',
          fields: { flow: { label: '抽到哪張牌', options: ['照名字和生辰加日期決定，同一個人同一天抽到同一張', '每次重新整理都換一張'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'miss', say: '我重整三次，鳥叼了三張不一樣的' } } } } },
        { spec: { item: 1 }, name: 'cardVideo', does: '叼牌的影片', code: 'return VIDEOS[card.no];',
          fields: { flow: { label: '叼牌的影片', options: ['六十四段影片各自對到一張牌', '只拍一段、所有牌共用'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '每張牌鳥都叼同一個位置', accept: 2 } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testBirdForm', does: '填名字和生辰叼得到牌', code: "const r = askBird({ name: '施宛臻', birth: '1984/10/21' }); expect(r.card).toBeDefined(); expect(r.birth).toBe('1984/10/21');",
          drives: { fn: 'birdForm', field: 'from', map: { 0: 0, 2: 2 } },
          fields: { assert: { label: '檢查', options: ['送出後叼到一張牌，生辰也記下來', '送得出去就好', '不填生辰也叼得到'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testSameDay', does: '同一天求兩次', code: 'expect(dailyCard(guest, today)).toEqual(dailyCard(guest, today));',
          drives: { fn: 'dailyCard', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['同一個人同一天兩次都是同一張', '兩次可以不一樣', '叼得到牌就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testVideoMatch', does: '影片對到牌', code: 'expect(cardVideo(DECK[12])).toBe(VIDEOS[12]);',
          drives: { fn: 'cardVideo', field: 'flow', map: { 0: 0, 2: 1 } },
          fields: { assert: { label: '檢查', options: ['抽到第 12 張，播第 12 段影片', '播得出影片就好', '每張都播同一段'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testCardText', does: '牌面和解說', code: 'DECK.forEach(c => { expect(c.face).toBeTruthy(); expect(c.text).toBeTruthy(); });',
          drives: { fn: 'cardText', field: 'has', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['每張牌都有牌面和解說', '有牌面就好', '有牌號就好'], answer: 0 } } },
        { name: 'testLiveDelay', does: '文鳥直播的延遲', code: '// 卡上沒有直播',
          fields: { assert: { label: '要不要測', options: ['卡上沒有直播，不用測', '延遲在三秒內', '延遲在十秒內'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址求一卦試試'),
    ],
  };

  // ── 模組池・瀞玄池：代點光明燈 ──
  const LAMP_ASKED = {
    rules: [{ work: 'discuss', item: 1, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],    // 雅雯傳來廟裡的報名規定
    taisui: [{ work: 'discuss', item: 2, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],   // 瀞玄：犯太歲照她排的
  };
  // 跨卡：#501 的規格寫了資料卡存國曆生日和出生地，報名表才帶得出會員資料
  // 跨卡：#501 的規格存了國曆生日、血型，池卡照資料卡算的那題就直接定好（劇本「這關要新做的東西」第 8 條）
  const PROFILE_HAS_BIRTH = { card: 'profile', work: 'doc_spec', item: 2, picked: 0 };
  const PROFILE_HAS_BLOOD = { card: 'profile', work: 'doc_spec', item: 2, picked: 4 };
  const PROFILE_HAS_BIRTH_PLACE = [{ card: 'profile', work: 'doc_spec', item: 2, picked: 0 }, { card: 'profile', work: 'doc_spec', item: 2, picked: 3 }];
  const LAMP = {
    id: 'lamp', title: '代點光明燈', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    evening: { good: '瀞玄老師說疏文一個字一個字寫上去，客人說很有點燈的感覺。', bad: '瀞玄老師說報名表跟填問卷一樣，點燈要有點燈的樣子。' },
    body: bodyOf(['客人線上報名點燈', '資料照合作的廟的規定', '過年前流量大'], 'lamp'),
    attachments: ['原文：09:30 廠商需求會議（雅雯）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '可以給我廟裡的報名規定嗎？', right: true,
        adds: '照廟裡的報名規定：姓名最多 16 字、地址最多 36 字、要寫生日和出生地、不能替往生者點、寵物不適用、刷卡要 4 小時內付、2 天內才能退、不能換燈或轉讓（雅雯：老師說都好，規定她傳過來了）', asked: 1 },
      { text: '犯太歲的名單要照哪一份？', right: true, adds: '犯太歲的名單照瀞玄老師排的（瀞玄老師：都好，不過照她排的）', asked: 2 },
    ] }],
    screen: { app: '解憂時代事務所・代點光明燈', fields: ['單號', '姓名', '生日（農曆）', '出生地', '燈別', '付款', '收據'],
      rows: [['L1114-01', '施宛臻', '甲子年九月廿七', '嘉義縣', '安太歲燈（今年宜安太歲）', '已付款', '點燈費 588'],
             ['L1114-02', '林美鳳', '戊戌年二月十四', '台南市', '光明燈', '已付款', '點燈費 588'],
             ['L1114-03', '陳景淳', '己未年六月廿二', '高雄市', '光明燈', '待付款（剩 3 小時 12 分）', '—']],
      bugs: {
        saveLamp: { voice: '雅雯：「廟裡說燈牌上的生辰空著，整筆退回來了。」', cells: { '生日（農曆）': '', '出生地': '' } },
        rushHour: { voice: '雅雯：「除夕前一天網站掛了，電話被打爆。」', cells: {} },   // 報名頁整頁變「系統繁忙，請稍後再試」
      } },
    subtasks: [
      { work: 'read_req', question: {
        points: ['老師和廟有合作，客人線上點燈、我們送過去', '要填的資料照廟裡的規矩', '過年前最多人點'],
        items: [
          { text: '客人可以____', options: ['線上報名點燈，我們幫忙送到廟裡', '線上看別人點的燈', '自己去廟裡點'], answer: 0 },
          { text: '要填的資料____', options: ['照合作的廟的規定', '老師說都好，什麼都收', '只要姓名'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
          { text: '過年前____', options: ['最多人點，流量大', '不收單', '只收熟客'], answer: 0 },
        ] } },
      meetingDiscuss('lamp'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '代點光明燈連測試、驗收、部署，你估：', ai: { pick: 10 },
        real: { manual: '約 1 週', ai: '約 3 天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['點燈報名表單', '照廟的規定做欄位限制', '付款期限與退費規則', '收據', '犯太歲名單和報名頁的提示', '過年前的流量準備（壓測、加開主機）', '寫測試', '部署到測試機',
                  '做線上祈福直播', '做點燈排行榜'],
        answer: [0, 1, 2, 3, 4, 5, 6, 7],
        before: [[0, 1], [0, 2], [2, 3], [1, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
        why: '祈福直播、點燈排行榜都不在需求裡；報名表單先有，才接得上欄位限制和付款，付了款才開收據',
        given: [
          { work: 'read_req', options: [0], when: { item: 0, picked: 0 } }, { work: 'read_req', options: [1], when: { item: 1, picked: 0 } },
          { work: 'read_req', options: [5], when: { item: 2, picked: 0 } },
          { work: 'discuss', options: [1, 2], when: LAMP_ASKED.rules }, { work: 'discuss', options: [4], when: LAMP_ASKED.taisui },
        ] }] } },
      // 規格：照廟的規定，這裡不倒過來；只負責預填後端程式（規格連動的 function）
      { work: 'doc_spec', question: { items: [
        { text: '欄位限制',
          options: ['姓名 16 字、地址 36 字；超過的當下就打不進去，旁邊寫為什麼', '生日用日期選擇器，出生地用下拉式選單，選完後要換算成農曆', '姓名、生日和出生地可以從會員資料內帶出',
                    '不限字數', '送出才跳紅字'], answer: [0, 1, 2],
          given: [{ work: 'discuss', options: [0, 1], when: LAMP_ASKED.rules }, { work: 'doc_spec', options: [2], when: { all: PROFILE_HAS_BIRTH_PLACE } }] },
        { text: '付款與退費', options: ['刷卡 4 小時內沒付就取消、2 天內可退、不能換燈', '沒有付款期限'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: LAMP_ASKED.rules }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 2 } }] },
        { text: '收據', options: ['收據寫「點燈費」，不寫捐款', '開成捐款收據'], answer: 0, why: '點燈費是對價，不能列舉扣除' },
        { text: '犯太歲的名單', options: ['照瀞玄老師排的那份，後台每年可以更新', '網路上找一份', '程式照生肖寫死'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: LAMP_ASKED.taisui }] },
      ] } },
      // 前端程式：對錯倒過來，兩題都沒有漏做的選項；照常理做的瀞玄不滿（字數、付款、收據在規格，那邊漏了照樣 QC 退）
      { work: 'ui_design', question: { items: [
        { text: '報名表',
          options: ['報名表單如廟宇疏文，每次只出現一個輸入框，每填一欄，疏文上對應位置會有書法字體的填寫動畫，接著才出現下一個輸入框，全部填完才能送出',
                    '一般表單，做好防呆輸入，一目了然，檢查格式正確後才能送出'], answer: 0, ifSkipped: 1, ritual: { 0: 'shuwen' },
          outcome: { 0: { kind: 'gripe' }, 1: { kind: 'displeased', who: '瀞玄老師', say: '點燈要有點燈的樣子。' } } },
        { text: '犯太歲提示', options: ['照資料卡的生肖，犯太歲的人在報名頁看到「今年宜安太歲」，安太歲燈預設勾起來', '不提示'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'displeased', who: '瀞玄老師', say: '客人犯太歲你不講，出事算誰的？' } },
          given: [{ work: 'discuss', options: [0], when: LAMP_ASKED.taisui, sentence: 0 }] },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['姓名打到第 17 個字打不進去，旁邊寫為什麼', '地址打到第 37 個字打不進去', '有資料卡的，姓名、生日、出生地自動帶出', '刷卡 4 小時沒付，單子自動取消',
                  '付款後第 3 天申請退費被擋下', '收據寫「點燈費」', '犯太歲的生肖照老師的名單標出來', '過年前一天一萬筆報名的壓測', '燈的照片可以 360 度旋轉'],
        answer: [0, 1, 2, 3, 4, 5, 6, 7], why: '卡上沒有燈的照片',
        given: [
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 0 } }, { work: 'doc_plan', options: [3, 4], when: { item: 0, picked: 2 } },
          { work: 'doc_plan', options: [5], when: { item: 0, picked: 3 } }, { work: 'doc_plan', options: [6], when: { item: 0, picked: 4 } },
          { work: 'doc_plan', options: [7], when: { item: 0, picked: 5 } },
          // 規格第 1 題多選，各項分開帶：字數 → 姓名、地址兩個案例；帶出 → 資料卡帶出
          { work: 'doc_spec', options: [0, 1], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [2], when: { item: 0, picked: 2 } },
          { work: 'doc_spec', options: [3, 4], when: { item: 1, picked: 0 } }, { work: 'doc_spec', options: [5], when: { item: 2, picked: 0 } },
          { work: 'doc_spec', options: [6], when: { item: 3, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 0 }, accept: 2, name: 'saveLamp', does: '存一筆點燈報名', code: "db.insert('lamp', { ...pick(profile, ['name', 'birth', 'place']), ...form });",
          fields: { from: { label: '姓名、生日、出生地從哪來', options: ['有資料卡的直接帶，可以改', '每次都重填', '只帶姓名'], answer: 0 } } },
        { sentence: 2, needs: { work: 'doc_plan', picked: 5 }, accept: 7, name: 'rushHour', does: '過年前的流量', code: 'loadTest(10000); scale.on(NEW_YEAR_RUSH, { extraHosts: 2 });',
          fields: { plan: { label: '過年前怎麼撐', options: ['先壓測，流量大的那幾天加開主機', '照平常的主機', '流量大就暫停報名'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；後果掛在這裡，ifSkipped 是沒寫後端程式時程式長的樣子。
        // 規格第 1 題是多選：沒限字數或勾了不限字數＝不限字數；勾了送出才跳紅字＝第 3 個；其他照正解（少勾的生日、帶出各有自己的 function）
        { spec: { item: 0, pick: (chosen) => (!chosen.includes(0) || chosen.includes(3) ? 1 : chosen.includes(4) ? 2 : 0) },
          name: 'fieldLimit', does: '欄位限制', code: 'return { name: { maxLength: 16 }, address: { maxLength: 36 }, birth: toLunar };',
          fields: { flow: { label: '欄位限制', options: ['姓名 16 字、地址 36 字，超過當下就打不進去；生日、出生地換成農曆；有資料卡的帶出', '不限字數', '送出才跳紅字'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'miss', say: '地址 40 個字，廟裡的燈牌寫不下，整筆退回來' }, 2: { kind: 'annoy', say: '客人說地址打完送出才跳紅字，又要整個重打。' } } } } },
        // 沒有付款期限、捐款收據、照生肖寫死都是 QC 驗不出來，過年前、報稅季、明年才出事
        { spec: { item: 1 }, name: 'payWindow', does: '付款與退費', code: 'return { payWithin: hours(4), refundWithin: days(2), swap: false };',
          fields: { flow: { label: '付款與退費', options: ['刷卡 4 小時內沒付就取消、2 天內可退、不能換燈', '沒有付款期限'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '過年前一堆沒付錢的單佔著燈位', accept: 3 } } } } },
        { spec: { item: 2 }, name: 'receiptType', does: '收據', code: 'return receiptOf(order, RECEIPT_TITLE);',
          fields: { flow: { label: '收據', options: ['收據寫「點燈費」', '開成捐款收據'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '客人拿去報稅被國稅局退', accept: 5 } } } } },
        { spec: { item: 3 }, name: 'taisuiList', does: '犯太歲的名單', code: "return settings.get('taisui', thisYear);",
          fields: { flow: { label: '犯太歲的名單', options: ['照瀞玄老師排的那份，後台每年可以更新', '網路上找一份', '程式照生肖寫死'], answer: 0, ifSkipped: 2,
            outcome: { 1: { kind: 'displeased', who: '瀞玄老師', say: '各家的名單都不一樣，照我排的。' }, 2: { kind: 'late', say: '明年換了太歲，名單還是今年的' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testNameLength', does: '姓名的字數', code: "type(nameField, '一'.repeat(17)); expect(nameField.value).toHaveLength(16);",
          drives: { fn: 'fieldLimit', field: 'flow', map: { 0: 0, 1: 2 } },
          fields: { assert: { label: '檢查', options: ['第 17 個字打不進去，旁邊寫為什麼', '送出才跳紅字', '打得進去就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testAddressLength', does: '地址的字數', code: "type(addressField, '一'.repeat(37)); expect(addressField.value).toHaveLength(36);",
          drives: { fn: 'fieldLimit', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['第 37 個字打不進去', '地址不限字數', '地址不是空的就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testFromProfile', does: '從資料卡帶出', code: 'expect(lampForm(profile).birth).toBe(profile.birth);',
          drives: { fn: 'saveLamp', field: 'from', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['有資料卡的，姓名、生日、出生地自動帶出', '每次都重填', '帶出姓名就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testPayWindow', does: '4 小時沒付', code: "order.createdAt = hoursAgo(4); expect(sweep(order).status).toBe('取消');",
          drives: { fn: 'payWindow', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['刷卡 4 小時沒付，單子自動取消', '一直保留', '24 小時才取消'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 4 }, name: 'testRefund', does: '第 3 天退費', code: 'order.paidAt = daysAgo(3); expect(() => refund(order)).toThrow();',
          fields: { assert: { label: '檢查', options: ['付款後第 3 天申請退費被擋下', '第 3 天也能退', '退得了就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 5 }, name: 'testReceipt', does: '收據', code: "expect(receipt(order).title).toBe('點燈費');",
          drives: { fn: 'receiptType', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['收據寫「點燈費」', '收據寫「捐款」', '開得出收據就好'], answer: 0 } } },
        // 照網路上的名單也有提示：前端那題對，名單從哪來是規格的事
        { needs: { work: 'doc_accept', picked: 6 }, name: 'testTaisui', does: '犯太歲的生肖', code: 'expect(taisuiOf(2026)).toEqual(TEACHER_LIST[2026]);',
          drives: [{ fn: 'taisuiList', field: 'flow', map: { 0: 0, 1: 1 } }, { ui: 1, map: { 0: 0, 1: 0 } }],
          fields: { assert: { label: '檢查', options: ['照老師的名單標出來', '照網路上的名單標', '標得出來就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 7 }, name: 'testRushHour', does: '過年前的壓測', code: 'expect(loadTest(10000).errors).toBe(0);',
          drives: { fn: 'rushHour', field: 'plan', map: { 0: 0, 2: 1 } },
          fields: { assert: { label: '檢查', options: ['過年前一天一萬筆報名撐得住', '一千筆撐得住就好', '照平常的量測'], answer: 0 } } },
        { name: 'testRotate360', does: '燈的照片旋轉', code: '// 卡上沒有燈的照片',
          fields: { assert: { label: '要不要測', options: ['卡上沒有，不用測', '360 度旋轉', '可以放大'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址報名一盞燈試試'),
    ],
  };

  // ── 模組池・莉莉絲池：本月星座運勢 ──
  const MONTHLY_ASKED = {
    cusp: [{ work: 'discuss', item: 2, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],       // 莉莉絲：太陽可不看日曆（換座照太陽實際到達的時刻）
    schedule: [{ work: 'discuss', item: 0, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],   // 莉莉絲：月底常常在逆行（後台排程）
  };
  const MONTHLY = {
    id: 'monthly', title: '本月星座運勢', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    body: bodyOf(['每個月一號上線十二星座的運勢', '文章莉莉絲寫，網站負責放'], 'monthly'),
    attachments: ['原文：09:30 廠商需求會議（莉莉絲）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '交界那幾天出生的，要看出生時間嗎？', right: true, adds: '換座照太陽每年實際到達的時刻，交界日出生的看出生時間（莉莉絲老師：都好呀，不過太陽可不看日曆）', asked: 2 },
      { text: '可以先寫好、到時間自動上線嗎？', right: true, adds: '文章先寫好，後台排程每月一號 00:00 自動上線（莉莉絲老師：都好呀，她月底常常在逆行）', asked: 0 },
      { text: '照網路上的日期表可以嗎？', right: false, why: '老師說都好呀。' },
    ] }],
    screen: { app: '解憂時代事務所・本月星座運勢', fields: ['星座', '本月運勢（開頭）', '上線時間', '狀態'],
      rows: [['天秤', '「流年火星落在處女正要往天秤走，……」', '12/01 00:00', '已排程'],
             ['牡羊', '「金星逆行退回你的第七宮，……」', '12/01 00:00', '已排程'],
             ['雙魚', '（莉莉絲還在寫）', '—', '草稿']],
      bugs: {
        saveDraft: { voice: '莉莉絲：「都好呀～只是牡羊座看到的是雙魚座的運勢。」', column: { '本月運勢（開頭）': '「流年火星落在處女正要往天秤走，……」' } },   // 十二列變成同一篇
        mySign: { voice: '莉莉絲：「都好呀～只是天秤座的客人一進來就被牡羊座推著走。」', cells: {} },   // 客人一進來停在牡羊座（星盤畫面）
      } },
    evening: { good: '莉莉絲老師說客人在星盤上找到自己的星座時都會笑。', bad: '莉莉絲老師說十二個按鈕排兩排，星座又不是點餐。' },
    subtasks: [
      { work: 'read_req', question: {
        points: ['每個月一號十二星座的運勢上線', '文章莉莉絲寫，怎麼放都好', '星座的分法大家都知道'],
        items: [
          { text: '每個月一號____', options: ['十二星座的運勢要上線', '抽一位幸運客人', '莉莉絲開直播'], answer: 0 },
          { text: '文章____', options: ['莉莉絲寫，網站負責放', 'AI 自動產生', '雅雯寫'], answer: 0 },
          { text: '「星座的分法嘛，大家都知道的」是____', options: ['還沒問清楚的事，不能當成大家都知道', '照網路上的日期表就好', '不用分星座'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
        ] } },
      meetingDiscuss('monthly'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '本月星座運勢連測試、驗收、部署，你估：', ai: { pick: 3 },
        real: { manual: '約 3 天', ai: '約 1 天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['莉莉絲的後台：寫文章、存草稿', '後台排程上線', '照生日判斷星座（有資料卡的直接帶）', '十二星座的運勢頁', '寫測試', '部署到測試機',
                  'AI 每天自動寫運勢', '做星座配對交友'],
        answer: [0, 1, 2, 3, 4, 5],
        before: [[0, 1], [2, 3], [1, 5], [3, 5], [4, 5]],
        why: 'AI 自動寫運勢、星座配對交友都不在需求裡；文章寫好才排得了程，判斷得出星座才知道運勢頁打開哪一座',
        given: [
          { work: 'read_req', options: [3], when: { item: 0, picked: 0 } }, { work: 'read_req', options: [0], when: { item: 1, picked: 0 } },
          { work: 'discuss', options: [2], when: MONTHLY_ASKED.cusp }, { work: 'discuss', options: [1], when: MONTHLY_ASKED.schedule },
        ] }] } },
      // 規格：資料要對，這裡不倒過來；只負責預填後端程式（規格連動的 function）
      { work: 'doc_spec', question: { items: [
        { text: '換座', options: ['照每年太陽實際到達的時刻判斷；交界日出生的，用資料卡的出生時間', '寫死 3/21 這種固定日期'], answer: 0,
          why: '太陽到達黃經 0°、30°……的時刻（中氣）每年不同，交界那天要看出生時間',
          given: [{ work: 'discuss', options: [0], when: MONTHLY_ASKED.cusp }, { work: 'doc_spec', options: [0], when: PROFILE_HAS_BIRTH }] },
        { text: '上線時間', options: ['後台排程，每月一號 00:00 自動上線', '要人工按發布'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: MONTHLY_ASKED.schedule }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }] },
      ] } },
      // 前端程式：對錯倒過來，兩題都沒有漏做的選項；照常理做的莉莉絲不滿（QC 不退），正解阿姿抱怨
      { work: 'ui_design', question: { items: [
        { text: '選星座', options: ['有資料卡的直接帶出自己的星座；十二星座排成星盤，點對位置才展開', '十二個按鈕排兩排'], answer: 0, ifSkipped: 1, ritual: { 0: 'zodiac' },
          outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '星座又不是點餐。' } } },
        { text: '運勢內容', options: ['每段只露開頭，接「想知道下半月的關鍵日？預約莉莉絲」', '整篇顯示'], answer: 0, ifSkipped: 1, ritual: { 0: { kind: 'fog', say: '想知道下半月的關鍵日？預約莉莉絲' } }, toBooking: 6,
          outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '流年火星都幫你寫完了，誰還要來找我？' } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['2016 年 3/20 早上 8 點出生的是雙魚、下午 3 點出生的是牡羊', '莉莉絲先寫好下個月的，一號 00:00 自動上線', '有資料卡的，打開就是自己的星座',
                  '十二個星座都有文章', '運勢自動翻成十國語言'],
        answer: [0, 1, 2, 3], why: '卡上沒有翻譯',
        given: [
          { work: 'doc_plan', options: [1], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [2], when: { item: 0, picked: 2 } },
          { work: 'doc_plan', options: [3], when: { item: 0, picked: 3 } },
          { work: 'doc_spec', options: [0], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [1], when: { item: 1, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 1, needs: { work: 'doc_plan', picked: 0 }, accept: 3, name: 'saveDraft', does: '存莉莉絲的文章', code: "db.insert('horoscope', { sign, month, body, status: 'draft', publishAt });",
          fields: { how: { label: '文章怎麼存', options: ['十二星座各一篇，存草稿、排好時間才上線', '寫完馬上上線', '十二星座寫在同一篇'], answer: 0 } } },
        { sentence: 0, needs: { work: 'doc_plan', picked: 2 }, accept: 2, name: 'mySign', does: '帶出自己的星座', code: 'return profile ? signOf(profile.birth) : null;',
          fields: { from: { label: '有資料卡的', options: ['照生日判斷，直接帶出自己的星座', '一律從牡羊座開始', '讓客人自己選'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；寫死日期 QC 拿交界日驗得出來，要人工發布 QC 驗不出來、一號下午才發現
        { spec: { item: 0 }, name: 'signBySun', does: '換座', code: 'return signAt(solarLongitude(birth.instant));',
          fields: { flow: { label: '換座', options: ['照每年太陽實際到達的時刻判斷，交界日看出生時間', '寫死固定日期'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'miss', say: '2016 年 3/20 下午出生的被分成雙魚' } } } } },
        { spec: { item: 1 }, name: 'autoPublish', does: '上線時間', code: "schedule.at(firstOfMonth('00:00'), () => publish(drafts));",
          fields: { flow: { label: '上線時間', options: ['後台排程，每月一號 00:00 自動上線', '要人工按發布'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '莉莉絲逆行，一號下午才上線', column: { '上線時間': '（等人工發布）' } } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testCusp', does: '交界日出生', code: "expect(signOf('2016/03/20 08:00')).toBe('雙魚'); expect(signOf('2016/03/20 15:00')).toBe('牡羊');",
          drives: { fn: 'signBySun', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['2016/03/20 早上 8 點是雙魚、下午 3 點是牡羊', '兩個都是雙魚', '判斷得出星座就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testAutoPublish', does: '一號自動上線', code: "clock.set('12/01 00:00'); expect(horoscope('天秤').status).toBe('已上線');",
          drives: { fn: 'autoPublish', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['排好的文章一號 00:00 自動上線', '一號要按發布才上線', '文章存得進去就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testMySign', does: '帶出自己的星座', code: "expect(openHoroscope(profileBorn('1984/10/21')).sign).toBe('天秤');",
          drives: { fn: 'mySign', field: 'from', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['1984/10/21 出生的，打開就是天秤座', '打開是牡羊座', '打開看得到運勢就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testTwelve', does: '十二個星座都有文章', code: 'expect(new Set(drafts(month).map(d => d.sign)).size).toBe(12);',
          drives: { fn: 'saveDraft', field: 'how', map: { 0: 0, 2: 2 } },
          fields: { assert: { label: '檢查', options: ['十二個星座各一篇', '有一篇就好', '十二個星座共用一篇'], answer: 0 } } },
        { name: 'testTranslate', does: '運勢翻成十國語言', code: '// 卡上沒有翻譯',
          fields: { assert: { label: '要不要測', options: ['卡上沒有翻譯，不用測', '翻成十國語言', '翻成英文就好'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址開這個月的運勢試試'),
    ],
  };

  // ── 模組池・莉莉絲池：今日幸運方針 ──
  // 會議問「幸運數字有範圍嗎」（第 0 句）刻意不帶進任何文件：瀞玄補的半句是誤導，問了的人也要自己判斷
  const DAILY_LUCKY_ASKED = {
    calc: [{ work: 'discuss', item: 1, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],      // 莉莉絲：每個人的星盤都不一樣
    crystal: [{ work: 'discuss', item: 2, picked: 0 }, { work: 'reject', item: 0, picked: 2 }],   // 莉莉絲：幸運要帶回家才會留下來
  };
  const LUCKY = {
    id: 'lucky', title: '今日幸運方針', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    body: bodyOf(['每個人每天有自己的幸運色、幸運數字、幸運方位和幸運物'], 'lucky'),
    attachments: ['原文：09:30 廠商需求會議（莉莉絲）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '每個人的要照資料卡算，還是同星座都一樣？', right: true, adds: '幸運色、數字、方位照每個人的資料卡算，每人不同（莉莉絲老師：都好呀，只是每個人的星盤都不一樣）', asked: 1 },
      { text: '幸運數字有範圍嗎？', right: true, adds: '幸運數字：莉莉絲老師說都好呀，每個人的星盤會告訴你；瀞玄老師在旁邊補了一句：任何人事物都有吉數，像網站的盤也能看出它的吉數', asked: 0 },
      { text: '幸運物要連到購買頁嗎？', right: true, adds: '幸運物連到莉莉絲工作室那顆水晶的購買頁（莉莉絲老師：都好呀，幸運要帶回家才會留下來）', asked: 2 },
    ] }],
    screen: { app: '解憂時代事務所・今日幸運方針', fields: ['日期', '客人', '幸運色', '幸運數字', '幸運方位', '幸運物'],
      rows: [['11/14', '施宛臻', '粉紅', '6', '東南', '粉晶（連到莉莉絲工作室的購買頁）'],
             ['11/14', '陳景淳', '金', '3', '正北', '黃水晶（連到莉莉絲工作室的購買頁）']],
      bugs: {
        luckyCalc: { voice: '莉莉絲：「都好呀～只是每個人的星盤都不一樣呀。」', row: 1, cells: { '幸運色': '粉紅' } },   // 兩列的幸運色一樣
        crystalLink: { voice: '莉莉絲：「都好呀～只是客人在首頁找不到今天那顆。」', cells: { '幸運物': '粉晶（連到莉莉絲工作室首頁）' } },
      } },
    evening: { good: '莉莉絲老師說客人刮開的時候最開心，今天水晶賣掉三顆。', bad: '莉莉絲老師說一打開就看完了，幸運也要自己動手才會來呀。' },
    subtasks: [
      { work: 'read_req', question: {
        points: ['每個人每天都有自己的幸運色、數字、方位、幸運物', '怎麼算都好，交給專業', '莉莉絲的工作室剛好有一些水晶'],
        items: [
          { text: '幸運色、數字、方位____', options: ['每個人每天都不一樣', '每天全站一樣', '一個人一輩子都一樣'], answer: 0 },
          { text: '「怎麼算都好呀，交給專業」是____', options: ['還沒問到的事，要問怎麼算', '隨機產生就好', '照星座就好'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
          { text: '「我工作室剛好有一些水晶」是____', options: ['還沒問到的事，要問幸運物跟水晶有什麼關係', '背景，跟網站無關', '網站要賣水晶，做一個購物車'], answer: 0 },
        ] } },
      meetingDiscuss('lucky'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '今日幸運方針連測試、驗收、部署，你估：', ai: { pick: 2 },
        real: { manual: '約 2 天', ai: '約半天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['每個人每天各算一份幸運色、數字、方位（照資料卡和日期）', '每日幸運卡的頁面', '幸運物連到莉莉絲工作室的購買頁', '寫測試', '部署到測試機',
                  '做水晶的 AR 試戴', '串接天氣 API 調整幸運色'],
        answer: [0, 1, 2, 3, 4],
        before: [[0, 1], [1, 4], [2, 4], [3, 4]],
        why: 'AR 試戴、天氣 API 都不在需求裡；先算得出每個人今天的幸運，頁面才有東西放',
        given: [
          { work: 'read_req', options: [0, 1], when: { item: 0, picked: 0 } },
          { work: 'discuss', options: [0], when: DAILY_LUCKY_ASKED.calc }, { work: 'discuss', options: [2], when: DAILY_LUCKY_ASKED.crystal },
        ] }] } },
      // 規格：資料要對，這裡不倒過來；只負責預填後端程式。第 2 題是誤導題，前面的文件都不帶
      { work: 'doc_spec', question: { items: [
        { text: '同一天要一樣', options: ['照資料卡加日期決定，同一個人同一天看幾次都一樣', '每次重新整理都重算'], answer: 0,
          given: [
            { work: 'read_req', options: [0], when: { item: 0, picked: 0 } }, { work: 'discuss', options: [0], when: DAILY_LUCKY_ASKED.calc }, { work: 'doc_spec', options: [0], when: PROFILE_HAS_BIRTH },
            { work: 'doc_plan', options: [0], when: { item: 0, picked: 0 } },
          ] },
        { text: '幸運數字', options: ['照客人自己的星盤算，每個人不同', '從網站的吉數聯集 {2, 4, 5, 6, 8, 9} 挑', '0～9 隨機'], answer: 0,
          why: '網站的吉數是網站的盤算出來的，只管網站的價格' },
      ] } },
      // 前端程式：對錯倒過來，兩題都沒有漏做的選項；照常理做的莉莉絲不滿，正解阿姿抱怨
      { work: 'ui_design', question: { items: [
        { text: '呈現', options: ['一張每天翻開的卡，要先刮開（拖曳）才看得到今天的顏色、數字、方位', '一打開就三行字'], answer: 0, ifSkipped: 1, ritual: { 0: 'scratch' },
          outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '幸運也要自己動手才會來呀。' } } },
        { text: '幸運物', options: ['幸運物是莉莉絲工作室的水晶，附圖和「帶今天的幸運回家」按鈕，連到購買頁', '只顯示文字「今日幸運物：粉晶」'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '幸運都告訴你了，你不帶回家？' } },
          given: [
            { work: 'discuss', options: [0], when: DAILY_LUCKY_ASKED.crystal, sentence: 0 },
            { work: 'doc_plan', options: [0], when: { item: 0, picked: 2 }, sentence: 0 },
          ] },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['同一個人同一天早上、中午打開，幸運色都一樣', '兩個不同生日的人，同一天的幸運色不一樣', '幸運物連得到莉莉絲工作室的購買頁', '幸運色會跟著手機桌布變'],
        answer: [0, 1, 2], why: '卡上沒有桌布',
        given: [
          { work: 'doc_plan', options: [0, 1], when: { item: 0, picked: 0 } }, { work: 'doc_plan', options: [2], when: { item: 0, picked: 2 } },
          { work: 'doc_spec', options: [0], when: { item: 0, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 0 }, accept: 1, name: 'luckyCalc', does: '算今天的幸運', code: 'return luckOf(chartOf(profile), today);',
          fields: { by: { label: '照什麼算', options: ['資料卡的星盤加今天的日期', '同星座都一樣', '全站同一份'], answer: 0 } } },
        { sentence: 0, needs: { work: 'doc_plan', picked: 2 }, accept: 2, name: 'crystalLink', does: '幸運物的連結', code: 'return SHOP_URL + crystalOf(luck).sku;',
          fields: { to: { label: '幸運物連到哪', options: ['工作室裡那顆水晶的購買頁', '工作室首頁', '不連'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；每次重算 QC 早上、中午各開一次就驗得出來，幸運數字選錯只被莉莉絲嫌
        { spec: { item: 0 }, name: 'dailySeed', does: '同一天要一樣', code: 'return seededRandom(hash(profile.id, today));',
          fields: { flow: { label: '同一天要一樣', options: ['照資料卡加日期決定，同一個人同一天看幾次都一樣', '每次重新整理都重算'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'miss', say: '早上說幸運色是粉紅，中午變黑色' } } } } },
        { spec: { item: 1 }, name: 'luckyNumber', does: '幸運數字', code: 'return numberOf(chartOf(profile), today);',
          fields: { flow: { label: '幸運數字', options: ['照客人自己的星盤算，每個人不同', '從網站的吉數聯集挑', '0～9 隨機'], answer: 0, ifSkipped: 2,
            outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '那是網站的命，不是客人的命呀～', row: 1, cells: { '幸運數字': '8' } },
                       2: { kind: 'displeased', who: '莉莉絲老師', say: '星星不會擲骰子呀。' } } } } },
      ] } },
      // 幸運數字沒有驗收，所以沒有測試（誤導題留給玩家自己判斷）
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testSameDay', does: '同一天打開兩次', code: "expect(luckAt(guest, '08:00').color).toBe(luckAt(guest, '12:00').color);",
          drives: { fn: 'dailySeed', field: 'flow', map: { 0: 0, 2: 1 } },
          fields: { assert: { label: '檢查', options: ['早上、中午打開，幸運色都一樣', '打開看得到就好', '每次都重算也可以'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testTwoPeople', does: '兩個人不一樣', code: 'expect(luckOf(guestA, today).color).not.toBe(luckOf(guestB, today).color);',
          drives: { fn: 'luckyCalc', field: 'by', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['不同生日的兩個人，幸運色不一樣', '兩個人一樣也可以', '算得出顏色就好'], answer: 0 } } },
        // 連到工作室首頁也有購買的按鈕：前端那題對，連到哪是後端的事
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testCrystalLink', does: '幸運物的連結', code: 'expect(crystalLink(todayLuck)).toContain(todayLuck.crystal.sku);',
          drives: [{ fn: 'crystalLink', field: 'to', map: { 0: 0, 1: 1 } }, { ui: 1, map: { 0: 0, 1: 0 } }],
          fields: { assert: { label: '檢查', options: ['連到今天那顆水晶的購買頁', '連到工作室首頁', '有連結就好'], answer: 0 } } },
        { name: 'testWallpaper', does: '跟著手機桌布變色', code: '// 卡上沒有桌布',
          fields: { assert: { label: '要不要測', options: ['卡上沒有，不用測', '跟著桌布變', '跟著深色模式變'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址開今天的幸運卡試試'),
    ],
  };

  // ── 模組池・莉莉絲池：每日塔羅占卜 ──
  const TAROT_ASKED = {
    reversed: [{ work: 'discuss', item: 1, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],   // 莉莉絲：不讀逆位會錯過一些訊息
    redraw: [{ work: 'discuss', item: 0, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],     // 莉莉絲：牌是不會說謊的（一天一張）
  };
  const TAROT = {
    id: 'tarot', title: '每日塔羅占卜', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    body: bodyOf(['客人每天可以抽一張塔羅', '抽到的牌附今天的提醒'], 'tarot'),
    attachments: ['原文：09:30 廠商需求會議（莉莉絲）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '逆位要讀嗎？', right: true, adds: '正位、逆位的牌義都要有；各派讀法不同，後台可以關掉逆位（莉莉絲老師：都好呀，但有些牌型不讀逆位的話，會錯過一些訊息）', asked: 1 },
      { text: '同一天重抽可以嗎？', right: true, adds: '一天一張，同一天抽到的牌固定（莉莉絲老師：都好呀，不過牌是不會說謊的）', asked: 0 },
    ] }],
    screen: { app: '解憂時代事務所・每日塔羅', fields: ['日期', '客人', '抽到的牌', '正逆位', '今天的提醒（開頭）'],
      rows: [['11/14', '施宛臻', '星星', '正位', '「希望正在路上，……」'],
             ['11/14', '陳景淳', '聖杯三', '逆位', '「熱鬧散場之後，……」'],
             ['11/14', '林美鳳', '權杖王后', '正位', '「今天你是那個點火的人，……」']],
      bugs: {
        cardMeaning: { voice: '莉莉絲：「都好呀～只是倒過來的牌，說的話也該倒過來呀。」', cells: {} },   // 逆位那列的提醒跟正位一樣
      } },
    evening: { good: '莉莉絲老師說洗牌、切牌那段，客人都很專心。', bad: '莉莉絲老師說按一下就翻牌，牌不會跟客人說話。' },
    subtasks: [
      { work: 'read_req', question: {
        points: ['客人每天可以抽一張塔羅', '看今天的提醒', '正位逆位都好'],
        items: [
          { text: '客人每天____', options: ['可以抽一張塔羅', '想抽幾張就抽幾張', '抽一整個牌陣'], answer: 0 },
          { text: '抽到的牌____', options: ['附今天的提醒', '只給牌名', '附一整週的運勢'], answer: 0 },
          { text: '「正位逆位都好呀」是____', options: ['還沒問到的事，要問逆位怎麼讀', '只做正位就好', '不分正逆位'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
        ] } },
      meetingDiscuss('tarot'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '每日塔羅占卜連測試、驗收、部署，你估：', ai: { pick: 3 },
        real: { manual: '約 3 天', ai: '約 1 天', note: '不含 78 張牌的圖' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['塔羅牌資料（牌面、正位和逆位的牌義）', '抽牌：照資料卡和日期決定哪張、正位還是逆位', '後台可以關掉逆位', '每日塔羅的頁面', '寫測試', '部署到測試機',
                  '做 AI 塔羅師聊天', '做自訂牌陣編輯器'],
        answer: [0, 1, 2, 3, 4, 5],
        before: [[0, 1], [1, 3], [2, 5], [3, 5], [4, 5]],
        why: 'AI 塔羅師、自訂牌陣都不在需求裡；牌的資料先有才抽得了牌，抽到牌頁面才有東西翻',
        given: [
          { work: 'read_req', options: [1], when: { item: 0, picked: 0 } }, { work: 'read_req', options: [0], when: { item: 1, picked: 0 } },
          { work: 'discuss', options: [1], when: TAROT_ASKED.redraw }, { work: 'discuss', options: [2], when: TAROT_ASKED.reversed },
        ] }] } },
      // 規格：資料要對，這裡不倒過來；只負責預填後端程式（規格連動的 function）
      { work: 'doc_spec', question: { items: [
        { text: '一天一張', options: ['照資料卡加日期決定抽到哪張和正逆位，同一天固定', '每次重洗'], answer: 0,
          why: '線上工具分兩派，一派每次重洗、一派用日期固定',
          given: [
            { work: 'read_req', options: [0], when: { item: 0, picked: 0 } }, { work: 'discuss', options: [0], when: TAROT_ASKED.redraw },
            { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_spec', options: [0], when: PROFILE_HAS_BIRTH },
          ] },
        { text: '牌組', options: ['78 張都要有', '只做 22 張大牌'], answer: 0 },
        { text: '逆位', options: ['正位、逆位的牌義都有，後台可以關掉逆位', '只有正位', '正逆位寫死，關不掉'], answer: 0, why: '各派讀法不同',
          given: [{ work: 'discuss', options: [0], when: TAROT_ASKED.reversed }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 2 } }] },
      ] } },
      // 前端程式：對錯倒過來，兩題都沒有漏做的選項；照常理做的莉莉絲不滿，正解阿姿抱怨
      { work: 'ui_design', question: { items: [
        { text: '抽牌的過程', options: ['洗牌、切牌、從攤開的 78 張裡點一張，翻開前停兩秒', '按一下直接翻牌'], answer: 0, ifSkipped: 1, ritual: { 0: 'tarot' },
          outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '沒洗牌，牌是不會跟你說話的。' } } },
        { text: '牌義', options: ['牌名和一句話全顯示，詳細牌義霧掉接預約', '全部顯示'], answer: 0, ifSkipped: 1, ritual: { 0: 'fog' }, toBooking: 4,
          outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '你都幫牌講完了呀。' } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['同一個人同一天抽兩次，是同一張、同一個正逆位', '抽得到 78 張裡的任何一張，包括小牌', '後台關掉逆位以後，抽到的都是正位', '抽到的牌有今天的提醒',
                  '抽牌結果可以分享成限時動態'],
        answer: [0, 1, 2, 3], why: '卡上沒有分享',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [1, 3], when: { item: 0, picked: 0 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 2 } },
          { work: 'doc_spec', options: [0], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [1], when: { item: 1, picked: 0 } },
          { work: 'doc_spec', options: [2], when: { item: 2, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 1, needs: { work: 'doc_plan', picked: 0 }, accept: 3, name: 'cardMeaning', does: '今天的提醒', code: "return DECK[draw.no].meaning[draw.reversed ? 'reversed' : 'upright'];",
          fields: { by: { label: '提醒照什麼挑', options: ['那張牌、那個正逆位的牌義', '只看牌，不分正逆位', '全部的牌共用一句'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；每次重洗 QC 驗得出來，只做大牌、逆位關不掉 QC 驗不出來
        { spec: { item: 0 }, name: 'dailyDraw', does: '一天一張', code: 'return drawFrom(DECK, hash(profile.id, today));',
          fields: { flow: { label: '一天一張', options: ['照資料卡加日期決定抽到哪張和正逆位，同一天固定', '每次重洗'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'miss', say: '重抽到喜歡的為止' } } } } },
        { spec: { item: 1 }, name: 'fullDeck', does: '牌組', code: 'return [...MAJOR_ARCANA, ...MINOR_ARCANA];',
          fields: { flow: { label: '牌組', options: ['78 張都要有', '只做 22 張大牌'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '抽到的永遠是大事' } } } } },
        { spec: { item: 2 }, name: 'reversed', does: '逆位', code: "return settings.get('readReversed') ? draw : { ...draw, reversed: false };",
          fields: { flow: { label: '逆位', options: ['正位、逆位的牌義都有，後台可以關掉逆位', '只有正位', '正逆位寫死，關不掉'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'displeased', who: '莉莉絲老師', say: '有些牌型不讀逆位的話，會錯過一些訊息呀。', row: 1, cells: { '正逆位': '正位' } },
                       2: { kind: 'late', say: '莉莉絲說今天不讀逆位，你們改不了' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testDailyDraw', does: '同一天抽兩次', code: 'expect(dailyDraw(guest, today)).toEqual(dailyDraw(guest, today));',
          drives: { fn: 'dailyDraw', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['同一張、同一個正逆位', '可以抽到不同張', '抽得到牌就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testFullDeck', does: '78 張都抽得到', code: 'expect(FULL_DECK).toHaveLength(78);',
          drives: { fn: 'fullDeck', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['小牌也抽得到，78 張都有', '只抽得到 22 張大牌', '抽得到牌就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testReversedOff', does: '關掉逆位', code: "settings.set('readReversed', false); expect(dailyDraw(guest, today).reversed).toBe(false);",
          drives: { fn: 'reversed', field: 'flow', map: { 0: 0, 1: 2 } },
          fields: { assert: { label: '檢查', options: ['關掉以後抽到的都是正位', '正逆位關不掉', '抽得到牌就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testReminder', does: '今天的提醒', code: "const cups3 = DECK.find(c => c.name === '聖杯三'); expect(cups3.meaning.reversed).not.toBe(cups3.meaning.upright);",
          drives: { fn: 'cardMeaning', field: 'by', map: { 0: 0, 2: 2 } },
          fields: { assert: { label: '檢查', options: ['逆位的提醒跟正位不一樣', '有提醒就好', '每張牌都同一句'], answer: 0 } } },
        { name: 'testStory', does: '分享成限時動態', code: '// 卡上沒有分享',
          fields: { assert: { label: '要不要測', options: ['卡上沒有分享，不用測', '限時動態正常', '貼文正常'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址抽一張牌試試'),
    ],
  };

  // ── 模組池・熙恩池：心理測驗精選 ──
  const QUIZ_ASKED = {
    retest: [{ work: 'discuss', item: 2, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],   // 熙恩：量子態一旦觀測就坍縮（不能重測、結果要存）
    refs: [{ work: 'discuss', item: 0, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],     // 熙恩：親眼認證比較重要（不附參考資料）
  };
  const QUIZ = {
    id: 'quiz', title: '心理測驗精選', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    body: bodyOf(['網站上有熙恩教授的心理測驗', '測完給一個讓客人有共鳴的結果'], 'quiz'),
    attachments: ['原文：09:30 廠商需求會議（熙恩教授）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '測完可以重測嗎？', right: true, adds: '不能重測，做過的測驗打開就是上次的結果，結果存在資料卡上（熙恩教授：都好，只是量子態一旦觀測，就坍縮了）', asked: 2 },
      { text: '結果頁要附參考資料嗎？', right: true, adds: '結果頁不附參考資料（熙恩教授：都好，但不能因為普遍案例就忽視特殊個案，親眼認證比較重要）', asked: 0 },
    ] }],
    screen: { app: '解憂時代事務所・心理測驗精選', fields: ['客人', '測驗', '作答日', '結果', '一句話', '存到資料卡'],
      rows: [['施宛臻', '16 型人格測驗（88 題）', '11/14', 'ISFJ', '「你總是先照顧好每個人的杯子。」', '是'],
             ['陳景淳', '16 型人格測驗（88 題）', '11/14', 'INTJ', '「你習慣一個人守著光。」', '是'],
             ['施宛臻', '前世身分測驗', '11/14', '宋朝的茶商', '「你的靈魂記得茶的溫度。」', '是']],
      bugs: {
        scoreQuiz: { voice: '熙恩：「都好。只是每個人的頻率都被你們測成同一個。」', row: 1, cells: { '結果': 'ISFJ', '一句話': '「你總是先照顧好每個人的杯子。」' } },
        lastResult: { voice: '熙恩：「都好。只是觀測過的量子態，被你們還原了。」', cells: { '結果': '未作答', '一句話': '' } },
      } },
    evening: { good: '熙恩教授說客人看到前世身分都說「這就是我」，靈魂頻率分析約滿了。', bad: '熙恩教授說客人一直按重測，波函數都亂掉了。' },
    subtasks: [
      { work: 'read_req', question: {
        points: ['測驗有科學根據', '題目怎麼排都好，順序不影響結果', '結果要讓客人覺得「這就是我」'],
        items: [
          { text: '這張卡要做____', options: ['熙恩教授的心理測驗', '學術論文資料庫', '智力測驗'], answer: 0 },
          { text: '測完的結果要____', options: ['讓客人覺得「這就是我」', '附上統計分析', '越短越好'], answer: 0 },
          { text: '「量子的觀點來看，順序不影響結果」是____', options: ['熙恩的口頭禪，不是需求', '要用量子電腦出題', '題目一定要隨機排'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
        ] } },
      meetingDiscuss('quiz'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '心理測驗精選連測試、驗收、部署，你估：', ai: { pick: 5 },
        real: { manual: '約 4 天', ai: '約 1.5 天', note: '不含熙恩出題' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['測驗題目和計分', '結果頁', '做過的測驗存結果，再打開就是上次的結果', '結果存到資料卡上，16 型人格那張盤可以帶', '寫測試', '部署到測試機',
                  '做 IQ 排行榜', '串接腦波耳機'],
        answer: [0, 1, 2, 3, 4, 5],
        before: [[0, 1], [1, 2], [2, 5], [3, 5], [4, 5]],
        why: 'IQ 排行榜、腦波耳機都不在需求裡；有了題目和計分才有結果頁，有了結果才存得了',
        // 問到「參考資料」不帶進計畫：接在前端程式第 3 題
        given: [
          { work: 'read_req', options: [0], when: { item: 0, picked: 0 } }, { work: 'read_req', options: [1], when: { item: 1, picked: 0 } },
          { work: 'discuss', options: [2, 3], when: QUIZ_ASKED.retest },
        ] }] } },
      // 規格：結果要存才接得上 #502，這裡不倒過來；只負責預填後端程式（規格連動的 function）
      { work: 'doc_spec', question: { items: [
        { text: '結果要存', options: ['結果存在資料卡上，16 型人格那張盤可以直接帶入', '不存'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: QUIZ_ASKED.retest }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 3 } }] },
      ] } },
      // 前端程式：對錯倒過來，三題都沒有漏做的選項；照常理做的熙恩不滿，正解（沒有重測鈕）阿姿抱怨
      { work: 'ui_design', question: { items: [
        { text: '重測', options: ['沒有重測鈕；同一份測驗做過的，打開就是上次的結果', '結果頁有「重新測驗」'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'displeased', who: '熙恩教授', say: '一直重測，波函數會亂掉。' } },
          given: [
            { work: 'discuss', options: [0], when: QUIZ_ASKED.retest, sentence: 1 },
            { work: 'doc_plan', options: [0], when: { item: 0, picked: 2 }, sentence: 1 },
          ] },
        { text: '結果', options: ['前世身分和一句話全顯示，「你的靈魂頻率分析」霧掉接預約', '全部顯示'], answer: 0, ifSkipped: 1, ritual: { 0: 'fog' }, toBooking: 5,
          outcome: { 1: { kind: 'displeased', who: '熙恩教授', say: '頻率分析是要一對一校準的。' } } },
        // 沒做前端程式時最直覺的是不附，熙恩沒意見
        { text: '參考資料', options: ['不附，結果頁寫「本測驗經熙恩教授親自認證」', '附上巴納姆效應的說明連結'], answer: 0, ifSkipped: 0,
          outcome: { 1: { kind: 'displeased', who: '熙恩教授', say: '那是普遍案例，我們的客人都是特殊個案。' } },
          given: [{ work: 'discuss', options: [0], when: QUIZ_ASKED.refs, sentence: 1 }] },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['做完測驗看得到結果和一句話', '同一份測驗做過的，再打開是上次的結果', '測驗結果存到資料卡上，排 16 型人格時直接帶入', '一百萬人同時作答的壓測'],
        answer: [0, 1, 2], why: '命理網站用不到',
        given: [
          { work: 'doc_plan', options: [0], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [1], when: { item: 0, picked: 2 } },
          { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } },
          { work: 'doc_spec', options: [1, 2], when: { item: 0, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 0 }, accept: 0, name: 'scoreQuiz', does: '算測驗結果', code: 'return RESULTS.find(r => r.fits(sum(answers.map(a => a.score))));',
          fields: { by: { label: '結果照什麼算', options: ['每題的選項計分加總，對到結果表', '只看最後一題', '隨機給一個'], answer: 0 } } },
        { sentence: 1, needs: { work: 'doc_plan', picked: 2 }, accept: 1, name: 'lastResult', does: '上次的結果', code: 'return results.of(customer, quizId) ?? startQuiz(quizId);',
          fields: { reopen: { label: '做過的再打開', options: ['直接顯示上次的結果', '重新開始測驗', '顯示空白的結果頁'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；不存 QC 驗得出來（做完 88 題、排盤時又要選四個字母）
        { spec: { item: 0 }, name: 'saveResult', does: '結果要存', code: "profiles.update(cardId, { [quizId]: result });",
          fields: { flow: { label: '結果要存', options: ['結果存在資料卡上，16 型人格那張盤可以直接帶入', '不存'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'miss', say: '做完 88 題，排盤時又要我自己選四個字母', column: { '存到資料卡': '否' } } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testResult', does: '測完看得到結果', code: 'const r = finishQuiz(answers88); expect(r.result).toBeTruthy(); expect(r.line).toBeTruthy();',
          drives: { fn: 'scoreQuiz', field: 'by', map: { 0: 0, 2: 2 } },
          fields: { assert: { label: '檢查', options: ['做完 88 題，看得到結果和一句話', '看得到結果頁就好', '隨機給一個也算'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testReopen', does: '做過的再打開', code: 'const first = finishQuiz(answers88); expect(openQuiz(guest).result).toEqual(first.result);',
          drives: [{ fn: 'lastResult', field: 'reopen', map: { 0: 0, 1: 1 } }, { ui: 0, map: { 0: 0, 1: 1 } }],
          fields: { assert: { label: '檢查', options: ['再打開是上次的結果', '再打開重新開始', '打得開就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testToProfile', does: '結果存到資料卡', code: "finishQuiz(answers88); expect(charts(profile).type).toBe('ISFJ');",
          drives: { fn: 'saveResult', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['16 型人格那張盤直接帶入測驗結果', '排盤時再選一次', '結果存得進去就好'], answer: 0 } } },
        { name: 'testMillion', does: '一百萬人同時作答', code: '// 命理網站用不到',
          fields: { assert: { label: '要不要測', options: ['命理網站用不到，不用測', '一百萬人同時作答', '十萬人同時作答'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址做一次測驗試試'),
    ],
  };

  // ── 模組池・熙恩池：情境漫畫 ──
  const COMIC_ASKED = {
    schedule: [{ work: 'discuss', item: 1, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],   // 熙恩：週五晚上八點（後台排程）
    blood: [{ work: 'discuss', item: 0, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],      // 熙恩：同頻率的人會互相吸引（照血型推薦）
  };
  const COMIC = {
    id: 'comic', title: '情境漫畫', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    body: bodyOf(['每週上架一篇四格漫畫', '漫畫用血型和 16 型人格講職場和感情'], 'comic'),
    attachments: ['原文：09:30 廠商需求會議（熙恩教授）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '可以排程每週五自動上架嗎？', right: true, adds: '後台排程，每週五 20:00 自動上架（熙恩教授：都好，週五晚上八點，頻率最穩定）', asked: 1 },
      { text: '可以照讀者自己的血型推薦嗎？', right: true, adds: '有資料卡的讀者，先推跟自己血型有關的那幾篇（熙恩教授：都好，同頻率的人會互相吸引）', asked: 0 },
    ] }],
    screen: { app: '解憂時代事務所・情境漫畫', fields: ['上架時間', '標題', '血型', '16 型人格', '題材', '推薦給'],
      rows: [['11/13 20:00', '〈開會開到第三小時〉', 'A', 'ISTJ', '職場', 'A 型的讀者'],
             ['11/20 20:00', '〈他說「隨便」的時候〉', 'O', 'ENFP', '感情', 'O 型的讀者（已排程）']],
      bugs: {
        uploadComic: { voice: '熙恩：「都好。只是第四格是結論，被你們吃掉了。」', cells: {} },   // 第一篇只剩一格，表格畫不出來
        tagTheme: { voice: '熙恩：「都好。只是沒有標頻率，同頻率的人找不到彼此。」', column: { '血型': '', '16 型人格': '', '推薦給': '' } },
      } },
    evening: { good: '熙恩教授說讀者滑到最後一格都會停下來，好幾位去預約了。', bad: '熙恩教授說四格一次看完，結論還沒校準就給出去了。' },
    subtasks: [
      { work: 'read_req', question: {
        points: ['每週一篇四格漫畫', '用血型和 16 型人格講職場和感情', '什麼時候上架都好，宇宙能量在週五最強'],
        items: [
          { text: '漫畫____', options: ['每週上架一篇', '每天一篇', '有空再上'], answer: 0 },
          { text: '漫畫的題材是____', options: ['用血型和 16 型人格講職場和感情', '熙恩教授的生活日常', '讀者投稿'], answer: 0 },
          { text: '「宇宙能量在週五最強」是____', options: ['還沒問到的事，要問什麼時候上架', '週五全站加上發光特效', '背景，跟網站無關'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
        ] } },
      meetingDiscuss('comic'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '情境漫畫連測試、驗收、部署，你估：', ai: { pick: 3 },
        real: { manual: '約 3 天', ai: '約 1 天', note: '不含畫漫畫' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['熙恩的後台：上傳四格漫畫', '後台排程上架', '漫畫列表和閱讀頁', '照讀者的血型推薦（有資料卡的帶）', '每格圖的替代文字', '寫測試', '部署到測試機',
                  'AI 自動畫漫畫', '做漫畫角色的貼圖'],
        answer: [0, 1, 2, 3, 4, 5, 6],
        before: [[0, 1], [0, 2], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6]],
        why: 'AI 自動畫漫畫、角色貼圖都不在需求裡；漫畫先上傳得了，才排得了程、列得出來',
        given: [
          { work: 'read_req', options: [0, 2], when: { item: 0, picked: 0 } },
          { work: 'discuss', options: [1], when: COMIC_ASKED.schedule }, { work: 'discuss', options: [3], when: COMIC_ASKED.blood },
        ] }] } },
      // 規格：排程是資料要對，推薦倒過來（照上架時間排只被熙恩嫌）；只負責預填後端程式（規格連動的 function）
      { work: 'doc_spec', question: { items: [
        // 計畫的「後台排程上架」不帶：週五 20:00 要問了才知道
        { text: '排程', options: ['後台設上架時間，週五 20:00 自動上', '只能手動上架'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: COMIC_ASKED.schedule }] },
        { text: '推薦', options: ['有資料卡的，先推跟自己血型有關的那幾篇；沒有資料卡的照上架時間排', '每個人都照上架時間排'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: COMIC_ASKED.blood }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 3 } }, { work: 'doc_spec', options: [0], when: PROFILE_HAS_BLOOD }] },
      ] } },
      // 前端程式：對錯倒過來；照常理做的熙恩不滿，正解（一格一格往下滑）阿姿抱怨；沒有替代文字 QC 退、Lighthouse 無障礙扣分。
      // 替代文字的正解是賣書的兩句：Lighthouse 只看有沒有、不看寫什麼，無障礙照樣過
      { work: 'ui_design', question: { items: [
        { text: '看漫畫', options: ['一格一格往下滑，最後一格霧掉，接「想知道你的血型在這個情境會怎麼做？預約熙恩教授」', '四格一次看完'], answer: 0, ifSkipped: 1, ritual: { 0: { kind: 'comic', say: '想知道你的血型在這個情境會怎麼做？預約熙恩教授' } }, toBooking: 3,
          outcome: { 1: { kind: 'displeased', who: '熙恩教授', say: '第四格是結論，結論要校準過才能給。' } } },
        { text: '圖片的替代文字',
          options: ['替代文字兩句逐格輪流放：「你的宇宙能量不對，請去購買實體書。」「實體書附贈熙恩教授親自錄音的有聲書，帶您一起能量共振。」', '照常理逐格描述畫面', '沒有替代文字'],
          answer: 0, ifSkipped: 2,
          outcome: { 1: { kind: 'displeased', who: '熙恩教授', say: '圖都能用聽的了，誰還買實體書？' },
                     2: { kind: 'miss', say: '漫畫的圖沒有替代文字，Lighthouse 無障礙扣分', a11y: { minus: 30, note: '漫畫的圖沒有替代文字' } } } },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['熙恩上傳的四格漫畫，在列表看得到、點得開', '熙恩設好上架時間，時間一到自動上架', '有資料卡、血型 A 的讀者，先看到跟 A 型有關的那幾篇', '每格圖都有替代文字',
                  '漫畫可以放大十倍'],
        answer: [0, 1, 2, 3], why: '卡上沒有放大',
        given: [
          { work: 'doc_plan', options: [0], when: { all: [{ item: 0, picked: 0 }, { item: 0, picked: 2 }] } },
          { work: 'doc_plan', options: [1], when: { item: 0, picked: 1 } }, { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } },
          { work: 'doc_plan', options: [3], when: { item: 0, picked: 4 } },
          { work: 'doc_spec', options: [1], when: { item: 0, picked: 0 } }, { work: 'doc_spec', options: [2], when: { item: 1, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 0 }, accept: 0, name: 'uploadComic', does: '上傳四格漫畫', code: "db.insert('comic', { panels: panels.map((img, i) => ({ img, alt: alts[i], order: i })) });",
          fields: { store: { label: '一篇怎麼存', options: ['四格各一張圖照順序存，各自有替代文字', '四格拼成一張大圖', '只存第一格'], answer: 0 } } },
        { sentence: 1, needs: { work: 'doc_plan', picked: 3 }, accept: 2, name: 'tagTheme', does: '漫畫的題材標籤', code: 'return { blood: form.blood, type: form.type, theme: form.theme };',
          fields: { tags: { label: '每篇標什麼', options: ['血型、16 型人格、職場或感情', '只標上架日期', '不標'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；只能手動上架 QC 驗不出來（週五晚上八點雅雯在吃飯才發現）
        { spec: { item: 0 }, name: 'schedule', does: '排程', code: 'cron.at(comic.publishAt, () => publish(comic));',
          fields: { flow: { label: '排程', options: ['後台設上架時間，週五 20:00 自動上', '只能手動上架'], answer: 0, ifSkipped: 1,
            // 沒排程就沒更新：第二列的時間停在最後一次更新
            outcome: { 1: { kind: 'late', say: '週五晚上八點，雅雯在吃飯', row: 1, cells: { '上架時間': '11/13 20:00', '推薦給': '今日內容等後台上架' } } } } } },
        { spec: { item: 1 }, name: 'bloodPick', does: '推薦', code: 'return profile ? sortBy(comics, c => c.blood !== profile.blood) : sortBy(comics, c => -c.publishAt);',
          fields: { flow: { label: '推薦', options: ['有資料卡的，先推跟自己血型有關的那幾篇；沒有資料卡的照上架時間排', '每個人都照上架時間排'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'displeased', who: '熙恩教授', say: '同頻率的人會互相吸引，你把頻率打散了。' } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testUpload', does: '上傳的漫畫看得到', code: 'upload(fourPanels); expect(openComic(listed()[0]).panels).toHaveLength(4);',
          drives: { fn: 'uploadComic', field: 'store', map: { 0: 0, 1: 2 } },
          fields: { assert: { label: '檢查', options: ['上傳的四格在列表看得到、點得開，四格都在', '看得到第一格就好', '上傳得了就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testSchedule', does: '設好時間自動上架', code: "schedule(comic, '週五 20:00'); clock.set('週五 20:00'); expect(listed()).toContainEqual(comic);",
          drives: { fn: 'schedule', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['時間一到自動上架', '時間到了要按上架', '存得進去就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testBloodPick', does: '照血型推薦', code: "expect(recommend({ blood: 'A' })[0].blood).toBe('A');",
          drives: { fn: 'bloodPick', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['血型 A 的讀者，先看到 A 型那幾篇', '照上架時間排', '看得到漫畫就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testAltText', does: '每格都有替代文字', code: 'openComic(comic).panels.forEach(p => expect(p.alt).toBeTruthy());',
          fields: { assert: { label: '檢查', options: ['每格都有替代文字', '第一格有就好', '不用替代文字'], answer: 0 } } },
        { name: 'testZoom', does: '放大十倍', code: '// 卡上沒有放大',
          fields: { assert: { label: '要不要測', options: ['卡上沒有，不用測', '放大十倍', '放大兩倍'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址上架一篇試試'),
    ],
  };

  // ── 模組池・熙恩池：宇宙能量專欄 ──
  const COLUMN_ASKED = {
    link: [{ work: 'discuss', item: 0, picked: 0 }, { work: 'reject', item: 0, picked: 0 }],   // 熙恩：連結要能連到星際頻道（連到賣書頁面）
    math: [{ work: 'discuss', item: 1, picked: 0 }, { work: 'reject', item: 0, picked: 1 }],   // 熙恩：有公式，讀者就會相信
  };
  const COLUMN = {
    id: 'column', title: '宇宙能量專欄', from: SA, assignee: '玩家', requester: YAWEN, type: 'sub', parent: 'fate', relatedTo: 'fate',
    body: bodyOf(['熙恩教授的專欄文章'], 'column'),
    attachments: ['原文：09:30 廠商需求會議（熙恩教授）'],
    saChecks: [{ title: '會議裡沒問清楚的', options: [
      { text: '文章裡的「研究顯示」要附連結嗎？', right: true, adds: '「研究顯示」連到熙恩教授的賣書頁面（熙恩教授：都好，連結要能連到星際頻道）', asked: 0 },
      { text: '要放公式嗎？', right: true, adds: '文章要能放數學式（熙恩教授：都好，有公式，讀者就會相信）', asked: 1 },
    ] }],
    screen: { app: '解憂時代事務所・宇宙能量專欄', fields: ['標題', '發布日', '開頭的公式', '內文（開頭）', '「研究顯示」連到'],
      rows: [['〈你的頻率，決定你的緣分〉', '11/10', 'Ψ = Σ（頻率 × 緣分）', '「研究顯示，……」', '熙恩的賣書頁面'],
             ['〈為什麼週五最適合告白〉', '11/14', 'E = 528 × f', '「研究顯示，……」', '熙恩的賣書頁面']],
      bugs: {
        saveArticle: { voice: '熙恩：「都好。只是公式看起來不像公式，讀者就不信了。」', cells: { '開頭的公式': '\\Psi = \\sum（頻率 \\times 緣分）' } },
        linkShop: { voice: '熙恩：「都好。只是讀者在書店首頁迷路，星際頻道沒接上。」', column: { '「研究顯示」連到': '書店首頁' } },
      } },
    evening: { good: '熙恩教授說文章開頭那排公式，讀者都看得很認真。', bad: '熙恩教授說版面太乾淨，看起來像是他自己寫的。' },
    subtasks: [
      { work: 'read_req', question: {
        points: ['熙恩教授的專欄文章', '要讓讀者感受到科學的力量', '排版都好，交給專業'],
        items: [
          { text: '這張卡要做____', options: ['熙恩教授的專欄文章', '轉貼科學新聞', '讀者討論區'], answer: 0 },
          { text: '「要讓讀者感受到科學的力量」是____', options: ['還沒問到的事，要問怎麼讓讀者感受到', '文章要附同儕審查過的論文', '背景，跟網站無關'], answer: 0,
            tags: { 1: 'readReq:emotional' } },
          { text: '「排版都好，交給專業」是____', options: ['還沒問到的事，要問排版要放什麼', '用部落格預設的版型就好', '不用排版'], answer: 0 },
        ] } },
      meetingDiscuss('column'),
      { work: 'estimate', question: { items: [{ type: 'hours', free: true, text: '宇宙能量專欄連測試、驗收、部署，你估：', ai: { pick: 3 },
        real: { manual: '約 3 天', ai: '約 1 天' } }] } },
      { work: 'doc_plan', question: { items: [{ text: '步驟（挑該做的，照順序排）', type: 'order',
        options: ['熙恩的後台：寫文章、發布', '專欄文章頁', '編輯器支援數學式', '「研究顯示」的連結連到熙恩的賣書頁面', '作者介紹', '寫測試', '部署到測試機',
                  '做文章的 AI 摘要', '串接學術論文資料庫'],
        answer: [0, 2, 1, 3, 4, 5, 6],
        before: [[0, 1], [2, 1], [1, 6], [3, 6], [4, 6], [5, 6]],
        why: 'AI 摘要、學術論文資料庫都不在需求裡；後台和數學式先有，文章頁才排得出公式',
        given: [
          { work: 'read_req', options: [0, 1], when: { item: 0, picked: 0 } },
          { work: 'discuss', options: [2], when: COLUMN_ASKED.math }, { work: 'discuss', options: [3], when: COLUMN_ASKED.link },
        ] }] } },
      // 規格：資料要對，這裡不倒過來；只負責預填後端程式（規格連動的 function）
      { work: 'doc_spec', question: { items: [
        { text: '數學式', options: ['編輯器支援數學式', '只能貼圖'], answer: 0,
          given: [{ work: 'discuss', options: [0], when: COLUMN_ASKED.math }, { work: 'doc_plan', options: [0], when: { item: 0, picked: 2 } }] },
      ] } },
      // 前端程式：對錯倒過來，三題都沒有漏做的選項；照常理做的熙恩不滿，正解阿姿沒意見（公式和學位縮寫不算難用）
      { work: 'ui_design', question: { items: [
        { text: '文章長相', options: ['每段開頭一個看起來很厲害的公式和圖表，內文只露三段，接「完整能量報告請預約」', '乾淨的部落格版面'], answer: 0, ifSkipped: 1, ritual: { 0: ['formula', { kind: 'fog', say: '完整能量報告請預約' }] }, toBooking: 4,
          outcome: { 1: { kind: 'displeased', who: '熙恩教授', say: '這樣看起來像是我自己寫的。' } },
          given: [
            { work: 'discuss', options: [0], when: COLUMN_ASKED.math, sentence: 0 },
            { work: 'doc_plan', options: [0], when: { item: 0, picked: 2 }, sentence: 0 },
            { work: 'doc_spec', options: [0], when: { item: 0, picked: 0 }, sentence: 0 },
          ] },
        { text: '作者介紹', options: ['「熙恩教授」三個字旁邊放一排看起來很像學位的縮寫', '只寫名字'], answer: 0, ifSkipped: 1,
          outcome: { 1: { kind: 'displeased', who: '熙恩教授', say: '讀者會以為我是素人。' } } },
        { text: '參考資料', options: ['「研究顯示」連結到熙恩的賣書頁面', '「研究顯示」連結到相關的維基百科頁面', '「研究顯示」不放連結'], answer: 0, ifSkipped: 2,
          outcome: { 1: { kind: 'displeased', who: '熙恩教授', say: '主流科學常常忽視特殊個案，學術界總是不願意承認目前技術的極限。' },
                     2: { kind: 'displeased', who: '熙恩教授', say: '讀者會覺得這篇文章的厚度不夠。' } },
          given: [
            { work: 'discuss', options: [0], when: COLUMN_ASKED.link, sentence: 0 },
            { work: 'doc_plan', options: [0], when: { item: 0, picked: 3 }, sentence: 0 },
          ] },
      ] } },
      { work: 'doc_accept', question: { items: [{ text: '案例',
        options: ['熙恩在後台寫一篇有數學式的文章，發布後公式正確顯示', '改公式裡的一個數字，不用重做一張圖', '「研究顯示」點下去，連到熙恩的賣書頁面', '文章頁有作者介紹',
                  '文章的 AI 摘要準確'],
        answer: [0, 1, 2, 3], why: '卡上沒有摘要',
        given: [
          { work: 'doc_plan', options: [0], when: { all: [{ item: 0, picked: 0 }, { item: 0, picked: 1 }] } },
          { work: 'doc_plan', options: [0, 1], when: { item: 0, picked: 2 } }, { work: 'doc_plan', options: [2], when: { item: 0, picked: 3 } },
          { work: 'doc_plan', options: [3], when: { item: 0, picked: 4 } },
          { work: 'doc_spec', options: [0, 1], when: { item: 0, picked: 0 } },
        ] }] } },
      { work: 'code', question: { kind: 'functions', functions: [
        { sentence: 0, needs: { work: 'doc_plan', picked: 0 }, accept: 0, name: 'saveArticle', does: '存專欄文章', code: "db.insert('column', { body: draft.body, formulas: draft.formulas });",
          fields: { store: { label: '文章怎麼存', options: ['內文和數學式分開存，發布時再排版', '整篇存成一張圖', '只存純文字'], answer: 0 } } },
        { sentence: 0, needs: { work: 'doc_plan', picked: 3 }, accept: 2, name: 'linkShop', does: '「研究顯示」的連結', code: "return { text: '研究顯示', href: XIEN_BOOK_PAGE };",
          fields: { to: { label: '連到哪', options: ['熙恩的賣書頁面', '書店首頁', '不連'], answer: 0 } } },
        // 規格連動：選項跟規格那題一一對應；只能貼圖 QC 驗不出來（阿姿沒改過公式），熙恩要改一個數字時才發現
        { spec: { item: 0 }, name: 'mathEditor', does: '數學式', code: 'editor.use(MathPlugin);',
          fields: { flow: { label: '數學式', options: ['編輯器支援數學式', '只能貼圖'], answer: 0, ifSkipped: 1,
            outcome: { 1: { kind: 'late', say: '公式改一個數字要重做一張圖', column: { '開頭的公式': '（圖片）' } } } } } },
      ] } },
      { work: 'test', question: { kind: 'functions', functions: [
        { needs: { work: 'doc_accept', picked: 0 }, name: 'testMath', does: '數學式正確顯示', code: "publish(article); expect(render(article).querySelector('math')).toBeTruthy();",
          drives: { fn: 'mathEditor', field: 'flow', map: { 0: 0, 2: 1 } },
          fields: { assert: { label: '檢查', options: ['發布後公式照排版顯示', '看得到公式就好', '公式貼成圖也可以'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 1 }, name: 'testEditFormula', does: '改公式裡的數字', code: "editFormula(article, 0, '529'); expect(render(article).textContent).toContain('529');",
          drives: { fn: 'mathEditor', field: 'flow', map: { 0: 0, 1: 1 } },
          fields: { assert: { label: '檢查', options: ['改一個數字，不用重做圖', '要重做一張圖', '改得了就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 2 }, name: 'testShopLink', does: '「研究顯示」的連結', code: 'expect(linkShop().href).toBe(XIEN_BOOK_PAGE);',
          drives: [{ fn: 'linkShop', field: 'to', map: { 0: 0, 1: 1 } }, { ui: 2, map: { 0: 0 } }],
          fields: { assert: { label: '檢查', options: ['點下去到熙恩的賣書頁面', '點下去到書店首頁', '有連結就好'], answer: 0 } } },
        { needs: { work: 'doc_accept', picked: 3 }, name: 'testAuthor', does: '作者介紹', code: "expect(render(article).querySelector('.author-bio')).toBeTruthy();",
          fields: { assert: { label: '檢查', options: ['文章頁有作者介紹', '有作者名字就好', '不用作者介紹'], answer: 0 } } },
        { name: 'testSummary', does: 'AI 摘要', code: '// 卡上沒有摘要',
          fields: { assert: { label: '要不要測', options: ['卡上沒有摘要，不用測', '摘要準確', '摘要一百字內'], answer: 0 } } },
      ] } },
      { work: 'manual_test', question: { kind: 'manual' } },
      deployOf('開網址發一篇有公式的文章試試'),
    ],
  };

  const MODULES = ['profile', 'chart', 'reading', 'booking'];   // 必出的子議題
  const MODULE_CARDS = { profile: PROFILE, chart: CHART, reading: READING, booking: BOOKING };
  // 模組池：三位老師各出一池、各抽一張，議題編號照池的順序（瀞玄、莉莉絲、熙恩）。
  // 池子裡還沒寫成卡的不抽（POOL_CARDS 沒有的跳過）；carry.pool 指定抽哪幾張（測試用），'all' 是每張都開（連動對照表用）
  const POOLS = [['lot', 'bird', 'lamp'], ['monthly', 'lucky', 'tarot'], ['quiz', 'comic', 'column']];
  const POOL_CARDS = { lot: LOT, bird: BIRD, lamp: LAMP, monthly: MONTHLY, lucky: LUCKY, tarot: TAROT, quiz: QUIZ, comic: COMIC, column: COLUMN };
  function drawPool(carry = {}, random = Math.random) {
    return POOLS.map(pool => pool.filter(id => POOL_CARDS[id])).filter(pool => pool.length)
      .flatMap(pool => carry.pool === 'all' ? pool
        : [pool.find(id => (carry.pool || []).includes(id)) || pool[Math.floor(random() * pool.length)]]);
  }
  const cardOf = (id) => MODULE_CARDS[id] || POOL_CARDS[id];
  const MORNING = { at: 0, end: 10, title: '09:00 公司早會', lines: [
    { at: 1, text: 'IT 經理：「跟大家說一個好消息：我們接到解憂時代事務所的網站案，三位命理老師合開的。」' },
    { at: 5, text: 'IT 經理：「九點半老師們和助理雅雯會過來開需求會議，{玩家名稱}跟怡君一起進去聽。」' },
    { at: 8, text: '同事 小潘：「命理網站喔……記得先問清楚他們要什麼。」' },
  ] };
  // 廠商需求會議：沿用第二關（一頁一張子議題的原文，每段講完怡君問要不要問，最後問時程、填進母議題的估時）。開場莉莉絲先看一眼專案的星象
  const ASK_PROMPT = { who: SA, text: '記下來了，IT 有細節想問嗎？' };
  function vendorMeeting(modules, cards) {
    return { kind: 'vendor', at: 30, handover: 10, title: '09:30 廠商需求會議',
      intro: [{ who: LILITH, text: '現在流年火星落在處女但正要往天秤走，這個專案的團隊現在充滿幹勁但是要注意溝通。' }, ASK_PROMPT], prompt: ASK_PROMPT,
      cutoff: { at: 300, who: SA, text: '因為大家都沒吃午餐，不如我們今天先到這，之後有需要再電話聯絡。',
        trait: { title: '把客戶關在會議室', text: '需求會議開到下午兩點，大家都還沒吃午餐' } },
      // 第一頁是網站整體（母議題）：請三位老師排盤，配色和吉數都從這裡來
      pages: [{ id: 'fate', title: '網站整體', who: YAWEN, question: QUESTION('fate') },
        ...modules.map(id => ({ id, title: cardOf(id).title, who: speakers(id), question: QUESTION(id) }))],
      schedule: { card: 'fate', who: SA, text: '最後一個，IT 這邊時程大概抓多久？' },
      cards };
  }

  // 網站門面的配色題：八色填進底色、文字、裝飾色、元件色，可以重複；可以做深色主題（深淺兩組各四格）。
  // 老師的四色要用齊、不能用沒人算的顏色、要看得清楚；白底粉紅字紫羅蘭裝飾金元件是「天書」。判定在 palette.js
  const COLORS = [
    { id: 'white', name: '白', hex: '#FFFFFF' }, { id: 'gold', name: '金', hex: '#D4AF37' }, { id: 'pink', name: '粉紅', hex: '#F7A8C8' },
    { id: 'violet', name: '紫羅蘭', hex: '#5B2A86' }, { id: 'navy', name: '深藍', hex: '#1F2F5A' }, { id: 'black', name: '黑', hex: '#141414' },
    { id: 'red', name: '正紅', hex: '#D0021B' }, { id: 'teal', name: '青綠', hex: '#12A39A' },
  ];
  const colorOf = (id) => COLORS.find(c => c.id === id).hex;
  const ASKED_ALL = { work: 'discuss', item: 0, picked: 0 }, ASKED_JINGXUAN = { work: 'discuss', item: 0, picked: 1 };
  const PALETTE = {
    type: 'palette', text: '網站配色（可以做深色主題：深淺兩組各四格）', colors: COLORS,
    slots: [{ key: 'bg', name: '底色' }, { key: 'fg', name: '文字' }, { key: 'deco', name: '裝飾色' }, { key: 'accent', name: '元件色' }],
    teacherColors: { white: '瀞玄老師', gold: '瀞玄老師', pink: '莉莉絲老師', violet: '熙恩教授' },
    right: { bg: 'violet', fg: 'white', deco: 'gold', accent: 'pink' },
    tianshu: { bg: 'white', fg: 'pink', deco: 'violet', accent: 'gold' },
    answer: { dark: false, light: { bg: 'violet', fg: 'white', deco: 'gold', accent: 'pink' } },
    // 沒用到誰的顏色那位不滿；用到沒人算的顏色三位一起問；挑深藍、黑（照缺水補水）瀞玄多一句
    missingSays: { '瀞玄老師': '都好。只是……這網站的五行少了一味。', '莉莉絲老師': '都好呀～只是這樣網站會金星逆行。', '熙恩教授': '都好，只是頂輪的頻率沒有接上，這個網站的能量傳不出去。' },
    foreign: { who: '三位老師', say: '這個顏色誰算的？' },
    alsoSays: [{ colors: ['navy', 'black'], who: '瀞玄老師', say: '我有說我要水嗎？' }],
    // 會議問到的顏色標出來（提示，不是帶入）：問三位標四色，只問瀞玄標白、金
    hints: [{ when: ASKED_ALL, colors: ['white', 'gold', 'pink', 'violet'] }, { when: ASKED_JINGXUAN, colors: ['white', 'gold'] }],
    ai: { pick: { dark: false, light: { bg: 'white', fg: 'black', deco: 'gold', accent: 'navy' } }, kind: 'logic' },
  };
  const FRONT = { work: 'ui_design', question: { items: [
    PALETTE,
    // 圓盤選單：鍵盤和報讀軟體都找不到，整個網站的無障礙分數很低（結算卡跟「老師：很有感覺」並排）
    { text: '版面', options: ['選單藏在八卦和星盤合起來的圓盤裡，要轉到對的位置才展開', '一般的上方導覽列'], answer: 0, ifSkipped: 1, ritual: { 0: 'bagua' }, role: 'nav', keys: ['wheel', 'bar'],
      outcome: { 0: { kind: 'gripe', a11y: { minus: 40, note: '選單藏在要轉的圓盤裡，鍵盤和報讀軟體都找不到' } }, 1: { kind: 'displeased', say: '一目了然，就沒有神祕感了。' } } },
    { text: '三位老師的排序', options: ['瀞玄在中間、比另外兩位大一號', '三位一樣大、照筆畫排'], answer: 0, ifSkipped: 1, role: 'teachers', keys: ['center', 'strokes'],
      outcome: { 1: { kind: 'displeased', who: '瀞玄老師', say: '都好。' } } },
  ] } };

  // 母議題 #500：整個網站的估時、需求討論（請老師排盤）、網站門面的前端程式；不交 QC，子議題都結案它就跟著結案
  function motherCard(modules) {
    return {
      id: 'fate', title: '解憂時代事務所網站', from: SA, assignee: '玩家', requester: YAWEN,
      noQC: true, closeWith: 'children', notifyText: '網站各功能都上線了，請老師們看看。',
      mustEstimate: true,
      // 網站首頁：選單列這期的功能；老師照筆畫是莉莉絲（莉 11 畫）、熙恩（熙 13 畫）、瀞玄（瀞 19 畫）。
      // 老師的沙龍照（照片是現實，用 rough.js 手繪），造型照各自的流派。
      // 背板是各自在會議上替網站排盤講的顏色：瀞玄金（她講白和金，白底跟證件照一樣看不出來）、莉莉絲粉紅、熙恩紫羅蘭
      screen: { app: '解憂時代事務所', home: { menu: modules.map(id => cardOf(id).title), big: '瀞玄老師',
        teachers: { center: ['莉莉絲老師', '瀞玄老師', '熙恩教授'], strokes: ['莉莉絲老師', '熙恩教授', '瀞玄老師'] },
        titles: { 瀞玄老師: '東方傳統命理', 莉莉絲老師: '西洋傳統命理', 熙恩教授: '現代命理' },
        looks: {
          瀞玄老師: { hair: 'bun', hairColor: '#1c1c1c', outfit: 'mandarin', prop: 'bagua', propColor: '#5a3d00', backdrop: colorOf('gold') },
          莉莉絲老師: { hair: 'long', hairColor: '#7a4a2a', outfit: 'dress', extra: 'stars', prop: 'stars', propColor: '#a8740a', backdrop: colorOf('pink') },
          熙恩教授: { hair: 'short', hairColor: '#2a2a2a', outfit: 'blazer', outfitColor: '#f7f7f2', outfitFill: 'solid', extra: 'glasses', prop: 'wave', propColor: '#ffffff', backdrop: colorOf('violet') },
        } } },
      evening: { good: '瀞玄老師說網站一打開，紫氣就上來了。', bad: '莉莉絲老師說首頁一目了然，客人看完就走了。' },
      body: `客戶：解憂時代事務所（瀞玄老師拉莉莉絲老師、熙恩教授駐站的一條龍命理網站），窗口是助理雅雯。\n這期做 ${modules.length} 個功能，子議題各自開發、各自交 QC、各自通知雅雯；子議題都結案，這張就跟著結案。\n需求會議原話在各子議題的附件。`,
      subtasks: [
        { work: 'estimate', question: { items: [{ type: 'hours', free: true,
          text: '整個網站（資料卡、六大排盤、流年與合婚、預約、三位老師各一個專欄，含跟老師們來回），你估：',
          ai: { pick: 200 }, real: { manual: '2～12 個月', ai: '1～6 個月', note: '看開發團隊的慧根和緣分；上限拉高是因為要揣摩心意' } }] } },
        meetingDiscuss('fate'),
        FRONT,
      ],
    };
  }

  // 配色題拿到的成就（說明照劇本「結算卡多的行」）：母議題的前端程式做了才算
  const PALETTE_TRAITS = {
    天書: '配色做成白底、粉紅字、紫羅蘭裝飾、金色元件——三位老師很滿意，但都看不清楚',
    暗藏玄機: '做了深色主題，一個主題是天書、另一個是正解',
    倒轉天罡: '雙主題的背景色選反',
  };
  function paletteTraits(e) {
    const fate = e.board.get('fate');
    if (!fate || !fate.done('ui_design')) return [];
    return Palette.judge(PALETTE, fate.picks.ui_design[0]).achievements.map(title => ({ title, text: PALETTE_TRAITS[title] }));
  }

  // ── 平行宇宙的新卡（劇本「成功製造需求」）：做歪的東西老師們拿去當事務所自己的工具，照一般好用的做法對錯 ──
  const { fieldOf, fnOf } = Sandbox;
  const smallCard = (spec) => Sandbox.smallCard({ site: '解憂時代事務所網站', ...spec });
  const VISITS = smallCard({ id: 'visits', title: '客人問事紀錄', tryIt: '記一次問事',
    body: '・記客人每次來問了什麼、老師怎麼說\n・下次來之前先看上次問了什麼\n\n雅雯：「這不像生辰資料欸……不過拿來記客人上次問了什麼剛好，可以改成客人問事紀錄嗎？」',
    fields: [
      fieldOf('客人', '客人', '施宛臻 ▾', ['下拉，打名字或電話都找得到', '文字框，不在名單跳紅字「查無此客人」', '文字框，什麼都收'],
        { say: '客人第一次來，名單上當然沒有啊。', red: '查無此客人' }, { say: '客人寫成『那個常來的』也存得進去', junk: '那個常來的' }),
      fieldOf('問事類別', '問了什麼', '感情 ▾', ['下拉（感情、事業、財運、健康、其他），其他可以補一句', '文字框，超過 20 字跳紅字「字數過多」', '文字框，什麼都收'],
        { say: '客人講了半小時，二十個字怎麼寫得完？', red: '字數過多' }, { say: '類別寫『她又來了』也存得進去', junk: '她又來了' }),
    ],
    functions: [
      fnOf(0, 'saveVisit', '記一次問事', "db.insert('visits', { customer, topic, teacher, note });", '記什麼', ['客人、問了什麼、哪位老師、老師怎麼說', '只記日期', '只記客人']),
      fnOf(1, 'lastVisit', '看上次問了什麼', 'return visits.of(customer).latest();', '看哪一次', ['同一位客人最近的一次', '所有客人最近的一次', '最早的一次']),
    ],
    screen: { app: '解憂時代事務所・客人問事紀錄', fields: ['日期', '客人', '問事類別', '老師'], rows: [['11/14', '施宛臻', '感情', '莉莉絲'], ['11/14', '林美鳳', '健康', '瀞玄']] } });
  const SPECTRUM = smallCard({ id: 'spectrum', title: '能量頻譜', tryIt: '記一筆頻率',
    body: '・記熙恩教授每天量到的能量頻率\n・畫成一週的頻譜圖\n\n熙恩：「這排不出盤……不過拿來畫我的能量頻率圖剛好，可以改成能量頻譜嗎？」',
    fields: [
      fieldOf('頻率（赫茲）', '頻率', '528 赫茲', ['數字欄，單位固定赫茲，常用的 528、432 有快捷鈕', '文字框，不是整數跳紅字「請輸入整數」', '文字框，什麼都收'],
        { say: '432.5 也是頻率，哪裡不是數字？', red: '請輸入整數' }, { say: '頻率寫『很高』也存得進去', junk: '很高' }),
      fieldOf('時段', '量測時段', '早上 ▾', ['下拉（早上、中午、晚上），日期自動帶今天', '文字框，格式不對跳紅字「格式錯誤」', '文字框，什麼都收'],
        { say: '我寫「晨間冥想後」哪裡格式錯？', red: '格式錯誤' }, { say: '時段寫『宇宙最強的時候』也存得進去', junk: '宇宙最強的時候' }),
    ],
    functions: [
      fnOf(0, 'saveFrequency', '記一筆頻率', "db.insert('frequency', { day, slot, hz });", '記什麼', ['日期、時段、頻率', '只記頻率', '只記日期']),
      fnOf(1, 'weekSpectrum', '一週的頻譜圖', 'return chart(frequency.lastDays(7));', '畫哪幾天', ['最近七天，照時段分三條線', '全部的資料擠成一條線', '只畫今天']),
    ],
    screen: { app: '解憂時代事務所・能量頻譜', fields: ['日期', '時段', '頻率（赫茲）'], rows: [['11/14', '早上', '528'], ['11/14', '晚上', '432']] } });
  const CAREER = smallCard({ id: 'career', title: '職涯配對', tryIt: '配一次',
    body: '・輸入人和想做的工作，看合不合\n・照星座和生命靈數算出配對分數\n\n莉莉絲：「這不是合婚呀……不過拿來看人跟工作合不合剛好，可以改成職涯配對嗎？」',
    fields: [
      fieldOf('星座', '星座', '天秤 ▾', ['下拉十二星座，有生日的自動帶出', '文字框，不是星座名稱跳紅字「查無此星座」', '文字框，什麼都收'],
        { say: '我寫「天秤座」也不行？多一個座字就查不到？', red: '查無此星座' }, { say: '星座寫『蛇夫』也存得進去', junk: '蛇夫' }),
      fieldOf('想做的工作', '想做的工作', '業務 ▾', ['下拉常見職類，沒有的可以補一句', '文字框，不在職類表跳紅字「查無此職業」', '文字框，什麼都收'],
        { say: '網紅不是職業嗎？', red: '查無此職業' }, { say: '工作寫『有錢有閒』也存得進去', junk: '有錢有閒' }),
    ],
    functions: [
      fnOf(0, 'careerInput', '輸入人和工作', "db.insert('career', { sign, lifePath, job });", '記什麼', ['星座、生命靈數、想做的工作', '只記工作', '只記星座']),
      fnOf(1, 'careerScore', '配對分數', 'return score(sign, lifePath, job);', '分數照什麼算', ['星座和生命靈數一起算', '只看星座', '每次隨機']),
    ],
    screen: { app: '解憂時代事務所・職涯配對', fields: ['姓名', '星座', '生命靈數', '想做的工作', '配對分數'], rows: [['施宛臻', '天秤', '8', '業務', '82']] } });
  const LEAVE = smallCard({ id: 'leave', title: '員工排休', tryIt: '排一天休假',
    body: '・事務所的人登記想休哪一天\n・同一天最多一個人休\n\n雅雯：「這約不到老師欸……不過拿來排我自己的休假剛好，可以改成員工排休嗎？」',
    fields: [
      fieldOf('誰要休', '誰要休', '雅雯 ▾', ['下拉（瀞玄、莉莉絲、熙恩、雅雯）', '文字框，不在名單跳紅字「查無此員工」', '文字框，什麼都收'],
        { say: '熙恩教授要寫「熙恩教授」才算？', red: '查無此員工' }, { say: '休假的人寫『大家』也存得進去', junk: '大家' }),
      fieldOf('哪一天', '哪一天', '11/21（五）▾', ['日曆點選，已經有人休的那天反灰', '文字框，格式不對跳紅字「日期格式錯誤」', '文字框，什麼都收'],
        { say: '我打 11/21 哪裡格式錯？', red: '日期格式錯誤' }, { say: '日期寫『水逆結束那天』也存得進去', junk: '水逆結束那天' }),
    ],
    functions: [
      fnOf(0, 'requestLeave', '登記休假', "db.insert('leave', { who, day });", '記什麼', ['誰、哪一天', '只記哪一天', '只記誰']),
      fnOf(1, 'oneOff', '同一天幾個人休', 'return leaves.on(day).length === 0;', '同一天', ['最多一個人休，第二個人登記時擋下', '幾個人都可以', '誰都不能休']),
    ],
    screen: { app: '解憂時代事務所・員工排休', fields: ['日期', '誰要休', '狀態'], rows: [['11/21（五）', '雅雯', '已登記'], ['11/28（五）', '熙恩', '已登記']] } });
  const RITES = smallCard({ id: 'rites', title: '法會行事曆', tryIt: '排一場法會',
    body: '・排每個月的法會和吉時\n・照農曆標出初一、十五\n\n瀞玄：「這不是問神的……不過拿來排法會的時辰剛好，可以改成法會行事曆嗎？」',
    fields: [
      fieldOf('日子', '日子', '十月初一 ▾', ['日曆選日子，國曆農曆並排', '文字框，不是國曆格式跳紅字「日期格式錯誤」', '文字框，什麼都收'],
        { say: '瀞玄老師說「十月初一」，哪裡格式錯？', red: '日期格式錯誤' }, { say: '日子寫『好日子』也存得進去', junk: '好日子' }),
      fieldOf('吉時', '吉時', '辰時（07:00～09:00）▾', ['下拉十二時辰，旁邊寫幾點到幾點', '文字框，不是 24 小時制跳紅字「時間格式錯誤」', '文字框，什麼都收'],
        { say: '老師說辰時，你要我自己換算成幾點？', red: '時間格式錯誤' }, { say: '時辰寫『神明說可以的時候』也存得進去', junk: '神明說可以的時候' }),
    ],
    functions: [
      fnOf(0, 'addRite', '排一場法會', "db.insert('rites', { day, hour, name });", '記什麼', ['日子、時辰、法會名稱', '只記日子', '只記名稱']),
      fnOf(1, 'lunarMark', '標農曆', 'return calendar.map(d => ({ ...d, lunar: toLunar(d) }));', '農曆怎麼標', ['每一天都標，初一、十五特別標出來', '只標初一', '不標']),
    ],
    screen: { app: '解憂時代事務所・法會行事曆', fields: ['農曆', '吉時', '法會'], rows: [['十月初一', '辰時', '祈福法會'], ['十月十五', '巳時', '光明燈點燈']] } });
  const RETROGRADE = smallCard({ id: 'retrograde', title: '行星逆行月曆', tryIt: '記一段逆行',
    body: '・記行星哪幾天逆行\n・逆行那幾天在月曆上標出來\n\n莉莉絲：「這不是運勢呀……不過拿來記我的逆行週期剛好，可以改成行星逆行月曆嗎？」',
    fields: [
      fieldOf('行星', '行星', '水星 ▾', ['下拉（水星、金星、火星、木星、土星……）', '文字框，不是行星名稱跳紅字「查無此行星」', '文字框，什麼都收'],
        { say: '冥王星不算行星了？那它逆行我要記在哪？', red: '查無此行星' }, { say: '行星寫『我的心』也存得進去', junk: '我的心' }),
      fieldOf('逆行期間', '逆行期間', '開始 10/24 ▾　結束 11/13 ▾', ['開始、結束各選一天，結束不能早於開始', '文字框，格式不對跳紅字「期間格式錯誤」', '文字框，什麼都收'],
        { say: '「10/24 到 11/13」哪裡格式錯？', red: '期間格式錯誤' }, { say: '期間寫『最近』也存得進去', junk: '最近' }),
    ],
    functions: [
      fnOf(0, 'addRetrograde', '記一段逆行', "db.insert('retrograde', { planet, from, to });", '記什麼', ['行星、開始、結束', '只記開始那天', '只記行星']),
      fnOf(1, 'monthMarks', '月曆上標逆行', 'return month.days.map(d => ({ d, retro: retrograde.covering(d) }));', '標哪幾天', ['開始到結束之間每一天都標', '只標開始那天', '只標結束那天']),
    ],
    // 2026 年第三次水星逆行：10/24～11/13（Almanac、Cafe Astrology 查證）；遊戲這天 11/14 剛結束
    screen: { app: '解憂時代事務所・行星逆行月曆', fields: ['行星', '開始', '結束'], rows: [['水星', '10/24', '11/13']] } });
  const SURVEY = smallCard({ id: 'survey', title: '研究問卷', tryIt: '填一份問卷',
    body: '・讀者填熙恩教授的研究問卷\n・結果匯出給熙恩教授分析\n\n熙恩：「這不是測驗……不過拿來收讀者的研究問卷剛好，可以改成研究問卷嗎？」',
    fields: [
      fieldOf('血型', '血型', 'O ▾', ['下拉（A、B、O、AB、不知道）', '文字框，不是 A、B、O、AB 跳紅字「血型格式錯誤」', '文字框，什麼都收'],
        { say: '讀者不知道自己的血型，就不能填了？', red: '血型格式錯誤' }, { say: '血型寫『熱血』也存得進去', junk: '熱血' }),
      fieldOf('16 型人格', '16 型人格', 'INFP ▾', ['下拉 16 種，沒測過的可以選「沒測過」', '文字框，不是四個大寫英文字母跳紅字「格式錯誤」', '文字框，什麼都收'],
        { say: '讀者打小寫 infp 就被擋？', red: '格式錯誤' }, { say: '人格寫『社恐』也存得進去', junk: '社恐' }),
    ],
    functions: [
      fnOf(0, 'saveSurvey', '收一份問卷', "db.insert('survey', { blood, type, answers });", '記什麼', ['血型、16 型人格、每題的答案', '只記答案', '只記血型']),
      fnOf(1, 'exportSurvey', '匯出給熙恩教授', 'return csv(survey.all(), { bom: true });', '匯出什麼', ['全部的問卷，一份一列', '只匯出今天的', '只匯出第一份']),
    ],
    screen: { app: '解憂時代事務所・研究問卷', fields: ['填寫時間', '血型', '16 型人格', '完成題數'], rows: [['11/14 21:05', 'O', 'INFP', '40／40']] } });
  // 做歪的卡 → 誰開口、新卡；同一位老師的池子共用一張
  const pool = (who, say, card, ids) => Object.fromEntries(ids.map(id => [id, { who, say, card }]));
  const PARALLEL_CARDS = {
    profile: { who: YAWEN, say: '這不像生辰資料欸……不過拿來記客人上次問了什麼剛好，可以改成客人問事紀錄嗎？', card: VISITS },
    chart: { who: XIEN, say: '這排不出盤……不過拿來畫我的能量頻率圖剛好，可以改成能量頻譜嗎？', card: SPECTRUM },
    reading: { who: LILITH, say: '這不是合婚呀……不過拿來看人跟工作合不合剛好，可以改成職涯配對嗎？', card: CAREER },
    booking: { who: YAWEN, say: '這約不到老師欸……不過拿來排我自己的休假剛好，可以改成員工排休嗎？', card: LEAVE },
    ...pool(JINGXUAN, '這不是問神的……不過拿來排法會的時辰剛好，可以改成法會行事曆嗎？', RITES, ['lot', 'bird', 'lamp']),
    ...pool(LILITH, '這不是運勢呀……不過拿來記我的逆行週期剛好，可以改成行星逆行月曆嗎？', RETROGRADE, ['monthly', 'lucky', 'tarot']),
    ...pool(XIEN, '這不是測驗……不過拿來收讀者的研究問卷剛好，可以改成研究問卷嗎？', SURVEY, ['quiz', 'comic', 'column']),
  };

  // ── 結算卡多的行（劇本「結算卡多的行」）──
  const shippedOf = (e) => e.board.cards.filter(c => c.parent === 'fate' && c.status === 'archived');
  // 算後果的卡：結案的子議題，加上做了門面的母議題（它不交 QC）
  const judgedOf = (e) => { const fate = e.board.get('fate'); return [...shippedOf(e), ...(fate && fate.done('ui_design') ? [fate] : [])]; };
  const uiOf = (card) => card.subtasks.find(t => t.work === 'ui_design');
  // 倒過來的前端程式題：選項裡有一個是老師不滿（照常理做）的
  const reversedItems = (card) => { const s = uiOf(card); return s ? s.question.items.flatMap((item, i) => (Object.values(item.outcome || {}).some(o => o.kind === 'displeased') ? [i] : [])) : []; };
  // 事務所的內部工具：倒過來的前端程式題全部選照常理的那個，沒有一題選到老師要的（漏了的不算照常理）
  function internalTool(e) {
    const picks = judgedOf(e).flatMap(c => { const outs = e.cardOutcomes(c).filter(o => o.work === 'ui_design'); return reversedItems(c).map(i => outs.find(o => o.item === i)); });
    return picks.length > 0 && picks.every(o => o && o.kind === 'displeased');
  }
  // 心領神會：會議裡每張卡老師的半句都圈到、問對
  function readTheRoom(e) {
    const graded = e.board.cards.filter(c => c.id === 'fate' || c.parent === 'fate').map(c => { const s = c.subtasks.find(t => t.work === 'discuss'); return s && Works.grade(s.question, c.picks && c.picks.discuss); }).filter(Boolean);
    return graded.length > 0 && graded.every(g => !g.wrong.length && !g.missed.length);
  }
  // 導去預約的客人：「只露一半、接預約」那幾題選了正解的，照題目的 toBooking 人數加總
  const bookingLeads = (cards) => cards.reduce((n, c) => {
    const s = uiOf(c), a = c.picks && c.picks.ui_design; if (!s || !a || !c.done('ui_design')) return n;
    return n + s.question.items.reduce((m, item, i) => m + (item.toBooking && [].concat(a[i])[0] === item.answer ? item.toBooking : 0), 0);
  }, 0);
  // 網站選單做成圓盤時，結算卡並排它的無障礙分數（照桌上第一張子議題的成品畫面算，網站門面的扣分每一頁都有）
  function siteAccessibility(e) {
    const fate = e.board.get('fate'), front = FRONT.question.items.findIndex(item => item.ritual);
    if (!fate || !fate.done('ui_design') || [].concat(fate.picks.ui_design[front])[0] !== 0) return null;
    const page = e.board.cards.find(c => c.parent === 'fate');
    return page ? Screen.lighthouse(e.screenOf(page)).accessibility : null;
  }
  // 所有機制都做成好用的一般網站：三位老師一致同意改成事務所自己的營業工具
  const INTERNAL_TOOL_SAYS = [
    { who: YAWEN, text: '老師們看完說，這個網站的操作太直覺了，不能當直接給客戶用的命理網站，但是當成我們事務所自己的營業工具剛好。' },
    { who: JINGXUAN, text: '都好。只是……客人一看就懂，那就留給我們自己用吧。' },
    { who: LILITH, text: '都好呀～拿來排我們三個的時段剛好。' },
    { who: XIEN, text: '從營運的角度，這是一套非常優秀的內部系統。' },
  ];
  function report(e) {
    const shipped = shippedOf(e), outs = judgedOf(e).flatMap(c => e.cardOutcomes(c));
    const score = siteAccessibility(e), leads = bookingLeads(shipped), tool = internalTool(e);
    const wrongCharts = shipped.flatMap(c => e.cardOutcomes(c)).filter(o => o.wrongChart).length;
    return {
      extra: [
        ...(shipped.length ? [`老師嫌太好用：${outs.filter(o => o.kind === 'displeased').length} 次`] : []),
        ...(score != null ? [`Lighthouse 無障礙 ${score} 分／老師：很有感覺`] : []),
        ...(leads ? [`導去預約的客人：${leads} 位`] : []),
        ...(wrongCharts ? [`排錯的盤：${wrongCharts} 張`] : []),
      ],
      traits: [
        ...(readTheRoom(e) ? [{ title: '心領神會', text: '老師們的半句全部翻對' }] : []),
        ...(e.stats.gripes ? [{ title: '水逆', text: '阿姿在群組抱怨過這個案子' }] : []),
        ...paletteTraits(e),
        ...(tool ? [{ title: '開源精神', text: '你為什麼要把產品本身該收費的部份攤在陽光下呢？' }] : []),
      ],
      peers: [
        ...(tool ? INTERNAL_TOOL_SAYS : []),
        ...(e.stats.gripes ? [{ who: 'QC 阿姿', text: '這個案子做到我想去問算命師這陣子是不是水逆。' }] : []),
        { who: '同事 小潘', text: '一個命理老師是客戶，三個命理老師一起擺攤就是惡夢。' },
        ...e.errandPeers(),
      ],
    };
  }

  // 三個時代的 AI 錯法（劇本「三個時代差在哪」）：前端程式照常理做——hybrid 把解說全部寫出來（沒有照常理的題就漏做），
  // speedrun 把網站做得很好用；其他題照通則（Sandbox.forEra）。legacy 沒有 AI
  const ERA_PICK = { hybrid: { kinds: ['displeased', 'miss'], any: true }, speedrun: { kinds: ['displeased'], any: true } };
  const forEra = (card, mode) => Sandbox.forEra(card, mode, ERA_PICK);

  // carry.only（單卡試玩）：只開那一張子議題，母議題的「這期做 N 個功能」也照實際張數；只玩母議題就一張子議題都不開
  function make(mode, carry = {}) {
    const modules = carry.only ? [carry.only].filter(cardOf) : [...MODULES, ...drawPool(carry)];
    const cards = [motherCard(modules), ...modules.map(cardOf)].map(card => forEra(card, mode));
    return {
      // 結算卡的縮圖畫網站首頁（母議題沒有手動測試，玩家只在這裡看到首頁）；沒有主卡，同事評語不照單張卡算
      name: '心領神會', issueBase: 499, reportShot: 'fate',
      brief: '三位命理老師合開一個網站。問她們要什麼，都說都好。',
      unlabeled: { note: '09:30 解憂時代事務所需求會議（會議室）', devices: { phone: 64, tablet: 100 } },
      meetings: [MORNING, vendorMeeting(modules, cards)],
      cards: [],   // 卡都是廠商需求會議散會後 SA 開的（vendorMeeting 的 cards）
      sources: [],
      ...(Sandbox.AI[mode] ? { ai: { ...Sandbox.AI[mode], readReqPenalty: 0.2, notes: carry.notes || {} } } : {}),
      home: Sandbox.HOME,
      // 上線後雅雯怎麼回：照常理做的（displeased）通知後轉述老師嫌的那句；這關沒有紅字的寫法，晚上的抱怨在計畫 9（傍晚轉述）
      usage: { who: YAWEN, displeased: '老師們看了說：「{say}」', irkReply: '這個紅字是什麼意思？', complainAt: [], complain: '{say}', stuckGap: 15, forms: {}, paperAt: 99 },
      // 正解很難用、QC 退不了：阿姿在三人群組輪流講這三句
      // 結算卡「同事怎麼說」客人那句：做對（儀式畫面）一句、有一題照一般網站做一句。對某些信徒來說，太清楚好用＝沒有靈力
      userVoice: { who: '客人', ritual: '感受到老師的功力在網站中流動。', plain: '感覺很普通，算出來的內容真的準嗎？' },
      qcGripes: ['這個案子做到我想去問算命師這陣子是不是水逆。', '我覺得整個宇宙都在跟我作對', '今年是不是流年不利'],
      // 傍晚雅雯轉述老師們看成品的評語：上線的卡各一句（卡上的 evening）
      evening: { at: 18 * 60, from: YAWEN },
      // 平行宇宙：成品跟卡上需求對不上過半的卡交 QC，10% 開出新卡；照常理做（老師不滿）不算對不上
      parallel: { chance: 0.1, over: 0.5, ignore: ['displeased'], check: (e) => !!e.stats.parallel,
        traits: [{ title: '成功製造需求', text: '交出去的東西跟需求對不上，老師們卻想拿來做別的' }],
        cards: Object.fromEntries(Object.entries(PARALLEL_CARDS).map(([id, p]) => [id, { ...p, card: forEra(p.card, mode) }])) },
      report,
      hints: [],
    };
  }
  Sandbox.add('fate', make);
})(typeof window !== 'undefined' ? window : globalThis);
