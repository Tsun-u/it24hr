// classroom/programming/expressions.js — APCS 程式設計「運算式」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '鮮奶茶 50 元，紅茶 30 元。買兩杯鮮奶茶和一杯紅茶，在程式裡面怎麼表達？',
    // 複習：用前面學過的變數硬做，需求一變大就按計算機按到手痠；quote 是講義自己說的那句，也就是運算式的核心想法
    review: [
      '我們前面學了變數，最直覺的做法就是先拿計算機算好 130，再寫 total = 130。隔天鮮奶茶漲到 55 元，你又得重算一次、改一次；老闆接著說：「今天還有 20 張訂單喔！」你按計算機按到手痠。其實，計算機背後也是程式，因此我們可以把價錢和杯數寫進程式：',
      { quote: '把算式告訴它，再讓程式自己算，這就是運算式。' },
    ],
    summary: '兩杯鮮奶茶和一杯紅茶寫成 2 * 50 + 30：乘號是 *，程式跟我們一樣先乘後加，算出 130。下次想讓程式幫你算錢、算時間，你就知道：照數學把算式寫下來，順序拿不準就加括號。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      '三元運算子 ? :：寫成 條件 ? a : b，條件成立拿 a、不成立拿 b，一行就能依條件挑一個值，例如 max = a > b ? a : b。C、C++、Java 都有；Python 沒有 ? :，寫成 a if a > b else b。',
      '整數除法碰到負數，各語言不一樣：C、C++、Java 往零的方向捨去，-7 / 2 是 -3、-7 % 2 是 -1；Python 往下取整，-7 // 2 是 -4、-7 % 2 是 1。考試的題目多半避開負數，自己寫程式時要留意。',
    ],
    uses: [
      '結帳：三樣東西的價錢加起來、付 500 元找多少，paid - total 一行就算好。',
      '時間換算：100 秒是幾分幾秒？100 / 60 是 1 分、100 % 60 是 40 秒；倒數計時、影片長度都是這樣算。',
      '判斷：血量歸零了沒（hp <= 0）、這個數是不是偶數（x % 2 == 0）、生日到了沒（month == 5 && day == 20），遊戲和程式的每個決定都先算一個真假。',
      '電腦內部：一個顏色 0xFF8800 是紅、綠、藍三個數字擠在同一個整數裡，用 >> 16 和 & 255 把紅色拆出來；檔案的讀、寫、執行權限也是用位元一格一格記的。',
    ],
    concept: [
      '運算式（expression）是算得出一個值的式子，像 2 * 50 + 30；裡面的 +、* 叫運算子（operator），2、50、30 叫運算元（operand）。算術運算子有加 +、減 -、乘 *、除 /、取餘數 %。乘號寫成 *，不是 ×，也不能省略：兩杯鮮奶茶是 2 * milk。',
      '哪個先算有規矩，叫優先順序（precedence）：括號最先，再來乘、除、取餘數，最後加、減；同一級的從左到右。所以 2 * 50 + 30 先算 2 * 50 得到 100，再加 30 得到 130，跟我們在紙上算的一樣。想要先加後乘，就加括號：(2 + 1) * 50。順序拿不準的時候，多加一對括號不會錯。',
      '比較運算子（comparison operator）<、<=、>、>=、==、!= 算出來的不是數字，是真或假（布林值）：total >= 100 在 total 是 130 時是真，就能拿來決定「滿百送貼紙」要不要送。相等要寫兩個等號 ==；一個等號 = 是指定，把右邊的值放進左邊的變數，這兩個很容易打錯。',
      '邏輯運算子（logical operator）把幾個真假合起來：&& 是「而且」（兩邊都真才真）、|| 是「或者」（有一邊真就真）、! 是「不是」；Python 寫成 and、or、not。它們會短路求值（short-circuit）：&& 的左邊已經是假，結果一定是假，右邊就不算了；|| 的左邊是真，右邊也不算。cups > 0 && total / cups < 60 在 cups 是 0 時，右邊的除法不會跑，就不會除以零。',
      '位元運算（bitwise operation）把整數當成一排 0 和 1 來算，一格對一格：6 是 110、3 是 011，& 兩格都是 1 才是 1（6 & 3 是 010，也就是 2）、| 有一格是 1 就是 1（6 | 3 是 111，7）、^ 兩格不同才是 1（6 ^ 3 是 101，5）；<< 把整排往左推（1 << 3 是 1000，8，等於乘 2 三次），>> 往右推（8 >> 1 是 4）。',
      '指定運算子（assignment operator）= 把值放進變數；+=、-=、*=、/=、%= 是「先算再放回去」的縮寫：total += tea 就是 total = total + tea，把紅茶的錢加進總價。C、C++、Java 的 i++ 是 i += 1 的再縮寫。',
    ],
    traps: [
      { wrong: '計算機按 1 + 2 × 3 會得到 9，所以程式也是 9', right: '簡易計算機是按一個算一個：1 + 2 先變成 3，再乘 3 得到 9。程式照數學的優先順序先乘後加，1 + 2 * 3 是 7；要先加再乘得寫 (1 + 2) * 3。' },
      { wrong: '^ 是次方，2 ^ 3 是 8', right: '^ 是位元運算的 XOR（互斥或）：2 是 010、3 是 011，不同的位元才是 1，2 ^ 3 是 001，也就是 1。次方 Python 寫 2 ** 3；C、C++ 用 pow(2, 3)（要 #include <math.h> 或 <cmath>）、Java 用 Math.pow(2, 3)，算出來是浮點數 8.0。' },
      { wrong: '= 和 == 一樣，都是等於', right: '= 是指定，把右邊的值放進左邊的變數；== 才是比較兩邊相不相等。C、C++ 裡 if (x = 5) 不會報錯：它把 5 放進 x，再把 5 當成真，條件永遠成立；Java 和 Python 會直接報錯，不讓你跑。' },
      { wrong: 'a / b * c 和 a / (b * c) 一樣', right: '乘和除同一級、從左到右算：a / b * c 是先算 a / b，再乘 c。12 / 3 * 2 是 8，12 / (3 * 2) 是 2。' },
      { wrong: 'x && y 兩邊一定都會算', right: '短路求值：&& 的左邊是假，結果一定是假，右邊就不算了；|| 的左邊是真，右邊也不算。所以 cups > 0 && total / cups < 60 在 cups 是 0 時不會除以零。Python 的 and、or 也一樣。' },
      { wrong: 'Python 的 not a == b 是 (not a) == b', right: 'Python 的 not 比 == 低，not a == b 是 not (a == b)，也就是 a != b。C、C++、Java 剛好相反：! 比 == 高，!a == b 是 (!a) == b，要寫 !(a == b) 或 a != b。' },
      { wrong: '5 > 3 印出來每種語言都是 1', right: 'C、C++ 把真當成 1、假當成 0，印出 1；Python 印 True；Java 的 boolean 不能當數字用，要印 1 得寫 5 > 3 ? 1 : 0（實作裡就是這樣寫），Python 也可以用 int(5 > 3) 轉成 1。' },
    ],
    // 程式追蹤器：接開場的飲料錢，同一段程式的四種語言，{{c}} 換成挑的杯數；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: 'cups = 2', values: { c: 2 } }, { label: 'cups = 3', values: { c: 3 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int milk = 50;
    int tea = 30;
    int cups = {{c}};
    int total = cups * milk + tea;
    printf("%d\\n", total);
    return 0;
}
`,
        cpp: `#include <iostream>

int main() {
    int milk = 50;
    int tea = 30;
    int cups = {{c}};
    int total = cups * milk + tea;
    std::cout << total << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int milk = 50;
        int tea = 30;
        int cups = {{c}};
        int total = cups * milk + tea;
        System.out.println(total);
    }
}
`,
        python: `milk = 50
tea = 30
cups = {{c}}
total = cups * milk + tea
print(total)
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8 },
        cpp: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "cups = 2": [
        {"line":1,"vars":{"milk":50},"out":""},
        {"line":2,"vars":{"milk":50,"tea":30},"out":""},
        {"line":3,"vars":{"milk":50,"tea":30,"cups":2},"out":""},
        {"line":4,"vars":{"milk":50,"tea":30,"cups":2,"total":130},"out":""},
        {"line":5,"vars":{"milk":50,"tea":30,"cups":2,"total":130},"out":"130\n"},
      ],
      "cups = 3": [
        {"line":1,"vars":{"milk":50},"out":""},
        {"line":2,"vars":{"milk":50,"tea":30},"out":""},
        {"line":3,"vars":{"milk":50,"tea":30,"cups":3},"out":""},
        {"line":4,"vars":{"milk":50,"tea":30,"cups":3,"total":180},"out":""},
        {"line":5,"vars":{"milk":50,"tea":30,"cups":3,"total":180},"out":"180\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：2 × 50 + 30 畫成一棵小樹。葉子是數字，上面的節點是運算子；先算下面的乘法得到 100，再往上加 30 得到 130
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const s = svgEl(320, 290), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9, seed: 7 };
      const label = (x, y, text, size = 15, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const node = (x, y, text, fill, size = 18) => { s.append(rc.circle(x, y, 44, { ...line, fill, fillStyle: 'solid' })); label(x, y, text, size); };
      const edge = (x1, y1, x2, y2) => s.append(rc.line(x1, y1, x2, y2, line));
      label(160, 18, '2 * 50 + 30', 16);
      // 樹枝先畫，節點蓋在上面
      edge(160, 70, 95, 140); edge(160, 70, 225, 140);
      edge(95, 140, 50, 210); edge(95, 140, 140, 210);
      node(160, 70, '+', '#fff');
      node(95, 140, '×', NEW);
      node(225, 140, '30', FILL);
      node(50, 210, '2', FILL);
      node(140, 210, '50', FILL);
      // 說明放樹的下面，置中：12px 的字不會超出 320 寬，也不會壓到樹枝
      label(160, 250, '① 先算下面：2 × 50 = 100', 12, true);
      label(160, 272, '② 再往上加：100 + 30 = 130', 12, true);
      return s;
    },
    code: {
      c: `#include <stdio.h>

int main(void) {
    int a = 1 + 2 * 3;           // 先乘後加：7
    int b = (1 + 2) * 3;         // 括號最先：9
    int r = 7 % 3;               // 7 除以 3 的餘數：1
    int gt = 5 > 3;              // 比較的結果：C 用 1 表示真、0 表示假
    int bits_and = 6 & 3;        // 位元運算：110 和 011 一格對一格
    int bits_or = 6 | 3;
    int bits_xor = 6 ^ 3;
    int shift = 1 << 3;          // 0001 往左推三格變 1000
    printf("%d %d %d %d %d %d %d %d\\n", a, b, r, gt, bits_and, bits_or, bits_xor, shift);
    return 0;
}
`,
      cpp: `#include <iostream>

int main() {
    int a = 1 + 2 * 3;           // 先乘後加：7
    int b = (1 + 2) * 3;         // 括號最先：9
    int r = 7 % 3;               // 7 除以 3 的餘數：1
    int gt = 5 > 3;              // 比較的結果：bool 放進 int，真是 1、假是 0
    int bits_and = 6 & 3;        // 位元運算：110 和 011 一格對一格
    int bits_or = 6 | 3;
    int bits_xor = 6 ^ 3;
    int shift = 1 << 3;          // 0001 往左推三格變 1000
    std::cout << a << " " << b << " " << r << " " << gt << " "
              << bits_and << " " << bits_or << " " << bits_xor << " " << shift << "\\n";
    return 0;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int a = 1 + 2 * 3;           // 先乘後加：7
        int b = (1 + 2) * 3;         // 括號最先：9
        int r = 7 % 3;               // 7 除以 3 的餘數：1
        int gt = 5 > 3 ? 1 : 0;      // 比較的結果是 boolean，不能直接當數字，用 ? : 換成 1／0
        int bitsAnd = 6 & 3;         // 位元運算：110 和 011 一格對一格
        int bitsOr = 6 | 3;
        int bitsXor = 6 ^ 3;
        int shift = 1 << 3;          // 0001 往左推三格變 1000
        System.out.println(a + " " + b + " " + r + " " + gt + " " + bitsAnd + " " + bitsOr + " " + bitsXor + " " + shift);
    }
}
`,
      python: `a = 1 + 2 * 3           # 先乘後加：7
b = (1 + 2) * 3         # 括號最先：9
r = 7 % 3               # 7 除以 3 的餘數：1
gt = int(5 > 3)         # 比較的結果是 True，int() 換成 1
bits_and = 6 & 3        # 位元運算：110 和 011 一格對一格
bits_or = 6 | 3
bits_xor = 6 ^ 3
shift = 1 << 3          # 0001 往左推三格變 1000
print(a, b, r, gt, bits_and, bits_or, bits_xor, shift)
`,
      output: '7 9 1 1 2 7 5 8',
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '下面這段程式印出什麼？',
        code: {
          c: `printf("%d\\n", 2 + 3 * 4 - 6 / 2);`,
          cpp: `std::cout << 2 + 3 * 4 - 6 / 2 << "\\n";`,
          java: `System.out.println(2 + 3 * 4 - 6 / 2);`,
          python: `print(2 + 3 * 4 - 6 // 2)`,
        },
        options: ['17', '7', '11', '5'],
        answer: 2,
        why: '先算乘除：3 * 4 是 12、6 / 2 是 3（C、C++、Java 兩個整數相除是整數；Python 要寫 // 才是整數 3，寫 / 會印 11.0），再從左到右加減：2 + 12 - 3 = 11。不管優先順序、從左一路算到右會得到 7；把減號看成加號會得到 17；先算 3 * 4 - 6 再除以 2 會得到 5。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    printf("%d\\n", 2 + 3 * 4 - 6 / 2);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    std::cout << 2 + 3 * 4 - 6 / 2 << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println(2 + 3 * 4 - 6 / 2);\n    }\n}\n',
          python: 'print(2 + 3 * 4 - 6 // 2)\n',
        },
        output: '11',
      },
      {
        kind: '解析計算邏輯',
        prompt: '下面的條件在判斷 x 是什麼？',
        code: {
          c: `if (x % 2 == 0) {
    printf("yes\\n");
} else {
    printf("no\\n");
}`,
          cpp: `if (x % 2 == 0) {
    std::cout << "yes\\n";
} else {
    std::cout << "no\\n";
}`,
          java: `if (x % 2 == 0) {
    System.out.println("yes");
} else {
    System.out.println("no");
}`,
          python: `if x % 2 == 0:
    print("yes")
else:
    print("no")`,
        },
        options: ['x 等於 2', 'x 是奇數', 'x 等於 0', 'x 是偶數'],
        answer: 3,
        why: 'x % 2 是 x 除以 2 的餘數，餘數是 0 代表 x 能被 2 整除，就是偶數：x 是 10 時印 yes，x 是 7 時餘數是 1、印 no。奇數要寫 x % 2 == 1 或 x % 2 != 0；0 和 2 只是偶數裡的其中兩個，x 是 10 時也會印 yes。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int x = 10;\n    if (x % 2 == 0) {\n        printf("yes\\n");\n    } else {\n        printf("no\\n");\n    }\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int x = 10;\n    if (x % 2 == 0) {\n        std::cout << "yes\\n";\n    } else {\n        std::cout << "no\\n";\n    }\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int x = 10;\n        if (x % 2 == 0) {\n            System.out.println("yes");\n        } else {\n            System.out.println("no");\n        }\n    }\n}\n',
          python: 'x = 10\nif x % 2 == 0:\n    print("yes")\nelse:\n    print("no")\n',
        },
        output: 'yes',
      },
      {
        kind: '程式測試與除錯',
        prompt: '想算 80 分和 90 分的平均，結果印出 125。要怎麼改？',
        code: {
          c: `int a = 80;
int b = 90;
int avg = a + b / 2;
printf("%d\\n", avg);`,
          cpp: `int a = 80;
int b = 90;
int avg = a + b / 2;
std::cout << avg << "\\n";`,
          java: `int a = 80;
int b = 90;
int avg = a + b / 2;
System.out.println(avg);`,
          python: `a = 80
b = 90
avg = a + b // 2
print(avg)`,
        },
        options: ['把 a + b / 2 改成 a + (b / 2)', '把 a + b / 2 改成 (a + b) / 2', '把 / 2 改成 * 2', '把 a + b / 2 改成 b + a / 2'],
        answer: 1,
        why: '除法比加法先算，a + b / 2 是 80 + 45 = 125；加括號讓加法先算，(80 + 90) / 2 才是 85。a + (b / 2) 只是把原本的順序寫明白，還是 125；改成乘 2 會得到 260；對調變成 90 + 40 = 130。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int a = 80;\n    int b = 90;\n    int avg = a + b / 2;\n    printf("%d\\n", avg);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int a = 80;\n    int b = 90;\n    int avg = a + b / 2;\n    std::cout << avg << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int a = 80;\n        int b = 90;\n        int avg = a + b / 2;\n        System.out.println(avg);\n    }\n}\n',
          python: 'a = 80\nb = 90\navg = a + b // 2\nprint(avg)\n',
        },
        output: '125',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'expressions', page);
})(typeof window !== 'undefined' ? window : globalThis);
