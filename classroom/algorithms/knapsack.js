// classroom/algorithms/knapsack.js — 演算法經典應用「背包問題」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  // 開場那五樣東西：[重量（公斤）, 想要的程度（分）]
  const ITEMS = [[5, 10], [4, 7], [3, 6], [2, 2], [1, 1]];
  const LIMIT = 7;
  // 填表：table[i][w] 是只考慮前 i 樣、額度 w 公斤時最多幾分（跟實作同一個做法）
  function fillTable(items, limit) {
    const table = [new Array(limit + 1).fill(0)];
    items.forEach(([weight, value], k) => {
      const above = table[k];
      table.push(above.map((skip, w) => (w >= weight ? Math.max(skip, above[w - weight] + value) : skip)));
    });
    return table;
  }

  const page = {
    layout: 'program',
    analogy: '出國玩回來，行李還剩 7 公斤的額度。免稅店裡有五樣東西你都想買，重量不一樣，想要的程度也不一樣。要先拿最想要的、最輕的，還是每公斤最划算的？',
    // 複習：三種貪婪的挑法都差一點，回溯全部試過又太多；quote 是這頁的核心想法
    review: [
      { text: '五樣東西 5、4、3、2、1 公斤，想要的程度是 10、7、6、2、1 分。先拿最想要的，拿到 12 分；先拿最輕的，9 分；先拿每公斤最划算的（5 公斤和 3 公斤那兩樣一樣划算，先拿比較想要的 5 公斤），12 分。可是 4 公斤和 3 公斤那兩樣一起拿有 13 分，三種挑法都沒挑到。', see: 'greedy' },
      { text: '回溯每樣選或不選全部試過一定對，可是 30 樣就超過十億種。', see: 'backtracking' },
      { quote: '一樣一樣考慮：這樣東西帶或不帶，兩邊各自最多幾分，挑大的那個記進表裡。' },
    ],
    summary: '三種直覺都差一點：最好的是 4 公斤和 3 公斤那兩樣，13 分。不用把 32 種挑法全部試過，一張 40 格的表填完就知道。下次碰到「每樣東西只能拿一次、總量有上限、要拿到最多」，你就知道：這是背包問題，照動態規劃填表。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '行李限重、搬家時一台貨車裝哪些東西。',
      '預算有限，挑哪幾個計畫做：每個計畫要花多少、效益多少，總花費不能超過預算。',
      { text: '「湊不湊得出某個金額」「用最少的硬幣找零」是它的親戚，一樣是一樣一樣考慮、把每個金額的答案記在表上。', see: 'dp' },
      'APCS 實作題：每樣只能拿一次的 0/1 背包，和每樣可以拿很多次的無限背包。',
    ],
    concept: [
      '0/1 背包問題（0/1 knapsack problem）：有 n 樣東西，各有重量和價值，背包有重量上限；每樣只能拿或不拿，不能切開、不能拿兩次，要讓拿到的總價值最大。',
      { text: '表的每一格是一個小問題的答案：best[i][w] 是「只考慮前 i 樣東西、額度是 w 公斤」時最多幾分。', see: 'dp' },
      '每一格只有兩個選擇。不帶第 i 樣：答案跟只有前 i − 1 樣一樣，是 best[i − 1][w]。帶第 i 樣（額度要裝得下它）：先扣掉它的重量，剩下的額度讓前 i − 1 樣去裝，再加上它的分數，是 best[i − 1][w − 它的重量] + 它的分數。兩個取大的。',
      '第 0 列是一樣都還沒考慮，全部是 0。一列一列往下填，答案在最右下角。',
      '每一列只看上一列，所以可以只留一列。這時候 w 要從大的填到小的：從小的開始填，後面的格子會用到這一輪剛改過的格子，等於同一樣東西拿了兩次。',
    ],
    traps: [
      { wrong: '先拿每公斤最划算的，就會最多分', right: '東西不能切，照這樣拿可能留下塞不滿的額度。開場那五樣，每公斤最划算的是 5 公斤和 3 公斤那兩樣，拿了 5 公斤的就裝不下 3 公斤的，最後只有 12 分；4 公斤加 3 公斤才是 13 分。', see: 'greedy' },
      { wrong: '只留一列的寫法，w 從小到大填也一樣', right: '會把同一樣東西拿很多次，算出來的是「每樣可以拿很多次」的答案。每樣只能拿一次，w 要從大到小（試試看第二題）。' },
      { wrong: '右下角只有分數，查不出拿了哪幾樣', right: '從右下角往回看：這一格跟正上方一樣，就是沒拿這一樣，往上一列；不一樣就是拿了，往上一列、再往左挪它的重量。' },
      { wrong: '東西不多的話，表一定填得完', right: '表有幾格還要看額度多大：n 樣東西、額度 W，大約要填 n × W 格。額度是十億就填不完；這時候東西如果只有二十幾樣，反而用回溯。', see: 'backtracking' },
    ],
    // 程式追蹤器：只留一列的寫法，四種語言同一段程式，{{v}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '第三樣 6 分', values: { v: 6 } }, { label: '第三樣 8 分', values: { v: 8 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int weight[] = {1, 3, 4};
    int value[] = {2, 5, {{v}}};
    int best[] = {0, 0, 0, 0, 0};
    for (int i = 0; i < 3; i++) {
        for (int w = 4; w >= weight[i]; w--) {
            int take = best[w - weight[i]] + value[i];
            if (take > best[w]) {
                best[w] = take;
            }
        }
    }
    printf("%d\\n", best[4]);
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> weight = {1, 3, 4};
    std::vector<int> value = {2, 5, {{v}}};
    std::vector<int> best = {0, 0, 0, 0, 0};
    for (int i = 0; i < 3; i++) {
        for (int w = 4; w >= weight[i]; w--) {
            int take = best[w - weight[i]] + value[i];
            if (take > best[w]) {
                best[w] = take;
            }
        }
    }
    std::cout << best[4] << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] weight = {1, 3, 4};
        int[] value = {2, 5, {{v}}};
        int[] best = {0, 0, 0, 0, 0};
        for (int i = 0; i < 3; i++) {
            for (int w = 4; w >= weight[i]; w--) {
                int take = best[w - weight[i]] + value[i];
                if (take > best[w]) {
                    best[w] = take;
                }
            }
        }
        System.out.println(best[4]);
    }
}
`,
        python: `weight = [1, 3, 4]
value = [2, 5, {{v}}]
best = [0, 0, 0, 0, 0]
for i in range(3):
    for w in range(4, weight[i] - 1, -1):
        take = best[w - weight[i]] + value[i]
        if take > best[w]:
            best[w] = take
print(best[4])
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 15 },
        cpp: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 10, 7: 11, 8: 12, 9: 16 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 14 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "第三樣 6 分": [
        {"line":1,"vars":{"weight":[1,3,4]},"out":""},
        {"line":2,"vars":{"weight":[1,3,4],"value":[2,5,6]},"out":""},
        {"line":3,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,0,0]},"out":""},
        {"line":4,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,0,0],"i":0},"out":"","cond":true},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,0,0],"i":0,"w":4},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,0,0],"i":0,"w":4,"take":2},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,0,0],"i":0,"w":4,"take":2},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,0,2],"i":0,"w":4,"take":2},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,0,2],"i":0,"w":3,"take":2},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,0,2],"i":0,"w":3,"take":2},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,0,2],"i":0,"w":3,"take":2},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,2,2],"i":0,"w":3,"take":2},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,2,2],"i":0,"w":2,"take":2},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,2,2],"i":0,"w":2,"take":2},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,0,2,2],"i":0,"w":2,"take":2},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,2,2,2],"i":0,"w":2,"take":2},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,2,2,2],"i":0,"w":1,"take":2},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,2,2,2],"i":0,"w":1,"take":2},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,0,2,2,2],"i":0,"w":1,"take":2},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,2,2],"i":0,"w":1,"take":2},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,2,2],"i":0,"w":1,"take":2},"out":"","cond":false},
        {"line":4,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,2,2],"i":1,"w":1,"take":2},"out":"","cond":true},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,2,2],"i":1,"w":4,"take":2},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,2,2],"i":1,"w":4,"take":7},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,2,2],"i":1,"w":4,"take":7},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,2,7],"i":1,"w":4,"take":7},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,2,7],"i":1,"w":3,"take":7},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,2,7],"i":1,"w":3,"take":5},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,2,7],"i":1,"w":3,"take":5},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,5,7],"i":1,"w":3,"take":5},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,5,7],"i":1,"w":3,"take":5},"out":"","cond":false},
        {"line":4,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,5,7],"i":2,"w":3,"take":5},"out":"","cond":true},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,5,7],"i":2,"w":4,"take":5},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,5,7],"i":2,"w":4,"take":6},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,5,7],"i":2,"w":4,"take":6},"out":"","cond":false},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,5,7],"i":2,"w":4,"take":6},"out":"","cond":false},
        {"line":4,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,5,7],"i":2,"w":4,"take":6},"out":"","cond":false},
        {"line":9,"vars":{"weight":[1,3,4],"value":[2,5,6],"best":[0,2,2,5,7],"i":2,"w":4,"take":6},"out":"7\n"},
      ],
      "第三樣 8 分": [
        {"line":1,"vars":{"weight":[1,3,4]},"out":""},
        {"line":2,"vars":{"weight":[1,3,4],"value":[2,5,8]},"out":""},
        {"line":3,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,0,0]},"out":""},
        {"line":4,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,0,0],"i":0},"out":"","cond":true},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,0,0],"i":0,"w":4},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,0,0],"i":0,"w":4,"take":2},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,0,0],"i":0,"w":4,"take":2},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,0,2],"i":0,"w":4,"take":2},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,0,2],"i":0,"w":3,"take":2},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,0,2],"i":0,"w":3,"take":2},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,0,2],"i":0,"w":3,"take":2},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,2,2],"i":0,"w":3,"take":2},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,2,2],"i":0,"w":2,"take":2},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,2,2],"i":0,"w":2,"take":2},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,0,2,2],"i":0,"w":2,"take":2},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,2,2,2],"i":0,"w":2,"take":2},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,2,2,2],"i":0,"w":1,"take":2},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,2,2,2],"i":0,"w":1,"take":2},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,0,2,2,2],"i":0,"w":1,"take":2},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,2,2],"i":0,"w":1,"take":2},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,2,2],"i":0,"w":1,"take":2},"out":"","cond":false},
        {"line":4,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,2,2],"i":1,"w":1,"take":2},"out":"","cond":true},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,2,2],"i":1,"w":4,"take":2},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,2,2],"i":1,"w":4,"take":7},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,2,2],"i":1,"w":4,"take":7},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,2,7],"i":1,"w":4,"take":7},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,2,7],"i":1,"w":3,"take":7},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,2,7],"i":1,"w":3,"take":5},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,2,7],"i":1,"w":3,"take":5},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,5,7],"i":1,"w":3,"take":5},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,5,7],"i":1,"w":3,"take":5},"out":"","cond":false},
        {"line":4,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,5,7],"i":2,"w":3,"take":5},"out":"","cond":true},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,5,7],"i":2,"w":4,"take":5},"out":"","cond":true},
        {"line":6,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,5,7],"i":2,"w":4,"take":8},"out":""},
        {"line":7,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,5,7],"i":2,"w":4,"take":8},"out":"","cond":true},
        {"line":8,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,5,8],"i":2,"w":4,"take":8},"out":""},
        {"line":5,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,5,8],"i":2,"w":4,"take":8},"out":"","cond":false},
        {"line":4,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,5,8],"i":2,"w":4,"take":8},"out":"","cond":false},
        {"line":9,"vars":{"weight":[1,3,4],"value":[2,5,8],"best":[0,2,2,5,8],"i":2,"w":4,"take":8},"out":"8\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：6 列 8 欄的表，左邊一欄是每樣東西的重量／分數、上面一列是額度；第 3 樣、額度 7 那一格和它用到的兩格塗黃，表的下面寫這一格怎麼算
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const table = fillTable(ITEMS, LIMIT);
      const ROW_AT = 3, COL_AT = LIMIT;                    // 標出來的那一格：第 3 樣、額度 7
      const [weight, value] = ITEMS[ROW_AT - 1];
      const skip = table[ROW_AT - 1][COL_AT], left = table[ROW_AT - 1][COL_AT - weight];
      const marked = (i, w) => (i === ROW_AT && w === COL_AT) || (i === ROW_AT - 1 && (w === COL_AT || w === COL_AT - weight));
      const s = svgEl(320, 250), rc = rough.svg(s);
      const label = (x, y, text, size = 12, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const LEFT = 56, CELL = 32, TOP = 42, ROW = 24;
      label(160, 12, '每一格：前幾樣東西、這個額度最多幾分', 12, true);
      label(LEFT / 2, 32, '額度', 11, true);
      for (let w = 0; w <= LIMIT; w++) label(LEFT + w * CELL + CELL / 2, 32, String(w), 11, true);
      table.forEach((row, i) => {
        const y = TOP + i * ROW;
        label(LEFT / 2, y + ROW / 2, i === 0 ? '還沒考慮' : `${ITEMS[i - 1][0]}／${ITEMS[i - 1][1]}`, 11, true);
        row.forEach((score, w) => {
          const x = LEFT + w * CELL;
          s.append(rc.rectangle(x, y, CELL, ROW, { stroke: INK, strokeWidth: 1.2, roughness: 0.7, fillStyle: 'solid', fill: marked(i, w) ? NEW : FILL, seed: 100 + i * 10 + w }));
          label(x + CELL / 2, y + ROW / 2, String(score));
        });
      });
      label(160, 202, `第 ${ROW_AT} 樣（${weight} 公斤、${value} 分）、額度 ${COL_AT} 這一格：`);
      label(160, 220, `不帶：${skip} 分｜帶：${left} + ${value} = ${left + value} 分，取大的`);
      label(160, 238, '左邊一欄是每樣東西的重量／分數，上面一列是額度', 11, true);
      return s;
    },
    code: {
      c: `#include <stdio.h>

// 每樣東西只能拿一次，額度 limit 公斤，回傳最多幾分；best[i][w]：只考慮前 i 樣、額度 w 公斤時最多幾分
int max_value(const int weight[], const int value[], int n, int limit) {
    int best[n + 1][limit + 1];
    for (int w = 0; w <= limit; w++) best[0][w] = 0;   // 第 0 列：一樣都還沒考慮，全部是 0
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= limit; w++) {
            best[i][w] = best[i - 1][w];               // 不帶第 i 樣
            if (w >= weight[i - 1]) {                  // 裝得下才能帶（第 i 樣放在陣列的第 i - 1 格）
                int take = best[i - 1][w - weight[i - 1]] + value[i - 1];
                if (take > best[i][w]) best[i][w] = take;
            }
        }
    }
    return best[n][limit];
}

int main(void) {
    int weight[] = {5, 4, 3, 2, 1};
    int value[] = {10, 7, 6, 2, 1};
    printf("%d %d\\n", max_value(weight, value, 5, 7), max_value(weight, value, 5, 10));
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// 每樣東西只能拿一次，額度 limit 公斤，回傳最多幾分；best[i][w]：只考慮前 i 樣、額度 w 公斤時最多幾分
int max_value(const std::vector<int>& weight, const std::vector<int>& value, int limit) {
    int n = weight.size();
    std::vector<std::vector<int>> best(n + 1, std::vector<int>(limit + 1, 0));   // 第 0 列：一樣都還沒考慮，全部是 0
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= limit; w++) {
            best[i][w] = best[i - 1][w];               // 不帶第 i 樣
            if (w >= weight[i - 1]) {                  // 裝得下才能帶（第 i 樣放在陣列的第 i - 1 格）
                int take = best[i - 1][w - weight[i - 1]] + value[i - 1];
                if (take > best[i][w]) best[i][w] = take;
            }
        }
    }
    return best[n][limit];
}

int main() {
    std::vector<int> weight = {5, 4, 3, 2, 1};
    std::vector<int> value = {10, 7, 6, 2, 1};
    std::cout << max_value(weight, value, 7) << " " << max_value(weight, value, 10) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 每樣東西只能拿一次，額度 limit 公斤，回傳最多幾分；best[i][w]：只考慮前 i 樣、額度 w 公斤時最多幾分
    static int maxValue(int[] weight, int[] value, int limit) {
        int n = weight.length;
        int[][] best = new int[n + 1][limit + 1];      // 第 0 列：一樣都還沒考慮，全部是 0
        for (int i = 1; i <= n; i++) {
            for (int w = 0; w <= limit; w++) {
                best[i][w] = best[i - 1][w];           // 不帶第 i 樣
                if (w >= weight[i - 1]) {              // 裝得下才能帶（第 i 樣放在陣列的第 i - 1 格）
                    int take = best[i - 1][w - weight[i - 1]] + value[i - 1];
                    if (take > best[i][w]) best[i][w] = take;
                }
            }
        }
        return best[n][limit];
    }

    public static void main(String[] args) {
        int[] weight = {5, 4, 3, 2, 1};
        int[] value = {10, 7, 6, 2, 1};
        System.out.println(maxValue(weight, value, 7) + " " + maxValue(weight, value, 10));
    }
}
`,
      python: `def max_value(weight, value, limit):   # 每樣東西只能拿一次，額度 limit 公斤，回傳最多幾分
    n = len(weight)
    best = [[0] * (limit + 1) for _ in range(n + 1)]   # best[i][w]：只考慮前 i 樣、額度 w 公斤時最多幾分；第 0 列全部是 0
    for i in range(1, n + 1):
        for w in range(limit + 1):
            best[i][w] = best[i - 1][w]                # 不帶第 i 樣
            if w >= weight[i - 1]:                     # 裝得下才能帶（第 i 樣放在串列的第 i - 1 格）
                take = best[i - 1][w - weight[i - 1]] + value[i - 1]
                if take > best[i][w]:
                    best[i][w] = take
    return best[n][limit]


weight = [5, 4, 3, 2, 1]
value = [10, 7, 6, 2, 1]
print(max_value(weight, value, 7), max_value(weight, value, 10))
`,
      output: '13 18',
    },
    cost: {
      rows: [
        ['回溯每樣選或不選', 'O(2ⁿ)'],
        ['填表', 'n × (W + 1) 格，每格看兩格，O(n × W)'],
        ['只留一列', '時間一樣，空間從 n × W 變成 W'],
      ],
      note: { text: '開場是 5 × 8 = 40 格對 32 種挑法，看不出差別；30 樣東西、額度 100 公斤是三千格對十億種。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '三樣東西重 2、3、4 公斤，分數是 4、5、6 分，每樣只能拿一次，額度 7 公斤。下面這段程式印出什麼？',
        code: {
          c: `int weight[] = {2, 3, 4};
int value[] = {4, 5, 6};
int best[] = {0, 0, 0, 0, 0, 0, 0, 0};
for (int i = 0; i < 3; i++) {
    for (int w = 7; w >= weight[i]; w--) {
        int take = best[w - weight[i]] + value[i];
        if (take > best[w]) {
            best[w] = take;
        }
    }
}
printf("%d\\n", best[7]);`,
          cpp: `std::vector<int> weight = {2, 3, 4};
std::vector<int> value = {4, 5, 6};
std::vector<int> best = {0, 0, 0, 0, 0, 0, 0, 0};
for (int i = 0; i < 3; i++) {
    for (int w = 7; w >= weight[i]; w--) {
        int take = best[w - weight[i]] + value[i];
        if (take > best[w]) {
            best[w] = take;
        }
    }
}
std::cout << best[7] << "\\n";`,
          java: `int[] weight = {2, 3, 4};
int[] value = {4, 5, 6};
int[] best = {0, 0, 0, 0, 0, 0, 0, 0};
for (int i = 0; i < 3; i++) {
    for (int w = 7; w >= weight[i]; w--) {
        int take = best[w - weight[i]] + value[i];
        if (take > best[w]) {
            best[w] = take;
        }
    }
}
System.out.println(best[7]);`,
          python: `weight = [2, 3, 4]
value = [4, 5, 6]
best = [0, 0, 0, 0, 0, 0, 0, 0]
for i in range(3):
    for w in range(7, weight[i] - 1, -1):
        take = best[w - weight[i]] + value[i]
        if take > best[w]:
            best[w] = take
print(best[7])`,
        },
        options: ['9', '11', '13', '15'],
        answer: 1,
        why: '考慮完第一樣，額度 2 以上的格子都是 4。考慮完第二樣，額度 3、4 是 5，額度 5 以上是 9（兩樣都拿）。考慮第三樣，額度 7 那一格：不帶是 9，帶是額度 3 那一格的 5 加上 6，11 比較大，所以印出 11，拿的是 3 公斤和 4 公斤那兩樣。9 是從最輕的開始拿：2 公斤和 3 公斤拿完剩 2 公斤，裝不下第三樣。13 是把 w 看成從小到大填：2 公斤那樣被拿了兩次，再加 3 公斤那樣，4 + 4 + 5。15 是三樣全拿，可是它們一共 9 公斤，超過額度。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int weight[] = {2, 3, 4};
    int value[] = {4, 5, 6};
    int best[] = {0, 0, 0, 0, 0, 0, 0, 0};
    for (int i = 0; i < 3; i++) {
        for (int w = 7; w >= weight[i]; w--) {
            int take = best[w - weight[i]] + value[i];
            if (take > best[w]) {
                best[w] = take;
            }
        }
    }
    printf("%d\\n", best[7]);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> weight = {2, 3, 4};
    std::vector<int> value = {4, 5, 6};
    std::vector<int> best = {0, 0, 0, 0, 0, 0, 0, 0};
    for (int i = 0; i < 3; i++) {
        for (int w = 7; w >= weight[i]; w--) {
            int take = best[w - weight[i]] + value[i];
            if (take > best[w]) {
                best[w] = take;
            }
        }
    }
    std::cout << best[7] << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] weight = {2, 3, 4};
        int[] value = {4, 5, 6};
        int[] best = {0, 0, 0, 0, 0, 0, 0, 0};
        for (int i = 0; i < 3; i++) {
            for (int w = 7; w >= weight[i]; w--) {
                int take = best[w - weight[i]] + value[i];
                if (take > best[w]) {
                    best[w] = take;
                }
            }
        }
        System.out.println(best[7]);
    }
}
`,
          python: `weight = [2, 3, 4]
value = [4, 5, 6]
best = [0, 0, 0, 0, 0, 0, 0, 0]
for i in range(3):
    for w in range(7, weight[i] - 1, -1):
        take = best[w - weight[i]] + value[i]
        if take > best[w]:
            best[w] = take
print(best[7])
`,
        },
        output: '11',
      },
      {
        kind: '程式測試與除錯',
        prompt: '三樣東西重 1、3、4 公斤，分數是 2、5、7 分，每樣只能拿一次，額度 5 公斤。最多應該是 9 分（1 公斤和 4 公斤那兩樣），這段程式卻印出 10。要怎麼改？',
        code: {
          c: `int weight[] = {1, 3, 4};
int value[] = {2, 5, 7};
int best[] = {0, 0, 0, 0, 0, 0};
for (int i = 0; i < 3; i++) {
    for (int w = weight[i]; w <= 5; w++) {
        int take = best[w - weight[i]] + value[i];
        if (take > best[w]) {
            best[w] = take;
        }
    }
}
printf("%d\\n", best[5]);`,
          cpp: `std::vector<int> weight = {1, 3, 4};
std::vector<int> value = {2, 5, 7};
std::vector<int> best = {0, 0, 0, 0, 0, 0};
for (int i = 0; i < 3; i++) {
    for (int w = weight[i]; w <= 5; w++) {
        int take = best[w - weight[i]] + value[i];
        if (take > best[w]) {
            best[w] = take;
        }
    }
}
std::cout << best[5] << "\\n";`,
          java: `int[] weight = {1, 3, 4};
int[] value = {2, 5, 7};
int[] best = {0, 0, 0, 0, 0, 0};
for (int i = 0; i < 3; i++) {
    for (int w = weight[i]; w <= 5; w++) {
        int take = best[w - weight[i]] + value[i];
        if (take > best[w]) {
            best[w] = take;
        }
    }
}
System.out.println(best[5]);`,
          python: `weight = [1, 3, 4]
value = [2, 5, 7]
best = [0, 0, 0, 0, 0, 0]
for i in range(3):
    for w in range(weight[i], 6):
        take = best[w - weight[i]] + value[i]
        if take > best[w]:
            best[w] = take
print(best[5])`,
        },
        options: ['把 take > best[w] 改成 take >= best[w]', '把 w 改成從 5 往下跑到 weight[i]，從大的填到小的', '把 i 改成從 2 往下跑到 0，三樣東西倒過來考慮', '把 take 改成 best[w] + value[i]'],
        answer: 1,
        why: 'w 從小到大填，考慮 1 公斤那樣的時候，額度 2 那一格用到剛改過的額度 1 那一格，等於 1 公斤那樣又拿了一次，一路填到額度 5 是拿了五次、10 分。改成從大的填到小的，每一格用到的都是上一輪的數字，印出 9。改成 >= 只差在一樣多的時候要不要換，照樣印出 10。三樣東西倒過來考慮，1 公斤那樣還是會被拿五次，也是 10。take 改成 best[w] + value[i] 是沒扣掉這樣東西佔的額度，裝得下的每一樣都直接加分，印出 14，可是三樣一共 8 公斤，裝不進 5 公斤。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int weight[] = {1, 3, 4};
    int value[] = {2, 5, 7};
    int best[] = {0, 0, 0, 0, 0, 0};
    for (int i = 0; i < 3; i++) {
        for (int w = weight[i]; w <= 5; w++) {
            int take = best[w - weight[i]] + value[i];
            if (take > best[w]) {
                best[w] = take;
            }
        }
    }
    printf("%d\\n", best[5]);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> weight = {1, 3, 4};
    std::vector<int> value = {2, 5, 7};
    std::vector<int> best = {0, 0, 0, 0, 0, 0};
    for (int i = 0; i < 3; i++) {
        for (int w = weight[i]; w <= 5; w++) {
            int take = best[w - weight[i]] + value[i];
            if (take > best[w]) {
                best[w] = take;
            }
        }
    }
    std::cout << best[5] << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] weight = {1, 3, 4};
        int[] value = {2, 5, 7};
        int[] best = {0, 0, 0, 0, 0, 0};
        for (int i = 0; i < 3; i++) {
            for (int w = weight[i]; w <= 5; w++) {
                int take = best[w - weight[i]] + value[i];
                if (take > best[w]) {
                    best[w] = take;
                }
            }
        }
        System.out.println(best[5]);
    }
}
`,
          python: `weight = [1, 3, 4]
value = [2, 5, 7]
best = [0, 0, 0, 0, 0, 0]
for i in range(3):
    for w in range(weight[i], 6):
        take = best[w - weight[i]] + value[i]
        if take > best[w]:
            best[w] = take
print(best[5])
`,
        },
        output: '10',
      },
      {
        kind: '程式效能分析',
        prompt: '下面這段程式用二維的表算 6 樣東西、額度 9 公斤的背包，每填一格 cells 就加 1。它印出多少？',
        code: {
          c: `int weight[] = {3, 1, 4, 2, 5, 2};
int value[] = {4, 1, 6, 2, 7, 3};
int best[7][10] = {0};
int cells = 0;
for (int i = 1; i <= 6; i++) {
    for (int w = 0; w <= 9; w++) {
        best[i][w] = best[i - 1][w];
        if (w >= weight[i - 1]) {
            int take = best[i - 1][w - weight[i - 1]] + value[i - 1];
            if (take > best[i][w]) {
                best[i][w] = take;
            }
        }
        cells += 1;
    }
}
printf("%d\\n", cells);`,
          cpp: `std::vector<int> weight = {3, 1, 4, 2, 5, 2};
std::vector<int> value = {4, 1, 6, 2, 7, 3};
std::vector<std::vector<int>> best(7, std::vector<int>(10, 0));
int cells = 0;
for (int i = 1; i <= 6; i++) {
    for (int w = 0; w <= 9; w++) {
        best[i][w] = best[i - 1][w];
        if (w >= weight[i - 1]) {
            int take = best[i - 1][w - weight[i - 1]] + value[i - 1];
            if (take > best[i][w]) {
                best[i][w] = take;
            }
        }
        cells += 1;
    }
}
std::cout << cells << "\\n";`,
          java: `int[] weight = {3, 1, 4, 2, 5, 2};
int[] value = {4, 1, 6, 2, 7, 3};
int[][] best = new int[7][10];
int cells = 0;
for (int i = 1; i <= 6; i++) {
    for (int w = 0; w <= 9; w++) {
        best[i][w] = best[i - 1][w];
        if (w >= weight[i - 1]) {
            int take = best[i - 1][w - weight[i - 1]] + value[i - 1];
            if (take > best[i][w]) {
                best[i][w] = take;
            }
        }
        cells += 1;
    }
}
System.out.println(cells);`,
          python: `weight = [3, 1, 4, 2, 5, 2]
value = [4, 1, 6, 2, 7, 3]
best = [[0] * 10 for _ in range(7)]
cells = 0
for i in range(1, 7):
    for w in range(10):
        best[i][w] = best[i - 1][w]
        if w >= weight[i - 1]:
            take = best[i - 1][w - weight[i - 1]] + value[i - 1]
            if take > best[i][w]:
                best[i][w] = take
        cells += 1
print(cells)`,
        },
        options: ['54', '60', '64', '70'],
        answer: 1,
        why: '外層每樣東西跑一次，一共 6 次；內層的額度從 0 到 9，一共 10 次，所以填了 6 × 10 = 60 格。n 樣東西、額度 W，就是 n × (W + 1) 格。54 是 6 × 9，漏了額度 0 那一欄。64 是 2 的 6 次方，那是回溯每樣選或不選的挑法數，填表不用把它們全部試過。70 是把第 0 列也算進去的 7 × 10：第 0 列一開始就是 0，迴圈從第 1 列開始填。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int weight[] = {3, 1, 4, 2, 5, 2};
    int value[] = {4, 1, 6, 2, 7, 3};
    int best[7][10] = {0};
    int cells = 0;
    for (int i = 1; i <= 6; i++) {
        for (int w = 0; w <= 9; w++) {
            best[i][w] = best[i - 1][w];
            if (w >= weight[i - 1]) {
                int take = best[i - 1][w - weight[i - 1]] + value[i - 1];
                if (take > best[i][w]) {
                    best[i][w] = take;
                }
            }
            cells += 1;
        }
    }
    printf("%d\\n", cells);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> weight = {3, 1, 4, 2, 5, 2};
    std::vector<int> value = {4, 1, 6, 2, 7, 3};
    std::vector<std::vector<int>> best(7, std::vector<int>(10, 0));
    int cells = 0;
    for (int i = 1; i <= 6; i++) {
        for (int w = 0; w <= 9; w++) {
            best[i][w] = best[i - 1][w];
            if (w >= weight[i - 1]) {
                int take = best[i - 1][w - weight[i - 1]] + value[i - 1];
                if (take > best[i][w]) {
                    best[i][w] = take;
                }
            }
            cells += 1;
        }
    }
    std::cout << cells << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] weight = {3, 1, 4, 2, 5, 2};
        int[] value = {4, 1, 6, 2, 7, 3};
        int[][] best = new int[7][10];
        int cells = 0;
        for (int i = 1; i <= 6; i++) {
            for (int w = 0; w <= 9; w++) {
                best[i][w] = best[i - 1][w];
                if (w >= weight[i - 1]) {
                    int take = best[i - 1][w - weight[i - 1]] + value[i - 1];
                    if (take > best[i][w]) {
                        best[i][w] = take;
                    }
                }
                cells += 1;
            }
        }
        System.out.println(cells);
    }
}
`,
          python: `weight = [3, 1, 4, 2, 5, 2]
value = [4, 1, 6, 2, 7, 3]
best = [[0] * 10 for _ in range(7)]
cells = 0
for i in range(1, 7):
    for w in range(10):
        best[i][w] = best[i - 1][w]
        if w >= weight[i - 1]:
            take = best[i - 1][w - weight[i - 1]] + value[i - 1]
            if take > best[i][w]:
                best[i][w] = take
        cells += 1
print(cells)
`,
        },
        output: '60',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      '每樣可以拿很多次的無限背包：一樣的表，只留一列的寫法把 w 改成從小到大填，剛好就是它。同一個「錯誤」在另一題是正解。',
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'knapsack', page);
})(typeof window !== 'undefined' ? window : globalThis);
