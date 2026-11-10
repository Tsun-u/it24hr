// classroom/algorithms/backtracking.js — 演算法「回溯」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '搭車回家，還有 20 分鐘到站。你想從歌單的 12 首歌裡挑幾首，剛好在到站的時候播完。每首歌選或不選，12 首一共有 4096 種挑法，要一種一種加起來看嗎？',
    // 複習：用學過的遞迴把每一種挑法都走到，歌一多就走不完；quote 是這頁的核心想法
    review: [
      { text: '用學過的遞迴，可以把每一種挑法都走到：每首歌分成「選」和「不選」兩條路，12 首走到底有 4096 種，每一種加起來看是不是 20 分鐘。把所有可能都列出來檢查，叫暴力法（brute force），也叫窮舉。30 首歌就超過十億種。', see: 'programming/recursion' },
      '可是你自己挑歌的時候不會這樣。前四首加起來已經 22 分鐘，後面八首不管怎麼挑都超過，這 256 種挑法一種都不用看。',
      { quote: '挑到一半發現不可能了，就退回上一步，換另一個選擇。' },
    ],
    summary: '不用把 4096 種都加一遍：一首一首決定選或不選，加起來超過 20 分鐘就退回上一步，那首歌後面的挑法一次全部跳過。這份歌單只走了 25 步就找到 6、5、4、5 分鐘這四首。下次碰到要一步一步做選擇的問題，像排座位、填數獨，你就知道：走一步檢查一步，走不通就退回上一個選擇，換一條路。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '數獨：填到一半發現同一列已經有 5，把剛填的擦掉、換一個數字；每個數字都不行，就再往前擦一格。',
      { text: '走迷宮：碰到死路，退回上一個岔路口，換一條還沒走過的路。圖的深度優先搜尋也是這樣走。', see: 'ds/graph' },
      '排座位、排班表：一個位置一個位置放人，放下去跟前面衝突就換人。每個位置「放誰」是一個選擇，n 個人有 n! 種排法。',
      'APCS 實作題：列出所有排列、所有子集合，再照題目的限制提早放棄；經典題是八皇后（8 個皇后放上西洋棋盤，互相吃不到）。',
    ],
    concept: [
      '回溯（backtracking）是一步一步做選擇，每做一個就檢查：還有可能，就往下一步；已經不可能，就退回上一步、換下一個選擇；這一步的選擇全部試完都不行，再往前退一步。',
      '把所有選擇畫出來是一棵樹：每一層是一首歌，往左是選、往右是不選，從頂走到底的每一條路是一種挑法。暴力法把每條路都走到底才檢查；回溯在半路檢查，不可能的那一整枝都不走，這叫剪枝（pruning）。',
      { text: '寫成遞迴：pick(i, total) 是「前 i 首決定好了，目前加到 total 分鐘」。先試選第 i 首，呼叫 pick(i + 1, total + songs[i])；回來的答案是不行，再試不選，呼叫 pick(i + 1, total)。每一層有自己的 total，回到上一層，剛才加的那首自然就不算了，這就是「退回」。', see: 'programming/recursion' },
      '什麼時候停：加起來剛好是目標，找到了；歌都決定完了，或已經超過目標，這條路不行。「超過就不用往下」能成立，是因為歌的長度都是正的，越加只會越多。',
      '兩種常見的形狀。子集合：每樣東西選或不選，n 樣有 2ⁿ 種，這一頁就是。排列：每個位置放誰，n 個有 n! 種，要多一個陣列記誰已經放過了，退回時把記號改回來。',
    ],
    traps: [
      { wrong: '回溯和暴力法一樣，都是全部試一遍', right: '暴力法每條路走到底才檢查；回溯走一步檢查一步，不可能的整枝不走。最壞的情況（沒有東西可以剪）兩個一樣慢，差在平常能剪掉多少。' },
      { wrong: '找到答案的時候 return，整個遞迴就停了', right: 'return 只回到上一層。上一層要接住回傳值，是「找到了」就自己也馬上 return，一層一層傳上去；沒接住的話會繼續試別的選擇。' },
      { wrong: '用陣列記選了哪些，遞迴回來之後記號會自己恢復', right: '陣列傳進函式，改的是同一份。選的時候記 1，回來之後要自己改回 0，不然上一條路留下的記號會混進下一條路（試試看第二題）。total 這種一般的變數每一層各有一份，才不用改。', see: 'programming/parameter_passing' },
      { wrong: '剪枝的條件多加幾個，只會更快', right: '剪錯會把答案剪掉。「超過目標就放棄」在長度都是正數時才對；題目裡有負數（例如折扣）的話，超過了之後還可能減回來。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{t}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '湊 13 分鐘', values: { t: 13 } }, { label: '湊 15 分鐘', values: { t: 15 } }],
      code: {
        c: `#include <stdio.h>

int songs[] = {8, 7, 5};
int target = {{t}};

int pick(int i, int total) {
    if (total == target) {
        return 1;
    }
    if (i == 3 || total > target) {
        return 0;
    }
    int took = pick(i + 1, total + songs[i]);
    if (took == 1) {
        return 1;
    }
    return pick(i + 1, total);
}

int main(void) {
    int found = pick(0, 0);
    if (found == 1) {
        printf("yes\\n");
    } else {
        printf("no\\n");
    }
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

std::vector<int> songs = {8, 7, 5};
int target = {{t}};

int pick(int i, int total) {
    if (total == target) {
        return 1;
    }
    if (i == 3 || total > target) {
        return 0;
    }
    int took = pick(i + 1, total + songs[i]);
    if (took == 1) {
        return 1;
    }
    return pick(i + 1, total);
}

int main() {
    int found = pick(0, 0);
    if (found == 1) {
        std::cout << "yes\\n";
    } else {
        std::cout << "no\\n";
    }
    return 0;
}
`,
        java: `public class Main {
    static int[] songs = {8, 7, 5};
    static int target = {{t}};

    static int pick(int i, int total) {
        if (total == target) {
            return 1;
        }
        if (i == 3 || total > target) {
            return 0;
        }
        int took = pick(i + 1, total + songs[i]);
        if (took == 1) {
            return 1;
        }
        return pick(i + 1, total);
    }

    public static void main(String[] args) {
        int found = pick(0, 0);
        if (found == 1) {
            System.out.println("yes");
        } else {
            System.out.println("no");
        }
    }
}
`,
        python: `def pick(i, total):
    if total == target:
        return 1
    if i == 3 or total > target:
        return 0
    took = pick(i + 1, total + songs[i])
    if took == 1:
        return 1
    return pick(i + 1, total)

songs = [8, 7, 5]
target = {{t}}
found = pick(0, 0)
if found == 1:
    print("yes")
else:
    print("no")
`,
      },
      lines: {
        c: { 1: 6, 2: 7, 3: 8, 4: 10, 5: 11, 6: 13, 7: 14, 8: 15, 9: 17, 11: 3, 12: 4, 13: 21, 14: 22, 15: 23, 17: 25 },
        cpp: { 1: 7, 2: 8, 3: 9, 4: 11, 5: 12, 6: 14, 7: 15, 8: 16, 9: 18, 11: 4, 12: 5, 13: 22, 14: 23, 15: 24, 17: 26 },
        java: { 1: 5, 2: 6, 3: 7, 4: 9, 5: 10, 6: 12, 7: 13, 8: 14, 9: 16, 11: 2, 12: 3, 13: 20, 14: 21, 15: 22, 17: 24 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "湊 13 分鐘": [
        {"line":1,"vars":{},"out":"","def":"pick"},
        {"line":11,"vars":{"songs":[8,7,5]},"out":""},
        {"line":12,"vars":{"songs":[8,7,5],"target":13},"out":""},
        {"line":13,"vars":{"i":0,"total":0},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}}],"call":"pick"},
        {"line":2,"vars":{"i":0,"total":0},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}}],"cond":false},
        {"line":4,"vars":{"i":0,"total":0},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}}],"cond":false},
        {"line":6,"vars":{"i":1,"total":8},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}}],"call":"pick"},
        {"line":2,"vars":{"i":1,"total":8},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}}],"cond":false},
        {"line":4,"vars":{"i":1,"total":8},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}}],"cond":false},
        {"line":6,"vars":{"i":2,"total":15},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}},{"fn":"pick","vars":{"i":2,"total":15}}],"call":"pick"},
        {"line":2,"vars":{"i":2,"total":15},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}},{"fn":"pick","vars":{"i":2,"total":15}}],"cond":false},
        {"line":4,"vars":{"i":2,"total":15},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}},{"fn":"pick","vars":{"i":2,"total":15}}],"cond":true},
        {"line":5,"vars":{"i":2,"total":15},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}},{"fn":"pick","vars":{"i":2,"total":15}}],"ret":0},
        {"line":6,"vars":{"i":1,"total":8,"took":0},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}}]},
        {"line":7,"vars":{"i":1,"total":8,"took":0},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}}],"cond":false},
        {"line":9,"vars":{"i":2,"total":8},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}},{"fn":"pick","vars":{"i":2,"total":8}}],"call":"pick"},
        {"line":2,"vars":{"i":2,"total":8},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}},{"fn":"pick","vars":{"i":2,"total":8}}],"cond":false},
        {"line":4,"vars":{"i":2,"total":8},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}},{"fn":"pick","vars":{"i":2,"total":8}}],"cond":false},
        {"line":6,"vars":{"i":3,"total":13},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}},{"fn":"pick","vars":{"i":2,"total":8}},{"fn":"pick","vars":{"i":3,"total":13}}],"call":"pick"},
        {"line":2,"vars":{"i":3,"total":13},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}},{"fn":"pick","vars":{"i":2,"total":8}},{"fn":"pick","vars":{"i":3,"total":13}}],"cond":true},
        {"line":3,"vars":{"i":3,"total":13},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}},{"fn":"pick","vars":{"i":2,"total":8}},{"fn":"pick","vars":{"i":3,"total":13}}],"ret":1},
        {"line":6,"vars":{"i":2,"total":8,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}},{"fn":"pick","vars":{"i":2,"total":8,"took":1}}]},
        {"line":7,"vars":{"i":2,"total":8,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}},{"fn":"pick","vars":{"i":2,"total":8,"took":1}}],"cond":true},
        {"line":8,"vars":{"i":2,"total":8,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}},{"fn":"pick","vars":{"i":2,"total":8,"took":1}}],"ret":1},
        {"line":9,"vars":{"i":1,"total":8,"took":0},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":0}}],"ret":1},
        {"line":6,"vars":{"i":0,"total":0,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0,"took":1}}]},
        {"line":7,"vars":{"i":0,"total":0,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0,"took":1}}],"cond":true},
        {"line":8,"vars":{"i":0,"total":0,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":13}},{"fn":"pick","vars":{"i":0,"total":0,"took":1}}],"ret":1},
        {"line":13,"vars":{"songs":[8,7,5],"target":13,"found":1},"out":""},
        {"line":14,"vars":{"songs":[8,7,5],"target":13,"found":1},"out":"","cond":true},
        {"line":15,"vars":{"songs":[8,7,5],"target":13,"found":1},"out":"yes\n"},
      ],
      "湊 15 分鐘": [
        {"line":1,"vars":{},"out":"","def":"pick"},
        {"line":11,"vars":{"songs":[8,7,5]},"out":""},
        {"line":12,"vars":{"songs":[8,7,5],"target":15},"out":""},
        {"line":13,"vars":{"i":0,"total":0},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}}],"call":"pick"},
        {"line":2,"vars":{"i":0,"total":0},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}}],"cond":false},
        {"line":4,"vars":{"i":0,"total":0},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}}],"cond":false},
        {"line":6,"vars":{"i":1,"total":8},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}}],"call":"pick"},
        {"line":2,"vars":{"i":1,"total":8},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}}],"cond":false},
        {"line":4,"vars":{"i":1,"total":8},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}}],"cond":false},
        {"line":6,"vars":{"i":2,"total":15},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}},{"fn":"pick","vars":{"i":2,"total":15}}],"call":"pick"},
        {"line":2,"vars":{"i":2,"total":15},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}},{"fn":"pick","vars":{"i":2,"total":15}}],"cond":true},
        {"line":3,"vars":{"i":2,"total":15},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8}},{"fn":"pick","vars":{"i":2,"total":15}}],"ret":1},
        {"line":6,"vars":{"i":1,"total":8,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":1}}]},
        {"line":7,"vars":{"i":1,"total":8,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":1}}],"cond":true},
        {"line":8,"vars":{"i":1,"total":8,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0}},{"fn":"pick","vars":{"i":1,"total":8,"took":1}}],"ret":1},
        {"line":6,"vars":{"i":0,"total":0,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0,"took":1}}]},
        {"line":7,"vars":{"i":0,"total":0,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0,"took":1}}],"cond":true},
        {"line":8,"vars":{"i":0,"total":0,"took":1},"out":"","stack":[{"vars":{"songs":[8,7,5],"target":15}},{"fn":"pick","vars":{"i":0,"total":0,"took":1}}],"ret":1},
        {"line":13,"vars":{"songs":[8,7,5],"target":15,"found":1},"out":""},
        {"line":14,"vars":{"songs":[8,7,5],"target":15,"found":1},"out":"","cond":true},
        {"line":15,"vars":{"songs":[8,7,5],"target":15,"found":1},"out":"yes\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：三首歌 8、7、5 分鐘湊 13 分鐘的選擇樹。圓圈裡是目前加到幾分鐘；15 超過就退回，13 剛好塗黃；「不選 8」那一半沒走到，畫淡
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const s = svgEl(320, 240), rc = rough.svg(s);
      const line = { stroke: INK, strokeWidth: 1.4, roughness: 0.9 };
      const FADED = 0.35, WRONG = '#cf222e';
      const label = (x, y, text, size = 11, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); return t; };
      // 走過的節點：start、took8、over（8 + 7 = 15）、skip7、hit（8 + 5 = 13）；沒走到的：skip8 和它底下的兩個
      const start = [150, 40], took8 = [80, 95], skip8 = [235, 95], over = [35, 155], skip7 = [125, 155], hit = [95, 215];
      const unvisited = [[210, 150], [260, 150]];
      const edge = (from, to, seed, faded = false) => {
        const e = rc.line(from[0], from[1], to[0], to[1], { ...line, seed });
        if (faded) e.setAttribute('opacity', FADED);
        s.append(e);
      };
      const node = ([x, y], text, seed, fill = FILL, faded = false) => {
        const c = rc.circle(x, y, text === '' ? 18 : 26, { ...line, seed, fill, fillStyle: 'solid' });
        if (faded) c.setAttribute('opacity', FADED);
        s.append(c);
        if (text !== '') { const t = label(x, y, text, 12); if (faded) t.setAttribute('opacity', FADED); }
      };
      label(160, 12, '三首歌 8、7、5 分鐘，要湊 13 分鐘', 12, true);
      edge(start, took8, 1); edge(took8, over, 2); edge(took8, skip7, 3); edge(skip7, hit, 4);
      edge(start, skip8, 5, true); unvisited.forEach((p, k) => edge(skip8, p, 6 + k, true));
      node(start, '0', 11); node(took8, '8', 12); node(over, '15', 13); node(skip7, '8', 14); node(hit, '13', 15, NEW);
      node(skip8, '0', 16, FILL, true); unvisited.forEach((p, k) => node(p, '', 17 + k, FILL, true));
      label(96, 62, '選 8'); label(216, 62, '不選 8', 11, true);
      label(36, 122, '選 7'); label(128, 122, '不選 7');
      label(88, 185, '選 5');
      // 15 超過 13：打叉、退回
      s.append(rc.line(10, 176, 18, 184, { stroke: WRONG, strokeWidth: 1.8, roughness: 0.6, seed: 21 }));
      s.append(rc.line(18, 176, 10, 184, { stroke: WRONG, strokeWidth: 1.8, roughness: 0.6, seed: 22 }));
      label(40, 180, '超過'); label(35, 196, '退回');
      label(128, 215, '剛好', 12);
      label(235, 176, '找到了，這一半不用走', 11, true);
      return s;
    },
    code: {
      c: `#include <stdio.h>

int songs[] = {6, 5, 4, 7, 3, 8, 5, 4, 6, 3, 7, 4};
int n = 12;
int target = 20;
int chosen[12];                         // chosen[i] 是 1 代表選了第 i 首，一開始全部是 0

// 前 i 首決定好了，目前加到 total 分鐘；湊得到 target 回傳 1，湊不到回傳 0
int find(int i, int total) {
    if (total == target) {              // 剛好：找到了
        return 1;
    }
    if (i == n || total > target) {     // 歌都決定完了，或已經超過：這條路不行
        return 0;
    }
    chosen[i] = 1;                      // 選第 i 首
    if (find(i + 1, total + songs[i]) == 1) {
        return 1;                       // 後面湊到了：自己也馬上回傳，一層一層傳上去
    }
    chosen[i] = 0;                      // 退回：把記號改回來
    return find(i + 1, total);          // 換成不選第 i 首
}

int main(void) {
    if (find(0, 0) == 1) {
        for (int i = 0; i < n; i++) {
            if (chosen[i] == 1) {
                printf("%d ", songs[i]);
            }
        }
        printf("\\n");
    } else {
        printf("none\\n");
    }
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

std::vector<int> songs = {6, 5, 4, 7, 3, 8, 5, 4, 6, 3, 7, 4};
int n = 12;
int target = 20;
std::vector<int> chosen(12, 0);         // chosen[i] 是 1 代表選了第 i 首，一開始全部是 0

// 前 i 首決定好了，目前加到 total 分鐘；湊得到 target 回傳 1，湊不到回傳 0
int find(int i, int total) {
    if (total == target) {              // 剛好：找到了
        return 1;
    }
    if (i == n || total > target) {     // 歌都決定完了，或已經超過：這條路不行
        return 0;
    }
    chosen[i] = 1;                      // 選第 i 首
    if (find(i + 1, total + songs[i]) == 1) {
        return 1;                       // 後面湊到了：自己也馬上回傳，一層一層傳上去
    }
    chosen[i] = 0;                      // 退回：把記號改回來
    return find(i + 1, total);          // 換成不選第 i 首
}

int main() {
    if (find(0, 0) == 1) {
        for (int i = 0; i < n; i++) {
            if (chosen[i] == 1) {
                std::cout << songs[i] << " ";
            }
        }
        std::cout << "\\n";
    } else {
        std::cout << "none\\n";
    }
    return 0;
}
`,
      java: `public class Main {
    static int[] songs = {6, 5, 4, 7, 3, 8, 5, 4, 6, 3, 7, 4};
    static int n = 12;
    static int target = 20;
    static int[] chosen = new int[12];  // chosen[i] 是 1 代表選了第 i 首，一開始全部是 0

    // 前 i 首決定好了，目前加到 total 分鐘；湊得到 target 回傳 1，湊不到回傳 0
    static int find(int i, int total) {
        if (total == target) {          // 剛好：找到了
            return 1;
        }
        if (i == n || total > target) { // 歌都決定完了，或已經超過：這條路不行
            return 0;
        }
        chosen[i] = 1;                  // 選第 i 首
        if (find(i + 1, total + songs[i]) == 1) {
            return 1;                   // 後面湊到了：自己也馬上回傳，一層一層傳上去
        }
        chosen[i] = 0;                  // 退回：把記號改回來
        return find(i + 1, total);      // 換成不選第 i 首
    }

    public static void main(String[] args) {
        if (find(0, 0) == 1) {
            for (int i = 0; i < n; i++) {
                if (chosen[i] == 1) {
                    System.out.print(songs[i] + " ");
                }
            }
            System.out.println();
        } else {
            System.out.println("none");
        }
    }
}
`,
      python: `songs = [6, 5, 4, 7, 3, 8, 5, 4, 6, 3, 7, 4]
n = 12
target = 20
chosen = [0] * 12                       # chosen[i] 是 1 代表選了第 i 首，一開始全部是 0


def find(i, total):                     # 前 i 首決定好了，目前加到 total 分鐘；湊得到 target 回傳 1，湊不到回傳 0
    if total == target:                 # 剛好：找到了
        return 1
    if i == n or total > target:        # 歌都決定完了，或已經超過：這條路不行
        return 0
    chosen[i] = 1                       # 選第 i 首
    if find(i + 1, total + songs[i]) == 1:
        return 1                        # 後面湊到了：自己也馬上回傳，一層一層傳上去
    chosen[i] = 0                       # 退回：把記號改回來
    return find(i + 1, total)           # 換成不選第 i 首


if find(0, 0) == 1:
    for i in range(n):
        if chosen[i] == 1:
            print(songs[i], end=" ")
    print()
else:
    print("none")
`,
      output: '6 5 4 5',
    },
    // 跑幾步：回溯要數的是函式總共被呼叫幾次（走了幾步）
    cost: {
      rows: [
        ['暴力法：2ⁿ 種挑法，每種加 n 首', 'O(2ⁿ × n)'],
        ['回溯：實際看剪掉多少（12 首湊 20 分鐘：走 25 步就找到第一組；要數出全部 89 組，超過就退回要走 2271 步，每條路都走到底是 8191 步）', '最壞還是 O(2ⁿ)'],
        ['排列型：每個位置放誰', 'O(n!)'],
      ],
      note: { text: 'n 每多 1，暴力法的挑法就變兩倍；題目的 n 通常給得很小（20 上下），就是在暗示可以用回溯。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '三首歌 5、4、3 分鐘，想湊剛好 7 分鐘；chosen 記選了哪幾首。下面這段程式印出什麼？',
        code: {
          c: `int songs[] = {5, 4, 3};
int chosen[] = {0, 0, 0};

int find(int i, int total) {
    if (total == 7) {
        return 1;
    }
    if (i == 3 || total > 7) {
        return 0;
    }
    chosen[i] = 1;
    if (find(i + 1, total + songs[i]) == 1) {
        return 1;
    }
    chosen[i] = 0;
    return find(i + 1, total);
}

find(0, 0);
for (int k = 0; k < 3; k++) {
    if (chosen[k] == 1) {
        printf("%d ", songs[k]);
    }
}
printf("\\n");`,
          cpp: `std::vector<int> songs = {5, 4, 3};
std::vector<int> chosen = {0, 0, 0};

int find(int i, int total) {
    if (total == 7) {
        return 1;
    }
    if (i == 3 || total > 7) {
        return 0;
    }
    chosen[i] = 1;
    if (find(i + 1, total + songs[i]) == 1) {
        return 1;
    }
    chosen[i] = 0;
    return find(i + 1, total);
}

find(0, 0);
for (int k = 0; k < 3; k++) {
    if (chosen[k] == 1) {
        std::cout << songs[k] << " ";
    }
}
std::cout << "\\n";`,
          java: `static int[] songs = {5, 4, 3};
static int[] chosen = {0, 0, 0};

static int find(int i, int total) {
    if (total == 7) {
        return 1;
    }
    if (i == 3 || total > 7) {
        return 0;
    }
    chosen[i] = 1;
    if (find(i + 1, total + songs[i]) == 1) {
        return 1;
    }
    chosen[i] = 0;
    return find(i + 1, total);
}

find(0, 0);
for (int k = 0; k < 3; k++) {
    if (chosen[k] == 1) {
        System.out.print(songs[k] + " ");
    }
}
System.out.println();`,
          python: `songs = [5, 4, 3]
chosen = [0, 0, 0]

def find(i, total):
    if total == 7:
        return 1
    if i == 3 or total > 7:
        return 0
    chosen[i] = 1
    if find(i + 1, total + songs[i]) == 1:
        return 1
    chosen[i] = 0
    return find(i + 1, total)

find(0, 0)
for k in range(3):
    if chosen[k] == 1:
        print(songs[k], end=" ")
print()`,
        },
        options: ['5 4', '5 3', '4 3', '5 4 3'],
        answer: 2,
        why: '先選 5，再選 4 是 9 分鐘，超過了，退回、把 4 的記號改回 0；改選 3 是 8 分鐘，還是超過，3 也改回 0；5 後面的選擇都試完了，再退一步，5 也改回 0。不選 5，選 4、再選 3，剛好 7 分鐘，印出 4 3。5 4 是第一條走到超過的路，加起來 9，退回的時候記號已經改回 0 了；5 3 是第二條，加起來 8，一樣被退回；5 4 3 是忘了把記號改回 0 才會印出來的（下一題）。',
        program: {
          c: '#include <stdio.h>\nint songs[] = {5, 4, 3};\nint chosen[] = {0, 0, 0};\n\nint find(int i, int total) {\n    if (total == 7) {\n        return 1;\n    }\n    if (i == 3 || total > 7) {\n        return 0;\n    }\n    chosen[i] = 1;\n    if (find(i + 1, total + songs[i]) == 1) {\n        return 1;\n    }\n    chosen[i] = 0;\n    return find(i + 1, total);\n}\n\nint main(void) {\n    find(0, 0);\n    for (int k = 0; k < 3; k++) {\n        if (chosen[k] == 1) {\n            printf("%d ", songs[k]);\n        }\n    }\n    printf("\\n");\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nstd::vector<int> songs = {5, 4, 3};\nstd::vector<int> chosen = {0, 0, 0};\n\nint find(int i, int total) {\n    if (total == 7) {\n        return 1;\n    }\n    if (i == 3 || total > 7) {\n        return 0;\n    }\n    chosen[i] = 1;\n    if (find(i + 1, total + songs[i]) == 1) {\n        return 1;\n    }\n    chosen[i] = 0;\n    return find(i + 1, total);\n}\n\nint main() {\n    find(0, 0);\n    for (int k = 0; k < 3; k++) {\n        if (chosen[k] == 1) {\n            std::cout << songs[k] << " ";\n        }\n    }\n    std::cout << "\\n";\n}\n',
          java: 'public class Main {\n    static int[] songs = {5, 4, 3};\n    static int[] chosen = {0, 0, 0};\n\n    static int find(int i, int total) {\n        if (total == 7) {\n            return 1;\n        }\n        if (i == 3 || total > 7) {\n            return 0;\n        }\n        chosen[i] = 1;\n        if (find(i + 1, total + songs[i]) == 1) {\n            return 1;\n        }\n        chosen[i] = 0;\n        return find(i + 1, total);\n    }\n\n    public static void main(String[] args) {\n        find(0, 0);\n        for (int k = 0; k < 3; k++) {\n            if (chosen[k] == 1) {\n                System.out.print(songs[k] + " ");\n            }\n        }\n        System.out.println();\n    }\n}\n',
          python: 'songs = [5, 4, 3]\nchosen = [0, 0, 0]\n\ndef find(i, total):\n    if total == 7:\n        return 1\n    if i == 3 or total > 7:\n        return 0\n    chosen[i] = 1\n    if find(i + 1, total + songs[i]) == 1:\n        return 1\n    chosen[i] = 0\n    return find(i + 1, total)\n\nfind(0, 0)\nfor k in range(3):\n    if chosen[k] == 1:\n        print(songs[k], end=" ")\nprint()\n',
        },
        output: '4 3',
      },
      {
        kind: '程式測試與除錯',
        prompt: '同樣三首歌湊 7 分鐘，應該印出 4 3，這段程式卻印出 5 4 3，加起來是 12 分鐘。要怎麼改？',
        code: {
          c: `int songs[] = {5, 4, 3};
int chosen[] = {0, 0, 0};

int find(int i, int total) {
    if (total == 7) {
        return 1;
    }
    if (i == 3 || total > 7) {
        return 0;
    }
    chosen[i] = 1;
    if (find(i + 1, total + songs[i]) == 1) {
        return 1;
    }
    return find(i + 1, total);
}

find(0, 0);
for (int k = 0; k < 3; k++) {
    if (chosen[k] == 1) {
        printf("%d ", songs[k]);
    }
}
printf("\\n");`,
          cpp: `std::vector<int> songs = {5, 4, 3};
std::vector<int> chosen = {0, 0, 0};

int find(int i, int total) {
    if (total == 7) {
        return 1;
    }
    if (i == 3 || total > 7) {
        return 0;
    }
    chosen[i] = 1;
    if (find(i + 1, total + songs[i]) == 1) {
        return 1;
    }
    return find(i + 1, total);
}

find(0, 0);
for (int k = 0; k < 3; k++) {
    if (chosen[k] == 1) {
        std::cout << songs[k] << " ";
    }
}
std::cout << "\\n";`,
          java: `static int[] songs = {5, 4, 3};
static int[] chosen = {0, 0, 0};

static int find(int i, int total) {
    if (total == 7) {
        return 1;
    }
    if (i == 3 || total > 7) {
        return 0;
    }
    chosen[i] = 1;
    if (find(i + 1, total + songs[i]) == 1) {
        return 1;
    }
    return find(i + 1, total);
}

find(0, 0);
for (int k = 0; k < 3; k++) {
    if (chosen[k] == 1) {
        System.out.print(songs[k] + " ");
    }
}
System.out.println();`,
          python: `songs = [5, 4, 3]
chosen = [0, 0, 0]

def find(i, total):
    if total == 7:
        return 1
    if i == 3 or total > 7:
        return 0
    chosen[i] = 1
    if find(i + 1, total + songs[i]) == 1:
        return 1
    return find(i + 1, total)

find(0, 0)
for k in range(3):
    if chosen[k] == 1:
        print(songs[k], end=" ")
print()`,
        },
        options: ['把 total > 7 改成 total >= 7', '在最後一行 return find(i + 1, total) 的前面，加一行 chosen[i] = 0', '把最後一行改成 return 0', '印之前先把 chosen 的三格都改成 0'],
        answer: 1,
        why: '選 5、選 4 超過了，退回來改試別條路，可是 chosen 是同一份陣列，5 和 4 的記號還留著；最後找到的是 4、3，印的時候連之前留下的 5 也印出來。選的那條路回來不是 1，就要把 chosen[i] 改回 0，再去試不選，改完印出 4 3。改成 total >= 7 沒有差別：剛好 7 的時候前面那個 if 已經回傳 1 了，還是印 5 4 3；最後一行改成 return 0，就不會去試「不選」，選 5、選 4 超過之後直接放棄，留下 5 4；印之前把 chosen 全部改成 0，連真正選的 4、3 也擦掉了，什麼都印不出來。',
        program: {
          c: '#include <stdio.h>\nint songs[] = {5, 4, 3};\nint chosen[] = {0, 0, 0};\n\nint find(int i, int total) {\n    if (total == 7) {\n        return 1;\n    }\n    if (i == 3 || total > 7) {\n        return 0;\n    }\n    chosen[i] = 1;\n    if (find(i + 1, total + songs[i]) == 1) {\n        return 1;\n    }\n    return find(i + 1, total);\n}\n\nint main(void) {\n    find(0, 0);\n    for (int k = 0; k < 3; k++) {\n        if (chosen[k] == 1) {\n            printf("%d ", songs[k]);\n        }\n    }\n    printf("\\n");\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nstd::vector<int> songs = {5, 4, 3};\nstd::vector<int> chosen = {0, 0, 0};\n\nint find(int i, int total) {\n    if (total == 7) {\n        return 1;\n    }\n    if (i == 3 || total > 7) {\n        return 0;\n    }\n    chosen[i] = 1;\n    if (find(i + 1, total + songs[i]) == 1) {\n        return 1;\n    }\n    return find(i + 1, total);\n}\n\nint main() {\n    find(0, 0);\n    for (int k = 0; k < 3; k++) {\n        if (chosen[k] == 1) {\n            std::cout << songs[k] << " ";\n        }\n    }\n    std::cout << "\\n";\n}\n',
          java: 'public class Main {\n    static int[] songs = {5, 4, 3};\n    static int[] chosen = {0, 0, 0};\n\n    static int find(int i, int total) {\n        if (total == 7) {\n            return 1;\n        }\n        if (i == 3 || total > 7) {\n            return 0;\n        }\n        chosen[i] = 1;\n        if (find(i + 1, total + songs[i]) == 1) {\n            return 1;\n        }\n        return find(i + 1, total);\n    }\n\n    public static void main(String[] args) {\n        find(0, 0);\n        for (int k = 0; k < 3; k++) {\n            if (chosen[k] == 1) {\n                System.out.print(songs[k] + " ");\n            }\n        }\n        System.out.println();\n    }\n}\n',
          python: 'songs = [5, 4, 3]\nchosen = [0, 0, 0]\n\ndef find(i, total):\n    if total == 7:\n        return 1\n    if i == 3 or total > 7:\n        return 0\n    chosen[i] = 1\n    if find(i + 1, total + songs[i]) == 1:\n        return 1\n    return find(i + 1, total)\n\nfind(0, 0)\nfor k in range(3):\n    if chosen[k] == 1:\n        print(songs[k], end=" ")\nprint()\n',
        },
        output: '5 4 3',
      },
      {
        kind: '程式效能分析',
        prompt: '這個版本不剪枝：4 首歌每一種挑法都走到底，才看加起來是不是 7 分鐘；calls 數 walk 被呼叫了幾次。下面這段程式印出的 calls 是多少？',
        code: {
          c: `int songs[] = {5, 4, 3, 2};
int calls = 0;
int ways = 0;

void walk(int i, int total) {
    calls += 1;
    if (i == 4) {
        if (total == 7) {
            ways += 1;
        }
        return;
    }
    walk(i + 1, total + songs[i]);
    walk(i + 1, total);
}

walk(0, 0);
printf("%d\\n", calls);`,
          cpp: `std::vector<int> songs = {5, 4, 3, 2};
int calls = 0;
int ways = 0;

void walk(int i, int total) {
    calls += 1;
    if (i == 4) {
        if (total == 7) {
            ways += 1;
        }
        return;
    }
    walk(i + 1, total + songs[i]);
    walk(i + 1, total);
}

walk(0, 0);
std::cout << calls << "\\n";`,
          java: `static int[] songs = {5, 4, 3, 2};
static int calls = 0;
static int ways = 0;

static void walk(int i, int total) {
    calls += 1;
    if (i == 4) {
        if (total == 7) {
            ways += 1;
        }
        return;
    }
    walk(i + 1, total + songs[i]);
    walk(i + 1, total);
}

walk(0, 0);
System.out.println(calls);`,
          python: `songs = [5, 4, 3, 2]
calls = 0
ways = 0

def walk(i, total):
    global calls, ways
    calls += 1
    if i == 4:
        if total == 7:
            ways += 1
        return
    walk(i + 1, total + songs[i])
    walk(i + 1, total)

walk(0, 0)
print(calls)`,
        },
        options: ['16', '15', '31', '24'],
        answer: 2,
        why: '沒有剪枝，每一次呼叫（還沒到底的）都會再呼叫兩次：第一層 1 次，往下是 2、4、8、16 次，加起來 1 + 2 + 4 + 8 + 16 = 31 次。16 是挑法的數目 2⁴，只數了最底下那一層，上面做選擇的每一層也都是一次呼叫；15 是最底層以外的 1 + 2 + 4 + 8，漏了走到底的那 16 次；24 是 4! = 4 × 3 × 2 × 1，那是 4 個人排一排的排法，這一題每首歌只有選和不選兩條路。',
        program: {
          c: '#include <stdio.h>\nint songs[] = {5, 4, 3, 2};\nint calls = 0;\nint ways = 0;\n\nvoid walk(int i, int total) {\n    calls += 1;\n    if (i == 4) {\n        if (total == 7) {\n            ways += 1;\n        }\n        return;\n    }\n    walk(i + 1, total + songs[i]);\n    walk(i + 1, total);\n}\n\nint main(void) {\n    walk(0, 0);\n    printf("%d\\n", calls);\n    return 0;\n}\n',
          cpp: '#include <iostream>\n#include <vector>\nstd::vector<int> songs = {5, 4, 3, 2};\nint calls = 0;\nint ways = 0;\n\nvoid walk(int i, int total) {\n    calls += 1;\n    if (i == 4) {\n        if (total == 7) {\n            ways += 1;\n        }\n        return;\n    }\n    walk(i + 1, total + songs[i]);\n    walk(i + 1, total);\n}\n\nint main() {\n    walk(0, 0);\n    std::cout << calls << "\\n";\n}\n',
          java: 'public class Main {\n    static int[] songs = {5, 4, 3, 2};\n    static int calls = 0;\n    static int ways = 0;\n\n    static void walk(int i, int total) {\n        calls += 1;\n        if (i == 4) {\n            if (total == 7) {\n                ways += 1;\n            }\n            return;\n        }\n        walk(i + 1, total + songs[i]);\n        walk(i + 1, total);\n    }\n\n    public static void main(String[] args) {\n        walk(0, 0);\n        System.out.println(calls);\n    }\n}\n',
          python: 'songs = [5, 4, 3, 2]\ncalls = 0\nways = 0\n\ndef walk(i, total):\n    global calls, ways\n    calls += 1\n    if i == 4:\n        if total == 7:\n            ways += 1\n        return\n    walk(i + 1, total + songs[i])\n    walk(i + 1, total)\n\nwalk(0, 0)\nprint(calls)\n',
        },
        output: '31',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      '排列型的回溯：6 個人坐一排、同一家的不坐隔壁，一個位置一個位置放人，used 陣列記誰坐下了；放下去隔壁是同一家就換人，後面坐不下去就請剛坐下的人起來（used 改回來）。6 個人有 720 種坐法，每放一個就檢查，不用排完整排才知道不行。',
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'backtracking', page);
})(typeof window !== 'undefined' ? window : globalThis);
