// classroom/algorithms/dp.js — 演算法「動態規劃」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '一段 14 階的樓梯，每一步可以跨 1 階或 2 階。如果每天換一種走法，你可以連續走多久都不重複？',
    // 複習：用學過的遞迴硬算，階數一多就算不完；quote 是這頁的核心想法
    review: [
      { text: '我們學過遞迴。要走到第 14 階，最後一步不是從第 13 階跨 1 階上來，就是從第 12 階跨 2 階上來，所以走法數＝走到第 13 階的走法＋走到第 12 階的走法。寫成遞迴，14 階一下就算完；可是換成幾百階的登山步道，同一支程式算到天荒地老都算不完。', see: 'programming/recursion' },
      '翻開它的呼叫：算 14 階的時候，走到第 12 階的走法被算了 2 次、第 11 階 3 次、第 10 階 5 次……同一個答案一算再算。',
      { quote: '算過的答案記下來，下次直接拿來用，不要再算一次。' },
    ],
    summary: '14 階有 610 種走法，每天一種，可以連續走一年八個月不重複。下次碰到一個問題，答案可以拆成幾個小一點的同樣問題，而且那些小問題一直重複出現，你就知道：把答案填進表格，從小填到大。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '出國打包：行李箱限重 20 公斤，每樣東西有重量、也有多想帶，要帶哪幾樣最划算？一樣一樣考慮「帶或不帶」，把每種限重下的最好答案記在表上，這叫背包問題（knapsack）。',
      '打錯字時，軟體建議你可能想打的字：從字典裡找出跟你打的字差最少的那個。兩個字串差幾個字母（改一個、加一個、刪一個各算一步），叫編輯距離（edit distance），用一張表從短的前綴算到長的。',
      '比對兩份文件哪裡不一樣，像程式碼改版前後的 diff：找出兩邊都有、順序也一樣的最長那一串（最長共同子序列，LCS），剩下的就是改過的地方。',
      'APCS 實作題的中高級常考：背包、最長共同子序列、最長遞增子序列，還有在格子地圖上從左上走到右下有幾種走法。',
    ],
    concept: [
      '動態規劃（dynamic programming，簡稱 DP）是把大問題拆成比較小的同樣問題，每個小問題的答案記在一張表上，從小的填到大的。走樓梯的表是 ways：ways[n] 是走到第 n 階的走法數，ways[n] = ways[n − 1] + ways[n − 2]。',
      '能這樣做要有兩個條件。第一，大問題的答案可以由小問題的答案組起來：走到第 n 階，只能從第 n − 1 階或第 n − 2 階上來，這條式子叫遞迴關係（求最好的方案時，教科書叫它最佳子結構，optimal substructure）。第二，同樣的小問題一再出現（重疊子問題，overlapping subproblems）：上面的圖解裡，算 5 階要算兩次 3 階、三次 2 階。只有第一條、沒有重疊，記下答案也沒有東西可以省。',
      '表的最前面幾格要直接寫答案，叫初始值：走到第 1 階只有 1 種走法、第 2 階有 2 種（1＋1、2）。其他格子都從這兩格長出來，所以初始值錯一格，後面全錯。',
      { text: '兩種填法。由上而下（top-down）：照原本的遞迴寫，多一個 memo 陣列，算出答案就記下來，下次先查表，這叫記憶化（memoization），遞迴頁的課外補充講過。由下而上（bottom-up）：不用遞迴，用迴圈從初始值往後一格一格填，這叫填表（tabulation），下面的追蹤器就是這種。兩種都是動態規劃，每一格都只算一次。', see: 'programming/recursion' },
      '名字裡的 programming 不是寫程式，是規劃、排出最好的方案，跟線性規劃（linear programming）的 programming 同一個意思。這個名字是美國數學家 Richard Bellman 在 1950 年代取的，他研究的是一步一步做決定的問題。',
    ],
    traps: [
      { wrong: '動態規劃一定要用遞迴寫', right: '由上而下（遞迴加記憶）和由下而上（迴圈填表）都是動態規劃。考試手寫常用填表：不用想遞迴怎麼停，也不會有遞迴疊太深、把呼叫堆疊用完的問題。' },
      { wrong: '能寫成遞迴的問題，記下答案都會變快', right: '要有重疊的小問題才有得省。合併排序把陣列切成兩半各自排，兩半沒有重疊，每個小問題本來就只算一次，記下來也省不到。' },
      { wrong: '表格從哪裡開始填都可以', right: '每一格要用到的格子要先填好。ways[i] 用到 ways[i − 1] 和 ways[i − 2]，所以 i 要從小填到大；倒過來填，會拿到還沒算、還是 0 的格子（試試看第二題）。' },
      { wrong: '初始值寫錯一點沒關係，後面會修正回來', right: '表的每一格都從初始值長出來。把 ways[2] 寫成 1，ways[14] 就從 610 變成 377，整張表都跟著錯。' },
      { wrong: '走法數再大，int 都裝得下', right: '走法數長得很快：ways[45] 是 1836311903，ways[46] 就超過 int 的上限 2147483647。C、C++、Java 的 int 會溢位變成負數，Python 的整數沒有上限；要算更多階，C／C++ 改用 long long、Java 改用 long。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{n}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: 'n = 5', values: { n: 5 } }, { label: 'n = 1', values: { n: 1 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int n = {{n}};
    int ways[n + 1];
    ways[1] = 1;
    if (n >= 2) {
        ways[2] = 2;
    }
    for (int i = 3; i <= n; i++) {
        ways[i] = ways[i - 1] + ways[i - 2];
    }
    printf("%d\\n", ways[n]);
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

int main() {
    int n = {{n}};
    std::vector<int> ways(n + 1, 0);
    ways[1] = 1;
    if (n >= 2) {
        ways[2] = 2;
    }
    for (int i = 3; i <= n; i++) {
        ways[i] = ways[i - 1] + ways[i - 2];
    }
    std::cout << ways[n] << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int n = {{n}};
        int[] ways = new int[n + 1];
        ways[1] = 1;
        if (n >= 2) {
            ways[2] = 2;
        }
        for (int i = 3; i <= n; i++) {
            ways[i] = ways[i - 1] + ways[i - 2];
        }
        System.out.println(ways[n]);
    }
}
`,
        python: `n = {{n}}
ways = [0] * (n + 1)
ways[1] = 1
if n >= 2:
    ways[2] = 2
for i in range(3, n + 1):
    ways[i] = ways[i - 1] + ways[i - 2]
print(ways[n])
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 10, 7: 11, 8: 13 },
        cpp: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 11, 7: 12, 8: 14 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 9, 7: 10, 8: 12 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "n = 5": [
        {"line":1,"vars":{"n":5},"out":""},
        {"line":2,"vars":{"n":5,"ways":[0,0,0,0,0,0]},"out":""},
        {"line":3,"vars":{"n":5,"ways":[0,1,0,0,0,0]},"out":""},
        {"line":4,"vars":{"n":5,"ways":[0,1,0,0,0,0]},"out":"","cond":true},
        {"line":5,"vars":{"n":5,"ways":[0,1,2,0,0,0]},"out":""},
        {"line":6,"vars":{"n":5,"ways":[0,1,2,0,0,0],"i":3},"out":"","cond":true},
        {"line":7,"vars":{"n":5,"ways":[0,1,2,3,0,0],"i":3},"out":""},
        {"line":6,"vars":{"n":5,"ways":[0,1,2,3,0,0],"i":4},"out":"","cond":true},
        {"line":7,"vars":{"n":5,"ways":[0,1,2,3,5,0],"i":4},"out":""},
        {"line":6,"vars":{"n":5,"ways":[0,1,2,3,5,0],"i":5},"out":"","cond":true},
        {"line":7,"vars":{"n":5,"ways":[0,1,2,3,5,8],"i":5},"out":""},
        {"line":6,"vars":{"n":5,"ways":[0,1,2,3,5,8],"i":5},"out":"","cond":false},
        {"line":8,"vars":{"n":5,"ways":[0,1,2,3,5,8],"i":5},"out":"8\n"},
      ],
      "n = 1": [
        {"line":1,"vars":{"n":1},"out":""},
        {"line":2,"vars":{"n":1,"ways":[0,0]},"out":""},
        {"line":3,"vars":{"n":1,"ways":[0,1]},"out":""},
        {"line":4,"vars":{"n":1,"ways":[0,1]},"out":"","cond":false},
        {"line":6,"vars":{"n":1,"ways":[0,1]},"out":"","cond":false},
        {"line":8,"vars":{"n":1,"ways":[0,1]},"out":"1\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：上面是照遞迴算 5 階的呼叫樹，重複算的同一個問題塗同一個顏色；下面是一排表格，從左往右填，每一格只看前面兩格
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const AGAIN = '#bfe5b8';   // 2 階重複算的顏色（淺綠，跟一般格的藍分得開）；3 階用 NEW
      const s = svgEl(320, 300), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9 };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      // 呼叫樹：ways(5) → ways(4)、ways(3)；ways(4) → ways(3)、ways(2)；ways(3) → ways(2)、ways(1)
      const nodes = [
        { n: 5, x: 160, y: 44 },
        { n: 4, x: 95, y: 88, up: 0 }, { n: 3, x: 235, y: 88, up: 0 },
        { n: 3, x: 50, y: 132, up: 1 }, { n: 2, x: 135, y: 132, up: 1 }, { n: 2, x: 205, y: 132, up: 2 }, { n: 1, x: 270, y: 132, up: 2 },
        { n: 2, x: 25, y: 176, up: 3 }, { n: 1, x: 80, y: 176, up: 3 },
      ];
      const color = (n) => ({ 3: NEW, 2: AGAIN }[n] || FILL);
      label(160, 14, '照遞迴算 5 階：同一個問題算好幾次', 12, true);
      nodes.forEach((d, i) => { if (d.up !== undefined) s.append(rc.line(nodes[d.up].x, nodes[d.up].y + 14, d.x, d.y - 14, { ...line, seed: 70 + i })); });
      nodes.forEach((d, i) => { s.append(rc.circle(d.x, d.y, 28, { ...line, seed: 10 + i, fill: color(d.n), fillStyle: 'solid' })); label(d.x, d.y + 5, String(d.n), 14); });
      // 表格：第 1 到第 5 階，ways 從左往右填
      const values = [1, 2, 3, 5, 8], CELL = 52, LEFT = 30, TOP = 238;
      label(160, 216, '填表：從左往右，每一格＝前兩格相加', 12, true);
      values.forEach((v, i) => {
        const x = LEFT + i * CELL;
        s.append(rc.rectangle(x, TOP, CELL, 34, { ...line, seed: 90 + i, fill: i === 4 ? NEW : FILL, fillStyle: 'solid' }));
        label(x + CELL / 2, TOP + 23, String(v), 15);
        label(x + CELL / 2, TOP + 52, `${i + 1} 階`, 12, true);
      });
      label(LEFT + 4.5 * CELL, TOP - 6, '3 + 5', 12);
      return s;
    },
    code: {
      c: `#include <stdio.h>

int memo[50];                           // memo[n] 是 0 代表還沒算過

int climb_memo(int n) {                 // 由上而下：照遞迴寫，算過的記下來
    if (n <= 2) {                       // 初始值：1 階 1 種、2 階 2 種
        return n;
    }
    if (memo[n] == 0) {
        memo[n] = climb_memo(n - 1) + climb_memo(n - 2);
    }
    return memo[n];
}

int climb_table(int n) {                // 由下而上：從初始值往後一格一格填
    if (n <= 2) {
        return n;
    }
    int ways[n + 1];
    ways[1] = 1;
    ways[2] = 2;
    for (int i = 3; i <= n; i++) {
        ways[i] = ways[i - 1] + ways[i - 2];
    }
    return ways[n];
}

int main(void) {
    printf("%d %d\\n", climb_table(14), climb_memo(40));
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

std::vector<int> memo(50, 0);           // memo[n] 是 0 代表還沒算過

int climb_memo(int n) {                 // 由上而下：照遞迴寫，算過的記下來
    if (n <= 2) {                       // 初始值：1 階 1 種、2 階 2 種
        return n;
    }
    if (memo[n] == 0) {
        memo[n] = climb_memo(n - 1) + climb_memo(n - 2);
    }
    return memo[n];
}

int climb_table(int n) {                // 由下而上：從初始值往後一格一格填
    if (n <= 2) {
        return n;
    }
    std::vector<int> ways(n + 1, 0);
    ways[1] = 1;
    ways[2] = 2;
    for (int i = 3; i <= n; i++) {
        ways[i] = ways[i - 1] + ways[i - 2];
    }
    return ways[n];
}

int main() {
    std::cout << climb_table(14) << " " << climb_memo(40) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    static int[] memo = new int[50];    // memo[n] 是 0 代表還沒算過

    static int climbMemo(int n) {       // 由上而下：照遞迴寫，算過的記下來
        if (n <= 2) {                   // 初始值：1 階 1 種、2 階 2 種
            return n;
        }
        if (memo[n] == 0) {
            memo[n] = climbMemo(n - 1) + climbMemo(n - 2);
        }
        return memo[n];
    }

    static int climbTable(int n) {      // 由下而上：從初始值往後一格一格填
        if (n <= 2) {
            return n;
        }
        int[] ways = new int[n + 1];
        ways[1] = 1;
        ways[2] = 2;
        for (int i = 3; i <= n; i++) {
            ways[i] = ways[i - 1] + ways[i - 2];
        }
        return ways[n];
    }

    public static void main(String[] args) {
        System.out.println(climbTable(14) + " " + climbMemo(40));
    }
}
`,
      python: `memo = [0] * 50                         # memo[n] 是 0 代表還沒算過


def climb_memo(n):                      # 由上而下：照遞迴寫，算過的記下來
    if n <= 2:                          # 初始值：1 階 1 種、2 階 2 種
        return n
    if memo[n] == 0:
        memo[n] = climb_memo(n - 1) + climb_memo(n - 2)
    return memo[n]


def climb_table(n):                     # 由下而上：從初始值往後一格一格填
    if n <= 2:
        return n
    ways = [0] * (n + 1)
    ways[1] = 1
    ways[2] = 2
    for i in range(3, n + 1):
        ways[i] = ways[i - 1] + ways[i - 2]
    return ways[n]


print(climb_table(14), climb_memo(40))
`,
      output: '610 165580141',
    },
    // 跑幾步：照遞迴直接算和兩種動態規劃比一比
    cost: {
      rows: [
        ['照遞迴直接算 ways(n)：同樣的小問題一算再算（ways(14) 呼叫 753 次、ways(40) 呼叫兩億多次）', 'n 每加 1，次數大約變 1.6 倍，O(2ⁿ)'],
        ['由上而下加記憶：每個 ways(k) 只真的算一次', '呼叫大約 2n 次，O(n)'],
        ['由下而上填表：迴圈從 3 跑到 n，每一格做一次加法', 'n − 2 圈，O(n)'],
        ['表格佔的空間：一階一格', 'n + 1 格，O(n)；每一格只看前兩格，只留兩個變數就能省到 O(1)'],
      ],
      note: { text: '動態規劃跑幾步，通常是「表有幾格 × 每一格做多少事」。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '樓梯改成每一步可以跨 1、2 或 3 階。下面這段程式印出什麼？',
        code: {
          c: `int ways[6];
ways[1] = 1;
ways[2] = 2;
ways[3] = 4;
for (int i = 4; i <= 5; i++) {
    ways[i] = ways[i - 1] + ways[i - 2] + ways[i - 3];
}
printf("%d\\n", ways[5]);`,
          cpp: `std::vector<int> ways(6, 0);
ways[1] = 1;
ways[2] = 2;
ways[3] = 4;
for (int i = 4; i <= 5; i++) {
    ways[i] = ways[i - 1] + ways[i - 2] + ways[i - 3];
}
std::cout << ways[5] << "\\n";`,
          java: `int[] ways = new int[6];
ways[1] = 1;
ways[2] = 2;
ways[3] = 4;
for (int i = 4; i <= 5; i++) {
    ways[i] = ways[i - 1] + ways[i - 2] + ways[i - 3];
}
System.out.println(ways[5]);`,
          python: `ways = [0] * 6
ways[1] = 1
ways[2] = 2
ways[3] = 4
for i in range(4, 6):
    ways[i] = ways[i - 1] + ways[i - 2] + ways[i - 3]
print(ways[5])`,
        },
        options: ['8', '7', '13', '24'],
        answer: 2,
        why: 'ways[4] = 4 + 2 + 1 = 7，ways[5] = 7 + 4 + 2 = 13。8 是只能跨 1、2 階時的答案，忘了多加 ways[i − 3]；7 是 ways[4]，迴圈少跑一圈；24 是把加號看成乘號：最後一步跨 1、2、3 階是三種不一樣的情況，走法數要加起來。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int ways[6];\n    ways[1] = 1;\n    ways[2] = 2;\n    ways[3] = 4;\n    for (int i = 4; i <= 5; i++) {\n        ways[i] = ways[i - 1] + ways[i - 2] + ways[i - 3];\n    }\n    printf("%d\\n", ways[5]);\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> ways(6, 0);\n    ways[1] = 1;\n    ways[2] = 2;\n    ways[3] = 4;\n    for (int i = 4; i <= 5; i++) {\n        ways[i] = ways[i - 1] + ways[i - 2] + ways[i - 3];\n    }\n    std::cout << ways[5] << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int[] ways = new int[6];\n        ways[1] = 1;\n        ways[2] = 2;\n        ways[3] = 4;\n        for (int i = 4; i <= 5; i++) {\n            ways[i] = ways[i - 1] + ways[i - 2] + ways[i - 3];\n        }\n        System.out.println(ways[5]);\n    }\n}\n',
          python: 'ways = [0] * 6\nways[1] = 1\nways[2] = 2\nways[3] = 4\nfor i in range(4, 6):\n    ways[i] = ways[i - 1] + ways[i - 2] + ways[i - 3]\nprint(ways[5])\n',
        },
        output: '13',
      },
      {
        kind: '程式測試與除錯',
        prompt: '想算 5 階有幾種走法（應該是 8），結果印出 0。要怎麼改？',
        code: {
          c: `int ways[6] = {0};
ways[1] = 1;
ways[2] = 2;
for (int i = 5; i >= 3; i--) {
    ways[i] = ways[i - 1] + ways[i - 2];
}
printf("%d\\n", ways[5]);`,
          cpp: `std::vector<int> ways(6, 0);
ways[1] = 1;
ways[2] = 2;
for (int i = 5; i >= 3; i--) {
    ways[i] = ways[i - 1] + ways[i - 2];
}
std::cout << ways[5] << "\\n";`,
          java: `int[] ways = new int[6];
ways[1] = 1;
ways[2] = 2;
for (int i = 5; i >= 3; i--) {
    ways[i] = ways[i - 1] + ways[i - 2];
}
System.out.println(ways[5]);`,
          python: `ways = [0] * 6
ways[1] = 1
ways[2] = 2
for i in range(5, 2, -1):
    ways[i] = ways[i - 1] + ways[i - 2]
print(ways[5])`,
        },
        options: ['把 ways[2] = 2 改成 ways[2] = 1', '把陣列開大一格', '把 ways[i - 2] 改成 ways[i - 1]', '迴圈改成 i 從 3 往上數到 5'],
        answer: 3,
        why: '迴圈從 5 開始，ways[5] 用到的 ways[4]、ways[3] 都還沒算、還是 0，所以 ways[5] 是 0。改成從 3 往上填，每一格要用的前兩格都先填好了，印出 8。另外三個選項都沒動到填的順序，ways[5] 一樣是第一個算、一樣拿到兩個 0，還是印 0。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int ways[6] = {0};\n    ways[1] = 1;\n    ways[2] = 2;\n    for (int i = 5; i >= 3; i--) {\n        ways[i] = ways[i - 1] + ways[i - 2];\n    }\n    printf("%d\\n", ways[5]);\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> ways(6, 0);\n    ways[1] = 1;\n    ways[2] = 2;\n    for (int i = 5; i >= 3; i--) {\n        ways[i] = ways[i - 1] + ways[i - 2];\n    }\n    std::cout << ways[5] << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int[] ways = new int[6];\n        ways[1] = 1;\n        ways[2] = 2;\n        for (int i = 5; i >= 3; i--) {\n            ways[i] = ways[i - 1] + ways[i - 2];\n        }\n        System.out.println(ways[5]);\n    }\n}\n',
          python: 'ways = [0] * 6\nways[1] = 1\nways[2] = 2\nfor i in range(5, 2, -1):\n    ways[i] = ways[i - 1] + ways[i - 2]\nprint(ways[5])\n',
        },
        output: '0',
      },
      {
        kind: '程式效能分析',
        prompt: '用 calls 數 climb 被呼叫了幾次。加了記憶以後，下面這段程式跑完 climb(6)，印出的 calls 是多少？',
        code: {
          c: `int memo[10];
int calls = 0;

int climb(int n) {
    calls += 1;
    if (n <= 2) {
        return n;
    }
    if (memo[n] == 0) {
        memo[n] = climb(n - 1) + climb(n - 2);
    }
    return memo[n];
}

climb(6);
printf("%d\\n", calls);`,
          cpp: `std::vector<int> memo(10, 0);
int calls = 0;

int climb(int n) {
    calls += 1;
    if (n <= 2) {
        return n;
    }
    if (memo[n] == 0) {
        memo[n] = climb(n - 1) + climb(n - 2);
    }
    return memo[n];
}

climb(6);
std::cout << calls << "\\n";`,
          java: `static int[] memo = new int[10];
static int calls = 0;

static int climb(int n) {
    calls += 1;
    if (n <= 2) {
        return n;
    }
    if (memo[n] == 0) {
        memo[n] = climb(n - 1) + climb(n - 2);
    }
    return memo[n];
}

climb(6);
System.out.println(calls);`,
          python: `memo = [0] * 10
calls = 0

def climb(n):
    global calls
    calls += 1
    if n <= 2:
        return n
    if memo[n] == 0:
        memo[n] = climb(n - 1) + climb(n - 2)
    return memo[n]

climb(6)
print(calls)`,
        },
        options: ['15', '9', '6', '13'],
        answer: 1,
        why: '第一次往下走 climb(6)、climb(5)、climb(4)、climb(3)、climb(2)、climb(1)，6 次；回來的路上，climb(4) 還要呼叫一次 climb(2)，climb(5) 呼叫的 climb(3)、climb(6) 呼叫的 climb(4) 都已經記在 memo，進去查一下就回來，各算 1 次，一共 9 次。15 是沒有記憶時的次數；6 是以為查表不算呼叫，可是查表也要先進到函式裡；13 是 climb(6) 算出來的走法數，不是呼叫次數。',
        program: {
          c: '#include <stdio.h>\nint memo[10];\nint calls = 0;\nint climb(int n) {\n    calls += 1;\n    if (n <= 2) {\n        return n;\n    }\n    if (memo[n] == 0) {\n        memo[n] = climb(n - 1) + climb(n - 2);\n    }\n    return memo[n];\n}\nint main(void) {\n    climb(6);\n    printf("%d\\n", calls);\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nstd::vector<int> memo(10, 0);\nint calls = 0;\nint climb(int n) {\n    calls += 1;\n    if (n <= 2) {\n        return n;\n    }\n    if (memo[n] == 0) {\n        memo[n] = climb(n - 1) + climb(n - 2);\n    }\n    return memo[n];\n}\nint main() {\n    climb(6);\n    std::cout << calls << "\\n";\n}\n',
          java: 'public class Main {\n    static int[] memo = new int[10];\n    static int calls = 0;\n    static int climb(int n) {\n        calls += 1;\n        if (n <= 2) {\n            return n;\n        }\n        if (memo[n] == 0) {\n            memo[n] = climb(n - 1) + climb(n - 2);\n        }\n        return memo[n];\n    }\n    public static void main(String[] args) {\n        climb(6);\n        System.out.println(calls);\n    }\n}\n',
          python: 'memo = [0] * 10\ncalls = 0\n\ndef climb(n):\n    global calls\n    calls += 1\n    if n <= 2:\n        return n\n    if memo[n] == 0:\n        memo[n] = climb(n - 1) + climb(n - 2)\n    return memo[n]\n\nclimb(6)\nprint(calls)\n',
        },
        output: '9',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'dp', page);
})(typeof window !== 'undefined' ? window : globalThis);
