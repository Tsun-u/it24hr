// classroom/algorithms/prefix_sum.js — 演算法「前綴和」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '手機的健康 App 記了你每天走幾步。點開它，這週、上個月、今年到現在，任何一段日子的總步數一下就跳出來。它是每問一次，就把那段日子從頭加一遍嗎？',
    // 複習：用學過的陣列和迴圈硬加，問的次數一多就一直重複加同樣的日子；quote 是這頁的核心想法
    review: [
      { text: '我們學過陣列和迴圈：每天的步數存在陣列 steps，第 a 天到第 b 天的總和，就用迴圈把那幾天一天一天加起來。查一次最多加 365 次。可是 App 一直被問：這週、上週、這個月、今年……問 1000 次就是最多 36 萬次加法，而且大部分是在重複加同樣的那幾天。', see: ['programming/arrays', 'programming/loops'] },
      { quote: '任何一段的總和，都等於兩個「從第一天加到這裡」的總數相減。' },
    ],
    summary: 'App 不用每次從頭加：它先存好每天「到今天為止」的累計步數，任何一段都是兩個數相減，一年問幾次都只要一次減法。下次碰到同一份資料要一直問某一段的總和，你就知道：先花一次把累計算好存起來，之後每一問都只剩一次減法。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '存摺上的餘額就是一路累計下來的總數：想知道 3 月初到 5 月底淨進出多少錢，拿 5 月底的餘額減 2 月底的餘額就好，不用把中間每一筆加起來。',
      '用試算表記帳時，常在旁邊多開一欄「累計」：每一格是上一格加這一列。要看任何一段的總計，兩格相減。',
      { text: '影像處理的積分影像（integral image）：每一格存左上角到這裡所有像素的總和，任何一塊長方形的亮度總和用四個數就算完。2001 年發表的即時人臉偵測（Viola–Jones）就是靠它，在一張照片裡快速檢查大量的框框。', see: 'integral_image' },
      { text: 'APCS 實作題：同一個陣列要回答很多次「某一段的總和」；或是「總和剛好是 k 的連續區段有幾段」，前綴和搭配雜湊表，從頭掃一次就數完。', see: 'ds/hashing' },
    ],
    concept: [
      '前綴和（prefix sum）是先把累計算好存起來的另一個陣列 pre：pre[i] 是前 i 天加起來的總數。從左往右填，每一格是左邊那格加上那一天：pre[i] = pre[i − 1] + 第 i 天的步數。七天的步數 3、1、4、1、5、9、2，pre 就是 0、3、4、8、9、14、23、25。程式裡的陣列從 0 數，所以第 i 天是 steps[i − 1]。',
      '第 a 天到第 b 天的總和＝pre[b] − pre[a − 1]。跟看汽車的里程表一樣：出發前看一次、到了再看一次，相減就是這趟開了幾公里，不用一段一段加。pre[b] 是前 b 天，pre[a − 1] 是前 a − 1 天，減掉以後剩下的剛好是第 a 天到第 b 天。圖解裡第 3 到第 5 天：14 − 4 = 10。',
      'pre 比原本的陣列多一格：pre[0] = 0，代表「前 0 天」什麼都還沒加。這樣從第 1 天開始問的時候，一樣是 pre[b] − pre[0]，不用另外寫 if。',
      '這是拿空間換時間：多用一個陣列、先花 n 次加法把表建好，之後每問一段都只要一次減法。名字裡的 prefix 是「前綴」，指從開頭到某個位置的那一段。',
    ],
    traps: [
      { wrong: '第 a 天到第 b 天的總和是 pre[b] − pre[a]', right: '這樣會少掉第 a 天：pre[a] 已經包含第 a 天，減掉它就從第 a + 1 天開始算了。要減的是 pre[a − 1]，前 a − 1 天。' },
      { wrong: '前綴和的陣列跟原本的陣列一樣長就好', right: '要多一格放 pre[0] = 0。少了它，從第 1 天開始問的時候就得另外寫 if，不然會讀到陣列外面：C、C++ 讀到不知道是什麼的值，Java 直接報錯，Python 的 pre[-1] 不會報錯、拿到的是最後一格，答案錯得很安靜。' },
      { wrong: '資料改了一天，前綴和改那一格就好', right: '第 i 天改了，pre[i] 到最後一格全部都要重算。資料常常在改、又常常要問總和的時候，前綴和就不划算，要換成樹狀陣列、線段樹這類進階的結構。' },
      { wrong: '前綴和什麼都能算，最大值也可以', right: '要能「減回去」才行：總和、次數可以兩個相減；最大值不行。前 5 天最大是 5、前 2 天最大是 3，相減得到的 2，跟第 3 到第 5 天的最大值 5 沒有關係。' },
      { wrong: '累計的總數用 int 一定裝得下', right: 'int 最大大約 21 億。一年的步數加起來沒問題；可是 APCS 常見 20 萬個數、每個到 10 億，累計會超過 int 的上限。C、C++ 要用 long long、Java 用 long，Python 的整數沒有上限。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{a}}、{{b}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '第 3～5 天', values: { a: 3, b: 5 } }, { label: '第 1～7 天', values: { a: 1, b: 7 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int steps[] = {3, 1, 4, 1, 5, 9, 2};
    int n = 7;
    int pre[8] = {0};
    for (int i = 1; i <= n; i++) {
        pre[i] = pre[i - 1] + steps[i - 1];
    }
    int a = {{a}};
    int b = {{b}};
    printf("%d\\n", pre[b] - pre[a - 1]);
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> steps = {3, 1, 4, 1, 5, 9, 2};
    int n = steps.size();
    std::vector<int> pre(n + 1, 0);
    for (int i = 1; i <= n; i++) {
        pre[i] = pre[i - 1] + steps[i - 1];
    }
    int a = {{a}};
    int b = {{b}};
    std::cout << pre[b] - pre[a - 1] << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] steps = {3, 1, 4, 1, 5, 9, 2};
        int n = steps.length;
        int[] pre = new int[n + 1];
        for (int i = 1; i <= n; i++) {
            pre[i] = pre[i - 1] + steps[i - 1];
        }
        int a = {{a}};
        int b = {{b}};
        System.out.println(pre[b] - pre[a - 1]);
    }
}
`,
        python: `steps = [3, 1, 4, 1, 5, 9, 2]
n = len(steps)
pre = [0] * (n + 1)
for i in range(1, n + 1):
    pre[i] = pre[i - 1] + steps[i - 1]
a = {{a}}
b = {{b}}
print(pre[b] - pre[a - 1])
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 10, 7: 11, 8: 12 },
        cpp: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 11, 7: 12, 8: 13 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 9, 7: 10, 8: 11 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "第 3～5 天": [
        {"line":1,"vars":{"steps":[3,1,4,1,5,9,2]},"out":""},
        {"line":2,"vars":{"steps":[3,1,4,1,5,9,2],"n":7},"out":""},
        {"line":3,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,0,0,0,0,0,0,0]},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,0,0,0,0,0,0,0],"i":1},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,0,0,0,0,0,0],"i":1},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,0,0,0,0,0,0],"i":2},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,0,0,0,0,0],"i":2},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,0,0,0,0,0],"i":3},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,0,0,0,0],"i":3},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,0,0,0,0],"i":4},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,0,0,0],"i":4},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,0,0,0],"i":5},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,0,0],"i":5},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,0,0],"i":6},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,0],"i":6},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,0],"i":7},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,25],"i":7},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,25],"i":7},"out":"","cond":false},
        {"line":6,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,25],"i":7,"a":3},"out":""},
        {"line":7,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,25],"i":7,"a":3,"b":5},"out":""},
        {"line":8,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,25],"i":7,"a":3,"b":5},"out":"10\n"},
      ],
      "第 1～7 天": [
        {"line":1,"vars":{"steps":[3,1,4,1,5,9,2]},"out":""},
        {"line":2,"vars":{"steps":[3,1,4,1,5,9,2],"n":7},"out":""},
        {"line":3,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,0,0,0,0,0,0,0]},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,0,0,0,0,0,0,0],"i":1},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,0,0,0,0,0,0],"i":1},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,0,0,0,0,0,0],"i":2},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,0,0,0,0,0],"i":2},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,0,0,0,0,0],"i":3},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,0,0,0,0],"i":3},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,0,0,0,0],"i":4},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,0,0,0],"i":4},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,0,0,0],"i":5},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,0,0],"i":5},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,0,0],"i":6},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,0],"i":6},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,0],"i":7},"out":"","cond":true},
        {"line":5,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,25],"i":7},"out":""},
        {"line":4,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,25],"i":7},"out":"","cond":false},
        {"line":6,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,25],"i":7,"a":1},"out":""},
        {"line":7,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,25],"i":7,"a":1,"b":7},"out":""},
        {"line":8,"vars":{"steps":[3,1,4,1,5,9,2],"n":7,"pre":[0,3,4,8,9,14,23,25],"i":7,"a":1,"b":7},"out":"25\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：上排是七天的步數，下排是前綴和；每天夾在兩格累計中間（右邊那格＝左邊那格＋這一天）。第 3 到第 5 天標起來，14 − 4 = 10
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const s = svgEl(320, 200), rc = rough.svg(s);
      const box = { stroke: INK, strokeWidth: 1.4, roughness: 0.9, fillStyle: 'solid' };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const steps = [3, 1, 4, 1, 5, 9, 2], pre = [0, 3, 4, 8, 9, 14, 23, 25];
      const CELL = 36, LEFT = 16, TOP = 30, LOW = 108, H = 32;
      label(160, 14, '每天走的步數（千步），第 1 到第 7 天', 12, true);
      steps.forEach((v, i) => {
        const x = LEFT + CELL / 2 + i * CELL, day = i + 1;
        s.append(rc.rectangle(x, TOP, CELL, H, { ...box, seed: 20 + i, fill: day >= 3 && day <= 5 ? NEW : FILL }));
        label(x + CELL / 2, TOP + H / 2, String(v), 15);
        label(x + CELL / 2, TOP + H + 12, String(day), 11, true);
      });
      label(160, 96, '前綴和 pre[i]：前 i 天加起來', 12, true);
      pre.forEach((v, i) => {
        const x = LEFT + i * CELL;
        s.append(rc.rectangle(x, LOW, CELL, H, { ...box, seed: 40 + i, fill: i === 2 || i === 5 ? NEW : FILL }));
        label(x + CELL / 2, LOW + H / 2, String(v), 15);
        label(x + CELL / 2, LOW + H + 12, String(i), 11, true);
      });
      label(160, 182, '第 3～5 天：pre[5] − pre[2] = 14 − 4 = 10', 13);
      return s;
    },
    code: {
      c: `#include <stdio.h>

// pre[i] 是前 i 天的總和，pre[0] = 0
void build_prefix(const int steps[], int n, int pre[]) {
    pre[0] = 0;
    for (int i = 1; i <= n; i++) {
        pre[i] = pre[i - 1] + steps[i - 1];
    }
}

// 第 a 天到第 b 天（從 1 數）的總和
int range_sum(const int pre[], int a, int b) {
    return pre[b] - pre[a - 1];
}

int main(void) {
    int steps[] = {3, 1, 4, 1, 5, 9, 2};
    int pre[8];
    build_prefix(steps, 7, pre);
    printf("%d %d %d\\n", range_sum(pre, 3, 5), range_sum(pre, 1, 7), range_sum(pre, 6, 6));
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// pre[i] 是前 i 天的總和，pre[0] = 0
std::vector<int> build_prefix(const std::vector<int>& steps) {
    std::vector<int> pre(steps.size() + 1, 0);
    for (size_t i = 1; i <= steps.size(); i++) {
        pre[i] = pre[i - 1] + steps[i - 1];
    }
    return pre;
}

// 第 a 天到第 b 天（從 1 數）的總和
int range_sum(const std::vector<int>& pre, int a, int b) {
    return pre[b] - pre[a - 1];
}

int main() {
    std::vector<int> steps = {3, 1, 4, 1, 5, 9, 2};
    std::vector<int> pre = build_prefix(steps);
    std::cout << range_sum(pre, 3, 5) << " " << range_sum(pre, 1, 7) << " " << range_sum(pre, 6, 6) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // pre[i] 是前 i 天的總和，pre[0] = 0
    static int[] buildPrefix(int[] steps) {
        int[] pre = new int[steps.length + 1];
        for (int i = 1; i <= steps.length; i++) {
            pre[i] = pre[i - 1] + steps[i - 1];
        }
        return pre;
    }

    // 第 a 天到第 b 天（從 1 數）的總和
    static int rangeSum(int[] pre, int a, int b) {
        return pre[b] - pre[a - 1];
    }

    public static void main(String[] args) {
        int[] steps = {3, 1, 4, 1, 5, 9, 2};
        int[] pre = buildPrefix(steps);
        System.out.println(rangeSum(pre, 3, 5) + " " + rangeSum(pre, 1, 7) + " " + rangeSum(pre, 6, 6));
    }
}
`,
      python: `def build_prefix(steps):                 # pre[i] 是前 i 天的總和，pre[0] = 0
    pre = [0] * (len(steps) + 1)
    for i in range(1, len(steps) + 1):
        pre[i] = pre[i - 1] + steps[i - 1]
    return pre


def range_sum(pre, a, b):                # 第 a 天到第 b 天（從 1 數）的總和
    return pre[b] - pre[a - 1]


steps = [3, 1, 4, 1, 5, 9, 2]
pre = build_prefix(steps)
print(range_sum(pre, 3, 5), range_sum(pre, 1, 7), range_sum(pre, 6, 6))
`,
      output: '10 25 9',
    },
    // 跑幾步：每次從頭加和先建前綴和比一比
    cost: {
      rows: [
        ['每問一段都從頭加：一段最長 n 天', '一次最多 n 次加法，O(n)'],
        ['先建前綴和：迴圈跑 n 圈，每圈一次加法', 'n 次，O(n)，只做一次'],
        ['建好以後每問一段：一次減法', 'O(1)'],
        ['問 q 次合起來', '每次從頭加 O(n × q)；前綴和 O(n + q)'],
      ],
      note: { text: '一年 365 天、問 1000 次：每次從頭加最多 36 萬多次加法，前綴和是 365 次加法加 1000 次減法。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '六天的步數是 2、7、1、8、2、8。下面這段程式印出什麼？',
        code: {
          c: `int steps[] = {2, 7, 1, 8, 2, 8};
int pre[7] = {0};
for (int i = 1; i <= 6; i++) {
    pre[i] = pre[i - 1] + steps[i - 1];
}
printf("%d\\n", pre[5] - pre[2]);`,
          cpp: `std::vector<int> steps = {2, 7, 1, 8, 2, 8};
std::vector<int> pre(7, 0);
for (int i = 1; i <= 6; i++) {
    pre[i] = pre[i - 1] + steps[i - 1];
}
std::cout << pre[5] - pre[2] << "\\n";`,
          java: `int[] steps = {2, 7, 1, 8, 2, 8};
int[] pre = new int[7];
for (int i = 1; i <= 6; i++) {
    pre[i] = pre[i - 1] + steps[i - 1];
}
System.out.println(pre[5] - pre[2]);`,
          python: `steps = [2, 7, 1, 8, 2, 8]
pre = [0] * 7
for i in range(1, 7):
    pre[i] = pre[i - 1] + steps[i - 1]
print(pre[5] - pre[2])`,
        },
        options: ['18', '11', '20', '19'],
        answer: 1,
        why: 'pre 是 0、2、9、10、18、20、28，pre[5] − pre[2] = 20 − 9 = 11，也就是第 3 到第 5 天：1 + 8 + 2。18 是第 2 到第 5 天，以為減掉 pre[2] 還會留下第 2 天，可是 pre[2] 已經包含第 2 天；20 是只看 pre[5]，忘了減；19 是第 3 到第 6 天，把 pre[i] 當成「前 i + 1 天」，整段往後挪了一天。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int steps[] = {2, 7, 1, 8, 2, 8};\n    int pre[7] = {0};\n    for (int i = 1; i <= 6; i++) {\n        pre[i] = pre[i - 1] + steps[i - 1];\n    }\n    printf("%d\\n", pre[5] - pre[2]);\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> steps = {2, 7, 1, 8, 2, 8};\n    std::vector<int> pre(7, 0);\n    for (int i = 1; i <= 6; i++) {\n        pre[i] = pre[i - 1] + steps[i - 1];\n    }\n    std::cout << pre[5] - pre[2] << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int[] steps = {2, 7, 1, 8, 2, 8};\n        int[] pre = new int[7];\n        for (int i = 1; i <= 6; i++) {\n            pre[i] = pre[i - 1] + steps[i - 1];\n        }\n        System.out.println(pre[5] - pre[2]);\n    }\n}\n',
          python: 'steps = [2, 7, 1, 8, 2, 8]\npre = [0] * 7\nfor i in range(1, 7):\n    pre[i] = pre[i - 1] + steps[i - 1]\nprint(pre[5] - pre[2])\n',
        },
        output: '11',
      },
      {
        kind: '程式填空',
        prompt: 'pre 已經照這一頁的方法建好了（pre[0] = 0）。要印出第 a 天到第 b 天的總和，____ 要填什麼？',
        code: {
          c: `int lo = ____;
printf("%d\\n", pre[b] - pre[lo]);`,
          cpp: `int lo = ____;
std::cout << pre[b] - pre[lo] << "\\n";`,
          java: `int lo = ____;
System.out.println(pre[b] - pre[lo]);`,
          python: `lo = ____
print(pre[b] - pre[lo])`,
        },
        options: ['a', 'a + 1', 'a - 1', 'b - a'],
        answer: 2,
        why: '要扣掉的是第 a 天「之前」的那些天，也就是前 a − 1 天，所以 lo = a − 1。驗算用第 3 到第 5 天：pre[5] − pre[2] = 14 − 4 = 10。填 a 會少算第 a 天，得到 6；填 a + 1 又少一天，得到 5；b − a 是兩天差幾天，不是位置，pre[5] − pre[2] 剛好也是 10，換一段（第 1 到第 7 天）就錯：25 − pre[6] = 2，正確是 25。',
        // 驗算用的程式把空格 ____ 當成一個變數，前一行填進正解
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int pre[8] = {0, 3, 4, 8, 9, 14, 23, 25};\n    int a = 3, b = 5;\n    int ____ = a - 1;\n    int lo = ____;\n    printf("%d\\n", pre[b] - pre[lo]);\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> pre = {0, 3, 4, 8, 9, 14, 23, 25};\n    int a = 3, b = 5;\n    int ____ = a - 1;\n    int lo = ____;\n    std::cout << pre[b] - pre[lo] << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int[] pre = {0, 3, 4, 8, 9, 14, 23, 25};\n        int a = 3, b = 5;\n        int ____ = a - 1;\n        int lo = ____;\n        System.out.println(pre[b] - pre[lo]);\n    }\n}\n',
          python: 'pre = [0, 3, 4, 8, 9, 14, 23, 25]\na, b = 3, 5\n____ = a - 1\nlo = ____\nprint(pre[b] - pre[lo])\n',
        },
        output: '10',
      },
      {
        kind: '程式效能分析',
        prompt: '一年 365 天的步數，App 被問了 1000 次某一段的總和。下面這段程式用 ops 數加減法做了幾次，印出多少？',
        code: {
          c: `int ops = 0;
for (int i = 1; i <= n; i++) {
    pre[i] = pre[i - 1] + steps[i - 1];
    ops += 1;
}
for (int k = 0; k < q; k++) {
    ans = pre[b] - pre[a - 1];
    ops += 1;
}
printf("%d\\n", ops);`,
          cpp: `int ops = 0;
for (int i = 1; i <= n; i++) {
    pre[i] = pre[i - 1] + steps[i - 1];
    ops += 1;
}
for (int k = 0; k < q; k++) {
    ans = pre[b] - pre[a - 1];
    ops += 1;
}
std::cout << ops << "\\n";`,
          java: `int ops = 0;
for (int i = 1; i <= n; i++) {
    pre[i] = pre[i - 1] + steps[i - 1];
    ops += 1;
}
for (int k = 0; k < q; k++) {
    ans = pre[b] - pre[a - 1];
    ops += 1;
}
System.out.println(ops);`,
          python: `ops = 0
for i in range(1, n + 1):
    pre[i] = pre[i - 1] + steps[i - 1]
    ops += 1
for k in range(q):
    ans = pre[b] - pre[a - 1]
    ops += 1
print(ops)`,
        },
        options: ['365000', '1365', '1000', '365'],
        answer: 1,
        why: '建前綴和跑 365 圈、做 365 次加法；之後每問一次只做 1 次減法，1000 次就是 1000 次，一共 1365。365000 是每問一次都從頭加滿 365 天的上限，沒有前綴和才會這麼多；1000 是只數了查詢、忘了建表那一趟；365 是只數了建表。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int n = 365, q = 1000, a = 10, b = 40, ans = 0;\n    int steps[365], pre[366];\n    for (int i = 0; i < n; i++) {\n        steps[i] = 1;\n    }\n    pre[0] = 0;\n    int ops = 0;\n    for (int i = 1; i <= n; i++) {\n        pre[i] = pre[i - 1] + steps[i - 1];\n        ops += 1;\n    }\n    for (int k = 0; k < q; k++) {\n        ans = pre[b] - pre[a - 1];\n        ops += 1;\n    }\n    printf("%d\\n", ops);\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nint main() {\n    int n = 365, q = 1000, a = 10, b = 40, ans = 0;\n    std::vector<int> steps(n, 1), pre(n + 1, 0);\n    int ops = 0;\n    for (int i = 1; i <= n; i++) {\n        pre[i] = pre[i - 1] + steps[i - 1];\n        ops += 1;\n    }\n    for (int k = 0; k < q; k++) {\n        ans = pre[b] - pre[a - 1];\n        ops += 1;\n    }\n    std::cout << ops << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int n = 365, q = 1000, a = 10, b = 40, ans = 0;\n        int[] steps = new int[n];\n        java.util.Arrays.fill(steps, 1);\n        int[] pre = new int[n + 1];\n        int ops = 0;\n        for (int i = 1; i <= n; i++) {\n            pre[i] = pre[i - 1] + steps[i - 1];\n            ops += 1;\n        }\n        for (int k = 0; k < q; k++) {\n            ans = pre[b] - pre[a - 1];\n            ops += 1;\n        }\n        System.out.println(ops);\n    }\n}\n',
          python: 'n, q, a, b = 365, 1000, 10, 40\nsteps = [1] * n\npre = [0] * (n + 1)\nops = 0\nfor i in range(1, n + 1):\n    pre[i] = pre[i - 1] + steps[i - 1]\n    ops += 1\nfor k in range(q):\n    ans = pre[b] - pre[a - 1]\n    ops += 1\nprint(ops)\n',
        },
        output: '1365',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的兩種延伸
    extra: [
      { text: '二維前綴和：試算表、照片這種格子資料，pre[i][j] 存左上角到第 i 列第 j 行這一塊的總和。任何一塊長方形的總和，用四個數加加減減就算完：右下角那格，減掉上面那塊、減掉左邊那塊，再把左上角被扣了兩次的那塊加回來。用途裡的積分影像就是它。', see: 'integral_image' },
      '差分陣列（difference array）：前綴和反過來用。要把一整段日子都加上同一個數（第 3 到第 5 天每天多 2 千步），不用一天一天改，只在第 3 天記 +2、第 6 天記 −2，最後對這些記號做一次前綴和，每一天該加多少就都出來了。適合「改很多次、最後才看結果」的題目。',
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'prefix_sum', page);
})(typeof window !== 'undefined' ? window : globalThis);
