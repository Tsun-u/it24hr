// classroom/programming/arrays.js — APCS 程式設計「陣列與串列」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
// 資料結構的陣列頁（ds/array）講陣列在記憶體裡怎麼存；這頁講怎麼用：照編號拿、走訪、二維表格
(function (root) {
  const page = {
    layout: 'program',
    analogy: '全班 30 個人的成績都存進程式了，我想輸入座號，就印出那個人的成績和有沒有及格，怎麼做？',
    // 複習：用前面學過的變數和判斷式硬做，做到一半需求又變大，這頁的概念上場；quote 是這頁的核心想法
    review: [
      '我們前面學了變數和判斷式，最直覺的做法就是寫 30 個變數、一串 if／else if（你輸入的座號，還要對回變數）和一個判斷式（判斷你取出來的數字有沒有及格）。在你把 else if 寫到第 15 個的時候，你收到通知：「隔壁班 35 人也麻煩你囉！」你是否已經開始懷疑人生？',
      { quote: '陣列可以解決這個問題。' },
    ],
    summary: '把 30 個成績放進一個陣列 score，輸入座號 k，score[k − 1] 就是那個人的成績，再用一個 if 判斷及不及格，30 個 if 變成一行。下次碰到照編號找資料，你就知道：放進陣列，用編號直接拿。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      'Python 的 list 不要求每一格同型態：[1, "a", 2.5] 放得進去，所以它叫串列（list）而不叫陣列。C、C++、Java 的陣列宣告成 int 就每一格都是 int，這也是它每一格一樣大、位置算得出來的原因。',
      { text: '陣列交給函式時，傳過去的是它的地址，不是整個複製一份，所以函式裡改了 a[0]，外面的 a[0] 也跟著變。為什麼、還有什麼時候會改不到，在附錄「傳值與傳參考」。', see: 'parameter_passing' },
    ],
    uses: [
      '電影院選位：一排座位存成一排格子，看 8 號位子有沒有人，直接讀編號 8 對到的那一格，不用從第一個位子一路看過去。',
      '開票：每位候選人一格，開一張票就在那位的格子加 1，開完直接讀每格是幾票，不用為每位候選人各寫一個 if。',
      '遊戲棋盤：井字遊戲、踩地雷的棋盤是二維陣列 board[列][行]，每格存這裡是空的、圈還是叉；判斷連線就是沿著列、行、斜線一格一格讀。',
      '電腦內部：下一頁的字串底下是一排字元的陣列；排序、搜尋這些演算法大多在一個陣列上一格一格走。',
    ],
    concept: [
      '陣列（array）是一排同型態、連續、有編號的格子，整排共用一個名字。全班的成績不用 s1、s2、…、s30 三十個名字，一個 score 就夠：score[0] 是第一個人、score[29] 是最後一個人。方括號裡的編號叫索引（index），從 0 開始數，所以 n 格的陣列索引是 0 到 n − 1，座號 k 的成績在 score[k − 1]。',
      '索引可以是變數，這就是它比 30 個變數強的地方：你輸入的座號本身就是位置，score[k − 1] 一行就拿到了，不用 30 個 if 一個一個對。而且不管陣列有 5 格還是 5 萬格，拿第 i 格都只要一步，O(1)。',
      '大小：C、C++、Java 宣告時就要定幾格（int score[30]），之後不能多不能少；Python 的 list 用 append 可以一直加，所以這一頁叫「陣列與串列」。要對每一格做同一件事，用迴圈讓 i 從 0 跑到 n − 1，叫走訪（traverse）：算總和、找最高分、數幾個人不及格，都是走訪一遍。',
      '表格用二維陣列（two-dimensional array）：table[i][j] 先列後行，table[i] 是第 i 列（第 i 個人的那一排），table[i][j] 是那一列的第 j 格（他的第 j 科）。走訪整張表就是巢狀迴圈：外圈換列、內圈換行。',
      { text: '陣列在記憶體裡怎麼排、為什麼拿第 i 格只要一步、插一格進中間要搬多少，資料結構中我們也會再次提到它。', see: 'ds/array' },
    ],
    traps: [
      { wrong: '第一格是 score[1]', right: '第一格是 score[0]。索引是「離第一格幾步」，所以座號 k 的成績是 score[k − 1]：追蹤器挑 k = 3，拿到的是 score[2] = 90，不是 score[3] = 45。' },
      { wrong: 'n 格的陣列，最後一格是 a[n]', right: '最後一格是 a[n − 1]，a[n] 已經出界。C、C++ 不檢查，讀到的是旁邊記憶體的垃圾值、寫進去會弄壞別的變數；Java 丟 ArrayIndexOutOfBoundsException，Python 報 IndexError。Python 的 a[-1] 是倒數第一格，C、C++、Java 的 a[-1] 一樣是出界。' },
      { wrong: 'b = a 會把陣列複製一份', right: 'Python 和 Java 的 b = a 是讓 b 和 a 指著同一排格子，改 b[0]，a[0] 也變了。要複製得明講：Python 寫 list(a) 或 a[:]，Java 寫 a.clone()。C、C++ 的陣列不能整排用 = 指定，要用迴圈一格一格抄。' },
      { wrong: '宣告 int a[5] 以後，每一格都是 0', right: 'Java 的 new int[5] 每格是 0；C、C++ 在函式裡宣告的 int a[5] 沒有初始值，裡面是記憶體原本的垃圾，要寫 int a[5] = {0} 才全是 0；Python 要自己寫 [0] * 5。考試的 C 題本常從這裡出。' },
      { wrong: '二維陣列 a[i][j] 的 i 是行（直的）', right: '先列後行：a[i] 是第 i 列（橫的一整排），a[i][j] 是那一列裡的第 j 格。3 列 4 行的表宣告成 a[3][4]，i 最大 2、j 最大 3，兩個寫反就出界。' },
      { wrong: '陣列滿了再塞下一格，它會自己變大', right: 'C、C++、Java 的陣列宣告幾格就是幾格，塞第 n + 1 個就是出界；要變大得另開一個更大的陣列，把舊的搬過去。Python 的 list 要用 append 這類方法加才會長，a[5] = x 對只有 5 格的 list 一樣是 IndexError。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{k}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行（Python 第 6 行 else: 不會停）
    trace: {
      inputs: [{ label: 'k = 3', values: { k: 3 } }, { label: 'k = 4', values: { k: 4 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int score[] = {72, 58, 90, 45, 88};
    int k = {{k}};
    int s = score[k - 1];
    if (s >= 60) {
        printf("%d %d pass\\n", k, s);
    } else {
        printf("%d %d fail\\n", k, s);
    }
    return 0;
}
`,
        cpp: `#include <iostream>

int main() {
    int score[] = {72, 58, 90, 45, 88};
    int k = {{k}};
    int s = score[k - 1];
    if (s >= 60) {
        std::cout << k << " " << s << " pass\\n";
    } else {
        std::cout << k << " " << s << " fail\\n";
    }
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] score = {72, 58, 90, 45, 88};
        int k = {{k}};
        int s = score[k - 1];
        if (s >= 60) {
            System.out.println(k + " " + s + " pass");
        } else {
            System.out.println(k + " " + s + " fail");
        }
    }
}
`,
        python: `score = [72, 58, 90, 45, 88]
k = {{k}}
s = score[k - 1]
if s >= 60:
    print(k, s, "pass")
else:
    print(k, s, "fail")
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 7: 10 },
        cpp: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 7: 10 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 7: 9 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "k = 3": [
        {"line":1,"vars":{"score":[72,58,90,45,88]},"out":""},
        {"line":2,"vars":{"score":[72,58,90,45,88],"k":3},"out":""},
        {"line":3,"vars":{"score":[72,58,90,45,88],"k":3,"s":90},"out":""},
        {"line":4,"vars":{"score":[72,58,90,45,88],"k":3,"s":90},"out":"","cond":true},
        {"line":5,"vars":{"score":[72,58,90,45,88],"k":3,"s":90},"out":"3 90 pass\n"},
      ],
      "k = 4": [
        {"line":1,"vars":{"score":[72,58,90,45,88]},"out":""},
        {"line":2,"vars":{"score":[72,58,90,45,88],"k":4},"out":""},
        {"line":3,"vars":{"score":[72,58,90,45,88],"k":4,"s":45},"out":""},
        {"line":4,"vars":{"score":[72,58,90,45,88],"k":4,"s":45},"out":"","cond":false},
        {"line":7,"vars":{"score":[72,58,90,45,88],"k":4,"s":45},"out":"4 45 fail\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：追蹤器那排成績的格子。上面是座號 1～5，下面是索引 0～4，座號 5 號對到從 0 數起的第 4 格
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      // 五格 46 寬、間隔 8，從 x = 48 排到 310，手機 320 寬放得下
      const score = [72, 58, 90, 45, 88], W = 46, GAP = 8, LEFT = 30, TOP = 70;
      const s = svgEl(320, 192), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9 };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      label(22, TOP + 24, 'score', 13, true);
      score.forEach((v, i) => {
        const x = LEFT + 18 + i * (W + GAP), hit = i === 4;
        label(x + W / 2, 42, `座號 ${i + 1}`, 12, !hit);
        s.append(rc.rectangle(x, TOP, W, 48, { ...line, seed: 5 + i, fill: hit ? NEW : FILL, fillStyle: 'solid' }));
        label(x + W / 2, TOP + 24, String(v), 15);
        label(x + W / 2, TOP + 66, `[${i}]`, 13, !hit);
      });
      // 座號 5 的箭頭直接指到索引 4 那格
      const x5 = LEFT + 18 + 4 * (W + GAP) + W / 2;
      s.append(rc.line(x5, 50, x5, TOP - 4, { ...line, seed: 21 }));
      s.append(rc.polygon([[x5, TOP - 2], [x5 - 5, TOP - 11], [x5 + 5, TOP - 11]], { ...line, seed: 22, fill: INK, fillStyle: 'solid' }));
      label(160, 22, '座號從 1 開始數，索引從 0 開始數', 12, true);
      label(160, 164, '座號 5 → score[5 − 1] → score[4] = 88', 13);
      label(160, 182, '索引是「離第一格幾步」，第一格是 score[0]', 12, true);
      return s;
    },
    code: {
      c: `#include <stdio.h>

int main(void) {
    int score[] = {72, 58, 90, 45, 88};
    int n = 5;

    int total = 0;
    for (int i = 0; i < n; i++) {           // 走訪：i 從 0 到 n - 1，每一格做同一件事
        total += score[i];
    }
    int avg = total / n;                    // 整數除法：353 / 5 = 70

    int below = 0;
    for (int i = 0; i < n; i++) {
        if (score[i] < avg) {
            below += 1;
        }
    }

    int table[3][3] = {{80, 90, 70}, {60, 75, 85}, {95, 88, 92}};   // 3 個人 × 3 科：table[i] 是第 i 個人那一列
    int rows[3] = {0, 0, 0};
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {       // 巢狀迴圈走訪二維陣列：外圈換列、內圈換行
            rows[i] += table[i][j];
        }
    }

    printf("%d %d %d %d %d\\n", avg, below, rows[0], rows[1], rows[2]);
    return 0;
}
`,
      cpp: `#include <iostream>

int main() {
    int score[] = {72, 58, 90, 45, 88};
    int n = 5;

    int total = 0;
    for (int i = 0; i < n; i++) {           // 走訪：i 從 0 到 n - 1，每一格做同一件事
        total += score[i];
    }
    int avg = total / n;                    // 整數除法：353 / 5 = 70

    int below = 0;
    for (int i = 0; i < n; i++) {
        if (score[i] < avg) {
            below += 1;
        }
    }

    int table[3][3] = {{80, 90, 70}, {60, 75, 85}, {95, 88, 92}};   // 3 個人 × 3 科：table[i] 是第 i 個人那一列
    int rows[3] = {0, 0, 0};
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 3; j++) {       // 巢狀迴圈走訪二維陣列：外圈換列、內圈換行
            rows[i] += table[i][j];
        }
    }

    std::cout << avg << " " << below << " " << rows[0] << " " << rows[1] << " " << rows[2] << "\\n";
    return 0;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int[] score = {72, 58, 90, 45, 88};
        int n = 5;

        int total = 0;
        for (int i = 0; i < n; i++) {       // 走訪：i 從 0 到 n - 1，每一格做同一件事
            total += score[i];
        }
        int avg = total / n;                // 整數除法：353 / 5 = 70

        int below = 0;
        for (int i = 0; i < n; i++) {
            if (score[i] < avg) {
                below += 1;
            }
        }

        int[][] table = {{80, 90, 70}, {60, 75, 85}, {95, 88, 92}};   // 3 個人 × 3 科：table[i] 是第 i 個人那一列
        int[] rows = {0, 0, 0};
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {   // 巢狀迴圈走訪二維陣列：外圈換列、內圈換行
                rows[i] += table[i][j];
            }
        }

        System.out.println(avg + " " + below + " " + rows[0] + " " + rows[1] + " " + rows[2]);
    }
}
`,
      python: `score = [72, 58, 90, 45, 88]
n = 5

total = 0
for i in range(n):                 # 走訪：i 從 0 到 n - 1，每一格做同一件事
    total += score[i]
avg = total // n                   # 整數除法：353 // 5 = 70

below = 0
for i in range(n):
    if score[i] < avg:
        below += 1

table = [[80, 90, 70], [60, 75, 85], [95, 88, 92]]   # 3 個人 × 3 科：table[i] 是第 i 個人那一列
rows = [0, 0, 0]
for i in range(3):
    for j in range(3):             # 巢狀迴圈走訪二維陣列：外圈換列、內圈換行
        rows[i] += table[i][j]

print(avg, below, rows[0], rows[1], rows[2])
`,
      output: '70 2 240 220 275',
    },
    // 跑幾步：拿一格是一步，走訪是 n 步，二維表是 n·m 步
    cost: {
      rows: [
        ['追蹤器的 score[k - 1]：照編號直接拿，陣列 5 格或 5 萬格都一樣', '1 次，O(1)'],
        ['實作的走訪 total += score[i]（n = 5 時跑 5 次）', 'n 次，O(n)'],
        ['實作的二維走訪 rows[i] += table[i][j]（3 × 3 的表跑 9 次）', 'n·m 次，O(n·m)'],
      ],
      note: { text: '拿一格不管陣列多大都是一步，要每一格都看過才跟格數一起長。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '下面這段程式印出什麼？',
        code: {
          c: `int a[] = {3, 1, 4, 1, 5};
for (int i = 1; i < 5; i++) {
    a[i] = a[i - 1] + a[i];
}
printf("%d %d\\n", a[2], a[4]);`,
          cpp: `int a[] = {3, 1, 4, 1, 5};
for (int i = 1; i < 5; i++) {
    a[i] = a[i - 1] + a[i];
}
std::cout << a[2] << " " << a[4] << "\\n";`,
          java: `int[] a = {3, 1, 4, 1, 5};
for (int i = 1; i < 5; i++) {
    a[i] = a[i - 1] + a[i];
}
System.out.println(a[2] + " " + a[4]);`,
          python: `a = [3, 1, 4, 1, 5]
for i in range(1, 5):
    a[i] = a[i - 1] + a[i]
print(a[2], a[4])`,
        },
        options: ['8 9', '5 6', '4 5', '8 14'],
        answer: 3,
        why: '每一圈把前一格（已經改過的）加進這一格：a 依序變成 3、4、8、9、14，所以 a[2] 是 8、a[4] 是 14。5 6 是拿原本的值相加（1 + 4、1 + 5），忘了 a[i − 1] 在上一圈已經被改掉；4 5 是以為陣列沒被改；8 9 印的是 a[2] 和 a[3]，不是 a[4]。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int a[] = {3, 1, 4, 1, 5};\n    for (int i = 1; i < 5; i++) {\n        a[i] = a[i - 1] + a[i];\n    }\n    printf("%d %d\\n", a[2], a[4]);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int a[] = {3, 1, 4, 1, 5};\n    for (int i = 1; i < 5; i++) {\n        a[i] = a[i - 1] + a[i];\n    }\n    std::cout << a[2] << " " << a[4] << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int[] a = {3, 1, 4, 1, 5};\n        for (int i = 1; i < 5; i++) {\n            a[i] = a[i - 1] + a[i];\n        }\n        System.out.println(a[2] + " " + a[4]);\n    }\n}\n',
          python: 'a = [3, 1, 4, 1, 5]\nfor i in range(1, 5):\n    a[i] = a[i - 1] + a[i]\nprint(a[2], a[4])\n',
        },
        output: '8 14',
      },
      {
        kind: '程式測試與除錯',
        prompt: '想算 5 個成績的總和（應該是 353），結果印出 281。要怎麼改？',
        code: {
          c: `int score[] = {72, 58, 90, 45, 88};
int n = 5;
int total = 0;
for (int i = 1; i < n; i++) {
    total += score[i];
}
printf("%d\\n", total);`,
          cpp: `int score[] = {72, 58, 90, 45, 88};
int n = 5;
int total = 0;
for (int i = 1; i < n; i++) {
    total += score[i];
}
std::cout << total << "\\n";`,
          java: `int[] score = {72, 58, 90, 45, 88};
int n = 5;
int total = 0;
for (int i = 1; i < n; i++) {
    total += score[i];
}
System.out.println(total);`,
          python: `score = [72, 58, 90, 45, 88]
n = 5
total = 0
for i in range(1, n):
    total += score[i]
print(total)`,
        },
        options: ['把 i < n 改成 i <= n', '把 i = 1 改成 i = 0', '把 n = 5 改成 n = 6', '把 total = 0 改成 total = 72'],
        answer: 1,
        why: '索引從 0 開始，i 從 1 起跑會漏掉第一格的 72：353 − 72 正好是 281。改成 i <= n 會多讀一格 score[5]，那一格不存在：C、C++ 讀到垃圾值、Java 和 Python 直接報錯；n 改成 6 也一樣會讀到第 6 格。total 從 72 開始這次會印出 353，可是換一班成績就錯了，第一格的值不該寫死在程式裡。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int score[] = {72, 58, 90, 45, 88};\n    int n = 5;\n    int total = 0;\n    for (int i = 1; i < n; i++) {\n        total += score[i];\n    }\n    printf("%d\\n", total);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int score[] = {72, 58, 90, 45, 88};\n    int n = 5;\n    int total = 0;\n    for (int i = 1; i < n; i++) {\n        total += score[i];\n    }\n    std::cout << total << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int[] score = {72, 58, 90, 45, 88};\n        int n = 5;\n        int total = 0;\n        for (int i = 1; i < n; i++) {\n            total += score[i];\n        }\n        System.out.println(total);\n    }\n}\n',
          python: 'score = [72, 58, 90, 45, 88]\nn = 5\ntotal = 0\nfor i in range(1, n):\n    total += score[i]\nprint(total)\n',
        },
        output: '281',
      },
      {
        kind: '程式效能分析',
        prompt: '一張 n 列 m 行的成績表，n = 4、m = 3 時，下面這段程式跑完 count 是多少？',
        code: {
          c: `int count = 0;
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        count += 1;
    }
}`,
          cpp: `int count = 0;
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        count += 1;
    }
}`,
          java: `int count = 0;
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        count += 1;
    }
}`,
          python: `count = 0
for i in range(n):
    for j in range(m):
        count += 1`,
        },
        options: ['4', '7', '12', '3'],
        answer: 2,
        why: '外圈每換一列，內圈就把那一列的 m 格走一遍：4 列 × 3 行 = 12，每一格剛好看一次，是 O(n·m)。7 是把 4 和 3 加起來，可是兩個迴圈是套在一起、不是接著跑；4 只數了外圈的圈數；3 只數了內圈的一輪。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int n = 4;\n    int m = 3;\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < m; j++) {\n            count += 1;\n        }\n    }\n    printf("%d\\n", count);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int n = 4;\n    int m = 3;\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < m; j++) {\n            count += 1;\n        }\n    }\n    std::cout << count << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int n = 4;\n        int m = 3;\n        int count = 0;\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < m; j++) {\n                count += 1;\n            }\n        }\n        System.out.println(count);\n    }\n}\n',
          python: 'n = 4\nm = 3\ncount = 0\nfor i in range(n):\n    for j in range(m):\n        count += 1\nprint(count)\n',
        },
        output: '12',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'arrays', page);
})(typeof window !== 'undefined' ? window : globalThis);
