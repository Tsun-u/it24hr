// classroom/programming/structs.js — APCS 程式設計「自訂資料型態」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '你要用程式管理全班的通訊錄，每個人有姓名、學號、電話和成績，怎麼存？',
    // 複習：用前面學過的陣列硬做，排序時出包，這頁的概念上場；quote 是講義自己說的那句，也就是自訂資料型態的核心想法
    review: [
      '我們前面學了陣列，最直覺的做法是開四個陣列：names、ids、phones、scores，第 i 格都是同一個人。照成績排序時，四個陣列要一起搬，你在第三個陣列的交換漏了一行，結果 5 號同學的電話變成 12 號的。一個人的資料明明是一組，為什麼要拆成四個陣列分開放？',
      { quote: '自訂資料型態讓一個人的資料待在一起。' },
    ],
    summary: '把姓名、學號、電話、成績包成一個 Student，全班就是一個 Student 的陣列：排序時整筆一起搬，5 號同學的電話不會再跑到 12 號那裡。下次碰到幾個值總是一起出現，你就知道：替它們做一個自己的資料型態，讓它們待在一起。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      'C 的 typedef：寫成 typedef struct { char name[10]; int score; } Student; 之後，宣告就能省掉 struct，直接寫 Student a;，跟 C++ 一樣。',
      'C++ 的 struct 也能放函式，跟 class 幾乎一樣，差別只在沒寫 public、private 的時候：struct 的成員預設是 public，class 預設是 private。',
      'Python 的 @dataclass(order=True) 會照欄位的順序幫你寫好比大小，Student 的串列就能直接 sorted(cls)：先比 name，name 一樣再比 score。想照成績排，寫 sorted(cls, key=lambda s: s.score) 比較清楚。',
    ],
    uses: [
      '手機的聯絡人：一個人有名字、電話、生日、大頭貼，點開一個人，整張卡片的資料一起出來，不會點了小明卻跑出小華的電話。',
      '購物車：每一項有品名、單價、數量，算總價就是一項一項把單價乘數量加起來；刪掉一項，三個欄位一起不見。',
      '遊戲角色：每個角色有名字、血量、攻擊力、座標，一場戰鬥就是一個角色型態的陣列；被打到時改的是那個角色的血量欄位。',
      { text: '電腦內部：檔案系統替每個檔案記名稱、大小、修改時間；資料結構的鏈結串列，每個節點也是一個自訂資料型態，裡面放一個值和「下一個節點在哪」。', see: 'ds/linked_list' },
    ],
    concept: [
      '自訂資料型態（user-defined type）把幾個總是一起出現的值包成一個新的型態，裡面的每個值叫欄位（field）。通訊錄的一個人有姓名、學號、電話、成績四個欄位，包成一個 Student，一個變數就裝得下一整個人，不用再靠「第 i 格都是同一個人」把四個陣列綁在一起。C、C++ 寫 struct（結構）；Java 寫一個只放欄位的 class（類別），再加一個建構子（constructor）一次把欄位填好；Python 也是 class，加上 @dataclass 就不用自己寫建構子。',
      '定義只是設計圖：struct Student { char name[10]; int score; }; 說的是「一筆學生資料長這樣」，像一張還沒填的報名表，本身不是任何一個學生。要再宣告或建立，才真的有一筆資料：C 寫 struct Student a = {"Amy", 72};（照欄位的順序放值），C++ 可以省掉 struct，Java 寫 new Student("Amy", 72)，Python 寫 Student("Amy", 72)。同一張設計圖可以建立很多筆，每一筆的欄位各自一份。',
      '用點（.）取欄位：a.name 是 a 的姓名、a.score 是 a 的成績，可以讀也可以改（a.score = a.score + 1）。整筆也可以一次交給另一個變數：追蹤器裡的 t = a、a = b、b = t 搬的是整張卡片，名字和成績不會分家。',
      { text: '放進陣列：Student cls[30] 一格一個人，cls[i].score 是第 i 個人的成績、cls[i].name 是他的名字。排序時比的是 cls[j].score，交換的是整筆 cls[j]，四個陣列要一起搬的麻煩就不見了。排序的方法有很多種，資料結構那邊有一頁專門比較。', see: 'ds/sorting' },
      '指定和傳進函式有一個語言差別：C、C++ 的 b = a 是把每個欄位複製一份給 b，之後兩筆各改各的；Java、Python 的 b = a 是讓 b 指著同一個物件，改 b.score，a.score 也跟著變。傳進函式也一樣：C、C++ 傳的是複本，Java、Python 傳的是同一個物件。',
    ],
    traps: [
      { wrong: 'b = a 之後改 b.score，a 不會跟著變', right: 'C、C++ 是這樣，b 是複製出來的一份。Java、Python 的 b = a 是讓 b 指著同一個物件，改 b.score，a.score 也變了；要一份獨立的複本，Java 自己再 new 一個，Python 用 copy.copy(a)。' },
      { wrong: '定義好 struct Student，就有一個 Student 可以用', right: '定義只是型態，說明一筆資料有哪些欄位；要再宣告 struct Student a;，或 Java 的 new Student(…)、Python 的 Student(…)，才真的有一筆資料可以填。' },
      { wrong: 'C 的兩個 struct 可以用 == 比一不一樣', right: 'C 不能拿整個 struct 用 ==，編譯就會錯，要一個欄位一個欄位比（字串欄位用 strcmp）。C++ 也要自己寫 operator== 才能比。' },
      { wrong: 'Java、Python 的 == 比的是兩筆資料的欄位一不一樣', right: 'Java 的 == 比的是是不是同一個物件：兩個欄位一模一樣、各自 new 出來的 Student，== 也是 false。Python 一般的 class 也一樣，但 @dataclass 會幫你寫好比欄位的 ==，所以 Student("Amy", 72) == Student("Amy", 72) 是 True。' },
      { wrong: 'Python 寫了 name: str，放錯型態就會報錯', right: '型態標註只是寫給人和工具看的，Student(72, "Amy") 照樣建得起來，名字和成績就這樣對調了。C、C++、Java 的欄位型態編譯時會檢查。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{s}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    // Python 第 1 行的 import 對到 C／C++ 的 #include、Java 的 Student 定義那行；第 4 行 class Student: 對到 struct／class 定義那行
    trace: {
      inputs: [{ label: 'Amy 72 分', values: { s: 72 } }, { label: 'Amy 98 分', values: { s: 98 } }],
      code: {
        c: `#include <stdio.h>

struct Student {
    char name[10];
    int score;
};

int main(void) {
    struct Student a = {"Amy", {{s}}};
    struct Student b = {"Ben", 95};
    if (a.score < b.score) {
        struct Student t = a;
        a = b;
        b = t;
    }
    printf("%s %d\\n", a.name, a.score);
    return 0;
}
`,
        cpp: `#include <iostream>
#include <string>

struct Student {
    std::string name;
    int score;
};

int main() {
    Student a = {"Amy", {{s}}};
    Student b = {"Ben", 95};
    if (a.score < b.score) {
        Student t = a;
        a = b;
        b = t;
    }
    std::cout << a.name << " " << a.score << "\\n";
    return 0;
}
`,
        java: `class Student {
    String name;
    int score;

    Student(String name, int score) {
        this.name = name;
        this.score = score;
    }
}

public class Main {
    public static void main(String[] args) {
        Student a = new Student("Amy", {{s}});
        Student b = new Student("Ben", 95);
        if (a.score < b.score) {
            Student t = a;
            a = b;
            b = t;
        }
        System.out.println(a.name + " " + a.score);
    }
}
`,
        python: `from dataclasses import dataclass

@dataclass
class Student:
    name: str
    score: int

a = Student("Amy", {{s}})
b = Student("Ben", 95)
if a.score < b.score:
    t = a
    a = b
    b = t
print(a.name, a.score)
`,
      },
      lines: {
        c: { 1: 1, 4: 3, 8: 9, 9: 10, 10: 11, 11: 12, 12: 13, 13: 14, 14: 16 },
        cpp: { 1: 1, 4: 4, 8: 10, 9: 11, 10: 12, 11: 13, 12: 14, 13: 15, 14: 17 },
        java: { 1: 1, 4: 1, 8: 13, 9: 14, 10: 15, 11: 16, 12: 17, 13: 18, 14: 20 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "Amy 72 分": [
        {"line":1,"vars":{},"out":""},
        {"line":4,"vars":{},"out":"","def":"Student"},
        {"line":8,"vars":{"a":{"__type":"Student","name":"Amy","score":72}},"out":""},
        {"line":9,"vars":{"a":{"__type":"Student","name":"Amy","score":72},"b":{"__type":"Student","name":"Ben","score":95}},"out":""},
        {"line":10,"vars":{"a":{"__type":"Student","name":"Amy","score":72},"b":{"__type":"Student","name":"Ben","score":95}},"out":"","cond":true},
        {"line":11,"vars":{"a":{"__type":"Student","name":"Amy","score":72},"b":{"__type":"Student","name":"Ben","score":95},"t":{"__type":"Student","name":"Amy","score":72}},"out":""},
        {"line":12,"vars":{"a":{"__type":"Student","name":"Ben","score":95},"b":{"__type":"Student","name":"Ben","score":95},"t":{"__type":"Student","name":"Amy","score":72}},"out":""},
        {"line":13,"vars":{"a":{"__type":"Student","name":"Ben","score":95},"b":{"__type":"Student","name":"Amy","score":72},"t":{"__type":"Student","name":"Amy","score":72}},"out":""},
        {"line":14,"vars":{"a":{"__type":"Student","name":"Ben","score":95},"b":{"__type":"Student","name":"Amy","score":72},"t":{"__type":"Student","name":"Amy","score":72}},"out":"Ben 95\n"},
      ],
      "Amy 98 分": [
        {"line":1,"vars":{},"out":""},
        {"line":4,"vars":{},"out":"","def":"Student"},
        {"line":8,"vars":{"a":{"__type":"Student","name":"Amy","score":98}},"out":""},
        {"line":9,"vars":{"a":{"__type":"Student","name":"Amy","score":98},"b":{"__type":"Student","name":"Ben","score":95}},"out":""},
        {"line":10,"vars":{"a":{"__type":"Student","name":"Amy","score":98},"b":{"__type":"Student","name":"Ben","score":95}},"out":"","cond":false},
        {"line":14,"vars":{"a":{"__type":"Student","name":"Amy","score":98},"b":{"__type":"Student","name":"Ben","score":95}},"out":"Amy 98\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：左邊是四條分開的陣列，第 0 格都是 Amy；右邊是一張張學生卡片，一張卡就是一個人的全部資料。Amy 那一欄和 Amy 那張卡上黃色
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const people = [
        { name: 'Amy', id: '1', phone: '0912', score: '72' },
        { name: 'Ben', id: '2', phone: '0928', score: '95' },
        { name: 'Cat', id: '3', phone: '0933', score: '88' },
      ];
      const arrays = [['names', 'name'], ['ids', 'id'], ['phones', 'phone'], ['scores', 'score']];
      const s = svgEl(320, 240), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.4, roughness: 0.9 };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      // 左邊：四條陣列，一條一列，每列三格
      const CW = 32, CH = 28, labelW = 48, top = 40, rowGap = 10;
      label(80, 14, '分開放：四個陣列', 13);
      arrays.forEach(([title, key], r) => {
        const y = top + r * (CH + rowGap);
        label(labelW / 2, y + CH / 2, title, 11, true);
        people.forEach((p, i) => {
          const x = labelW + i * CW;
          s.append(rc.rectangle(x, y, CW, CH, { ...line, seed: 31 + r * 3 + i, fill: i === 0 ? NEW : FILL, fillStyle: 'solid' }));
          label(x + CW / 2, y + CH / 2, p[key], 11);
        });
      });
      label(96, top + 4 * (CH + rowGap) + 6, '第 0 格湊起來才是 Amy', 11, true);
      // 右邊：三張卡片，一張一個人
      const cardX = 176, cardW = 136, cardH = 58, cardGap = 8;
      label(cardX + cardW / 2, 14, '包在一起：一張卡一個人', 13);
      people.forEach((p, i) => {
        const y = top + i * (cardH + cardGap);
        s.append(rc.rectangle(cardX, y, cardW, cardH, { ...line, seed: 51 + i, fill: i === 0 ? NEW : FILL, fillStyle: 'solid' }));
        label(cardX + cardW / 2, y + 13, `Student ${p.name}`, 12);
        label(cardX + cardW / 2, y + 31, `學號 ${p.id}　電話 ${p.phone}`, 11);
        label(cardX + cardW / 2, y + 46, `成績 ${p.score}`, 11);
      });
      return s;
    },
    code: {
      c: `#include <stdio.h>

struct Student {                            // 定義只是設計圖：一筆學生資料有哪些欄位
    char name[10];
    int score;
};

int main(void) {
    struct Student cls[3] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}};   // 宣告三筆，照欄位的順序填值
    int n = 3;

    for (int i = 0; i < n - 1; i++) {       // 泡泡排序，由高到低
        for (int j = 0; j < n - 1 - i; j++) {
            if (cls[j].score < cls[j + 1].score) {   // 用 . 取欄位：比的是成績
                struct Student t = cls[j];  // 換的是整筆：名字和成績一起搬
                cls[j] = cls[j + 1];
                cls[j + 1] = t;
            }
        }
    }

    printf("%s %s %s\\n", cls[0].name, cls[1].name, cls[2].name);
    return 0;
}
`,
      cpp: `#include <iostream>
#include <string>

struct Student {                            // 定義只是設計圖：一筆學生資料有哪些欄位
    std::string name;
    int score;
};

int main() {
    Student cls[3] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}};   // 宣告三筆，C++ 可以省掉 struct
    int n = 3;

    for (int i = 0; i < n - 1; i++) {       // 泡泡排序，由高到低
        for (int j = 0; j < n - 1 - i; j++) {
            if (cls[j].score < cls[j + 1].score) {   // 用 . 取欄位：比的是成績
                Student t = cls[j];         // 換的是整筆：名字和成績一起搬
                cls[j] = cls[j + 1];
                cls[j + 1] = t;
            }
        }
    }

    std::cout << cls[0].name << " " << cls[1].name << " " << cls[2].name << "\\n";
    return 0;
}
`,
      java: `class Student {                                 // 只放欄位的 class，加一個建構子一次填好
    String name;
    int score;

    Student(String name, int score) {
        this.name = name;
        this.score = score;
    }
}

public class Main {
    public static void main(String[] args) {
        Student[] cls = {new Student("Amy", 72), new Student("Ben", 95), new Student("Cat", 88)};
        int n = 3;

        for (int i = 0; i < n - 1; i++) {       // 泡泡排序，由高到低
            for (int j = 0; j < n - 1 - i; j++) {
                if (cls[j].score < cls[j + 1].score) {   // 用 . 取欄位：比的是成績
                    Student t = cls[j];         // 換的是整筆：名字和成績一起搬
                    cls[j] = cls[j + 1];
                    cls[j + 1] = t;
                }
            }
        }

        System.out.println(cls[0].name + " " + cls[1].name + " " + cls[2].name);
    }
}
`,
      python: `from dataclasses import dataclass

@dataclass                               # 自動寫好建構子：Student("Amy", 72) 照順序填 name、score
class Student:                           # 定義只是設計圖：一筆學生資料有哪些欄位
    name: str
    score: int

cls = [Student("Amy", 72), Student("Ben", 95), Student("Cat", 88)]
n = 3

for i in range(n - 1):                   # 泡泡排序，由高到低
    for j in range(n - 1 - i):
        if cls[j].score < cls[j + 1].score:   # 用 . 取欄位：比的是成績
            t = cls[j]                   # 換的是整筆：名字和成績一起搬
            cls[j] = cls[j + 1]
            cls[j + 1] = t

print(cls[0].name, cls[1].name, cls[2].name)
`,
      output: 'Ben Cat Amy',
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: 'Student 有 name、score 兩個欄位。下面這段程式印出什麼？',
        code: {
          c: `struct Student cls[4] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}, {"Dan", 95}};
int best = 0;
for (int i = 1; i < 4; i++) {
    if (cls[i].score > cls[best].score) {
        best = i;
    }
}
printf("%s\\n", cls[best].name);`,
          cpp: `Student cls[4] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}, {"Dan", 95}};
int best = 0;
for (int i = 1; i < 4; i++) {
    if (cls[i].score > cls[best].score) {
        best = i;
    }
}
std::cout << cls[best].name << "\\n";`,
          java: `Student[] cls = {new Student("Amy", 72), new Student("Ben", 95), new Student("Cat", 88), new Student("Dan", 95)};
int best = 0;
for (int i = 1; i < 4; i++) {
    if (cls[i].score > cls[best].score) {
        best = i;
    }
}
System.out.println(cls[best].name);`,
          python: `cls = [Student("Amy", 72), Student("Ben", 95), Student("Cat", 88), Student("Dan", 95)]
best = 0
for i in range(1, 4):
    if cls[i].score > cls[best].score:
        best = i
print(cls[best].name)`,
        },
        options: ['Amy', 'Ben', 'Cat', 'Dan'],
        answer: 1,
        why: 'best 先記第 0 格的 Amy（72）。i = 1 時 Ben 的 95 比 72 大，best 換成 1；Cat 的 88 沒有比 95 大；Dan 也是 95，可是 > 要比較大才換，一樣大不換，best 停在 1，印出 Ben。條件寫成 >= 才會換成最後一個 95 分的 Dan；Amy 是一個都沒比的時候；Cat 是第二高分。',
        program: {
          c: `#include <stdio.h>
struct Student {
    char name[10];
    int score;
};
int main(void) {
    struct Student cls[4] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}, {"Dan", 95}};
    int best = 0;
    for (int i = 1; i < 4; i++) {
        if (cls[i].score > cls[best].score) {
            best = i;
        }
    }
    printf("%s\\n", cls[best].name);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <string>
struct Student {
    std::string name;
    int score;
};
int main() {
    Student cls[4] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}, {"Dan", 95}};
    int best = 0;
    for (int i = 1; i < 4; i++) {
        if (cls[i].score > cls[best].score) {
            best = i;
        }
    }
    std::cout << cls[best].name << "\\n";
}
`,
          java: `class Student {
    String name;
    int score;
    Student(String name, int score) {
        this.name = name;
        this.score = score;
    }
}
public class Main {
    public static void main(String[] args) {
        Student[] cls = {new Student("Amy", 72), new Student("Ben", 95), new Student("Cat", 88), new Student("Dan", 95)};
        int best = 0;
        for (int i = 1; i < 4; i++) {
            if (cls[i].score > cls[best].score) {
                best = i;
            }
        }
        System.out.println(cls[best].name);
    }
}
`,
          python: `from dataclasses import dataclass
@dataclass
class Student:
    name: str
    score: int
cls = [Student("Amy", 72), Student("Ben", 95), Student("Cat", 88), Student("Dan", 95)]
best = 0
for i in range(1, 4):
    if cls[i].score > cls[best].score:
        best = i
print(cls[best].name)
`,
        },
        output: 'Ben',
      },
      {
        kind: '程式填空',
        prompt: '想把三個學生照成績由高到低排好，印出 Ben Cat Amy。____ 要填什麼？',
        code: {
          c: `struct Student cls[3] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}};
for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2 - i; j++) {
        if (____) {
            struct Student t = cls[j];
            cls[j] = cls[j + 1];
            cls[j + 1] = t;
        }
    }
}
printf("%s %s %s\\n", cls[0].name, cls[1].name, cls[2].name);`,
          cpp: `Student cls[3] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}};
for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2 - i; j++) {
        if (____) {
            Student t = cls[j];
            cls[j] = cls[j + 1];
            cls[j + 1] = t;
        }
    }
}
std::cout << cls[0].name << " " << cls[1].name << " " << cls[2].name << "\\n";`,
          java: `Student[] cls = {new Student("Amy", 72), new Student("Ben", 95), new Student("Cat", 88)};
for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2 - i; j++) {
        if (____) {
            Student t = cls[j];
            cls[j] = cls[j + 1];
            cls[j + 1] = t;
        }
    }
}
System.out.println(cls[0].name + " " + cls[1].name + " " + cls[2].name);`,
          python: `cls = [Student("Amy", 72), Student("Ben", 95), Student("Cat", 88)]
for i in range(2):
    for j in range(2 - i):
        if ____:
            t = cls[j]
            cls[j] = cls[j + 1]
            cls[j + 1] = t
print(cls[0].name, cls[1].name, cls[2].name)`,
        },
        options: ['cls[j].score > cls[j + 1].score', 'cls[j] < cls[j + 1]', 'cls[i].score < cls[j + 1].score', 'cls[j].score < cls[j + 1].score'],
        answer: 3,
        why: '由高到低排，左邊那格的成績比右邊小就要換：cls[j].score < cls[j + 1].score；換的時候整筆 cls[j] 一起搬，印出 Ben Cat Amy。用 > 是左邊比較大才換，排成由低到高，印出 Amy Cat Ben；cls[j] < cls[j + 1] 拿整筆比大小，C、C++、Java 編譯不過，Python 的 dataclass 也會報 TypeError，要講明比哪個欄位；cls[i] 拿的是外圈的 i，比錯了格子，印出 Ben Amy Cat。',
        // 驗算用的程式把空格 ____ 當成一個變數，在 if 前一行填進正解
        program: {
          c: `#include <stdio.h>
struct Student {
    char name[10];
    int score;
};
int main(void) {
    struct Student cls[3] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}};
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2 - i; j++) {
            int ____ = cls[j].score < cls[j + 1].score;
            if (____) {
                struct Student t = cls[j];
                cls[j] = cls[j + 1];
                cls[j + 1] = t;
            }
        }
    }
    printf("%s %s %s\\n", cls[0].name, cls[1].name, cls[2].name);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <string>
struct Student {
    std::string name;
    int score;
};
int main() {
    Student cls[3] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}};
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2 - i; j++) {
            bool ____ = cls[j].score < cls[j + 1].score;
            if (____) {
                Student t = cls[j];
                cls[j] = cls[j + 1];
                cls[j + 1] = t;
            }
        }
    }
    std::cout << cls[0].name << " " << cls[1].name << " " << cls[2].name << "\\n";
}
`,
          java: `class Student {
    String name;
    int score;
    Student(String name, int score) {
        this.name = name;
        this.score = score;
    }
}
public class Main {
    public static void main(String[] args) {
        Student[] cls = {new Student("Amy", 72), new Student("Ben", 95), new Student("Cat", 88)};
        for (int i = 0; i < 2; i++) {
            for (int j = 0; j < 2 - i; j++) {
                boolean ____ = cls[j].score < cls[j + 1].score;
                if (____) {
                    Student t = cls[j];
                    cls[j] = cls[j + 1];
                    cls[j + 1] = t;
                }
            }
        }
        System.out.println(cls[0].name + " " + cls[1].name + " " + cls[2].name);
    }
}
`,
          python: `from dataclasses import dataclass
@dataclass
class Student:
    name: str
    score: int
cls = [Student("Amy", 72), Student("Ben", 95), Student("Cat", 88)]
for i in range(2):
    for j in range(2 - i):
        ____ = cls[j].score < cls[j + 1].score
        if ____:
            t = cls[j]
            cls[j] = cls[j + 1]
            cls[j + 1] = t
print(cls[0].name, cls[1].name, cls[2].name)
`,
        },
        output: 'Ben Cat Amy',
      },
      {
        kind: '程式測試與除錯',
        prompt: '想照成績由高到低排好，再印出第一名和他的分數，應該是 Ben 95，結果印出 Amy 95。要怎麼改？',
        code: {
          c: `struct Student cls[3] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}};
for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2 - i; j++) {
        if (cls[j].score < cls[j + 1].score) {
            int t = cls[j].score;
            cls[j].score = cls[j + 1].score;
            cls[j + 1].score = t;
        }
    }
}
printf("%s %d\\n", cls[0].name, cls[0].score);`,
          cpp: `Student cls[3] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}};
for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2 - i; j++) {
        if (cls[j].score < cls[j + 1].score) {
            int t = cls[j].score;
            cls[j].score = cls[j + 1].score;
            cls[j + 1].score = t;
        }
    }
}
std::cout << cls[0].name << " " << cls[0].score << "\\n";`,
          java: `Student[] cls = {new Student("Amy", 72), new Student("Ben", 95), new Student("Cat", 88)};
for (int i = 0; i < 2; i++) {
    for (int j = 0; j < 2 - i; j++) {
        if (cls[j].score < cls[j + 1].score) {
            int t = cls[j].score;
            cls[j].score = cls[j + 1].score;
            cls[j + 1].score = t;
        }
    }
}
System.out.println(cls[0].name + " " + cls[0].score);`,
          python: `cls = [Student("Amy", 72), Student("Ben", 95), Student("Cat", 88)]
for i in range(2):
    for j in range(2 - i):
        if cls[j].score < cls[j + 1].score:
            t = cls[j].score
            cls[j].score = cls[j + 1].score
            cls[j + 1].score = t
print(cls[0].name, cls[0].score)`,
        },
        options: ['把 < 改成 >', '印出那行改成印 cls[2]', '整筆交換：t = cls[j]、cls[j] = cls[j + 1]、cls[j + 1] = t', '外圈多跑一圈'],
        answer: 2,
        why: '交換時只換了 score，名字留在原地：成績排成 95、88、72，名字還是 Amy、Ben、Cat，第一格就變成 Amy 95，跟複習裡 5 號同學的電話跑到 12 號那裡是同一種錯。整筆交換（C 寫 struct Student t = cls[j];），名字和成績一起搬，第一格才是 Ben 95。改成 > 會變成由低到高、印出 Amy 72，名字和分數剛好對得上，但那是最低分；印 cls[2] 會印出 Cat 72；外圈多跑一圈也只是多比一次成績，還是 Amy 95。',
        program: {
          c: `#include <stdio.h>
struct Student {
    char name[10];
    int score;
};
int main(void) {
    struct Student cls[3] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}};
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2 - i; j++) {
            if (cls[j].score < cls[j + 1].score) {
                int t = cls[j].score;
                cls[j].score = cls[j + 1].score;
                cls[j + 1].score = t;
            }
        }
    }
    printf("%s %d\\n", cls[0].name, cls[0].score);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <string>
struct Student {
    std::string name;
    int score;
};
int main() {
    Student cls[3] = {{"Amy", 72}, {"Ben", 95}, {"Cat", 88}};
    for (int i = 0; i < 2; i++) {
        for (int j = 0; j < 2 - i; j++) {
            if (cls[j].score < cls[j + 1].score) {
                int t = cls[j].score;
                cls[j].score = cls[j + 1].score;
                cls[j + 1].score = t;
            }
        }
    }
    std::cout << cls[0].name << " " << cls[0].score << "\\n";
}
`,
          java: `class Student {
    String name;
    int score;
    Student(String name, int score) {
        this.name = name;
        this.score = score;
    }
}
public class Main {
    public static void main(String[] args) {
        Student[] cls = {new Student("Amy", 72), new Student("Ben", 95), new Student("Cat", 88)};
        for (int i = 0; i < 2; i++) {
            for (int j = 0; j < 2 - i; j++) {
                if (cls[j].score < cls[j + 1].score) {
                    int t = cls[j].score;
                    cls[j].score = cls[j + 1].score;
                    cls[j + 1].score = t;
                }
            }
        }
        System.out.println(cls[0].name + " " + cls[0].score);
    }
}
`,
          python: `from dataclasses import dataclass
@dataclass
class Student:
    name: str
    score: int
cls = [Student("Amy", 72), Student("Ben", 95), Student("Cat", 88)]
for i in range(2):
    for j in range(2 - i):
        if cls[j].score < cls[j + 1].score:
            t = cls[j].score
            cls[j].score = cls[j + 1].score
            cls[j + 1].score = t
print(cls[0].name, cls[0].score)
`,
        },
        output: 'Amy 95',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'structs', page);
})(typeof window !== 'undefined' ? window : globalThis);
