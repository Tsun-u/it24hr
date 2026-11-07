// classroom/searching.js — 小教室附錄「Searching 搜尋」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 這頁固定的資料：排好的 16 個數，固定找 96（線性比 15 次、二分比 4 次）
  const A = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 77, 81, 85, 91, 96, 99];
  const TARGET = 96;
  const LAST = A.length - 1;
  const NAME = { linear: '線性', binary: '二分' };

  // 狀態的 lo～hi 是比這一格時「還可能在裡面」的範圍，probe 是這一步比的那格。
  // 線性每比一次排除一格，二分每比一次排除一半；範圍要等下一步才依這一格的結果縮小，圖上的 mid 才會落在 lo～hi 裡面
  const start = (mode) => ({ mode, lo: 0, hi: LAST, probe: null, count: 0, error: null });
  const isFound = (s) => s.probe !== null && A[s.probe] === TARGET;
  function narrow({ mode, lo, hi, probe }) {
    if (probe === null) return { lo, hi };
    if (mode === 'linear' || A[probe] < TARGET) return { lo: probe + 1, hi };
    return { lo, hi: probe - 1 };
  }
  // 比下一格：線性看範圍最左邊那格，二分看正中間 mid = ⌊(lo + hi) / 2⌋
  function look(s) {
    const { lo, hi } = narrow(s);
    const probe = s.mode === 'linear' ? lo : Math.floor((lo + hi) / 2);
    return { ...s, lo, hi, probe, count: s.count + 1, error: null };
  }

  // 畫圖：16 格塞滿手機寬（分格圖和沙盒同一個大小）
  const CELL = 19, PAD = 6, TOP = 41, CELL_H = 26;
  const MUTED = '#6b7280', FADED_LINE = '#c9cdd3', FADED_TEXT = '#b4b9c0';
  // 箭頭：一條線＋兩撇箭頭，從 from 指到 to
  function arrow(INK, svg, rc, [x1, y1], [x2, y2], seed) {
    const angle = Math.atan2(y2 - y1, x2 - x1), head = 4;
    const wing = (turn) => [x2 - head * Math.cos(angle + turn), y2 - head * Math.sin(angle + turn)];
    const opt = { stroke: INK, strokeWidth: 1.3, roughness: 0.6, seed };
    svg.append(rc.line(x1, y1, x2, y2, opt), rc.linearPath([wing(0.6), [x2, y2], wing(-0.6)], opt));
  }

  const page = {
    analogy: '查字典：字照順序排好，翻開中間就知道往前還往後，不用一頁一頁翻。',
    summary: '下次查字典，你就知道：那是二分搜尋——字照順序排好，翻開中間就知道往前還往後；沒排好的資料，就只能一頁一頁翻。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['binary', 'binary', 'binary', 'binary'],
    uses: [
      '在網頁按 Ctrl+F 找一個詞：文章裡的字沒有照什麼順序排，瀏覽器只能從頭一個一個比下去——這是線性搜尋。',
      '猜數字遊戲：朋友心裡想一個 1～100 的數，每次猜中間、聽「大了」「小了」就砍掉一半，最多 7 次一定猜中——這是二分搜尋。',
      'git bisect 找出哪個 commit 弄壞程式：上週還好好的，中間有 100 個 commit，git bisect 每次挑正中間那個讓你測，好的就往後找、壞的就往前找，大約 7 次就抓到兇手。',
      { text: '資料庫的索引（index）：幾十萬筆學生資料用學號查一個人，不會從第一筆看起；索引先把學號排好，查的時候一層一層縮小範圍（實際用的是 B 樹）。', see: 'b_tree' },
    ],
    concept: [
      '搜尋（searching）是在一堆資料裡找某個值：在不在、在第幾格。最直接的是線性搜尋（linear search），教科書也叫循序搜尋（sequential search）：從 a[0] 開始一個一個比，比到就停，比完都沒有就是不在。它不挑資料，沒排序、存在鏈結串列裡都能用；代價是 n 個資料最差要比 n 次，O(n)。',
      '二分搜尋（binary search），教科書也叫二元搜尋，前提是資料已經排好。用 lo、hi 兩個索引夾住「還可能在裡面」的範圍，每次看正中間那格 mid = ⌊(lo + hi) / 2⌋（⌊ ⌋ 是無條件捨去）：剛好是要找的就找到了；要找的比較大，答案只可能在右半邊，lo 移到 mid + 1；比較小就在左半邊，hi 移到 mid − 1。lo 跑到 hi 後面、範圍空了，就是不在。',
      '每比一次，範圍就砍掉一半：16 個數最多比 5 次，一百萬個數最多比 20 次，線性搜尋最差卻要比一百萬次。這就是 O(log n)：資料多一倍，只多比一次。',
      '二分搜尋要能直接跳到中間。陣列算一下位置就到 a[mid]，O(1)（Array 頁）；鏈結串列要從頭一個一個走才到得了中間（Linked List 頁），光走過去就花掉 O(n)，砍一半也省不了時間。所以二分搜尋配陣列，鏈結串列只能線性搜尋。',
      '二元搜尋樹（Tree 頁）就是把二分搜尋做成一棵樹：樹夠平衡的話，樹根就是第一次看的中間，左子樹是左半邊、右子樹是右半邊，而且插入新資料不用像陣列那樣整排往後搬。雜湊（附錄「雜湊」）走的是另一條路：不比大小，用雜湊函數直接算出在哪一格，平均 O(1)。',
    ],
    // 各操作的時間複雜度（Big-O 的定義與怎麼算在附錄 D）
    complexity: [
      ['線性搜尋：最好（第一個就是）', 'O(1)'],
      ['線性搜尋：最差（在最後一個或不在裡面）', 'O(n)'],
      ['二分搜尋：最好（第一次看的中間就是）', 'O(1)'],
      ['二分搜尋：最差（一路砍到剩一格）', 'O(log n)'],
    ],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: '二分搜尋什麼資料都能用', right: '資料要先排好。沒排好的時候，看了中間那格也不知道該往哪邊：在 [96, 5, 2, 8] 找 96，中間的 5 比 96 小，就往右找，最後說找不到——96 明明在 a[0]。' },
      { wrong: '先排序再二分搜尋，一定比線性搜尋快', right: '排序本身就要 O(n log n)（附錄「排序」），比一個一個看的 O(n) 還慢。只找一次就直接線性搜尋；同一份資料要找很多次，排一次、之後每次 O(log n) 才划算。' },
      { wrong: '有重複的值時，二分搜尋找到的是第一個', right: 'mid 碰到哪個就回傳哪個：在 [1, 3, 3, 3, 5] 找 3，第一次看的 a[2] 就是 3，直接回傳 2，不是第一個 3 所在的 a[1]。要找第一個，得在找到之後繼續往左縮，Python 的 bisect_left、C++ 的 lower_bound 就是這樣做的。' },
      { wrong: '迴圈寫 lo < hi 還是 lo <= hi、縮範圍要不要 ±1，差一點沒關係', right: '差一就出事。hi 從 n − 1 開始，代表 lo 到 hi 每一格都還要看，迴圈要寫 lo <= hi：寫成 lo < hi，範圍剩一格就停了，在這頁的陣列找 2 或 99 都會說找不到。縮範圍要寫 lo = mid + 1、hi = mid − 1：寫成 lo = mid，範圍剩兩格時 mid 一直停在 lo，找 99 就會無窮迴圈。' },
      { wrong: 'mid = (lo + hi) / 2 不會出事', right: 'Java、C++ 的 int 最大大約 21 億，資料很多、lo 和 hi 都很大時，lo + hi 會超過上限而溢位（overflow）：Java 會變成負數，C++ 是未定義行為，mid 都會跑出陣列。寫成 lo + (hi − lo) / 2 就不會加爆。Java 內建的 Arrays.binarySearch 當年就是這樣寫的，這個 bug 藏了九年左右，2006 年才被指出來。' },
      { wrong: '(lo + hi) / 2 在每種語言都會自動捨去小數', right: '只有 Java、C++ 的整數相除會捨去。Python 的 (0 + 15) / 2 是 7.5，拿去當索引會報錯，要寫 //；JavaScript 也是 7.5，a[7.5] 不會報錯、拿到的是 undefined，要寫 Math.floor。' },
      { wrong: 'Java 的 Arrays.binarySearch 找不到就回傳 -1', right: '回傳的是 −(該插進去的位置) − 1：這頁找 50，該插在 a[8] 前面，所以回傳 -9，只能用「是不是負數」判斷有沒有找到。Python 的 bisect_left、C++ 的 lower_bound 更是一律回傳該插的位置，要自己看那格是不是要找的數。' },
    ],
    code: {
      python: {
        builtin: `# bisect 是內建的二分搜尋：bisect_left 回傳 x 該插進去的位置，那格剛好是 x 才算找到
from bisect import bisect_left


def index_of(a, x):
    i = bisect_left(a, x)
    return i if i < len(a) and a[i] == x else -1


a = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 77, 81, 85, 91, 96, 99]
print(index_of(a, 96), index_of(a, 50))
`,
        handmade: `# 自己刻：lo、hi 夾住還可能在裡面的範圍，每次看正中間那格
def binary_search(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:  # lo 到 hi 都還要看；寫成 < 會漏掉只剩一格的時候
        mid = lo + (hi - lo) // 2  # 先減再加，換成 Java、C++ 也不會溢位；// 是整數除法
        if a[mid] == x:
            return mid
        if a[mid] < x:
            lo = mid + 1  # 要找的比較大，往右；mid 已經比過，不用再看
        else:
            hi = mid - 1  # 要找的比較小，往左
    return -1  # 範圍空了，不在裡面


a = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 77, 81, 85, 91, 96, 99]
print(binary_search(a, 96), binary_search(a, 50))
`,
      },
      js: {
        builtin: `// JavaScript 沒有內建的二分搜尋，考試要自己刻；最接近的 indexOf 是線性搜尋，從 a[0] 一個一個比，O(n)
const a = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 77, 81, 85, 91, 96, 99];
console.log(a.indexOf(96), a.indexOf(50));
`,
        handmade: `// 自己刻：lo、hi 夾住還可能在裡面的範圍，每次看正中間那格
function binarySearch(a, x) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) { // lo 到 hi 都還要看；寫成 < 會漏掉只剩一格的時候
    const mid = lo + Math.floor((hi - lo) / 2); // JS 的 / 不會捨去小數，要 Math.floor
    if (a[mid] === x) return mid;
    if (a[mid] < x) lo = mid + 1; // 要找的比較大，往右；mid 已經比過，不用再看
    else hi = mid - 1; // 要找的比較小，往左
  }
  return -1; // 範圍空了，不在裡面
}

const a = [2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 77, 81, 85, 91, 96, 99];
console.log(binarySearch(a, 96), binarySearch(a, 50));
`,
      },
      java: {
        builtin: `// Arrays.binarySearch 是內建的二分搜尋；找不到時回傳 -(該插進去的位置) - 1，只保證是負數，不一定是 -1
import java.util.Arrays;

public class Main {
    static int indexOf(int[] a, int x) {
        int i = Arrays.binarySearch(a, x);
        return i >= 0 ? i : -1;
    }

    public static void main(String[] args) {
        int[] a = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 77, 81, 85, 91, 96, 99};
        System.out.println(indexOf(a, 96) + " " + indexOf(a, 50));
    }
}
`,
        handmade: `// 自己刻：lo、hi 夾住還可能在裡面的範圍，每次看正中間那格
public class Main {
    static int binarySearch(int[] a, int x) {
        int lo = 0, hi = a.length - 1;
        while (lo <= hi) { // lo 到 hi 都還要看；寫成 < 會漏掉只剩一格的時候
            int mid = lo + (hi - lo) / 2; // 寫成 (lo + hi) / 2 的話，lo + hi 超過 int 上限就會溢位
            if (a[mid] == x) return mid;
            if (a[mid] < x) lo = mid + 1; // 要找的比較大，往右；mid 已經比過，不用再看
            else hi = mid - 1; // 要找的比較小，往左
        }
        return -1; // 範圍空了，不在裡面
    }

    public static void main(String[] args) {
        int[] a = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 77, 81, 85, 91, 96, 99};
        System.out.println(binarySearch(a, 96) + " " + binarySearch(a, 50));
    }
}
`,
      },
      cpp: {
        builtin: `// std::lower_bound 是內建的二分搜尋：回傳第一個不小於 x 的位置，那格剛好是 x 才算找到
// （std::binary_search 也是二分搜尋，但只回答有沒有，不告訴你在哪一格）
#include <algorithm>
#include <iostream>
#include <vector>

int indexOf(const std::vector<int>& a, int x) {
    auto it = std::lower_bound(a.begin(), a.end(), x);
    return it != a.end() && *it == x ? int(it - a.begin()) : -1;
}

int main() {
    std::vector<int> a = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 77, 81, 85, 91, 96, 99};
    std::cout << indexOf(a, 96) << " " << indexOf(a, 50) << "\\n";
}
`,
        handmade: `// 自己刻：lo、hi 夾住還可能在裡面的範圍，每次看正中間那格
#include <iostream>

int binarySearch(const int a[], int n, int x) {
    int lo = 0, hi = n - 1;
    while (lo <= hi) { // lo 到 hi 都還要看；寫成 < 會漏掉只剩一格的時候
        int mid = lo + (hi - lo) / 2; // 寫成 (lo + hi) / 2 的話，lo + hi 超過 int 上限就會溢位
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1; // 要找的比較大，往右；mid 已經比過，不用再看
        else hi = mid - 1; // 要找的比較小，往左
    }
    return -1; // 範圍空了，不在裡面
}

int main() {
    const int a[] = {2, 5, 8, 12, 16, 23, 38, 45, 56, 72, 77, 81, 85, 91, 96, 99};
    const int n = sizeof(a) / sizeof(a[0]);
    std::cout << binarySearch(a, n, 96) << " " << binarySearch(a, n, 50) << "\\n";
}
`,
      },
      output: '14 -1',
    },
    // 沙盒：線性、二分各一顆「下一步」，固定找 96；按的跟正在做的不同種，就從頭重新開始那一種；找到後再按是錯誤、狀態不變
    sandbox: {
      ops: [{ op: 'linear', label: '線性搜尋下一步' }, { op: 'binary', label: '二分搜尋下一步' }],
      errors: { done: `找到了，${TARGET} 在 a[${A.indexOf(TARGET)}]。按另一種搜尋，比比看要比幾次` },
      init() { return start(null); },
      apply(s, op) {
        const run = s.mode === op ? s : start(op);
        if (isFound(run)) return { ...run, error: 'done' };
        return look(run);
      },
      label(op, s) {
        const value = A[s.probe], seen = `${NAME[op]}：看 a[${s.probe}] = ${value}`;
        if (value === TARGET) return `${seen}，找到了（比 ${s.count} 次）`;
        if (op === 'linear') return `${seen}，不是`;
        return `${seen}，${TARGET} 比較${value < TARGET ? '大，往右' : '小，往左'}`;
      },
    },
    // 一排 16 格、格子下面標索引，最上面寫要找的數。範圍 lo～hi 外的格子已經排除，淡掉；這一步比的那格上黃色，
    // 上面一個箭頭（二分寫 mid、線性寫 i）；二分時格子下面再標 lo、hi
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { mode, lo, hi, probe }) {
      const w = A.length * CELL + PAD * 2, hgt = 96;
      const s = svgEl(w, hgt); const rc = rough.svg(s);
      const left = (i) => PAD + i * CELL, centerX = (i) => left(i) + CELL / 2;
      const ruledOut = (i) => mode !== null && (i < lo || i > hi);
      svgText(s, w / 2, 10, `找 ${TARGET}`, 12);
      A.forEach((value, i) => {
        const out = ruledOut(i);
        const style = out ? { stroke: FADED_LINE, strokeWidth: 1 } : { stroke: INK, fill: i === probe ? NEW : FILL, fillStyle: 'hachure', hachureGap: 4 };
        s.append(rc.rectangle(left(i) + 1.5, TOP, CELL - 3, CELL_H, { ...style, roughness: 0.8, seed: 11 + i }));
        const num = svgText(s, centerX(i), TOP + CELL_H / 2, String(value), 10);
        if (out) num.style.fill = FADED_TEXT;
        svgText(s, centerX(i), TOP + CELL_H + 9, String(i), 9).style.fill = MUTED;
      });
      if (probe !== null) {
        svgText(s, centerX(probe), 24, mode === 'binary' ? 'mid' : 'i', 10);
        arrow(INK, s, rc, [centerX(probe), 30], [centerX(probe), TOP - 2], 40);
      }
      if (mode === 'binary') {
        svgText(s, centerX(lo), hgt - 8, 'lo', 10);
        svgText(s, centerX(hi), hgt - 8, 'hi', 10);
      }
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('searching', page);
})(typeof window !== 'undefined' ? window : globalThis);
