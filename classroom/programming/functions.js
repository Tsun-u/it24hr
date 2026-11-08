// classroom/programming/functions.js — APCS 程式設計「函式」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '你幫飲料店寫結帳程式，點餐、結帳、印收據三個地方都要算總價，怎麼寫？',
    // 複習：用前面學過的運算式和迴圈硬做，三個地方各貼一份，改到一半就出錯；quote 是讀者自己想到的那句，也就是函式的核心想法
    review: [
      '我們前面學了運算式和迴圈，最直覺的做法就是把算總價那幾行，在三個地方各貼一份。老闆說：「會員打九折！」你改了三個地方。隔天又說：「學生再折 5 元！」改到第二個地方，客人拿著收據來問：「怎麼跟我付的錢不一樣？」……這時你會不會想：',
      { quote: '要是可以把算總價那幾行取個名字，哪裡要用就叫它，要改只改一個地方就好了。' },
      '很久以前的程式設計師也這麼想過，他們把這個東西叫做函式。',
    ],
    summary: '把算總價的那段寫成一個函式、取名 total，三個地方都叫它；打九折只要改函式裡那一行。下次發現同一段程式寫了好幾次，你就知道：把它寫成函式，要用的時候叫它就好。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      'C 的指標（pointer）：想在函式裡改到外面的變數，就把變數的位址傳過去。呼叫寫 add_one(&x)，函式寫 void add_one(int *p) { *p = *p + 1; }：p 存的是 x 的位址，*p 就是 x 本人，改了它，外面的 x 就變了。scanf("%d", &n) 要寫 &，也是同一個道理：讓 scanf 知道讀到的數字要放進哪裡。',
      'C++ 的參考（reference）寫起來更省事：void add_one(int &x) { x = x + 1; }，呼叫照樣寫 add_one(x)，函式裡的 x 就是外面那個 x 的另一個名字。實作裡的 vector<int>& 也是參考，所以 fill 改得到外面的陣列。',
      'Java 和 Python 沒有指標，函式改不到外面的整數變數。常見的做法是改用回傳值：Java 寫 x = addOne(x)、Python 寫 x = add_one(x)；要改好幾個值，就把它們放進陣列、list 或物件裡傳進去，在函式裡改裡面的格子（實作的 fill 就是這樣）。Python 還可以一次回傳好幾個值：return a, b。',
    ],
    uses: [
      '外送 App 的購物車：加一份、減一份、換大杯、套優惠券，每動一下總價就重算。背後是同一個算總價的函式，每改一次就叫它一次。',
      '遊戲的扣血：被小怪打、被魔王打、踩到陷阱，都叫同一個「扣血」函式。企劃說防禦力的效果要調高，只改這個函式，每一種受傷都跟著變。',
      '前面幾頁用過的 printf、print、len，都是別人寫好的函式：你只要知道放什麼進去、會拿回什麼，不用知道裡面怎麼寫。',
      '電腦內部：程式要開檔案、讀鍵盤、在螢幕上畫一個視窗，都是呼叫作業系統提供的函式；printf 最後也是叫作業系統，把字送到螢幕上。',
    ],
    concept: [
      '函式（function）是一段取了名字的程式，寫一次，哪裡要用就叫它。定義的時候寫三樣東西：名字（total）、參數（parameter，要放進去的值：杯數 cups、是不是會員 member）、回傳值（return value，算完交回來的結果：總價）。C、C++、Java 每一樣都要寫型態：int total(int cups, int member) 是「放進兩個整數、交回一個整數」；什麼都不交回的函式，回傳型態寫 void。Python 寫 def total(cups, member):，不用寫型態。',
      '呼叫（call）是寫名字加括號：total(2, 1)。這時 2 放進 cups、1 放進 member，程式跳進函式從第一行開始跑；跑到 return price，就把 price 的值交回呼叫的地方，a = total(2, 1) 的 a 拿到 90，再接著跑下一行。return 一跑，這次呼叫就結束了，函式裡寫在它後面的程式這次都不會跑。',
      '參數是呼叫時抄過去的一份複本，叫傳值（pass by value）：函式裡改了 cups，外面放進去的那個變數不會變。陣列例外：C 傳過去的是陣列第一格的位址，C++ 寫成 vector<int>& 是同一個陣列，Java 的陣列和 Python 的 list 傳過去是同一個物件，所以函式裡改了 arr[i]，外面看得到。',
      '在函式裡開的變數叫區域變數（local variable），只活在那一次呼叫裡：price 每次呼叫都重新開始，跑完就不見了，主程式也看不到它。寫在所有函式外面的叫全域變數（global variable），每個函式都看得到；可是誰都能改它，出錯時很難找是誰改的，所以能用參數和回傳值傳的，就不用全域變數。',
      { text: '每呼叫一次函式，電腦就疊上一層，記住這一層的參數和區域變數；跑完就拿掉這一層，回到下面那層呼叫它的地方。最後呼叫的最先跑完，這一疊叫呼叫堆疊（call stack），追蹤器裡一層一層疊起來的就是它。資料結構中我們也會再次提到它。', see: 'ds/stack' },
    ],
    traps: [
      { wrong: '在函式裡改了參數，外面的變數也跟著變', right: '參數是呼叫時抄過去的複本，函式裡的 x = x + 1 改的是複本，外面的 x 還是原本的值。陣列例外：C 傳的是第一格的位址、C++ 的 vector<int>& 是同一個、Java 的陣列和 Python 的 list 是同一個物件，函式裡改了 arr[i]，外面看得到（實作的 fill）。' },
      { wrong: '函式裡寫 print 和寫 return 一樣', right: 'print 只是把值印在螢幕上，呼叫的地方拿不到；return 才把值交回去，a = total(2, 1) 的 a 才有東西。Python 的函式沒寫 return，交回來的是 None。' },
      { wrong: 'return 之後的程式還會跑', right: '跑到 return，這次呼叫就結束、馬上回到呼叫的地方，寫在它後面的程式這次都不會跑。實作的 is_prime 找到因數就 return 0，後面的迴圈不用再試。' },
      { wrong: '區域變數下次呼叫還留著上次的值', right: '每次呼叫都是新的一層，區域變數從頭開始：追蹤器裡第二次呼叫 total，price 又是重新算的。C 的 static 區域變數例外，它會留著上一次的值。' },
      { wrong: 'Python 在函式裡寫 count = count + 1，就會改到全域的 count', right: '會報 UnboundLocalError：函式裡只要有指定 count，Python 就把它當成區域變數，讀它的時候它還沒有值。要改全域的，得先在函式裡寫 global count。C、C++ 的函式裡沒有同名的區域變數，用的就是全域的那個，可以直接改。' },
      { wrong: 'C 的函式寫在 main 後面，main 也能直接呼叫', right: 'C 從上往下讀，main 呼叫還沒看到的函式，新版的編譯器直接報錯，舊版只給警告、自己猜它回傳 int，猜錯就算錯。要把函式寫在 main 前面，或在前面先宣告原型：int total(int cups, int member);。C++ 一樣；Java 的方法寫在類別裡哪裡都可以；Python 只要呼叫那一行跑到之前，def 已經跑過就好。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{c}} 換成挑的那組杯數；lines 是 Python 的第幾行對到那種語言的第幾行
    // C、C++、Java 的函式寫在 main 前面，def 那行對到函式的開頭那行
    trace: {
      inputs: [{ label: 'c = 2', values: { c: 2 } }, { label: 'c = 3', values: { c: 3 } }],
      code: {
        c: `#include <stdio.h>

int total(int cups, int member) {
    int price = cups * 50;
    if (member == 1) {
        price = price * 9 / 10;
    }
    return price;
}

int main(void) {
    int a = total({{c}}, 1);
    int b = total({{c}}, 0);
    printf("%d %d\\n", a, b);
    return 0;
}
`,
        cpp: `#include <iostream>

int total(int cups, int member) {
    int price = cups * 50;
    if (member == 1) {
        price = price * 9 / 10;
    }
    return price;
}

int main() {
    int a = total({{c}}, 1);
    int b = total({{c}}, 0);
    std::cout << a << " " << b << "\\n";
    return 0;
}
`,
        java: `public class Main {
    static int total(int cups, int member) {
        int price = cups * 50;
        if (member == 1) {
            price = price * 9 / 10;
        }
        return price;
    }

    public static void main(String[] args) {
        int a = total({{c}}, 1);
        int b = total({{c}}, 0);
        System.out.println(a + " " + b);
    }
}
`,
        python: `def total(cups, member):
    price = cups * 50
    if member == 1:
        price = price * 9 // 10
    return price

a = total({{c}}, 1)
b = total({{c}}, 0)
print(a, b)
`,
      },
      lines: {
        c: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 8, 7: 12, 8: 13, 9: 14 },
        cpp: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 8, 7: 12, 8: 13, 9: 14 },
        java: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 7, 7: 11, 8: 12, 9: 13 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "c = 2": [
        {"line":1,"vars":{},"out":"","def":"total"},
        {"line":7,"vars":{"cups":2,"member":1},"out":"","stack":[{"vars":{}},{"fn":"total","vars":{"cups":2,"member":1}}],"call":"total"},
        {"line":2,"vars":{"cups":2,"member":1,"price":100},"out":"","stack":[{"vars":{}},{"fn":"total","vars":{"cups":2,"member":1,"price":100}}]},
        {"line":3,"vars":{"cups":2,"member":1,"price":100},"out":"","stack":[{"vars":{}},{"fn":"total","vars":{"cups":2,"member":1,"price":100}}],"cond":true},
        {"line":4,"vars":{"cups":2,"member":1,"price":90},"out":"","stack":[{"vars":{}},{"fn":"total","vars":{"cups":2,"member":1,"price":90}}]},
        {"line":5,"vars":{"cups":2,"member":1,"price":90},"out":"","stack":[{"vars":{}},{"fn":"total","vars":{"cups":2,"member":1,"price":90}}],"ret":90},
        {"line":7,"vars":{"a":90},"out":""},
        {"line":8,"vars":{"cups":2,"member":0},"out":"","stack":[{"vars":{"a":90}},{"fn":"total","vars":{"cups":2,"member":0}}],"call":"total"},
        {"line":2,"vars":{"cups":2,"member":0,"price":100},"out":"","stack":[{"vars":{"a":90}},{"fn":"total","vars":{"cups":2,"member":0,"price":100}}]},
        {"line":3,"vars":{"cups":2,"member":0,"price":100},"out":"","stack":[{"vars":{"a":90}},{"fn":"total","vars":{"cups":2,"member":0,"price":100}}],"cond":false},
        {"line":5,"vars":{"cups":2,"member":0,"price":100},"out":"","stack":[{"vars":{"a":90}},{"fn":"total","vars":{"cups":2,"member":0,"price":100}}],"ret":100},
        {"line":8,"vars":{"a":90,"b":100},"out":""},
        {"line":9,"vars":{"a":90,"b":100},"out":"90 100\n"},
      ],
      "c = 3": [
        {"line":1,"vars":{},"out":"","def":"total"},
        {"line":7,"vars":{"cups":3,"member":1},"out":"","stack":[{"vars":{}},{"fn":"total","vars":{"cups":3,"member":1}}],"call":"total"},
        {"line":2,"vars":{"cups":3,"member":1,"price":150},"out":"","stack":[{"vars":{}},{"fn":"total","vars":{"cups":3,"member":1,"price":150}}]},
        {"line":3,"vars":{"cups":3,"member":1,"price":150},"out":"","stack":[{"vars":{}},{"fn":"total","vars":{"cups":3,"member":1,"price":150}}],"cond":true},
        {"line":4,"vars":{"cups":3,"member":1,"price":135},"out":"","stack":[{"vars":{}},{"fn":"total","vars":{"cups":3,"member":1,"price":135}}]},
        {"line":5,"vars":{"cups":3,"member":1,"price":135},"out":"","stack":[{"vars":{}},{"fn":"total","vars":{"cups":3,"member":1,"price":135}}],"ret":135},
        {"line":7,"vars":{"a":135},"out":""},
        {"line":8,"vars":{"cups":3,"member":0},"out":"","stack":[{"vars":{"a":135}},{"fn":"total","vars":{"cups":3,"member":0}}],"call":"total"},
        {"line":2,"vars":{"cups":3,"member":0,"price":150},"out":"","stack":[{"vars":{"a":135}},{"fn":"total","vars":{"cups":3,"member":0,"price":150}}]},
        {"line":3,"vars":{"cups":3,"member":0,"price":150},"out":"","stack":[{"vars":{"a":135}},{"fn":"total","vars":{"cups":3,"member":0,"price":150}}],"cond":false},
        {"line":5,"vars":{"cups":3,"member":0,"price":150},"out":"","stack":[{"vars":{"a":135}},{"fn":"total","vars":{"cups":3,"member":0,"price":150}}],"ret":150},
        {"line":8,"vars":{"a":135,"b":150},"out":""},
        {"line":9,"vars":{"a":135,"b":150},"out":"135 150\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：一台「算總價」的機器。上面三個地方都接到同一台；左邊放進杯數和會員身分，右邊吐出金額
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const s = svgEl(320, 252), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9 };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      // 直線，尾端畫箭頭
      const arrow = (x1, y1, x2, y2, seed) => {
        s.append(rc.line(x1, y1, x2, y2, { ...line, seed }));
        const a = Math.atan2(y2 - y1, x2 - x1), wing = (d) => [x2 - 9 * Math.cos(a + d), y2 - 9 * Math.sin(a + d)];
        s.append(rc.polygon([[x2, y2], wing(0.45), wing(-0.45)], { ...line, seed: seed + 50, fill: INK, fillStyle: 'solid' }));
      };
      // 上面：點餐、結帳、印收據三個地方，都往下接到同一台機器
      [['點餐', 54], ['結帳', 160], ['印收據', 266]].forEach(([name, cx], k) => {
        s.append(rc.rectangle(cx - 44, 8, 88, 34, { ...line, seed: 3 + k, fill: FILL, fillStyle: 'solid' }));
        label(cx, 25, name, 14);
      });
      arrow(54, 42, 126, 110, 11); arrow(160, 42, 160, 110, 12); arrow(266, 42, 194, 110, 13);
      // 中間：算總價的機器
      s.append(rc.rectangle(100, 112, 120, 72, { ...line, seed: 7, fill: NEW, fillStyle: 'solid' }));
      label(160, 138, 'total', 16); label(160, 162, '算總價', 13, true);
      // 左邊放進去的兩個參數、右邊交回來的金額
      label(48, 128, '杯數 cups', 12); arrow(6, 138, 98, 138, 14);
      label(48, 160, '會員 member', 12); arrow(6, 170, 98, 170, 15);
      label(268, 140, '金額', 12); arrow(222, 150, 314, 150, 16);
      label(160, 212, 'total(2, 1) → 90', 14);
      label(160, 236, '三個地方都叫同一台，打九折只改機器裡面', 12, true);
      return s;
    },
    code: {
      c: `#include <stdio.h>

// 回傳三個數裡最大的
int max3(int a, int b, int c) {
    int m = a;
    if (b > m) {
        m = b;
    }
    if (c > m) {
        m = c;
    }
    return m;
}

// n 是質數回傳 1，不是回傳 0
int is_prime(int n) {
    if (n < 2) {
        return 0;
    }
    int d = 2;
    while (d * d <= n) {
        if (n % d == 0) {
            return 0;                       // 找到因數就回傳，後面的迴圈不會再跑
        }
        d += 1;
    }
    return 1;
}

// 傳值：x 是呼叫時抄過來的複本，改了它，外面的 x 不會變
void add_one(int x) {
    x = x + 1;
}

// 陣列傳過來的是第一格的位址，函式裡改了，外面看得到
void fill(int arr[], int n) {
    for (int i = 0; i < n; i++) {
        arr[i] = i * i;
    }
}

int main(void) {
    int x = 5;
    add_one(x);

    int arr[4] = {0, 0, 0, 0};
    fill(arr, 4);

    printf("%d %d %d %d %d\\n", max3(3, 8, 5), is_prime(7), is_prime(9), x, arr[3]);
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// 回傳三個數裡最大的
int max3(int a, int b, int c) {
    int m = a;
    if (b > m) {
        m = b;
    }
    if (c > m) {
        m = c;
    }
    return m;
}

// n 是質數回傳 1，不是回傳 0
int is_prime(int n) {
    if (n < 2) {
        return 0;
    }
    int d = 2;
    while (d * d <= n) {
        if (n % d == 0) {
            return 0;                       // 找到因數就回傳，後面的迴圈不會再跑
        }
        d += 1;
    }
    return 1;
}

// 傳值：x 是呼叫時抄過來的複本，改了它，外面的 x 不會變
void add_one(int x) {
    x = x + 1;
}

// vector<int>& 是參考：函式裡的 arr 就是外面那一個，改了外面看得到
void fill(std::vector<int>& arr, int n) {
    for (int i = 0; i < n; i++) {
        arr[i] = i * i;
    }
}

int main() {
    int x = 5;
    add_one(x);

    std::vector<int> arr(4, 0);
    fill(arr, 4);

    std::cout << max3(3, 8, 5) << " " << is_prime(7) << " " << is_prime(9) << " " << x << " " << arr[3] << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 回傳三個數裡最大的
    static int max3(int a, int b, int c) {
        int m = a;
        if (b > m) {
            m = b;
        }
        if (c > m) {
            m = c;
        }
        return m;
    }

    // n 是質數回傳 1，不是回傳 0
    static int isPrime(int n) {
        if (n < 2) {
            return 0;
        }
        int d = 2;
        while (d * d <= n) {
            if (n % d == 0) {
                return 0;                   // 找到因數就回傳，後面的迴圈不會再跑
            }
            d += 1;
        }
        return 1;
    }

    // 傳值：x 是呼叫時抄過來的複本，改了它，外面的 x 不會變
    static void addOne(int x) {
        x = x + 1;
    }

    // 陣列傳過來的是同一個物件，函式裡改了，外面看得到
    static void fill(int[] arr, int n) {
        for (int i = 0; i < n; i++) {
            arr[i] = i * i;
        }
    }

    public static void main(String[] args) {
        int x = 5;
        addOne(x);

        int[] arr = new int[4];
        fill(arr, 4);

        System.out.println(max3(3, 8, 5) + " " + isPrime(7) + " " + isPrime(9) + " " + x + " " + arr[3]);
    }
}
`,
      python: `# 回傳三個數裡最大的
def max3(a, b, c):
    m = a
    if b > m:
        m = b
    if c > m:
        m = c
    return m


# n 是質數回傳 1，不是回傳 0
def is_prime(n):
    if n < 2:
        return 0
    d = 2
    while d * d <= n:
        if n % d == 0:
            return 0               # 找到因數就回傳，後面的迴圈不會再跑
        d += 1
    return 1


# 傳值：x = x + 1 只改到函式裡的 x，外面的 x 不會變
def add_one(x):
    x = x + 1


# list 傳過來的是同一個物件，函式裡改了，外面看得到
def fill(arr, n):
    for i in range(n):
        arr[i] = i * i


x = 5
add_one(x)

arr = [0, 0, 0, 0]
fill(arr, 4)

print(max3(3, 8, 5), is_prime(7), is_prime(9), x, arr[3])
`,
      output: '8 1 0 5 9',
    },
    // 跑幾步：叫一次函式，整個本體就跑一次；數步數要把呼叫展開進去算
    cost: {
      rows: [
        ['追蹤器呼叫 total 兩次：函式本體的 price = cups * 50', '跑 2 次，呼叫幾次就跑幾次'],
        ['迴圈跑 n 次，每次呼叫一個裡面有 m 次迴圈的函式（n = 4、m = 3 時內圈跑 12 次）', 'n·m 次，O(n·m)'],
        ['實作的 is_prime(n)：d 從 2 試到 d × d 超過 n 為止', '最多大約 √n 次，O(√n)'],
      ],
      note: { text: '呼叫函式只寫了一行，跑的卻是整個函式本體，數步數時要把它展開進去算。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '下面這段程式印出什麼？',
        code: {
          c: `int add_one(int x) {
    x = x + 1;
    return x;
}

int x = 5;
int y = add_one(x);
printf("%d %d\\n", x, y);`,
          cpp: `int add_one(int x) {
    x = x + 1;
    return x;
}

int x = 5;
int y = add_one(x);
std::cout << x << " " << y << "\\n";`,
          java: `static int addOne(int x) {
    x = x + 1;
    return x;
}

int x = 5;
int y = addOne(x);
System.out.println(x + " " + y);`,
          python: `def add_one(x):
    x = x + 1
    return x

x = 5
y = add_one(x)
print(x, y)`,
        },
        options: ['6 6', '5 6', '5 5', '6 5'],
        answer: 1,
        why: '呼叫 add_one(x) 時，放進去的是 x 的值 5，函式裡的 x 是一份複本：複本變成 6、回傳 6，所以 y 是 6；外面的 x 沒被動過，還是 5。6 6 是以為函式改到了外面的 x；5 5 是以為 x = x + 1 沒有作用；6 5 是把 x 和 y 弄反了。',
        program: {
          c: `#include <stdio.h>

int add_one(int x) {
    x = x + 1;
    return x;
}

int main(void) {
    int x = 5;
    int y = add_one(x);
    printf("%d %d\\n", x, y);
    return 0;
}
`,
          cpp: `#include <iostream>

int add_one(int x) {
    x = x + 1;
    return x;
}

int main() {
    int x = 5;
    int y = add_one(x);
    std::cout << x << " " << y << "\\n";
}
`,
          java: `public class Main {
    static int addOne(int x) {
        x = x + 1;
        return x;
    }

    public static void main(String[] args) {
        int x = 5;
        int y = addOne(x);
        System.out.println(x + " " + y);
    }
}
`,
          python: `def add_one(x):
    x = x + 1
    return x

x = 5
y = add_one(x)
print(x, y)
`,
        },
        output: '5 6',
      },
      {
        kind: '程式填空',
        prompt: '想讓 bigger(a, b) 回傳兩個數裡比較大的那個，____ 要填什麼？',
        code: {
          c: `int bigger(int a, int b) {
    if (a > b) {
        return a;
    }
    return ____;
}`,
          cpp: `int bigger(int a, int b) {
    if (a > b) {
        return a;
    }
    return ____;
}`,
          java: `static int bigger(int a, int b) {
    if (a > b) {
        return a;
    }
    return ____;
}`,
          python: `def bigger(a, b):
    if a > b:
        return a
    return ____`,
        },
        options: ['a', 'a > b', 'b', 'a + b'],
        answer: 2,
        why: '跑得到最後一行，代表 a > b 不成立、前面的 return a 沒有跑，比較大的是 b：bigger(3, 8) 回傳 8；bigger(9, 4) 在 return a 那裡就回傳 9，後面那行不會跑，印出 8 9。填 a 的話 bigger(3, 8) 會回傳 3，是比較小的那個；填 a > b 交回的是比較的結果（C、C++ 是 0，Python 是 False，Java 編譯不過），不是數字；填 a + b 交回的是兩個數的和 11。',
        // 驗算用的程式把空格 ____ 當成一個變數，前一行填進正解
        program: {
          c: `#include <stdio.h>

int bigger(int a, int b) {
    if (a > b) {
        return a;
    }
    int ____ = b;
    return ____;
}

int main(void) {
    printf("%d %d\\n", bigger(3, 8), bigger(9, 4));
    return 0;
}
`,
          cpp: `#include <iostream>

int bigger(int a, int b) {
    if (a > b) {
        return a;
    }
    int ____ = b;
    return ____;
}

int main() {
    std::cout << bigger(3, 8) << " " << bigger(9, 4) << "\\n";
}
`,
          java: `public class Main {
    static int bigger(int a, int b) {
        if (a > b) {
            return a;
        }
        int ____ = b;
        return ____;
    }

    public static void main(String[] args) {
        System.out.println(bigger(3, 8) + " " + bigger(9, 4));
    }
}
`,
          python: `def bigger(a, b):
    if a > b:
        return a
    ____ = b
    return ____

print(bigger(3, 8), bigger(9, 4))
`,
        },
        output: '8 9',
      },
      {
        kind: '程式效能分析',
        prompt: 'n = 4、m = 3 時，下面這段程式跑完，work 裡的 c += 1 一共跑了幾次？（跑完的 count 就是這個數）',
        code: {
          c: `int work(int m) {
    int c = 0;
    for (int j = 0; j < m; j++) {
        c += 1;
    }
    return c;
}

int count = 0;
for (int i = 0; i < n; i++) {
    count += work(m);
}`,
          cpp: `int work(int m) {
    int c = 0;
    for (int j = 0; j < m; j++) {
        c += 1;
    }
    return c;
}

int count = 0;
for (int i = 0; i < n; i++) {
    count += work(m);
}`,
          java: `static int work(int m) {
    int c = 0;
    for (int j = 0; j < m; j++) {
        c += 1;
    }
    return c;
}

int count = 0;
for (int i = 0; i < n; i++) {
    count += work(m);
}`,
          python: `def work(m):
    c = 0
    for j in range(m):
        c += 1
    return c

count = 0
for i in range(n):
    count += work(m)`,
        },
        options: ['4', '7', '16', '12'],
        answer: 3,
        why: '主程式的迴圈跑 n = 4 次，每次都呼叫 work(3)，work 裡的迴圈從頭跑 3 次：4 × 3 = 12。呼叫只寫了一行，跑的卻是整個函式本體，所以一共 n·m 次，是 O(n·m)。4 只數了呼叫幾次；7 是把 4 和 3 加起來，可是 work 是在迴圈裡面被叫、不是接在後面跑；16 是以為 work 裡面也跑 n 次。',
        program: {
          c: `#include <stdio.h>

int work(int m) {
    int c = 0;
    for (int j = 0; j < m; j++) {
        c += 1;
    }
    return c;
}

int main(void) {
    int n = 4;
    int m = 3;
    int count = 0;
    for (int i = 0; i < n; i++) {
        count += work(m);
    }
    printf("%d\\n", count);
    return 0;
}
`,
          cpp: `#include <iostream>

int work(int m) {
    int c = 0;
    for (int j = 0; j < m; j++) {
        c += 1;
    }
    return c;
}

int main() {
    int n = 4;
    int m = 3;
    int count = 0;
    for (int i = 0; i < n; i++) {
        count += work(m);
    }
    std::cout << count << "\\n";
}
`,
          java: `public class Main {
    static int work(int m) {
        int c = 0;
        for (int j = 0; j < m; j++) {
            c += 1;
        }
        return c;
    }

    public static void main(String[] args) {
        int n = 4;
        int m = 3;
        int count = 0;
        for (int i = 0; i < n; i++) {
            count += work(m);
        }
        System.out.println(count);
    }
}
`,
          python: `def work(m):
    c = 0
    for j in range(m):
        c += 1
    return c

n = 4
m = 3
count = 0
for i in range(n):
    count += work(m)
print(count)
`,
        },
        output: '12',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'functions', page);
})(typeof window !== 'undefined' ? window : globalThis);
