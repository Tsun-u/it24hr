// classroom/algorithms/divide_conquer.js — 演算法「分治法」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '一張 0.1 公釐厚的紙，每對折一次，厚度變兩倍。想知道對折 30 次有多厚，要算 30 個 2 乘在一起。手上的計算機只有加減乘除，乘法真的要按 29 次嗎？',
    // 複習：用學過的迴圈一個一個乘，次方一大就跑不完；quote 是這頁的核心想法
    review: [
      { text: '用學過的迴圈：一圈乘一次 2，30 個 2 要乘 29 次。29 次不算什麼；可是程式題常常要算一個數的十億次方（再取餘數），迴圈就要跑十億圈。', see: 'programming/loops' },
      '換個角度看：30 個 2 可以分成兩堆，各 15 個。兩堆乘出來是同一個數，所以只要算一堆，再自己乘自己。15 個 2 又可以再分。',
      { quote: '把大問題切成一半大的同樣問題，解完小的，再把答案合起來。' },
    ],
    summary: '不用乘 29 次：2 的 30 次方是兩個「2 的 15 次方」相乘，15 次方再切，一路切到 0 次方，總共只乘 9 次，答案是 1073741824。0.1 公釐的紙對折 30 次，厚度超過 100 公里。下次碰到一個大問題，可以先想：能不能切成一半大的同樣問題，解完再合起來？每切一次就少一半，再大的問題也切不了幾次。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '單淘汰賽：64 隊分成上下兩個半區，各自打出一隊，再打決賽。每個半區裡面又是一場比較小的淘汰賽。',
      { text: '查字典、猜數字：翻開中間，答案只會在其中一半，另一半整個丟掉。二分搜尋切完只剩一個小問題要做。', see: 'ds/searching' },
      { text: '合併排序：切成左右兩半各自排好，再把兩疊合成一疊；快速排序也是切兩邊各自排。兩個小問題都要做，力氣花在「合」。', see: 'ds/sorting' },
      'RSA 加密要算一個很大的數的幾百位數次方再取餘數，靠的就是這一頁的切一半，叫快速冪（fast exponentiation）。',
      'APCS 實作題：a 的 n 次方除以 m 的餘數（n 到十億）、逆序數對、最大連續子陣列和。',
    ],
    concept: [
      '分治法（divide and conquer）分三步。分（divide）：把問題切成比較小的同樣問題。治（conquer）：小問題用同樣的方法解，小到可以直接知道答案就停。合（combine）：把小問題的答案組成大問題的答案。',
      '算 a 的 n 次方：分，n 切一半；治，算出 half = a 的 n / 2 次方；合，half × half。n 是奇數時，n / 2 捨去小數，少算了一個 a，要再乘回來：2¹⁵ = 2⁷ × 2⁷ × 2。n = 0 是最小的問題，答案直接是 1。',
      '為什麼快：n 每切一次少一半，30 → 15 → 7 → 3 → 1 → 0，切 5 次就到底；每一層最多乘 2 次。n 是十億也只切 30 次。',
      { text: '切出來的小問題要做幾個，每個問題不一樣。次方的兩半一模一樣，算一次就好；二分搜尋丟掉一半，也只做一個；合併排序左右兩半內容不同，兩個都要做，再花 n 步合起來，所以是 O(n log n)。', see: 'ds/sorting' },
      { text: '分治通常寫成遞迴：函式裡呼叫自己去解小問題，終止條件就是「小到直接知道答案」。', see: 'programming/recursion' },
    ],
    traps: [
      { wrong: '用了遞迴，就是分治法', right: '遞迴是寫法，分治是想法。通知同學的 notify(k + 1) 每次只少一個人，要疊 n 層；分治每次切成一半大，只疊 log₂ n 層。' },
      { wrong: 'half × half 寫成 power(a, n / 2) * power(a, n / 2) 也一樣', right: '答案一樣，可是兩邊都真的去算了一次，每一層呼叫兩次，總共的呼叫次數跟著 n 等比例變多，白切了。算一次存進 half，再自己乘自己（試試看第二題）。' },
      { wrong: 'n 是奇數沒辦法切一半', right: '整數除法會捨去小數：15 / 2 是 7。2⁷ × 2⁷ 是 2¹⁴，再乘一個 2 就是 2¹⁵。忘了補這一個，連 2 的 1 次方都會算成 1 × 1 = 1，往上每一層跟著錯，幾次方都印出 1（試試看第三題）。' },
      { wrong: '能切一半的問題，用分治都會變快', right: '要看「合」要花多少力氣、小問題要做幾個。找一排數字裡最大的：切兩半各找最大再比一次，每個數還是都看過一遍，跟迴圈一樣是 O(n)。' },
      { wrong: '答案再大，long long 都裝得下', right: '2⁶³ 就超過 long long 的上限了。題目通常會要你算除以某個數的餘數，每乘一次就取一次餘數，數字才不會爆掉；Python 的整數沒有上限，可是數字太大一樣會變慢。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{n}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '2 的 10 次方', values: { n: 10 } }, { label: '2 的 5 次方', values: { n: 5 } }],
      code: {
        c: `#include <stdio.h>

int power(int a, int n) {
    if (n == 0) {
        return 1;
    }
    int half = power(a, n / 2);
    if (n % 2 == 1) {
        return half * half * a;
    }
    return half * half;
}

int main(void) {
    int result = power(2, {{n}});
    printf("%d\\n", result);
    return 0;
}
`,
        cpp: `#include <iostream>

int power(int a, int n) {
    if (n == 0) {
        return 1;
    }
    int half = power(a, n / 2);
    if (n % 2 == 1) {
        return half * half * a;
    }
    return half * half;
}

int main() {
    int result = power(2, {{n}});
    std::cout << result << "\\n";
    return 0;
}
`,
        java: `public class Main {
    static int power(int a, int n) {
        if (n == 0) {
            return 1;
        }
        int half = power(a, n / 2);
        if (n % 2 == 1) {
            return half * half * a;
        }
        return half * half;
    }

    public static void main(String[] args) {
        int result = power(2, {{n}});
        System.out.println(result);
    }
}
`,
        python: `def power(a, n):
    if n == 0:
        return 1
    half = power(a, n // 2)
    if n % 2 == 1:
        return half * half * a
    return half * half

result = power(2, {{n}})
print(result)
`,
      },
      lines: {
        c: { 1: 3, 2: 4, 3: 5, 4: 7, 5: 8, 6: 9, 7: 11, 9: 15, 10: 16 },
        cpp: { 1: 3, 2: 4, 3: 5, 4: 7, 5: 8, 6: 9, 7: 11, 9: 15, 10: 16 },
        java: { 1: 2, 2: 3, 3: 4, 4: 6, 5: 7, 6: 8, 7: 10, 9: 14, 10: 15 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "2 的 10 次方": [
        {"line":1,"vars":{},"out":"","def":"power"},
        {"line":9,"vars":{"a":2,"n":10},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}}],"call":"power"},
        {"line":2,"vars":{"a":2,"n":10},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}}],"cond":false},
        {"line":4,"vars":{"a":2,"n":5},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}}],"call":"power"},
        {"line":2,"vars":{"a":2,"n":5},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}}],"cond":false},
        {"line":4,"vars":{"a":2,"n":2},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}}],"call":"power"},
        {"line":2,"vars":{"a":2,"n":2},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}}],"cond":false},
        {"line":4,"vars":{"a":2,"n":1},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1}}],"call":"power"},
        {"line":2,"vars":{"a":2,"n":1},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1}}],"cond":false},
        {"line":4,"vars":{"a":2,"n":0},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1}},{"fn":"power","vars":{"a":2,"n":0}}],"call":"power"},
        {"line":2,"vars":{"a":2,"n":0},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1}},{"fn":"power","vars":{"a":2,"n":0}}],"cond":true},
        {"line":3,"vars":{"a":2,"n":0},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1}},{"fn":"power","vars":{"a":2,"n":0}}],"ret":1},
        {"line":4,"vars":{"a":2,"n":1,"half":1},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1,"half":1}}]},
        {"line":5,"vars":{"a":2,"n":1,"half":1},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1,"half":1}}],"cond":true},
        {"line":6,"vars":{"a":2,"n":1,"half":1},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1,"half":1}}],"ret":2},
        {"line":4,"vars":{"a":2,"n":2,"half":2},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2,"half":2}}]},
        {"line":5,"vars":{"a":2,"n":2,"half":2},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2,"half":2}}],"cond":false},
        {"line":7,"vars":{"a":2,"n":2,"half":2},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2,"half":2}}],"ret":4},
        {"line":4,"vars":{"a":2,"n":5,"half":4},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5,"half":4}}]},
        {"line":5,"vars":{"a":2,"n":5,"half":4},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5,"half":4}}],"cond":true},
        {"line":6,"vars":{"a":2,"n":5,"half":4},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10}},{"fn":"power","vars":{"a":2,"n":5,"half":4}}],"ret":32},
        {"line":4,"vars":{"a":2,"n":10,"half":32},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10,"half":32}}]},
        {"line":5,"vars":{"a":2,"n":10,"half":32},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10,"half":32}}],"cond":false},
        {"line":7,"vars":{"a":2,"n":10,"half":32},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":10,"half":32}}],"ret":1024},
        {"line":9,"vars":{"result":1024},"out":""},
        {"line":10,"vars":{"result":1024},"out":"1024\n"},
      ],
      "2 的 5 次方": [
        {"line":1,"vars":{},"out":"","def":"power"},
        {"line":9,"vars":{"a":2,"n":5},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}}],"call":"power"},
        {"line":2,"vars":{"a":2,"n":5},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}}],"cond":false},
        {"line":4,"vars":{"a":2,"n":2},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}}],"call":"power"},
        {"line":2,"vars":{"a":2,"n":2},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}}],"cond":false},
        {"line":4,"vars":{"a":2,"n":1},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1}}],"call":"power"},
        {"line":2,"vars":{"a":2,"n":1},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1}}],"cond":false},
        {"line":4,"vars":{"a":2,"n":0},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1}},{"fn":"power","vars":{"a":2,"n":0}}],"call":"power"},
        {"line":2,"vars":{"a":2,"n":0},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1}},{"fn":"power","vars":{"a":2,"n":0}}],"cond":true},
        {"line":3,"vars":{"a":2,"n":0},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1}},{"fn":"power","vars":{"a":2,"n":0}}],"ret":1},
        {"line":4,"vars":{"a":2,"n":1,"half":1},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1,"half":1}}]},
        {"line":5,"vars":{"a":2,"n":1,"half":1},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1,"half":1}}],"cond":true},
        {"line":6,"vars":{"a":2,"n":1,"half":1},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2}},{"fn":"power","vars":{"a":2,"n":1,"half":1}}],"ret":2},
        {"line":4,"vars":{"a":2,"n":2,"half":2},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2,"half":2}}]},
        {"line":5,"vars":{"a":2,"n":2,"half":2},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2,"half":2}}],"cond":false},
        {"line":7,"vars":{"a":2,"n":2,"half":2},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5}},{"fn":"power","vars":{"a":2,"n":2,"half":2}}],"ret":4},
        {"line":4,"vars":{"a":2,"n":5,"half":4},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5,"half":4}}]},
        {"line":5,"vars":{"a":2,"n":5,"half":4},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5,"half":4}}],"cond":true},
        {"line":6,"vars":{"a":2,"n":5,"half":4},"out":"","stack":[{"vars":{}},{"fn":"power","vars":{"a":2,"n":5,"half":4}}],"ret":32},
        {"line":9,"vars":{"result":32},"out":""},
        {"line":10,"vars":{"result":32},"out":"32\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：2 的 30 次方一路切一半，一列一層。左邊的箭頭往下是切，切到 0 次方（塗黃）直接知道答案；右邊一欄是每一層回來的答案，箭頭往上是合
    figure({ svgEl, svgText, rough, INK, NEW }) {
      const exponents = [30, 15, 7, 3, 1, 0];
      // 一列算式的每一塊：[底數, 次方]、運算符號，或單獨的數字
      const terms = (n) => {
        if (n === 0) return [[2, 0], '=', '1'];
        const half = [2, Math.floor(n / 2)];
        return [[2, n], '=', half, '×', half, ...(n % 2 === 1 ? ['×', '2'] : [])];
      };
      const s = svgEl(320, 212), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9 };
      const label = (x, y, text, size = 13, anchor = 'middle', muted = false) => {
        const t = svgText(s, x, y, text, size); t.setAttribute('text-anchor', anchor); if (muted) t.setAttribute('fill', '#57606a');
      };
      // 從 x 往右寫一列算式；次方用小一號的數字往上抬（等寬字型的上標字元太小，看不清楚）
      const BASE = 14, EXPONENT = 10, CHAR = 0.6, RAISE = 6;
      const writeRow = (x, y, n) => terms(n).forEach((term) => {
        if (Array.isArray(term)) {
          label(x, y, String(term[0]), BASE, 'start'); x += BASE * CHAR;
          label(x, y - RAISE, String(term[1]), EXPONENT, 'start'); x += String(term[1]).length * EXPONENT * CHAR + 2;
        } else {
          x += 6; label(x, y, term, BASE, 'start'); x += term.length * BASE * CHAR + 6;
        }
      });
      // 欄位的 x：切的箭頭、算式靠左的起點、答案靠右的終點、合的箭頭；第一列的 y 和列距
      const CUT = 12, EQUATION = 30, ANSWER = 294, MERGE = 308, TOP = 50, ROW = 28;
      const bottom = TOP + (exponents.length - 1) * ROW;
      label(160, 12, '2 的 30 次方，一路切一半', 12, 'middle', true);
      label(CUT, 30, '切', 12);
      s.append(rc.line(CUT, 42, CUT, bottom + 2, { ...line, seed: 11 }));
      s.append(rc.polygon([[CUT, bottom + 8], [CUT - 4, bottom], [CUT + 4, bottom]], { ...line, seed: 12, fill: INK, fillStyle: 'solid' }));
      label(MERGE, 30, '合', 12);
      s.append(rc.line(MERGE, bottom + 8, MERGE, 48, { ...line, seed: 13 }));
      s.append(rc.polygon([[MERGE, 42], [MERGE - 4, 50], [MERGE + 4, 50]], { ...line, seed: 14, fill: INK, fillStyle: 'solid' }));
      exponents.forEach((n, k) => {
        const y = TOP + k * ROW;
        if (n === 0) {
          s.append(rc.rectangle(EQUATION - 6, y - 13, 70, 26, { stroke: INK, strokeWidth: 1.3, roughness: 0.9, fillStyle: 'solid', fill: NEW, seed: 20 }));
          label(EQUATION + 70, y, '切到這裡直接知道答案', 11, 'start', true);
        }
        writeRow(EQUATION, y, n);
        label(ANSWER, y, String(2 ** n), 12, 'end');
      });
      return s;
    },
    code: {
      c: `#include <stdio.h>

// a 的 n 次方除以 m 的餘數；m 不超過 1000000007 的話，兩個餘數相乘放得進 long long
long long power_mod(long long a, long long n, long long m) {
    if (n == 0) {                               // 最小的問題：0 次方是 1
        return 1;
    }
    long long half = power_mod(a, n / 2, m);    // 治：只算一半，存起來
    long long result = half * half % m;         // 合：自己乘自己，乘完就取餘數
    if (n % 2 == 1) {                           // n 是奇數：補回少算的那個 a
        result = result * (a % m) % m;
    }
    return result;
}

int main(void) {
    printf("%lld %lld\\n", power_mod(2, 30, 1000000007), power_mod(3, 1000000000, 1000000007));
    return 0;
}
`,
      cpp: `#include <iostream>

// a 的 n 次方除以 m 的餘數；m 不超過 1000000007 的話，兩個餘數相乘放得進 long long
long long power_mod(long long a, long long n, long long m) {
    if (n == 0) {                               // 最小的問題：0 次方是 1
        return 1;
    }
    long long half = power_mod(a, n / 2, m);    // 治：只算一半，存起來
    long long result = half * half % m;         // 合：自己乘自己，乘完就取餘數
    if (n % 2 == 1) {                           // n 是奇數：補回少算的那個 a
        result = result * (a % m) % m;
    }
    return result;
}

int main() {
    std::cout << power_mod(2, 30, 1000000007) << " " << power_mod(3, 1000000000, 1000000007) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // a 的 n 次方除以 m 的餘數；m 不超過 1000000007 的話，兩個餘數相乘放得進 long
    static long powerMod(long a, long n, long m) {
        if (n == 0) {                           // 最小的問題：0 次方是 1
            return 1;
        }
        long half = powerMod(a, n / 2, m);      // 治：只算一半，存起來
        long result = half * half % m;          // 合：自己乘自己，乘完就取餘數
        if (n % 2 == 1) {                       // n 是奇數：補回少算的那個 a
            result = result * (a % m) % m;
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(powerMod(2, 30, 1000000007) + " " + powerMod(3, 1000000000, 1000000007));
    }
}
`,
      python: `def power_mod(a, n, m):                  # a 的 n 次方除以 m 的餘數
    if n == 0:                           # 最小的問題：0 次方是 1
        return 1
    half = power_mod(a, n // 2, m)       # 治：只算一半，存起來
    result = half * half % m             # 合：自己乘自己，乘完就取餘數
    if n % 2 == 1:                       # n 是奇數：補回少算的那個 a
        result = result * (a % m) % m
    return result


print(power_mod(2, 30, 1000000007), power_mod(3, 1000000000, 1000000007))
`,
      output: '73741817 235939645',
    },
    cost: {
      rows: [
        ['迴圈一個一個乘', 'n 次，O(n)'],
        ['切一半、算一次存起來：層數 log₂ n，每層最多乘 2 次', 'O(log n)'],
        ['切一半、兩邊各算一次：呼叫次數跟著 n 等比例變多', 'O(n)'],
      ],
      note: { text: '2 的 30 次方乘 9 次；十億次方大約乘 40 幾次。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '下面這段程式印出什麼？',
        code: {
          c: `int f(int n) {
    if (n == 0) {
        return 0;
    }
    return f(n / 2) + 1;
}

printf("%d\\n", f(13));`,
          cpp: `int f(int n) {
    if (n == 0) {
        return 0;
    }
    return f(n / 2) + 1;
}

std::cout << f(13) << "\\n";`,
          java: `static int f(int n) {
    if (n == 0) {
        return 0;
    }
    return f(n / 2) + 1;
}

System.out.println(f(13));`,
          python: `def f(n):
    if n == 0:
        return 0
    return f(n // 2) + 1

print(f(13))`,
        },
        options: ['13', '5', '4', '3'],
        answer: 2,
        why: 'n 每一層切一半：13 → 6 → 3 → 1 → 0。f(0) 回傳 0，往回每一層加 1，13、6、3、1 這四層各加一次，印出 4；f 數的就是 n 切幾次會到 0。13 是把 n / 2 看成 n − 1，一次只少 1 才要加 13 次；5 是函式被呼叫的次數，可是 f(0) 那一層直接回傳 0，沒有加 1；3 是漏了 n = 1 那一層，1 / 2 是 0，那一層也要加 1。',
        program: {
          c: `#include <stdio.h>
int f(int n) {
    if (n == 0) {
        return 0;
    }
    return f(n / 2) + 1;
}
int main(void) {
    printf("%d\\n", f(13));
    return 0;
}
`,
          cpp: `#include <iostream>
int f(int n) {
    if (n == 0) {
        return 0;
    }
    return f(n / 2) + 1;
}
int main() {
    std::cout << f(13) << "\\n";
}
`,
          java: `public class Main {
    static int f(int n) {
        if (n == 0) {
            return 0;
        }
        return f(n / 2) + 1;
    }
    public static void main(String[] args) {
        System.out.println(f(13));
    }
}
`,
          python: `def f(n):
    if n == 0:
        return 0
    return f(n // 2) + 1

print(f(13))
`,
        },
        output: '4',
      },
      {
        kind: '程式效能分析',
        prompt: '把 half × half 寫成兩邊各呼叫一次，函式一共會被呼叫幾次？calls(n) 照那個寫法數：自己這一次，加上兩邊各自的次數。下面這段程式印出什麼？',
        code: {
          c: `int calls(int n) {
    if (n == 0) {
        return 1;
    }
    return 1 + calls(n / 2) + calls(n / 2);
}

printf("%d\\n", calls(16));`,
          cpp: `int calls(int n) {
    if (n == 0) {
        return 1;
    }
    return 1 + calls(n / 2) + calls(n / 2);
}

std::cout << calls(16) << "\\n";`,
          java: `static int calls(int n) {
    if (n == 0) {
        return 1;
    }
    return 1 + calls(n / 2) + calls(n / 2);
}

System.out.println(calls(16));`,
          python: `def calls(n):
    if n == 0:
        return 1
    return 1 + calls(n // 2) + calls(n // 2)

print(calls(16))`,
        },
        options: ['6', '17', '32', '63'],
        answer: 3,
        why: '從最小的往回算：calls(0) = 1，calls(1) = 1 + 1 + 1 = 3，calls(2) = 7，calls(4) = 15，calls(8) = 31，calls(16) = 1 + 31 + 31 = 63。每往下一層，呼叫的次數就變兩倍：1、2、4、8、16、32，加起來 63。6 是算一次存進 half 的寫法，16、8、4、2、1、0 各呼叫一次；17 是把 calls(8) 當成 8，算成 1 + 8 + 8；32 只數了最底下 n = 0 的那一層，上面五層的 31 次沒算進去。',
        program: {
          c: `#include <stdio.h>
int calls(int n) {
    if (n == 0) {
        return 1;
    }
    return 1 + calls(n / 2) + calls(n / 2);
}
int main(void) {
    printf("%d\\n", calls(16));
    return 0;
}
`,
          cpp: `#include <iostream>
int calls(int n) {
    if (n == 0) {
        return 1;
    }
    return 1 + calls(n / 2) + calls(n / 2);
}
int main() {
    std::cout << calls(16) << "\\n";
}
`,
          java: `public class Main {
    static int calls(int n) {
        if (n == 0) {
            return 1;
        }
        return 1 + calls(n / 2) + calls(n / 2);
    }
    public static void main(String[] args) {
        System.out.println(calls(16));
    }
}
`,
          python: `def calls(n):
    if n == 0:
        return 1
    return 1 + calls(n // 2) + calls(n // 2)

print(calls(16))
`,
        },
        output: '63',
      },
      {
        kind: '程式測試與除錯',
        prompt: '想算 2 的 5 次方（32），結果印出 1。要怎麼改？',
        code: {
          c: `int power(int a, int n) {
    if (n == 0) {
        return 1;
    }
    int half = power(a, n / 2);
    return half * half;
}

printf("%d\\n", power(2, 5));`,
          cpp: `int power(int a, int n) {
    if (n == 0) {
        return 1;
    }
    int half = power(a, n / 2);
    return half * half;
}

std::cout << power(2, 5) << "\\n";`,
          java: `static int power(int a, int n) {
    if (n == 0) {
        return 1;
    }
    int half = power(a, n / 2);
    return half * half;
}

System.out.println(power(2, 5));`,
          python: `def power(a, n):
    if n == 0:
        return 1
    half = power(a, n // 2)
    return half * half

print(power(2, 5))`,
        },
        options: ['把終止條件改成 n == 1 時回傳 1', '把 return half * half 改成 return half * half * a', 'n 是奇數時，改成回傳 half * half * a', '把終止條件回傳的 1 改成 a'],
        answer: 2,
        why: '5 → 2 → 1 → 0，每個 n 往下切都會經過 1。1 / 2 是 0，1 次方被算成 1 × 1 = 1，少了一個 a；往上每一層拿 1 自己乘自己，還是 1。n 是奇數時補乘一個 a，1 次方是 2、2 次方是 4、5 次方是 4 × 4 × 2 = 32。終止條件改成 n == 1 回傳 1，1 次方一樣是 1，還是印出 1，而且算 0 次方時 0 / 2 還是 0，停不下來；每一層都多乘一個 a，偶數那幾層也多乘了，印出 128；終止條件回傳 a，等於把 0 次方當成 2，往上平方三次，印出 256。',
        program: {
          c: `#include <stdio.h>
int power(int a, int n) {
    if (n == 0) {
        return 1;
    }
    int half = power(a, n / 2);
    return half * half;
}
int main(void) {
    printf("%d\\n", power(2, 5));
    return 0;
}
`,
          cpp: `#include <iostream>
int power(int a, int n) {
    if (n == 0) {
        return 1;
    }
    int half = power(a, n / 2);
    return half * half;
}
int main() {
    std::cout << power(2, 5) << "\\n";
}
`,
          java: `public class Main {
    static int power(int a, int n) {
        if (n == 0) {
            return 1;
        }
        int half = power(a, n / 2);
        return half * half;
    }
    public static void main(String[] args) {
        System.out.println(power(2, 5));
    }
}
`,
          python: `def power(a, n):
    if n == 0:
        return 1
    half = power(a, n // 2)
    return half * half

print(power(2, 5))
`,
        },
        output: '1',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      {
        text: '合併排序的遞迴寫法是分治法最典型的樣子，三步都看得到。分：從中間切成左右兩半。治：兩半各自用同樣的方法排好，切到只剩一個數就不用排了。合：兩半都排好之後，各從開頭比，每次拿比較小的那個。跟快速冪不一樣的地方是左右兩半內容不同，兩個都要做，再花 n 步合起來。資料結構的排序頁是由下往上做（寬度 1、2、4 兩兩合併），這裡由上往下切，合併的做法一樣，可以開著那一頁對照。',
        see: 'ds/sorting',
        code: {
          c: `#include <stdio.h>

// 把 data[left..right] 排好
void merge_sort(int data[], int left, int right) {
    if (left >= right) {                     // 只剩一個數：已經排好了
        return;
    }
    int mid = (left + right) / 2;            // 分：從中間切成兩半
    merge_sort(data, left, mid);             // 治：左半排好
    merge_sort(data, mid + 1, right);        // 治：右半排好
    int merged[right - left + 1];            // 合：每次拿兩半開頭比較小的那個
    int i = left, j = mid + 1, k = 0;
    while (i <= mid && j <= right) {
        if (data[i] <= data[j]) {
            merged[k++] = data[i++];
        } else {
            merged[k++] = data[j++];
        }
    }
    while (i <= mid) {                       // 左半還有剩：整段接上去
        merged[k++] = data[i++];
    }
    while (j <= right) {                     // 右半還有剩：整段接上去
        merged[k++] = data[j++];
    }
    for (int t = 0; t < k; t++) {            // 把合好的結果放回原本的位置
        data[left + t] = merged[t];
    }
}

int main(void) {
    int data[] = {38, 27, 43, 3, 9, 82, 10};
    merge_sort(data, 0, 6);
    for (int i = 0; i < 7; i++) {
        printf(i == 0 ? "%d" : " %d", data[i]);
    }
    printf("\\n");
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>

// 把 data[left..right] 排好
void merge_sort(std::vector<int>& data, int left, int right) {
    if (left >= right) {                     // 只剩一個數：已經排好了
        return;
    }
    int mid = (left + right) / 2;            // 分：從中間切成兩半
    merge_sort(data, left, mid);             // 治：左半排好
    merge_sort(data, mid + 1, right);        // 治：右半排好
    std::vector<int> merged;                 // 合：每次拿兩半開頭比較小的那個
    int i = left, j = mid + 1;
    while (i <= mid && j <= right) {
        if (data[i] <= data[j]) {
            merged.push_back(data[i++]);
        } else {
            merged.push_back(data[j++]);
        }
    }
    while (i <= mid) {                       // 左半還有剩：整段接上去
        merged.push_back(data[i++]);
    }
    while (j <= right) {                     // 右半還有剩：整段接上去
        merged.push_back(data[j++]);
    }
    for (int t = 0; t < (int)merged.size(); t++) {   // 把合好的結果放回原本的位置
        data[left + t] = merged[t];
    }
}

int main() {
    std::vector<int> data = {38, 27, 43, 3, 9, 82, 10};
    merge_sort(data, 0, data.size() - 1);
    for (int i = 0; i < (int)data.size(); i++) {
        std::cout << (i == 0 ? "" : " ") << data[i];
    }
    std::cout << "\\n";
    return 0;
}
`,
          java: `public class Main {
    // 把 data[left..right] 排好
    static void mergeSort(int[] data, int left, int right) {
        if (left >= right) {                     // 只剩一個數：已經排好了
            return;
        }
        int mid = (left + right) / 2;            // 分：從中間切成兩半
        mergeSort(data, left, mid);              // 治：左半排好
        mergeSort(data, mid + 1, right);         // 治：右半排好
        int[] merged = new int[right - left + 1];   // 合：每次拿兩半開頭比較小的那個
        int i = left, j = mid + 1, k = 0;
        while (i <= mid && j <= right) {
            if (data[i] <= data[j]) {
                merged[k++] = data[i++];
            } else {
                merged[k++] = data[j++];
            }
        }
        while (i <= mid) {                       // 左半還有剩：整段接上去
            merged[k++] = data[i++];
        }
        while (j <= right) {                     // 右半還有剩：整段接上去
            merged[k++] = data[j++];
        }
        for (int t = 0; t < k; t++) {            // 把合好的結果放回原本的位置
            data[left + t] = merged[t];
        }
    }

    public static void main(String[] args) {
        int[] data = {38, 27, 43, 3, 9, 82, 10};
        mergeSort(data, 0, data.length - 1);
        StringBuilder line = new StringBuilder();
        for (int i = 0; i < data.length; i++) {
            line.append(i == 0 ? "" : " ").append(data[i]);
        }
        System.out.println(line);
    }
}
`,
          python: `def merge_sort(data, left, right):          # 把 data[left..right] 排好
    if left >= right:                       # 只剩一個數：已經排好了
        return
    mid = (left + right) // 2               # 分：從中間切成兩半
    merge_sort(data, left, mid)             # 治：左半排好
    merge_sort(data, mid + 1, right)        # 治：右半排好
    merged = []                             # 合：每次拿兩半開頭比較小的那個
    i, j = left, mid + 1
    while i <= mid and j <= right:
        if data[i] <= data[j]:
            merged.append(data[i])
            i += 1
        else:
            merged.append(data[j])
            j += 1
    while i <= mid:                         # 左半還有剩：整段接上去
        merged.append(data[i])
        i += 1
    while j <= right:                       # 右半還有剩：整段接上去
        merged.append(data[j])
        j += 1
    for t in range(len(merged)):            # 把合好的結果放回原本的位置
        data[left + t] = merged[t]


data = [38, 27, 43, 3, 9, 82, 10]
merge_sort(data, 0, len(data) - 1)
print(*data)
`,
          output: '3 9 10 27 38 43 82',
        },
      },
      { text: '逆序數對：一排數字裡，有幾對是大的排在小的前面。兩層迴圈要 O(n²)；照合併排序切兩半，左半、右半各自數完，合併的時候每從右半拿一個數，左半還沒拿的那些都比它大，一次加上去，O(n log n)。', see: ['inversions', 'ds/sorting'] },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'divide_conquer', page);
})(typeof window !== 'undefined' ? window : globalThis);
