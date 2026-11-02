// 從 git log 產生 changelog-data.js：node scripts/build-changelog.js
// 檔案寫不進自己的 hash，所以產出要另外 commit，訊息固定用 COMMIT_SUBJECT，更新履歷不列這種 commit
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'changelog-data.js');
const COMMIT_SUBJECT = '更新履歷';

function parseLog(text) {
  return text.split('\n').filter(Boolean).map((line) => {
    const [hash, date, ...subject] = line.split('\t');
    return { hash, date, subject: subject.join('\t') };
  }).filter((entry) => entry.subject !== COMMIT_SUBJECT);
}

const render = (entries) => `// 由 node scripts/build-changelog.js 從 git log 產生，不要手改
(function (root) {
  const CHANGELOG = ${JSON.stringify(entries, null, 2)};
  if (typeof module !== 'undefined') module.exports = CHANGELOG;
  else root.CHANGELOG = CHANGELOG;
})(typeof window !== 'undefined' ? window : globalThis);
`;

if (require.main === module) {
  const log = execFileSync('git', ['log', '--abbrev=7', '--date=short', '--format=%h%x09%ad%x09%s'], { cwd: ROOT, encoding: 'utf8' });
  fs.writeFileSync(OUTPUT, render(parseLog(log)));
}

module.exports = { parseLog, COMMIT_SUBJECT };
