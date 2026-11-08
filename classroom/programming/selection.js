// classroom/programming/selection.js — APCS 程式設計「條件判斷」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '出門前打開電視，早安新聞的主播說今天最好要帶傘。可以不用開電視就知道要不要帶傘嗎？',
    // 複習：用前面學過的輸入與輸出硬做，發現程式只會從頭跑到尾；quote 是這頁的核心想法
    review: [
      '我們前面學了輸入與輸出，最直覺的做法是讓程式讀進今天的降雨機率，再印出來：「今天降雨機率 70%」。可是你每天還是得自己看著數字想：70% 要帶嗎？40% 呢？後來你連穿不穿外套、要不要擦防曬，都想看一眼程式就知道。可是到目前為止，我們寫的程式只會照順序一行一行從頭跑到尾，沒辦法照規則出現不同結果。',
      { quote: '條件判斷就是要教它如何做決定。' },
    ],
    summary: '可以：讓程式讀今天的降雨機率，寫「如果超過 50% 就印出記得帶傘，不然就不印」。下次發現自己每天都在做「如果…就…」的決定，你就知道：這種判斷可以交給程式。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      'switch／case：同一個變數要跟好幾個固定的值比，像選單的 1、2、3 各做一件事，C、C++、Java 可以寫 switch (choice) { case 1: … break; case 2: … break; default: … }，比一長串 else if 整齊。每個 case 結尾要寫 break，漏掉的話會一路往下掉（fall-through），把下一個 case 的程式也跑掉。switch 只能比「等於某個值」，score >= 90 這種範圍還是要用 if／else if。',
      'Python 沒有 switch。3.10 以後有 match／case（APCS 程式實作的環境是 Python 3.10，可以用），寫法跟 switch 很像、結尾不用 break；更常見的寫法是直接用 if／elif，或是把對照表放進字典（dict）用 key 查，例如 name = {1: "A", 2: "B"}[choice]。',
    ],
    uses: [
      '手機的勿擾模式：晚上 11 點以後來電就不響，標成最愛的那幾個人打來例外。',
      '網購結帳：滿 1000 元免運，不然加 60 元運費；有輸入優惠碼再打折。',
      '遊戲：血量歸零就 Game Over，碰到金幣就加分——每一格畫面都要判斷好幾次。',
      '電腦內部：作業系統收到你按的每一個鍵，都先判斷是不是 Ctrl、是不是 Enter，再決定交給哪個程式處理；CPU 裡面每個 if 最後都變成一條「分支」指令，跳去不同的地方繼續跑。',
    ],
    concept: [
      '條件判斷（selection）讓程式照條件走不同的路。if 後面接一個條件，也就是一個算出來是真或假的比較：rain > 50 在 rain 是 70 時成立、是 30 時不成立。成立就跑 if 底下那一塊程式（區塊，block），不成立就跳過；後面可以接 else，條件不成立時改跑 else 那一塊。到目前為止的程式只會從頭跑到尾，條件判斷是第一個讓它「分岔」的東西：同一支程式，今天印出 umbrella，明天什麼都不印。',
      '只分「帶、不帶」有時不夠：70% 以上一定帶，50% 到 70% 之間「再看看」，50% 以下不帶。這時用 else if（Python 寫 elif）一路往下比：先看 rain >= 70，不成立才看 rain > 50，都不成立才走 else。中了一個就不再往下比，所以第二個條件不用再寫「而且小於 70」，走到它的時候 rain 一定已經小於 70 了。',
      '條件裡面還可以再放條件，叫巢狀 if（nested if）：先判斷有沒有下雨，有下雨再判斷風大不大，風大就別撐傘、改穿雨衣。一個條件不夠用時，也可以用 &&（而且，Python 寫 and）和 ||（或者，Python 寫 or）把兩個條件接起來：rain > 50 && rain < 70 是「超過 50 而且不到 70」，兩邊都成立整個才成立；|| 是其中一邊成立就成立。',
      'C、C++、Java 用大括號 { } 把要一起跑的那幾行框起來，縮排只是給人看的；Python 沒有大括號，縮排就是區塊：往內縮的那幾行屬於上面的 if，退回來就不屬於了。追蹤器裡三組降雨機率都挑挑看，同一支程式走的路不一樣。',
    ],
    traps: [
      { wrong: 'else 配的是最上面那個 if', right: 'else 配最近的、還沒配到 else 的那個 if（dangling else）。C、C++、Java 不看縮排，巢狀 if 要用大括號框清楚；Python 看縮排，else 跟哪個 if 對齊就配哪個。' },
      { wrong: '0 < x < 10 在 C 也能判斷 x 介於 0 到 10 之間', right: 'C 從左到右算：0 < x 先變成 1 或 0，再拿 1 或 0 跟 10 比，永遠成立。要寫 0 < x && x < 10。Python 可以連著寫，意思真的是「介於中間」。' },
      { wrong: 'C 的 if (x = 5) 是在判斷 x 等不等於 5', right: '一個等號是指定：先把 5 放進 x，再拿 5 當條件，5 不是 0 所以永遠成立。比較要寫兩個等號 x == 5。Python 和 Java 遇到這種寫法會直接報錯，反而幫你擋下來。' },
      { wrong: '三個獨立的 if 跟 if／else if／else 一樣', right: '獨立的 if 每一個都會檢查，條件重疊時會中好幾個：score 是 95 時，if score >= 90、if score >= 80、if score >= 60 三個都成立，會印出三個等第。else if 中了一個就不再往下比。' },
      { wrong: 'C 的 if 沒加大括號，底下縮排的幾行都歸它管', right: '沒大括號只管緊接著的那一行，第二行不管條件成不成立都會跑。C、C++、Java 看的是大括號，不是縮排；兩行以上就加大括號。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{p}} 換成挑的那組降雨機率；lines 是 Python 的第幾行對到那種語言的第幾行（Python 的 else: 不會停，不用對）
    trace: {
      inputs: [{ label: 'p = 80', values: { p: 80 } }, { label: 'p = 60', values: { p: 60 } }, { label: 'p = 30', values: { p: 30 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int rain = {{p}};
    if (rain >= 70) {
        printf("umbrella\\n");
    } else if (rain > 50) {
        printf("maybe\\n");
    } else {
        printf("no\\n");
    }
    if (rain > 50 && rain < 70) {
        printf("check\\n");
    }
    return 0;
}
`,
        cpp: `#include <iostream>

int main() {
    int rain = {{p}};
    if (rain >= 70) {
        std::cout << "umbrella\\n";
    } else if (rain > 50) {
        std::cout << "maybe\\n";
    } else {
        std::cout << "no\\n";
    }
    if (rain > 50 && rain < 70) {
        std::cout << "check\\n";
    }
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int rain = {{p}};
        if (rain >= 70) {
            System.out.println("umbrella");
        } else if (rain > 50) {
            System.out.println("maybe");
        } else {
            System.out.println("no");
        }
        if (rain > 50 && rain < 70) {
            System.out.println("check");
        }
    }
}
`,
        python: `rain = {{p}}
if rain >= 70:
    print("umbrella")
elif rain > 50:
    print("maybe")
else:
    print("no")
if rain > 50 and rain < 70:
    print("check")
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 7: 10, 8: 12, 9: 13 },
        cpp: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 7: 10, 8: 12, 9: 13 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 7: 9, 8: 11, 9: 12 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "p = 80": [
        {"line":1,"vars":{"rain":80},"out":""},
        {"line":2,"vars":{"rain":80},"out":"","cond":true},
        {"line":3,"vars":{"rain":80},"out":"umbrella\n"},
        {"line":8,"vars":{"rain":80},"out":"umbrella\n","cond":false},
      ],
      "p = 60": [
        {"line":1,"vars":{"rain":60},"out":""},
        {"line":2,"vars":{"rain":60},"out":"","cond":false},
        {"line":4,"vars":{"rain":60},"out":"","cond":true},
        {"line":5,"vars":{"rain":60},"out":"maybe\n"},
        {"line":8,"vars":{"rain":60},"out":"maybe\n","cond":true},
        {"line":9,"vars":{"rain":60},"out":"maybe\ncheck\n"},
      ],
      "p = 30": [
        {"line":1,"vars":{"rain":30},"out":""},
        {"line":2,"vars":{"rain":30},"out":"","cond":false},
        {"line":4,"vars":{"rain":30},"out":"","cond":false},
        {"line":7,"vars":{"rain":30},"out":"no\n"},
        {"line":8,"vars":{"rain":30},"out":"no\n","cond":false},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：出門前走到岔路口。菱形是條件，兩條路只會走一條，走完又回到同一條路上
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const s = svgEl(320, 312), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9, seed: 5 };
      const label = (x, y, text, size = 14, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      // 折線，最後一段的尾端畫箭頭
      const arrow = (pts) => {
        for (let k = 1; k < pts.length; k++) s.append(rc.line(...pts[k - 1], ...pts[k], line));
        const [x1, y1] = pts[pts.length - 2], [x2, y2] = pts[pts.length - 1], a = Math.atan2(y2 - y1, x2 - x1);
        const wing = (d) => [x2 - 9 * Math.cos(a + d), y2 - 9 * Math.sin(a + d)];
        s.append(rc.polygon([[x2, y2], wing(0.45), wing(-0.45)], { ...line, fill: INK, fillStyle: 'solid' }));
      };
      s.append(rc.rectangle(100, 6, 120, 34, { ...line, fill: '#fff', fillStyle: 'solid' }));
      label(160, 23, '出門前');
      arrow([[160, 40], [160, 66]]);
      s.append(rc.polygon([[160, 68], [244, 108], [160, 148], [76, 108]], { ...line, fill: NEW, fillStyle: 'solid' }));
      label(160, 102, '降雨機率 > 50%？'); label(160, 124, '（條件）', 12, true);
      label(58, 100, '是', 13); arrow([[76, 108], [66, 108], [66, 176]]);
      s.append(rc.rectangle(16, 178, 100, 40, { ...line, fill: FILL, fillStyle: 'solid' }));
      label(66, 198, '帶傘');
      label(262, 100, '否', 13); arrow([[244, 108], [254, 108], [254, 176]]);
      s.append(rc.rectangle(204, 178, 100, 40, { ...line, fill: FILL, fillStyle: 'solid' }));
      label(254, 198, '不帶');
      label(160, 240, '兩條路只會走一條', 12, true);
      arrow([[66, 218], [66, 256], [160, 256], [160, 268]]);
      s.append(rc.line(254, 218, 254, 256, line)); s.append(rc.line(254, 256, 160, 256, line));
      s.append(rc.rectangle(110, 270, 100, 34, { ...line, fill: '#fff', fillStyle: 'solid' }));
      label(160, 287, '出門');
      return s;
    },
    code: {
      c: `#include <stdio.h>

int main(void) {
    int score = 85;
    int late = 0;                           // 1 是遲到、0 是沒遲到

    char grade;
    if (score >= 90) {                      // 一路往下比，中了一個就不再比
        grade = 'A';
    } else if (score >= 80) {
        grade = 'B';
    } else if (score >= 60) {
        grade = 'C';
    } else {
        grade = 'D';
    }

    int ok = 0;
    if (score >= 60 && late == 0) {         // 兩個條件都成立才算
        ok = 1;
    }

    printf("%c %d\\n", grade, ok);
    return 0;
}
`,
      cpp: `#include <iostream>

int main() {
    int score = 85;
    int late = 0;                           // 1 是遲到、0 是沒遲到

    char grade;
    if (score >= 90) {                      // 一路往下比，中了一個就不再比
        grade = 'A';
    } else if (score >= 80) {
        grade = 'B';
    } else if (score >= 60) {
        grade = 'C';
    } else {
        grade = 'D';
    }

    int ok = 0;
    if (score >= 60 && late == 0) {         // 兩個條件都成立才算
        ok = 1;
    }

    std::cout << grade << " " << ok << "\\n";
    return 0;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        int score = 85;
        int late = 0;                       // 1 是遲到、0 是沒遲到

        char grade;
        if (score >= 90) {                  // 一路往下比，中了一個就不再比
            grade = 'A';
        } else if (score >= 80) {
            grade = 'B';
        } else if (score >= 60) {
            grade = 'C';
        } else {
            grade = 'D';
        }

        int ok = 0;
        if (score >= 60 && late == 0) {     // 兩個條件都成立才算
            ok = 1;
        }

        System.out.println(grade + " " + ok);
    }
}
`,
      python: `score = 85
late = 0                            # 1 是遲到、0 是沒遲到

if score >= 90:                     # 一路往下比，中了一個就不再比
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "D"

ok = 0
if score >= 60 and late == 0:       # 兩個條件都成立才算
    ok = 1

print(grade, ok)
`,
      output: 'B 1',
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '下面這段程式印出什麼？',
        code: {
          c: `int x = 5;
int y = 20;
if (x > 0)
    if (y > 50)
        printf("A\\n");
else
    printf("B\\n");`,
          cpp: `int x = 5;
int y = 20;
if (x > 0)
    if (y > 50)
        std::cout << "A\\n";
else
    std::cout << "B\\n";`,
          java: `int x = 5;
int y = 20;
if (x > 0)
    if (y > 50)
        System.out.println("A");
else
    System.out.println("B");`,
          python: `x = 5
y = 20
if x > 0:
    if y > 50:
        print("A")
    else:
        print("B")`,
        },
        options: ['A', 'B', 'AB', '什麼都不印'],
        answer: 1,
        why: 'C、C++、Java 的 else 配最近的、還沒配到 else 的那個 if，所以它是 y > 50 的 else，排版上對齊外面的 if 只是給人看的：x > 0 成立、進到裡面，y > 50 不成立，印出 B。以為 else 配外面那個 if 的話，會以為什麼都不印；A 要 y > 50 才會印；兩條路只會走一條，不會 A、B 都印。Python 看縮排，else 跟裡面的 if 對齊，就是配它。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int x = 5;\n    int y = 20;\n    if (x > 0)\n        if (y > 50)\n            printf("A\\n");\n    else\n        printf("B\\n");\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int x = 5;\n    int y = 20;\n    if (x > 0)\n        if (y > 50)\n            std::cout << "A\\n";\n    else\n        std::cout << "B\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int x = 5;\n        int y = 20;\n        if (x > 0)\n            if (y > 50)\n                System.out.println("A");\n        else\n            System.out.println("B");\n    }\n}\n',
          python: 'x = 5\ny = 20\nif x > 0:\n    if y > 50:\n        print("A")\n    else:\n        print("B")\n',
        },
        output: 'B',
      },
      {
        kind: '程式填空',
        prompt: '想在 x 是 3 的倍數而且是偶數的時候才印出 yes，____ 要填什麼？（Python 把 && 寫成 and、|| 寫成 or）',
        code: {
          c: `int x = 12;
if (____) {
    printf("yes\\n");
}`,
          cpp: `int x = 12;
if (____) {
    std::cout << "yes\\n";
}`,
          java: `int x = 12;
if (____) {
    System.out.println("yes");
}`,
          python: `x = 12
if ____:
    print("yes")`,
        },
        options: ['x % 3 && x % 2 == 0', 'x % 3 == 0 || x % 2 == 0', 'x % 3 == 0 && x % 2 == 1', 'x % 3 == 0 && x % 2 == 0'],
        answer: 3,
        why: '3 的倍數是 x % 3 == 0、偶數是 x % 2 == 0，兩個都要成立，用 &&（Python 的 and）接起來；x = 12 兩邊都成立，印出 yes。用 || 的話其中一個成立就印，x = 9 也會印 yes；x % 2 == 1 是奇數，12 反而不印；x % 3 少了 == 0，在 C 裡 x % 3 不是 0 才算成立，變成「不是 3 的倍數而且是偶數」，x = 10 會印、12 不印。',
        // 驗算用的程式把空格 ____ 當成一個變數，前一行填進正解
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int x = 12;\n    int ____ = x % 3 == 0 && x % 2 == 0;\n    if (____) {\n        printf("yes\\n");\n    }\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int x = 12;\n    bool ____ = x % 3 == 0 && x % 2 == 0;\n    if (____) {\n        std::cout << "yes\\n";\n    }\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int x = 12;\n        boolean ____ = x % 3 == 0 && x % 2 == 0;\n        if (____) {\n            System.out.println("yes");\n        }\n    }\n}\n',
          python: 'x = 12\n____ = x % 3 == 0 and x % 2 == 0\nif ____:\n    print("yes")\n',
        },
        output: 'yes',
      },
      {
        kind: '程式測試與除錯',
        prompt: '60 分應該算及格，可是輸入 60 卻印出 fail。要怎麼改？',
        code: {
          c: `int score = 60;
if (score > 60) {
    printf("pass\\n");
} else {
    printf("fail\\n");
}`,
          cpp: `int score = 60;
if (score > 60) {
    std::cout << "pass\\n";
} else {
    std::cout << "fail\\n";
}`,
          java: `int score = 60;
if (score > 60) {
    System.out.println("pass");
} else {
    System.out.println("fail");
}`,
          python: `score = 60
if score > 60:
    print("pass")
else:
    print("fail")`,
        },
        options: ['把 score > 60 改成 score < 60', '把 score > 60 改成 score == 60', '把 score > 60 改成 score >= 60', '把印 pass 和印 fail 的兩行對調'],
        answer: 2,
        why: '60 > 60 不成立，所以走到 else 印出 fail；改成 >= 60，剛好 60 分也算成立。改成 == 60 只有剛好 60 分及格、90 分會變不及格；改成 < 60 整個反過來，59 分及格、100 分不及格；把兩行對調，60 分是會印 pass，可是 90 分會印 fail。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int score = 60;\n    if (score > 60) {\n        printf("pass\\n");\n    } else {\n        printf("fail\\n");\n    }\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int score = 60;\n    if (score > 60) {\n        std::cout << "pass\\n";\n    } else {\n        std::cout << "fail\\n";\n    }\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int score = 60;\n        if (score > 60) {\n            System.out.println("pass");\n        } else {\n            System.out.println("fail");\n        }\n    }\n}\n',
          python: 'score = 60\nif score > 60:\n    print("pass")\nelse:\n    print("fail")\n',
        },
        output: 'fail',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'selection', page);
})(typeof window !== 'undefined' ? window : globalThis);
