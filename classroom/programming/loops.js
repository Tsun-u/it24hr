// classroom/programming/loops.js — APCS 程式設計「迴圈」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '喜歡的歌手發了新單曲，我想要在通勤時的半小時一直重複聽，怎麼做？',
    // 複習：用前面學過的東西硬做，做到一半需求又變大，這頁的概念上場；quote 是讀者自己想到的那句，也就是迴圈的核心想法
    review: [
      '我們前面學了輸出，最直覺的做法就是把「播放：新單曲」寫 10 次。寫到第 6 次時，你發現回程也要聽，還得再寫 10 次……這時你會不會想：',
      { quote: '要是我可以改一個用來表達次數的變數，讓它自動幫我重複 n 次就好了。' },
      '恭喜，你想到的就是迴圈。',
    ],
    summary: '下次把喜歡的歌設成重複播放，你就知道：那是一個迴圈，同一件事寫一次，讓它一直重複跑，不用把同一行程式寫 10 次。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      'do…while 迴圈：先把本體跑一次，跑完才檢查條件，所以本體至少會跑一次，適合「先讓使用者輸入，輸入錯了再問一次」這種情況。C、C++、Java 都有：do { … } while (條件);（結尾的分號不能少）。',
      'Python 沒有 do…while，常見的寫法是 while True: 先跑本體，最後寫 if not 條件: break，效果一樣。',
    ],
    uses: [
      '鬧鐘的貪睡：按一下就過五分鐘再響，直到你把它關掉。',
      '算全班的平均分數：從第一個人到最後一個人，一個一個加起來，再除以人數。',
      '遊戲畫面：遊戲一直重複「讀按鍵、算位置、畫一張畫面」，一秒幾十次，直到你關掉遊戲，這叫遊戲迴圈（game loop）。',
      '網站的伺服器：一直等新的連線進來，來一個處理一個，整天不停。',
    ],
    concept: [
      '迴圈（loop）讓同一段程式重複執行：規則寫一次，條件成立就一直重複，不用把同樣的程式寫好幾遍。while 迴圈每一圈開頭先檢查條件：成立就把迴圈本體（body）跑一次，再回到開頭檢查；不成立就離開，接著跑迴圈後面的程式。',
      'for 迴圈把「從幾開始、什麼時候停、每圈怎麼變」寫在同一行。C、C++、Java 的 for (int i = 1; i <= n; i++) 跟 while 寫法一模一樣：先 i = 1，每圈開頭檢查 i <= n，跑完本體做 i++。Python 的 for i in range(1, n + 1) 是讓 i 依序取 1 到 n，range 不包含結尾的那個數。',
      '迴圈裡面再放一個迴圈，叫巢狀迴圈（nested loop）。課表就是一個：要是把整學期每一天、每一節要上什麼都列出來，會是厚厚一本冊子；課表只寫一週，每天照著上午、午休、下午跑一輪（內圈），星期一到星期五跑完是一週（外圈），學期還沒結束就再從星期一開始。外圈每跑一圈，內圈就從頭整個跑一輪。',
      'break 是馬上離開整個迴圈；continue 是跳過這一圈剩下的部分，直接進下一圈。條件永遠成立、迴圈停不下來，叫無窮迴圈（infinite loop），最常見的原因是忘了在本體裡更新變數。',
    ],
    traps: [
      { wrong: '本體跑到一半條件不成立了，迴圈就會停在中間', right: '條件只在每一圈開頭檢查。本體跑到一半 i 已經超過 n，這一圈還是會跑完，回到開頭檢查才離開。' },
      { wrong: 'n = 0 時，迴圈至少也會跑一次', right: 'while 和 for 都是先檢查再跑，n = 0 時一次都不跑，總和是 0（追蹤器挑 n = 0 看看）。C、C++、Java 的 do-while 才是先跑再檢查、至少跑一次；Python 沒有 do-while。' },
      { wrong: 'range(1, 5) 會跑到 5', right: 'range 不包含結尾，只有 1、2、3、4。要跑到 n 要寫 range(1, n + 1)。' },
      { wrong: '迴圈跑完以後，C 和 Python 的迴圈變數一樣大', right: 'C 的 for (i = 1; i <= 3; i++) 跑完時 i 是 4：最後一次檢查 4 <= 3 不成立才離開。Python 的 for i in range(1, 4) 跑完時 i 停在 3。程式識讀的 C 題本和 Python 題本都會考這個差別。' },
      { wrong: 'continue 會回到迴圈最前面、重新開始整個迴圈', right: 'continue 只跳過這一圈剩下的部分。for 迴圈會先做每圈的更新（i++）再檢查條件；while 迴圈的更新寫在本體裡，continue 跳過它的話 i 不會變，就停不下來了。' },
      { wrong: '巢狀迴圈的內圈只跑一次', right: '外圈每跑一圈，內圈都從頭整個跑一輪：外圈 3 圈、內圈每次 4 圈，內圈的本體一共跑 12 次。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{n}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: 'n = 3', values: { n: 3 } }, { label: 'n = 0', values: { n: 0 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int n = {{n}};
    int i = 1;
    int total = 0;
    while (i <= n) {
        total += i;
        i += 1;
    }
    printf("%d\\n", total);
    return 0;
}
`,
        cpp: `#include <iostream>

int main() {
    int n = {{n}};
    int i = 1;
    int total = 0;
    while (i <= n) {
        total += i;
        i += 1;
    }
    std::cout << total << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int n = {{n}};
        int i = 1;
        int total = 0;
        while (i <= n) {
            total += i;
            i += 1;
        }
        System.out.println(total);
    }
}
`,
        python: `n = {{n}}
i = 1
total = 0
while i <= n:
    total += i
    i += 1
print(total)
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 11 },
        cpp: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 11 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 10 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "n = 3": [
        {"line":1,"vars":{"n":3},"out":""},
        {"line":2,"vars":{"n":3,"i":1},"out":""},
        {"line":3,"vars":{"n":3,"i":1,"total":0},"out":""},
        {"line":4,"vars":{"n":3,"i":1,"total":0},"out":"","cond":true},
        {"line":5,"vars":{"n":3,"i":1,"total":1},"out":""},
        {"line":6,"vars":{"n":3,"i":2,"total":1},"out":""},
        {"line":4,"vars":{"n":3,"i":2,"total":1},"out":"","cond":true},
        {"line":5,"vars":{"n":3,"i":2,"total":3},"out":""},
        {"line":6,"vars":{"n":3,"i":3,"total":3},"out":""},
        {"line":4,"vars":{"n":3,"i":3,"total":3},"out":"","cond":true},
        {"line":5,"vars":{"n":3,"i":3,"total":6},"out":""},
        {"line":6,"vars":{"n":3,"i":4,"total":6},"out":""},
        {"line":4,"vars":{"n":3,"i":4,"total":6},"out":"","cond":false},
        {"line":7,"vars":{"n":3,"i":4,"total":6},"out":"6\n"},
      ],
      "n = 0": [
        {"line":1,"vars":{"n":0},"out":""},
        {"line":2,"vars":{"n":0,"i":1},"out":""},
        {"line":3,"vars":{"n":0,"i":1,"total":0},"out":""},
        {"line":4,"vars":{"n":0,"i":1,"total":0},"out":"","cond":false},
        {"line":7,"vars":{"n":0,"i":1,"total":0},"out":"0\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：開場那首歌的流程圖。菱形是每一圈開頭檢查的條件、方塊是迴圈本體，播完沿著箭頭回到條件再檢查
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const s = svgEl(320, 316), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9, seed: 3 };
      const label = (x, y, text, size = 14, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      // 折線，最後一段的尾端畫箭頭
      const arrow = (pts) => {
        for (let k = 1; k < pts.length; k++) s.append(rc.line(...pts[k - 1], ...pts[k], line));
        const [x1, y1] = pts[pts.length - 2], [x2, y2] = pts[pts.length - 1], a = Math.atan2(y2 - y1, x2 - x1);
        const wing = (d) => [x2 - 9 * Math.cos(a + d), y2 - 9 * Math.sin(a + d)];
        s.append(rc.polygon([[x2, y2], wing(0.45), wing(-0.45)], { ...line, fill: INK, fillStyle: 'solid' }));
      };
      s.append(rc.rectangle(90, 6, 140, 34, { ...line, fill: '#fff', fillStyle: 'solid' }));
      label(160, 23, '上車，開始通勤');
      arrow([[160, 40], [160, 66]]);
      s.append(rc.polygon([[160, 68], [240, 108], [160, 148], [80, 108]], { ...line, fill: NEW, fillStyle: 'solid' }));
      label(160, 99, '還在通勤嗎？'); label(160, 121, '（條件）', 12, true);
      label(174, 162, '是', 13); arrow([[160, 148], [160, 176]]);
      s.append(rc.rectangle(95, 178, 130, 46, { ...line, fill: FILL, fillStyle: 'solid' }));
      label(160, 193, '播放新單曲'); label(160, 212, '（迴圈本體）', 12, true);
      arrow([[160, 224], [160, 248], [22, 248], [22, 108], [78, 108]]);
      label(100, 264, '播完一首，回到開頭再檢查', 12, true);
      label(258, 97, '否', 13); arrow([[240, 108], [292, 108], [292, 268]]);
      s.append(rc.rectangle(206, 270, 110, 36, { ...line, fill: '#fff', fillStyle: 'solid' }));
      label(261, 288, '到站，停止播放', 13);
      return s;
    },
    code: {
      c: `#include <stdio.h>

int main(void) {
    int n = 5;

    int total = 0;
    for (int i = 1; i <= n; i++) {          // 先檢查 i <= n，成立才跑本體，跑完做 i++
        total += i;
    }

    int pairs = 0;
    for (int i = 1; i <= n; i++) {          // 巢狀迴圈：外圈每跑一圈，內圈整個跑一輪
        for (int j = i + 1; j <= n; j++) {
            pairs += 1;
        }
    }

    printf("%d %d\\n", total, pairs);
    return 0;
}
`,
      cpp: `#include <iostream>

int main() {
    int n = 5;

    int total = 0;
    for (int i = 1; i <= n; i++) {          // 先檢查 i <= n，成立才跑本體，跑完做 i++
        total += i;
    }

    int pairs = 0;
    for (int i = 1; i <= n; i++) {          // 巢狀迴圈：外圈每跑一圈，內圈整個跑一輪
        for (int j = i + 1; j <= n; j++) {
            pairs += 1;
        }
    }

    std::cout << total << " " << pairs << "\\n";
    return 0;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int n = 5;

        int total = 0;
        for (int i = 1; i <= n; i++) {      // 先檢查 i <= n，成立才跑本體，跑完做 i++
            total += i;
        }

        int pairs = 0;
        for (int i = 1; i <= n; i++) {      // 巢狀迴圈：外圈每跑一圈，內圈整個跑一輪
            for (int j = i + 1; j <= n; j++) {
                pairs += 1;
            }
        }

        System.out.println(total + " " + pairs);
    }
}
`,
      python: `n = 5

total = 0
for i in range(1, n + 1):          # i 依序是 1、2、…、n，range 不包含結尾
    total += i

pairs = 0
for i in range(1, n + 1):          # 巢狀迴圈：外圈每跑一圈，內圈整個跑一輪
    for j in range(i + 1, n + 1):
        pairs += 1

print(total, pairs)
`,
      output: '15 10',
    },
    // 跑幾步：每一行執行幾次，再看次數跟 n 怎麼長
    cost: {
      rows: [
        ['追蹤器那段的條件 i <= n（n = 3 時檢查 4 次，最後一次不成立）', 'n + 1 次'],
        ['本體的 total += i、i += 1', '各 n 次'],
        ['追蹤器那段整段', 'O(n)'],
        ['實作的巢狀迴圈（n = 5 時 pairs 加了 10 次）', 'n(n − 1) / 2 次，O(n²)'],
      ],
      note: { text: '數出每一行跑幾次，再看次數跟著 n 怎麼長，就是時間複雜度。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '下面這段程式印出什麼？',
        code: {
          c: `int x = 0;
for (int i = 1; i < 5; i++) {
    x += i * 2;
}
printf("%d\\n", x);`,
          cpp: `int x = 0;
for (int i = 1; i < 5; i++) {
    x += i * 2;
}
std::cout << x << "\\n";`,
          java: `int x = 0;
for (int i = 1; i < 5; i++) {
    x += i * 2;
}
System.out.println(x);`,
          python: `x = 0
for i in range(1, 5):
    x += i * 2
print(x)`,
        },
        options: ['16', '20', '30', '8'],
        answer: 1,
        why: 'i 依序是 1、2、3、4（C 的 i < 5 到 4 為止；Python 的 range(1, 5) 不包含 5），x 依序加上 2、4、6、8，一共 20。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int x = 0;\n    for (int i = 1; i < 5; i++) {\n        x += i * 2;\n    }\n    printf("%d\\n", x);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int x = 0;\n    for (int i = 1; i < 5; i++) {\n        x += i * 2;\n    }\n    std::cout << x << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int x = 0;\n        for (int i = 1; i < 5; i++) {\n            x += i * 2;\n        }\n        System.out.println(x);\n    }\n}\n',
          python: 'x = 0\nfor i in range(1, 5):\n    x += i * 2\nprint(x)\n',
        },
        output: '20',
      },
      {
        kind: '程式測試與除錯',
        prompt: '想印出 1 到 5（一行一個），結果只印到 4。要怎麼改？',
        code: {
          c: `int i = 1;
while (i < 5) {
    printf("%d\\n", i);
    i += 1;
}`,
          cpp: `int i = 1;
while (i < 5) {
    std::cout << i << "\\n";
    i += 1;
}`,
          java: `int i = 1;
while (i < 5) {
    System.out.println(i);
    i += 1;
}`,
          python: `i = 1
while i < 5:
    print(i)
    i += 1`,
        },
        options: ['把 i < 5 改成 i <= 5', '把 i = 1 改成 i = 0', '把 i += 1 移到印出那行的前面', '把 i += 1 改成 i += 2'],
        answer: 0,
        why: 'i 變成 5 時，i < 5 就不成立了，5 沒有印出來；改成 i <= 5，i 是 5 時還會再跑一圈。從 0 開始會印出 0 到 4；先加再印會印出 2 到 5；每次加 2 會印出 1、3。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int i = 1;\n    while (i < 5) {\n        printf("%d\\n", i);\n        i += 1;\n    }\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int i = 1;\n    while (i < 5) {\n        std::cout << i << "\\n";\n        i += 1;\n    }\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int i = 1;\n        while (i < 5) {\n            System.out.println(i);\n            i += 1;\n        }\n    }\n}\n',
          python: 'i = 1\nwhile i < 5:\n    print(i)\n    i += 1\n',
        },
        output: '1\n2\n3\n4',
      },
      {
        kind: '程式效能分析',
        prompt: 'n = 10 時，下面這段程式跑完，count 是多少？',
        code: {
          c: `int count = 0;
for (int i = 0; i < n; i++) {
    for (int j = 0; j < i; j++) {
        count += 1;
    }
}`,
          cpp: `int count = 0;
for (int i = 0; i < n; i++) {
    for (int j = 0; j < i; j++) {
        count += 1;
    }
}`,
          java: `int count = 0;
for (int i = 0; i < n; i++) {
    for (int j = 0; j < i; j++) {
        count += 1;
    }
}`,
          python: `count = 0
for i in range(n):
    for j in range(i):
        count += 1`,
        },
        options: ['100', '45', '55', '90'],
        answer: 1,
        why: '外圈 i 從 0 到 9，內圈每次跑 i 圈：0 + 1 + 2 + … + 9 = 45。一般來說是 n(n − 1) / 2 次，n 變兩倍、次數大約變四倍，是 O(n²)。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int n = 10;\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            count += 1;\n        }\n    }\n    printf("%d\\n", count);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int n = 10;\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            count += 1;\n        }\n    }\n    std::cout << count << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int n = 10;\n        int count = 0;\n        for (int i = 0; i < n; i++) {\n            for (int j = 0; j < i; j++) {\n                count += 1;\n            }\n        }\n        System.out.println(count);\n    }\n}\n',
          python: 'n = 10\ncount = 0\nfor i in range(n):\n    for j in range(i):\n        count += 1\nprint(count)\n',
        },
        output: '45',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'loops', page);
})(typeof window !== 'undefined' ? window : globalThis);
