// classroom/sorting.js — 小教室「Sorting 排序」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 這頁固定排這 6 個數；五種排序都從它開始，一步走一輪
  const START = [5, 2, 4, 6, 1, 3];
  const N = START.length;
  const ALL = START.map((_, i) => i);
  const range = (lo, hi) => Array.from({ length: Math.max(0, hi - lo + 1) }, (_, k) => lo + k);
  const union = (...lists) => [...new Set(lists.flat())].sort((a, b) => a - b);
  const changedCells = (before, after) => after.flatMap((v, i) => (v !== before[i] ? [i] : []));
  const swap = (a, i, j) => { [a[i], a[j]] = [a[j], a[i]]; };

  // 每一輪回傳：items 這一輪之後的陣列、compares 這一輪比了幾次、touched 這一輪動到的格子、sorted 排好的格子、done 排完了沒，
  // 再加上圖說要用的：key 這一輪的主角、at 它放到哪一格

  // 氣泡：相鄰兩個比，前面比較大就交換，一輪把還沒排的裡面最大的推到 a[end]；一次都沒換就代表排好了，提早結束
  function bubbleRound(s) {
    const a = [...s.items], end = N - 1 - s.round;
    let compares = 0, swaps = 0;
    for (let j = 0; j < end; j++) {
      compares++;
      if (a[j] > a[j + 1]) { swap(a, j, j + 1); swaps++; }
    }
    const done = swaps === 0 || end === 1;
    return { items: a, compares, swaps, key: a[end], at: end, touched: swaps ? union(changedCells(s.items, a), [end]) : [], sorted: done ? ALL : range(end, N - 1), done };
  }
  // 選擇：在還沒排的 a[i..] 裡找最小的，跟 a[i] 交換；剩最後一個時它自然就是最大的
  function selectionRound(s) {
    const a = [...s.items], i = s.round;
    let min = i, compares = 0;
    for (let j = i + 1; j < N; j++) {
      compares++;
      if (a[j] < a[min]) min = j;
    }
    swap(a, i, min);
    const done = i === N - 2;
    return { items: a, compares, swaps: min === i ? 0 : 1, key: a[i], at: i, touched: union([i, min]), sorted: done ? ALL : range(0, i), done };
  }
  // 插入：把 a[k] 拿出來，從後往前跟排好的 a[0..k-1] 比，比它大的往後挪一格，遇到不比它大的就放在後面
  function insertionRound(s) {
    const a = [...s.items], k = s.round + 1, key = a[k];
    let j = k - 1, compares = 0;
    while (j >= 0) {
      compares++;
      if (a[j] <= key) break;   // 一樣大的不越過，所以穩定
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
    return { items: a, compares, key, at: j + 1, touched: range(j + 1, k), sorted: range(0, k), done: k === N - 1 };
  }
  // 合併（由下往上）：runs 是目前排好的一段一段，從左邊開始相鄰兩段合併成一段；落單的那段原封不動留到下一輪
  function mergeRound(s) {
    const a = [...s.items], runs = [], touched = [];
    let compares = 0;
    for (let k = 0; k < s.runs.length; k += 2) {
      const [lo, mid] = s.runs[k], right = s.runs[k + 1];
      if (!right) { runs.push([lo, mid]); continue; }
      const hi = right[1];
      let i = lo, j = mid + 1, out = lo;   // 兩段開頭比，小的先拿
      while (i <= mid && j <= hi) {
        compares++;
        a[out++] = s.items[i] <= s.items[j] ? s.items[i++] : s.items[j++];   // 一樣大先拿左邊的，所以穩定
      }
      while (i <= mid) a[out++] = s.items[i++];
      while (j <= hi) a[out++] = s.items[j++];
      runs.push([lo, hi]);
      touched.push(...range(lo, hi));
    }
    const done = runs.length === 1;
    const [firstLo, firstHi] = s.runs[0];
    return { items: a, compares, width: firstHi - firstLo + 1, runs, touched, sorted: done ? ALL : [], done };
  }
  // 快速：從堆疊頂端拿一段切一次。Lomuto 分割：拿這段最後一個當 pivot，比它小的依序換到左邊，最後 pivot 換到它們後面，就是它排好的位置。
  // 兩邊還有兩個以上的才要再切：右邊先放進堆疊、左邊後放，下一輪先切左邊（跟遞迴的順序一樣）；只剩一個的也排好了
  function quickRound(s) {
    const a = [...s.items], pending = [...s.pending];
    const [lo, hi] = pending.pop(), pivot = a[hi];
    let i = lo, compares = 0;   // i：下一個比 pivot 小的要放的位置
    for (let j = lo; j < hi; j++) {
      compares++;
      if (a[j] < pivot) { swap(a, i, j); i++; }
    }
    swap(a, i, hi);
    const sides = [[i + 1, hi], [lo, i - 1]];
    pending.push(...sides.filter(([l, h]) => h > l));
    const singles = sides.filter(([l, h]) => h === l).map(([l]) => l);
    return { items: a, compares, key: pivot, at: i, segment: [lo, hi], pending, touched: union(changedCells(s.items, a), [i]), sorted: union(s.sorted, [i], singles), done: !pending.length };
  }
  const ROUND = { bubble: bubbleRound, selection: selectionRound, insertion: insertionRound, merge: mergeRound, quick: quickRound };

  // 從原陣列開始一種排序：合併從每個數自己一段開始，快速從整段 a[0..5] 放進堆疊開始
  const start = (algo) => ({
    algo, items: [...START], round: 0, compares: 0, total: 0, touched: [], sorted: [], done: false, error: null,
    key: null, at: null, swaps: 0, width: null, runs: START.map((_, i) => [i, i]), pending: [[0, N - 1]], segment: null,
  });
  const runsText = (s) => s.runs.map(([lo, hi]) => `[${s.items.slice(lo, hi + 1).join(' ')}]`).join(' ');

  const DONE = '#b5e3b0', DONE_INK = '#3d8b47', MUTED = '#6b7280';

  const page = {
    analogy: '你幫老師把全班 30 張考卷照分數排好：每次把還沒排的那疊從頭翻到尾、抽出最高分。全年級 600 張的時候，也只能這樣一疊翻到手痠嗎？',
    summary: '600 張每次翻整疊挑最高分，要比將近 18 萬次；先分成小疊各自排好、再兩疊兩疊合起來，比 5 千次就夠。下次在試算表按下「排序」，你就知道：排法有很多種，差在要比幾次、搬幾次。',   // 總結：回答開頭的問題（教學怪物教案的回環結構）
    frames: ['insertion', 'insertion', 'insertion', 'insertion', 'insertion'],
    uses: [
      '成績排名：把全班成績由高到低排好，第幾名、前百分之幾一眼就看得出來；繁星推薦看的校排名，也是全校的成績排出來的。',
      '手機通訊錄照名字排、試算表點一下欄位就排好：不只數字，名字、日期也比得出先後，比得出先後就能排。',
      '在大量資料裡找東西：先排好，就能用附錄「搜尋」的二分搜尋，每比一次砍掉一半，一百萬筆大約比 20 次就找到；亂放的只能一筆一筆看。',
      '網購的「價格由低到高」、論壇的「最新的在最上面」：資料庫用 ORDER BY 把查到的資料排好再傳給你。資料多到記憶體放不下時，就一批一批排好存到硬碟，再像合併排序那樣把排好的幾批合併起來（外部排序，external sorting）。',
    ],
    concept: [
      '排序（sorting）是把資料照某個順序排好：由小到大（遞增）、由大到小（遞減），或照名字、日期。這頁的五種都靠「兩個兩個比大小」決定誰在前面，叫比較排序（comparison sort）。沙盒每按一下走一輪，考試常問的「第 k 輪之後長怎樣」就是這個。',
      '簡單的三種都在同一個陣列裡換來換去。氣泡排序（bubble sort）：從頭開始相鄰兩個比，前面比較大就交換，一輪下來最大的被推到最後，像氣泡一路浮上去。選擇排序（selection sort）：每一輪在還沒排的那段裡選出最小的，跟那段的第一個交換。插入排序（insertion sort）：像整理手上的撲克牌，把下一張插進前面已經排好的那段，比它大的往後挪一格。',
      '這三種一輪只處理好一個數，n 個數要走 n − 1 輪、每輪最多比 n − 1 次，所以是 O(n²)：6 個數的氣泡、選擇都是 5 + 4 + 3 + 2 + 1 = 15 次。這頁的氣泡排序有「一輪都沒換就提早結束」，這組資料剛好也是第 5 輪結束，每一輪都跟沒有提早結束的課本版本一樣。',
      '合併排序（merge sort）靠「切一半」：先把每個數當成一段，相鄰兩段合併成一段，寬度 1、2、4…一路加倍（這頁由下往上做，一輪合併一種寬度）。兩段各自排好的話，從兩段開頭比，小的先拿，比一次就放好一個。寬度每輪加倍，大約 log₂ n 輪就合成一段（6 個數 3 輪），每輪比不到 n 次，所以是 O(n log n)。合併時要一個跟原陣列一樣長的暫存陣列，放合併好的結果。',
      '快速排序（quick sort）也靠切一半：挑一個樞紐（pivot），比它小的放左邊、大的放右邊，pivot 就落在它最後的位置，左右兩段再各自這樣切。這頁拿每段最後一個當 pivot（Lomuto 分割法），還沒切的段記在堆疊（Stack）裡；寫成遞迴時，幫你記的就是 call stack。每次都切在中間附近的話，大約 log₂ n 層、每層比不到 n 次，平均 O(n log n)。最怕的是資料已經排好、又拿最後一個當 pivot：pivot 永遠是最大的，每切一次只少一個，要切 n − 1 次，變成 O(n²)。',
      '穩定排序（stable sort）：一樣大的資料，排完還保持原本的先後。例如考卷先照座號排好，再照分數排，穩定的排法排完，同分的仍然照座號。氣泡、插入、合併是穩定的（一樣大不交換、先拿左邊那段的）；選擇、快速不穩定，因為會跨很遠交換，可能把同分的順序對調。',
      '原地排序（in-place sort）：只用幾個變數，直接在原陣列裡換位置，不另外開一個陣列。氣泡、選擇、插入是原地的；快速排序也算原地，只多了遞迴的堆疊（平均 O(log n)）；合併排序不是，要多 O(n) 的暫存陣列。',
      '為什麼只靠比大小的排序最快就是 O(n log n)（下界證明）、快速排序的「平均」怎麼算出來（期望時間分析），之後的演算法小教室會講。堆積排序（heap sort）要先認識堆積（heap）這個結構，放在進階篇。',
    ],
    // 各排序的時間複雜度（Big-O 的定義與怎麼算在附錄 D）
    complexity: [
      ['氣泡排序 bubble sort', '最好 O(n)（有提早結束）、平均 O(n²)、最差 O(n²)；額外空間 O(1)；穩定'],
      ['選擇排序 selection sort', '最好、平均、最差都是 O(n²)；額外空間 O(1)；不穩定'],
      ['插入排序 insertion sort', '最好 O(n)、平均 O(n²)、最差 O(n²)；額外空間 O(1)；穩定'],
      ['合併排序 merge sort', '最好、平均、最差都是 O(n log n)；額外空間 O(n)；穩定'],
      ['快速排序 quick sort', '最好 O(n log n)、平均 O(n log n)、最差 O(n²)；額外空間平均 O(log n)（遞迴的堆疊）；不穩定'],
    ],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: '快速排序永遠最快', right: '最差是 O(n²)。資料已經排好、又拿最後一個當 pivot，每次只切掉 pivot 自己：[1 2 3 4 5 6] 要切 5 次、比 15 次，跟氣泡排序一樣多。實際的程式會隨機挑 pivot，或拿頭、中、尾三個數的中位數（median-of-three）來避開。' },
      { wrong: 'JavaScript 的 [10, 9, 1].sort() 會照數字排', right: '沒給比較函式時，會先把每個值轉成字串再比：字串 "10" 的第一個字元 "1" 比 "9" 小，所以排出 [1, 10, 9]。照數字排要寫 .sort((a, b) => a - b)。Python、Java、C++ 的數字是照數字排的，沒有這個問題。' },
      { wrong: '氣泡排序沒用，只是拿來教的', right: '加上「一輪都沒換就提早結束」，資料已經排好時第 1 輪比 n − 1 次就結束，O(n)；每個數都離正確位置不遠時，也只要跑幾輪。程式又短，資料很少、幾乎排好時還是派得上用場。' },
      { wrong: '穩定不穩定不重要，反正都排好了', right: '照兩個條件排就靠它：試算表先照座號排、再照分數排，第二次用穩定排序，同分的才會維持座號順序。Python 的 sorted、Java 物件陣列的 Arrays.sort、JavaScript 的 sort（ES2019 起）保證穩定；C++ 的 std::sort 不保證，要穩定得用 std::stable_sort。' },
      { wrong: '選擇排序和插入排序都是 O(n²)，比的次數一樣', right: '選擇排序不管資料長怎樣，每輪都要把剩下的全部看完，6 個數固定比 15 次；插入排序遇到不比自己大的就停，這頁只比 12 次，已經排好的資料只要比 n − 1 = 5 次。反過來，選擇排序每輪最多換一次，交換的次數比較少。' },
      { wrong: '合併排序第 k 輪長怎樣只有一種答案', right: '有兩種常見寫法：這頁由下往上（bottom-up），寬度 1、2、4 兩兩合併；課本也常寫成遞迴（top-down），先切成兩半、各自排好再合併。最後結果一樣，n 不是 2 的次方時中間的段卻不一樣：6 個數的遞迴版先切成 [5 2 4] 和 [6 1 3]，4 跟 6 到最後一輪才碰面；這頁第 1 輪就把 [4] [6] 合併了。寫過程前先看題目用哪一種。' },
    ],
    code: {
      python: {
        builtin: `# sorted 回傳排好的新串列，原本的不動；要原地排就用 data.sort()。兩個都保證穩定
data = [5, 2, 4, 6, 1, 3]
print(*sorted(data))
`,
        handmade: `# 自己刻：插入排序和快速排序各一個函式，都在原陣列上排（原地排序）


def insertion_sort(a):
    for k in range(1, len(a)):
        key = a[k]
        j = k - 1
        while j >= 0 and a[j] > key:  # 比 key 大的往後挪一格
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = key


def quick_sort(a, lo, hi):
    if lo >= hi:
        return
    pivot = a[hi]  # Lomuto 分割：拿這段最後一個當 pivot
    i = lo  # 下一個比 pivot 小的要放的位置
    for j in range(lo, hi):
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]  # pivot 放到 a[i]：左邊都比它小、右邊都不比它小
    quick_sort(a, lo, i - 1)
    quick_sort(a, i + 1, hi)


data = [5, 2, 4, 6, 1, 3]
a = data[:]
b = data[:]
insertion_sort(a)
quick_sort(b, 0, len(b) - 1)
if a == b:
    print(*a)
else:
    print("mismatch")
`,
      },
      js: {
        builtin: `// 一定要給比較函式：沒給的話會先轉成字串再比，[10, 9, 1].sort() 會排成 [1, 10, 9]
const data = [5, 2, 4, 6, 1, 3];
data.sort((a, b) => a - b); // 原地排序；ES2019 起保證穩定
console.log(data.join(' '));
`,
        handmade: `// 自己刻：插入排序和快速排序各一個函式，都在原陣列上排（原地排序）
function insertionSort(a) {
  for (let k = 1; k < a.length; k++) {
    const key = a[k];
    let j = k - 1;
    while (j >= 0 && a[j] > key) { // 比 key 大的往後挪一格
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
  }
}

function quickSort(a, lo, hi) {
  if (lo >= hi) return;
  const pivot = a[hi]; // Lomuto 分割：拿這段最後一個當 pivot
  let i = lo; // 下一個比 pivot 小的要放的位置
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) {
      [a[i], a[j]] = [a[j], a[i]];
      i++;
    }
  }
  [a[i], a[hi]] = [a[hi], a[i]]; // pivot 放到 a[i]：左邊都比它小、右邊都不比它小
  quickSort(a, lo, i - 1);
  quickSort(a, i + 1, hi);
}

const data = [5, 2, 4, 6, 1, 3];
const a = [...data];
const b = [...data];
insertionSort(a);
quickSort(b, 0, b.length - 1);
console.log(a.join(' ') === b.join(' ') ? a.join(' ') : 'mismatch');
`,
      },
      java: {
        builtin: `import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] data = {5, 2, 4, 6, 1, 3};
        Arrays.sort(data); // int[] 用 Dual-Pivot Quicksort；Integer[] 這種物件陣列用穩定的合併排序（改自 TimSort）
        StringBuilder out = new StringBuilder();
        for (int x : data) out.append(out.length() > 0 ? " " : "").append(x);
        System.out.println(out);
    }
}
`,
        handmade: `// 自己刻：插入排序和快速排序各一個函式，都在原陣列上排（原地排序）
import java.util.Arrays;

public class Main {
    static void insertionSort(int[] a) {
        for (int k = 1; k < a.length; k++) {
            int key = a[k];
            int j = k - 1;
            while (j >= 0 && a[j] > key) { // 比 key 大的往後挪一格
                a[j + 1] = a[j];
                j--;
            }
            a[j + 1] = key;
        }
    }

    static void quickSort(int[] a, int lo, int hi) {
        if (lo >= hi) return;
        int pivot = a[hi]; // Lomuto 分割：拿這段最後一個當 pivot
        int i = lo; // 下一個比 pivot 小的要放的位置
        for (int j = lo; j < hi; j++) {
            if (a[j] < pivot) {
                int t = a[i]; a[i] = a[j]; a[j] = t;
                i++;
            }
        }
        int t = a[i]; a[i] = a[hi]; a[hi] = t; // pivot 放到 a[i]：左邊都比它小、右邊都不比它小
        quickSort(a, lo, i - 1);
        quickSort(a, i + 1, hi);
    }

    public static void main(String[] args) {
        int[] data = {5, 2, 4, 6, 1, 3};
        int[] a = data.clone();
        int[] b = data.clone();
        insertionSort(a);
        quickSort(b, 0, b.length - 1);
        if (!Arrays.equals(a, b)) {
            System.out.println("mismatch");
            return;
        }
        StringBuilder out = new StringBuilder();
        for (int x : a) out.append(out.length() > 0 ? " " : "").append(x);
        System.out.println(out);
    }
}
`,
      },
      cpp: {
        builtin: `#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> data = {5, 2, 4, 6, 1, 3};
    std::sort(data.begin(), data.end()); // 不保證穩定；要穩定用 std::stable_sort
    for (size_t i = 0; i < data.size(); i++) std::cout << (i ? " " : "") << data[i];
    std::cout << "\\n";
}
`,
        handmade: `// 自己刻：插入排序和快速排序各一個函式，都在原陣列上排（原地排序）
#include <iostream>
#include <utility>

void insertionSort(int a[], int n) {
    for (int k = 1; k < n; k++) {
        int key = a[k];
        int j = k - 1;
        while (j >= 0 && a[j] > key) { // 比 key 大的往後挪一格
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}

void quickSort(int a[], int lo, int hi) {
    if (lo >= hi) return;
    int pivot = a[hi]; // Lomuto 分割：拿這段最後一個當 pivot
    int i = lo; // 下一個比 pivot 小的要放的位置
    for (int j = lo; j < hi; j++) {
        if (a[j] < pivot) std::swap(a[i++], a[j]);
    }
    std::swap(a[i], a[hi]); // pivot 放到 a[i]：左邊都比它小、右邊都不比它小
    quickSort(a, lo, i - 1);
    quickSort(a, i + 1, hi);
}

int main() {
    const int N = 6;
    int a[N] = {5, 2, 4, 6, 1, 3};
    int b[N] = {5, 2, 4, 6, 1, 3};
    insertionSort(a, N);
    quickSort(b, 0, N - 1);
    for (int i = 0; i < N; i++) {
        if (a[i] != b[i]) {
            std::cout << "mismatch\\n";
            return 0;
        }
    }
    for (int i = 0; i < N; i++) std::cout << (i ? " " : "") << a[i];
    std::cout << "\\n";
}
`,
      },
      output: '1 2 3 4 5 6',
    },
    // 沙盒：五顆鈕各走那種排序的下一輪；按的跟正在做的不同種，就從原陣列重新開始那一種；排好再按是錯誤
    sandbox: {
      ops: [
        { op: 'bubble', label: '氣泡 bubble' }, { op: 'selection', label: '選擇 selection' }, { op: 'insertion', label: '插入 insertion' },
        { op: 'merge', label: '合併 merge' }, { op: 'quick', label: '快速 quick' },
      ],
      errors: { done: '已經排好了，換一種排序從頭比比看。' },
      init() { return start(null); },
      apply(s, op) {
        const run = s.algo === op ? s : start(op);
        if (run.done) return { ...run, touched: [], segment: null, error: 'done' };
        const next = ROUND[op](run);
        return { ...run, ...next, round: run.round + 1, total: run.total + next.compares, error: null };
      },
      label(op, s) {
        const count = `（比 ${s.compares} 次）`;
        if (op === 'bubble') return s.swaps ? `氣泡排序：${s.key} 推到 a[${s.at}]${count}` : `氣泡排序：一次都沒換，排好了${count}`;
        if (op === 'selection') return `選擇排序：選出 ${s.key}，${s.swaps ? '換到' : '本來就在'} a[${s.at}]${count}`;
        if (op === 'insertion') return `插入排序：放好 ${s.key}${count}`;
        if (op === 'merge') return `合併排序：寬度 ${s.width} 的相鄰兩段合併，變成 ${runsText(s)}${count}`;
        return `快速排序：pivot ${s.key} 放到 a[${s.at}]${count}`;
      },
    },
    // 一排 6 格，格子下面標索引。這一輪動到的上黃色、排好的上淺綠色；排好的格子底下再畫一條綠線，這一輪剛排好、還是黃色的也看得出來。
    // 最上面一行是第幾輪、一共比了幾次；合併在索引下面用括號標出每一段，快速標出這一輪切的那段和 pivot。seed 固定，同一格每次畫出來一樣
    draw(kit, s, { sandbox = false } = {}) {
      const { rough, svgEl, svgText, INK, FILL, NEW } = kit;
      const cellW = sandbox ? 48 : 34, cellH = sandbox ? 40 : 32, pad = 8, top = 36;   // 格子上面留兩行：進度、pivot
      const w = N * cellW + pad * 2, hgt = top + cellH + 38;
      const svg = svgEl(w, hgt); const rc = rough.svg(svg);
      const left = (i) => pad + i * cellW, mid = (i) => left(i) + cellW / 2;
      const headerText = (x, text, anchor) => svgText(svg, x, 9, text, 12).setAttribute('text-anchor', anchor);
      if (s.algo) { headerText(pad, `第 ${s.round} 輪`, 'start'); headerText(w - pad, `一共比 ${s.total} 次`, 'end'); }
      else svgText(svg, w / 2, 9, '選一種排序，每按一下走一輪', 12);

      s.items.forEach((v, i) => {
        const fill = s.touched.includes(i) ? NEW : s.sorted.includes(i) ? DONE : FILL;
        svg.append(rc.rectangle(left(i) + 2, top + 2, cellW - 4, cellH - 4, { stroke: INK, fill, fillStyle: 'hachure', hachureGap: 5, roughness: 1, seed: 11 + v }));
        svgText(svg, mid(i), top + cellH / 2, String(v), sandbox ? 15 : 13);
        if (s.sorted.includes(i)) svg.append(rc.line(left(i) + 4, top + cellH + 3, left(i) + cellW - 4, top + cellH + 3, { stroke: DONE_INK, strokeWidth: 3, roughness: 0.5, seed: 70 + i }));
        svgText(svg, mid(i), top + cellH + 13, String(i), 11).style.fill = MUTED;
      });

      const brackets = s.algo === 'merge' ? s.runs : s.algo === 'quick' && s.segment ? [s.segment] : [];
      const by = top + cellH + 30;
      brackets.forEach(([lo, hi], k) => {
        const x1 = left(lo) + 4, x2 = left(hi) + cellW - 4;
        svg.append(rc.linearPath([[x1, by - 6], [x1, by], [x2, by], [x2, by - 6]], { stroke: INK, strokeWidth: 1.4, roughness: 0.6, seed: 80 + k }));
      });
      if (s.algo === 'quick' && s.segment) svgText(svg, mid(s.at), top - 9, 'pivot', 11);
      return svg;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('ds', 'sorting', page);
})(typeof window !== 'undefined' ? window : globalThis);
