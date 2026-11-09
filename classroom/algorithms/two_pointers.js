// classroom/algorithms/two_pointers.js — 演算法「雙指標」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '百貨公司的禮券不找零。你手上有一張 1000 元的禮券，想買兩樣東西剛好用完。架上 50 樣商品已經照價錢從便宜排到貴，一對一對加起來試，最多要試 1225 對。有沒有更快的找法？',
    // 複習：用學過的巢狀迴圈把每一對都試一遍，商品一多就試不完；quote 是這頁的核心想法
    review: [
      { text: '我們學過巢狀迴圈：外層挑第一樣、內層挑第二樣，加起來剛好 1000 就找到了。50 樣最多 1225 對；換成網購平台上一萬樣商品，就是將近五千萬對。可是價錢明明已經排好了，很多對根本不用加就知道不可能：最貴的那樣配上最便宜的都超過 1000，它跟誰配都超過。', see: 'programming/loops' },
      { quote: '加起來太多，就把貴的那邊換便宜一點；不夠，就把便宜的那邊換貴一點。' },
    ],
    summary: '不用試 1225 對：一根手指放最便宜、一根放最貴，加起來太多就把貴的換便宜一點，不夠就把便宜的換貴一點，每看一次就排除一整排，50 樣最多看 49 次就知道有沒有。下次碰到「排好序的資料裡找一對」，你就知道：兩頭各放一根手指往中間收，不用每一對都試。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '檢查一句話是不是迴文（正著讀、倒著讀都一樣，像「上海自來水來自海上」）：一根手指從頭、一根從尾，一起往中間比，有一對不一樣就不是。',
      { text: '把兩份排好的名單合成一份：兩邊各放一根手指，每次拿比較小的那個、那根手指往後一格。合併排序的「合併」就是這樣做。', see: 'ds/sorting' },
      '三個數加起來剛好是目標（3Sum）：先固定第一個數，剩下的兩個就變成這一頁的問題，用雙指標找。',
      'APCS 實作題：排好序的陣列裡找「和剛好是 k 的一對」、「和最接近 k 的一對」，或是數「差不超過 k 的有幾對」。',
    ],
    concept: [
      '雙指標（two pointers）是用兩個索引在陣列上移動，取代兩層迴圈把每一對都試一遍。這一頁的版本是從兩頭往中間收：left 從最左邊（最便宜）出發，right 從最右邊（最貴）出發。這裡的「指標」是指著某一格的位置，不是 C 語言的指標（pointer）。',
      '每一步看 prices[left] + prices[right]：剛好等於目標，就找到了；太多，right 往左一格，換便宜一點的；不夠，left 往右一格，換貴一點的。left 碰到 right 還沒找到，就是沒有這樣的一對。',
      '為什麼可以這樣跳過？加起來太多的時候，最貴的 prices[right] 配上目前最便宜的 prices[left] 都太多，配上 left 右邊更貴的只會更多，所以它跟誰都配不成，可以整個排除。不夠的時候反過來，排除 prices[left]。每一步排除一樣商品，所以 n 樣最多走 n − 1 步。',
      { text: '前提是陣列要先照大小排好，「太多就往左」才有意義。資料還沒排好的話，先排序再用雙指標。', see: 'ds/sorting' },
    ],
    traps: [
      { wrong: '雙指標在還沒排序的陣列上也能用', right: '要排好序，「加起來太多，往左就會變少」才成立。沒排序的陣列往左一格不一定比較便宜，會把答案跳過去。先排序（O(n log n)）再用雙指標，還是比兩層迴圈的 O(n²) 快。' },
      { wrong: '加起來太多的時候，left 往右也可以', right: 'left 往右是換成更貴的，總和只會更多。要讓總和變少，只能把 right 往左。兩邊移錯，就會直接走過頭（試試看第二題）。' },
      { wrong: '迴圈的條件寫 left <= right 比較保險', right: 'left 等於 right 的時候，兩根手指指著同一樣商品，等於拿它跟自己配。題目要兩樣不同的東西，條件要寫 left < right。' },
      { wrong: '找到一對就可以停，題目問「有幾對」也一樣', right: '要數全部的話，找到一對之後 left、right 都往內收一格，繼續找下一對；價錢有重複時還要另外處理同價的那幾格。實作的 count_pairs 就是數全部的版本。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{t}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '目標 1000', values: { t: 1000 } }, { label: '目標 700', values: { t: 700 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int prices[] = {150, 260, 340, 480, 660, 790};
    int target = {{t}};
    int left = 0;
    int right = 5;
    while (left < right) {
        int total = prices[left] + prices[right];
        if (total == target) {
            break;
        } else if (total > target) {
            right -= 1;
        } else {
            left += 1;
        }
    }
    if (left < right) {
        printf("%d %d\\n", prices[left], prices[right]);
    } else {
        printf("none\\n");
    }
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> prices = {150, 260, 340, 480, 660, 790};
    int target = {{t}};
    int left = 0;
    int right = prices.size() - 1;
    while (left < right) {
        int total = prices[left] + prices[right];
        if (total == target) {
            break;
        } else if (total > target) {
            right -= 1;
        } else {
            left += 1;
        }
    }
    if (left < right) {
        std::cout << prices[left] << " " << prices[right] << "\\n";
    } else {
        std::cout << "none\\n";
    }
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] prices = {150, 260, 340, 480, 660, 790};
        int target = {{t}};
        int left = 0;
        int right = prices.length - 1;
        while (left < right) {
            int total = prices[left] + prices[right];
            if (total == target) {
                break;
            } else if (total > target) {
                right -= 1;
            } else {
                left += 1;
            }
        }
        if (left < right) {
            System.out.println(prices[left] + " " + prices[right]);
        } else {
            System.out.println("none");
        }
    }
}
`,
        python: `prices = [150, 260, 340, 480, 660, 790]
target = {{t}}
left = 0
right = len(prices) - 1
while left < right:
    total = prices[left] + prices[right]
    if total == target:
        break
    elif total > target:
        right -= 1
    else:
        left += 1
if left < right:
    print(prices[left], prices[right])
else:
    print("none")
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 13, 12: 15, 13: 18, 14: 19, 16: 21 },
        cpp: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 10, 7: 11, 8: 12, 9: 13, 10: 14, 12: 16, 13: 19, 14: 20, 16: 22 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 11, 10: 12, 12: 14, 13: 17, 14: 18, 16: 20 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "目標 1000": [
        {"line":1,"vars":{"prices":[150,260,340,480,660,790]},"out":""},
        {"line":2,"vars":{"prices":[150,260,340,480,660,790],"target":1000},"out":""},
        {"line":3,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":0},"out":""},
        {"line":4,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":0,"right":5},"out":""},
        {"line":5,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":0,"right":5},"out":"","cond":true},
        {"line":6,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":0,"right":5,"total":940},"out":""},
        {"line":7,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":0,"right":5,"total":940},"out":"","cond":false},
        {"line":9,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":0,"right":5,"total":940},"out":"","cond":false},
        {"line":12,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":1,"right":5,"total":940},"out":""},
        {"line":5,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":1,"right":5,"total":940},"out":"","cond":true},
        {"line":6,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":1,"right":5,"total":1050},"out":""},
        {"line":7,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":1,"right":5,"total":1050},"out":"","cond":false},
        {"line":9,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":1,"right":5,"total":1050},"out":"","cond":true},
        {"line":10,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":1,"right":4,"total":1050},"out":""},
        {"line":5,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":1,"right":4,"total":1050},"out":"","cond":true},
        {"line":6,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":1,"right":4,"total":920},"out":""},
        {"line":7,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":1,"right":4,"total":920},"out":"","cond":false},
        {"line":9,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":1,"right":4,"total":920},"out":"","cond":false},
        {"line":12,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":2,"right":4,"total":920},"out":""},
        {"line":5,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":2,"right":4,"total":920},"out":"","cond":true},
        {"line":6,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":2,"right":4,"total":1000},"out":""},
        {"line":7,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":2,"right":4,"total":1000},"out":"","cond":true},
        {"line":8,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":2,"right":4,"total":1000},"out":""},
        {"line":13,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":2,"right":4,"total":1000},"out":"","cond":true},
        {"line":14,"vars":{"prices":[150,260,340,480,660,790],"target":1000,"left":2,"right":4,"total":1000},"out":"340 660\n"},
      ],
      "目標 700": [
        {"line":1,"vars":{"prices":[150,260,340,480,660,790]},"out":""},
        {"line":2,"vars":{"prices":[150,260,340,480,660,790],"target":700},"out":""},
        {"line":3,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0},"out":""},
        {"line":4,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":5},"out":""},
        {"line":5,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":5},"out":"","cond":true},
        {"line":6,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":5,"total":940},"out":""},
        {"line":7,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":5,"total":940},"out":"","cond":false},
        {"line":9,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":5,"total":940},"out":"","cond":true},
        {"line":10,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":4,"total":940},"out":""},
        {"line":5,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":4,"total":940},"out":"","cond":true},
        {"line":6,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":4,"total":810},"out":""},
        {"line":7,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":4,"total":810},"out":"","cond":false},
        {"line":9,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":4,"total":810},"out":"","cond":true},
        {"line":10,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":3,"total":810},"out":""},
        {"line":5,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":3,"total":810},"out":"","cond":true},
        {"line":6,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":3,"total":630},"out":""},
        {"line":7,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":3,"total":630},"out":"","cond":false},
        {"line":9,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":0,"right":3,"total":630},"out":"","cond":false},
        {"line":12,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":1,"right":3,"total":630},"out":""},
        {"line":5,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":1,"right":3,"total":630},"out":"","cond":true},
        {"line":6,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":1,"right":3,"total":740},"out":""},
        {"line":7,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":1,"right":3,"total":740},"out":"","cond":false},
        {"line":9,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":1,"right":3,"total":740},"out":"","cond":true},
        {"line":10,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":1,"right":2,"total":740},"out":""},
        {"line":5,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":1,"right":2,"total":740},"out":"","cond":true},
        {"line":6,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":1,"right":2,"total":600},"out":""},
        {"line":7,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":1,"right":2,"total":600},"out":"","cond":false},
        {"line":9,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":1,"right":2,"total":600},"out":"","cond":false},
        {"line":12,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":2,"right":2,"total":600},"out":""},
        {"line":5,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":2,"right":2,"total":600},"out":"","cond":false},
        {"line":13,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":2,"right":2,"total":600},"out":"","cond":false},
        {"line":16,"vars":{"prices":[150,260,340,480,660,790],"target":700,"left":2,"right":2,"total":600},"out":"none\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：六樣商品照價錢排好、目標 1000，每一步一列：兩根手指指的格子塗黃，右邊寫加起來多少、下一步怎麼走
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const prices = [150, 260, 340, 480, 660, 790];
      const rows = [[0, 5, '940 不夠'], [1, 5, '1050 太多'], [1, 4, '920 不夠'], [2, 4, '1000 剛好']];
      const s = svgEl(320, 236), rc = rough.svg(s);
      const box = { stroke: INK, strokeWidth: 1.3, roughness: 0.9, fillStyle: 'solid' };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const CELL = 34, LEFT = 6, H = 26;
      label(160, 12, '六樣商品照價錢排好，目標 1000', 12, true);
      rows.forEach(([l, r, verdict], k) => {
        const y = 30 + k * 52;
        prices.forEach((v, i) => {
          const x = LEFT + i * CELL;
          s.append(rc.rectangle(x, y, CELL, H, { ...box, seed: 30 + k * 10 + i, fill: i === l || i === r ? NEW : FILL }));
          label(x + CELL / 2, y + H / 2, String(v), 12);
          if (i === l) label(x + CELL / 2, y + H + 10, 'L', 11, true);
          if (i === r) label(x + CELL / 2, y + H + 10, 'R', 11, true);
        });
        label(266, y + 6, `${prices[l]} + ${prices[r]}`, 11, true);
        label(266, y + 22, `= ${verdict}`, 12);
      });
      return s;
    },
    code: {
      c: `#include <stdio.h>

// 數有幾對加起來剛好是 target；prices 要先照小到大排好，而且沒有重複的價錢
int count_pairs(const int prices[], int n, int target) {
    int left = 0, right = n - 1, count = 0;
    while (left < right) {
        int total = prices[left] + prices[right];
        if (total == target) {        // 找到一對：兩邊都往內收，繼續找下一對
            count++;
            left++;
            right--;
        } else if (total > target) {  // 太多：換便宜一點的
            right--;
        } else {                      // 不夠：換貴一點的
            left++;
        }
    }
    return count;
}

int main(void) {
    int prices[] = {150, 260, 340, 480, 520, 660, 740, 790, 850};
    printf("%d %d\\n", count_pairs(prices, 9, 1000), count_pairs(prices, 9, 1110));
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// 數有幾對加起來剛好是 target；prices 要先照小到大排好，而且沒有重複的價錢
int count_pairs(const std::vector<int>& prices, int target) {
    int left = 0, right = prices.size() - 1, count = 0;
    while (left < right) {
        int total = prices[left] + prices[right];
        if (total == target) {        // 找到一對：兩邊都往內收，繼續找下一對
            count++;
            left++;
            right--;
        } else if (total > target) {  // 太多：換便宜一點的
            right--;
        } else {                      // 不夠：換貴一點的
            left++;
        }
    }
    return count;
}

int main() {
    std::vector<int> prices = {150, 260, 340, 480, 520, 660, 740, 790, 850};
    std::cout << count_pairs(prices, 1000) << " " << count_pairs(prices, 1110) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 數有幾對加起來剛好是 target；prices 要先照小到大排好，而且沒有重複的價錢
    static int countPairs(int[] prices, int target) {
        int left = 0, right = prices.length - 1, count = 0;
        while (left < right) {
            int total = prices[left] + prices[right];
            if (total == target) {        // 找到一對：兩邊都往內收，繼續找下一對
                count++;
                left++;
                right--;
            } else if (total > target) {  // 太多：換便宜一點的
                right--;
            } else {                      // 不夠：換貴一點的
                left++;
            }
        }
        return count;
    }

    public static void main(String[] args) {
        int[] prices = {150, 260, 340, 480, 520, 660, 740, 790, 850};
        System.out.println(countPairs(prices, 1000) + " " + countPairs(prices, 1110));
    }
}
`,
      python: `def count_pairs(prices, target):         # prices 要先照小到大排好，而且沒有重複的價錢
    left, right, count = 0, len(prices) - 1, 0
    while left < right:
        total = prices[left] + prices[right]
        if total == target:              # 找到一對：兩邊都往內收，繼續找下一對
            count += 1
            left += 1
            right -= 1
        elif total > target:             # 太多：換便宜一點的
            right -= 1
        else:                            # 不夠：換貴一點的
            left += 1
    return count


prices = [150, 260, 340, 480, 520, 660, 740, 790, 850]
print(count_pairs(prices, 1000), count_pairs(prices, 1110))
`,
      output: '4 1',
    },
    cost: {
      rows: [
        ['兩層迴圈把每一對都試一遍', 'n(n − 1) / 2 對，O(n²)'],
        ['雙指標：每一步排除一樣，兩根手指碰在一起就停', '最多 n − 1 步，O(n)'],
        ['資料還沒排好，要先排序', 'O(n log n)，排完再加上雙指標的 O(n)'],
      ],
      note: { text: '50 樣商品：兩層迴圈最多 1225 對，雙指標最多 49 步；一萬樣是將近五千萬對比 9999 步。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '六樣商品照價錢排好，想找兩樣加起來剛好 750 元。下面這段程式印出什麼？',
        code: {
          c: `int prices[] = {120, 200, 310, 430, 550, 680};
int left = 0, right = 5;
while (left < right) {
    int total = prices[left] + prices[right];
    if (total == 750) {
        break;
    } else if (total > 750) {
        right -= 1;
    } else {
        left += 1;
    }
}
printf("%d %d\\n", prices[left], prices[right]);`,
          cpp: `std::vector<int> prices = {120, 200, 310, 430, 550, 680};
int left = 0, right = 5;
while (left < right) {
    int total = prices[left] + prices[right];
    if (total == 750) {
        break;
    } else if (total > 750) {
        right -= 1;
    } else {
        left += 1;
    }
}
std::cout << prices[left] << " " << prices[right] << "\\n";`,
          java: `int[] prices = {120, 200, 310, 430, 550, 680};
int left = 0, right = 5;
while (left < right) {
    int total = prices[left] + prices[right];
    if (total == 750) {
        break;
    } else if (total > 750) {
        right -= 1;
    } else {
        left += 1;
    }
}
System.out.println(prices[left] + " " + prices[right]);`,
          python: `prices = [120, 200, 310, 430, 550, 680]
left, right = 0, 5
while left < right:
    total = prices[left] + prices[right]
    if total == 750:
        break
    elif total > 750:
        right -= 1
    else:
        left += 1
print(prices[left], prices[right])`,
        },
        options: ['120 680', '200 550', '310 430', 'none'],
        answer: 1,
        why: '120 + 680 = 800 太多，right 往左；120 + 550 = 670 不夠，left 往右；200 + 550 = 750 剛好，印出 200 550。120 680 是第一步看的那一對，加起來 800 不是 750；310 430 是中間那兩樣，加起來 740，差了 10；none 是以為一路收到中間都沒找到，可是第三步就找到了。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int prices[] = {120, 200, 310, 430, 550, 680};\n    int left = 0, right = 5;\n    while (left < right) {\n        int total = prices[left] + prices[right];\n        if (total == 750) {\n            break;\n        } else if (total > 750) {\n            right -= 1;\n        } else {\n            left += 1;\n        }\n    }\n    printf("%d %d\\n", prices[left], prices[right]);\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> prices = {120, 200, 310, 430, 550, 680};\n    int left = 0, right = 5;\n    while (left < right) {\n        int total = prices[left] + prices[right];\n        if (total == 750) {\n            break;\n        } else if (total > 750) {\n            right -= 1;\n        } else {\n            left += 1;\n        }\n    }\n    std::cout << prices[left] << " " << prices[right] << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int[] prices = {120, 200, 310, 430, 550, 680};\n        int left = 0, right = 5;\n        while (left < right) {\n            int total = prices[left] + prices[right];\n            if (total == 750) {\n                break;\n            } else if (total > 750) {\n                right -= 1;\n            } else {\n                left += 1;\n            }\n        }\n        System.out.println(prices[left] + " " + prices[right]);\n    }\n}\n',
          python: 'prices = [120, 200, 310, 430, 550, 680]\nleft, right = 0, 5\nwhile left < right:\n    total = prices[left] + prices[right]\n    if total == 750:\n        break\n    elif total > 750:\n        right -= 1\n    else:\n        left += 1\nprint(prices[left], prices[right])\n',
        },
        output: '200 550',
      },
      {
        kind: '程式測試與除錯',
        prompt: '同樣六樣商品找 750 元，明明有 200 + 550，程式卻印出 none。要怎麼改？',
        code: {
          c: `int prices[] = {120, 200, 310, 430, 550, 680};
int left = 0, right = 5;
while (left < right) {
    int total = prices[left] + prices[right];
    if (total == 750) {
        break;
    } else if (total > 750) {
        left += 1;
    } else {
        left += 1;
    }
}
if (left < right) {
    printf("%d %d\\n", prices[left], prices[right]);
} else {
    printf("none\\n");
}`,
          cpp: `std::vector<int> prices = {120, 200, 310, 430, 550, 680};
int left = 0, right = 5;
while (left < right) {
    int total = prices[left] + prices[right];
    if (total == 750) {
        break;
    } else if (total > 750) {
        left += 1;
    } else {
        left += 1;
    }
}
if (left < right) {
    std::cout << prices[left] << " " << prices[right] << "\\n";
} else {
    std::cout << "none\\n";
}`,
          java: `int[] prices = {120, 200, 310, 430, 550, 680};
int left = 0, right = 5;
while (left < right) {
    int total = prices[left] + prices[right];
    if (total == 750) {
        break;
    } else if (total > 750) {
        left += 1;
    } else {
        left += 1;
    }
}
if (left < right) {
    System.out.println(prices[left] + " " + prices[right]);
} else {
    System.out.println("none");
}`,
          python: `prices = [120, 200, 310, 430, 550, 680]
left, right = 0, 5
while left < right:
    total = prices[left] + prices[right]
    if total == 750:
        break
    elif total > 750:
        left += 1
    else:
        left += 1
if left < right:
    print(prices[left], prices[right])
else:
    print("none")`,
        },
        options: ['把 left < right 改成 left <= right', '加起來太多的時候，改成 right 往左一格', '把 left 一開始的值改成 1', '把 total == 750 改成 total >= 750'],
        answer: 1,
        why: '第一步 120 + 680 = 800 太多，程式卻把 left 往右，換成更貴的 200，總和變成 880，之後每一步都更多，left 一路走到碰到 right，印出 none。太多的時候要把 right 往左，換便宜一點的，就會在 200 + 550 找到。改成 left <= right 只是多跑一圈，還是 none；left 從 1 開始一樣一路變貴；改成 >= 的話第一步 800 就停下來，印出 120 680，加起來不是 750。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int prices[] = {120, 200, 310, 430, 550, 680};\n    int left = 0, right = 5;\n    while (left < right) {\n        int total = prices[left] + prices[right];\n        if (total == 750) {\n            break;\n        } else if (total > 750) {\n            left += 1;\n        } else {\n            left += 1;\n        }\n    }\n    if (left < right) {\n        printf("%d %d\\n", prices[left], prices[right]);\n    } else {\n        printf("none\\n");\n    }\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> prices = {120, 200, 310, 430, 550, 680};\n    int left = 0, right = 5;\n    while (left < right) {\n        int total = prices[left] + prices[right];\n        if (total == 750) {\n            break;\n        } else if (total > 750) {\n            left += 1;\n        } else {\n            left += 1;\n        }\n    }\n    if (left < right) {\n        std::cout << prices[left] << " " << prices[right] << "\\n";\n    } else {\n        std::cout << "none\\n";\n    }\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int[] prices = {120, 200, 310, 430, 550, 680};\n        int left = 0, right = 5;\n        while (left < right) {\n            int total = prices[left] + prices[right];\n            if (total == 750) {\n                break;\n            } else if (total > 750) {\n                left += 1;\n            } else {\n                left += 1;\n            }\n        }\n        if (left < right) {\n            System.out.println(prices[left] + " " + prices[right]);\n        } else {\n            System.out.println("none");\n        }\n    }\n}\n',
          python: 'prices = [120, 200, 310, 430, 550, 680]\nleft, right = 0, 5\nwhile left < right:\n    total = prices[left] + prices[right]\n    if total == 750:\n        break\n    elif total > 750:\n        left += 1\n    else:\n        left += 1\nif left < right:\n    print(prices[left], prices[right])\nelse:\n    print("none")\n',
        },
        output: 'none',
      },
      {
        kind: '程式效能分析',
        prompt: 'prices 是 0、1、2、……、999 共 1000 個數，已經排好；target 是 5000，再怎麼加都不夠。left 從 0、right 從 999 出發，下面這段程式印出的 steps 是多少？',
        code: {
          c: `int steps = 0;
while (left < right) {
    steps += 1;
    int total = prices[left] + prices[right];
    if (total == target) {
        break;
    } else if (total > target) {
        right -= 1;
    } else {
        left += 1;
    }
}
printf("%d\\n", steps);`,
          cpp: `int steps = 0;
while (left < right) {
    steps += 1;
    int total = prices[left] + prices[right];
    if (total == target) {
        break;
    } else if (total > target) {
        right -= 1;
    } else {
        left += 1;
    }
}
std::cout << steps << "\\n";`,
          java: `int steps = 0;
while (left < right) {
    steps += 1;
    int total = prices[left] + prices[right];
    if (total == target) {
        break;
    } else if (total > target) {
        right -= 1;
    } else {
        left += 1;
    }
}
System.out.println(steps);`,
          python: `steps = 0
while left < right:
    steps += 1
    total = prices[left] + prices[right]
    if total == target:
        break
    elif total > target:
        right -= 1
    else:
        left += 1
print(steps)`,
        },
        options: ['499500', '999', '1000000', '500'],
        answer: 1,
        why: '每一步加起來都不夠 5000，所以每一步都是 left 往右一格，從 0 走到碰到 right（999）為止，一共 999 步。499500 是兩層迴圈要試的對數，1000 × 999 / 2；1000000 是 1000 × 1000，連自己配自己、同一對換順序都算進去；500 是以為兩根手指各走一半，可是這題只有 left 在走，走完了整條。',
        program: {
          c: '#include <stdio.h>\nint main(void) {\n    int prices[1000];\n    for (int i = 0; i < 1000; i++) {\n        prices[i] = i;\n    }\n    int target = 5000, left = 0, right = 999;\n    int steps = 0;\n    while (left < right) {\n        steps += 1;\n        int total = prices[left] + prices[right];\n        if (total == target) {\n            break;\n        } else if (total > target) {\n            right -= 1;\n        } else {\n            left += 1;\n        }\n    }\n    printf("%d\\n", steps);\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nint main() {\n    std::vector<int> prices(1000);\n    for (int i = 0; i < 1000; i++) {\n        prices[i] = i;\n    }\n    int target = 5000, left = 0, right = 999;\n    int steps = 0;\n    while (left < right) {\n        steps += 1;\n        int total = prices[left] + prices[right];\n        if (total == target) {\n            break;\n        } else if (total > target) {\n            right -= 1;\n        } else {\n            left += 1;\n        }\n    }\n    std::cout << steps << "\\n";\n}\n',
          java: 'public class Main {\n    public static void main(String[] args) {\n        int[] prices = new int[1000];\n        for (int i = 0; i < 1000; i++) {\n            prices[i] = i;\n        }\n        int target = 5000, left = 0, right = 999;\n        int steps = 0;\n        while (left < right) {\n            steps += 1;\n            int total = prices[left] + prices[right];\n            if (total == target) {\n                break;\n            } else if (total > target) {\n                right -= 1;\n            } else {\n                left += 1;\n            }\n        }\n        System.out.println(steps);\n    }\n}\n',
          python: 'prices = list(range(1000))\ntarget, left, right = 5000, 0, 999\nsteps = 0\nwhile left < right:\n    steps += 1\n    total = prices[left] + prices[right]\n    if total == target:\n        break\n    elif total > target:\n        right -= 1\n    else:\n        left += 1\nprint(steps)\n',
        },
        output: '999',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      { text: '滑動視窗（sliding window）：兩根手指往同一個方向走。例如每天的步數記在陣列裡，問「連續幾天加起來至少 2 萬步，最少要幾天」：右手指一天一天往右，把那天加進總和；總和夠了，就把左手指往右收，看能不能更短。每一天最多被加進來一次、減出去一次，所以也是 O(n)。能這樣收的前提是步數不會是負的，收掉一天總和一定變少。', see: 'algorithms/prefix_sum' },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'two_pointers', page);
})(typeof window !== 'undefined' ? window : globalThis);
