// classroom/algorithms/sliding_window.js — 演算法「滑動視窗」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '夜市一條路上有 12 攤你都想吃。你打算從某一攤開始，一攤接一攤吃過去，不跳攤。口袋裡有 300 元，最多可以連吃幾攤？',
    // 複習：雙指標頁的兩根手指換成同方向走；兩層迴圈把每一段都加一遍會重複加中間那幾攤；quote 是這頁的核心想法
    review: [
      { text: '雙指標那一頁，兩根手指從兩頭往中間收。這次兩根手指從同一頭出發、往同一個方向走。', see: 'two_pointers' },
      '用兩層迴圈把每一段都加一遍，12 攤有 78 段；可是起點往右挪一攤的時候，中間那幾攤剛剛才加過。',
      { quote: '右邊多吃一攤就加進來，超過預算就從左邊退掉一攤；總和跟著加加減減，不用重算。' },
    ],
    summary: '最多 4 攤，例如第 2 攤到第 5 攤，90 + 50 + 120 + 40 剛好 300 元。不用把 78 段都加一遍，兩根手指各從頭走到尾一次就知道。下次碰到「連續的一段，最長或最短是多少」，你就知道：用一個視窗框住它，右邊進、左邊出。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '最近 7 天的平均步數、股票的均線：視窗固定 7 格寬，每過一天，加進新的一天、減掉最舊的一天。',
      '網站限制「一分鐘內最多 100 次請求」：只看最近一分鐘這個視窗裡有幾次，舊的請求從左邊滑出去。',
      '一串字裡最長的一段、裡面沒有重複的字元：右邊進來的字跟視窗裡的重複了，左邊就一直退到不重複為止。',
      'APCS 實作題：連續一段的總和不超過 k 的最長長度、總和至少 k 的最短長度。',
    ],
    concept: [
      { text: '滑動視窗（sliding window）是雙指標的一種：left、right 都從最左邊出發，中間夾的那一段叫視窗。right 一格一格往右，把新的一攤加進總和；總和超過預算，left 就往右，把離開的那一攤減掉，一直退到不超過為止。', see: 'two_pointers' },
      '每一步做完，視窗是「吃到 right 這一攤為止、吃得起的最長一段」。把每一步的長度記下最大的，就是答案。',
      'left 為什麼不用往回走：right 往右一攤之後，起點如果比現在的 left 還早，那一段會把剛才已經超過預算的那一段包在裡面，只會更貴。所以 left 只會往右。兩根手指各走一趟，最多 2n 步。',
      '前提是價錢都不是負的：多吃一攤總和不會變少，少吃一攤不會變多，「超過就從左邊退」才成立。',
      '視窗也可以固定寬度（最近 7 天）：每往右一格，右邊進一個、左邊出一個。',
    ],
    traps: [
      { wrong: '超過預算的時候，left 退一攤就夠了', right: '新進來的那一攤可能很貴，退一攤不一定回到預算內。要用 while 一直退到不超過為止，寫成 if 會留下超過預算的視窗（試試看第二題）。' },
      { wrong: 'for 裡面還有一個 while，所以是 O(n²)', right: 'left 從頭到尾只往右走，全部加起來最多走 n 步，不是每一圈都從頭走。兩根手指合起來最多 2n 步，是 O(n)。' },
      { wrong: '視窗的長度是 right − left', right: '兩頭都算在裡面，是 right − left + 1。' },
      { wrong: '有負數也照樣能用', right: '夜市裡如果有一攤是「折 50 元」，超過預算之後再往右吃到那一攤，可能又回到預算內；這時候從左邊退就會錯過答案。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{b}} 換成挑的那組預算；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '200 元', values: { b: 200 } }, { label: '300 元', values: { b: 300 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int prices[] = {60, 90, 50, 120, 40};
    int budget = {{b}};
    int left = 0;
    int total = 0;
    int best = 0;
    for (int right = 0; right < 5; right++) {
        total += prices[right];
        while (total > budget) {
            total -= prices[left];
            left += 1;
        }
        if (right - left + 1 > best) {
            best = right - left + 1;
        }
    }
    printf("%d\\n", best);
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> prices = {60, 90, 50, 120, 40};
    int budget = {{b}};
    int left = 0;
    int total = 0;
    int best = 0;
    for (int right = 0; right < 5; right++) {
        total += prices[right];
        while (total > budget) {
            total -= prices[left];
            left += 1;
        }
        if (right - left + 1 > best) {
            best = right - left + 1;
        }
    }
    std::cout << best << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] prices = {60, 90, 50, 120, 40};
        int budget = {{b}};
        int left = 0;
        int total = 0;
        int best = 0;
        for (int right = 0; right < 5; right++) {
            total += prices[right];
            while (total > budget) {
                total -= prices[left];
                left += 1;
            }
            if (right - left + 1 > best) {
                best = right - left + 1;
            }
        }
        System.out.println(best);
    }
}
`,
        python: `prices = [60, 90, 50, 120, 40]
budget = {{b}}
left = 0
total = 0
best = 0
for right in range(5):
    total += prices[right]
    while total > budget:
        total -= prices[left]
        left += 1
    if right - left + 1 > best:
        best = right - left + 1
print(best)
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 13, 11: 15, 12: 16, 13: 19 },
        cpp: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 10, 7: 11, 8: 12, 9: 13, 10: 14, 11: 16, 12: 17, 13: 20 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 11, 10: 12, 11: 14, 12: 15, 13: 18 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "200 元": [
        {"line":1,"vars":{"prices":[60,90,50,120,40]},"out":""},
        {"line":2,"vars":{"prices":[60,90,50,120,40],"budget":200},"out":""},
        {"line":3,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0},"out":""},
        {"line":4,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":0},"out":""},
        {"line":5,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":0,"best":0},"out":""},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":0,"best":0,"right":0},"out":"","cond":true},
        {"line":7,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":60,"best":0,"right":0},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":60,"best":0,"right":0},"out":"","cond":false},
        {"line":11,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":60,"best":0,"right":0},"out":"","cond":true},
        {"line":12,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":60,"best":1,"right":0},"out":""},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":60,"best":1,"right":1},"out":"","cond":true},
        {"line":7,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":150,"best":1,"right":1},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":150,"best":1,"right":1},"out":"","cond":false},
        {"line":11,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":150,"best":1,"right":1},"out":"","cond":true},
        {"line":12,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":150,"best":2,"right":1},"out":""},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":150,"best":2,"right":2},"out":"","cond":true},
        {"line":7,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":200,"best":2,"right":2},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":200,"best":2,"right":2},"out":"","cond":false},
        {"line":11,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":200,"best":2,"right":2},"out":"","cond":true},
        {"line":12,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":200,"best":3,"right":2},"out":""},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":200,"best":3,"right":3},"out":"","cond":true},
        {"line":7,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":320,"best":3,"right":3},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":320,"best":3,"right":3},"out":"","cond":true},
        {"line":9,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":0,"total":260,"best":3,"right":3},"out":""},
        {"line":10,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":1,"total":260,"best":3,"right":3},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":1,"total":260,"best":3,"right":3},"out":"","cond":true},
        {"line":9,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":1,"total":170,"best":3,"right":3},"out":""},
        {"line":10,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":2,"total":170,"best":3,"right":3},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":2,"total":170,"best":3,"right":3},"out":"","cond":false},
        {"line":11,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":2,"total":170,"best":3,"right":3},"out":"","cond":false},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":2,"total":170,"best":3,"right":4},"out":"","cond":true},
        {"line":7,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":2,"total":210,"best":3,"right":4},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":2,"total":210,"best":3,"right":4},"out":"","cond":true},
        {"line":9,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":2,"total":160,"best":3,"right":4},"out":""},
        {"line":10,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":3,"total":160,"best":3,"right":4},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":3,"total":160,"best":3,"right":4},"out":"","cond":false},
        {"line":11,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":3,"total":160,"best":3,"right":4},"out":"","cond":false},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":3,"total":160,"best":3,"right":4},"out":"","cond":false},
        {"line":13,"vars":{"prices":[60,90,50,120,40],"budget":200,"left":3,"total":160,"best":3,"right":4},"out":"3\n"},
      ],
      "300 元": [
        {"line":1,"vars":{"prices":[60,90,50,120,40]},"out":""},
        {"line":2,"vars":{"prices":[60,90,50,120,40],"budget":300},"out":""},
        {"line":3,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0},"out":""},
        {"line":4,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":0},"out":""},
        {"line":5,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":0,"best":0},"out":""},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":0,"best":0,"right":0},"out":"","cond":true},
        {"line":7,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":60,"best":0,"right":0},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":60,"best":0,"right":0},"out":"","cond":false},
        {"line":11,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":60,"best":0,"right":0},"out":"","cond":true},
        {"line":12,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":60,"best":1,"right":0},"out":""},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":60,"best":1,"right":1},"out":"","cond":true},
        {"line":7,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":150,"best":1,"right":1},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":150,"best":1,"right":1},"out":"","cond":false},
        {"line":11,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":150,"best":1,"right":1},"out":"","cond":true},
        {"line":12,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":150,"best":2,"right":1},"out":""},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":150,"best":2,"right":2},"out":"","cond":true},
        {"line":7,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":200,"best":2,"right":2},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":200,"best":2,"right":2},"out":"","cond":false},
        {"line":11,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":200,"best":2,"right":2},"out":"","cond":true},
        {"line":12,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":200,"best":3,"right":2},"out":""},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":200,"best":3,"right":3},"out":"","cond":true},
        {"line":7,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":320,"best":3,"right":3},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":320,"best":3,"right":3},"out":"","cond":true},
        {"line":9,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":0,"total":260,"best":3,"right":3},"out":""},
        {"line":10,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":1,"total":260,"best":3,"right":3},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":1,"total":260,"best":3,"right":3},"out":"","cond":false},
        {"line":11,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":1,"total":260,"best":3,"right":3},"out":"","cond":false},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":1,"total":260,"best":3,"right":4},"out":"","cond":true},
        {"line":7,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":1,"total":300,"best":3,"right":4},"out":""},
        {"line":8,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":1,"total":300,"best":3,"right":4},"out":"","cond":false},
        {"line":11,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":1,"total":300,"best":3,"right":4},"out":"","cond":true},
        {"line":12,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":1,"total":300,"best":4,"right":4},"out":""},
        {"line":6,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":1,"total":300,"best":4,"right":4},"out":"","cond":false},
        {"line":13,"vars":{"prices":[60,90,50,120,40],"budget":300,"left":1,"total":300,"best":4,"right":4},"out":"4\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：開場那 12 攤、預算 300 元，視窗每動一次畫一列（從吃到第 3 攤看起，共六列）：視窗裡的攤位塗黃，下面寫是哪幾攤、總和和下一步
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const prices = [60, 90, 50, 120, 40, 70, 80, 100, 30, 110, 50, 60], BUDGET = 300;
      const states = [];   // 每加進一攤、每退掉一攤各記一次 [left, right, total]
      let left = 0, total = 0;
      prices.forEach((price, right) => {
        total += price; states.push([left, right, total]);
        while (total > BUDGET) { total -= prices[left]; left += 1; states.push([left, right, total]); }
      });
      const rows = states.slice(2, 8);
      const s = svgEl(320, 292), rc = rough.svg(s);
      const box = { stroke: INK, strokeWidth: 1.3, roughness: 0.9, fillStyle: 'solid' };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const CELL = 24, LEFT = 16, H = 22;
      label(160, 12, '12 攤、預算 300 元，從吃到第 3 攤看起', 12, true);
      rows.forEach(([l, r, sum], k) => {
        const y = 28 + k * 44;
        prices.forEach((price, i) => {
          const x = LEFT + i * CELL;
          s.append(rc.rectangle(x, y, CELL, H, { ...box, seed: 40 + k * 12 + i, fill: i >= l && i <= r ? NEW : FILL }));
          label(x + CELL / 2, y + H / 2, String(price), 10);
        });
        const next = sum > BUDGET ? '超過，左邊退一攤' : sum === BUDGET ? '剛好用完' : '還吃得下';
        label(160, y + H + 11, `第 ${l + 1}～${r + 1} 攤：${sum}，${next}`, 12);
      });
      return s;
    },
    code: {
      c: `#include <stdio.h>

// 連續吃、總和不超過 budget，最多可以吃幾攤；價錢都不能是負的
int longest_run(const int prices[], int n, int budget) {
    int left = 0, total = 0, best = 0;
    for (int right = 0; right < n; right++) {
        total += prices[right];          // 右邊多吃一攤
        while (total > budget) {         // 超過預算：從左邊一攤一攤退，退到不超過為止
            total -= prices[left];
            left++;
        }
        if (right - left + 1 > best) {   // 視窗兩頭都算，長度是 right - left + 1
            best = right - left + 1;
        }
    }
    return best;
}

int main(void) {
    int prices[] = {60, 90, 50, 120, 40, 70, 80, 100, 30, 110, 50, 60};
    printf("%d %d\\n", longest_run(prices, 12, 300), longest_run(prices, 12, 200));
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// 連續吃、總和不超過 budget，最多可以吃幾攤；價錢都不能是負的
int longest_run(const std::vector<int>& prices, int n, int budget) {
    int left = 0, total = 0, best = 0;
    for (int right = 0; right < n; right++) {
        total += prices[right];          // 右邊多吃一攤
        while (total > budget) {         // 超過預算：從左邊一攤一攤退，退到不超過為止
            total -= prices[left];
            left++;
        }
        if (right - left + 1 > best) {   // 視窗兩頭都算，長度是 right - left + 1
            best = right - left + 1;
        }
    }
    return best;
}

int main() {
    std::vector<int> prices = {60, 90, 50, 120, 40, 70, 80, 100, 30, 110, 50, 60};
    std::cout << longest_run(prices, 12, 300) << " " << longest_run(prices, 12, 200) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 連續吃、總和不超過 budget，最多可以吃幾攤；價錢都不能是負的
    static int longestRun(int[] prices, int n, int budget) {
        int left = 0, total = 0, best = 0;
        for (int right = 0; right < n; right++) {
            total += prices[right];          // 右邊多吃一攤
            while (total > budget) {         // 超過預算：從左邊一攤一攤退，退到不超過為止
                total -= prices[left];
                left++;
            }
            if (right - left + 1 > best) {   // 視窗兩頭都算，長度是 right - left + 1
                best = right - left + 1;
            }
        }
        return best;
    }

    public static void main(String[] args) {
        int[] prices = {60, 90, 50, 120, 40, 70, 80, 100, 30, 110, 50, 60};
        System.out.println(longestRun(prices, 12, 300) + " " + longestRun(prices, 12, 200));
    }
}
`,
      python: `def longest_run(prices, n, budget):      # 連續吃、總和不超過 budget，最多可以吃幾攤；價錢都不能是負的
    left, total, best = 0, 0, 0
    for right in range(n):
        total += prices[right]           # 右邊多吃一攤
        while total > budget:            # 超過預算：從左邊一攤一攤退，退到不超過為止
            total -= prices[left]
            left += 1
        if right - left + 1 > best:      # 視窗兩頭都算，長度是 right - left + 1
            best = right - left + 1
    return best


prices = [60, 90, 50, 120, 40, 70, 80, 100, 30, 110, 50, 60]
print(longest_run(prices, 12, 300), longest_run(prices, 12, 200))
`,
      output: '4 3',
    },
    cost: {
      rows: [
        ['兩層迴圈把每一段都加一遍', 'n(n + 1) / 2 段，至少 O(n²)'],
        ['滑動視窗：right 走 n 步、left 最多走 n 步', 'O(n)'],
      ],
      note: { text: '12 攤 78 段對 24 步以內；一萬攤是五千萬段對兩萬步。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '另一條夜市有 6 攤，預算 150 元，一樣要一攤接一攤吃。下面這段程式印出什麼？',
        code: {
          c: `int prices[] = {40, 70, 30, 90, 20, 50};
int left = 0, total = 0, best = 0;
for (int right = 0; right < 6; right++) {
    total += prices[right];
    while (total > 150) {
        total -= prices[left];
        left += 1;
    }
    if (right - left + 1 > best) {
        best = right - left + 1;
    }
}
printf("%d\\n", best);`,
          cpp: `std::vector<int> prices = {40, 70, 30, 90, 20, 50};
int left = 0, total = 0, best = 0;
for (int right = 0; right < 6; right++) {
    total += prices[right];
    while (total > 150) {
        total -= prices[left];
        left += 1;
    }
    if (right - left + 1 > best) {
        best = right - left + 1;
    }
}
std::cout << best << "\\n";`,
          java: `int[] prices = {40, 70, 30, 90, 20, 50};
int left = 0, total = 0, best = 0;
for (int right = 0; right < 6; right++) {
    total += prices[right];
    while (total > 150) {
        total -= prices[left];
        left += 1;
    }
    if (right - left + 1 > best) {
        best = right - left + 1;
    }
}
System.out.println(best);`,
          python: `prices = [40, 70, 30, 90, 20, 50]
left, total, best = 0, 0, 0
for right in range(6):
    total += prices[right]
    while total > 150:
        total -= prices[left]
        left += 1
    if right - left + 1 > best:
        best = right - left + 1
print(best)`,
        },
        options: ['2', '3', '4', '6'],
        answer: 1,
        why: '40、70、30 加起來 140，吃得下，best 是 3。加上 90 變成 230，超過 150：退掉 40 還有 190，再退掉 70 剩 120，視窗剩 30、90 兩攤。加上 20 是 140，又是三攤。加上 50 是 190：退掉 30 還有 160，再退掉 90 剩 70，剩兩攤。最長是 3。2 是把長度算成 right − left，兩頭少算了一攤；4 是加上 90 的那一刻就記長度，可是那時候是 230 元，超過預算了，要先退再記；6 是沒有從左邊退，把 6 攤全部算進去，一共要 300 元。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int prices[] = {40, 70, 30, 90, 20, 50};
    int left = 0, total = 0, best = 0;
    for (int right = 0; right < 6; right++) {
        total += prices[right];
        while (total > 150) {
            total -= prices[left];
            left += 1;
        }
        if (right - left + 1 > best) {
            best = right - left + 1;
        }
    }
    printf("%d\\n", best);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> prices = {40, 70, 30, 90, 20, 50};
    int left = 0, total = 0, best = 0;
    for (int right = 0; right < 6; right++) {
        total += prices[right];
        while (total > 150) {
            total -= prices[left];
            left += 1;
        }
        if (right - left + 1 > best) {
            best = right - left + 1;
        }
    }
    std::cout << best << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] prices = {40, 70, 30, 90, 20, 50};
        int left = 0, total = 0, best = 0;
        for (int right = 0; right < 6; right++) {
            total += prices[right];
            while (total > 150) {
                total -= prices[left];
                left += 1;
            }
            if (right - left + 1 > best) {
                best = right - left + 1;
            }
        }
        System.out.println(best);
    }
}
`,
          python: `prices = [40, 70, 30, 90, 20, 50]
left, total, best = 0, 0, 0
for right in range(6):
    total += prices[right]
    while total > 150:
        total -= prices[left]
        left += 1
    if right - left + 1 > best:
        best = right - left + 1
print(best)
`,
        },
        output: '3',
      },
      {
        kind: '程式測試與除錯',
        prompt: '5 攤、預算 150 元。這段程式想印出走完之後視窗裡還有幾攤、一共多少錢，結果印出 2 160：160 元超過預算了。要怎麼改？',
        code: {
          c: `int prices[] = {60, 90, 50, 120, 40};
int budget = 150;
int left = 0, total = 0;
for (int right = 0; right < 5; right++) {
    total += prices[right];
    if (total > budget) {
        total -= prices[left];
        left += 1;
    }
}
printf("%d %d\\n", 5 - left, total);`,
          cpp: `std::vector<int> prices = {60, 90, 50, 120, 40};
int budget = 150;
int left = 0, total = 0;
for (int right = 0; right < 5; right++) {
    total += prices[right];
    if (total > budget) {
        total -= prices[left];
        left += 1;
    }
}
std::cout << 5 - left << " " << total << "\\n";`,
          java: `int[] prices = {60, 90, 50, 120, 40};
int budget = 150;
int left = 0, total = 0;
for (int right = 0; right < 5; right++) {
    total += prices[right];
    if (total > budget) {
        total -= prices[left];
        left += 1;
    }
}
System.out.println((5 - left) + " " + total);`,
          python: `prices = [60, 90, 50, 120, 40]
budget = 150
left, total = 0, 0
for right in range(5):
    total += prices[right]
    if total > budget:
        total -= prices[left]
        left += 1
print(5 - left, total)`,
        },
        options: ['把 total > budget 改成 total >= budget', '把 if 改成 while，一直退到不超過為止', '把 left += 1 改成 left += 2', '把 total -= prices[left] 和 left += 1 這兩行對調'],
        answer: 1,
        why: '吃到 50 元那攤是 200 元，退掉 60 剩 140，沒問題。加上 120 是 260，if 只退一攤（90），還有 170 就往下走了；加上 40 是 210，再退一攤（50）還有 160。最後視窗是 120、40 兩攤，160 元，超過預算。改成 while 會一直退到不超過為止，最後只剩 40 元那一攤，印出 1 40。改成 >= 還是每次只退一攤，一樣印出 2 160；left 一次加 2 的話，視窗少了兩攤卻只減一攤的錢，印出 -1 210；兩行對調會先移動 left 才減，減掉的是還留在視窗裡的那一攤，印出 2 100，可是那兩攤其實要 160 元。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int prices[] = {60, 90, 50, 120, 40};
    int budget = 150;
    int left = 0, total = 0;
    for (int right = 0; right < 5; right++) {
        total += prices[right];
        if (total > budget) {
            total -= prices[left];
            left += 1;
        }
    }
    printf("%d %d\\n", 5 - left, total);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> prices = {60, 90, 50, 120, 40};
    int budget = 150;
    int left = 0, total = 0;
    for (int right = 0; right < 5; right++) {
        total += prices[right];
        if (total > budget) {
            total -= prices[left];
            left += 1;
        }
    }
    std::cout << 5 - left << " " << total << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] prices = {60, 90, 50, 120, 40};
        int budget = 150;
        int left = 0, total = 0;
        for (int right = 0; right < 5; right++) {
            total += prices[right];
            if (total > budget) {
                total -= prices[left];
                left += 1;
            }
        }
        System.out.println((5 - left) + " " + total);
    }
}
`,
          python: `prices = [60, 90, 50, 120, 40]
budget = 150
left, total = 0, 0
for right in range(5):
    total += prices[right]
    if total > budget:
        total -= prices[left]
        left += 1
print(5 - left, total)
`,
        },
        output: '2 160',
      },
      {
        kind: '程式效能分析',
        prompt: 'prices 是 1000 攤，每一攤都是 10 元；budget 是 95。left、total 都從 0 開始，moves 數的是兩根手指一共移動幾次。下面這段程式印出的 moves 是多少？',
        code: {
          c: `int moves = 0;
for (int right = 0; right < 1000; right++) {
    moves += 1;
    total += prices[right];
    while (total > budget) {
        total -= prices[left];
        left += 1;
        moves += 1;
    }
}
printf("%d\\n", moves);`,
          cpp: `int moves = 0;
for (int right = 0; right < 1000; right++) {
    moves += 1;
    total += prices[right];
    while (total > budget) {
        total -= prices[left];
        left += 1;
        moves += 1;
    }
}
std::cout << moves << "\\n";`,
          java: `int moves = 0;
for (int right = 0; right < 1000; right++) {
    moves += 1;
    total += prices[right];
    while (total > budget) {
        total -= prices[left];
        left += 1;
        moves += 1;
    }
}
System.out.println(moves);`,
          python: `moves = 0
for right in range(1000):
    moves += 1
    total += prices[right]
    while total > budget:
        total -= prices[left]
        left += 1
        moves += 1
print(moves)`,
        },
        options: ['500500', '1991', '1000000', '2000'],
        answer: 1,
        why: 'right 從頭走到尾是 1000 次。每攤 10 元、預算 95 元，視窗最多放 9 攤：前 9 攤不用退，從第 10 攤開始每進一攤就退一攤，left 一共退 991 次。1000 + 991 = 1991。500500 是兩層迴圈要加的段數，1000 × 1001 / 2；1000000 是以為 for 裡面的 while 每一圈都跑 1000 次，可是 left 不會回頭；2000 是 2n 這個上限，可是走完的時候還有 9 攤留在視窗裡，left 沒有走到底。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int prices[1000];
    for (int i = 0; i < 1000; i++) {
        prices[i] = 10;
    }
    int budget = 95, left = 0, total = 0;
    int moves = 0;
    for (int right = 0; right < 1000; right++) {
        moves += 1;
        total += prices[right];
        while (total > budget) {
            total -= prices[left];
            left += 1;
            moves += 1;
        }
    }
    printf("%d\\n", moves);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> prices(1000, 10);
    int budget = 95, left = 0, total = 0;
    int moves = 0;
    for (int right = 0; right < 1000; right++) {
        moves += 1;
        total += prices[right];
        while (total > budget) {
            total -= prices[left];
            left += 1;
            moves += 1;
        }
    }
    std::cout << moves << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] prices = new int[1000];
        for (int i = 0; i < 1000; i++) {
            prices[i] = 10;
        }
        int budget = 95, left = 0, total = 0;
        int moves = 0;
        for (int right = 0; right < 1000; right++) {
            moves += 1;
            total += prices[right];
            while (total > budget) {
                total -= prices[left];
                left += 1;
                moves += 1;
            }
        }
        System.out.println(moves);
    }
}
`,
          python: `prices = [10] * 1000
budget, left, total = 95, 0, 0
moves = 0
for right in range(1000):
    moves += 1
    total += prices[right]
    while total > budget:
        total -= prices[left]
        left += 1
        moves += 1
print(moves)
`,
        },
        output: '1991',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      '反過來問「最短的一段」：連續幾攤加起來至少 300 元，最少要幾攤。right 一樣往右加；總和夠了，就記下長度、從左邊退一攤再看還夠不夠。',
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'sliding_window', page);
})(typeof window !== 'undefined' ? window : globalThis);
