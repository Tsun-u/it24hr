// claire-skills.js — CLAIRE.md 的「新增規範」（寫 Skill）：事先寫進去，AI 之後照著做。
// 新人訓練第三天和正式上班共用同一份；寫過的是 CLAIRE.md 的一條筆記，CLAIRE.md 是全域的，所以到哪一天、哪一關都帶著。
(function (root) {
  // 部署流程：寫了 AI 部署就不再每一步停下來問（engine.deployPlan 的 auto）
  const deploy = { id: 'deploy', label: '部署流程', text: '部署：先備份，再上傳、替換，最後煙霧測試；通知等 QC 驗過，由人按。' };
  // 整理需求的讀法：三派句子照畫面上的順序列。過於細節派要點名那天的案子，由劇本給（沒給就只有原則、情緒化兩句）。
  // 效果：原則派讀歪減半、情緒化加倍（engine.readReqFactor），題目選項標了 readReq:<派別> 的照筆記挑
  function readReq(detail = null) {
    return { id: 'readReq', label: '整理需求的讀法', options: [
      { stance: 'principle', say: '需求內提到的規格要考慮合理性，不合理的部份放待確認先不做。準則是 YAGNI 原則。', text: '整理需求：規格要看合不合理，不合理的放待確認、先不做（YAGNI：現在用不到的不做）' },
      ...(detail ? [{ stance: 'detail', ...detail }] : []),
      { stance: 'emotional', say: '你是不是讀不出寫需求的人亂寫的東西？沒把握不要做。', text: '整理需求：看不出是不是亂寫的就先不挑，沒把握的不做' },
    ] };
  }
  const ClaireSkills = { deploy, readReq };
  if (typeof module !== 'undefined') module.exports = { ClaireSkills };
  else root.ClaireSkills = ClaireSkills;
})(typeof window !== 'undefined' ? window : globalThis);
