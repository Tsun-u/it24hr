// classroom/algorithms/n_queens.js — 演算法「八皇后」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '西洋棋的皇后可以橫著、直著、斜著走，走幾格都行。8 × 8 的棋盤上要放 8 個皇后，誰也吃不到誰。放得下嗎？',
    // 複習：回溯頁學過的做法，加上「一列放一個」這個觀察；quote 是這頁的核心想法
    review: [
      { text: '回溯是走一步檢查一步，不行就退回上一步。64 格裡挑 8 格有 44 億種挑法，全部列出來再檢查，等不到答案。', see: 'backtracking' },
      '先注意到一件事：同一列放兩個一定互吃，所以每一列剛好放一個。',
      { quote: '一列放一個，放下去就檢查會不會被前面的皇后吃到；整列都沒地方放，就回上一列，把那個皇后往右挪。' },
    ],
    summary: '放得下，而且有 92 種放法。不用試 44 億種：一列一列放，放下去會被吃就換一格，前後只放了 2056 次皇后就全部數完。下次碰到限制很多的擺放問題，像填數獨、排課表，你就知道：一格一格放，放不下就退回去挪前一個。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '數獨：每一格填 1 到 9，同一列、同一行、同一個九宮格不能重複。跟放皇后一樣，一格一格填，撞到了就退回去改。',
      '排課表、排考場：同一位老師同一個時段不能有兩堂課，同一間教室不能同時有兩場考試。',
      '地圖著色：相鄰的縣市要用不同的顏色，最少要幾種顏色。',
      'APCS 實作題和競賽：把棋盤換成 n × n、放 n 個皇后（n 皇后問題），是回溯的標準練習題。',
    ],
    concept: [
      '八皇后問題（eight queens puzzle）是西洋棋手 Max Bezzel 在 1848 年出的謎題。把棋盤換成 n × n、放 n 個皇后，叫 n 皇后問題。',
      '一列只放一個，所以用一個陣列就記得下整個棋盤：cols[r] 是第 r 列的皇后放在第幾行（列和行都跟陣列一樣從 0 開始數）。「同一列」從此不用檢查。',
      '檢查新皇后（第 row 列、第 col 行）會不會被前面第 k 列的皇后吃到：同一行，cols[k] 等於 col；同一條斜線，兩格之間列差幾格、行就差幾格。兩種都沒有，才安全。',
      { text: '放法：place(row) 把第 row 列從最左邊試到最右邊，安全就放下、呼叫 place(row + 1)；回來之後換下一格。row 等於 n，代表每一列都放好了，算一種。', see: 'backtracking' },
      '檢查可以更快：多用三個陣列，記每一行、每一條左斜線、每一條右斜線有沒有皇后，一格只要看三個記號。同一條右斜線上 row − col 都一樣，同一條左斜線上 row + col 都一樣。',
    ],
    traps: [
      { wrong: '要知道斜線上有沒有皇后，得沿著斜線一格一格找', right: '不用。兩格在同一條斜線上，列差幾格、行就差幾格，一個減法就知道。' },
      { wrong: '找到一組放法，這題就做完了', right: '八皇后有 92 種放法。其中很多是同一種轉個方向、翻個面，這樣算重複的話剩 12 種。' },
      { wrong: '棋盤多大都放得下', right: '2 × 2 和 3 × 3 放不下：2 × 2 的任兩格都互吃，3 × 3 最多放 2 個。1 × 1 和 4 × 4 以上才有解。' },
      { wrong: '遞迴回來之後，不用把皇后拿走', right: '只用 cols 的寫法，下一格會直接蓋掉 cols[row]，不用拿。用「這一行、這條斜線有沒有皇后」三個記號陣列的寫法，回來就要把記號改回去。', see: 'backtracking' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{c}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: 'col = 2', values: { c: 2 } }, { label: 'col = 1', values: { c: 1 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int cols[] = {1, 3, 0};
    int row = 3;
    int col = {{c}};
    int safe = 1;
    for (int k = 0; k < 3; k++) {
        int diff = cols[k] - col;
        if (diff == 0 || diff == row - k || diff == k - row) {
            safe = 0;
        }
    }
    printf("%d\\n", safe);
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> cols = {1, 3, 0};
    int row = 3;
    int col = {{c}};
    int safe = 1;
    for (int k = 0; k < 3; k++) {
        int diff = cols[k] - col;
        if (diff == 0 || diff == row - k || diff == k - row) {
            safe = 0;
        }
    }
    std::cout << safe << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] cols = {1, 3, 0};
        int row = 3;
        int col = {{c}};
        int safe = 1;
        for (int k = 0; k < 3; k++) {
            int diff = cols[k] - col;
            if (diff == 0 || diff == row - k || diff == k - row) {
                safe = 0;
            }
        }
        System.out.println(safe);
    }
}
`,
        python: `cols = [1, 3, 0]
row = 3
col = {{c}}
safe = 1
for k in range(3):
    diff = cols[k] - col
    if diff == 0 or diff == row - k or diff == k - row:
        safe = 0
print(safe)
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 14 },
        cpp: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 10, 7: 11, 8: 12, 9: 15 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 13 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "col = 2": [
        {"line":1,"vars":{"cols":[1,3,0]},"out":""},
        {"line":2,"vars":{"cols":[1,3,0],"row":3},"out":""},
        {"line":3,"vars":{"cols":[1,3,0],"row":3,"col":2},"out":""},
        {"line":4,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1},"out":""},
        {"line":5,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":0},"out":"","cond":true},
        {"line":6,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":0,"diff":-1},"out":""},
        {"line":7,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":0,"diff":-1},"out":"","cond":false},
        {"line":5,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":1,"diff":-1},"out":"","cond":true},
        {"line":6,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":1,"diff":1},"out":""},
        {"line":7,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":1,"diff":1},"out":"","cond":false},
        {"line":5,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":2,"diff":1},"out":"","cond":true},
        {"line":6,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":2,"diff":-2},"out":""},
        {"line":7,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":2,"diff":-2},"out":"","cond":false},
        {"line":5,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":2,"diff":-2},"out":"","cond":false},
        {"line":9,"vars":{"cols":[1,3,0],"row":3,"col":2,"safe":1,"k":2,"diff":-2},"out":"1\n"},
      ],
      "col = 1": [
        {"line":1,"vars":{"cols":[1,3,0]},"out":""},
        {"line":2,"vars":{"cols":[1,3,0],"row":3},"out":""},
        {"line":3,"vars":{"cols":[1,3,0],"row":3,"col":1},"out":""},
        {"line":4,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":1},"out":""},
        {"line":5,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":1,"k":0},"out":"","cond":true},
        {"line":6,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":1,"k":0,"diff":0},"out":""},
        {"line":7,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":1,"k":0,"diff":0},"out":"","cond":true},
        {"line":8,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":0,"diff":0},"out":""},
        {"line":5,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":1,"diff":0},"out":"","cond":true},
        {"line":6,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":1,"diff":2},"out":""},
        {"line":7,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":1,"diff":2},"out":"","cond":true},
        {"line":8,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":1,"diff":2},"out":""},
        {"line":5,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":2,"diff":2},"out":"","cond":true},
        {"line":6,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":2,"diff":-1},"out":""},
        {"line":7,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":2,"diff":-1},"out":"","cond":true},
        {"line":8,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":2,"diff":-1},"out":""},
        {"line":5,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":2,"diff":-1},"out":"","cond":false},
        {"line":9,"vars":{"cols":[1,3,0],"row":3,"col":1,"safe":0,"k":2,"diff":-1},"out":"0\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：4 × 4 棋盤放 4 個皇后的四個時刻，排成 2 × 2。皇后是實心圓；整列沒位置的那一列塗紅、左邊打叉；最後那組解的皇后塗黃
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      // 每張：cols[r] 是第 r 列的皇后放在第幾行，stuck 是沒位置的那一列
      const boards = [
        { cols: [0, 2], stuck: 2, note: '1. 第三列沒有位置' },
        { cols: [0, 3, 1], stuck: 3, note: '2. 挪第二列，第四列卡住' },
        { cols: [1], note: '3. 第一列改放第二格' },
        { cols: [1, 3, 0, 2], solved: true, note: '4. 一路放到底，得到一組解' },
      ];
      const s = svgEl(320, 296), rc = rough.svg(s);
      const WRONG = '#cf222e', STUCK = '#ffd7d5', EMPTY = '#ffffff';
      const CELL = 26, N = 4, LEFT = [30, 186], TOP = [28, 166];
      const label = (x, y, text, size = 11, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      label(160, 12, '4 × 4 的棋盤放 4 個皇后，一列放一個', 12, true);
      boards.forEach(({ cols, stuck, solved, note }, b) => {
        const left = LEFT[b % 2], top = TOP[Math.floor(b / 2)];
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          s.append(rc.rectangle(left + c * CELL, top + r * CELL, CELL, CELL, { stroke: INK, strokeWidth: 1.1, roughness: 0.7, fillStyle: 'solid', fill: r === stuck ? STUCK : EMPTY, seed: 100 * (b + 1) + r * N + c }));
        }
        cols.forEach((c, r) => {
          s.append(rc.circle(left + c * CELL + CELL / 2, top + r * CELL + CELL / 2, 16, { stroke: INK, strokeWidth: 1.2, roughness: 0.6, fillStyle: 'solid', fill: solved ? NEW : FILL, seed: 500 + b * 10 + r }));
        });
        if (stuck !== undefined) {
          const x = left - 11, y = top + stuck * CELL + CELL / 2;
          s.append(rc.line(x - 5, y - 5, x + 5, y + 5, { stroke: WRONG, strokeWidth: 1.8, roughness: 0.6, seed: 600 + b * 2 }));
          s.append(rc.line(x + 5, y - 5, x - 5, y + 5, { stroke: WRONG, strokeWidth: 1.8, roughness: 0.6, seed: 601 + b * 2 }));
        }
        label(left + N * CELL / 2, top + N * CELL + 14, note);
      });
      return s;
    },
    code: {
      c: `#include <stdio.h>

#define MAX_N 12

// 第 row 列、第 col 行會不會被前面的皇后吃到；cols[k] 是第 k 列的皇后放在第幾行
int is_safe(const int cols[], int row, int col) {
    for (int k = 0; k < row; k++) {
        int diff = cols[k] - col;
        if (diff == 0 || diff == row - k || diff == k - row) {   // 同一行，或同一條斜線
            return 0;
        }
    }
    return 1;
}

// 第 0 到 row - 1 列放好了，回傳剩下的列有幾種放法
int place(int cols[], int row, int n) {
    if (row == n) {
        return 1;                   // 每一列都放好了，算一種
    }
    int ways = 0;
    for (int col = 0; col < n; col++) {
        if (is_safe(cols, row, col)) {
            cols[row] = col;        // 放下去；換下一格的時候會直接蓋掉，不用拿走
            ways += place(cols, row + 1, n);
        }
    }
    return ways;
}

// n × n 的棋盤放 n 個皇后有幾種放法（n 最大到 MAX_N）
int count_queens(int n) {
    int cols[MAX_N] = {0};
    return place(cols, 0, n);
}

int main(void) {
    printf("%d %d\\n", count_queens(6), count_queens(8));
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// 第 row 列、第 col 行會不會被前面的皇后吃到；cols[k] 是第 k 列的皇后放在第幾行
bool is_safe(const std::vector<int>& cols, int row, int col) {
    for (int k = 0; k < row; k++) {
        int diff = cols[k] - col;
        if (diff == 0 || diff == row - k || diff == k - row) {   // 同一行，或同一條斜線
            return false;
        }
    }
    return true;
}

// 第 0 到 row - 1 列放好了，回傳剩下的列有幾種放法
int place(std::vector<int>& cols, int row, int n) {
    if (row == n) {
        return 1;                   // 每一列都放好了，算一種
    }
    int ways = 0;
    for (int col = 0; col < n; col++) {
        if (is_safe(cols, row, col)) {
            cols[row] = col;        // 放下去；換下一格的時候會直接蓋掉，不用拿走
            ways += place(cols, row + 1, n);
        }
    }
    return ways;
}

// n × n 的棋盤放 n 個皇后有幾種放法
int count_queens(int n) {
    std::vector<int> cols(n, 0);
    return place(cols, 0, n);
}

int main() {
    std::cout << count_queens(6) << " " << count_queens(8) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 第 row 列、第 col 行會不會被前面的皇后吃到；cols[k] 是第 k 列的皇后放在第幾行
    static boolean isSafe(int[] cols, int row, int col) {
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0 || diff == row - k || diff == k - row) {   // 同一行，或同一條斜線
                return false;
            }
        }
        return true;
    }

    // 第 0 到 row - 1 列放好了，回傳剩下的列有幾種放法
    static int place(int[] cols, int row, int n) {
        if (row == n) {
            return 1;                   // 每一列都放好了，算一種
        }
        int ways = 0;
        for (int col = 0; col < n; col++) {
            if (isSafe(cols, row, col)) {
                cols[row] = col;        // 放下去；換下一格的時候會直接蓋掉，不用拿走
                ways += place(cols, row + 1, n);
            }
        }
        return ways;
    }

    // n × n 的棋盤放 n 個皇后有幾種放法
    static int countQueens(int n) {
        return place(new int[n], 0, n);
    }

    public static void main(String[] args) {
        System.out.println(countQueens(6) + " " + countQueens(8));
    }
}
`,
      python: `def is_safe(cols, row, col):    # 第 row 列、第 col 行會不會被前面的皇后吃到；cols[k] 是第 k 列的皇后放在第幾行
    for k in range(row):
        diff = cols[k] - col
        if diff == 0 or diff == row - k or diff == k - row:   # 同一行，或同一條斜線
            return False
    return True


def place(cols, row, n):        # 第 0 到 row - 1 列放好了，回傳剩下的列有幾種放法
    if row == n:
        return 1                # 每一列都放好了，算一種
    ways = 0
    for col in range(n):
        if is_safe(cols, row, col):
            cols[row] = col     # 放下去；換下一格的時候會直接蓋掉，不用拿走
            ways += place(cols, row + 1, n)
    return ways


def count_queens(n):            # n × n 的棋盤放 n 個皇后有幾種放法
    return place([0] * n, 0, n)


print(count_queens(6), count_queens(8))
`,
      output: '4 92',
    },
    cost: {
      rows: [
        ['64 格挑 8 格再檢查', '4426165368 種'],
        ['一列放一個、不檢查', '8 的 8 次方 = 16777216 種'],
        ['回溯', '數完 92 種一共放 2056 次皇后；找到第一組只放 113 次'],
      ],
      note: { text: '回溯最壞還是跟 n! 一樣快地變大，n 到十幾就很久了。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '6 × 6 的棋盤，前三列的皇后放在第 0、2、4 行。下面這段程式數第 3 列有幾格可以放，它印出什麼？',
        code: {
          c: `int cols[] = {0, 2, 4};
int row = 3, count = 0;
for (int col = 0; col < 6; col++) {
    int safe = 1;
    for (int k = 0; k < row; k++) {
        int diff = cols[k] - col;
        if (diff == 0 || diff == row - k || diff == k - row) {
            safe = 0;
        }
    }
    count += safe;
}
printf("%d\\n", count);`,
          cpp: `std::vector<int> cols = {0, 2, 4};
int row = 3, count = 0;
for (int col = 0; col < 6; col++) {
    int safe = 1;
    for (int k = 0; k < row; k++) {
        int diff = cols[k] - col;
        if (diff == 0 || diff == row - k || diff == k - row) {
            safe = 0;
        }
    }
    count += safe;
}
std::cout << count << "\\n";`,
          java: `int[] cols = {0, 2, 4};
int row = 3, count = 0;
for (int col = 0; col < 6; col++) {
    int safe = 1;
    for (int k = 0; k < row; k++) {
        int diff = cols[k] - col;
        if (diff == 0 || diff == row - k || diff == k - row) {
            safe = 0;
        }
    }
    count += safe;
}
System.out.println(count);`,
          python: `cols = [0, 2, 4]
row, count = 3, 0
for col in range(6):
    safe = 1
    for k in range(row):
        diff = cols[k] - col
        if diff == 0 or diff == row - k or diff == k - row:
            safe = 0
    count += safe
print(count)`,
        },
        options: ['1', '2', '3', '6'],
        answer: 0,
        why: '第 0、2、4 行已經有皇后；第 3 行和第 5 行在第 2 列那個皇后（第 4 行）的斜線上，第 3 行同時也在第 0 列那個皇后的斜線上。只剩第 1 行可以放，印出 1。2 是只檢查斜線、沒檢查同一行：斜線吃得到的是第 0、3、4、5 行，會把第 1、2 行都算進去，可是第 2 行已經有皇后了。3 是只檢查同一行、沒檢查斜線：6 行扣掉有皇后的 3 行。6 是以為 safe 一直是 1：每一格都算可以放。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int cols[] = {0, 2, 4};
    int row = 3, count = 0;
    for (int col = 0; col < 6; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0 || diff == row - k || diff == k - row) {
                safe = 0;
            }
        }
        count += safe;
    }
    printf("%d\\n", count);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> cols = {0, 2, 4};
    int row = 3, count = 0;
    for (int col = 0; col < 6; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0 || diff == row - k || diff == k - row) {
                safe = 0;
            }
        }
        count += safe;
    }
    std::cout << count << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] cols = {0, 2, 4};
        int row = 3, count = 0;
        for (int col = 0; col < 6; col++) {
            int safe = 1;
            for (int k = 0; k < row; k++) {
                int diff = cols[k] - col;
                if (diff == 0 || diff == row - k || diff == k - row) {
                    safe = 0;
                }
            }
            count += safe;
        }
        System.out.println(count);
    }
}
`,
          python: `cols = [0, 2, 4]
row, count = 3, 0
for col in range(6):
    safe = 1
    for k in range(row):
        diff = cols[k] - col
        if diff == 0 or diff == row - k or diff == k - row:
            safe = 0
    count += safe
print(count)
`,
        },
        output: '1',
      },
      {
        kind: '程式測試與除錯',
        prompt: '4 × 4 的棋盤放 4 個皇后應該有 2 種放法，下面這段程式（n 是 4，從 place(0) 開始，最後印出 count）卻印出 24。要怎麼改？',
        code: {
          c: `void place(int row) {
    if (row == n) {
        count += 1;
        return;
    }
    for (int col = 0; col < n; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0) {
                safe = 0;
            }
        }
        if (safe == 1) {
            cols[row] = col;
            place(row + 1);
        }
    }
}`,
          cpp: `void place(int row) {
    if (row == n) {
        count += 1;
        return;
    }
    for (int col = 0; col < n; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0) {
                safe = 0;
            }
        }
        if (safe == 1) {
            cols[row] = col;
            place(row + 1);
        }
    }
}`,
          java: `static void place(int row) {
    if (row == n) {
        count += 1;
        return;
    }
    for (int col = 0; col < n; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0) {
                safe = 0;
            }
        }
        if (safe == 1) {
            cols[row] = col;
            place(row + 1);
        }
    }
}`,
          python: `def place(row):
    global count
    if row == n:
        count += 1
        return
    for col in range(n):
        safe = 1
        for k in range(row):
            diff = cols[k] - col
            if diff == 0:
                safe = 0
        if safe == 1:
            cols[row] = col
            place(row + 1)`,
        },
        options: [
          '條件多加一種：diff 等於 0，或 diff 等於 row - k',
          '條件多加兩種：diff 等於 0，或 diff 等於 row - k，或 diff 等於 k - row',
          '把 diff 等於 0 改成 diff 不等於 0',
          '把條件換成：diff 等於 row - k，或 diff 等於 k - row',
        ],
        answer: 1,
        why: '程式只檢查同一行，沒檢查斜線，所以每一行剛好放一個就算一種：4 × 3 × 2 × 1 = 24 種。斜線有兩個方向，前面的皇后可能在左上、也可能在右上，diff 等於 row - k 和 k - row 兩種都要檢查，補上之後印出 2。只加 row - k 是只擋掉一個方向的斜線，會印出 7。改成不等於 0 是反過來，只有跟前面的皇后同一行才放，4 個皇后排成一直線，印出 4。換成只檢查兩條斜線，同一行又沒人管了，印出來剛好還是 24，只是換成另外 24 種：裡面有同一行放了好幾個皇后的放法。',
        program: {
          c: `#include <stdio.h>
int n = 4;
int cols[4];
int count = 0;

void place(int row) {
    if (row == n) {
        count += 1;
        return;
    }
    for (int col = 0; col < n; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0) {
                safe = 0;
            }
        }
        if (safe == 1) {
            cols[row] = col;
            place(row + 1);
        }
    }
}

int main(void) {
    place(0);
    printf("%d\\n", count);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int n = 4;
std::vector<int> cols(4);
int count = 0;

void place(int row) {
    if (row == n) {
        count += 1;
        return;
    }
    for (int col = 0; col < n; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0) {
                safe = 0;
            }
        }
        if (safe == 1) {
            cols[row] = col;
            place(row + 1);
        }
    }
}

int main() {
    place(0);
    std::cout << count << "\\n";
}
`,
          java: `public class Main {
    static int n = 4;
    static int[] cols = new int[4];
    static int count = 0;

    static void place(int row) {
        if (row == n) {
            count += 1;
            return;
        }
        for (int col = 0; col < n; col++) {
            int safe = 1;
            for (int k = 0; k < row; k++) {
                int diff = cols[k] - col;
                if (diff == 0) {
                    safe = 0;
                }
            }
            if (safe == 1) {
                cols[row] = col;
                place(row + 1);
            }
        }
    }

    public static void main(String[] args) {
        place(0);
        System.out.println(count);
    }
}
`,
          python: `n = 4
cols = [0] * n
count = 0

def place(row):
    global count
    if row == n:
        count += 1
        return
    for col in range(n):
        safe = 1
        for k in range(row):
            diff = cols[k] - col
            if diff == 0:
                safe = 0
        if safe == 1:
            cols[row] = col
            place(row + 1)

place(0)
print(count)
`,
        },
        output: '24',
      },
      {
        kind: '程式效能分析',
        prompt: '下面這段程式把 4 × 4 的棋盤放 4 個皇后的放法全部數完（n 是 4，從 place(0) 開始），每放下一個皇后 placed 就加 1。最後 placed 是多少？',
        code: {
          c: `void place(int row) {
    if (row == n) {
        return;
    }
    for (int col = 0; col < n; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0 || diff == row - k || diff == k - row) {
                safe = 0;
            }
        }
        if (safe == 1) {
            cols[row] = col;
            placed += 1;
            place(row + 1);
        }
    }
}`,
          cpp: `void place(int row) {
    if (row == n) {
        return;
    }
    for (int col = 0; col < n; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0 || diff == row - k || diff == k - row) {
                safe = 0;
            }
        }
        if (safe == 1) {
            cols[row] = col;
            placed += 1;
            place(row + 1);
        }
    }
}`,
          java: `static void place(int row) {
    if (row == n) {
        return;
    }
    for (int col = 0; col < n; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0 || diff == row - k || diff == k - row) {
                safe = 0;
            }
        }
        if (safe == 1) {
            cols[row] = col;
            placed += 1;
            place(row + 1);
        }
    }
}`,
          python: `def place(row):
    global placed
    if row == n:
        return
    for col in range(n):
        safe = 1
        for k in range(row):
            diff = cols[k] - col
            if diff == 0 or diff == row - k or diff == k - row:
                safe = 0
        if safe == 1:
            cols[row] = col
            placed += 1
            place(row + 1)`,
        },
        options: ['2', '8', '16', '340'],
        answer: 2,
        why: '第一列的四格都放得下，放了 4 次；接下來第二列一共放 6 次、第三列 4 次、第四列 2 次，加起來 16 次。2 是放法有幾種，不是放了幾次皇后；最後放在第四列的那 2 次，就是那 2 種放法。8 是找到第一種放法就停下來的次數，這段程式會繼續把剩下的都試完。340 是完全不檢查的次數：每一列四格都放，4 + 16 + 64 + 256。',
        program: {
          c: `#include <stdio.h>
int n = 4;
int cols[4];
int placed = 0;

void place(int row) {
    if (row == n) {
        return;
    }
    for (int col = 0; col < n; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0 || diff == row - k || diff == k - row) {
                safe = 0;
            }
        }
        if (safe == 1) {
            cols[row] = col;
            placed += 1;
            place(row + 1);
        }
    }
}

int main(void) {
    place(0);
    printf("%d\\n", placed);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int n = 4;
std::vector<int> cols(4);
int placed = 0;

void place(int row) {
    if (row == n) {
        return;
    }
    for (int col = 0; col < n; col++) {
        int safe = 1;
        for (int k = 0; k < row; k++) {
            int diff = cols[k] - col;
            if (diff == 0 || diff == row - k || diff == k - row) {
                safe = 0;
            }
        }
        if (safe == 1) {
            cols[row] = col;
            placed += 1;
            place(row + 1);
        }
    }
}

int main() {
    place(0);
    std::cout << placed << "\\n";
}
`,
          java: `public class Main {
    static int n = 4;
    static int[] cols = new int[4];
    static int placed = 0;

    static void place(int row) {
        if (row == n) {
            return;
        }
        for (int col = 0; col < n; col++) {
            int safe = 1;
            for (int k = 0; k < row; k++) {
                int diff = cols[k] - col;
                if (diff == 0 || diff == row - k || diff == k - row) {
                    safe = 0;
                }
            }
            if (safe == 1) {
                cols[row] = col;
                placed += 1;
                place(row + 1);
            }
        }
    }

    public static void main(String[] args) {
        place(0);
        System.out.println(placed);
    }
}
`,
          python: `n = 4
cols = [0] * n
placed = 0

def place(row):
    global placed
    if row == n:
        return
    for col in range(n):
        safe = 1
        for k in range(row):
            diff = cols[k] - col
            if diff == 0 or diff == row - k or diff == k - row:
                safe = 0
        if safe == 1:
            cols[row] = col
            placed += 1
            place(row + 1)

place(0)
print(placed)
`,
        },
        output: '16',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      '核心觀念最後提到的三個記號陣列，寫起來是這樣：一個陣列記每一行有沒有皇后，一個記每一條左斜線（編號 row + col），一個記每一條右斜線（編號 row − col + n − 1）。放下去的時候把這一格的三個記號設成 1，遞迴回來再把三個改回 0；檢查一格只要看三個記號是不是都是 0，不用跑迴圈，是 O(1)。右斜線的編號要加 n − 1，因為 row − col 可能是負的，不能直接當陣列的編號：Python 會從陣列的尾巴倒著數，C 和 C++ 會讀到陣列外面，Java 會丟出例外。n × n 的棋盤兩種斜線各有 2n − 1 條，這兩個陣列要開這麼大。',
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'n_queens', page);
})(typeof window !== 'undefined' ? window : globalThis);
