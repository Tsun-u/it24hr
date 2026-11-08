// classroom/programming/variables.js — APCS 程式設計「變數與資料型態」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '我想要在賽事進行中用程式紀錄兩支隊伍最新的得分，怎麼做？',
    summary: '開兩個變數 home、away 記兩隊的分數，進球就寫 home = home + 2，新的分數蓋掉舊的。下次想讓程式記住會變的東西，你就知道：取個名字、開一個變數，最新的值一直都在那裡。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      'Python 的變數不用先宣告型態，但每個值都帶著自己的型態：type(3) 是 int、type(3.5) 是 float、type(\'A\') 是 str。想在型態之間換，用 int(\'12\')、float(3)、str(12) 這些函式。',
      'int 裝不下的數：C、C++ 用 long long（64 位元，最大約 9.2 × 10 的 18 次方，printf 用 %lld 印），Java 用 long。APCS 題目寫「答案可能超過 10 的 9 次方」，就是在提醒你 int 快不夠用了。',
    ],
    uses: [
      '計分板、遊戲裡的血量和金幣：每得一分、扣一滴血，就把新的數字放回同一個地方。',
      '購物車的總金額：每放一樣商品就加上去，結帳時格子裡的數字就是要付的錢。',
      'APCS 的每一題：題目給的 n、讀進來的每一筆資料、算到一半的總和，全部都住在變數裡；程式幾乎每一行都在讀變數或改變數。',
      '電腦內部：變數是記憶體裡的一小塊位置，型態決定它佔幾個 byte（int 4 個、double 8 個、char 1 個）；名字是給人看的，編譯器會把名字換成記憶體的位址。',
    ],
    concept: [
      '變數（variable）是一個有名字的格子，用來放會變的值。home = 0 是開一個叫 home 的格子、放進 0；這個 = 叫指定（assignment），意思是「把右邊的值放進左邊的格子」，不是數學的「兩邊相等」。名字自己取，規則是英文字母或底線開頭、後面可以接數字，不能用 int、if、for 這些程式語言自己用的保留字。',
      '進球之後寫 home = home + 2：先算右邊（舊的 home 加 2），再把結果放回左邊的 home，舊的分數就被新的蓋掉，跟翻牌計分板一樣，牌子上永遠只有最新的數字。away += 3 是 away = away + 3 的縮寫，四種語言都能用。',
      '每個格子都有資料型態（data type），決定能放什麼、佔多少空間：整數（int）放 0、−7、100 這種沒有小數點的數；浮點數（float／double）放 3.5、0.1；字元（char）放一個字，像 \'A\'；布林（bool）只有真、假兩種值。C、C++、Java 開格子時要先寫型態（int home = 0;），之後這個格子只能放這種值；Python 直接寫 home = 0，值自己帶著型態。',
      '兩個整數相除，C、C++、Java 的 / 會捨去小數：7 / 2 是 3，不是 3.5；% 是取餘數，7 % 2 是 1。想要 3.5，讓其中一邊是浮點數：7 / 2.0。Python 的 / 一定給浮點數 3.5，整數除法要寫 //。「商和餘數」這組在 APCS 很常見，像把 17 顆糖 5 個一袋裝起來：17 // 5 是裝了 3 袋，17 % 5 是剩下 2 顆。',
      '不會變的值叫常數（constant）：C、C++ 寫 const int MAX = 100;，Java 寫 final int MAX = 100;，之後想改它編譯器會擋。Python 沒有真正的常數，慣例是名字全大寫（MAX = 100）提醒自己別去改它。',
      'int 是 32 位元，最大只到 2147483647（約 21 億），再加 1 不會變成 21 億零 1，會繞回 −2147483648，這叫溢位（overflow）。Python 的整數沒有上限，不會溢位；C、C++、Java 算到很大的數要換更大的型態（課外補充）。',
    ],
    traps: [
      { wrong: '= 的意思是「等於」', right: '= 是指定：把右邊的值放進左邊的變數。想問兩邊相不相等要用 ==，運算式那頁會講。' },
      { wrong: 'x = x + 1 是一條沒有解的方程式', right: '先算右邊的 x + 1，再把結果放回 x。x 原本是 5，跑完這行就是 6；追蹤器裡的 home = home + points 就是這一招。' },
      { wrong: '7 / 2 是 3.5', right: 'C、C++、Java 兩個整數相除會捨去小數，7 / 2 是 3；想要 3.5 得讓一邊是浮點數，寫 7 / 2.0。Python 的 / 是 3.5，// 才是 3。程式識讀的 C 題本和 Python 題本在這裡會算出不一樣的答案。' },
      { wrong: 'int 存得下任何整數', right: 'int 最大是 2147483647（約 21 億），再加 1 會繞回 −2147483648，叫溢位。Python 的整數沒有上限；C、C++ 要存更大的數用 long long，Java 用 long。' },
      { wrong: '\'A\' 是字母，不能拿來算', right: '字元在電腦裡存的是數字（ASCII 編碼），\'A\' 是 65。C、C++、Java 直接 \'A\' + 1 得到 66，也就是 \'B\'；Python 要先用 ord(\'A\') 換成 65 再算，chr(66) 換回字母。字元與字串那頁會再講。' },
      { wrong: '0.1 + 0.2 == 0.3 一定成立', right: '浮點數用二進位存小數，0.1 和 0.2 都存不準，加起來是 0.30000000000000004，四種語言都一樣。比較兩個浮點數要看它們的差夠不夠小；整數沒有這個問題。' },
      { wrong: '變數名稱想怎麼取都行，2nd 也可以', right: '名稱要用英文字母或底線開頭，後面才能接數字：second2 可以、2nd 不行；也不能用 int、if 這些保留字。大小寫不同就是不同的變數，Home 和 home 是兩個格子。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{p}} 換成挑的那組輸入（主隊第一球的分數）；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: 'points = 2', values: { p: 2 } }, { label: 'points = 3', values: { p: 3 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int home = 0;
    int away = 0;
    int points = {{p}};
    home = home + points;
    away += 3;
    home = home + 3;
    printf("%d %d\\n", home, away);
    return 0;
}
`,
        cpp: `#include <iostream>

int main() {
    int home = 0;
    int away = 0;
    int points = {{p}};
    home = home + points;
    away += 3;
    home = home + 3;
    std::cout << home << " " << away << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int home = 0;
        int away = 0;
        int points = {{p}};
        home = home + points;
        away += 3;
        home = home + 3;
        System.out.println(home + " " + away);
    }
}
`,
        python: `home = 0
away = 0
points = {{p}}
home = home + points
away += 3
home = home + 3
print(home, away)
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10 },
        cpp: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "points = 2": [
        {"line":1,"vars":{"home":0},"out":""},
        {"line":2,"vars":{"home":0,"away":0},"out":""},
        {"line":3,"vars":{"home":0,"away":0,"points":2},"out":""},
        {"line":4,"vars":{"home":2,"away":0,"points":2},"out":""},
        {"line":5,"vars":{"home":2,"away":3,"points":2},"out":""},
        {"line":6,"vars":{"home":5,"away":3,"points":2},"out":""},
        {"line":7,"vars":{"home":5,"away":3,"points":2},"out":"5 3\n"},
      ],
      "points = 3": [
        {"line":1,"vars":{"home":0},"out":""},
        {"line":2,"vars":{"home":0,"away":0},"out":""},
        {"line":3,"vars":{"home":0,"away":0,"points":3},"out":""},
        {"line":4,"vars":{"home":3,"away":0,"points":3},"out":""},
        {"line":5,"vars":{"home":3,"away":3,"points":3},"out":""},
        {"line":6,"vars":{"home":6,"away":3,"points":3},"out":""},
        {"line":7,"vars":{"home":6,"away":3,"points":3},"out":"6 3\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：翻牌計分板。主隊、客隊各一塊牌子，上面淡的是翻掉的舊數字，牌子上只留最新的；下面寫對應的變數
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const s = svgEl(320, 236), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9, seed: 7 };
      const MUTED = '#57606a';
      const label = (x, y, text, size = 14, color = null) => { const t = svgText(s, x, y, text, size); if (color) t.setAttribute('fill', color); };
      // 一塊牌子：隊名、翻掉的舊數字（淡、歪一點）、往下的箭頭、牌子上最新的數字、底下的變數
      const board = (cx, team, oldValue, value, varName) => {
        label(cx, 14, team, 15);
        const ghost = rc.rectangle(cx - 22, 30, 44, 34, { ...line, stroke: MUTED, strokeWidth: 1.2, fill: '#fff', fillStyle: 'solid' });
        ghost.setAttribute('transform', `rotate(-8 ${cx} 47)`); s.append(ghost);
        label(cx, 47, String(oldValue), 20, MUTED);
        s.append(rc.line(cx, 68, cx, 92, line));
        s.append(rc.polygon([[cx, 96], [cx - 6, 86], [cx + 6, 86]], { ...line, fill: INK, fillStyle: 'solid' }));
        s.append(rc.rectangle(cx - 50, 100, 100, 84, { ...line, fill: FILL, fillStyle: 'solid' }));
        s.append(rc.rectangle(cx - 36, 112, 72, 60, { ...line, fill: NEW, fillStyle: 'solid' }));
        s.append(rc.line(cx - 36, 142, cx + 36, 142, { ...line, strokeWidth: 1 }));   // 翻牌板中間那條縫
        label(cx, 142, String(value), 34);
        label(cx, 204, `${varName} = ${value}`, 14, MUTED);
      };
      board(90, '主隊', 2, 5, 'home');
      board(230, '客隊', 0, 3, 'away');
      label(160, 228, '翻一下，新的數字蓋掉舊的', 12, MUTED);
      return s;
    },
    code: {
      c: `#include <stdio.h>

int main(void) {
    int a = 7;            // 整數：沒有小數點
    int b = 2;
    double half = 2.0;    // 浮點數：有小數點
    char letter = 'A';    // 字元：一個字，電腦存的是 ASCII 數字
    int code = letter;    // 把字元放進整數格子，拿到的就是那個數字

    printf("%d %d %.1f %d\\n", a / b, a % b, a / half, code);
    return 0;
}
`,
      cpp: `#include <iostream>

int main() {
    int a = 7;            // 整數：沒有小數點
    int b = 2;
    double half = 2.0;    // 浮點數：有小數點
    char letter = 'A';    // 字元：一個字，電腦存的是 ASCII 數字
    int code = letter;    // 把字元放進整數格子，拿到的就是那個數字

    std::cout << a / b << " " << a % b << " " << a / half << " " << code << "\\n";
    return 0;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int a = 7;            // 整數：沒有小數點
        int b = 2;
        double half = 2.0;    // 浮點數：有小數點
        char letter = 'A';    // 字元：一個字，電腦存的是 ASCII 數字
        int code = letter;    // 把字元放進整數格子，拿到的就是那個數字

        System.out.println(a / b + " " + a % b + " " + a / half + " " + code);
    }
}
`,
      python: `a = 7                 # 整數：沒有小數點
b = 2
half = 2.0            # 浮點數：有小數點
letter = 'A'          # 字元：Python 沒有 char，一個字就是長度 1 的字串
code = ord(letter)    # ord 把字元換成 ASCII 數字

print(a // b, a % b, a / half, code)    # // 是整數除法，/ 一定給浮點數
`,
      output: '3 1 3.5 65',
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '下面這段程式印出什麼？',
        code: {
          c: `int a = 5;
int b = a;
a = b + 2;
b = a;
printf("%d %d\\n", a, b);`,
          cpp: `int a = 5;
int b = a;
a = b + 2;
b = a;
std::cout << a << " " << b << "\\n";`,
          java: `int a = 5;
int b = a;
a = b + 2;
b = a;
System.out.println(a + " " + b);`,
          python: `a = 5
b = a
a = b + 2
b = a
print(a, b)`,
        },
        options: ['5 5', '7 7', '7 5', '5 7'],
        answer: 1,
        why: 'b = a 是把 a 現在的值 5 複製一份放進 b，之後 a 再怎麼改，b 不會跟著動；a = b + 2 把 7 放進 a；最後 b = a 又把 7 蓋掉 b 原本的 5，所以印出 7 7。選 5 5 是以為 a 不會變；7 5 是漏了最後一行把 b 蓋掉；5 7 是把 a 和 b 的位置看反了。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int a = 5;\n    int b = a;\n    a = b + 2;\n    b = a;\n    printf("%d %d\\n", a, b);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int a = 5;\n    int b = a;\n    a = b + 2;\n    b = a;\n    std::cout << a << " " << b << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int a = 5;\n        int b = a;\n        a = b + 2;\n        b = a;\n        System.out.println(a + " " + b);\n    }\n}\n',
          python: 'a = 5\nb = a\na = b + 2\nb = a\nprint(a, b)\n',
        },
        output: '7 7',
      },
      {
        kind: '解析計算邏輯',
        prompt: 'n 是 17。下面這段程式印出的兩個數字，分別是什麼？',
        code: {
          c: `int q = n / 5;
int r = n % 5;
printf("%d %d\\n", q, r);`,
          cpp: `int q = n / 5;
int r = n % 5;
std::cout << q << " " << r << "\\n";`,
          java: `int q = n / 5;
int r = n % 5;
System.out.println(q + " " + r);`,
          python: `q = n // 5
r = n % 5
print(q, r)`,
        },
        options: ['17 減 5 的差和 17 除以 5 的商', '17 除以 5 得 3.4，印的是整數部分和小數部分', '17 除以 5 的商和餘數', '17 和 5 的最大公因數和最小公倍數'],
        answer: 2,
        why: '印出 3 2。n / 5（Python 寫 n // 5）是整數除法，17 裡面有 3 個 5，商是 3；n % 5 是分掉 3 個 5 之後剩下的 2，餘數。如果是 (B)，小數部分該是 4 不是 2；(C) 會印 12 3；(D) 會印 1 85。商和餘數這一組是把一個數「幾個一組」拆開最常用的寫法，像 17 顆糖 5 個一袋，裝 3 袋剩 2 顆。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int n = 17;\n    int q = n / 5;\n    int r = n % 5;\n    printf("%d %d\\n", q, r);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int n = 17;\n    int q = n / 5;\n    int r = n % 5;\n    std::cout << q << " " << r << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int n = 17;\n        int q = n / 5;\n        int r = n % 5;\n        System.out.println(q + " " + r);\n    }\n}\n',
          python: 'n = 17\nq = n // 5\nr = n % 5\nprint(q, r)\n',
        },
        output: '3 2',
      },
      {
        kind: '程式測試與除錯',
        prompt: '想把 a 和 b 的值交換、印出 8 3，結果印出 8 8。要怎麼改？',
        code: {
          c: `int a = 3;
int b = 8;
a = b;
b = a;
printf("%d %d\\n", a, b);`,
          cpp: `int a = 3;
int b = 8;
a = b;
b = a;
std::cout << a << " " << b << "\\n";`,
          java: `int a = 3;
int b = 8;
a = b;
b = a;
System.out.println(a + " " + b);`,
          python: `a = 3
b = 8
a = b
b = a
print(a, b)`,
        },
        options: ['在 a = b 後面再加一行 a = b', '把 a = b 和 b = a 兩行對調', '把 b = a 改成 b = a - b', '先多開一個變數 t = a 記住 a 的值，再做 a = b，最後把 b = a 改成 b = t'],
        answer: 3,
        why: 'a = b 把 8 放進 a 的那一刻，a 原本的 3 已經被蓋掉、哪裡都找不回來，所以 b = a 只是把 8 再放回 b，印出 8 8。先用 t 記住 3，a 變成 8 之後再把 t 的 3 放進 b，就印出 8 3。兩行對調會先把 b 蓋掉，印出 3 3；b = a − b 會印 8 0；再多一行 a = b 還是 8 8。Python 可以直接寫 a, b = b, a，一行交換。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int a = 3;\n    int b = 8;\n    a = b;\n    b = a;\n    printf("%d %d\\n", a, b);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int a = 3;\n    int b = 8;\n    a = b;\n    b = a;\n    std::cout << a << " " << b << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int a = 3;\n        int b = 8;\n        a = b;\n        b = a;\n        System.out.println(a + " " + b);\n    }\n}\n',
          python: 'a = 3\nb = 8\na = b\nb = a\nprint(a, b)\n',
        },
        output: '8 8',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'variables', page);
})(typeof window !== 'undefined' ? window : globalThis);
