// classroom/programming/recursion.js — APCS 程式設計「遞迴」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '你是班長，晚上接到老師的電話：「由於電腦教室設備臨時故障，維修需要時間，明天資訊課和後天的歷史課對調，請通知同學帶對課本。」怎麼做？',
    // 複習：用前面學過的迴圈硬做，自己打 30 通太累，這頁的概念上場；quote 是班長想到的那個辦法，也就是遞迴的核心想法
    review: [
      '我們前面學了迴圈，最直覺的做法是照座號打 30 通電話。可是你不想打 30 通，所以你決定：',
      { quote: '打給座號 1 號的同學，請他往下通知下一個號碼的人。' },
      '1 號打給 2 號、2 號打給 3 號……每個人做的事一模一樣：接到電話，再打給下一個；30 號後面沒有人，就停。把工作做自己的那一份、剩下的交給下一個，這種寫法叫遞迴。',
    ],
    summary: 'notify(k) 做兩件事：通知 k 號，再 notify(k + 1)；k 是最後一號時不再往下打。下次碰到一件事可以拆成「做自己這份，剩下的交給下一個」，你就知道：這就是遞迴，記得寫停下來的條件。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      '記住算過的答案（記憶化，memoization）：開一個陣列 memo，算出 fib(k) 就記在 memo[k]，下次要用先查表，查得到就直接拿。每個 fib(k) 只真的算一次，fib(30) 從呼叫兩百多萬次變成 30 次左右，O(n)。',
      'Python 預設最多疊大約 1000 層，超過就報 RecursionError。可以用 import sys 再寫 sys.setrecursionlimit(10000) 調高上限，可是層數太深，底下的程式還是會把堆疊用完、整個當掉；遞迴要疊很深的時候，改寫成迴圈比較穩。',
    ],
    uses: [
      '排隊時想知道自己是第幾個：問前面的人「你是第幾個？」，他再往前問，問到第一個人說「我是第 1 個」，答案一路傳回來，每個人加 1 就知道了。',
      '算一個資料夾有多大：裡面的檔案加起來，再加上每個子資料夾的大小，子資料夾也用同一個方法算，算到沒有子資料夾為止。',
      { text: '家族樹、公司的組織圖、網站的選單：一個節點底下接著幾棵小一點的樹，走訪整棵樹就是「看自己，再對每棵小樹做同一件事」。', see: 'ds/tree' },
      { text: '電腦內部：合併排序、快速排序把陣列切成兩半各自排好；APCS 實作題常見的走迷宮、DFS，都是寫成遞迴。', see: 'ds/sorting' },
    ],
    concept: [
      '遞迴（recursion）是函式呼叫自己。班長的辦法寫成函式 notify(k, n)：通知 k 號同學，再呼叫 notify(k + 1, n)，請他去通知剩下的人。每一號做的事一模一樣，所以一個函式就寫完了，不用寫 30 次。',
      '一個遞迴有兩個部分。終止條件（base case）：問題已經小到可以直接回答，不用再呼叫自己，像 k 是最後一號 n，就不再往下打。遞迴的那一步（recursive case）：把問題縮小一點，再呼叫自己，像從「通知 k 號以後的人」變成「通知 k + 1 號以後的人」。少了終止條件，或每次呼叫沒有往終止條件靠近，就停不下來。',
      '每呼叫一次就是新的一層，參數各自一份：notify(1, 3) 呼叫 notify(2, 3) 的時候，自己那一層的 k 還是 1，在旁邊等它回來。最後一層最先回傳，交回上一層，上一層把那一行做完再往回交，一路回到第一層。',
      { text: '後呼叫的先回來，就是後進先出，所以電腦用一個堆疊記每一層，叫呼叫堆疊（call stack）。資料結構的堆疊頁也會再講到它。', see: 'ds/stack' },
      '費氏數列 fib(n) = fib(n − 1) + fib(n − 2) 照定義寫成遞迴很漂亮，可是 fib(n − 1) 裡面又會再算一次 fib(n − 2)，同樣的東西被重複算了很多次。下面「跑幾步」數給你看。',
    ],
    traps: [
      { wrong: '每一層遞迴共用同一個 k', right: '每呼叫一次，參數就重新開一份：notify(1, 3) 那層的 k 是 1，它呼叫的 notify(2, 3) 那層 k 是 2，改其中一層不會動到別層。追蹤器的呼叫堆疊上，一層一個 k。' },
      { wrong: '沒寫終止條件，遞迴也會自己停', right: '它會一直呼叫自己，直到呼叫堆疊塞滿：C、C++ 通常整個當掉（stack overflow），Java 丟 StackOverflowError，Python 預設大約 1000 層就報 RecursionError。' },
      { wrong: '有終止條件就一定會停', right: '每次呼叫都要讓問題變小，往終止條件靠近。把 notify(k + 1, n) 寫成 notify(k, n)，k 永遠到不了 n；階乘的終止條件是 n == 1，呼叫 fact(0) 會一路減成負數、碰不到 1，一樣停不下來。' },
      { wrong: 'return 會直接回到主程式', right: 'return 只回到呼叫它的上一層。notify(3, 3) 回傳 1 給 notify(2, 3)，它加 1 變 2 再交給 notify(1, 3)，再加 1 變 3，才回到主程式（追蹤器挑 n = 3 看看）。' },
      { wrong: '遞迴一定比迴圈好', right: '遞迴常常寫得比較短、比較貼近定義，可是每一層都要記在呼叫堆疊上。費氏數列照定義寫，fib(30) 要呼叫 2692537 次；用迴圈從 fib(0)、fib(1) 往後算，30 圈就到了。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{n}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: 'n = 3', values: { n: 3 } }, { label: 'n = 1', values: { n: 1 } }],
      code: {
        c: `#include <stdio.h>

int notify(int k, int n) {
    printf("%d\\n", k);
    if (k == n) {
        return 1;
    }
    return notify(k + 1, n) + 1;
}

int main(void) {
    int count = notify(1, {{n}});
    printf("%d\\n", count);
    return 0;
}
`,
        cpp: `#include <iostream>

int notify(int k, int n) {
    std::cout << k << "\\n";
    if (k == n) {
        return 1;
    }
    return notify(k + 1, n) + 1;
}

int main() {
    int count = notify(1, {{n}});
    std::cout << count << "\\n";
    return 0;
}
`,
        java: `public class Main {
    static int notify(int k, int n) {
        System.out.println(k);
        if (k == n) {
            return 1;
        }
        return notify(k + 1, n) + 1;
    }

    public static void main(String[] args) {
        int count = notify(1, {{n}});
        System.out.println(count);
    }
}
`,
        python: `def notify(k, n):
    print(k)
    if k == n:
        return 1
    return notify(k + 1, n) + 1

count = notify(1, {{n}})
print(count)
`,
      },
      lines: {
        c: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 8, 7: 12, 8: 13 },
        cpp: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 8, 7: 12, 8: 13 },
        java: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 7, 7: 11, 8: 12 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "n = 3": [
        {"line":1,"vars":{},"out":"","def":"notify"},
        {"line":7,"vars":{"k":1,"n":3},"out":"","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}}],"call":"notify"},
        {"line":2,"vars":{"k":1,"n":3},"out":"1\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}}]},
        {"line":3,"vars":{"k":1,"n":3},"out":"1\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}}],"cond":false},
        {"line":5,"vars":{"k":2,"n":3},"out":"1\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}},{"fn":"notify","vars":{"k":2,"n":3}}],"call":"notify"},
        {"line":2,"vars":{"k":2,"n":3},"out":"1\n2\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}},{"fn":"notify","vars":{"k":2,"n":3}}]},
        {"line":3,"vars":{"k":2,"n":3},"out":"1\n2\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}},{"fn":"notify","vars":{"k":2,"n":3}}],"cond":false},
        {"line":5,"vars":{"k":3,"n":3},"out":"1\n2\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}},{"fn":"notify","vars":{"k":2,"n":3}},{"fn":"notify","vars":{"k":3,"n":3}}],"call":"notify"},
        {"line":2,"vars":{"k":3,"n":3},"out":"1\n2\n3\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}},{"fn":"notify","vars":{"k":2,"n":3}},{"fn":"notify","vars":{"k":3,"n":3}}]},
        {"line":3,"vars":{"k":3,"n":3},"out":"1\n2\n3\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}},{"fn":"notify","vars":{"k":2,"n":3}},{"fn":"notify","vars":{"k":3,"n":3}}],"cond":true},
        {"line":4,"vars":{"k":3,"n":3},"out":"1\n2\n3\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}},{"fn":"notify","vars":{"k":2,"n":3}},{"fn":"notify","vars":{"k":3,"n":3}}],"ret":1},
        {"line":5,"vars":{"k":2,"n":3},"out":"1\n2\n3\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}},{"fn":"notify","vars":{"k":2,"n":3}}],"ret":2},
        {"line":5,"vars":{"k":1,"n":3},"out":"1\n2\n3\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":3}}],"ret":3},
        {"line":7,"vars":{"count":3},"out":"1\n2\n3\n"},
        {"line":8,"vars":{"count":3},"out":"1\n2\n3\n3\n"},
      ],
      "n = 1": [
        {"line":1,"vars":{},"out":"","def":"notify"},
        {"line":7,"vars":{"k":1,"n":1},"out":"","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":1}}],"call":"notify"},
        {"line":2,"vars":{"k":1,"n":1},"out":"1\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":1}}]},
        {"line":3,"vars":{"k":1,"n":1},"out":"1\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":1}}],"cond":true},
        {"line":4,"vars":{"k":1,"n":1},"out":"1\n","stack":[{"vars":{}},{"fn":"notify","vars":{"k":1,"n":1}}],"ret":1},
        {"line":7,"vars":{"count":1},"out":"1\n"},
        {"line":8,"vars":{"count":1},"out":"1\n1\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：開場的班級聯絡網。一排座號的小人，電話一個接一個往右傳，30 號後面沒有人了就停（中間用「…」省略）
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      // 六個位置各 52 寬：1、2、3、…、29、30，中心從 x = 30 排到 290，手機 320 寬放得下
      const seats = [1, 2, 3, null, 29, 30], STEP = 52, LEFT = 30, HEAD = 66;
      const s = svgEl(320, 176), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9 };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const arrow = (x1, x2, y, seed) => {
        s.append(rc.line(x1, y, x2, y, { ...line, seed }));
        s.append(rc.polygon([[x2, y], [x2 - 8, y - 4], [x2 - 8, y + 4]], { ...line, seed: seed + 1, fill: INK, fillStyle: 'solid' }));
      };
      label(160, 14, '每個人做的事都一樣：接到電話，打給下一號', 12, true);
      seats.forEach((no, i) => {
        const x = LEFT + i * STEP, last = no === 30;
        if (i > 0) arrow(x - STEP + 12, x - 12, 38, 40 + i * 2);
        if (no === null) { label(x, HEAD + 22, '…', 18); return; }
        s.append(rc.circle(x, HEAD, 18, { ...line, seed: 10 + i, fill: last ? NEW : FILL, fillStyle: 'solid' }));
        s.append(rc.line(x, HEAD + 9, x, HEAD + 34, { ...line, seed: 20 + i }));
        s.append(rc.line(x - 11, HEAD + 18, x + 11, HEAD + 18, { ...line, seed: 30 + i }));
        s.append(rc.line(x, HEAD + 34, x - 8, HEAD + 50, { ...line, seed: 50 + i }));
        s.append(rc.line(x, HEAD + 34, x + 8, HEAD + 50, { ...line, seed: 60 + i }));
        label(x, HEAD + 66, `${no} 號`, 13, !last);
      });
      label(250, 160, '沒有下一個了，停', 13);
      return s;
    },
    code: {
      c: `#include <stdio.h>

int fact(int n) {
    if (n == 1) {                       // 終止條件：1! 就是 1
        return 1;
    }
    return n * fact(n - 1);             // 縮小一點：n! = n × (n - 1)!
}

int fib(int n) {
    if (n <= 1) {                       // 終止條件：fib(0) = 0、fib(1) = 1
        return n;
    }
    return fib(n - 1) + fib(n - 2);     // 照定義寫：前兩項相加
}

int gcd(int a, int b) {
    if (b == 0) {                       // 終止條件：除得盡了，a 就是最大公因數
        return a;
    }
    return gcd(b, a % b);               // 輾轉相除：換成 b 和 a 除以 b 的餘數
}

int main(void) {
    printf("%d %d %d\\n", fact(5), fib(10), gcd(48, 18));
    return 0;
}
`,
      cpp: `#include <iostream>

int fact(int n) {
    if (n == 1) {                       // 終止條件：1! 就是 1
        return 1;
    }
    return n * fact(n - 1);             // 縮小一點：n! = n × (n - 1)!
}

int fib(int n) {
    if (n <= 1) {                       // 終止條件：fib(0) = 0、fib(1) = 1
        return n;
    }
    return fib(n - 1) + fib(n - 2);     // 照定義寫：前兩項相加
}

int gcd(int a, int b) {
    if (b == 0) {                       // 終止條件：除得盡了，a 就是最大公因數
        return a;
    }
    return gcd(b, a % b);               // 輾轉相除：換成 b 和 a 除以 b 的餘數
}

int main() {
    std::cout << fact(5) << " " << fib(10) << " " << gcd(48, 18) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    static int fact(int n) {
        if (n == 1) {                   // 終止條件：1! 就是 1
            return 1;
        }
        return n * fact(n - 1);         // 縮小一點：n! = n × (n - 1)!
    }

    static int fib(int n) {
        if (n <= 1) {                   // 終止條件：fib(0) = 0、fib(1) = 1
            return n;
        }
        return fib(n - 1) + fib(n - 2); // 照定義寫：前兩項相加
    }

    static int gcd(int a, int b) {
        if (b == 0) {                   // 終止條件：除得盡了，a 就是最大公因數
            return a;
        }
        return gcd(b, a % b);           // 輾轉相除：換成 b 和 a 除以 b 的餘數
    }

    public static void main(String[] args) {
        System.out.println(fact(5) + " " + fib(10) + " " + gcd(48, 18));
    }
}
`,
      python: `def fact(n):
    if n == 1:                          # 終止條件：1! 就是 1
        return 1
    return n * fact(n - 1)              # 縮小一點：n! = n × (n - 1)!


def fib(n):
    if n <= 1:                          # 終止條件：fib(0) = 0、fib(1) = 1
        return n
    return fib(n - 1) + fib(n - 2)      # 照定義寫：前兩項相加


def gcd(a, b):
    if b == 0:                          # 終止條件：除得盡了，a 就是最大公因數
        return a
    return gcd(b, a % b)                # 輾轉相除：換成 b 和 a 除以 b 的餘數


print(fact(5), fib(10), gcd(48, 18))
`,
      output: '120 55 6',
    },
    // 跑幾步：遞迴要數的是函式總共被呼叫幾次
    cost: {
      rows: [
        ['追蹤器的 notify(1, n)：每一號呼叫一次（n = 3 時呼叫 3 次）', 'n 次，O(n)'],
        ['實作的 fact(n)：n、n − 1、…、1 各一層', 'n 次，O(n)'],
        ['照定義寫的 fib(n)：每一層又呼叫兩次（fib(5) 呼叫 15 次、fib(10) 呼叫 177 次）', 'n 每加 1，次數大約變 1.6 倍，O(2ⁿ)'],
      ],
      note: { text: '遞迴跑幾步，數的是函式一共被呼叫幾次、每次呼叫做多少事。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
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
    return n + f(n - 1);
}

printf("%d\\n", f(4));`,
          cpp: `int f(int n) {
    if (n == 0) {
        return 0;
    }
    return n + f(n - 1);
}

std::cout << f(4) << "\\n";`,
          java: `static int f(int n) {
    if (n == 0) {
        return 0;
    }
    return n + f(n - 1);
}

System.out.println(f(4));`,
          python: `def f(n):
    if n == 0:
        return 0
    return n + f(n - 1)

print(f(4))`,
        },
        options: ['24', '0', '10', '4'],
        answer: 2,
        why: 'f(4) = 4 + f(3)，f(3) = 3 + f(2)……一路到 f(0) 回傳 0，再一層一層加回來：0、1、3、6、10，所以是 10。24 是 4 × 3 × 2 × 1，把加號看成乘號了；0 是以為最後一層回傳的 0 會直接回到主程式，可是它只交回上一層；4 是只算了第一層，沒等 f(3) 回來。',
        program: {
          c: '#include <stdio.h>\nint f(int n) {\n    if (n == 0) {\n        return 0;\n    }\n    return n + f(n - 1);\n}\nint main(void) {\n    printf("%d\\n", f(4));\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint f(int n) {\n    if (n == 0) {\n        return 0;\n    }\n    return n + f(n - 1);\n}\nint main() {\n    std::cout << f(4) << "\\n";\n}\n',
          java: 'public class Main {\n    static int f(int n) {\n        if (n == 0) {\n            return 0;\n        }\n        return n + f(n - 1);\n    }\n    public static void main(String[] args) {\n        System.out.println(f(4));\n    }\n}\n',
          python: 'def f(n):\n    if n == 0:\n        return 0\n    return n + f(n - 1)\n\nprint(f(4))\n',
        },
        output: '10',
      },
      {
        kind: '程式測試與除錯',
        prompt: '想算 5!（5 × 4 × 3 × 2 × 1 = 120），結果印出 0。要怎麼改？',
        code: {
          c: `int fact(int n) {
    if (n == 1) {
        return 0;
    }
    return n * fact(n - 1);
}

printf("%d\\n", fact(5));`,
          cpp: `int fact(int n) {
    if (n == 1) {
        return 0;
    }
    return n * fact(n - 1);
}

std::cout << fact(5) << "\\n";`,
          java: `static int fact(int n) {
    if (n == 1) {
        return 0;
    }
    return n * fact(n - 1);
}

System.out.println(fact(5));`,
          python: `def fact(n):
    if n == 1:
        return 0
    return n * fact(n - 1)

print(fact(5))`,
        },
        options: ['把 n == 1 改成 n == 0', '把 fact(n - 1) 改成 fact(n)', '把 n * fact(n - 1) 改成 n + fact(n - 1)', '把 return 0 改成 return 1'],
        answer: 3,
        why: '最後一層 fact(1) 回傳 0，上面每一層都拿它來乘，乘到最後還是 0；1! 是 1，終止條件回傳 1 才對，改完印出 120。終止條件改成 n == 0，最後一層一樣回傳 0，還是印 0；改成 fact(n)，n 永遠不會變小、碰不到終止條件，一直呼叫到堆疊塞滿；乘號改成加號會印出 5 + 4 + 3 + 2 + 0 = 14。',
        program: {
          c: '#include <stdio.h>\nint fact(int n) {\n    if (n == 1) {\n        return 0;\n    }\n    return n * fact(n - 1);\n}\nint main(void) {\n    printf("%d\\n", fact(5));\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint fact(int n) {\n    if (n == 1) {\n        return 0;\n    }\n    return n * fact(n - 1);\n}\nint main() {\n    std::cout << fact(5) << "\\n";\n}\n',
          java: 'public class Main {\n    static int fact(int n) {\n        if (n == 1) {\n            return 0;\n        }\n        return n * fact(n - 1);\n    }\n    public static void main(String[] args) {\n        System.out.println(fact(5));\n    }\n}\n',
          python: 'def fact(n):\n    if n == 1:\n        return 0\n    return n * fact(n - 1)\n\nprint(fact(5))\n',
        },
        output: '0',
      },
      {
        kind: '程式效能分析',
        prompt: '用 calls 數 fib 被呼叫了幾次。下面這段程式跑完 fib(5)，印出的 calls 是多少？',
        code: {
          c: `int calls = 0;

int fib(int n) {
    calls += 1;
    if (n <= 1) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

fib(5);
printf("%d\\n", calls);`,
          cpp: `int calls = 0;

int fib(int n) {
    calls += 1;
    if (n <= 1) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

fib(5);
std::cout << calls << "\\n";`,
          java: `static int calls = 0;

static int fib(int n) {
    calls += 1;
    if (n <= 1) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

fib(5);
System.out.println(calls);`,
          python: `calls = 0

def fib(n):
    global calls
    calls += 1
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)

fib(5)
print(calls)`,
        },
        options: ['15', '5', '6', '32'],
        answer: 0,
        why: 'fib(5) 呼叫 fib(4) 和 fib(3)，fib(4) 裡面又呼叫一次 fib(3)……同樣的東西被重複算：fib(5)、fib(4) 各 1 次，fib(3) 2 次，fib(2) 3 次，fib(1) 5 次，fib(0) 3 次，加起來 15 次。5 是 fib(5) 算出來的值，不是呼叫次數；6 是以為 fib(0) 到 fib(5) 各算一次，記住算過的答案才會這麼少；32 是 2⁵，O(2ⁿ) 只是上限，實際的次數比它少。',
        program: {
          c: '#include <stdio.h>\nint calls = 0;\nint fib(int n) {\n    calls += 1;\n    if (n <= 1) {\n        return n;\n    }\n    return fib(n - 1) + fib(n - 2);\n}\nint main(void) {\n    fib(5);\n    printf("%d\\n", calls);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint calls = 0;\nint fib(int n) {\n    calls += 1;\n    if (n <= 1) {\n        return n;\n    }\n    return fib(n - 1) + fib(n - 2);\n}\nint main() {\n    fib(5);\n    std::cout << calls << "\\n";\n}\n',
          java: 'public class Main {\n    static int calls = 0;\n    static int fib(int n) {\n        calls += 1;\n        if (n <= 1) {\n            return n;\n        }\n        return fib(n - 1) + fib(n - 2);\n    }\n    public static void main(String[] args) {\n        fib(5);\n        System.out.println(calls);\n    }\n}\n',
          python: 'calls = 0\n\ndef fib(n):\n    global calls\n    calls += 1\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nfib(5)\nprint(calls)\n',
        },
        output: '15',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'recursion', page);
})(typeof window !== 'undefined' ? window : globalThis);
