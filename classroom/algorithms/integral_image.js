// classroom/algorithms/integral_image.js — 演算法經典應用「積分影像」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  // 圖解和實作共用的 4 × 5 小圖，和圖解要算的那一塊（列、行從 1 數）
  const IMG = [[3, 1, 4, 1, 5], [2, 6, 0, 3, 2], [1, 4, 2, 7, 1], [5, 0, 3, 2, 4]];
  const BLOCK = { r1: 2, c1: 2, r2: 3, c2: 4 };
  const page = {
    layout: 'program',
    analogy: '相機對準人，臉上馬上跳出一個對焦框。早期的做法，是在畫面上檢查幾萬個大大小小的方框，比較每個框裡哪一塊亮、哪一塊暗，看像不像一張臉。每個框都把裡面的像素一格一格加起來，來得及嗎？',
    // 複習：一維的前綴和、照片是二維陣列，框一多就加不完；quote 是這頁的核心想法
    review: [
      { text: '前綴和把一排數字「從頭加到這裡」先存好，任何一段都是兩個數相減。', see: 'prefix_sum' },
      { text: '照片是一格一格的二維陣列，一個 100 × 100 的框有一萬個像素，幾萬個框就是幾億次加法。', see: 'programming/arrays' },
      { quote: '每一格存「從左上角到這一格」整塊的總和，任何一塊長方形，用四個角的數字就算得出來。' },
    ],
    summary: '來得及：先花一趟把每一格「左上角到這裡」的總和算好，之後每個框不管多大，都是四個數加加減減。下次碰到格子資料要一直問某一塊的總和，像地圖上框一區的人口，你就知道：先做一張從左上角累計的表。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '修圖的模糊和馬賽克：每個像素換成周圍一塊的平均。框開得再大，每個像素都只要四個數。',
      '報表：一張「每家分店 × 每一天」的營業額表，問某幾家店在某幾天的總和。',
      '遊戲地圖：框一塊區域，問裡面有多少資源。',
      'APCS 實作題：二維陣列裡要問很多次某一塊長方形的總和。',
    ],
    concept: [
      { text: '積分影像（integral image）就是二維的前綴和，也叫 summed-area table：total[i][j] 存原圖左上角到第 i 列第 j 行這一整塊的總和。', see: 'prefix_sum' },
      '建表：total[i][j] = 這一格的值 + total[i − 1][j] + total[i][j − 1] − total[i − 1][j − 1]。上面那一塊加左邊那一塊，左上角重疊的地方被加了兩次，要扣掉一次。從左上往右下，每一格只算一次。',
      '問一塊（第 r1 到 r2 列、第 c1 到 c2 行）：total[r2][c2] − total[r1 − 1][c2] − total[r2][c1 − 1] + total[r1 − 1][c1 − 1]。右下角那一大塊，減掉上面、減掉左邊，左上角被減了兩次，加回來一次。',
      '表比原圖多開一列、一行，第 0 列和第 0 行全部放 0。這樣貼著邊的那幾塊不用另外處理，跟一維前綴和最前面多放一個 0 是同一招。',
      '這張表 1984 年就出現在電腦繪圖的論文裡（Franklin Crow）；2001 年 Paul Viola 和 Michael Jones 拿它做即時的人臉偵測，叫它 integral image，名字才傳開。',
    ],
    traps: [
      { wrong: '問一塊的總和，右下角減左上角兩個數就好', right: '要四個數。只減左上角那一格，上面一整條和左邊一整條都還留在裡面。' },
      { wrong: '建表的時候，加上面那格和左邊那格就好', right: '上面那塊和左邊那塊在左上角重疊，那一塊被加了兩次，要扣掉 total[i − 1][j − 1]（試試看第二題）。' },
      { wrong: '上面要減的是 total[r1][c2]', right: '是 total[r1 − 1][c2]。要的那一塊包含第 r1 列，該扣掉的是它上面的列。差一格，整列就不見了。' },
      { wrong: '原圖改了一格，表也只要改那一格', right: '那一格右下方的每一格都把它算在裡面，全部要重算。資料會一直改的話，這張表不合適。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{r}}、{{c}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '下面兩列', values: { r: 1, c: 0 } }, { label: '右下 2 × 2', values: { r: 1, c: 1 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int img[3][3] = {{2, 1, 3}, {0, 4, 1}, {5, 2, 2}};
    int total[4][4] = {{0, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 0, 0}};
    for (int i = 1; i < 4; i++) {
        for (int j = 1; j < 4; j++) {
            total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1] - total[i - 1][j - 1];
        }
    }
    int answer = total[3][3] - total[{{r}}][3] - total[3][{{c}}] + total[{{r}}][{{c}}];
    printf("%d\\n", answer);
    return 0;
}
`,
        cpp: `#include <iostream>

int main() {
    int img[3][3] = {{2, 1, 3}, {0, 4, 1}, {5, 2, 2}};
    int total[4][4] = {{0, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 0, 0}};
    for (int i = 1; i < 4; i++) {
        for (int j = 1; j < 4; j++) {
            total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1] - total[i - 1][j - 1];
        }
    }
    int answer = total[3][3] - total[{{r}}][3] - total[3][{{c}}] + total[{{r}}][{{c}}];
    std::cout << answer << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[][] img = {{2, 1, 3}, {0, 4, 1}, {5, 2, 2}};
        int[][] total = {{0, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 0, 0}, {0, 0, 0, 0}};
        for (int i = 1; i < 4; i++) {
            for (int j = 1; j < 4; j++) {
                total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1] - total[i - 1][j - 1];
            }
        }
        int answer = total[3][3] - total[{{r}}][3] - total[3][{{c}}] + total[{{r}}][{{c}}];
        System.out.println(answer);
    }
}
`,
        python: `img = [[2, 1, 3], [0, 4, 1], [5, 2, 2]]
total = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
for i in range(1, 4):
    for j in range(1, 4):
        total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1] - total[i - 1][j - 1]
answer = total[3][3] - total[{{r}}][3] - total[3][{{c}}] + total[{{r}}][{{c}}]
print(answer)
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 11, 7: 12 },
        cpp: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 11, 7: 12 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 10, 7: 11 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "下面兩列": [
        {"line":1,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]]},"out":""},
        {"line":2,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]},"out":""},
        {"line":3,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],"i":1},"out":"","cond":true},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],"i":1,"j":1},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,0,0],[0,0,0,0],[0,0,0,0]],"i":1,"j":1},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,0,0],[0,0,0,0],[0,0,0,0]],"i":1,"j":2},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,0],[0,0,0,0],[0,0,0,0]],"i":1,"j":2},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,0],[0,0,0,0],[0,0,0,0]],"i":1,"j":3},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,0,0,0],[0,0,0,0]],"i":1,"j":3},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,0,0,0],[0,0,0,0]],"i":1,"j":3},"out":"","cond":false},
        {"line":3,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,0,0,0],[0,0,0,0]],"i":2,"j":3},"out":"","cond":true},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,0,0,0],[0,0,0,0]],"i":2,"j":1},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,0,0],[0,0,0,0]],"i":2,"j":1},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,0,0],[0,0,0,0]],"i":2,"j":2},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,0],[0,0,0,0]],"i":2,"j":2},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,0],[0,0,0,0]],"i":2,"j":3},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,0,0,0]],"i":2,"j":3},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,0,0,0]],"i":2,"j":3},"out":"","cond":false},
        {"line":3,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,0,0,0]],"i":3,"j":3},"out":"","cond":true},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,0,0,0]],"i":3,"j":1},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,0,0]],"i":3,"j":1},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,0,0]],"i":3,"j":2},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,0]],"i":3,"j":2},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,0]],"i":3,"j":3},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,20]],"i":3,"j":3},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,20]],"i":3,"j":3},"out":"","cond":false},
        {"line":3,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,20]],"i":3,"j":3},"out":"","cond":false},
        {"line":6,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,20]],"i":3,"j":3,"answer":14},"out":""},
        {"line":7,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,20]],"i":3,"j":3,"answer":14},"out":"14\n"},
      ],
      "右下 2 × 2": [
        {"line":1,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]]},"out":""},
        {"line":2,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]},"out":""},
        {"line":3,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],"i":1},"out":"","cond":true},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],"i":1,"j":1},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,0,0],[0,0,0,0],[0,0,0,0]],"i":1,"j":1},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,0,0],[0,0,0,0],[0,0,0,0]],"i":1,"j":2},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,0],[0,0,0,0],[0,0,0,0]],"i":1,"j":2},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,0],[0,0,0,0],[0,0,0,0]],"i":1,"j":3},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,0,0,0],[0,0,0,0]],"i":1,"j":3},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,0,0,0],[0,0,0,0]],"i":1,"j":3},"out":"","cond":false},
        {"line":3,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,0,0,0],[0,0,0,0]],"i":2,"j":3},"out":"","cond":true},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,0,0,0],[0,0,0,0]],"i":2,"j":1},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,0,0],[0,0,0,0]],"i":2,"j":1},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,0,0],[0,0,0,0]],"i":2,"j":2},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,0],[0,0,0,0]],"i":2,"j":2},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,0],[0,0,0,0]],"i":2,"j":3},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,0,0,0]],"i":2,"j":3},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,0,0,0]],"i":2,"j":3},"out":"","cond":false},
        {"line":3,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,0,0,0]],"i":3,"j":3},"out":"","cond":true},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,0,0,0]],"i":3,"j":1},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,0,0]],"i":3,"j":1},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,0,0]],"i":3,"j":2},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,0]],"i":3,"j":2},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,0]],"i":3,"j":3},"out":"","cond":true},
        {"line":5,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,20]],"i":3,"j":3},"out":""},
        {"line":4,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,20]],"i":3,"j":3},"out":"","cond":false},
        {"line":3,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,20]],"i":3,"j":3},"out":"","cond":false},
        {"line":6,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,20]],"i":3,"j":3,"answer":9},"out":""},
        {"line":7,"vars":{"img":[[2,1,3],[0,4,1],[5,2,2]],"total":[[0,0,0,0],[0,2,3,6],[0,2,7,11],[0,7,14,20]],"i":3,"j":3,"answer":9},"out":"9\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：上面是 4 × 5 的小圖，要的那一塊塗黃；下面四張小圖是累計表上的四塊（藍色），右下角那一大塊、減上面、減左邊、加回左上角
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const PART = '#cfe8ff';   // 四張小圖裡，那一張講的那一塊
      const { r1, c1, r2, c2 } = BLOCK;
      const rows = IMG.length, cols = IMG[0].length;
      // 左上角到第 i 列第 j 行的總和
      const total = (i, j) => IMG.slice(0, i).reduce((sum, row) => sum + row.slice(0, j).reduce((a, b) => a + b, 0), 0);
      const s = svgEl(320, 266), rc = rough.svg(s);
      const box = { stroke: INK, strokeWidth: 1.3, roughness: 0.9, fillStyle: 'solid' };
      const thin = { stroke: INK, strokeWidth: 0.7, roughness: 0.4 };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const inBlock = (i, j) => i >= r1 && i <= r2 && j >= c1 && j <= c2;

      label(160, 12, `要算第 ${r1}～${r2} 列、第 ${c1}～${c2} 行那一塊`, 12, true);
      const W = 30, H = 24, LEFT = 85, TOP = 38;
      IMG.forEach((row, i) => {
        label(LEFT - 10, TOP + i * H + H / 2, String(i + 1), 11, true);
        row.forEach((v, j) => {
          if (i === 0) label(LEFT + j * W + W / 2, TOP - 8, String(j + 1), 11, true);
          s.append(rc.rectangle(LEFT + j * W, TOP + i * H, W, H, { ...box, seed: 20 + i * cols + j, fill: inBlock(i + 1, j + 1) ? NEW : FILL }));
          label(LEFT + j * W + W / 2, TOP + i * H + H / 2, String(v), 14);
        });
      });

      // 四張小圖：每張是從左上角到 [列, 行] 的一塊
      const CELL = 11, PANEL_TOP = 158, STEP = 83, FIRST = 8;
      const parts = [['右下角', r2, c2], ['上面', r1 - 1, c2], ['左邊', r2, c1 - 1], ['左上角', r1 - 1, c1 - 1]];
      parts.forEach(([name, i, j], k) => {
        const x = FIRST + k * STEP, mid = x + cols * CELL / 2;
        const cellBox = (fromRow, fromCol, toRow, toCol, fill, seed) =>
          s.append(rc.rectangle(x + (fromCol - 1) * CELL, PANEL_TOP + (fromRow - 1) * CELL, (toCol - fromCol + 1) * CELL, (toRow - fromRow + 1) * CELL, { ...thin, seed, fill, fillStyle: 'solid' }));
        cellBox(1, 1, rows, cols, FILL, 50 + k * 10);
        cellBox(1, 1, i, j, PART, 51 + k * 10);
        cellBox(r1, c1, r2, c2, NEW, 52 + k * 10);
        for (let c = 1; c < cols; c++) s.append(rc.line(x + c * CELL, PANEL_TOP, x + c * CELL, PANEL_TOP + rows * CELL, { ...thin, seed: 100 + k * 10 + c }));
        for (let r = 1; r < rows; r++) s.append(rc.line(x, PANEL_TOP + r * CELL, x + cols * CELL, PANEL_TOP + r * CELL, { ...thin, seed: 140 + k * 10 + r }));
        label(mid, PANEL_TOP - 10, name, 11, true);
        label(mid, PANEL_TOP + rows * CELL + 12, `total[${i}][${j}]`, 10, true);
        label(mid, PANEL_TOP + rows * CELL + 28, String(total(i, j)), 14);
        if (k > 0) label(x - (STEP - cols * CELL) / 2, PANEL_TOP + rows * CELL / 2, k === 3 ? '+' : '−', 16);
      });
      const [big, up, left, corner] = parts.map(([, i, j]) => total(i, j));
      label(160, 252, `${big} − ${up} − ${left} + ${corner} = ${big - up - left + corner}`, 13);
      return s;
    },
    code: {
      c: `#include <stdio.h>

#define ROWS 4
#define COLS 5

// 建累計表：total[i][j] 是原圖左上角到第 i 列第 j 行（從 1 數）這一塊的總和，第 0 列和第 0 行都是 0
void build_total(int img[ROWS][COLS], int total[ROWS + 1][COLS + 1]) {
    for (int i = 0; i <= ROWS; i++) {
        for (int j = 0; j <= COLS; j++) {
            total[i][j] = 0;
        }
    }
    for (int i = 1; i <= ROWS; i++) {
        for (int j = 1; j <= COLS; j++) {
            // 這一格 + 上面那塊 + 左邊那塊 - 重疊的左上角
            total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1] - total[i - 1][j - 1];
        }
    }
}

// 第 r1 到 r2 列、第 c1 到 c2 行（從 1 數）這一塊的總和
int region_sum(int total[ROWS + 1][COLS + 1], int r1, int c1, int r2, int c2) {
    return total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1];
}

int main(void) {
    int img[ROWS][COLS] = {{3, 1, 4, 1, 5}, {2, 6, 0, 3, 2}, {1, 4, 2, 7, 1}, {5, 0, 3, 2, 4}};
    int total[ROWS + 1][COLS + 1];
    build_total(img, total);
    printf("%d %d\\n", region_sum(total, 2, 2, 3, 4), region_sum(total, 1, 1, 2, 3));
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// 建累計表：total[i][j] 是原圖左上角到第 i 列第 j 行（從 1 數）這一塊的總和，第 0 列和第 0 行都是 0
std::vector<std::vector<int>> build_total(const std::vector<std::vector<int>>& img) {
    int rows = img.size(), cols = img[0].size();
    std::vector<std::vector<int>> total(rows + 1, std::vector<int>(cols + 1, 0));
    for (int i = 1; i <= rows; i++) {
        for (int j = 1; j <= cols; j++) {
            // 這一格 + 上面那塊 + 左邊那塊 - 重疊的左上角
            total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1] - total[i - 1][j - 1];
        }
    }
    return total;
}

// 第 r1 到 r2 列、第 c1 到 c2 行（從 1 數）這一塊的總和
int region_sum(const std::vector<std::vector<int>>& total, int r1, int c1, int r2, int c2) {
    return total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1];
}

int main() {
    std::vector<std::vector<int>> img = {{3, 1, 4, 1, 5}, {2, 6, 0, 3, 2}, {1, 4, 2, 7, 1}, {5, 0, 3, 2, 4}};
    std::vector<std::vector<int>> total = build_total(img);
    std::cout << region_sum(total, 2, 2, 3, 4) << " " << region_sum(total, 1, 1, 2, 3) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 建累計表：total[i][j] 是原圖左上角到第 i 列第 j 行（從 1 數）這一塊的總和，第 0 列和第 0 行都是 0
    static int[][] buildTotal(int[][] img) {
        int rows = img.length, cols = img[0].length;
        int[][] total = new int[rows + 1][cols + 1];
        for (int i = 1; i <= rows; i++) {
            for (int j = 1; j <= cols; j++) {
                // 這一格 + 上面那塊 + 左邊那塊 - 重疊的左上角
                total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1] - total[i - 1][j - 1];
            }
        }
        return total;
    }

    // 第 r1 到 r2 列、第 c1 到 c2 行（從 1 數）這一塊的總和
    static int regionSum(int[][] total, int r1, int c1, int r2, int c2) {
        return total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1];
    }

    public static void main(String[] args) {
        int[][] img = {{3, 1, 4, 1, 5}, {2, 6, 0, 3, 2}, {1, 4, 2, 7, 1}, {5, 0, 3, 2, 4}};
        int[][] total = buildTotal(img);
        System.out.println(regionSum(total, 2, 2, 3, 4) + " " + regionSum(total, 1, 1, 2, 3));
    }
}
`,
      python: `def build_total(img):   # total[i][j] 是原圖左上角到第 i 列第 j 行（從 1 數）這一塊的總和，第 0 列和第 0 行都是 0
    rows, cols = len(img), len(img[0])
    total = [[0] * (cols + 1) for _ in range(rows + 1)]
    for i in range(1, rows + 1):
        for j in range(1, cols + 1):
            # 這一格 + 上面那塊 + 左邊那塊 - 重疊的左上角
            total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1] - total[i - 1][j - 1]
    return total


def region_sum(total, r1, c1, r2, c2):   # 第 r1 到 r2 列、第 c1 到 c2 行（從 1 數）這一塊的總和
    return total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1]


img = [[3, 1, 4, 1, 5], [2, 6, 0, 3, 2], [1, 4, 2, 7, 1], [5, 0, 3, 2, 4]]
total = build_total(img)
print(region_sum(total, 2, 2, 3, 4), region_sum(total, 1, 1, 2, 3))
`,
      output: '22 16',
    },
    // 跑幾步：一格一格加和先建累計表比一比
    cost: {
      rows: [
        ['一格一格加：一塊 h × w 格', 'h × w 次加法，O(h × w)'],
        ['建表：每格一次', 'O(列 × 行)，只做一次'],
        ['之後每問一塊：4 個數', 'O(1)'],
      ],
      note: { text: '100 × 100 的框一格一格加是一萬次，查表是 4 次。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '一張 3 × 3 的小圖是 1 到 9 照順序排（第一列 1、2、3），total 是照這一頁的方法建好的累計表。下面這段程式印出什麼？',
        code: {
          c: `int total[4][4] = {{0, 0, 0, 0}, {0, 1, 3, 6}, {0, 5, 12, 21}, {0, 12, 27, 45}};
int r1 = 2, c1 = 2, r2 = 3, c2 = 3;
printf("%d\\n", total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1]);`,
          cpp: `int total[4][4] = {{0, 0, 0, 0}, {0, 1, 3, 6}, {0, 5, 12, 21}, {0, 12, 27, 45}};
int r1 = 2, c1 = 2, r2 = 3, c2 = 3;
std::cout << total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1] << "\\n";`,
          java: `int[][] total = {{0, 0, 0, 0}, {0, 1, 3, 6}, {0, 5, 12, 21}, {0, 12, 27, 45}};
int r1 = 2, c1 = 2, r2 = 3, c2 = 3;
System.out.println(total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1]);`,
          python: `total = [[0, 0, 0, 0], [0, 1, 3, 6], [0, 5, 12, 21], [0, 12, 27, 45]]
r1, c1, r2, c2 = 2, 2, 3, 3
print(total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1])`,
        },
        options: ['44', '27', '28', '9'],
        answer: 2,
        why: '四個數是 total[3][3] = 45、total[1][3] = 6、total[3][1] = 12、total[1][1] = 1，45 − 6 − 12 + 1 = 28，也就是第 2～3 列、第 2～3 行那一塊：5 + 6 + 8 + 9。44 是只用兩個數，45 − 1：上面一整條和左邊一整條都還留在裡面。27 是忘了把左上角加回來，45 − 6 − 12：左上角那格 1 被扣了兩次。9 是把 r1 − 1、c1 − 1 看成 r1、c1，45 − 21 − 27 + 12：第 2 列和第 2 行也被扣掉，只剩右下角那一格。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int total[4][4] = {{0, 0, 0, 0}, {0, 1, 3, 6}, {0, 5, 12, 21}, {0, 12, 27, 45}};
    int r1 = 2, c1 = 2, r2 = 3, c2 = 3;
    printf("%d\\n", total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1]);
    return 0;
}
`,
          cpp: `#include <iostream>
int main() {
    int total[4][4] = {{0, 0, 0, 0}, {0, 1, 3, 6}, {0, 5, 12, 21}, {0, 12, 27, 45}};
    int r1 = 2, c1 = 2, r2 = 3, c2 = 3;
    std::cout << total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1] << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[][] total = {{0, 0, 0, 0}, {0, 1, 3, 6}, {0, 5, 12, 21}, {0, 12, 27, 45}};
        int r1 = 2, c1 = 2, r2 = 3, c2 = 3;
        System.out.println(total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1]);
    }
}
`,
          python: `total = [[0, 0, 0, 0], [0, 1, 3, 6], [0, 5, 12, 21], [0, 12, 27, 45]]
r1, c1, r2, c2 = 2, 2, 3, 3
print(total[r2][c2] - total[r1 - 1][c2] - total[r2][c1 - 1] + total[r1 - 1][c1 - 1])
`,
        },
        output: '28',
      },
      {
        kind: '程式測試與除錯',
        prompt: '一張 2 × 2 的小圖，四格是 1、2、3、4，全部加起來是 10。下面這段程式建好累計表，印出右下角那一格，卻印出 11。要怎麼改？',
        code: {
          c: `int img[2][2] = {{1, 2}, {3, 4}};
int total[3][3] = {{0, 0, 0}, {0, 0, 0}, {0, 0, 0}};
for (int i = 1; i < 3; i++) {
    for (int j = 1; j < 3; j++) {
        total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1];
    }
}
printf("%d\\n", total[2][2]);`,
          cpp: `int img[2][2] = {{1, 2}, {3, 4}};
int total[3][3] = {{0, 0, 0}, {0, 0, 0}, {0, 0, 0}};
for (int i = 1; i < 3; i++) {
    for (int j = 1; j < 3; j++) {
        total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1];
    }
}
std::cout << total[2][2] << "\\n";`,
          java: `int[][] img = {{1, 2}, {3, 4}};
int[][] total = {{0, 0, 0}, {0, 0, 0}, {0, 0, 0}};
for (int i = 1; i < 3; i++) {
    for (int j = 1; j < 3; j++) {
        total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1];
    }
}
System.out.println(total[2][2]);`,
          python: `img = [[1, 2], [3, 4]]
total = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
for i in range(1, 3):
    for j in range(1, 3):
        total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1]
print(total[2][2])`,
        },
        options: ['算 total[i][j] 那一行，最後再加上 total[i - 1][j - 1]', '算 total[i][j] 那一行，最後再減掉 total[i - 1][j - 1]', '把 total[i - 1][j] 拿掉，只加左邊那一格', '把 total[i - 1][j] 換成 total[i - 1][j - 1]'],
        answer: 1,
        why: '算到右下角的時候，上面那格是 3（1 + 2）、左邊那格是 4（1 + 3），兩個都把左上角的 1 算進去了，所以 4 + 3 + 4 = 11，多了一個 1。把重疊的 total[i − 1][j − 1] 減掉一次，就是 10。再加一次的話，左上角變成算了三次，印出 12。把上面那格拿掉，每一格只剩自己這一列的累計，印出 7（3 + 4）。把上面那格換成左上角那格，正上方的 2 就沒有人加，印出 8。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int img[2][2] = {{1, 2}, {3, 4}};
    int total[3][3] = {{0, 0, 0}, {0, 0, 0}, {0, 0, 0}};
    for (int i = 1; i < 3; i++) {
        for (int j = 1; j < 3; j++) {
            total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1];
        }
    }
    printf("%d\\n", total[2][2]);
    return 0;
}
`,
          cpp: `#include <iostream>
int main() {
    int img[2][2] = {{1, 2}, {3, 4}};
    int total[3][3] = {{0, 0, 0}, {0, 0, 0}, {0, 0, 0}};
    for (int i = 1; i < 3; i++) {
        for (int j = 1; j < 3; j++) {
            total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1];
        }
    }
    std::cout << total[2][2] << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[][] img = {{1, 2}, {3, 4}};
        int[][] total = {{0, 0, 0}, {0, 0, 0}, {0, 0, 0}};
        for (int i = 1; i < 3; i++) {
            for (int j = 1; j < 3; j++) {
                total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1];
            }
        }
        System.out.println(total[2][2]);
    }
}
`,
          python: `img = [[1, 2], [3, 4]]
total = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
for i in range(1, 3):
    for j in range(1, 3):
        total[i][j] = img[i - 1][j - 1] + total[i - 1][j] + total[i][j - 1]
print(total[2][2])
`,
        },
        output: '11',
      },
      {
        kind: '程式效能分析',
        prompt: '一張 1000 × 1000 的圖，要問 1000 次 100 × 100 的框。下面這段程式數兩種做法各做幾次加減法：slow 是每個框一格一格加，fast 是先建累計表（每格 3 次加減）、再每個框查一次（3 次加減）。它印出什麼？',
        code: {
          c: `int n = 1000, q = 1000, h = 100, w = 100;
int slow = 0;
for (int k = 0; k < q; k++) {
    for (int i = 0; i < h; i++) {
        for (int j = 0; j < w; j++) {
            slow += 1;
        }
    }
}
int fast = 0;
for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= n; j++) {
        fast += 3;
    }
}
for (int k = 0; k < q; k++) {
    fast += 3;
}
printf("%d %d\\n", slow, fast);`,
          cpp: `int n = 1000, q = 1000, h = 100, w = 100;
int slow = 0;
for (int k = 0; k < q; k++) {
    for (int i = 0; i < h; i++) {
        for (int j = 0; j < w; j++) {
            slow += 1;
        }
    }
}
int fast = 0;
for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= n; j++) {
        fast += 3;
    }
}
for (int k = 0; k < q; k++) {
    fast += 3;
}
std::cout << slow << " " << fast << "\\n";`,
          java: `int n = 1000, q = 1000, h = 100, w = 100;
int slow = 0;
for (int k = 0; k < q; k++) {
    for (int i = 0; i < h; i++) {
        for (int j = 0; j < w; j++) {
            slow += 1;
        }
    }
}
int fast = 0;
for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= n; j++) {
        fast += 3;
    }
}
for (int k = 0; k < q; k++) {
    fast += 3;
}
System.out.println(slow + " " + fast);`,
          python: `n, q, h, w = 1000, 1000, 100, 100
slow = 0
for k in range(q):
    for i in range(h):
        for j in range(w):
            slow += 1
fast = 0
for i in range(1, n + 1):
    for j in range(1, n + 1):
        fast += 3
for k in range(q):
    fast += 3
print(slow, fast)`,
        },
        options: ['10000000 3000', '100000 3003000', '10000000 1001000', '10000000 3003000'],
        answer: 3,
        why: '一格一格加：一個框 100 × 100 = 10000 格，1000 個框就是 10000000 次。累計表：建表 1000 × 1000 = 1000000 格，每格 3 次加減是 3000000；之後 1000 個框各 3 次是 3000，合起來 3003000。3000 是只數了查表、忘了建表那一趟。100000 是把一個框當成 100 格，只數了一邊，少乘一個 100。1001000 是建表和查表都當成一次加減：格數和框數沒錯，可是每格、每個框都是四個數、三次加減。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int n = 1000, q = 1000, h = 100, w = 100;
    int slow = 0;
    for (int k = 0; k < q; k++) {
        for (int i = 0; i < h; i++) {
            for (int j = 0; j < w; j++) {
                slow += 1;
            }
        }
    }
    int fast = 0;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            fast += 3;
        }
    }
    for (int k = 0; k < q; k++) {
        fast += 3;
    }
    printf("%d %d\\n", slow, fast);
    return 0;
}
`,
          cpp: `#include <iostream>
int main() {
    int n = 1000, q = 1000, h = 100, w = 100;
    int slow = 0;
    for (int k = 0; k < q; k++) {
        for (int i = 0; i < h; i++) {
            for (int j = 0; j < w; j++) {
                slow += 1;
            }
        }
    }
    int fast = 0;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            fast += 3;
        }
    }
    for (int k = 0; k < q; k++) {
        fast += 3;
    }
    std::cout << slow << " " << fast << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int n = 1000, q = 1000, h = 100, w = 100;
        int slow = 0;
        for (int k = 0; k < q; k++) {
            for (int i = 0; i < h; i++) {
                for (int j = 0; j < w; j++) {
                    slow += 1;
                }
            }
        }
        int fast = 0;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                fast += 3;
            }
        }
        for (int k = 0; k < q; k++) {
            fast += 3;
        }
        System.out.println(slow + " " + fast);
    }
}
`,
          python: `n, q, h, w = 1000, 1000, 100, 100
slow = 0
for k in range(q):
    for i in range(h):
        for j in range(w):
            slow += 1
fast = 0
for i in range(1, n + 1):
    for j in range(1, n + 1):
        fast += 3
for k in range(q):
    fast += 3
print(slow, fast)
`,
        },
        output: '10000000 3003000',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      '找總和最大的長方形：先固定上下兩列，中間每一行的總和用累計表一次拿到，問題就變成一維的「最大連續和」。',
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'integral_image', page);
})(typeof window !== 'undefined' ? window : globalThis);
