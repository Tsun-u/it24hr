// classroom/algorithms/huffman.js — 演算法「霍夫曼編碼」這一頁：講義內容、程式追蹤器的程式和步驟、試試看（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    layout: 'program',
    analogy: '把一份全是文字的報告壓成 zip，檔案剩不到一半；解壓縮之後，一個字都沒少。少掉的那一半去哪了？',
    // 複習：每個字母一樣長的代碼，常出現和少出現的佔一樣多；quote 是這頁的核心想法
    review: [
      '電腦裡每個英文字母都用一樣長的代碼。一則 15 個字的訊息只用到 A、B、C、D、E 五種字母，每個字母 3 個位元，一共 45 個位元。可是 A 出現了 7 次，E 只出現 1 次，兩個卻佔一樣長。',
      { text: '貪婪法每一步拿眼前最好的；每次要拿「最小的兩個」，用堆積最快。', see: ['greedy', 'ds/heap'] },
      { quote: '常出現的給短代碼，少出現的給長代碼；每次把出現最少的兩個合成一組。' },
    ],
    summary: '沒有少：常出現的符號換成了比較短的代碼，解壓縮的時候照同一張表換回來，所以一個字不差。那則 15 個字的訊息從 45 個位元變成 29 個。zip 用的招數不只這一個，這是其中之一。下次看到一份資料裡有些東西特別常出現，就可以想：常用的給短的。',   // 總結：回答開頭的問題，再推到之後碰到的每一次
    uses: [
      'zip、gzip、PNG 的壓縮都有這一步；JPEG 圖片和 MP3 音樂存檔前的最後一步，也常用它把數字換成長短不一的代碼。',
      '摩斯電碼是同一個想法的前輩：英文最常用的 E 是一個點，少用的 Q 要四個符號。差別是摩斯電碼靠停頓分開字母，霍夫曼編碼不用。',
      '「每次合併最小的兩堆，代價是兩堆的和，要讓總代價最小」這類題目：合併果子、接繩子，都是同一個貪婪法。',
      'APCS 實作題：上面那種合併的題目，搭配堆積（優先佇列）每次拿最小的兩個。',
    ],
    concept: [
      '霍夫曼編碼（Huffman coding）是 David Huffman 在 1952 年發表的，當時他還是麻省理工學院的研究生。它給每個符號一個長短不一的代碼：越常出現的越短。',
      { text: '建樹：每個符號先各自是一個節點，記著它出現幾次。每次挑次數最少的兩個，合成一個新的節點，次數是兩個相加，放回去再挑。合到只剩一個，它就是樹根。', see: 'ds/tree' },
      '代碼怎麼來：從樹根走到那個符號，往左記 0、往右記 1。常出現的符號比較晚被合進去，離樹根近，代碼就短。',
      '符號都在葉子上，所以沒有一個代碼會是另一個代碼的開頭，這叫前綴碼（prefix code）。解碼時從樹根照著位元往下走，走到葉子就是一個符號，再回樹根接著走，中間不用放分隔的記號。',
      '編完一共幾個位元，等於每次合併出來的次數全部加起來：2 + 4 + 8 + 15 = 29。',
      { text: '「每次拿最小的兩個」用堆積來做，n 個符號是 O(n log n)。為什麼每次合最少的兩個就是最好的，理由跟貪婪法那頁一樣是「換過來也不會變差」：出現最少的兩個放在樹的最深處，不會吃虧。', see: ['ds/heap', 'greedy'] },
    ],
    traps: [
      { wrong: '常出現的給短代碼就好，代碼隨便取', right: 'A 是 0、B 是 1、C 是 00 的話，收到 00 分不出是 AA 還是 C。要讓每個代碼都不是別的代碼的開頭。' },
      { wrong: '同一份資料的霍夫曼樹只有一種', right: '次數一樣的時候先合誰、合起來誰放左邊都可以，每個符號的代碼會不一樣，可是編完的總長度一樣。' },
      { wrong: '壓縮檔裡只要存編好的位元', right: '還要存代碼表（或每個符號出現幾次），不然解不回來。資料很短的時候，加上這張表反而比原本還大。' },
      { wrong: '什麼檔案都壓得小', right: '要有些符號特別常出現才省得到。每個符號出現的次數都差不多的話，代碼幾乎一樣長；已經壓過的檔案再壓一次，也壓不下去。' },
    ],
    // 程式追蹤器：照圖解那棵樹解碼。節點 0 到 3 是中間的節點（0 是樹根），4 到 8 是 A 到 E；go0、go1 是每個中間節點往左、往右走到哪個節點。
    // {{b}} 換成挑的那組輸入；lines 是 Python 的第幾行對到那種語言的第幾行
    trace: {
      inputs: [{ label: '最後一個位元是 0', values: { b: 0 } }, { label: '最後一個位元是 1', values: { b: 1 } }],
      code: {
        c: `#include <stdio.h>

int main(void) {
    int go0[] = {4, 5, 6, 7};
    int go1[] = {1, 2, 3, 8};
    char letters[] = "ABCDE";
    int bits[] = {1, 0, 1, 1, 1, {{b}}};
    int node = 0;
    for (int k = 0; k < 6; k++) {
        if (bits[k] == 0) {
            node = go0[node];
        } else {
            node = go1[node];
        }
        if (node >= 4) {
            printf("%c", letters[node - 4]);
            node = 0;
        }
    }
    printf("\\n");
    return 0;
}
`,
        cpp: `#include <iostream>
#include <string>
#include <vector>

int main() {
    std::vector<int> go0 = {4, 5, 6, 7};
    std::vector<int> go1 = {1, 2, 3, 8};
    std::string letters = "ABCDE";
    std::vector<int> bits = {1, 0, 1, 1, 1, {{b}}};
    int node = 0;
    for (int k = 0; k < 6; k++) {
        if (bits[k] == 0) {
            node = go0[node];
        } else {
            node = go1[node];
        }
        if (node >= 4) {
            std::cout << letters[node - 4];
            node = 0;
        }
    }
    std::cout << "\\n";
    return 0;
}
`,
        java: `public class Main {
    public static void main(String[] args) {
        int[] go0 = {4, 5, 6, 7};
        int[] go1 = {1, 2, 3, 8};
        String letters = "ABCDE";
        int[] bits = {1, 0, 1, 1, 1, {{b}}};
        int node = 0;
        for (int k = 0; k < 6; k++) {
            if (bits[k] == 0) {
                node = go0[node];
            } else {
                node = go1[node];
            }
            if (node >= 4) {
                System.out.print(letters.charAt(node - 4));
                node = 0;
            }
        }
        System.out.println();
    }
}
`,
        python: `go0 = [4, 5, 6, 7]
go1 = [1, 2, 3, 8]
letters = "ABCDE"
bits = [1, 0, 1, 1, 1, {{b}}]
node = 0
for k in range(6):
    if bits[k] == 0:
        node = go0[node]
    else:
        node = go1[node]
    if node >= 4:
        print(letters[node - 4], end="")
        node = 0
print()
`,
      },
      lines: {
        c: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 10: 13, 11: 15, 12: 16, 13: 17, 14: 20 },
        cpp: { 1: 6, 2: 7, 3: 8, 4: 9, 5: 10, 6: 11, 7: 12, 8: 13, 10: 15, 11: 17, 12: 18, 13: 19, 14: 22 },
        java: { 1: 3, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8, 7: 9, 8: 10, 10: 12, 11: 14, 12: 15, 13: 16, 14: 19 },
      },
    // TRACE-RUNS-BEGIN（scripts/build-traces.js 產生，不要手改）
    runs: {
      "最後一個位元是 0": [
        {"line":1,"vars":{"go0":[4,5,6,7]},"out":""},
        {"line":2,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8]},"out":""},
        {"line":3,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE"},"out":""},
        {"line":4,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0]},"out":""},
        {"line":5,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":0},"out":""},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":0,"k":0},"out":"","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":0,"k":0},"out":"","cond":false},
        {"line":10,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":1,"k":0},"out":""},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":1,"k":0},"out":"","cond":false},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":1,"k":1},"out":"","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":1,"k":1},"out":"","cond":true},
        {"line":8,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":5,"k":1},"out":""},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":5,"k":1},"out":"","cond":true},
        {"line":12,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":5,"k":1},"out":"B"},
        {"line":13,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":0,"k":1},"out":"B"},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":0,"k":2},"out":"B","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":0,"k":2},"out":"B","cond":false},
        {"line":10,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":1,"k":2},"out":"B"},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":1,"k":2},"out":"B","cond":false},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":1,"k":3},"out":"B","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":1,"k":3},"out":"B","cond":false},
        {"line":10,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":2,"k":3},"out":"B"},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":2,"k":3},"out":"B","cond":false},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":2,"k":4},"out":"B","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":2,"k":4},"out":"B","cond":false},
        {"line":10,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":3,"k":4},"out":"B"},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":3,"k":4},"out":"B","cond":false},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":3,"k":5},"out":"B","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":3,"k":5},"out":"B","cond":true},
        {"line":8,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":7,"k":5},"out":"B"},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":7,"k":5},"out":"B","cond":true},
        {"line":12,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":7,"k":5},"out":"BD"},
        {"line":13,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":0,"k":5},"out":"BD"},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":0,"k":5},"out":"BD","cond":false},
        {"line":14,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,0],"node":0,"k":5},"out":"BD\n"},
      ],
      "最後一個位元是 1": [
        {"line":1,"vars":{"go0":[4,5,6,7]},"out":""},
        {"line":2,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8]},"out":""},
        {"line":3,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE"},"out":""},
        {"line":4,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1]},"out":""},
        {"line":5,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":0},"out":""},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":0,"k":0},"out":"","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":0,"k":0},"out":"","cond":false},
        {"line":10,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":1,"k":0},"out":""},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":1,"k":0},"out":"","cond":false},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":1,"k":1},"out":"","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":1,"k":1},"out":"","cond":true},
        {"line":8,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":5,"k":1},"out":""},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":5,"k":1},"out":"","cond":true},
        {"line":12,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":5,"k":1},"out":"B"},
        {"line":13,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":0,"k":1},"out":"B"},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":0,"k":2},"out":"B","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":0,"k":2},"out":"B","cond":false},
        {"line":10,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":1,"k":2},"out":"B"},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":1,"k":2},"out":"B","cond":false},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":1,"k":3},"out":"B","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":1,"k":3},"out":"B","cond":false},
        {"line":10,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":2,"k":3},"out":"B"},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":2,"k":3},"out":"B","cond":false},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":2,"k":4},"out":"B","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":2,"k":4},"out":"B","cond":false},
        {"line":10,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":3,"k":4},"out":"B"},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":3,"k":4},"out":"B","cond":false},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":3,"k":5},"out":"B","cond":true},
        {"line":7,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":3,"k":5},"out":"B","cond":false},
        {"line":10,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":8,"k":5},"out":"B"},
        {"line":11,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":8,"k":5},"out":"B","cond":true},
        {"line":12,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":8,"k":5},"out":"BE"},
        {"line":13,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":0,"k":5},"out":"BE"},
        {"line":6,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":0,"k":5},"out":"BE","cond":false},
        {"line":14,"vars":{"go0":[4,5,6,7],"go1":[1,2,3,8],"letters":"ABCDE","bits":[1,0,1,1,1,1],"node":0,"k":5},"out":"BE\n"},
      ],
    },
    // TRACE-RUNS-END
    },
    // 圖解：A 7、B 4、C 2、D 1、E 1 合出來的樹，一路往右下長。圓的是合併出來的節點、方的是符號，裡面寫出現次數；
    // 邊上往左標 0、往右標 1，右邊是每個符號的代碼表
    figure({ svgEl, svgText, rough, INK, FILL, NEW }) {
      const leaves = [['A', 7], ['B', 4], ['C', 2], ['D', 1], ['E', 1]];
      const merged = [15, 8, 4, 2];                         // 從樹根往下，每個中間節點的次數
      const codes = ['0', '10', '110', '1110', '1111'];
      const s = svgEl(320, 270), rc = rough.svg(s);
      const shape = { stroke: INK, strokeWidth: 1.3, roughness: 0.9, fillStyle: 'solid' };
      const label = (x, y, text, size = 13, muted = false) => { const t = svgText(s, x, y, text, size); if (muted) t.setAttribute('fill', '#57606a'); };
      const X0 = 52, Y0 = 30, DX = 40, DY = 46, LEAF_DX = 30, R = 13, HALF = 12;
      const inner = merged.map((_, i) => ({ x: X0 + i * DX, y: Y0 + i * DY }));
      // 每個中間節點的左邊掛一個符號；最後一個中間節點的右邊是 E
      const leafAt = leaves.map((_, i) => (i < 4 ? { x: inner[i].x - LEAF_DX, y: inner[i].y + DY } : { x: inner[3].x + DX, y: inner[3].y + DY }));
      inner.forEach((p, i) => {
        const right = i < 3 ? inner[i + 1] : leafAt[4];
        s.append(rc.line(p.x, p.y, leafAt[i].x, leafAt[i].y, { stroke: INK, strokeWidth: 1.2, roughness: 0.6, seed: 40 + i }));
        s.append(rc.line(p.x, p.y, right.x, right.y, { stroke: INK, strokeWidth: 1.2, roughness: 0.6, seed: 50 + i }));
        label(p.x - 24, p.y + 19, '0', 11, true);
        label(p.x + 28, p.y + 19, '1', 11, true);
      });
      inner.forEach((p, i) => {
        s.append(rc.circle(p.x, p.y, R * 2, { ...shape, seed: 10 + i, fill: FILL }));
        label(p.x, p.y, String(merged[i]), 12);
      });
      leaves.forEach(([letter, count], i) => {
        const p = leafAt[i];
        s.append(rc.rectangle(p.x - HALF, p.y - HALF, HALF * 2, HALF * 2, { ...shape, seed: 20 + i, fill: NEW }));
        label(p.x, p.y, String(count), 12);
        label(p.x, p.y + 22, letter, 12);
      });
      // 代碼表：字母一欄，代碼的每個位元各佔一格，往左對齊
      label(266, 20, '代碼表', 12, true);
      leaves.forEach(([letter], k) => {
        const y = 42 + k * 18;
        label(236, y, letter, 12);
        label(249, y, '=', 12, true);
        [...codes[k]].forEach((bit, j) => label(264 + j * 10, y, bit, 12));
      });
      label(160, 258, '往左記 0、往右記 1，15 個字一共 29 個位元', 11, true);
      return s;
    },
    code: {
      c: `#include <stdio.h>

// 算霍夫曼編碼編完一共幾個位元：每次找出次數最少的兩個合起來，把每次合併的和加起來；counts 是每種符號出現幾次
int total_bits(const int counts[], int n) {
    int work[100];                          // 複製一份來合併，原本的陣列不動（最多 100 種符號）
    for (int i = 0; i < n; i++) {
        work[i] = counts[i];
    }
    int total = 0;
    while (n > 1) {
        for (int k = 0; k < 2; k++) {       // 做兩次：先把最小的換到最後一格，再把第二小的換到它前面
            int small = 0;
            for (int i = 1; i < n - k; i++) {
                if (work[i] < work[small]) {
                    small = i;
                }
            }
            int t = work[small];
            work[small] = work[n - 1 - k];
            work[n - 1 - k] = t;
        }
        work[n - 2] += work[n - 1];         // 最小的兩個合成一個，放在倒數第二格
        total += work[n - 2];
        n--;                                // 最後一格不要了
    }
    return total;
}

int main(void) {
    int message[] = {7, 4, 2, 1, 1};
    int even[] = {5, 5, 5, 5};
    printf("%d %d\\n", total_bits(message, 5), total_bits(even, 4));
    return 0;
}
`,
      cpp: `#include <iostream>
#include <utility>
#include <vector>

// 算霍夫曼編碼編完一共幾個位元：每次找出次數最少的兩個合起來，把每次合併的和加起來；work 是每種符號出現幾次
int total_bits(std::vector<int> work) {     // 傳值：work 是複製的一份，合併的時候不會改到原本的
    int n = work.size(), total = 0;
    while (n > 1) {
        for (int k = 0; k < 2; k++) {       // 做兩次：先把最小的換到最後一格，再把第二小的換到它前面
            int small = 0;
            for (int i = 1; i < n - k; i++) {
                if (work[i] < work[small]) {
                    small = i;
                }
            }
            std::swap(work[small], work[n - 1 - k]);
        }
        work[n - 2] += work[n - 1];         // 最小的兩個合成一個，放在倒數第二格
        total += work[n - 2];
        n--;                                // 最後一格不要了
    }
    return total;
}

int main() {
    std::vector<int> message = {7, 4, 2, 1, 1};
    std::vector<int> even = {5, 5, 5, 5};
    std::cout << total_bits(message) << " " << total_bits(even) << "\\n";
    return 0;
}
`,
      java: `public class Main {
    // 算霍夫曼編碼編完一共幾個位元：每次找出次數最少的兩個合起來，把每次合併的和加起來；counts 是每種符號出現幾次
    static int totalBits(int[] counts) {
        int[] work = counts.clone();            // 複製一份來合併，原本的陣列不動
        int n = work.length, total = 0;
        while (n > 1) {
            for (int k = 0; k < 2; k++) {       // 做兩次：先把最小的換到最後一格，再把第二小的換到它前面
                int small = 0;
                for (int i = 1; i < n - k; i++) {
                    if (work[i] < work[small]) {
                        small = i;
                    }
                }
                int t = work[small];
                work[small] = work[n - 1 - k];
                work[n - 1 - k] = t;
            }
            work[n - 2] += work[n - 1];         // 最小的兩個合成一個，放在倒數第二格
            total += work[n - 2];
            n--;                                // 最後一格不要了
        }
        return total;
    }

    public static void main(String[] args) {
        int[] message = {7, 4, 2, 1, 1};
        int[] even = {5, 5, 5, 5};
        System.out.println(totalBits(message) + " " + totalBits(even));
    }
}
`,
      python: `def total_bits(counts):                 # counts 是每種符號出現幾次
    work = list(counts)                 # 複製一份來合併，原本的串列不動
    n, total = len(work), 0
    while n > 1:
        for k in range(2):              # 做兩次：先把最小的換到最後一格，再把第二小的換到它前面
            small = 0
            for i in range(1, n - k):
                if work[i] < work[small]:
                    small = i
            work[small], work[n - 1 - k] = work[n - 1 - k], work[small]
        work[n - 2] += work[n - 1]      # 最小的兩個合成一個，放在倒數第二格
        total += work[n - 2]
        n -= 1                          # 最後一格不要了
    return total


message = [7, 4, 2, 1, 1]
even = [5, 5, 5, 5]
print(total_bits(message), total_bits(even))
`,
      output: '29 40',
    },
    cost: {
      rows: [
        ['固定長度：每個符號一樣長', '15 × 3 = 45 個位元'],
        ['每次用迴圈找最小的兩個', '找一次 O(n)，合 n − 1 次，O(n²)'],
        ['用堆積', 'O(n log n)'],
      ],
      note: { text: '符號只有幾百種的時候，兩種寫法都很快；差別在符號很多的時候。Big-O 的意思和怎麼算，在資料結構的附錄。', see: 'ds/complexity' },
    },
    // 試試看：題型照 APCS 程式識讀的官方分類；code 是題目上的程式片段，program 是驗算用的完整程式（四種語言都實跑，印出 output）
    tryit: [
      {
        kind: '程式運行追蹤',
        prompt: '用這一頁那棵樹解碼（A = 0、B = 10、C = 110、D = 1110、E = 1111）：節點 0 到 3 是中間的節點，0 是樹根；4 到 8 是 A 到 E。下面這段程式印出什麼？',
        code: {
          c: `int go0[] = {4, 5, 6, 7};
int go1[] = {1, 2, 3, 8};
char letters[] = "ABCDE";
int bits[] = {1, 1, 0, 0, 1, 0};
int node = 0;
for (int k = 0; k < 6; k++) {
    if (bits[k] == 0) {
        node = go0[node];
    } else {
        node = go1[node];
    }
    if (node >= 4) {
        printf("%c", letters[node - 4]);
        node = 0;
    }
}
printf("\\n");`,
          cpp: `std::vector<int> go0 = {4, 5, 6, 7};
std::vector<int> go1 = {1, 2, 3, 8};
std::string letters = "ABCDE";
std::vector<int> bits = {1, 1, 0, 0, 1, 0};
int node = 0;
for (int k = 0; k < 6; k++) {
    if (bits[k] == 0) {
        node = go0[node];
    } else {
        node = go1[node];
    }
    if (node >= 4) {
        std::cout << letters[node - 4];
        node = 0;
    }
}
std::cout << "\\n";`,
          java: `int[] go0 = {4, 5, 6, 7};
int[] go1 = {1, 2, 3, 8};
String letters = "ABCDE";
int[] bits = {1, 1, 0, 0, 1, 0};
int node = 0;
for (int k = 0; k < 6; k++) {
    if (bits[k] == 0) {
        node = go0[node];
    } else {
        node = go1[node];
    }
    if (node >= 4) {
        System.out.print(letters.charAt(node - 4));
        node = 0;
    }
}
System.out.println();`,
          python: `go0 = [4, 5, 6, 7]
go1 = [1, 2, 3, 8]
letters = "ABCDE"
bits = [1, 1, 0, 0, 1, 0]
node = 0
for k in range(6):
    if bits[k] == 0:
        node = go0[node]
    else:
        node = go1[node]
    if node >= 4:
        print(letters[node - 4], end="")
        node = 0
print()`,
        },
        options: ['AAC', 'ABA', 'C', 'CAB'],
        answer: 3,
        why: '1、1、0 從樹根往右、往右、往左，走到 C，回樹根；接著的 0 往左就是 A；最後的 1、0 往右、往左是 B，印出 CAB。AAC 是把方向看反了，當成 1 往左、0 往右：兩個 1 各解成一個 A，0、0、1 解成 C，最後的 0 走到一半就沒有位元了。ABA 是從最後一個位元往前讀：0 是 A、1、0 是 B、0 是 A，剩下的 1、1 走不到葉子。C 是解出第一個字母就停了；走到葉子之後要回樹根接著走，後面的位元還有兩個字母。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int go0[] = {4, 5, 6, 7};
    int go1[] = {1, 2, 3, 8};
    char letters[] = "ABCDE";
    int bits[] = {1, 1, 0, 0, 1, 0};
    int node = 0;
    for (int k = 0; k < 6; k++) {
        if (bits[k] == 0) {
            node = go0[node];
        } else {
            node = go1[node];
        }
        if (node >= 4) {
            printf("%c", letters[node - 4]);
            node = 0;
        }
    }
    printf("\\n");
    return 0;
}
`,
          cpp: `#include <iostream>
#include <string>
#include <vector>
int main() {
    std::vector<int> go0 = {4, 5, 6, 7};
    std::vector<int> go1 = {1, 2, 3, 8};
    std::string letters = "ABCDE";
    std::vector<int> bits = {1, 1, 0, 0, 1, 0};
    int node = 0;
    for (int k = 0; k < 6; k++) {
        if (bits[k] == 0) {
            node = go0[node];
        } else {
            node = go1[node];
        }
        if (node >= 4) {
            std::cout << letters[node - 4];
            node = 0;
        }
    }
    std::cout << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] go0 = {4, 5, 6, 7};
        int[] go1 = {1, 2, 3, 8};
        String letters = "ABCDE";
        int[] bits = {1, 1, 0, 0, 1, 0};
        int node = 0;
        for (int k = 0; k < 6; k++) {
            if (bits[k] == 0) {
                node = go0[node];
            } else {
                node = go1[node];
            }
            if (node >= 4) {
                System.out.print(letters.charAt(node - 4));
                node = 0;
            }
        }
        System.out.println();
    }
}
`,
          python: `go0 = [4, 5, 6, 7]
go1 = [1, 2, 3, 8]
letters = "ABCDE"
bits = [1, 1, 0, 0, 1, 0]
node = 0
for k in range(6):
    if bits[k] == 0:
        node = go0[node]
    else:
        node = go1[node]
    if node >= 4:
        print(letters[node - 4], end="")
        node = 0
print()
`,
        },
        output: 'CAB',
      },
      {
        kind: '解析計算邏輯',
        prompt: '一則訊息裡四種符號各出現 5、3、2、2 次。下面這段程式每一輪把最小的兩個換到最後兩格、合成一個，把每次合併的和加起來，就是霍夫曼編碼編完一共幾個位元。它印出什麼？',
        code: {
          c: `int counts[] = {5, 3, 2, 2};
int n = 4, total = 0;
while (n > 1) {
    for (int k = 0; k < 2; k++) {
        int small = 0;
        for (int i = 1; i < n - k; i++) {
            if (counts[i] < counts[small]) {
                small = i;
            }
        }
        int t = counts[small];
        counts[small] = counts[n - 1 - k];
        counts[n - 1 - k] = t;
    }
    counts[n - 2] += counts[n - 1];
    total += counts[n - 2];
    n -= 1;
}
printf("%d\\n", total);`,
          cpp: `std::vector<int> counts = {5, 3, 2, 2};
int n = 4, total = 0;
while (n > 1) {
    for (int k = 0; k < 2; k++) {
        int small = 0;
        for (int i = 1; i < n - k; i++) {
            if (counts[i] < counts[small]) {
                small = i;
            }
        }
        std::swap(counts[small], counts[n - 1 - k]);
    }
    counts[n - 2] += counts[n - 1];
    total += counts[n - 2];
    n -= 1;
}
std::cout << total << "\\n";`,
          java: `int[] counts = {5, 3, 2, 2};
int n = 4, total = 0;
while (n > 1) {
    for (int k = 0; k < 2; k++) {
        int small = 0;
        for (int i = 1; i < n - k; i++) {
            if (counts[i] < counts[small]) {
                small = i;
            }
        }
        int t = counts[small];
        counts[small] = counts[n - 1 - k];
        counts[n - 1 - k] = t;
    }
    counts[n - 2] += counts[n - 1];
    total += counts[n - 2];
    n -= 1;
}
System.out.println(total);`,
          python: `counts = [5, 3, 2, 2]
n, total = 4, 0
while n > 1:
    for k in range(2):
        small = 0
        for i in range(1, n - k):
            if counts[i] < counts[small]:
                small = i
        counts[small], counts[n - 1 - k] = counts[n - 1 - k], counts[small]
    counts[n - 2] += counts[n - 1]
    total += counts[n - 2]
    n -= 1
print(total)`,
        },
        options: ['12', '23', '24', '30'],
        answer: 1,
        why: '第一輪合最小的兩個 2 + 2 = 4，剩下 5、3、4；第二輪合 3 + 4 = 7，剩下 5、7；第三輪合 5 + 7 = 12。三次合併的和加起來是 4 + 7 + 12 = 23。12 是只看最後一次合併：那是訊息一共有幾個字，不是幾個位元。24 是每個符號都用 2 個位元的固定長度：12 個字 × 2。30 是照陣列的順序從頭合，沒有挑最小的兩個：5 + 3 = 8、8 + 2 = 10、10 + 2 = 12，加起來比 23 多。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int counts[] = {5, 3, 2, 2};
    int n = 4, total = 0;
    while (n > 1) {
        for (int k = 0; k < 2; k++) {
            int small = 0;
            for (int i = 1; i < n - k; i++) {
                if (counts[i] < counts[small]) {
                    small = i;
                }
            }
            int t = counts[small];
            counts[small] = counts[n - 1 - k];
            counts[n - 1 - k] = t;
        }
        counts[n - 2] += counts[n - 1];
        total += counts[n - 2];
        n -= 1;
    }
    printf("%d\\n", total);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <utility>
#include <vector>
int main() {
    std::vector<int> counts = {5, 3, 2, 2};
    int n = 4, total = 0;
    while (n > 1) {
        for (int k = 0; k < 2; k++) {
            int small = 0;
            for (int i = 1; i < n - k; i++) {
                if (counts[i] < counts[small]) {
                    small = i;
                }
            }
            std::swap(counts[small], counts[n - 1 - k]);
        }
        counts[n - 2] += counts[n - 1];
        total += counts[n - 2];
        n -= 1;
    }
    std::cout << total << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] counts = {5, 3, 2, 2};
        int n = 4, total = 0;
        while (n > 1) {
            for (int k = 0; k < 2; k++) {
                int small = 0;
                for (int i = 1; i < n - k; i++) {
                    if (counts[i] < counts[small]) {
                        small = i;
                    }
                }
                int t = counts[small];
                counts[small] = counts[n - 1 - k];
                counts[n - 1 - k] = t;
            }
            counts[n - 2] += counts[n - 1];
            total += counts[n - 2];
            n -= 1;
        }
        System.out.println(total);
    }
}
`,
          python: `counts = [5, 3, 2, 2]
n, total = 4, 0
while n > 1:
    for k in range(2):
        small = 0
        for i in range(1, n - k):
            if counts[i] < counts[small]:
                small = i
        counts[small], counts[n - 1 - k] = counts[n - 1 - k], counts[small]
    counts[n - 2] += counts[n - 1]
    total += counts[n - 2]
    n -= 1
print(total)
`,
        },
        output: '23',
      },
      {
        kind: '程式測試與除錯',
        prompt: '這一頁那則訊息的五種符號出現 7、4、2、1、1 次，霍夫曼編碼編完應該是 29 個位元，下面這段程式卻印出 53。要怎麼改？',
        code: {
          c: `int counts[] = {7, 4, 2, 1, 1};
int n = 5, total = 0;
while (n > 1) {
    for (int k = 0; k < 2; k++) {
        int pick = 0;
        for (int i = 1; i < n - k; i++) {
            if (counts[i] > counts[pick]) {
                pick = i;
            }
        }
        int t = counts[pick];
        counts[pick] = counts[n - 1 - k];
        counts[n - 1 - k] = t;
    }
    counts[n - 2] += counts[n - 1];
    total += counts[n - 2];
    n -= 1;
}
printf("%d\\n", total);`,
          cpp: `std::vector<int> counts = {7, 4, 2, 1, 1};
int n = 5, total = 0;
while (n > 1) {
    for (int k = 0; k < 2; k++) {
        int pick = 0;
        for (int i = 1; i < n - k; i++) {
            if (counts[i] > counts[pick]) {
                pick = i;
            }
        }
        std::swap(counts[pick], counts[n - 1 - k]);
    }
    counts[n - 2] += counts[n - 1];
    total += counts[n - 2];
    n -= 1;
}
std::cout << total << "\\n";`,
          java: `int[] counts = {7, 4, 2, 1, 1};
int n = 5, total = 0;
while (n > 1) {
    for (int k = 0; k < 2; k++) {
        int pick = 0;
        for (int i = 1; i < n - k; i++) {
            if (counts[i] > counts[pick]) {
                pick = i;
            }
        }
        int t = counts[pick];
        counts[pick] = counts[n - 1 - k];
        counts[n - 1 - k] = t;
    }
    counts[n - 2] += counts[n - 1];
    total += counts[n - 2];
    n -= 1;
}
System.out.println(total);`,
          python: `counts = [7, 4, 2, 1, 1]
n, total = 5, 0
while n > 1:
    for k in range(2):
        pick = 0
        for i in range(1, n - k):
            if counts[i] > counts[pick]:
                pick = i
        counts[pick], counts[n - 1 - k] = counts[n - 1 - k], counts[pick]
    counts[n - 2] += counts[n - 1]
    total += counts[n - 2]
    n -= 1
print(total)`,
        },
        options: ['先把 counts 照小到大排好，再跑同一段程式', '把 total += counts[n - 2] 改成 total += counts[n - 1]', '把 counts[i] > counts[pick] 改成 counts[i] < counts[pick]', '把 while 的條件 n > 1 改成 n > 2'],
        answer: 2,
        why: '比較寫成 >，每一輪換到最後兩格的是最大的兩個：7 + 4 = 11、11 + 2 = 13、13 + 1 = 14、14 + 1 = 15，加起來 53，比固定長度的 45 個位元還多。最常出現的 A 最早被合進去，掉到樹的最深處，代碼反而最長。改成 < 就是每次合最小的兩個：2 + 4 + 8 + 15 = 29。先排序沒有用：程式每一輪都自己重新找，資料怎麼排，找到的都是最大的兩個，一樣印出 53。改成加 counts[n - 1] 的話，加的是合併前最大的那一個、不是合起來的和，印出 45，而且挑的還是最大的兩個。while 改成 n > 2 只是少合最後一次，印出 38，最後剩兩個節點沒合成一棵樹。',
        program: {
          c: `#include <stdio.h>
int main(void) {
    int counts[] = {7, 4, 2, 1, 1};
    int n = 5, total = 0;
    while (n > 1) {
        for (int k = 0; k < 2; k++) {
            int pick = 0;
            for (int i = 1; i < n - k; i++) {
                if (counts[i] > counts[pick]) {
                    pick = i;
                }
            }
            int t = counts[pick];
            counts[pick] = counts[n - 1 - k];
            counts[n - 1 - k] = t;
        }
        counts[n - 2] += counts[n - 1];
        total += counts[n - 2];
        n -= 1;
    }
    printf("%d\\n", total);
    return 0;
}
`,
          cpp: `#include <iostream>
#include <utility>
#include <vector>
int main() {
    std::vector<int> counts = {7, 4, 2, 1, 1};
    int n = 5, total = 0;
    while (n > 1) {
        for (int k = 0; k < 2; k++) {
            int pick = 0;
            for (int i = 1; i < n - k; i++) {
                if (counts[i] > counts[pick]) {
                    pick = i;
                }
            }
            std::swap(counts[pick], counts[n - 1 - k]);
        }
        counts[n - 2] += counts[n - 1];
        total += counts[n - 2];
        n -= 1;
    }
    std::cout << total << "\\n";
}
`,
          java: `public class Main {
    public static void main(String[] args) {
        int[] counts = {7, 4, 2, 1, 1};
        int n = 5, total = 0;
        while (n > 1) {
            for (int k = 0; k < 2; k++) {
                int pick = 0;
                for (int i = 1; i < n - k; i++) {
                    if (counts[i] > counts[pick]) {
                        pick = i;
                    }
                }
                int t = counts[pick];
                counts[pick] = counts[n - 1 - k];
                counts[n - 1 - k] = t;
            }
            counts[n - 2] += counts[n - 1];
            total += counts[n - 2];
            n -= 1;
        }
        System.out.println(total);
    }
}
`,
          python: `counts = [7, 4, 2, 1, 1]
n, total = 5, 0
while n > 1:
    for k in range(2):
        pick = 0
        for i in range(1, n - k):
            if counts[i] > counts[pick]:
                pick = i
        counts[pick], counts[n - 1 - k] = counts[n - 1 - k], counts[pick]
    counts[n - 2] += counts[n - 1]
    total += counts[n - 2]
    n -= 1
print(total)
`,
        },
        output: '53',
      },
    ],
    // 課外補充：考試範圍外、知道了更順手的延伸
    extra: [
      'zip 用的 DEFLATE 分兩步：先找出重複出現的片段，換成「往回幾個字、抄幾個字」（LZ77）；剩下的符號再用霍夫曼編碼。開場那份報告少掉的一半，兩步都有功勞。',
    ],
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('algorithms', 'huffman', page);
})(typeof window !== 'undefined' ? window : globalThis);
