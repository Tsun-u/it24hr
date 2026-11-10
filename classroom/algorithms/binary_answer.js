// classroom/algorithms/binary_answer.js — 演算法「二分搜尋答案」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '年底交換禮物，你要包 12 份，每份綁一條一樣長的緞帶。抽屜裡有四捲用剩的緞帶，長 750、620、480、390 公分，短的不能接起來用。每條最長可以剪多長？',
    // 複習：直接除算不出來，一公分一公分試又太慢；長度本身是排好的，可以拿學過的二分搜尋來用。quote 是這頁的核心想法
    review: [
      '全部加起來 2240 公分，除以 12 是 186 公分？可是照 186 公分剪，四捲各剩一段零頭，只剪得出 4 + 3 + 2 + 2 = 11 條，還差一條。答案沒辦法直接除出來。',
      { text: '反過來就容易了：給一個長度，每捲除一下就知道剪得出幾條。用迴圈從 1 公分開始一公分一公分往上試，試到 161 公分第一次不夠 12 條，答案是 160，一共試了 161 次；緞帶換成幾公里長的電纜、單位換成公釐，就要試幾百萬次。', see: 'programming/loops' },
      { text: '我們學過二分搜尋：在排好的資料裡，每看一次中間就丟掉一半。這裡沒有陣列，可是「長度」本身就是從小排到大的：短的剪得出 12 條，更短的一定也剪得出；長的剪不出，更長的一定也剪不出。', see: 'ds/searching' },
      { quote: '答案不好算，但好檢查：猜一個，檢查行不行，再決定往大的猜還是往小的猜。' },
    ],
    summary: '每條最長 160 公分。不用從 1 公分試到 161 公分：猜中間的長度，剪得出 12 條就往長的猜，剪不出就往短的猜，750 公分的範圍猜 10 次就夠。下次碰到「最多可以多少」「最少要多少」的問題，可以先問自己兩件事：猜一個答案，檢查它行不行容不容易？是不是小的都行、大到某個地方之後都不行？兩個都是，就對答案二分。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '分工：一疊照順序排好的文件要分給 3 個人校對，每個人拿連續的一段。最忙的那個人最少要看幾頁？猜一個頁數上限，從頭開始分，看 3 個人分不分得完。',
      { text: '一條路上有幾個可以裝路燈的位置，要裝 k 盞，想讓最近的兩盞盡量離遠一點。猜一個距離，從第一個位置開始，夠遠就裝，數裝不裝得下 k 盞。檢查的那一步每次都拿眼前能裝的，是貪婪法。', see: 'greedy' },
      '開根號：沒有 sqrt 可以用的時候，猜一個數，平方太大就往小的猜。答案是小數也可以二分，猜到夠準就停。',
      'APCS 實作題：題目問「最大值最小是多少」「最小值最大是多少」，多半是對答案二分。',
    ],
    concept: [
      '二分搜尋答案（binary search on answer，也叫對答案二分）是不直接算答案，改成猜一個答案、檢查它行不行，再用二分搜尋把範圍一次砍掉一半。',
      '能這樣做要有兩個條件。第一，檢查比直接算容易：給一個長度，每捲除一下、加起來，就知道夠不夠 12 條。第二，行不行是一刀切開的（單調性，monotonicity）：把 1 到 750 公分每個長度排成一列，前面一段都行、後面一段都不行，中間只有一個交界，答案就是最後一個行的。',
      '寫法：lo、hi 夾住答案可能在的範圍，一開始 lo = 1、hi = 最長那捲的長度。每次猜 mid：行，答案在 mid 或更長，lo = mid；不行，答案比 mid 短，hi = mid − 1。lo 等於 hi 的時候，那個數就是答案。',
      '找「最大的行」時，中間要取偏上的那個：mid = (lo + hi + 1) / 2。剩兩格的時候（lo = 159、hi = 160），不加 1 的 mid 永遠是 159，lo = mid 之後範圍沒有變小，迴圈停不下來。',
      '題目問「最小的行」就反過來：mid = (lo + hi) / 2，行的話 hi = mid，不行的話 lo = mid + 1。',
    ],
    traps: [
      { wrong: '對答案二分之前，要先把資料排序', right: '排好的不是資料，是答案的候選：1、2、3……公分本來就從小到大。四捲緞帶不用排序，要確認的是行不行有沒有一刀切開。' },
      { wrong: 'mid 一律寫 (lo + hi) / 2', right: '行的時候寫 lo = mid 的那種，中間要取偏上的 (lo + hi + 1) / 2；不然剩兩格時 mid 一直等於 lo，迴圈停不下來。' },
      { wrong: '只要寫得出檢查，就可以對答案二分', right: '還要行不行是一刀切開的。例如問「哪個長度剪完剩下的零頭最少」，零頭隨長度忽多忽少，猜一個長度看不出該往長還是往短，不能二分。' },
      { wrong: 'lo 和 hi 抓個大概就好', right: '答案一定要落在 lo 到 hi 之間。hi 取最長那捲（再長連一條都剪不出）；lo 取 1 的前提是 1 公分一定剪得出 12 條；題目沒保證的話，lo 從 0 開始，最後答案是 0 就代表連 1 公分都剪不出來。' },
    ],
    // 程式追蹤器：同一段程式的四種語言，{{k}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行。三捲緞帶的單位是公尺
    trace: {
      inputs: [{ label: '要 4 條', values: { k: 4 } }, { label: '要 6 條', values: { k: 6 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int ribbons[] = {9, 7, 5};
    int need = {{k}};
    int lo = 1;
    int hi = 9;
    while (lo < hi) {
        int mid = (lo + hi + 1) / 2;
        int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
        if (count >= need) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    printf("%d\\n", lo);
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> ribbons = {9, 7, 5};
    int need = {{k}};
    int lo = 1;
    int hi = 9;
    while (lo < hi) {
        int mid = (lo + hi + 1) / 2;
        int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
        if (count >= need) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    std::cout << lo << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] ribbons = {9, 7, 5};
        int need = {{k}};
        int lo = 1;
        int hi = 9;
        while (lo < hi) {
            int mid = (lo + hi + 1) / 2;
            int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
            if (count >= need) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        System.out.println(lo);
    }
}
`,
        python: `ribbons = [9, 7, 5]
need = {{k}}
lo = 1
hi = 9
while lo < hi:
    mid = (lo + hi + 1) // 2
    count = ribbons[0] // mid + ribbons[1] // mid + ribbons[2] // mid
    if count >= need:
        lo = mid
    else:
        hi = mid - 1
print(lo)
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 11: 14, 12: 17 },
        cpp: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 10, 7: 11, 8: 12, 9: 13, 11: 15, 12: 18 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 11, 11: 13, 12: 16 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "要 4 條": [
        {"line":1,"vars":{"ribbons":[9,7,5]},"out":""},
        {"line":2,"vars":{"ribbons":[9,7,5],"need":4},"out":""},
        {"line":3,"vars":{"ribbons":[9,7,5],"need":4,"lo":1},"out":""},
        {"line":4,"vars":{"ribbons":[9,7,5],"need":4,"lo":1,"hi":9},"out":""},
        {"line":5,"vars":{"ribbons":[9,7,5],"need":4,"lo":1,"hi":9},"out":"","cond":true},
        {"line":6,"vars":{"ribbons":[9,7,5],"need":4,"lo":1,"hi":9,"mid":5},"out":""},
        {"line":7,"vars":{"ribbons":[9,7,5],"need":4,"lo":1,"hi":9,"mid":5,"count":3},"out":""},
        {"line":8,"vars":{"ribbons":[9,7,5],"need":4,"lo":1,"hi":9,"mid":5,"count":3},"out":"","cond":false},
        {"line":11,"vars":{"ribbons":[9,7,5],"need":4,"lo":1,"hi":4,"mid":5,"count":3},"out":""},
        {"line":5,"vars":{"ribbons":[9,7,5],"need":4,"lo":1,"hi":4,"mid":5,"count":3},"out":"","cond":true},
        {"line":6,"vars":{"ribbons":[9,7,5],"need":4,"lo":1,"hi":4,"mid":3,"count":3},"out":""},
        {"line":7,"vars":{"ribbons":[9,7,5],"need":4,"lo":1,"hi":4,"mid":3,"count":6},"out":""},
        {"line":8,"vars":{"ribbons":[9,7,5],"need":4,"lo":1,"hi":4,"mid":3,"count":6},"out":"","cond":true},
        {"line":9,"vars":{"ribbons":[9,7,5],"need":4,"lo":3,"hi":4,"mid":3,"count":6},"out":""},
        {"line":5,"vars":{"ribbons":[9,7,5],"need":4,"lo":3,"hi":4,"mid":3,"count":6},"out":"","cond":true},
        {"line":6,"vars":{"ribbons":[9,7,5],"need":4,"lo":3,"hi":4,"mid":4,"count":6},"out":""},
        {"line":7,"vars":{"ribbons":[9,7,5],"need":4,"lo":3,"hi":4,"mid":4,"count":4},"out":""},
        {"line":8,"vars":{"ribbons":[9,7,5],"need":4,"lo":3,"hi":4,"mid":4,"count":4},"out":"","cond":true},
        {"line":9,"vars":{"ribbons":[9,7,5],"need":4,"lo":4,"hi":4,"mid":4,"count":4},"out":""},
        {"line":5,"vars":{"ribbons":[9,7,5],"need":4,"lo":4,"hi":4,"mid":4,"count":4},"out":"","cond":false},
        {"line":12,"vars":{"ribbons":[9,7,5],"need":4,"lo":4,"hi":4,"mid":4,"count":4},"out":"4\n"},
      ],
      "要 6 條": [
        {"line":1,"vars":{"ribbons":[9,7,5]},"out":""},
        {"line":2,"vars":{"ribbons":[9,7,5],"need":6},"out":""},
        {"line":3,"vars":{"ribbons":[9,7,5],"need":6,"lo":1},"out":""},
        {"line":4,"vars":{"ribbons":[9,7,5],"need":6,"lo":1,"hi":9},"out":""},
        {"line":5,"vars":{"ribbons":[9,7,5],"need":6,"lo":1,"hi":9},"out":"","cond":true},
        {"line":6,"vars":{"ribbons":[9,7,5],"need":6,"lo":1,"hi":9,"mid":5},"out":""},
        {"line":7,"vars":{"ribbons":[9,7,5],"need":6,"lo":1,"hi":9,"mid":5,"count":3},"out":""},
        {"line":8,"vars":{"ribbons":[9,7,5],"need":6,"lo":1,"hi":9,"mid":5,"count":3},"out":"","cond":false},
        {"line":11,"vars":{"ribbons":[9,7,5],"need":6,"lo":1,"hi":4,"mid":5,"count":3},"out":""},
        {"line":5,"vars":{"ribbons":[9,7,5],"need":6,"lo":1,"hi":4,"mid":5,"count":3},"out":"","cond":true},
        {"line":6,"vars":{"ribbons":[9,7,5],"need":6,"lo":1,"hi":4,"mid":3,"count":3},"out":""},
        {"line":7,"vars":{"ribbons":[9,7,5],"need":6,"lo":1,"hi":4,"mid":3,"count":6},"out":""},
        {"line":8,"vars":{"ribbons":[9,7,5],"need":6,"lo":1,"hi":4,"mid":3,"count":6},"out":"","cond":true},
        {"line":9,"vars":{"ribbons":[9,7,5],"need":6,"lo":3,"hi":4,"mid":3,"count":6},"out":""},
        {"line":5,"vars":{"ribbons":[9,7,5],"need":6,"lo":3,"hi":4,"mid":3,"count":6},"out":"","cond":true},
        {"line":6,"vars":{"ribbons":[9,7,5],"need":6,"lo":3,"hi":4,"mid":4,"count":6},"out":""},
        {"line":7,"vars":{"ribbons":[9,7,5],"need":6,"lo":3,"hi":4,"mid":4,"count":4},"out":""},
        {"line":8,"vars":{"ribbons":[9,7,5],"need":6,"lo":3,"hi":4,"mid":4,"count":4},"out":"","cond":false},
        {"line":11,"vars":{"ribbons":[9,7,5],"need":6,"lo":3,"hi":3,"mid":4,"count":4},"out":""},
        {"line":5,"vars":{"ribbons":[9,7,5],"need":6,"lo":3,"hi":3,"mid":4,"count":4},"out":"","cond":false},
        {"line":12,"vars":{"ribbons":[9,7,5],"need":6,"lo":3,"hi":3,"mid":4,"count":4},"out":"3\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：開場的四捲緞帶要剪 12 條，每猜一次一列：左邊是目前的範圍，中間的橫線代表 1～750 公分、範圍那一段塗黃，右邊是猜的長度剪得出幾條
    figure({ svgEl, svgText, rough, INK, NEW }) {
      const ribbons = [750, 620, 480, 390], need = 12, longest = 750;
      const s = svgEl(320, 250), rc = rough.svg(s);
      const label = (x, y, text, size = 11, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const BAR_X = 58, BAR_W = 142, TOP = 32, ROW = 20;
      const xOf = (length) => BAR_X + (length - 1) / (longest - 1) * BAR_W;
      label(160, 10, '四捲緞帶要剪 12 條：每次猜中間的長度', 12, true);
      let lo = 1, hi = longest, row = 0;
      while (lo < hi) {
        const y = TOP + row * ROW;
        const mid = Math.floor((lo + hi + 1) / 2);
        const count = ribbons.reduce((sum, ribbon) => sum + Math.floor(ribbon / mid), 0);
        const enough = count >= need;
        label(28, y, `${lo}～${hi}`);
        s.append(rc.line(BAR_X, y, BAR_X + BAR_W, y, { stroke: INK, strokeWidth: 1, roughness: 0.6, seed: 40 + row }));
        // 範圍太窄時至少畫 3px，不然看不到
        s.append(rc.rectangle(xOf(lo), y - 5, Math.max(3, xOf(hi) - xOf(lo)), 10, { stroke: INK, strokeWidth: 1.1, roughness: 0.6, fillStyle: 'solid', fill: NEW, seed: 60 + row }));
        label(262, y, `猜 ${mid}：${count} 條 ${enough ? '✓' : '✗'}`);
        if (enough) lo = mid; else hi = mid - 1;
        row += 1;
      }
      label(160, TOP + row * ROW + 6, `範圍只剩 ${lo}：答案`, 12);
      return s;
    },
    code: {
      c: `#include <stdio.h>

// 每條剪 length 公分，n 捲緞帶一共剪得出幾條
int count_pieces(const int ribbons[], int n, int length) {
    int count = 0;
    for (int i = 0; i < n; i++) {
        count += ribbons[i] / length;
    }
    return count;
}

// 剪得出 need 條的最長長度；前提是 1 公分一定剪得出 need 條
int max_length(const int ribbons[], int n, int need) {
    int lo = 1, hi = 0;
    for (int i = 0; i < n; i++) {      // hi 取最長那捲：再長連一條都剪不出
        if (ribbons[i] > hi) {
            hi = ribbons[i];
        }
    }
    while (lo < hi) {
        int mid = (lo + hi + 1) / 2;   // 找最大的行：中間取偏上的
        if (count_pieces(ribbons, n, mid) >= need) {
            lo = mid;                  // 行：答案在 mid 或更長
        } else {
            hi = mid - 1;              // 不行：答案比 mid 短
        }
    }
    return lo;
}

int main(void) {
    int ribbons[] = {750, 620, 480, 390};
    printf("%d %d\\n", max_length(ribbons, 4, 12), max_length(ribbons, 4, 5));
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// 每條剪 length 公分，全部的緞帶一共剪得出幾條
int count_pieces(const std::vector<int>& ribbons, int length) {
    int count = 0;
    for (int ribbon : ribbons) {
        count += ribbon / length;
    }
    return count;
}

// 剪得出 need 條的最長長度；前提是 1 公分一定剪得出 need 條
int max_length(const std::vector<int>& ribbons, int need) {
    int lo = 1, hi = 0;
    for (int ribbon : ribbons) {       // hi 取最長那捲：再長連一條都剪不出
        if (ribbon > hi) {
            hi = ribbon;
        }
    }
    while (lo < hi) {
        int mid = (lo + hi + 1) / 2;   // 找最大的行：中間取偏上的
        if (count_pieces(ribbons, mid) >= need) {
            lo = mid;                  // 行：答案在 mid 或更長
        } else {
            hi = mid - 1;              // 不行：答案比 mid 短
        }
    }
    return lo;
}

int main() {
    std::vector<int> ribbons = {750, 620, 480, 390};
    std::cout << max_length(ribbons, 12) << " " << max_length(ribbons, 5) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 每條剪 length 公分，全部的緞帶一共剪得出幾條
    static int countPieces(int[] ribbons, int length) {
        int count = 0;
        for (int ribbon : ribbons) {
            count += ribbon / length;
        }
        return count;
    }

    // 剪得出 need 條的最長長度；前提是 1 公分一定剪得出 need 條
    static int maxLength(int[] ribbons, int need) {
        int lo = 1, hi = 0;
        for (int ribbon : ribbons) {       // hi 取最長那捲：再長連一條都剪不出
            if (ribbon > hi) {
                hi = ribbon;
            }
        }
        while (lo < hi) {
            int mid = (lo + hi + 1) / 2;   // 找最大的行：中間取偏上的
            if (countPieces(ribbons, mid) >= need) {
                lo = mid;                  // 行：答案在 mid 或更長
            } else {
                hi = mid - 1;              // 不行：答案比 mid 短
            }
        }
        return lo;
    }

    public static void main(String[] args) {
        int[] ribbons = {750, 620, 480, 390};
        System.out.println(maxLength(ribbons, 12) + " " + maxLength(ribbons, 5));
    }
}
`,
      python: `def count_pieces(ribbons, length):       # 每條剪 length 公分，全部的緞帶一共剪得出幾條
    count = 0
    for ribbon in ribbons:
        count += ribbon // length
    return count


def max_length(ribbons, need):           # 剪得出 need 條的最長長度；前提是 1 公分一定剪得出 need 條
    lo, hi = 1, max(ribbons)             # hi 取最長那捲：再長連一條都剪不出
    while lo < hi:
        mid = (lo + hi + 1) // 2         # 找最大的行：中間取偏上的
        if count_pieces(ribbons, mid) >= need:
            lo = mid                     # 行：答案在 mid 或更長
        else:
            hi = mid - 1                 # 不行：答案比 mid 短
    return lo


ribbons = [750, 620, 480, 390]
print(max_length(ribbons, 12), max_length(ribbons, 5))
`,
      output: '160 375',
    },
    cost: {
      rows: [
        ['一公分一公分試', '答案是 A 就試 A + 1 次，每次看 n 捲，O(A × n)'],
        ['對答案二分', '猜 log₂ M 次（M 是範圍的大小），每次看 n 捲，O(n log M)'],
      ],
      note: { text: '750 公分猜 10 次；範圍到十億也只要 30 次。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '三捲緞帶長 30、24、15 公分，要剪出 5 條一樣長的。下面這段程式印出什麼？',
        code: {
          c: `int ribbons[] = {30, 24, 15};
int need = 5;
int lo = 1, hi = 30;
while (lo < hi) {
    int mid = (lo + hi + 1) / 2;
    int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
    if (count >= need) {
        lo = mid;
    } else {
        hi = mid - 1;
    }
}
printf("%d\\n", lo);`,
          cpp: `std::vector<int> ribbons = {30, 24, 15};
int need = 5;
int lo = 1, hi = 30;
while (lo < hi) {
    int mid = (lo + hi + 1) / 2;
    int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
    if (count >= need) {
        lo = mid;
    } else {
        hi = mid - 1;
    }
}
std::cout << lo << "\\n";`,
          java: `int[] ribbons = {30, 24, 15};
int need = 5;
int lo = 1, hi = 30;
while (lo < hi) {
    int mid = (lo + hi + 1) / 2;
    int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
    if (count >= need) {
        lo = mid;
    } else {
        hi = mid - 1;
    }
}
System.out.println(lo);`,
          python: `ribbons = [30, 24, 15]
need = 5
lo, hi = 1, 30
while lo < hi:
    mid = (lo + hi + 1) // 2
    count = ribbons[0] // mid + ribbons[1] // mid + ribbons[2] // mid
    if count >= need:
        lo = mid
    else:
        hi = mid - 1
print(lo)`,
        },
        options: ['8', '12', '13', '15'],
        answer: 1,
        why: '猜 16：1 + 1 + 0 = 2 條，不夠，hi = 15；猜 8：3 + 3 + 1 = 7 條，夠，lo = 8；猜 12：2 + 2 + 1 = 5 條，夠，lo = 12；猜 14 和 13 都只有 4 條，hi 一路收到 12，印出 12。8 是第一個夠的長度，可是 lo = 8 之後還要往長的猜；13 是全部加起來 69 公分除以 5，照 13 公分剪只有 2 + 1 + 1 = 4 條；15 是最短那捲的長度，照 15 公分剪也只有 2 + 1 + 1 = 4 條。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int ribbons[] = {30, 24, 15};
    int need = 5;
    int lo = 1, hi = 30;
    while (lo < hi) {
        int mid = (lo + hi + 1) / 2;
        int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
        if (count >= need) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    printf("%d\\n", lo);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> ribbons = {30, 24, 15};
    int need = 5;
    int lo = 1, hi = 30;
    while (lo < hi) {
        int mid = (lo + hi + 1) / 2;
        int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
        if (count >= need) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    std::cout << lo << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] ribbons = {30, 24, 15};
        int need = 5;
        int lo = 1, hi = 30;
        while (lo < hi) {
            int mid = (lo + hi + 1) / 2;
            int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
            if (count >= need) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        System.out.println(lo);
    }
}
`,
          python: `ribbons = [30, 24, 15]
need = 5
lo, hi = 1, 30
while lo < hi:
    mid = (lo + hi + 1) // 2
    count = ribbons[0] // mid + ribbons[1] // mid + ribbons[2] // mid
    if count >= need:
        lo = mid
    else:
        hi = mid - 1
print(lo)
`,
        },
        output: '12',
      },
      {
        kind: '程式測試與除錯',
        prompt: '同樣三捲緞帶 30、24、15 公分要剪 5 條，答案該是 12，下面這段程式卻印出 30。要怎麼改？',
        code: {
          c: `int ribbons[] = {30, 24, 15};
int need = 5;
int lo = 1, hi = 30;
while (lo < hi) {
    int mid = (lo + hi + 1) / 2;
    int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
    if (count >= need) {
        hi = mid - 1;
    } else {
        lo = mid;
    }
}
printf("%d\\n", lo);`,
          cpp: `std::vector<int> ribbons = {30, 24, 15};
int need = 5;
int lo = 1, hi = 30;
while (lo < hi) {
    int mid = (lo + hi + 1) / 2;
    int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
    if (count >= need) {
        hi = mid - 1;
    } else {
        lo = mid;
    }
}
std::cout << lo << "\\n";`,
          java: `int[] ribbons = {30, 24, 15};
int need = 5;
int lo = 1, hi = 30;
while (lo < hi) {
    int mid = (lo + hi + 1) / 2;
    int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
    if (count >= need) {
        hi = mid - 1;
    } else {
        lo = mid;
    }
}
System.out.println(lo);`,
          python: `ribbons = [30, 24, 15]
need = 5
lo, hi = 1, 30
while lo < hi:
    mid = (lo + hi + 1) // 2
    count = ribbons[0] // mid + ribbons[1] // mid + ribbons[2] // mid
    if count >= need:
        hi = mid - 1
    else:
        lo = mid
print(lo)`,
        },
        options: ['把 mid 改成 (lo + hi) / 2', '把 hi 一開始的值改成 15', '把兩個分支對調：夠的時候 lo = mid，不夠的時候 hi = mid − 1', '把 count >= need 改成 count > need'],
        answer: 2,
        why: '夠和不夠的方向寫反了。第一次猜 16 只有 2 條，不夠，應該往短的猜，程式卻做 lo = 16 往長的猜；接著猜 23、27、29、30 都不夠，lo 一路被推到 30。把兩個分支對調，夠的時候 lo = mid、不夠的時候 hi = mid − 1，就會印出 12。mid 改成 (lo + hi) / 2 的話方向還是反的，lo 走到 29 之後 mid 一直是 29，迴圈停不下來；hi 改成 15 的話，猜 8、4、2 都夠，hi 一路被收到 1，印出 1；改成 count > need 還是不夠的時候往長的猜，一樣印出 30。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int ribbons[] = {30, 24, 15};
    int need = 5;
    int lo = 1, hi = 30;
    while (lo < hi) {
        int mid = (lo + hi + 1) / 2;
        int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
        if (count >= need) {
            hi = mid - 1;
        } else {
            lo = mid;
        }
    }
    printf("%d\\n", lo);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> ribbons = {30, 24, 15};
    int need = 5;
    int lo = 1, hi = 30;
    while (lo < hi) {
        int mid = (lo + hi + 1) / 2;
        int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
        if (count >= need) {
            hi = mid - 1;
        } else {
            lo = mid;
        }
    }
    std::cout << lo << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] ribbons = {30, 24, 15};
        int need = 5;
        int lo = 1, hi = 30;
        while (lo < hi) {
            int mid = (lo + hi + 1) / 2;
            int count = ribbons[0] / mid + ribbons[1] / mid + ribbons[2] / mid;
            if (count >= need) {
                hi = mid - 1;
            } else {
                lo = mid;
            }
        }
        System.out.println(lo);
    }
}
`,
          python: `ribbons = [30, 24, 15]
need = 5
lo, hi = 1, 30
while lo < hi:
    mid = (lo + hi + 1) // 2
    count = ribbons[0] // mid + ribbons[1] // mid + ribbons[2] // mid
    if count >= need:
        hi = mid - 1
    else:
        lo = mid
print(lo)
`,
        },
        output: '30',
      },
      {
        kind: '程式效能分析',
        prompt: '只有一捲 1000000 公分的緞帶（ribbon），只要剪 1 條（need 是 1），所以猜多長都剪得出來。lo 從 1、hi 從 1000000 出發，下面這段程式印出的 steps 是多少？',
        code: {
          c: `int steps = 0;
while (lo < hi) {
    steps += 1;
    int mid = (lo + hi + 1) / 2;
    int count = ribbon / mid;
    if (count >= need) {
        lo = mid;
    } else {
        hi = mid - 1;
    }
}
printf("%d\\n", steps);`,
          cpp: `int steps = 0;
while (lo < hi) {
    steps += 1;
    int mid = (lo + hi + 1) / 2;
    int count = ribbon / mid;
    if (count >= need) {
        lo = mid;
    } else {
        hi = mid - 1;
    }
}
std::cout << steps << "\\n";`,
          java: `int steps = 0;
while (lo < hi) {
    steps += 1;
    int mid = (lo + hi + 1) / 2;
    int count = ribbon / mid;
    if (count >= need) {
        lo = mid;
    } else {
        hi = mid - 1;
    }
}
System.out.println(steps);`,
          python: `steps = 0
while lo < hi:
    steps += 1
    mid = (lo + hi + 1) // 2
    count = ribbon // mid
    if count >= need:
        lo = mid
    else:
        hi = mid - 1
print(steps)`,
        },
        options: ['1000000', '500000', '1000', '20'],
        answer: 3,
        why: '每猜一次，範圍裡的長度就剩一半：1000000 個、500000 個、250000 個……砍 20 次剩 1 個，lo 等於 hi，迴圈跑了 20 圈。1000000 是把 1 到 1000000 每個長度都試一次的次數；500000 是第一圈一次排除掉的長度有幾個（1 到 500000），不是圈數；1000 是 1000000 開根號，可是這裡每圈是砍一半，不是開根號。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int ribbon = 1000000, need = 1;
    int lo = 1, hi = 1000000;
    int steps = 0;
    while (lo < hi) {
        steps += 1;
        int mid = (lo + hi + 1) / 2;
        int count = ribbon / mid;
        if (count >= need) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    printf("%d\\n", steps);
    return 0;
}
`,
          cpp: `#include <iostream>
int main() {
    int ribbon = 1000000, need = 1;
    int lo = 1, hi = 1000000;
    int steps = 0;
    while (lo < hi) {
        steps += 1;
        int mid = (lo + hi + 1) / 2;
        int count = ribbon / mid;
        if (count >= need) {
            lo = mid;
        } else {
            hi = mid - 1;
        }
    }
    std::cout << steps << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int ribbon = 1000000, need = 1;
        int lo = 1, hi = 1000000;
        int steps = 0;
        while (lo < hi) {
            steps += 1;
            int mid = (lo + hi + 1) / 2;
            int count = ribbon / mid;
            if (count >= need) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        System.out.println(steps);
    }
}
`,
          python: `ribbon, need = 1000000, 1
lo, hi = 1, 1000000
steps = 0
while lo < hi:
    steps += 1
    mid = (lo + hi + 1) // 2
    count = ribbon // mid
    if count >= need:
        lo = mid
    else:
        hi = mid - 1
print(steps)
`,
        },
        output: '20',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      { text: '答案是小數也可以二分。沒有 sqrt 的時候算 2 的平方根：lo = 0、hi = 2，每次猜 mid = (lo + hi) / 2，mid × mid 超過 2 就 hi = mid，不然 lo = mid。小數沒有「下一個數」，所以不用加 1、減 1；lo 和 hi 也很難剛好相等，所以不用 lo < hi 當條件，改成固定猜 100 次，或猜到兩邊差距小於要的精確度就停。每猜一次範圍剩一半：猜 20 次，lo 和 hi 的差距不到 0.00001，兩邊都是 1.41421 開頭。' },
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'binary_answer', page);
})(typeof window !== 'undefined' ? window : globalThis);
