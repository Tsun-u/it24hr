// classroom/programming/parameter_passing.js — APCS 程式設計附錄「傳值與傳參考」：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
// 函式頁只帶過「參數是複本、陣列例外」；這頁講為什麼、各語言怎麼讓函式改到外面的變數
(function (root) {
  const page = {
    layout: 'program',
    analogy: '你把一份企劃書傳給同事修改。寄附件的話，他改完你手上這份不會變；分享雲端文件的連結，他一改你就看到了。程式把變數交給函式的時候，給的是附件，還是連結？',
    // 複習：接函式頁的兩個現象，一個改不到、一個改得到；quote 是這頁的核心想法
    review: [
      '我們在函式那頁看過：add_one(x) 在函式裡把 x 加 1，外面的 x 沒有變；可是把陣列交給函式、改它的第一格，外面的陣列卻跟著變了。同樣是交給函式，為什麼一個改不到、一個改得到？',
      { quote: '要看函式拿到的是值的複本，還是找得到原本那一份的地址。' },
    ],
    summary: '整數這種值，交給函式時寄的是附件，函式怎麼改都不影響你；陣列、串列、物件寄的是連結，函式照著連結改，你這邊也看得到。C 想讓函式改到整數，就自己把地址寄過去（指標）；C++ 可以直接讓函式拿到本人（參考）。下次碰到函式改了東西外面卻沒變，或是不想變卻變了，你就知道：先問它拿到的是附件還是連結。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      '想把陣列交給函式改，又不想動到原本那一份：先複製一份再交出去。Python 寫 f(list(arr))、Java 寫 f(arr.clone())；C++ 的參數不寫 &，vector 本來就會複製一份；C 的陣列沒有內建的複製，要自己用迴圈一格一格抄到另一個陣列。',
    ],
    uses: [
      '遊戲裡的角色升級：把角色的資料交給「升級」函式，函式要改得到那一個角色，等級和血量才會真的變；要是交過去的是複本，升級完角色還是原本的樣子。',
      '內建的排序：Python 寫 arr.sort()、Java 寫 Arrays.sort(arr)、C++ 寫 sort(arr.begin(), arr.end())，都不用接回傳值，排完你的陣列就是排好的，因為函式拿到的是你那個陣列的地址。',
      'C 的 scanf("%d", &n)：scanf 要把讀到的數字放進 n，所以要給它 n 的地址 &n，它才知道放進哪裡。',
      '電腦內部：十萬筆成績交給函式，要是每呼叫一次就複製十萬格，又慢又吃記憶體；傳地址只要抄一個地址。比賽和考試的 C++ 程式常把大陣列寫成 vector<int>& 傳，就是為了不複製。',
    ],
    concept: [
      '傳值（pass by value）：呼叫函式的時候，參數拿到的是抄過去的一份複本，就像寄附件。C、Java、Python 的參數都是這樣傳，C++ 沒有特別寫的時候也是。所以追蹤器裡 change 把 x 加 1，改的是函式那一層的 x，主程式那一層的 x 還是原本的值。',
      '那陣列為什麼改得到？陣列可以很大，變數裡放的其實是它在記憶體裡的位置，叫地址（address），就像雲端文件的連結。抄過去的是這個地址，兩份地址指著同一個陣列，函式照著地址改 arr[0]，主程式看到的也是改過的那個。C 的陣列參數就是第一格的地址；Java 的陣列和物件變數存的是參考（reference），也是一個地址；Python 的變數都是指著某個物件的名字，list 傳過去，指的是同一個 list。',
      '複本終究是複本：在函式裡把 arr 換成一個新的陣列，只是讓函式手上那份地址指到別的地方，主程式的 arr 還指著原本那個。所以記一句就夠：改「裡面」（arr[0] = 99），外面看得到；換掉「整個」（arr = 新的陣列），外面看不到。',
      '傳參考（pass by reference）是函式直接拿到本人：C++ 的參數寫成 int &x，函式裡的 x 就是外面那個變數的另一個名字，指定新的值，外面也跟著變。四種語言裡只有 C++ 有傳參考。C 用指標（pointer）做到一樣的事：呼叫寫 increase(&x)，把 x 的地址傳過去，函式寫 void increase(int *p)，*p 就是 x 本人。Java 和 Python 沒有這兩樣，想改外面的整數，就把新的值回傳、讓外面自己接：x = increase(x)。',
    ],
    traps: [
      { wrong: 'Java 的陣列和物件是傳參考（pass by reference）', right: 'Java 一律傳值。陣列、物件變數裡放的是地址，傳過去的是地址的複本：照著地址改 arr[0]，外面看得到；在方法裡寫 arr = new int[]{0, 0}，只是讓這份複本指到新的陣列，外面的變數還指著原本那個（試試看第一題）。真的是傳參考的話，換掉參數，外面也會跟著換掉。' },
      { wrong: '寫一個 swap(a, b) 函式，就能交換外面的兩個整數', right: '函式拿到的是 a、b 的複本，交換的只是複本（試試看第二題）。C 要把地址傳過去：呼叫寫 swap(&a, &b)、參數寫 int *a, int *b；C++ 的參數寫成 int &a, int &b；Java 改不到外面的 int，要把它們放進陣列或物件；Python 直接在外面寫 a, b = b, a。' },
      { wrong: 'Python 什麼都是物件，所以把整數交給函式，函式也改得到', right: 'Python 的整數是改不了的（immutable）：x = x + 1 是算出一個新的整數，讓函式裡的 x 指過去，外面的 x 還指著原本那個。改得到的是 list、dict 這種可以改裡面的東西，而且要改裡面（arr[0] = 99、arr.append(3)），不是把 arr 換掉。' },
      { wrong: 'C++ 的 vector 跟 C 的陣列一樣，交給函式就改得到', right: 'C++ 的參數沒寫 &，vector 會整個複製一份，函式改的是複本，外面不變，而且十萬格就要抄十萬格（實作的 replace）。要改得到、或只是不想複製，參數寫成 vector<int>& arr；只讀不改的寫 const vector<int>& arr。' },
      { wrong: 'C 的函式裡寫 sizeof(arr)，就能算出陣列有幾格', right: 'C 的陣列交給函式，函式拿到的只是第一格的地址，sizeof(arr) 算的是地址本身的大小（常見是 8 個位元組），不是整個陣列。所以陣列要連同格數一起傳：void fill(int arr[], int n)。' },
      { wrong: 'scanf("%d", n) 少寫 &，只是編譯時多一個警告', right: 'scanf 要知道讀到的數字放進哪裡，所以要給它地址 &n。少了 &，scanf 會把 n 裡面原本的值當成地址去寫，程式可能直接當掉，也可能悄悄寫壞別的記憶體。讀字串的 char s[100] 寫 scanf("%s", s) 不用 &，因為陣列的名字本身就是第一格的地址。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{v}} 換成挑的那個值；x 和 arr 的第一格從同一個值開始，跑完看哪一個變了
    // lines 是 Python 的第幾行對到那種語言的第幾行；C、C++、Java 的函式寫在 main 前面
    trace: {
      inputs: [{ label: 'v = 5', values: { v: 5 } }, { label: 'v = 10', values: { v: 10 } }],
      code: {
        c: `#include <stdio.h>

void change(int x, int arr[]) {
    x = x + 1;
    arr[0] = arr[0] + 1;
}

int main(void) {
    int x = {{v}};
    int arr[] = {{{v}}, {{v}}};
    change(x, arr);
    printf("%d %d\\n", x, arr[0]);
    return 0;
}
`,
        cpp: `#include <iostream>

void change(int x, int arr[]) {
    x = x + 1;
    arr[0] = arr[0] + 1;
}

int main() {
    int x = {{v}};
    int arr[] = {{{v}}, {{v}}};
    change(x, arr);
    std::cout << x << " " << arr[0] << "\\n";
    return 0;
}
`,
        java: `public class Main {
    static void change(int x, int[] arr) {
        x = x + 1;
        arr[0] = arr[0] + 1;
    }

    public static void main(String[] args) {
        int x = {{v}};
        int[] arr = {{{v}}, {{v}}};
        change(x, arr);
        System.out.println(x + " " + arr[0]);
    }
}
`,
        python: `def change(x, arr):
    x = x + 1
    arr[0] = arr[0] + 1

x = {{v}}
arr = [{{v}}, {{v}}]
change(x, arr)
print(x, arr[0])
`,
      },
      lines: {
        c: { 1: 3, 2: 4, 3: 5, 5: 9, 6: 10, 7: 11, 8: 12 },
        cpp: { 1: 3, 2: 4, 3: 5, 5: 9, 6: 10, 7: 11, 8: 12 },
        java: { 1: 2, 2: 3, 3: 4, 5: 8, 6: 9, 7: 10, 8: 11 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "v = 5": [
        {"line":1,"vars":{},"out":"","def":"change"},
        {"line":5,"vars":{"x":5},"out":""},
        {"line":6,"vars":{"x":5,"arr":[5,5]},"out":""},
        {"line":7,"vars":{"x":5,"arr":[5,5]},"out":"","stack":[{"vars":{"x":5,"arr":[5,5]}},{"fn":"change","vars":{"x":5,"arr":[5,5]}}],"call":"change"},
        {"line":2,"vars":{"x":6,"arr":[5,5]},"out":"","stack":[{"vars":{"x":5,"arr":[5,5]}},{"fn":"change","vars":{"x":6,"arr":[5,5]}}]},
        {"line":3,"vars":{"x":6,"arr":[6,5]},"out":"","stack":[{"vars":{"x":5,"arr":[6,5]}},{"fn":"change","vars":{"x":6,"arr":[6,5]}}],"ret":null},
        {"line":7,"vars":{"x":5,"arr":[6,5]},"out":""},
        {"line":8,"vars":{"x":5,"arr":[6,5]},"out":"5 6\n"},
      ],
      "v = 10": [
        {"line":1,"vars":{},"out":"","def":"change"},
        {"line":5,"vars":{"x":10},"out":""},
        {"line":6,"vars":{"x":10,"arr":[10,10]},"out":""},
        {"line":7,"vars":{"x":10,"arr":[10,10]},"out":"","stack":[{"vars":{"x":10,"arr":[10,10]}},{"fn":"change","vars":{"x":10,"arr":[10,10]}}],"call":"change"},
        {"line":2,"vars":{"x":11,"arr":[10,10]},"out":"","stack":[{"vars":{"x":10,"arr":[10,10]}},{"fn":"change","vars":{"x":11,"arr":[10,10]}}]},
        {"line":3,"vars":{"x":11,"arr":[11,10]},"out":"","stack":[{"vars":{"x":10,"arr":[11,10]}},{"fn":"change","vars":{"x":11,"arr":[11,10]}}],"ret":null},
        {"line":7,"vars":{"x":10,"arr":[11,10]},"out":""},
        {"line":8,"vars":{"x":10,"arr":[11,10]},"out":"10 11\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：左邊主程式、右邊 change 那一層。x 抄過去的是值，函式裡改成 6、外面還是 5；arr 抄過去的是地址，兩份地址指著同一個陣列
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const s = svgEl(320, 270), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9 };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const box = (x, y, w, text, fill, seed) => {
        s.append(rc.rectangle(x, y, w, 34, { ...line, seed, fill, fillStyle: 'solid' }));
        label(x + w / 2, y + 17, text, 14);
      };
      // 直線，尾端畫箭頭
      const arrow = (x1, y1, x2, y2, seed) => {
        s.append(rc.line(x1, y1, x2, y2, { ...line, seed }));
        const a = Math.atan2(y2 - y1, x2 - x1), wing = (d) => [x2 - 9 * Math.cos(a + d), y2 - 9 * Math.sin(a + d)];
        s.append(rc.polygon([[x2, y2], wing(0.45), wing(-0.45)], { ...line, seed: seed + 50, fill: INK, fillStyle: 'solid' }));
      };
      label(70, 14, '主程式', 13, true); label(250, 14, 'change 那一層', 13, true);
      // 上面一排：x 抄的是值
      box(20, 30, 100, 'x = 5', FILL, 3); box(200, 30, 100, 'x = 6', NEW, 4);
      arrow(122, 47, 196, 47, 11); label(159, 38, '抄一份值', 11, true);
      label(160, 82, '函式裡改成 6，外面還是 5', 12, true);
      // 下面一排：arr 抄的是地址，兩份地址都指著同一個陣列
      box(20, 104, 100, 'arr', FILL, 5); box(200, 104, 100, 'arr', FILL, 6);
      arrow(122, 121, 196, 121, 12); label(159, 112, '抄一份地址', 11, true);
      arrow(70, 140, 128, 186, 13); arrow(250, 140, 192, 186, 14);
      s.append(rc.rectangle(110, 190, 50, 34, { ...line, seed: 7, fill: NEW, fillStyle: 'solid' }));
      s.append(rc.rectangle(160, 190, 50, 34, { ...line, seed: 8, fill: FILL, fillStyle: 'solid' }));
      label(135, 207, '6', 15); label(185, 207, '5', 15);
      label(160, 250, '指著同一個陣列，函式改了 arr[0]，外面看得到', 12, true);
      return s;
    },
    code: {
      c: `#include <stdio.h>

// 傳值：x 是呼叫時抄過來的複本，改了它，外面的 x 不會變
void add_one(int x) {
    x = x + 1;
}

// 指標：p 存的是 x 的地址，*p 就是 x 本人，改了它外面的 x 就變了
void increase(int *p) {
    *p = *p + 1;
}

// 陣列傳過來的是第一格的地址，照著地址改裡面的格子，外面看得到
void set_first(int arr[]) {
    arr[0] = 99;
}

// arr 是地址的複本：讓它指到另一個陣列，外面的 arr 還指著原本那個
void replace(int arr[]) {
    int other[2] = {0, 0};
    arr = other;
}

int main(void) {
    int x = 5;
    add_one(x);
    printf("%d\\n", x);

    increase(&x);
    printf("%d\\n", x);

    int arr[2] = {1, 2};
    set_first(arr);
    replace(arr);
    printf("%d %d\\n", arr[0], arr[1]);
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// 傳值：x 是呼叫時抄過來的複本，改了它，外面的 x 不會變
void add_one(int x) {
    x = x + 1;
}

// 參考：int &x 的 x 就是外面那個變數的另一個名字，改了外面也變
void increase(int &x) {
    x = x + 1;
}

// vector<int>& 是參考：函式裡的 arr 就是外面那一個
void set_first(std::vector<int>& arr) {
    arr[0] = 99;
}

// 沒寫 &：vector 整個複製一份，函式改的是複本，外面不受影響
void replace(std::vector<int> arr) {
    arr = {0, 0};
}

int main() {
    int x = 5;
    add_one(x);
    std::cout << x << "\\n";

    increase(x);
    std::cout << x << "\\n";

    std::vector<int> arr = {1, 2};
    set_first(arr);
    replace(arr);
    std::cout << arr[0] << " " << arr[1] << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 傳值：x 是呼叫時抄過來的複本，改了它，外面的 x 不會變
    static void addOne(int x) {
        x = x + 1;
    }

    // Java 沒有指標和參考：想改外面的整數，就把新的值回傳，讓外面自己接
    static int increase(int x) {
        return x + 1;
    }

    // 陣列傳過來的是地址的複本，照著地址改裡面的格子，外面看得到
    static void setFirst(int[] arr) {
        arr[0] = 99;
    }

    // 讓這份地址指到新的陣列，外面的 arr 還指著原本那個
    static void replace(int[] arr) {
        arr = new int[]{0, 0};
    }

    public static void main(String[] args) {
        int x = 5;
        addOne(x);
        System.out.println(x);

        x = increase(x);
        System.out.println(x);

        int[] arr = {1, 2};
        setFirst(arr);
        replace(arr);
        System.out.println(arr[0] + " " + arr[1]);
    }
}
`,
      python: `# 傳值：x = x + 1 只讓函式裡的 x 指到新的整數，外面的 x 不會變
def add_one(x):
    x = x + 1


# Python 沒有指標和參考：想改外面的整數，就把新的值回傳，讓外面自己接
def increase(x):
    return x + 1


# list 傳過來的是同一個物件，改裡面的格子，外面看得到
def set_first(arr):
    arr[0] = 99


# 讓函式裡的 arr 指到新的 list，外面的 arr 還指著原本那個
def replace(arr):
    arr = [0, 0]


x = 5
add_one(x)
print(x)

x = increase(x)
print(x)

arr = [1, 2]
set_first(arr)
replace(arr)
print(arr[0], arr[1])
`,
      output: '5\n6\n99 2',
    },
    // 跑幾步：交給函式時要抄多少東西
    cost: {
      rows: [
        ['交給函式一個整數 x', '抄 1 個值，O(1)'],
        ['交給函式 n 格的 C 陣列、Java 陣列、Python list、C++ 的 vector<int>&', '只抄一個地址，O(1)，跟 n 多大無關'],
        ['交給函式 n 格的 C++ vector<int>（沒寫 &）', '整個複製一份，O(n)'],
      ],
      note: { text: '交給函式的東西越大，複製的代價越明顯：十萬格的 vector 沒寫 &，每呼叫一次就抄十萬格，放在迴圈裡呼叫更是倍數放大。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '下面這段程式印出什麼？',
        code: {
          c: `void reset(int arr[]) {
    arr[0] = 7;
    int other[2] = {0, 0};
    arr = other;
    arr[0] = 9;
}

int arr[2] = {1, 2};
reset(arr);
printf("%d %d\\n", arr[0], arr[1]);`,
          cpp: `void reset(int arr[]) {
    arr[0] = 7;
    int other[2] = {0, 0};
    arr = other;
    arr[0] = 9;
}

int arr[2] = {1, 2};
reset(arr);
std::cout << arr[0] << " " << arr[1] << "\\n";`,
          java: `static void reset(int[] arr) {
    arr[0] = 7;
    arr = new int[]{0, 0};
    arr[0] = 9;
}

int[] arr = {1, 2};
reset(arr);
System.out.println(arr[0] + " " + arr[1]);`,
          python: `def reset(arr):
    arr[0] = 7
    arr = [0, 0]
    arr[0] = 9

arr = [1, 2]
reset(arr)
print(arr[0], arr[1])`,
        },
        options: ['9 0', '7 2', '1 2', '9 2'],
        answer: 1,
        why: 'arr[0] = 7 是照著傳進來的地址改，外面的陣列變成 7 2。下一步把 arr 換成新的陣列（C、C++ 是讓它指到 other），從這裡開始函式裡的 arr 指的是另一個陣列，arr[0] = 9 改的是新的那個，外面看不到。9 0 是以為換掉參數，外面也跟著換掉（以為 Java 傳參考的人常這樣想）；1 2 是以為陣列也是複本、什麼都改不到；9 2 是以為換成新的陣列以後，改的還是原本那個。',
        program: {
          c: `#include <stdio.h>

void reset(int arr[]) {
    arr[0] = 7;
    int other[2] = {0, 0};
    arr = other;
    arr[0] = 9;
}

int main(void) {
    int arr[2] = {1, 2};
    reset(arr);
    printf("%d %d\\n", arr[0], arr[1]);
    return 0;
}
`,
          cpp: `#include <iostream>

void reset(int arr[]) {
    arr[0] = 7;
    int other[2] = {0, 0};
    arr = other;
    arr[0] = 9;
}

int main() {
    int arr[2] = {1, 2};
    reset(arr);
    std::cout << arr[0] << " " << arr[1] << "\\n";
}
`,
          java: `public class Main {
    static void reset(int[] arr) {
        arr[0] = 7;
        arr = new int[]{0, 0};
        arr[0] = 9;
    }

    public static void main(String[] args) {
        int[] arr = {1, 2};
        reset(arr);
        System.out.println(arr[0] + " " + arr[1]);
    }
}
`,
          python: `def reset(arr):
    arr[0] = 7
    arr = [0, 0]
    arr[0] = 9

arr = [1, 2]
reset(arr)
print(arr[0], arr[1])
`,
        },
        output: '7 2',
      },
      {
        kind: '程式測試與除錯',
        prompt: '想交換 a 和 b，跑完卻印出 3 8。問題出在哪？',
        code: {
          c: `void swap(int a, int b) {
    int tmp = a;
    a = b;
    b = tmp;
}

int a = 3;
int b = 8;
swap(a, b);
printf("%d %d\\n", a, b);`,
          cpp: `void swap(int a, int b) {
    int tmp = a;
    a = b;
    b = tmp;
}

int a = 3;
int b = 8;
swap(a, b);
std::cout << a << " " << b << "\\n";`,
          java: `static void swap(int a, int b) {
    int tmp = a;
    a = b;
    b = tmp;
}

int a = 3;
int b = 8;
swap(a, b);
System.out.println(a + " " + b);`,
          python: `def swap(a, b):
    tmp = a
    a = b
    b = tmp

a = 3
b = 8
swap(a, b)
print(a, b)`,
        },
        options: ['tmp 要先存 b，順序寫反了', 'swap 拿到的是 a、b 的複本，交換的只是複本', 'swap 是內建函式的名字，呼叫到的不是這一個', '函式裡的 a、b 跟外面同名，名字撞在一起互相蓋掉了'],
        answer: 1,
        why: '呼叫 swap(a, b) 時抄過去的是 3 和 8，函式裡確實把兩份複本交換了，可是外面的 a、b 沒被動過，還是 3 8。要真的交換：C 寫 swap(&a, &b)、參數改成 int *a, int *b；C++ 參數改成 int &a, int &b；Java 改不到外面的 int，要放進陣列；Python 直接在外面寫 a, b = b, a。tmp 先存 a 或先存 b 都換得過來，不是順序的問題；這裡呼叫到的就是自己寫的 swap；函式裡的參數是另一份，跟外面同名也不會互相蓋掉。',
        program: {
          c: `#include <stdio.h>

void swap(int a, int b) {
    int tmp = a;
    a = b;
    b = tmp;
}

int main(void) {
    int a = 3;
    int b = 8;
    swap(a, b);
    printf("%d %d\\n", a, b);
    return 0;
}
`,
          cpp: `#include <iostream>

void swap(int a, int b) {
    int tmp = a;
    a = b;
    b = tmp;
}

int main() {
    int a = 3;
    int b = 8;
    swap(a, b);
    std::cout << a << " " << b << "\\n";
}
`,
          java: `public class Main {
    static void swap(int a, int b) {
        int tmp = a;
        a = b;
        b = tmp;
    }

    public static void main(String[] args) {
        int a = 3;
        int b = 8;
        swap(a, b);
        System.out.println(a + " " + b);
    }
}
`,
          python: `def swap(a, b):
    tmp = a
    a = b
    b = tmp

a = 3
b = 8
swap(a, b)
print(a, b)
`,
        },
        output: '3 8',
      },
      {
        kind: '程式運行追蹤',
        prompt: '下面這段程式印出什麼？',
        code: {
          c: `void bump(int arr[], int n) {
    n = n + 1;
    arr[n] = arr[n] + 10;
}

int arr[3] = {1, 2, 3};
int n = 0;
bump(arr, n);
printf("%d %d %d\\n", n, arr[0], arr[1]);`,
          cpp: `void bump(int arr[], int n) {
    n = n + 1;
    arr[n] = arr[n] + 10;
}

int arr[3] = {1, 2, 3};
int n = 0;
bump(arr, n);
std::cout << n << " " << arr[0] << " " << arr[1] << "\\n";`,
          java: `static void bump(int[] arr, int n) {
    n = n + 1;
    arr[n] = arr[n] + 10;
}

int[] arr = {1, 2, 3};
int n = 0;
bump(arr, n);
System.out.println(n + " " + arr[0] + " " + arr[1]);`,
          python: `def bump(arr, n):
    n = n + 1
    arr[n] = arr[n] + 10

arr = [1, 2, 3]
n = 0
bump(arr, n)
print(n, arr[0], arr[1])`,
        },
        options: ['1 1 12', '0 11 2', '0 1 12', '1 11 2'],
        answer: 2,
        why: 'n 是整數，函式裡的 n 是複本：它變成 1，外面的 n 還是 0。arr 是地址，函式用自己的 n（已經是 1）改 arr[1]，外面的 arr[1] 從 2 變成 12，arr[0] 沒動。1 1 12 是以為外面的 n 也被改了；0 11 2 是以為函式改格子時用的還是外面的 n（0）；1 11 2 是兩件事都弄反了。',
        program: {
          c: `#include <stdio.h>

void bump(int arr[], int n) {
    n = n + 1;
    arr[n] = arr[n] + 10;
}

int main(void) {
    int arr[3] = {1, 2, 3};
    int n = 0;
    bump(arr, n);
    printf("%d %d %d\\n", n, arr[0], arr[1]);
    return 0;
}
`,
          cpp: `#include <iostream>

void bump(int arr[], int n) {
    n = n + 1;
    arr[n] = arr[n] + 10;
}

int main() {
    int arr[3] = {1, 2, 3};
    int n = 0;
    bump(arr, n);
    std::cout << n << " " << arr[0] << " " << arr[1] << "\\n";
}
`,
          java: `public class Main {
    static void bump(int[] arr, int n) {
        n = n + 1;
        arr[n] = arr[n] + 10;
    }

    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        int n = 0;
        bump(arr, n);
        System.out.println(n + " " + arr[0] + " " + arr[1]);
    }
}
`,
          python: `def bump(arr, n):
    n = n + 1
    arr[n] = arr[n] + 10

arr = [1, 2, 3]
n = 0
bump(arr, n)
print(n, arr[0], arr[1])
`,
        },
        output: '0 1 12',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'parameter_passing', page);
})(typeof window !== 'undefined' ? window : globalThis);
