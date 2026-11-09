// classroom/programming/io.js — APCS 程式設計「輸入與輸出」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '為什麼在超市結帳的時候，店員只要刷了條碼就知道商品金額？',
    // 複習：用前面學過的變數和運算式硬做，每位客人都要改一次程式；quote 是講義自己說的那句，也就是輸入與輸出的核心想法
    review: [
      '我們前面學了變數和運算式，最直覺的做法是把這位客人買的東西直接寫進程式：milk = 2、bread = 1，算好總價。下一位客人來了，你得改程式、再跑一次；後面還排了十個人。',
      { quote: '程式跑起來以後，可以向外面要資料、算完把結果交出來，這就是輸入與輸出。' },
      '店員就只要刷條碼了。',
    ],
    summary: '刷條碼的時候，條碼上的數字被送進程式，這是輸入；程式查到這個商品多少錢、顯示在螢幕上，這是輸出。下次看到「你給它東西、它回你結果」的機器，你就知道：那是一支讀輸入、印輸出的程式，APCS 的題目也一樣，照格式讀測資、照格式印答案。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    // 課外補充：考試範圍外、知道了寫程式更順手的東西，放在全頁最後
    extra: [
      {
        text: '讀到輸入結束（EOF，end of file）：有的題目不先給筆數，資料一直給到輸入結束為止。學了迴圈以後可以這樣讀：C 寫 while (scanf("%d", &x) != EOF)、C++ 寫 while (std::cin >> x)、Java 寫 while (sc.hasNextInt())、Python 寫 for line in sys.stdin:（要先 import sys），讀不到東西迴圈就停。下面的程式把讀到的數全部加起來，最後印出總和和一共幾個數：數字可以排在同一行，也可以分好幾行，不知道有幾個也沒關係。',
        code: {
          c: `#include <stdio.h>

int main(void) {
    int x;
    int total = 0;
    int count = 0;
    while (scanf("%d", &x) != EOF) {     // 讀到輸入結束，scanf 回傳 EOF，迴圈就停
        total += x;
        count += 1;
    }
    printf("%d %d\\n", total, count);
    return 0;
}
`,
          cpp: `#include <iostream>

int main() {
    int x;
    int total = 0;
    int count = 0;
    while (std::cin >> x) {              // 讀不到數字，條件就不成立
        total += x;
        count += 1;
    }
    std::cout << total << " " << count << "\\n";
    return 0;
}
`,
          java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int total = 0;
        int count = 0;
        while (sc.hasNextInt()) {        // 後面還有整數才進迴圈
            total += sc.nextInt();
            count += 1;
        }
        System.out.println(total + " " + count);
    }
}
`,
          python: `import sys

total = 0
count = 0
for line in sys.stdin:           # 一次拿一行，讀到輸入結束就停
    for x in line.split():       # 一行可能有好幾個數
        total += int(x)
        count += 1
print(total, count)
`,
          stdin: '3 8 5\n10\n',
          output: '26 4',
        },
      },
      '測資很大（幾十萬個數）時，光是讀輸入就會變慢：Python 用 sys.stdin.readline() 代替 input() 快很多（讀到的字串尾巴多一個換行，int() 會自己忽略）；C++ 在 main 的開頭加 std::ios::sync_with_stdio(false); 和 std::cin.tie(nullptr);，cin 會快很多；Java 的 Scanner 也偏慢，可以改用 BufferedReader 一次讀一整行再自己切。C 的 scanf 本來就夠快。',
    ],
    uses: [
      '自動販賣機：投錢、按按鈕是輸入，掉出飲料和找零是輸出。',
      '登入網站：你打的帳號密碼是輸入，「登入成功」或「密碼錯誤」是輸出。',
      'APCS 和線上解題系統：評分程式把測資從標準輸入餵進你的程式，再拿你印出來的東西，跟正確答案一個字一個字比對。',
      '電腦內部：鍵盤、滑鼠、麥克風是輸入裝置，螢幕、喇叭、印表機是輸出裝置；程式和程式之間也能接起來，一支程式的輸出直接當成下一支的輸入（命令列的管線 pipe，寫成 |）。',
    ],
    concept: [
      '輸入（input）是程式跑起來以後才向外面要資料：鍵盤打的字、檔案的內容、條碼槍刷到的數字；輸出（output）是把算好的結果交出去：印在螢幕上、寫進檔案。程式裡只寫「讀兩個數、算總價、印出來」，同一支程式就能服務每一位客人，不用每來一個人就改一次程式。沒有特別指定時，輸入從標準輸入（standard input，stdin）來，平常就是鍵盤；輸出到標準輸出（standard output，stdout），平常就是螢幕。APCS 的測資就是從標準輸入餵進來的，跟有人在鍵盤上幫你打字一樣。',
      '讀一個整數：C 寫 scanf("%d", &n)、C++ 寫 std::cin >> n、Java 先開一個 Scanner sc = new Scanner(System.in)，再 int n = sc.nextInt()、Python 寫 n = int(input())。Python 的 input() 一次讀一整行，拿到的是字串，要用 int() 轉成整數才能算；一行有好幾個數時，先用 split() 照空白切成一段一段的字串，再用 map(int, …) 每段轉成整數：milk, bread = map(int, input().split())。C、C++、Java 一次讀一個數，會自己跳過中間的空白和換行，所以一行兩個數就是讀兩次：scanf("%d %d", &milk, &bread)、std::cin >> milk >> bread。',
      'C 的 scanf 要把讀到的數放進變數裡，所以得告訴它變數住在記憶體的哪裡，也就是變數的位址（address）；& 就是「取位址」，&milk 是 milk 的位址。printf 只要值、不用改變數，所以不用 &。',
      '輸出：C 寫 printf("%d\\n", total)、C++ 寫 std::cout << total << "\\n"、Java 寫 System.out.println(total)、Python 寫 print(total)。printf 的格式裡 %d 是整數、%f 是小數、%.2f 是小數取到第二位，\\n 是換行；Python 的 print 一次印好幾個值時，中間自動放一個空白，最後自動換行。APCS 照題目寫的輸出格式比對答案：空白、換行要照題目，多印的提示字（像「請輸入：」「答案是」）會讓整行答案對不上。',
      { text: '有的題目先給筆數、再給資料：第一行是 3，接著三個數。筆數每次不一樣，沒辦法先寫好要讀幾次，要配迴圈一筆一筆讀。', see: 'loops' },
    ],
    traps: [
      { wrong: 'Python 的 input() 拿到的是數字', right: 'input() 拿到的永遠是字串：打 3 拿到的是 "3"，"3" + "4" 是 "34"，不是 7。要拿來算，先用 int() 轉成整數：n = int(input())。' },
      { wrong: '寫給 APCS 的程式，讀之前也要先印「請輸入：」', right: '測資是機器餵的，沒有人在看提示字；評分照你的輸出跟答案逐字比對，多印的「請輸入：」會讓整行對不上。題目要什麼就只印什麼。' },
      { wrong: 'C 的 scanf("%d", n) 跟 printf 一樣，不用 &', right: 'scanf 要把讀到的數放進變數，得知道變數住在哪裡，要寫 &n 給它位址。少了 &，它會把數字寫到不知道哪裡去，常常直接當掉（gcc 會給警告，記得看）。printf 只要值，才不用 &。' },
      { wrong: '一行兩個數，Python 寫兩次 int(input()) 就好', right: 'input() 一次讀一整行：第一次就讀到 "3 4"，int("3 4") 直接報錯 ValueError；寫兩次 int(input()) 是在讀兩行，每行一個數。一行好幾個數要先切開：a, b = map(int, input().split())。C、C++、Java 一次讀一個數、會跳過空白和換行，才不在意是不是同一行。' },
      { wrong: 'C 的 printf 用 %d 也能印小數', right: '%d 是整數、%f 才是浮點數（%.2f 取到小數第二位）。格式跟值的型態對不上時，C 不會幫你轉，印出來是一個莫名其妙的數字；Java 的 printf 對不上會直接報錯。C++ 的 cout 和 Python 的 print 會看值的型態自己決定怎麼印。' },
    ],
    // 程式追蹤器：接開場的結帳，一行讀「鮮奶幾瓶 麵包幾個」，鮮奶 45 元、麵包 30 元；stdin 是餵給程式的輸入，lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '鮮奶 2、麵包 1', stdin: '2 1\n' }, { label: '鮮奶 0、麵包 3', stdin: '0 3\n' }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int milk, bread;
    scanf("%d %d", &milk, &bread);
    int total = milk * 45 + bread * 30;
    printf("%d\\n", total);
    return 0;
}
`,
        cpp: `#include <iostream>

int main() {
    int milk, bread;
    std::cin >> milk >> bread;
    int total = milk * 45 + bread * 30;
    std::cout << total << "\\n";
    return 0;
}
`,
        java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int milk = sc.nextInt(), bread = sc.nextInt();
        int total = milk * 45 + bread * 30;
        System.out.println(total);
    }
}
`,
        python: `milk, bread = map(int, input().split())
total = milk * 45 + bread * 30
print(total)
`,
      },
      lines: {
        c: { 1: 5, 2: 6, 3: 7 },
        cpp: { 1: 5, 2: 6, 3: 7 },
        java: { 1: 6, 2: 7, 3: 8 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "鮮奶 2、麵包 1": [
        {"line":1,"vars":{"milk":2,"bread":1},"out":"","read":4},
        {"line":2,"vars":{"milk":2,"bread":1,"total":120},"out":"","read":4},
        {"line":3,"vars":{"milk":2,"bread":1,"total":120},"out":"120\n","read":4},
      ],
      "鮮奶 0、麵包 3": [
        {"line":1,"vars":{"milk":0,"bread":3},"out":"","read":4},
        {"line":2,"vars":{"milk":0,"bread":3,"total":90},"out":"","read":4},
        {"line":3,"vars":{"milk":0,"bread":3,"total":90},"out":"90\n","read":4},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：條碼槍 → 程式 → 螢幕。左邊的箭頭是輸入（條碼上的數字送進程式），右邊的箭頭是輸出（金額顯示在螢幕上）
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const s = svgEl(320, 170), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 0.9, seed: 5 };
      const label = (x, y, text, size = 14, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const box = (x, fill) => s.append(rc.rectangle(x, 40, 70, 80, { ...line, fill, fillStyle: 'solid' }));
      const arrow = (x1, x2, y, text) => {
        s.append(rc.line(x1, y, x2, y, line));
        s.append(rc.polygon([[x2, y], [x2 - 9, y - 4], [x2 - 9, y + 4]], { ...line, fill: INK, fillStyle: 'solid' }));
        label((x1 + x2) / 2, y - 14, text, 13);
      };
      // 條碼槍：方框裡畫一排粗細不同的直線當條碼
      box(4, '#fff');
      [[16, 3], [22, 1.5], [27, 4], [34, 1.5], [39, 2.5], [45, 1.5], [50, 4], [57, 2]]
        .forEach(([x, w]) => s.append(rc.line(x, 52, x, 90, { ...line, strokeWidth: w, roughness: 0.4 })));
      label(39, 106, '條碼槍', 13);
      // 程式：這頁的主角，上黃色
      box(125, NEW);
      label(160, 70, '程式', 15);
      label(160, 94, '查價、加總', 11, true);
      // 螢幕：方框裡再畫一塊顯示區，顯示算好的金額
      box(246, '#fff');
      s.append(rc.rectangle(254, 52, 54, 34, { ...line, fill: FILL, fillStyle: 'solid' }));
      label(281, 69, '120 元', 12);
      label(281, 106, '螢幕', 13);
      arrow(78, 121, 80, '輸入');
      arrow(199, 242, 80, '輸出');
      label(160, 150, '你給它資料（輸入），它交回結果（輸出）', 12, true);
      return s;
    },
    // 實作：讀兩行輸入，印出和、乘積、平均；stdin 是餵給程式的輸入
    code: {
      stdin: '3 4\n5\n',
      c: `#include <stdio.h>

// 輸入兩行，例如：第一行 3 4，第二行 5
int main(void) {
    int a, b, c;
    scanf("%d %d", &a, &b);          // 一行兩個數：讀兩個整數，放進 a、b 的位址
    scanf("%d", &c);                 // 第二行一個數；scanf 會自己跳過換行
    int total = a + b + c;
    int product = a * b * c;
    double average = total / 3.0;    // 整數除以整數會捨去小數，除以 3.0 才留得住
    printf("%d %d %.2f\\n", total, product, average);   // %.2f：小數取到第二位
    return 0;
}
`,
      cpp: `#include <iomanip>
#include <iostream>

// 輸入兩行，例如：第一行 3 4，第二行 5
int main() {
    int a, b, c;
    std::cin >> a >> b;              // 一行兩個數：>> 一次讀一個，自己跳過空白
    std::cin >> c;                   // 第二行一個數；換行也一起跳過
    int total = a + b + c;
    int product = a * b * c;
    double average = total / 3.0;    // 整數除以整數會捨去小數，除以 3.0 才留得住
    std::cout << total << " " << product << " "
              << std::fixed << std::setprecision(2) << average << "\\n";   // fixed 加 setprecision(2)：小數取到第二位
    return 0;
}
`,
      java: `import java.util.Scanner;

// 輸入兩行，例如：第一行 3 4，第二行 5
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();            // nextInt 一次讀一個數，自己跳過空白和換行
        int b = sc.nextInt();
        int c = sc.nextInt();
        int total = a + b + c;
        int product = a * b * c;
        double average = total / 3.0;    // 整數除以整數會捨去小數，除以 3.0 才留得住
        System.out.printf("%d %d %.2f\\n", total, product, average);   // %.2f：小數取到第二位
    }
}
`,
      python: `# 輸入兩行，例如：第一行 3 4，第二行 5
a, b = map(int, input().split())   # 第一行有兩個數：split() 照空白切開，map(int, …) 每段轉成整數
c = int(input())                   # 第二行只有一個數
total = a + b + c
product = a * b * c
average = total / 3                # Python 的 / 一定算出小數
print(total, product, f"{average:.2f}")   # print 用空白隔開每個值；:.2f 取到小數第二位
`,
      output: '12 60 4.00',
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，stdin 是餵給它的輸入，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '輸入有兩行：第一行是 7 2，第二行是 3。下面這段程式印出什麼？',
        code: {
          c: `int a, b, c;
scanf("%d %d", &a, &b);
scanf("%d", &c);
printf("%d %d\\n", a * c - b, a / b + c);`,
          cpp: `int a, b, c;
std::cin >> a >> b;
std::cin >> c;
std::cout << a * c - b << " " << a / b + c << "\\n";`,
          java: `Scanner sc = new Scanner(System.in);
int a = sc.nextInt();
int b = sc.nextInt();
int c = sc.nextInt();
System.out.println((a * c - b) + " " + (a / b + c));`,
          python: `a, b = map(int, input().split())
c = int(input())
print(a * c - b, a // b + c)`,
        },
        options: ['19 6.5', '7 6', '19 6', '11 4'],
        answer: 2,
        why: '第一行的 7 和 2 依序放進 a、b，第二行的 3 放進 c。a * c - b 先乘後減：21 - 2 = 19；a / b + c 是 7 / 2 + 3，兩個整數相除是整數 3（Python 寫 // 才是整數），再加 3 得到 6，所以印出 19 6。以為 7 / 2 是 3.5 會得到 6.5；先算 c - b 再乘會得到 7 * 1 = 7；把第二行的 3 當成 b、2 當成 c，會算出 11 和 4。',
        stdin: '7 2\n3\n',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int a, b, c;\n    scanf("%d %d", &a, &b);\n    scanf("%d", &c);\n    printf("%d %d\\n", a * c - b, a / b + c);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int a, b, c;\n    std::cin >> a >> b;\n    std::cin >> c;\n    std::cout << a * c - b << " " << a / b + c << "\\n";\n}\n',
          java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt();\n        int b = sc.nextInt();\n        int c = sc.nextInt();\n        System.out.println((a * c - b) + " " + (a / b + c));\n    }\n}\n',
          python: 'a, b = map(int, input().split())\nc = int(input())\nprint(a * c - b, a // b + c)\n',
        },
        output: '19 6',
      },
      {
        kind: '程式填空',
        prompt: '輸入只有一行：7 3。程式要把 7 放進 a、3 放進 b，再印出 a * 2 + b。____ 那一行要做什麼？',
        code: {
          c: `int a, b;
____;
printf("%d\\n", a * 2 + b);`,
          cpp: `int a, b;
____;
std::cout << a * 2 + b << "\\n";`,
          java: `Scanner sc = new Scanner(System.in);
int ____;
System.out.println(a * 2 + b);`,
          python: `____
print(a * 2 + b)`,
        },
        options: ['讀進一個整數', '讀進兩個整數，第一個放進 b、第二個放進 a', '讀進一整行，當成一個字串', '讀進兩個整數，第一個放進 a、第二個放進 b'],
        answer: 3,
        why: '一行有兩個數，就要讀兩個整數、照順序放：C 寫 scanf("%d %d", &a, &b)、C++ 寫 std::cin >> a >> b、Java 寫 int a = sc.nextInt(), b = sc.nextInt()、Python 寫 a, b = map(int, input().split())，印出 7 * 2 + 3 = 17。只讀一個整數的話，Python 的 int("7 3") 直接報錯，C、C++、Java 只讀到 7，b 沒有讀進東西；順序反過來，a 是 3、b 是 7，印出 13；當成一個字串的話，"7 3" 不是數字，不能拿來乘。',
        stdin: '7 3\n',
        // 驗算用的程式把空格 ____ 當成一個變數，前一行填進正解
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int a, b;\n    scanf("%d %d", &a, &b);\n    int ____ = 0;\n    ____;\n    printf("%d\\n", a * 2 + b);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int a, b;\n    std::cin >> a >> b;\n    int ____ = 0;\n    ____;\n    std::cout << a * 2 + b << "\\n";\n}\n',
          java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int a = sc.nextInt(), b = sc.nextInt();\n        int ____;\n        System.out.println(a * 2 + b);\n    }\n}\n',
          python: 'a, b = map(int, input().split())\n____ = None\n____\nprint(a * 2 + b)\n',
        },
        output: '17',
      },
      {
        kind: '程式測試與除錯',
        prompt: '輸入一行「付的錢 價錢」，想印出要找多少錢。輸入 100 65，結果印出 -35。要怎麼改？',
        code: {
          c: `int price, paid;
scanf("%d %d", &price, &paid);
int change = paid - price;
printf("%d\\n", change);`,
          cpp: `int price, paid;
std::cin >> price >> paid;
int change = paid - price;
std::cout << change << "\\n";`,
          java: `Scanner sc = new Scanner(System.in);
int price = sc.nextInt(), paid = sc.nextInt();
int change = paid - price;
System.out.println(change);`,
          python: `price, paid = map(int, input().split())
change = paid - price
print(change)`,
        },
        options: ['讀之前先印出「請輸入付的錢和價錢：」', '讀進來的順序改成先 paid、再 price', '把 paid - price 改成 paid + price', '把一行讀兩個數，改成分兩行各讀一個'],
        answer: 1,
        why: '輸入的順序是「付的錢 價錢」，程式卻先讀 price：100 放進了 price、65 放進了 paid，65 - 100 = -35。讀的順序改成先 paid 再 price，100 - 65 才是 35。先印提示字不會改變讀的順序，還多印了一行，答案更對不上；改成相加會印出 165；分兩行讀的話，C、C++、Java 照順序讀、不管有沒有換行，還是 -35，Python 的第一次 int(input()) 就拿到整行 "100 65"，直接報錯。',
        stdin: '100 65\n',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int price, paid;\n    scanf("%d %d", &price, &paid);\n    int change = paid - price;\n    printf("%d\\n", change);\n    return 0;\n}\n',
          cpp: '#include <iostream>\nint main() {\n    int price, paid;\n    std::cin >> price >> paid;\n    int change = paid - price;\n    std::cout << change << "\\n";\n}\n',
          java: 'import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int price = sc.nextInt(), paid = sc.nextInt();\n        int change = paid - price;\n        System.out.println(change);\n    }\n}\n',
          python: 'price, paid = map(int, input().split())\nchange = paid - price\nprint(change)\n',
        },
        output: '-35',
      },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('programming', 'io', page);
})(typeof window !== 'undefined' ? window : globalThis);
