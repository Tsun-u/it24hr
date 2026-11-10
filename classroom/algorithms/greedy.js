// classroom/algorithms/greedy.js — 演算法「貪婪法」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '影展這天有 8 場電影你都想看，場次的時間互相重疊。想看到最多場，你會先挑哪一場：最早開演的、片長最短的，還是最早散場的？',
    // 複習：用回溯把每一場選或不選都試過，場次一多就試不完；quote 是這頁的核心想法
    review: [
      { text: '用前面學過的回溯，可以每一場選或不選全部試過：8 場有 256 種，挑出時間不重疊、場數最多的那一種。影展一個週末有 50 場，2 的 50 次方種試不完。', see: 'backtracking' },
      '人不會這樣排。我們會定一個規則，照規則一場一場挑下去，挑了就不改。問題是哪個規則才對。',
      { quote: '每一步都拿眼前最好的那個，拿了就不回頭。' },
    ],
    summary: '先挑最早散場的：它最早把時間還給你，留給後面的場次最多。這 8 場最多看得到 4 場；先挑最早開演或片長最短的，都只看得到 3 場。下次碰到要一步一步挑的問題，可以先找找看有沒有一個「眼前最好」的挑法，挑了之後不會後悔。有，照著挑就是貪婪法；舉得出反例，就回去用回溯或動態規劃。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '找零錢：找 87 元，先拿 50 元，再拿三個 10 元、一個 5 元、兩個 1 元。台幣的面額可以每次先拿最大的。',
      '訂會議室：一間會議室一天想排進最多場會議，就是這一頁的問題。',
      { text: '圖的演算法：最小生成樹每次挑最短、又不會繞成圈的那條邊；最短路徑每次確定離起點最近的那個點。', see: ['ds/mst', 'ds/shortest_path'] },
      '壓縮檔案的霍夫曼編碼（Huffman coding）：每次把出現次數最少的兩個符號合在一起，常出現的符號就會分到比較短的代碼。',
      'APCS 實作題：先排序，再從頭一個一個決定要不要拿的題目。',
    ],
    concept: [
      '貪婪法（greedy algorithm）是每一步都拿眼前最好的選擇，拿了就不改，一路做到完。它不回頭，所以快；也因為不回頭，一開始的規則要選對。',
      '排場次的規則：把場次照散場時間從早到晚排好，從頭看下去，開演時間不早於「上一場散場的時間」就挑，然後把那個時間更新成這一場的散場時間。',
      '為什麼先挑最早散場的不會吃虧：假設有一種最好的排法，第一場不是最早散場的那場。把它的第一場換成最早散場的那場，新的第一場更早結束，後面每一場照樣趕得上，場數一樣多。所以「先挑最早散場的」至少跟最好的排法一樣好。剩下的時間是同一個問題，再挑一次。',
      '貪婪法不是每個問題都能用，要說得出這種「換過來也不會變差」的理由。說不出來、又舉得出反例，就不能用：最早開演的那場可能是一部 6 小時的長片；片長最短的那場可能剛好卡在兩場中間。',
      { text: '跟另外兩種方法比：回溯把選擇全部試過，一定對但慢；動態規劃把每個小問題最好的答案記下來，對，可是要一張表；貪婪法只走一條路，最快，前提是先確定這條路走得到最好的答案。', see: ['backtracking', 'dp'] },
    ],
    traps: [
      { wrong: '每一步都拿最好的，最後的結果一定最好', right: '眼前最好不一定整體最好。硬幣面額如果是 1、4、5 元，要湊 8 元：每次先拿最大的是 5 + 1 + 1 + 1 四個，可是 4 + 4 兩個就夠。這種面額要用動態規劃。', see: 'dp' },
      { wrong: '排場次，先挑片長最短的也可以', right: '這一頁的 8 場照片長挑只看得到 3 場：12–14 和 18–20 這兩場短片，各卡在兩場本來可以接著看的電影中間。照最早開演挑也是 3 場，9–15 那場一口氣擋掉四場。' },
      { wrong: '貪婪法不用排序', right: '多半要先排序，才能從頭一個一個挑。排序是 O(n log n)，挑的那一趟只有 O(n)，所以時間幾乎都花在排序。' },
      { wrong: '開演時間等於上一場的散場時間，算不算重疊都沒差', right: '差一個等號，答案可能差一場。這一頁算可以接著看（start >= free）；題目說要留換場時間的話，條件就不一樣，要照題目寫。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{t}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '9 點到', values: { t: 9 } }, { label: '13 點到', values: { t: 13 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int start[] = {10, 12, 9, 13, 14, 16, 18, 19};
    int end[] = {13, 14, 15, 16, 17, 19, 20, 22};
    int free = {{t}};
    int count = 0;
    for (int i = 0; i < 8; i++) {
        if (start[i] >= free) {
            count += 1;
            free = end[i];
        }
    }
    printf("%d\\n", count);
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> start = {10, 12, 9, 13, 14, 16, 18, 19};
    std::vector<int> end = {13, 14, 15, 16, 17, 19, 20, 22};
    int free = {{t}};
    int count = 0;
    for (int i = 0; i < 8; i++) {
        if (start[i] >= free) {
            count += 1;
            free = end[i];
        }
    }
    std::cout << count << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] start = {10, 12, 9, 13, 14, 16, 18, 19};
        int[] end = {13, 14, 15, 16, 17, 19, 20, 22};
        int free = {{t}};
        int count = 0;
        for (int i = 0; i < 8; i++) {
            if (start[i] >= free) {
                count += 1;
                free = end[i];
            }
        }
        System.out.println(count);
    }
}
`,
        python: `start = [10, 12, 9, 13, 14, 16, 18, 19]
end = [13, 14, 15, 16, 17, 19, 20, 22]
free = {{t}}
count = 0
for i in range(8):
    if start[i] >= free:
        count += 1
        free = end[i]
print(count)
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 14 },
        cpp: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 10, 7: 11, 8: 12, 9: 15 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 13 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "9 點到": [
        {"line":1,"vars":{"start":[10,12,9,13,14,16,18,19]},"out":""},
        {"line":2,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22]},"out":""},
        {"line":3,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":9},"out":""},
        {"line":4,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":9,"count":0},"out":""},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":9,"count":0,"i":0},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":9,"count":0,"i":0},"out":"","cond":true},
        {"line":7,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":9,"count":1,"i":0},"out":""},
        {"line":8,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":1,"i":0},"out":""},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":1,"i":1},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":1,"i":1},"out":"","cond":false},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":1,"i":2},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":1,"i":2},"out":"","cond":false},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":1,"i":3},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":1,"i":3},"out":"","cond":true},
        {"line":7,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":2,"i":3},"out":""},
        {"line":8,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":2,"i":3},"out":""},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":2,"i":4},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":2,"i":4},"out":"","cond":false},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":2,"i":5},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":2,"i":5},"out":"","cond":true},
        {"line":7,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":3,"i":5},"out":""},
        {"line":8,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":3,"i":5},"out":""},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":3,"i":6},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":3,"i":6},"out":"","cond":false},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":3,"i":7},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":3,"i":7},"out":"","cond":true},
        {"line":7,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":4,"i":7},"out":""},
        {"line":8,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":22,"count":4,"i":7},"out":""},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":22,"count":4,"i":7},"out":"","cond":false},
        {"line":9,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":22,"count":4,"i":7},"out":"4\n"},
      ],
      "13 點到": [
        {"line":1,"vars":{"start":[10,12,9,13,14,16,18,19]},"out":""},
        {"line":2,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22]},"out":""},
        {"line":3,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13},"out":""},
        {"line":4,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":0},"out":""},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":0,"i":0},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":0,"i":0},"out":"","cond":false},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":0,"i":1},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":0,"i":1},"out":"","cond":false},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":0,"i":2},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":0,"i":2},"out":"","cond":false},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":0,"i":3},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":0,"i":3},"out":"","cond":true},
        {"line":7,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":13,"count":1,"i":3},"out":""},
        {"line":8,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":1,"i":3},"out":""},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":1,"i":4},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":1,"i":4},"out":"","cond":false},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":1,"i":5},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":1,"i":5},"out":"","cond":true},
        {"line":7,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":16,"count":2,"i":5},"out":""},
        {"line":8,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":2,"i":5},"out":""},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":2,"i":6},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":2,"i":6},"out":"","cond":false},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":2,"i":7},"out":"","cond":true},
        {"line":6,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":2,"i":7},"out":"","cond":true},
        {"line":7,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":19,"count":3,"i":7},"out":""},
        {"line":8,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":22,"count":3,"i":7},"out":""},
        {"line":5,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":22,"count":3,"i":7},"out":"","cond":false},
        {"line":9,"vars":{"start":[10,12,9,13,14,16,18,19],"end":[13,14,15,16,17,19,20,22],"free":22,"count":3,"i":7},"out":"3\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：時間軸上的八條橫槓，由上往下照散場時間排；照「趕得上就挑」挑中的四場塗黃，底下三行是三種規則各看得到幾場
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const sessions = [[10, 13], [12, 14], [9, 15], [13, 16], [14, 17], [16, 19], [18, 20], [19, 22]];
      const s = svgEl(320, 262), rc = rough.svg(s);
      const box = { stroke: INK, strokeWidth: 1.3, roughness: 0.9, fillStyle: 'solid' };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const LEFT = 52, HOUR = 19, TOP = 44, ROW = 20, H = 13;
      const xOf = (hour) => LEFT + (hour - 9) * HOUR;
      label(160, 12, '8 場電影照散場時間排，由上往下挑', 12, true);
      [9, 13, 16, 19, 22].forEach((hour, k) => {
        label(xOf(hour), 30, String(hour), 11, true);
        s.append(rc.line(xOf(hour), 38, xOf(hour), TOP + sessions.length * ROW - 4, { stroke: '#d0d7de', strokeWidth: 1, roughness: 0.5, seed: 60 + k }));
      });
      let free = 9;
      sessions.forEach(([from, to], k) => {
        const y = TOP + k * ROW, picked = from >= free;
        if (picked) free = to;
        label(24, y + H / 2, `${from}–${to}`, 11, true);
        s.append(rc.rectangle(xOf(from), y, (to - from) * HOUR, H, { ...box, seed: 20 + k, fill: picked ? NEW : FILL }));
      });
      ['最早開演的先挑：3 場', '片長最短的先挑：3 場', '最早散場的先挑：4 場'].forEach((text, k) => label(160, 216 + k * 16, text, 12, k < 2));
      return s;
    },
    code: {
      c: `#include <stdio.h>

// 數最多看得到幾場；場次要照散場時間從早到晚排好（還沒排的話要先排序），arrive 是到影展的時間
int max_sessions(const int start[], const int end[], int n, int arrive) {
    int free = arrive, count = 0;   // free：上一場散場的時間，一開始是到影展的時間
    for (int i = 0; i < n; i++) {
        if (start[i] >= free) {     // 開演時間不早於上一場散場：趕得上，挑
            count++;
            free = end[i];
        }
    }
    return count;
}

int main(void) {
    int start[] = {10, 12, 9, 13, 14, 16, 18, 19};
    int end[] = {13, 14, 15, 16, 17, 19, 20, 22};
    printf("%d %d\\n", max_sessions(start, end, 8, 9), max_sessions(start, end, 8, 14));
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// 數最多看得到幾場；場次要照散場時間從早到晚排好（還沒排的話要先排序），arrive 是到影展的時間
int max_sessions(const std::vector<int>& start, const std::vector<int>& end, int arrive) {
    int free = arrive, count = 0;   // free：上一場散場的時間，一開始是到影展的時間
    for (size_t i = 0; i < start.size(); i++) {
        if (start[i] >= free) {     // 開演時間不早於上一場散場：趕得上，挑
            count++;
            free = end[i];
        }
    }
    return count;
}

int main() {
    std::vector<int> start = {10, 12, 9, 13, 14, 16, 18, 19};
    std::vector<int> end = {13, 14, 15, 16, 17, 19, 20, 22};
    std::cout << max_sessions(start, end, 9) << " " << max_sessions(start, end, 14) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 數最多看得到幾場；場次要照散場時間從早到晚排好（還沒排的話要先排序），arrive 是到影展的時間
    static int maxSessions(int[] start, int[] end, int arrive) {
        int free = arrive, count = 0;   // free：上一場散場的時間，一開始是到影展的時間
        for (int i = 0; i < start.length; i++) {
            if (start[i] >= free) {     // 開演時間不早於上一場散場：趕得上，挑
                count++;
                free = end[i];
            }
        }
        return count;
    }

    public static void main(String[] args) {
        int[] start = {10, 12, 9, 13, 14, 16, 18, 19};
        int[] end = {13, 14, 15, 16, 17, 19, 20, 22};
        System.out.println(maxSessions(start, end, 9) + " " + maxSessions(start, end, 14));
    }
}
`,
      python: `def max_sessions(start, end, arrive):   # 場次要照散場時間從早到晚排好（還沒排的話要先排序）
    free, count = arrive, 0             # free：上一場散場的時間，一開始是到影展的時間
    for i in range(len(start)):
        if start[i] >= free:            # 開演時間不早於上一場散場：趕得上，挑
            count += 1
            free = end[i]
    return count


start = [10, 12, 9, 13, 14, 16, 18, 19]
end = [13, 14, 15, 16, 17, 19, 20, 22]
print(max_sessions(start, end, 9), max_sessions(start, end, 14))
`,
      output: '4 2',
    },
    cost: {
      rows: [
        ['回溯每場選或不選', 'O(2ⁿ)'],
        ['貪婪', '排序 O(n log n)，加上挑一趟 O(n)'],
      ],
      note: { text: '50 場的話，2 的 50 次方大約是一千兆；排序加挑一趟只要幾百步。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '一間會議室收到 6 場會議的申請，已經照結束時間排好，想排進最多場。下面這段程式印出什麼？',
        code: {
          c: `int start[] = {8, 9, 10, 11, 13, 12};
int end[] = {10, 11, 12, 14, 15, 16};
int free = 0, count = 0;
for (int i = 0; i < 6; i++) {
    if (start[i] >= free) {
        count += 1;
        free = end[i];
    }
}
printf("%d\\n", count);`,
          cpp: `std::vector<int> start = {8, 9, 10, 11, 13, 12};
std::vector<int> end = {10, 11, 12, 14, 15, 16};
int free = 0, count = 0;
for (int i = 0; i < 6; i++) {
    if (start[i] >= free) {
        count += 1;
        free = end[i];
    }
}
std::cout << count << "\\n";`,
          java: `int[] start = {8, 9, 10, 11, 13, 12};
int[] end = {10, 11, 12, 14, 15, 16};
int free = 0, count = 0;
for (int i = 0; i < 6; i++) {
    if (start[i] >= free) {
        count += 1;
        free = end[i];
    }
}
System.out.println(count);`,
          python: `start = [8, 9, 10, 11, 13, 12]
end = [10, 11, 12, 14, 15, 16]
free, count = 0, 0
for i in range(6):
    if start[i] >= free:
        count += 1
        free = end[i]
print(count)`,
        },
        options: ['2', '3', '5', '6'],
        answer: 1,
        why: '8–10 挑，free 變成 10；9–11 開始的時候上一場還沒結束，不挑；10–12 剛好接得上，挑，free 變成 12；11–14 不挑；13–15 挑，free 變成 15；12–16 不挑，一共 3 場。2 是把 >= 看成 >：10–12 接不上 8–10，改挑 11–14，後面兩場就都排不進去。5 是把 free 更新成這一場的開始時間：只要比上一場晚開始就挑，重疊的也算進去了。6 是忘了 free 會更新：free 一直是 0，每一場都挑。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int start[] = {8, 9, 10, 11, 13, 12};
    int end[] = {10, 11, 12, 14, 15, 16};
    int free = 0, count = 0;
    for (int i = 0; i < 6; i++) {
        if (start[i] >= free) {
            count += 1;
            free = end[i];
        }
    }
    printf("%d\\n", count);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> start = {8, 9, 10, 11, 13, 12};
    std::vector<int> end = {10, 11, 12, 14, 15, 16};
    int free = 0, count = 0;
    for (int i = 0; i < 6; i++) {
        if (start[i] >= free) {
            count += 1;
            free = end[i];
        }
    }
    std::cout << count << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] start = {8, 9, 10, 11, 13, 12};
        int[] end = {10, 11, 12, 14, 15, 16};
        int free = 0, count = 0;
        for (int i = 0; i < 6; i++) {
            if (start[i] >= free) {
                count += 1;
                free = end[i];
            }
        }
        System.out.println(count);
    }
}
`,
          python: `start = [8, 9, 10, 11, 13, 12]
end = [10, 11, 12, 14, 15, 16]
free, count = 0, 0
for i in range(6):
    if start[i] >= free:
        count += 1
        free = end[i]
print(count)
`,
        },
        output: '3',
      },
      {
        kind: '程式測試與除錯',
        prompt: '影展那 8 場，這次資料是照開演時間排的。程式印出 3，可是明明可以看 4 場。要怎麼改？',
        code: {
          c: `int start[] = {9, 10, 12, 13, 14, 16, 18, 19};
int end[] = {15, 13, 14, 16, 17, 19, 20, 22};
int free = 0, count = 0;
for (int i = 0; i < 8; i++) {
    if (start[i] >= free) {
        count += 1;
        free = end[i];
    }
}
printf("%d\\n", count);`,
          cpp: `std::vector<int> start = {9, 10, 12, 13, 14, 16, 18, 19};
std::vector<int> end = {15, 13, 14, 16, 17, 19, 20, 22};
int free = 0, count = 0;
for (int i = 0; i < 8; i++) {
    if (start[i] >= free) {
        count += 1;
        free = end[i];
    }
}
std::cout << count << "\\n";`,
          java: `int[] start = {9, 10, 12, 13, 14, 16, 18, 19};
int[] end = {15, 13, 14, 16, 17, 19, 20, 22};
int free = 0, count = 0;
for (int i = 0; i < 8; i++) {
    if (start[i] >= free) {
        count += 1;
        free = end[i];
    }
}
System.out.println(count);`,
          python: `start = [9, 10, 12, 13, 14, 16, 18, 19]
end = [15, 13, 14, 16, 17, 19, 20, 22]
free, count = 0, 0
for i in range(8):
    if start[i] >= free:
        count += 1
        free = end[i]
print(count)`,
        },
        options: ['把 start[i] >= free 改成 start[i] > free', '把場次改成照散場時間排好，再用同一段程式挑', '把 free = end[i] 改成 free = start[i]', '把 free = end[i] 移到 if 外面，每一場都更新'],
        answer: 1,
        why: '資料照開演時間排，第一個看到的是 9–15 那部長片，程式挑了它，10–13、12–14、13–16、14–17 四場全部被擋掉，後面只挑得到 16–19、19–22，一共 3 場。挑的那段程式沒有錯，錯在順序：改成照散場時間排好，就會挑到 10–13、13–16、16–19、19–22 四場。改成 > 的話，19–22 接不上 16–19，只剩 2 場；free 改成記開演時間，只要比上一場晚開演就挑，會印出 8，可是這 8 場互相重疊，看不完；free 每一場都更新的話，沒挑的場次也把時間佔走，只印出 1。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int start[] = {9, 10, 12, 13, 14, 16, 18, 19};
    int end[] = {15, 13, 14, 16, 17, 19, 20, 22};
    int free = 0, count = 0;
    for (int i = 0; i < 8; i++) {
        if (start[i] >= free) {
            count += 1;
            free = end[i];
        }
    }
    printf("%d\\n", count);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> start = {9, 10, 12, 13, 14, 16, 18, 19};
    std::vector<int> end = {15, 13, 14, 16, 17, 19, 20, 22};
    int free = 0, count = 0;
    for (int i = 0; i < 8; i++) {
        if (start[i] >= free) {
            count += 1;
            free = end[i];
        }
    }
    std::cout << count << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] start = {9, 10, 12, 13, 14, 16, 18, 19};
        int[] end = {15, 13, 14, 16, 17, 19, 20, 22};
        int free = 0, count = 0;
        for (int i = 0; i < 8; i++) {
            if (start[i] >= free) {
                count += 1;
                free = end[i];
            }
        }
        System.out.println(count);
    }
}
`,
          python: `start = [9, 10, 12, 13, 14, 16, 18, 19]
end = [15, 13, 14, 16, 17, 19, 20, 22]
free, count = 0, 0
for i in range(8):
    if start[i] >= free:
        count += 1
        free = end[i]
print(count)
`,
        },
        output: '3',
      },
      {
        kind: '解析計算邏輯',
        prompt: '硬幣面額是 5、4、1 元，下面這段找零程式每次先拿最大的面額。要湊 8 元，它印出用了幾個硬幣？',
        code: {
          c: `int coins[] = {5, 4, 1};
int amount = 8, count = 0;
for (int i = 0; i < 3; i++) {
    while (amount >= coins[i]) {
        amount -= coins[i];
        count += 1;
    }
}
printf("%d\\n", count);`,
          cpp: `std::vector<int> coins = {5, 4, 1};
int amount = 8, count = 0;
for (int i = 0; i < 3; i++) {
    while (amount >= coins[i]) {
        amount -= coins[i];
        count += 1;
    }
}
std::cout << count << "\\n";`,
          java: `int[] coins = {5, 4, 1};
int amount = 8, count = 0;
for (int i = 0; i < 3; i++) {
    while (amount >= coins[i]) {
        amount -= coins[i];
        count += 1;
    }
}
System.out.println(count);`,
          python: `coins = [5, 4, 1]
amount, count = 8, 0
for i in range(3):
    while amount >= coins[i]:
        amount -= coins[i]
        count += 1
print(count)`,
        },
        options: ['2', '3', '4', '8'],
        answer: 2,
        why: '先拿一個 5 元，剩 3 元；4 元拿不了；再拿三個 1 元，一共 4 個。2 是最少的個數（4 + 4），可是程式一開始就拿了 5 元，拿了就不回頭，走不到這個答案。3 是以為每種面額各拿一個，可是 5 + 4 + 1 是 10 元，而且拿了 5 元之後剩 3 元，4 元根本拿不了。8 是全部用 1 元硬幣的個數，程式會先拿大的，不會這樣湊。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int coins[] = {5, 4, 1};
    int amount = 8, count = 0;
    for (int i = 0; i < 3; i++) {
        while (amount >= coins[i]) {
            amount -= coins[i];
            count += 1;
        }
    }
    printf("%d\\n", count);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> coins = {5, 4, 1};
    int amount = 8, count = 0;
    for (int i = 0; i < 3; i++) {
        while (amount >= coins[i]) {
            amount -= coins[i];
            count += 1;
        }
    }
    std::cout << count << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] coins = {5, 4, 1};
        int amount = 8, count = 0;
        for (int i = 0; i < 3; i++) {
            while (amount >= coins[i]) {
                amount -= coins[i];
                count += 1;
            }
        }
        System.out.println(count);
    }
}
`,
          python: `coins = [5, 4, 1]
amount, count = 8, 0
for i in range(3):
    while amount >= coins[i]:
        amount -= coins[i]
        count += 1
print(count)
`,
        },
        output: '4',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      { text: '背包能不能用貪婪，看東西能不能切。能切的（散裝的茶葉、米）每次先拿每公斤最值錢的，裝到滿為止，是貪婪法；不能切的（一整台相機）這樣拿可能留下塞不滿的空間，要用動態規劃。', see: 'dp' },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'greedy', page);
})(typeof window !== 'undefined' ? window : globalThis);
