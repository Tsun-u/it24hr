// classroom/programming/strings.js — APCS 程式設計「字元與字串」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '註冊帳號時常看到「6～12 個字，第一個字要是英文字母」。程式要怎麼檢查你打的帳號符不符合？',
    // 複習：用前面學過的陣列硬做，做到一半發現行不通，這頁的概念上場；quote 是講義自己說的那句，也就是字串的核心想法
    review: [
      '我們前面學了陣列，最直覺的做法是請使用者一次打一個字，先問「帳號有幾個字？」，再一格一格存進陣列。使用者打到第 5 個字就關掉網頁了。就算存好了，要判斷第一格是不是英文字母，你還得寫 52 個 if，把 a 到 z、A 到 Z 一個一個比。好消息是，程式語言早就幫我們準備好了：',
      { quote: '一整串字可以一次存起來，字母還能像數字一樣比大小。' },
    ],
    summary: '長度用 len 看，第一個字是 name[0]；字母存的是數字，所以 \'a\' <= first <= \'z\' 就能判斷是不是小寫字母。下次看到註冊頁面跳出「帳號格式不對」，你就知道：那是一支程式在數字串的長度、一個字一個字檢查。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      '中文一個字不是一個 byte：UTF-8 把一個中文字存成 3 個 byte，所以 C 的 strlen("你好") 是 6，不是 2。Python 的 len("你好") 和 Java 的 "你好".length() 算的是字，都是 2。題目有中文輸入時，想清楚要數的是字還是 byte。',
      'Python 沒有字元型態，所以用 ord(c) 把一個字變成數字、chr(97) 把數字變回字。C、C++、Java 的字元本來就是數字，直接運算就好；要印成數字就轉型 (int) c，要印成字就轉回 (char) 97。',
    ],
    uses: [
      '註冊帳號、設定密碼：檢查有幾個字、第一個字是不是字母、有沒有大寫。',
      '通訊錄照姓名排序、字典照字母排：兩個名字一個字一個字比，先比出大小的那個字決定順序。',
      '把你打的「2024」變成數字 2024：每個字減掉 \'0\' 得到一位數，再一位一位拼起來，程式讀輸入時就在做這件事。',
      '你寫的程式本身：編譯器拿到的就是一長串字元，一個字一個字讀，認出 int、=、;，才知道你要它做什麼。',
    ],
    concept: [
      '字元（character）是一個字：一個字母、一個數字、一個符號。電腦裡存的是它的編號，不是字形：ASCII 編碼把 \'A\' 編成 65、\'a\' 編成 97、\'0\' 編成 48，大寫、小寫、數字各自連號。字元存的是數字，所以可以加減、可以比大小：\'a\' <= first 而且 first <= \'z\'，就是在問 first 的編號有沒有落在 97 到 122 之間，小寫那 26 個 if 變成兩個比較，大寫再兩個。',
      '字串（string）是一排字元，像陣列一樣有編號、從 0 開始：name[0] 是第一個字。C 的字串就是 char 陣列，結尾多放一個 \'\\0\' 當句點，strlen 從頭數到它為止；C++ 的 std::string、Java 的 String、Python 的 str 是字串型態，長度直接問它（length()、len）。',
      '常用的三件事：取第 i 個字（name[i]，Java 寫 name.charAt(i)）、問長度、取子字串（Python 切片 name[0:5]、Java substring(0, 5)、C++ substr(0, 5)，C 要自己一格一格複製）。',
      '比較兩個字串照字典順序：從第一個字開始一個一個比，先比出大小的那個字就決定了。"apple" < "banana" 因為 \'a\' 比 \'b\' 小；"10" < "9" 也是真，因為先比的是 \'1\' 和 \'9\'，不是比數值。',
    ],
    traps: [
      { wrong: '\'7\' 和 7 是同一個東西', right: '\'7\' 是字元，存的是編號 55；要得到數字 7 得寫 \'7\' - \'0\'（55 − 48）。Python 寫 ord(\'7\') - ord(\'0\')。' },
      { wrong: 'C 的字串 "abc" 佔 3 格', right: '佔 4 格：a、b、c 後面還有結尾的 \'\\0\'，strlen 靠它知道字串到哪裡結束。宣告 char s[3] 放 "abc" 就少一格。' },
      { wrong: 'C 可以用 == 比兩個字串一不一樣', right: 'C 的 == 比的是兩個陣列的位址，不是內容，要用 strcmp(a, b) == 0；Java 的 == 也是比位址，要用 a.equals(b)。Python 和 C++ 的 std::string 可以直接 ==。' },
      { wrong: 'Python 可以用 s[0] = \'x\' 改字串的第一個字', right: 'Python 和 Java 的字串不可變，改一個字要另做一個新字串（\'x\' + s[1:]）。C 的 char 陣列和 C++ 的 std::string 可以直接改 s[0]。' },
      { wrong: '"10" < "9" 是假，因為 10 比 9 大', right: '字串比的是字典順序：先比第一個字，\'1\'（49）比 \'9\'（57）小，所以是真。要比數值得先轉成數字。' },
      { wrong: '\'a\' 和 "a" 一樣', right: 'C、C++、Java 的 \'a\' 是一個字元、就是數字 97；"a" 是字串，C 裡佔兩格（a 和 \'\\0\'）。Python 沒有字元型態，\'a\' 和 "a" 都是長度 1 的字串，所以追蹤器裡 first 顯示成 "t"，C 的同一格是字元 \'t\'。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{s}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [
        { label: '"tsunu0824"', values: { s: 'tsunu0824' } },
        { label: '"1234567"', values: { s: '1234567' } },
        { label: '"abc"', values: { s: 'abc' } },
      ],
      code: {
        c: `#include <stdio.h>
#include <string.h>

int main(void) {
    char name[] = "{{s}}";
    int n = strlen(name);
    char first = name[0];
    if (n < 6 || n > 12) {
        printf("length\\n");
    } else if ('a' <= first && first <= 'z' || 'A' <= first && first <= 'Z') {
        printf("ok\\n");
    } else {
        printf("letter\\n");
    }
    return 0;
}
`,
        cpp: `#include <iostream>
#include <string>

int main() {
    std::string name = "{{s}}";
    int n = name.length();
    char first = name[0];
    if (n < 6 || n > 12) {
        std::cout << "length\\n";
    } else if ('a' <= first && first <= 'z' || 'A' <= first && first <= 'Z') {
        std::cout << "ok\\n";
    } else {
        std::cout << "letter\\n";
    }
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        String name = "{{s}}";
        int n = name.length();
        char first = name.charAt(0);
        if (n < 6 || n > 12) {
            System.out.println("length");
        } else if ('a' <= first && first <= 'z' || 'A' <= first && first <= 'Z') {
            System.out.println("ok");
        } else {
            System.out.println("letter");
        }
    }
}
`,
        python: `name = "{{s}}"
n = len(name)
first = name[0]
if n < 6 or n > 12:
    print("length")
elif 'a' <= first and first <= 'z' or 'A' <= first and first <= 'Z':
    print("ok")
else:
    print("letter")
`,
      },
      lines: {
        c: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 10, 7: 11, 9: 13 },
        cpp: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 10, 7: 11, 9: 13 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 9: 11 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "\"tsunu0824\"": [
        {"line":1,"vars":{"name":"tsunu0824"},"out":""},
        {"line":2,"vars":{"name":"tsunu0824","n":9},"out":""},
        {"line":3,"vars":{"name":"tsunu0824","n":9,"first":"t"},"out":""},
        {"line":4,"vars":{"name":"tsunu0824","n":9,"first":"t"},"out":"","cond":false},
        {"line":6,"vars":{"name":"tsunu0824","n":9,"first":"t"},"out":"","cond":true},
        {"line":7,"vars":{"name":"tsunu0824","n":9,"first":"t"},"out":"ok\n"},
      ],
      "\"1234567\"": [
        {"line":1,"vars":{"name":"1234567"},"out":""},
        {"line":2,"vars":{"name":"1234567","n":7},"out":""},
        {"line":3,"vars":{"name":"1234567","n":7,"first":"1"},"out":""},
        {"line":4,"vars":{"name":"1234567","n":7,"first":"1"},"out":"","cond":false},
        {"line":6,"vars":{"name":"1234567","n":7,"first":"1"},"out":"","cond":false},
        {"line":9,"vars":{"name":"1234567","n":7,"first":"1"},"out":"letter\n"},
      ],
      "\"abc\"": [
        {"line":1,"vars":{"name":"abc"},"out":""},
        {"line":2,"vars":{"name":"abc","n":3},"out":""},
        {"line":3,"vars":{"name":"abc","n":3,"first":"a"},"out":""},
        {"line":4,"vars":{"name":"abc","n":3,"first":"a"},"out":"","cond":true},
        {"line":5,"vars":{"name":"abc","n":3,"first":"a"},"out":"length\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：「tsunu」拆成一排字元格子，每格上面是編號（name[0]…）、格子裡是那個字、底下是它的 ASCII 數字；第一格上黃色，追蹤器的 first 拿的就是它
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const chars = ['t', 's', 'u', 'n', 'u'];
      const W = 48, H = 48, GAP = 10, top = 54, left = (320 - (chars.length * W + (chars.length - 1) * GAP)) / 2;
      const s = svgEl(320, 160), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9 };
      const label = (x, y, text, size = 14, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      label(160, 14, 'name = "tsunu"');
      chars.forEach((ch, i) => {
        const x = left + i * (W + GAP), mid = x + W / 2;
        label(mid, top - 14, `[${i}]`, 12, true);
        s.append(rc.rectangle(x, top, W, H, { ...line, seed: 21 + i, fill: i === 0 ? NEW : FILL, fillStyle: 'solid' }));
        label(mid, top + H / 2, ch, 22);
        label(mid, top + H + 16, String(ch.charCodeAt(0)), 14);
      });
      label(160, 146, '電腦存的是下面這排數字（ASCII 編號）', 12, true);
      return s;
    },
    code: {
      c: `#include <stdio.h>
#include <string.h>

int main(void) {
    char name[] = "tsunu0824";
    int code = 'A';                         // 字元存的是數字：'A' 是 65
    char upper = 't' - 'a' + 'A';           // 小寫轉大寫：跟 'a' 差幾號，就跟 'A' 差幾號
    int n = strlen(name);                   // 長度：從頭數到結尾的 '\\0'

    char head[6];                           // 取前 5 個字：C 要自己一格一格複製，最後補 '\\0'
    for (int i = 0; i < 5; i++) {
        head[i] = name[i];
    }
    head[5] = '\\0';

    int vowels = 0;
    for (int i = 0; i < n; i++) {           // 走訪每一個字，數母音
        char c = name[i];
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            vowels += 1;
        }
    }

    printf("%d %c %d %s %d\\n", code, upper, n, head, vowels);
    return 0;
}
`,
      cpp: `#include <iostream>
#include <string>

int main() {
    std::string name = "tsunu0824";
    int code = 'A';                         // 字元存的是數字：'A' 是 65
    char upper = 't' - 'a' + 'A';           // 小寫轉大寫：跟 'a' 差幾號，就跟 'A' 差幾號
    int n = name.length();                  // 長度：std::string 自己記著

    std::string head = name.substr(0, 5);   // 取前 5 個字：從第 0 格開始取 5 個

    int vowels = 0;
    for (int i = 0; i < n; i++) {           // 走訪每一個字，數母音
        char c = name[i];
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            vowels += 1;
        }
    }

    std::cout << code << " " << upper << " " << n << " " << head << " " << vowels << "\\n";
    return 0;
}
`,
      java: `public class Main {
    public static void main(String[] args) {
        String name = "tsunu0824";
        int code = 'A';                         // 字元存的是數字：'A' 是 65
        char upper = (char) ('t' - 'a' + 'A');  // 小寫轉大寫：算完是 int，要轉回 char
        int n = name.length();                  // 長度：String 自己記著

        String head = name.substring(0, 5);     // 取前 5 個字：從第 0 格取到第 5 格之前

        int vowels = 0;
        for (int i = 0; i < n; i++) {           // 走訪每一個字，數母音
            char c = name.charAt(i);
            if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
                vowels += 1;
            }
        }

        System.out.println(code + " " + upper + " " + n + " " + head + " " + vowels);
    }
}
`,
      python: `name = "tsunu0824"
code = ord('A')                          # 字元存的是數字：ord 把 'A' 變成 65
upper = chr(ord('t') - ord('a') + ord('A'))   # 小寫轉大寫：算完是數字，chr 變回字
n = len(name)                            # 長度

head = name[0:5]                         # 取前 5 個字：切片，從第 0 格取到第 5 格之前

vowels = 0
for c in name:                           # 走訪每一個字，數母音
    if c == 'a' or c == 'e' or c == 'i' or c == 'o' or c == 'u':
        vowels += 1

print(code, upper, n, head, vowels)
`,
      output: '65 T 9 tsunu 2',
    },
    // 跑幾步：取一個字是一步，凡是要從頭看到尾的都跟長度一起長
    cost: {
      rows: [
        ['取第 i 個字 name[i]（追蹤器的 first = name[0]）', '1 次，O(1)'],
        ['問長度：C++／Java／Python 記在旁邊', '1 次，O(1)'],
        ['問長度：C 的 strlen 從頭數到 \'\\0\'', 'n 次，O(n)'],
        ['走訪一遍、數字元（實作數母音時 n = 9，if 檢查 9 次）', 'n 次，O(n)'],
        ['比較兩個字串：一個字一個字比，最壞比到最後一個', '最多 n 次，O(n)'],
      ],
      note: { text: '數出每一行跑幾次，再看次數跟著字串長度 n 怎麼長，就是時間複雜度。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '下面這段程式印出什麼？',
        code: {
          c: `char c = 'A' + 2;
printf("%c\\n", c);`,
          cpp: `char c = 'A' + 2;
std::cout << c << "\\n";`,
          java: `char c = (char) ('A' + 2);
System.out.println(c);`,
          python: `c = chr(ord('A') + 2)
print(c)`,
        },
        options: ['67', 'A2', 'C', '錯誤，字母不能加數字'],
        answer: 2,
        why: '\'A\' 存的是 65，加 2 是 67，印成字元（C 的 %c、Python 的 chr）就是編號 67 的字 C。字元不會黏成 A2，那是字串的接法；把它當整數印（C 的 %d、Python 不加 chr）才會看到 67；字元就是數字，所以加法不會錯。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    char c = \'A\' + 2;\n    printf("%c\\n", c);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    char c = \'A\' + 2;\n    std::cout << c << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        char c = (char) (\'A\' + 2);\n        System.out.println(c);\n    }\n}\n',
          python: 'c = chr(ord(\'A\') + 2)\nprint(c)\n',
        },
        output: 'C',
      },
      {
        kind: '解析計算邏輯',
        prompt: 's 是一個字串。這段程式跑完，count 是什麼？',
        code: {
          c: `int count = 0;
for (int i = 0; i < strlen(s); i++) {
    if ('A' <= s[i] && s[i] <= 'Z') {
        count += 1;
    }
}`,
          cpp: `int count = 0;
for (int i = 0; i < s.length(); i++) {
    if ('A' <= s[i] && s[i] <= 'Z') {
        count += 1;
    }
}`,
          java: `int count = 0;
for (int i = 0; i < s.length(); i++) {
    if ('A' <= s.charAt(i) && s.charAt(i) <= 'Z') {
        count += 1;
    }
}`,
          python: `count = 0
for i in range(len(s)):
    if 'A' <= s[i] and s[i] <= 'Z':
        count += 1`,
        },
        options: ['s 裡有幾個英文字母', 's 裡有幾個大寫字母', 's 的長度', '第一個大寫字母在第幾格'],
        answer: 1,
        why: '\'A\' 到 \'Z\' 是 65 到 90，條件問的是這個字的編號在不在這段裡，也就是是不是大寫字母，每中一個就加 1。s = "HeLLo" 時印出 3（H、L、L）。要數所有英文字母得再加上 \'a\' 到 \'z\' 那段，會是 5；長度是 5，不用判斷就有；要記位置會寫 count = i，不是加 1。',
        program: {
          c: '#include <stdio.h>\n#include <string.h>\nint main(void) {\n    char s[] = "HeLLo";\n    int count = 0;\n    for (int i = 0; i < strlen(s); i++) {\n        if (\'A\' <= s[i] && s[i] <= \'Z\') {\n            count += 1;\n        }\n    }\n    printf("%d\\n", count);\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <string>\nint main() {\n    std::string s = "HeLLo";\n    int count = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (\'A\' <= s[i] && s[i] <= \'Z\') {\n            count += 1;\n        }\n    }\n    std::cout << count << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        String s = "HeLLo";\n        int count = 0;\n        for (int i = 0; i < s.length(); i++) {\n            if (\'A\' <= s.charAt(i) && s.charAt(i) <= \'Z\') {\n                count += 1;\n            }\n        }\n        System.out.println(count);\n    }\n}\n',
          python: 's = "HeLLo"\ncount = 0\nfor i in range(len(s)):\n    if \'A\' <= s[i] and s[i] <= \'Z\':\n        count += 1\nprint(count)\n',
        },
        output: '3',
      },
      {
        kind: '程式測試與除錯',
        prompt: '想把字元 \'7\' 變成數字 7，結果印出 48。要怎麼改？',
        code: {
          c: `char c = '7';
int d = c - 7;
printf("%d\\n", d);`,
          cpp: `char c = '7';
int d = c - 7;
std::cout << d << "\\n";`,
          java: `char c = '7';
int d = c - 7;
System.out.println(d);`,
          python: `c = '7'
d = ord(c) - 7
print(d)`,
        },
        options: ['把減掉的 7 改成 1', '把減掉的 7 改成 0', '把減改成加', '把減掉的 7 改成 \'0\''],
        answer: 3,
        why: '\'7\' 存的是編號 55，55 − 7 才會是 48。數字字元連號，\'0\' 是 48，所以 c - \'0\'（Python 寫 ord(c) - ord(\'0\')）就是 55 − 48 = 7。減 0 還是 55；加 7 是 62；減 1 是 54。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    char c = \'7\';\n    int d = c - 7;\n    printf("%d\\n", d);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    char c = \'7\';\n    int d = c - 7;\n    std::cout << d << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        char c = \'7\';\n        int d = c - 7;\n        System.out.println(d);\n    }\n}\n',
          python: 'c = \'7\'\nd = ord(c) - 7\nprint(d)\n',
        },
        output: '48',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'strings', page);
})(typeof window !== 'undefined' ? window : globalThis);
