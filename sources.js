// sources.js — 來源的純邏輯：開卡草稿填得好不好、轉給 SA 之後回來的卡長什麼樣。
// 卡的來源（老闆、信、LINE、紙）進電腦之後都是同一種「文件」：
//   { id, title, text, module, sentences: [{ text, keep, judgment?, claim? }], subtasks }
// keep 是這句該不該進卡；開卡畫面讓玩家勾，勾得跟 keep 一樣才算內文填好。
// judgment 是 AI 的主張（hybrid 之後的卡會有）：勾不勾都不算錯，它的 claim 之後在「寫程式」小關卡裡驗。
// 卡沒填好的代價不是時間，是開發小關卡裡要自己填的 function 變多。
(function (root) {
  // SA 開的卡在三個時代長什麼樣：
  //   legacy   條列乾淨，只多一兩句沒資訊量的話
  //   hybrid   人寫的段落後面接一句 AI 的主張（解法混進需求，不一定錯）
  //   speedrun AI 報告：掃描結果、程式碼、信心滿滿的斷言，真正的需求埋在裡面
  const NOISE = {
    legacy: [{ text: '{原文}如附檔。', keep: false }],
    hybrid: [{ text: '和 AI 討論的結果：只在畫面上擋不夠，它建議檢查放在後端。', keep: false, judgment: true, claim: 'backend_guard' }],
    speedrun: [
      { text: '[掃描結果] 掃了 12 支排程，其中 9 支沒有設逾時。', keep: false },
      { text: '[Fix 方向] job.setTimeout(30); job.setRetry(3);', keep: false },
      { text: '[Prod 影響] 本機跑過沒事，理論不踩，已 proven。', keep: false },
    ],
  };

  function gradeDraft(doc, draft) {
    const missing = [];
    if (!draft.module || draft.module !== doc.module) missing.push('module');
    const picked = draft.sentences || [];
    const bodyOk = doc.sentences.every((s, i) => s.judgment || picked.includes(i) === !!s.keep);
    if (!bodyOk) missing.push('body');
    if (!draft.attach) missing.push('attach');
    // covered：勾上卡的句子，開發小關卡用它決定哪些 function 可以直接拉進 IDE；勾到噪音句也算（那些句子的 function 會多出來要填，第三天財務的報告）
    const covered = doc.sentences.map((s, i) => (picked.includes(i) ? i : -1)).filter((i) => i >= 0);
    return { missing, covered, noSource: !draft.attach };
  }

  // 來源的句子可以帶 sa：怡君會怎麼把這句寫成規格語言（「給他們看就好」→「資產清單新增唯讀頁（財務用）」）；
  // 沒帶的照原句。text 留著給 function 對句子用，卡的內文用 sa || text
  const ORIGINAL = { boss: '老闆原話', mail: '原信', line: '原訊息', paper: '原稿' };
  // doc.aiTrace：hybrid 的 SA 跟 AI 討論這件需求得到的那句主張（來源自己寫才貼題）；沒寫就用通用那句
  function saCard(doc, mode) {
    // 怡君丟給她的 Claire 整理（saVerbatim，第三天）：原文整份搬上卡、每一句都算需求——噪音句的 function 也要填
    if (doc.saVerbatim) {
      const sentences = doc.sentences.map((s) => ({ ...s, keep: true }));
      return { title: doc.title, from: 'SA 怡君', module: doc.module, sentences, lines: doc.text.split('\n').filter(Boolean), attach: true, subtasks: doc.subtasks || [] };
    }
    const trace = mode === 'hybrid' && doc.aiTrace ? [{ ...doc.aiTrace, keep: false, judgment: true }] : null;
    const noise = (trace || NOISE[mode] || NOISE.legacy).map((s) => ({ ...s, text: s.text.replace('{原文}', ORIGINAL[doc.origin] || '原文') }));
    const sentences = [...doc.sentences.filter((s) => s.keep).map((s) => ({ ...s })), ...noise];
    // skipIfSA：怡君整理過就不用做的工作（例如老闆講不清楚的那段，她已經問清楚寫進卡裡）
    return { title: doc.title, from: 'SA 怡君', module: doc.module, sentences, lines: sentences.map((s) => s.sa || s.text), attach: true, subtasks: (doc.subtasks || []).filter((s) => !s.skipIfSA) };
  }

  const api = { NOISE, gradeDraft, saCard };
  if (typeof module !== 'undefined') module.exports = api; else root.Sources = api;
})(typeof window !== 'undefined' ? window : globalThis);
