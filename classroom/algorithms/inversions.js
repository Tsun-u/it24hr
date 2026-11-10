// classroom/algorithms/inversions.js — 演算法「逆序數對」這一頁（經典應用，用到分治法）：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '一套 8 集的漫畫在書架上被放成 3、1、4、8、2、6、5、7。每次只能把相鄰的兩本對調，最少要調幾次，才能排回第 1 集到第 8 集？',
    // 複習：兩層迴圈一對一對看，資料一多就看不完；quote 是這頁的核心想法
    review: [
      { text: '要調的次數，剛好等於「集數大的排在集數小的前面」有幾對，這種一對叫逆序數對（inversion）。用兩層迴圈一對一對看，8 本有 28 對；十萬筆資料就是將近 50 億對。', see: 'programming/loops' },
      { text: '分治法那頁的課外補充寫過遞迴版的合併排序。', see: 'divide_conquer' },
      { quote: '左半、右半各自排好之後，右半的數每搶先一次，就一次跨過左半還沒拿的全部。' },
    ],
    summary: '最少要調 8 次。不用真的去調，也不用 28 對一對一對看：切兩半各自數，合併的時候右半每拿一個，就把左半剩下的個數一次加上去。下次碰到「數有幾對順序反了」，像比兩份排行榜差多少，你就知道：邊排序邊數，一次數一整批。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      '比兩份排行榜差多少：把朋友的排名照你的順序重新編號，逆序數對越多，兩個人的口味差越多。統計學叫它 Kendall tau 距離。',
      { text: '氣泡排序要交換幾次，就是逆序數對有幾對。', see: 'ds/sorting' },
      '衡量一份資料「有多亂」：0 對是已經排好，n(n − 1) / 2 對是完全倒過來。',
      'APCS 實作題：資料到十萬筆，兩層迴圈會超過時間，要用合併排序邊排邊數。',
    ],
    concept: [
      '逆序數對（inversion）：一排數字裡，前面的比後面的大，這樣的一對。排好的有 0 對；完全倒過來的，每一對都是，有 n(n − 1) / 2 對。',
      '為什麼相鄰對調的次數等於逆序數對：對調一對相鄰、而且順序反了的書，逆序數對剛好少 1，別的書之間誰前誰後都沒變。所以至少要調這麼多次；每次都找一對相鄰又反了的來調，也剛好這麼多次。',
      { text: '用分治法數：切成左右兩半之後，每一對只有三種：兩本都在左半、兩本都在右半、一本在左一本在右。前兩種交給遞迴，第三種在合併的時候數。', see: 'divide_conquer' },
      '合併的時候怎麼數：左右兩半各自排好了。右半現在這一本比左半現在這一本小，就先拿右半的；左半還沒拿的每一本都比它大（因為排好了），這幾本跟它都是逆序，一次加上「左半還剩幾本」。',
      '兩半各自排好，不會把答案弄亂：排的是半邊裡面的順序，一左一右的每一對，誰在左、誰在右沒有變。',
    ],
    traps: [
      { wrong: '兩個一樣大的數也算一對', right: '不算，要前面的比後面的大才算。合併時兩邊一樣大要先拿左半的（比較寫 <=），不然一樣大的會被算進去。' },
      { wrong: '合併時，拿左半的那一刻加上右半剩下的', right: '是拿右半的那一刻，加上左半還沒拿的個數（試試看第二題）。' },
      { wrong: '對數用 int 裝得下', right: '十萬筆最多有將近 50 億對，超過 int 的上限。C、C++ 用 long long，Java 用 long。' },
      { wrong: '數完之後陣列還是原來的樣子', right: '邊數邊排，數完陣列已經排好了。原本的順序還要用的話，先複製一份。' },
    ],
    // 程式追蹤器：只走合併那一步（兩半已經各自排好）。同一段程式的四種語言，{{x}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '右半最後是 6', values: { x: 6 } }, { label: '右半最後是 9', values: { x: 9 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int left[] = {2, 5, 8};
    int right[] = {1, 4, {{x}}};
    int i = 0;
    int j = 0;
    int count = 0;
    while (i < 3 && j < 3) {
        if (left[i] <= right[j]) {
            i += 1;
        } else {
            count += 3 - i;
            j += 1;
        }
    }
    printf("%d\\n", count);
    return 0;
}
`,
        cpp: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> left = {2, 5, 8};
    std::vector<int> right = {1, 4, {{x}}};
    int i = 0;
    int j = 0;
    int count = 0;
    while (i < 3 && j < 3) {
        if (left[i] <= right[j]) {
            i += 1;
        } else {
            count += 3 - i;
            j += 1;
        }
    }
    std::cout << count << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] left = {2, 5, 8};
        int[] right = {1, 4, {{x}}};
        int i = 0;
        int j = 0;
        int count = 0;
        while (i < 3 && j < 3) {
            if (left[i] <= right[j]) {
                i += 1;
            } else {
                count += 3 - i;
                j += 1;
            }
        }
        System.out.println(count);
    }
}
`,
        python: `left = [2, 5, 8]
right = [1, 4, {{x}}]
i = 0
j = 0
count = 0
while i < 3 and j < 3:
    if left[i] <= right[j]:
        i += 1
    else:
        count += 3 - i
        j += 1
print(count)
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 13, 11: 14, 12: 17 },
        cpp: { 1: 5, 2: 6, 3: 7, 4: 8, 5: 9, 6: 10, 7: 11, 8: 12, 9: 13, 10: 14, 11: 15, 12: 18 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 9: 11, 10: 12, 11: 13, 12: 16 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "右半最後是 6": [
        {"line":1,"vars":{"left":[2,5,8]},"out":""},
        {"line":2,"vars":{"left":[2,5,8],"right":[1,4,6]},"out":""},
        {"line":3,"vars":{"left":[2,5,8],"right":[1,4,6],"i":0},"out":""},
        {"line":4,"vars":{"left":[2,5,8],"right":[1,4,6],"i":0,"j":0},"out":""},
        {"line":5,"vars":{"left":[2,5,8],"right":[1,4,6],"i":0,"j":0,"count":0},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,6],"i":0,"j":0,"count":0},"out":"","cond":true},
        {"line":7,"vars":{"left":[2,5,8],"right":[1,4,6],"i":0,"j":0,"count":0},"out":"","cond":false},
        {"line":10,"vars":{"left":[2,5,8],"right":[1,4,6],"i":0,"j":0,"count":3},"out":""},
        {"line":11,"vars":{"left":[2,5,8],"right":[1,4,6],"i":0,"j":1,"count":3},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,6],"i":0,"j":1,"count":3},"out":"","cond":true},
        {"line":7,"vars":{"left":[2,5,8],"right":[1,4,6],"i":0,"j":1,"count":3},"out":"","cond":true},
        {"line":8,"vars":{"left":[2,5,8],"right":[1,4,6],"i":1,"j":1,"count":3},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,6],"i":1,"j":1,"count":3},"out":"","cond":true},
        {"line":7,"vars":{"left":[2,5,8],"right":[1,4,6],"i":1,"j":1,"count":3},"out":"","cond":false},
        {"line":10,"vars":{"left":[2,5,8],"right":[1,4,6],"i":1,"j":1,"count":5},"out":""},
        {"line":11,"vars":{"left":[2,5,8],"right":[1,4,6],"i":1,"j":2,"count":5},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,6],"i":1,"j":2,"count":5},"out":"","cond":true},
        {"line":7,"vars":{"left":[2,5,8],"right":[1,4,6],"i":1,"j":2,"count":5},"out":"","cond":true},
        {"line":8,"vars":{"left":[2,5,8],"right":[1,4,6],"i":2,"j":2,"count":5},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,6],"i":2,"j":2,"count":5},"out":"","cond":true},
        {"line":7,"vars":{"left":[2,5,8],"right":[1,4,6],"i":2,"j":2,"count":5},"out":"","cond":false},
        {"line":10,"vars":{"left":[2,5,8],"right":[1,4,6],"i":2,"j":2,"count":6},"out":""},
        {"line":11,"vars":{"left":[2,5,8],"right":[1,4,6],"i":2,"j":3,"count":6},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,6],"i":2,"j":3,"count":6},"out":"","cond":false},
        {"line":12,"vars":{"left":[2,5,8],"right":[1,4,6],"i":2,"j":3,"count":6},"out":"6\n"},
      ],
      "右半最後是 9": [
        {"line":1,"vars":{"left":[2,5,8]},"out":""},
        {"line":2,"vars":{"left":[2,5,8],"right":[1,4,9]},"out":""},
        {"line":3,"vars":{"left":[2,5,8],"right":[1,4,9],"i":0},"out":""},
        {"line":4,"vars":{"left":[2,5,8],"right":[1,4,9],"i":0,"j":0},"out":""},
        {"line":5,"vars":{"left":[2,5,8],"right":[1,4,9],"i":0,"j":0,"count":0},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,9],"i":0,"j":0,"count":0},"out":"","cond":true},
        {"line":7,"vars":{"left":[2,5,8],"right":[1,4,9],"i":0,"j":0,"count":0},"out":"","cond":false},
        {"line":10,"vars":{"left":[2,5,8],"right":[1,4,9],"i":0,"j":0,"count":3},"out":""},
        {"line":11,"vars":{"left":[2,5,8],"right":[1,4,9],"i":0,"j":1,"count":3},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,9],"i":0,"j":1,"count":3},"out":"","cond":true},
        {"line":7,"vars":{"left":[2,5,8],"right":[1,4,9],"i":0,"j":1,"count":3},"out":"","cond":true},
        {"line":8,"vars":{"left":[2,5,8],"right":[1,4,9],"i":1,"j":1,"count":3},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,9],"i":1,"j":1,"count":3},"out":"","cond":true},
        {"line":7,"vars":{"left":[2,5,8],"right":[1,4,9],"i":1,"j":1,"count":3},"out":"","cond":false},
        {"line":10,"vars":{"left":[2,5,8],"right":[1,4,9],"i":1,"j":1,"count":5},"out":""},
        {"line":11,"vars":{"left":[2,5,8],"right":[1,4,9],"i":1,"j":2,"count":5},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,9],"i":1,"j":2,"count":5},"out":"","cond":true},
        {"line":7,"vars":{"left":[2,5,8],"right":[1,4,9],"i":1,"j":2,"count":5},"out":"","cond":true},
        {"line":8,"vars":{"left":[2,5,8],"right":[1,4,9],"i":2,"j":2,"count":5},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,9],"i":2,"j":2,"count":5},"out":"","cond":true},
        {"line":7,"vars":{"left":[2,5,8],"right":[1,4,9],"i":2,"j":2,"count":5},"out":"","cond":true},
        {"line":8,"vars":{"left":[2,5,8],"right":[1,4,9],"i":3,"j":2,"count":5},"out":""},
        {"line":6,"vars":{"left":[2,5,8],"right":[1,4,9],"i":3,"j":2,"count":5},"out":"","cond":false},
        {"line":12,"vars":{"left":[2,5,8],"right":[1,4,9],"i":3,"j":2,"count":5},"out":"5\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：合併的那一步。每從右半拿一個數畫一列：拿的那個數和左半還沒拿的塗黃（這幾個跟它都是逆序），已經拿走的留空框
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const left = [2, 5, 8], right = [1, 4, 6];
      // 照合併的規則走一遍，記下每次拿右半的那一刻：左半拿走幾個、拿的是右半第幾個
      const takes = [];
      for (let i = 0, j = 0; i < left.length && j < right.length;) {
        if (left[i] <= right[j]) i += 1; else { takes.push({ i, j }); j += 1; }
      }
      const s = svgEl(320, 194), rc = rough.svg(s);
      const box = { stroke: INK, strokeWidth: 1.3, roughness: 0.9, fillStyle: 'solid' };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const CELL = 30, H = 26, LEFT_X = 6, RIGHT_X = 112, TOP = 42, ROW = 46;
      label(160, 12, '合併：右半每拿一個，加上左半還沒拿的個數', 12, true);
      label(LEFT_X + CELL * 1.5, 30, '左半', 11, true);
      label(RIGHT_X + CELL * 1.5, 30, '右半', 11, true);
      takes.forEach(({ i, j }, k) => {
        const y = TOP + k * ROW, remaining = left.length - i;
        // gone：已經拿走的，留空框、字變淡；hot：這一次算進去的，塗黃
        const cell = (x, value, gone, hot, seed) => {
          s.append(rc.rectangle(x, y, CELL, H, { ...box, seed, fill: gone ? 'none' : hot ? NEW : FILL }));
          label(x + CELL / 2, y + H / 2, String(value), 13, gone);
        };
        left.forEach((v, n) => cell(LEFT_X + n * CELL, v, n < i, n >= i, 40 + k * 10 + n));
        right.forEach((v, n) => cell(RIGHT_X + n * CELL, v, n < j, n === j, 45 + k * 10 + n));
        label(262, y + 6, `拿 ${right[j]}，左半剩 ${remaining} 個`, 11, true);
        label(262, y + 21, `+${remaining}`, 13);
      });
      const added = takes.map(({ i }) => left.length - i);
      label(160, 180, `${added.join(' + ')} = ${added.reduce((a, b) => a + b, 0)} 對`, 12);
      return s;
    },
    code: {
      c: `#include <stdio.h>

// 數 data[left..right] 裡有幾對逆序數對，順便把這一段排好
long long count_inversions(int data[], int left, int right) {
    if (left >= right) {                     // 只剩一個數：湊不成一對
        return 0;
    }
    int mid = (left + right) / 2;
    long long count = count_inversions(data, left, mid);   // 兩個都在左半的
    count += count_inversions(data, mid + 1, right);       // 兩個都在右半的
    int merged[right - left + 1];            // 一個在左、一個在右的：合併的時候數
    int i = left, j = mid + 1, k = 0;
    while (i <= mid && j <= right) {
        if (data[i] <= data[j]) {            // 一樣大先拿左半的，一樣大的才不會被算進去
            merged[k++] = data[i++];
        } else {
            count += mid - i + 1;            // 先拿右半的：左半還沒拿的每一個都比它大
            merged[k++] = data[j++];
        }
    }
    while (i <= mid) {                       // 左半還有剩：整段接上去
        merged[k++] = data[i++];
    }
    while (j <= right) {                     // 右半還有剩：整段接上去
        merged[k++] = data[j++];
    }
    for (int t = 0; t < k; t++) {            // 把合好的結果放回原本的位置
        data[left + t] = merged[t];
    }
    return count;
}

int main(void) {
    int shelf[] = {3, 1, 4, 8, 2, 6, 5, 7};
    int backwards[] = {8, 7, 6, 5, 4, 3, 2, 1};
    long long first = count_inversions(shelf, 0, 7);
    long long second = count_inversions(backwards, 0, 7);
    printf("%lld %lld\\n", first, second);
    return 0;
}
`,
      cpp: `#include <iostream>
#include <vector>

// 數 data[left..right] 裡有幾對逆序數對，順便把這一段排好
long long count_inversions(std::vector<int>& data, int left, int right) {
    if (left >= right) {                     // 只剩一個數：湊不成一對
        return 0;
    }
    int mid = (left + right) / 2;
    long long count = count_inversions(data, left, mid);   // 兩個都在左半的
    count += count_inversions(data, mid + 1, right);       // 兩個都在右半的
    std::vector<int> merged;                 // 一個在左、一個在右的：合併的時候數
    int i = left, j = mid + 1;
    while (i <= mid && j <= right) {
        if (data[i] <= data[j]) {            // 一樣大先拿左半的，一樣大的才不會被算進去
            merged.push_back(data[i++]);
        } else {
            count += mid - i + 1;            // 先拿右半的：左半還沒拿的每一個都比它大
            merged.push_back(data[j++]);
        }
    }
    while (i <= mid) {                       // 左半還有剩：整段接上去
        merged.push_back(data[i++]);
    }
    while (j <= right) {                     // 右半還有剩：整段接上去
        merged.push_back(data[j++]);
    }
    for (int t = 0; t < (int)merged.size(); t++) {   // 把合好的結果放回原本的位置
        data[left + t] = merged[t];
    }
    return count;
}

int main() {
    std::vector<int> shelf = {3, 1, 4, 8, 2, 6, 5, 7};
    std::vector<int> backwards = {8, 7, 6, 5, 4, 3, 2, 1};
    long long first = count_inversions(shelf, 0, 7);
    long long second = count_inversions(backwards, 0, 7);
    std::cout << first << " " << second << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 數 data[left..right] 裡有幾對逆序數對，順便把這一段排好
    static long countInversions(int[] data, int left, int right) {
        if (left >= right) {                     // 只剩一個數：湊不成一對
            return 0;
        }
        int mid = (left + right) / 2;
        long count = countInversions(data, left, mid);    // 兩個都在左半的
        count += countInversions(data, mid + 1, right);   // 兩個都在右半的
        int[] merged = new int[right - left + 1];   // 一個在左、一個在右的：合併的時候數
        int i = left, j = mid + 1, k = 0;
        while (i <= mid && j <= right) {
            if (data[i] <= data[j]) {            // 一樣大先拿左半的，一樣大的才不會被算進去
                merged[k++] = data[i++];
            } else {
                count += mid - i + 1;            // 先拿右半的：左半還沒拿的每一個都比它大
                merged[k++] = data[j++];
            }
        }
        while (i <= mid) {                       // 左半還有剩：整段接上去
            merged[k++] = data[i++];
        }
        while (j <= right) {                     // 右半還有剩：整段接上去
            merged[k++] = data[j++];
        }
        for (int t = 0; t < k; t++) {            // 把合好的結果放回原本的位置
            data[left + t] = merged[t];
        }
        return count;
    }

    public static void main(String[] args) {
        int[] shelf = {3, 1, 4, 8, 2, 6, 5, 7};
        int[] backwards = {8, 7, 6, 5, 4, 3, 2, 1};
        long first = countInversions(shelf, 0, 7);
        long second = countInversions(backwards, 0, 7);
        System.out.println(first + " " + second);
    }
}
`,
      python: `def count_inversions(data, left, right):    # 數 data[left..right] 裡有幾對逆序數對，順便把這一段排好
    if left >= right:                       # 只剩一個數：湊不成一對
        return 0
    mid = (left + right) // 2
    count = count_inversions(data, left, mid)         # 兩個都在左半的
    count += count_inversions(data, mid + 1, right)   # 兩個都在右半的
    merged = []                             # 一個在左、一個在右的：合併的時候數
    i, j = left, mid + 1
    while i <= mid and j <= right:
        if data[i] <= data[j]:              # 一樣大先拿左半的，一樣大的才不會被算進去
            merged.append(data[i])
            i += 1
        else:
            count += mid - i + 1            # 先拿右半的：左半還沒拿的每一個都比它大
            merged.append(data[j])
            j += 1
    while i <= mid:                         # 左半還有剩：整段接上去
        merged.append(data[i])
        i += 1
    while j <= right:                       # 右半還有剩：整段接上去
        merged.append(data[j])
        j += 1
    for t in range(len(merged)):            # 把合好的結果放回原本的位置
        data[left + t] = merged[t]
    return count


shelf = [3, 1, 4, 8, 2, 6, 5, 7]
backwards = [8, 7, 6, 5, 4, 3, 2, 1]
first = count_inversions(shelf, 0, 7)
second = count_inversions(backwards, 0, 7)
print(first, second)
`,
      output: '8 28',
    },
    cost: {
      rows: [
        ['兩層迴圈一對一對看', 'n(n − 1) / 2 對，O(n²)'],
        ['合併排序邊排邊數', 'O(n log n)'],
      ],
      note: { text: '十萬筆是將近 50 億對，對上大約 170 萬步。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '左半 3、6、7、9 和右半 1、4、5、8 都排好了，合併的時候順便數逆序數對。下面這段程式印出什麼？',
        code: {
          c: `int left[] = {3, 6, 7, 9};
int right[] = {1, 4, 5, 8};
int i = 0, j = 0, count = 0;
while (i < 4 && j < 4) {
    if (left[i] <= right[j]) {
        i += 1;
    } else {
        count += 4 - i;
        j += 1;
    }
}
printf("%d\\n", count);`,
          cpp: `std::vector<int> left = {3, 6, 7, 9};
std::vector<int> right = {1, 4, 5, 8};
int i = 0, j = 0, count = 0;
while (i < 4 && j < 4) {
    if (left[i] <= right[j]) {
        i += 1;
    } else {
        count += 4 - i;
        j += 1;
    }
}
std::cout << count << "\\n";`,
          java: `int[] left = {3, 6, 7, 9};
int[] right = {1, 4, 5, 8};
int i = 0, j = 0, count = 0;
while (i < 4 && j < 4) {
    if (left[i] <= right[j]) {
        i += 1;
    } else {
        count += 4 - i;
        j += 1;
    }
}
System.out.println(count);`,
          python: `left = [3, 6, 7, 9]
right = [1, 4, 5, 8]
i, j, count = 0, 0, 0
while i < 4 and j < 4:
    if left[i] <= right[j]:
        i += 1
    else:
        count += 4 - i
        j += 1
print(count)`,
        },
        options: ['4', '5', '7', '11'],
        answer: 3,
        why: '拿 1 的時候左半 4 個都還沒拿，加 4；接著拿左半的 3；拿 4 的時候左半還剩 6、7、9，加 3；拿 5 也加 3；再拿左半的 6、7；拿 8 的時候左半只剩 9，加 1。右半拿完了，一共 4 + 3 + 3 + 1 = 11。4 是右半每拿一個只加 1：右半拿了 4 個，可是每一個跨過的不只一個數。5 是加在拿左半的時候、加右半還剩幾個：拿 3 加 3、拿 6 加 1、拿 7 加 1。7 是把左半還剩幾個少算一個（看成 3 − i）：3 + 2 + 2 + 0。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int left[] = {3, 6, 7, 9};
    int right[] = {1, 4, 5, 8};
    int i = 0, j = 0, count = 0;
    while (i < 4 && j < 4) {
        if (left[i] <= right[j]) {
            i += 1;
        } else {
            count += 4 - i;
            j += 1;
        }
    }
    printf("%d\\n", count);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> left = {3, 6, 7, 9};
    std::vector<int> right = {1, 4, 5, 8};
    int i = 0, j = 0, count = 0;
    while (i < 4 && j < 4) {
        if (left[i] <= right[j]) {
            i += 1;
        } else {
            count += 4 - i;
            j += 1;
        }
    }
    std::cout << count << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] left = {3, 6, 7, 9};
        int[] right = {1, 4, 5, 8};
        int i = 0, j = 0, count = 0;
        while (i < 4 && j < 4) {
            if (left[i] <= right[j]) {
                i += 1;
            } else {
                count += 4 - i;
                j += 1;
            }
        }
        System.out.println(count);
    }
}
`,
          python: `left = [3, 6, 7, 9]
right = [1, 4, 5, 8]
i, j, count = 0, 0, 0
while i < 4 and j < 4:
    if left[i] <= right[j]:
        i += 1
    else:
        count += 4 - i
        j += 1
print(count)
`,
        },
        output: '11',
      },
      {
        kind: '程式測試與除錯',
        prompt: '左半 2、5、8 和右半 1、4、6 合併，應該數到 6 對，這段程式卻印出 3。要怎麼改？',
        code: {
          c: `int left[] = {2, 5, 8};
int right[] = {1, 4, 6};
int i = 0, j = 0, count = 0;
while (i < 3 && j < 3) {
    if (left[i] <= right[j]) {
        count += 3 - j;
        i += 1;
    } else {
        j += 1;
    }
}
printf("%d\\n", count);`,
          cpp: `std::vector<int> left = {2, 5, 8};
std::vector<int> right = {1, 4, 6};
int i = 0, j = 0, count = 0;
while (i < 3 && j < 3) {
    if (left[i] <= right[j]) {
        count += 3 - j;
        i += 1;
    } else {
        j += 1;
    }
}
std::cout << count << "\\n";`,
          java: `int[] left = {2, 5, 8};
int[] right = {1, 4, 6};
int i = 0, j = 0, count = 0;
while (i < 3 && j < 3) {
    if (left[i] <= right[j]) {
        count += 3 - j;
        i += 1;
    } else {
        j += 1;
    }
}
System.out.println(count);`,
          python: `left = [2, 5, 8]
right = [1, 4, 6]
i, j, count = 0, 0, 0
while i < 3 and j < 3:
    if left[i] <= right[j]:
        count += 3 - j
        i += 1
    else:
        j += 1
print(count)`,
        },
        options: ['把 <= 改成 <', '把 count += 3 - j 移到 else 那一邊，改成 count += 3 - i', '把 count += 3 - j 改成 count += 3 - i，位置不動', '把 count += 3 - j 移到 else 那一邊，改成 count += 1'],
        answer: 1,
        why: '程式在拿左半的時候加上「右半還剩幾個」：拿 2 加 2、拿 5 加 1，印出 3。可是右半剩下的那幾個比左半這個數大，順序沒有反，數到的是排對的。逆序是右半的數搶在左半的前面，所以要在拿右半的那一刻，加上左半還沒拿的個數：拿 1 加 3、拿 4 加 2、拿 6 加 1，一共 6。把 <= 改成 < 的話，這兩半沒有一樣大的數，每一步拿的都一樣，還是印 3。只把加的數改成 3 − i、位置不動，還是在拿左半的時候加：拿 2 加 3、拿 5 加 2，印出 5。移到 else 那一邊卻只加 1 的話，右半拿了 3 個就只加 3，可是拿 1 的時候它一次跨過了左半的 3 個數。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int left[] = {2, 5, 8};
    int right[] = {1, 4, 6};
    int i = 0, j = 0, count = 0;
    while (i < 3 && j < 3) {
        if (left[i] <= right[j]) {
            count += 3 - j;
            i += 1;
        } else {
            j += 1;
        }
    }
    printf("%d\\n", count);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> left = {2, 5, 8};
    std::vector<int> right = {1, 4, 6};
    int i = 0, j = 0, count = 0;
    while (i < 3 && j < 3) {
        if (left[i] <= right[j]) {
            count += 3 - j;
            i += 1;
        } else {
            j += 1;
        }
    }
    std::cout << count << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] left = {2, 5, 8};
        int[] right = {1, 4, 6};
        int i = 0, j = 0, count = 0;
        while (i < 3 && j < 3) {
            if (left[i] <= right[j]) {
                count += 3 - j;
                i += 1;
            } else {
                j += 1;
            }
        }
        System.out.println(count);
    }
}
`,
          python: `left = [2, 5, 8]
right = [1, 4, 6]
i, j, count = 0, 0, 0
while i < 3 and j < 3:
    if left[i] <= right[j]:
        count += 3 - j
        i += 1
    else:
        j += 1
print(count)
`,
        },
        output: '3',
      },
      {
        kind: '解析計算邏輯',
        prompt: '這次兩半裡有一樣大的數：左半 2、5、5，右半 2、5、7，真正的逆序數對只有 2 對。這段程式的比較寫成了 <，它印出多少？',
        code: {
          c: `int left[] = {2, 5, 5};
int right[] = {2, 5, 7};
int i = 0, j = 0, count = 0;
while (i < 3 && j < 3) {
    if (left[i] < right[j]) {
        i += 1;
    } else {
        count += 3 - i;
        j += 1;
    }
}
printf("%d\\n", count);`,
          cpp: `std::vector<int> left = {2, 5, 5};
std::vector<int> right = {2, 5, 7};
int i = 0, j = 0, count = 0;
while (i < 3 && j < 3) {
    if (left[i] < right[j]) {
        i += 1;
    } else {
        count += 3 - i;
        j += 1;
    }
}
std::cout << count << "\\n";`,
          java: `int[] left = {2, 5, 5};
int[] right = {2, 5, 7};
int i = 0, j = 0, count = 0;
while (i < 3 && j < 3) {
    if (left[i] < right[j]) {
        i += 1;
    } else {
        count += 3 - i;
        j += 1;
    }
}
System.out.println(count);`,
          python: `left = [2, 5, 5]
right = [2, 5, 7]
i, j, count = 0, 0, 0
while i < 3 and j < 3:
    if left[i] < right[j]:
        i += 1
    else:
        count += 3 - i
        j += 1
print(count)`,
        },
        options: ['2', '3', '5', '9'],
        answer: 2,
        why: '比較寫成 <，兩邊一樣大的時候會先拿右半的，把一樣大的也當成逆序。2 對 2：拿右半的 2，加 3；再拿左半的 2。5 對 5：拿右半的 5，加 2。剩下左半的兩個 5 都比 7 小，拿完就結束，一共 3 + 2 = 5。多出來的 3，就是一左一右一樣大的那 3 對：2 和 2，還有左半的兩個 5 各配右半的 5。2 是比較寫成 <= 才會印出來的正確答案。3 是只數了一樣大的那幾對，真正的逆序 2 對也在裡面，要加上去。9 是把一左一右的 3 × 3 對全部算進去，可是左半的 2 比右半的 5、7 小，那幾對沒有被加到。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int left[] = {2, 5, 5};
    int right[] = {2, 5, 7};
    int i = 0, j = 0, count = 0;
    while (i < 3 && j < 3) {
        if (left[i] < right[j]) {
            i += 1;
        } else {
            count += 3 - i;
            j += 1;
        }
    }
    printf("%d\\n", count);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <vector>
int main() {
    std::vector<int> left = {2, 5, 5};
    std::vector<int> right = {2, 5, 7};
    int i = 0, j = 0, count = 0;
    while (i < 3 && j < 3) {
        if (left[i] < right[j]) {
            i += 1;
        } else {
            count += 3 - i;
            j += 1;
        }
    }
    std::cout << count << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] left = {2, 5, 5};
        int[] right = {2, 5, 7};
        int i = 0, j = 0, count = 0;
        while (i < 3 && j < 3) {
            if (left[i] < right[j]) {
                i += 1;
            } else {
                count += 3 - i;
                j += 1;
            }
        }
        System.out.println(count);
    }
}
`,
          python: `left = [2, 5, 5]
right = [2, 5, 7]
i, j, count = 0, 0, 0
while i < 3 and j < 3:
    if left[i] < right[j]:
        i += 1
    else:
        count += 3 - i
        j += 1
print(count)
`,
        },
        output: '5',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      '換一個角度也數得出來：從左到右一個一個看，問「前面有幾個比我大」。這個問法用樹狀陣列（Fenwick tree）也能做到 O(n log n)，那是進階的資料結構，這裡只提名字。',
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'inversions', page);
})(typeof window !== 'undefined' ? window : globalThis);
