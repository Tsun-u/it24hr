// classroom/hashing.js — 小教室「Hashing 雜湊」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 這頁固定的雜湊表：7 格、h(k) = k % 7，碰撞用鏈結法接在那一格串列的後面
  const SIZE = 7;
  const INSERTS = [15, 22, 30, 8, 10, 3, 17];
  const FINDS = [8, 4];
  const hash = (key) => key % SIZE;

  // 畫圖的尺寸：七格由上往下排成一欄（底下就是陣列），每格的串列往右接；寬度抓最長的串列（3 個節點）
  const ROW_H = 24, CELL_W = 20, VAL_W = 24, PTR_W = 10, NODE_H = 18, GAP = 14;
  const CELL_X = 22, CHAIN_X = CELL_X + CELL_W + GAP, NODE_STEP = VAL_W + PTR_W + GAP;
  const LONGEST = Math.max(...INSERTS.map(k => INSERTS.filter(x => hash(x) === hash(k)).length));
  const SANDBOX_SCALE = 1.4;
  const NULL_INK = '#9aa0a8';   // null 的斜線用淡灰，空格子多的時候才不會搶走串列的注意力

  const page = {
    analogy: '照學號尾數分的置物櫃：看尾數就知道在哪一格，尾數一樣的只好擠同一格。',
    summary: '下次照學號尾數找置物櫃，你就知道：那是一張雜湊表，看尾數就知道在哪一格，尾數一樣的只好擠同一格。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['insert', 'insert', 'insert', 'insert', 'find'],
    uses: [
      '用名字查電話、報手機號碼查會員點數：這種「拿一個鍵（key）去查一筆資料」的事，最常交給雜湊表，存了幾萬筆，查一次還是差不多快。',
      '寫程式最常用的「字典」：Python 的 dict、set，JavaScript 的 Map、Set，Java 的 HashMap、HashSet，C++ 的 unordered_map、unordered_set，都是雜湊表；判斷一個值出現過沒有、把重複的去掉，也是靠它。',
      { text: '資料庫的雜湊索引、網站的快取（cache）：拿帳號、網址當鍵，直接算出資料放在哪，不用整張表掃一遍。（資料庫更常用的索引是 B 樹。）', see: 'b_tree' },
      '下載頁面上那串 SHA-256：雜湊函數也能把整個檔案算成一串固定長度的「指紋」，下載完自己再算一次，對得上就代表檔案沒壞、沒被動過；Git 也是用雜湊值替每一次 commit 取名字。',
    ],
    concept: [
      '雜湊表（hash table）底下是一個陣列，每一格叫一個桶（bucket）。放資料時，把它的鍵（key）丟進雜湊函數（hash function）算出一個數，叫雜湊值（hash value），當作格號直接放進那一格；找的時候再算一次，直接去那一格看。學號尾數就是一種雜湊函數：h(k) = k % 10。這頁的沙盒用 h(k) = k % 7，15 除以 7 餘 1，就放 1 號格。',
      '這跟陣列頁「知道索引就直接算出位置」是同一招，只是索引從鍵算出來，所以不管存了多少筆，平均找一次都是 O(1)，不用像鏈結串列從頭一個一個走。代價是格子比可能的鍵少得多，不同的鍵難免算到同一格，這叫碰撞（collision）：22 除以 7 也餘 1，跟 15 撞在一起。好的雜湊函數會把鍵撒得很平均，但碰撞沒辦法完全避免，一定要有處理的辦法。',
      '處理碰撞有兩大派。鏈結法（chaining）：每一格接一條鏈結串列，撞在一起的串在同一條，找的時候只要比這一條；這頁的沙盒就是這種，照放進來的順序接在後面。開放定址（open addressing）：一格只放一個，撞到了就照規則往別格找空位，最簡單的是線性探測（linear probing）——看下一格、再下一格，到最後一格就繞回 0 號格；找的時候也照同一條路線找，碰到空格才算找不到。',
      '負載因子（load factor）α = 裝了幾個 ÷ 格數，就是表有多滿。α 越高碰撞越多，串列越長、探測越久；所以表太滿時要擴大：換一個更大的陣列，每一筆用新的格數重新算位置搬過去，叫重新雜湊（rehashing）。像 Java 的 HashMap，α 超過 0.75 就擴大成兩倍。搬一次是 O(n)，但很久才搬一次，平均下來插入還是 O(1)，跟陣列頁那個會自己長大的陣列同一個道理。',
    ],
    complexity: [
      ['插入 insert（平均）', 'O(1)'],
      ['插入 insert（最差：全部撞在同一格）', 'O(n)'],
      ['搜尋 find（平均）', 'O(1)'],
      ['搜尋 find（最差：全部撞在同一格）', 'O(n)'],
      ['刪除 delete（平均）', 'O(1)'],
      ['刪除 delete（最差：全部撞在同一格）', 'O(n)'],
      ['擴大、重新雜湊 rehash（搬一次）', 'O(n)'],
    ],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: '雜湊表找東西一定是 O(1)', right: 'O(1) 是平均。最差的情況是全部撞進同一格：這頁如果放的都是 7 的倍數（7、14、21…），會全擠在 0 號格的串列裡，找一個要從頭比到尾，變成 O(n)。所以雜湊函數要把鍵撒得平均、表太滿要擴大。' },
      { wrong: '雜湊表裡的東西會照放進去的順序（或照大小）排好', right: '位置是算出來的，跟先後、大小都無關：這頁依序放 15、22、30、8、10、3、17，從 0 號格讀到 6 號格是 15 22 8 30 10 3 17，兩種順序都不是。Java 的 HashMap、C++ 的 unordered_map 走訪順序沒有保證；Python 的 dict（3.7 起）、JavaScript 的 Map 會照放進去的順序，那是另外記了順序。要照大小排，用 Java 的 TreeMap、C++ 的 std::map（底下是樹）。' },
      { wrong: '表的大小隨便取都一樣', right: '用除法 h(k) = k % m 時，m 最好取質數。如果鍵都是偶數、m 取 10，就只會落在 0、2、4、6、8 號格，一半的格子空著、另一半擠得更兇；m 取 7 這種質數就會撒到每一格。（Java 的 HashMap 用 2 的次方當大小，是先把雜湊值打散過再取餘數。）' },
      { wrong: 'k % m 算出來一定是 0 到 m − 1', right: '要看語言。Java、C++、JavaScript 的負數取餘數會是負的（-3 % 7 是 -3），拿去當格號就越界；Python 的 -3 % 7 是 4。鍵可能是負數時，要寫成 ((k % m) + m) % m，Java 也可以用 Math.floorMod(k, m)。' },
      { wrong: '雜湊就是加密', right: '加密可以用金鑰解回原文；雜湊是單向的，算出來的值回推不出原本的資料（很多不同的資料還會算出同一個值）。網站存密碼存的是雜湊值，登入時把你輸入的再算一次、比對對不對得上，資料庫裡不放原本的密碼。' },
      { wrong: '負載因子最多是 1，每一格都有東西就放不下了', right: '要看怎麼處理碰撞。開放定址一格只放一個，α 最多是 1；鏈結法可以一直往串列後面接，7 格放 14 個，α 就是 2，放得下，只是串列越長越慢。' },
      { wrong: '開放定址刪掉一筆，把那格清空就好', right: '後面的會找不到。用線性探測放 15、22：15 放 1 號格，22 撞到就往下放 2 號格。這時把 15 刪掉、1 號格清空，再找 22，算到 1 號格看到空的，就以為沒有。所以刪除要在那格留一個「刪除過」的記號（tombstone），找的時候跳過它繼續往下找，插入時可以再拿來用。' },
    ],
    code: {
      python: {
        builtin: `# 內建的 set、dict 底下就是雜湊表（set 只存鍵，dict 存「鍵 → 值」）
table = set()
for x in [15, 22, 30, 8]:
    table.add(x)


def yes_no(found):
    return "yes" if found else "no"


print(yes_no(8 in table), yes_no(4 in table), len(table))
`,
        handmade: `# 自己刻：大小 7 的雜湊表，h(k) = k % 7，碰撞用鏈結法（每一格接一條串列）
SIZE = 7


class Node:
    def __init__(self, key):
        self.key = key
        self.next = None


class HashTable:
    def __init__(self):
        self.buckets = [None] * SIZE  # 每一格放那條串列的第一個節點
        self.count = 0

    def index_of(self, key):
        return key % SIZE

    def insert(self, key):
        node = Node(key)
        i = self.index_of(key)
        if self.buckets[i] is None:
            self.buckets[i] = node
        else:
            last = self.buckets[i]
            while last.next is not None:  # 碰撞：走到這一格串列的最後面接上去
                last = last.next
            last.next = node
        self.count += 1

    def find(self, key):
        node = self.buckets[self.index_of(key)]  # 算出格號直接過去，只比這一格的串列
        while node is not None:
            if node.key == key:
                return True
            node = node.next
        return False


def yes_no(found):
    return "yes" if found else "no"


table = HashTable()
for x in [15, 22, 30, 8]:
    table.insert(x)
print(yes_no(table.find(8)), yes_no(table.find(4)), table.count)
`,
      },
      js: {
        builtin: `// 內建的 Set、Map 底下就是雜湊表（Set 只存鍵，Map 存「鍵 → 值」）
const table = new Set();
for (const x of [15, 22, 30, 8]) table.add(x);

const yesNo = (found) => (found ? 'yes' : 'no');
console.log(yesNo(table.has(8)), yesNo(table.has(4)), table.size);
`,
        handmade: `// 自己刻：大小 7 的雜湊表，h(k) = k % 7，碰撞用鏈結法（每一格接一條串列）
const SIZE = 7;

class Node {
  constructor(key) {
    this.key = key;
    this.next = null;
  }
}

class HashTable {
  constructor() {
    this.buckets = new Array(SIZE).fill(null); // 每一格放那條串列的第一個節點
    this.count = 0;
  }
  indexOf(key) {
    return key % SIZE;
  }
  insert(key) {
    const node = new Node(key);
    const i = this.indexOf(key);
    if (this.buckets[i] === null) {
      this.buckets[i] = node;
    } else {
      let last = this.buckets[i];
      while (last.next !== null) last = last.next; // 碰撞：走到這一格串列的最後面接上去
      last.next = node;
    }
    this.count++;
  }
  find(key) {
    // 算出格號直接過去，只比這一格的串列
    for (let node = this.buckets[this.indexOf(key)]; node !== null; node = node.next) {
      if (node.key === key) return true;
    }
    return false;
  }
}

const yesNo = (found) => (found ? 'yes' : 'no');
const table = new HashTable();
for (const x of [15, 22, 30, 8]) table.insert(x);
console.log(yesNo(table.find(8)), yesNo(table.find(4)), table.count);
`,
      },
      java: {
        builtin: `// 內建的 HashSet、HashMap 底下就是雜湊表（HashSet 只存鍵，HashMap 存「鍵 → 值」）
import java.util.HashSet;
import java.util.Set;

public class Main {
    static String yesNo(boolean found) {
        return found ? "yes" : "no";
    }

    public static void main(String[] args) {
        Set<Integer> table = new HashSet<>();
        for (int x : new int[] {15, 22, 30, 8}) table.add(x);
        System.out.println(yesNo(table.contains(8)) + " " + yesNo(table.contains(4)) + " " + table.size());
    }
}
`,
        handmade: `// 自己刻：大小 7 的雜湊表，h(k) = k % 7，碰撞用鏈結法（每一格接一條串列）
public class Main {
    static final int SIZE = 7;

    static class Node {
        int key;
        Node next;

        Node(int key) {
            this.key = key;
        }
    }

    static class HashTable {
        private final Node[] buckets = new Node[SIZE]; // 每一格放那條串列的第一個節點
        private int count = 0;

        int indexOf(int key) {
            return key % SIZE;
        }

        void insert(int key) {
            Node node = new Node(key);
            int i = indexOf(key);
            if (buckets[i] == null) {
                buckets[i] = node;
            } else {
                Node last = buckets[i];
                while (last.next != null) last = last.next; // 碰撞：走到這一格串列的最後面接上去
                last.next = node;
            }
            count++;
        }

        boolean find(int key) {
            // 算出格號直接過去，只比這一格的串列
            for (Node node = buckets[indexOf(key)]; node != null; node = node.next) {
                if (node.key == key) return true;
            }
            return false;
        }

        int size() {
            return count;
        }
    }

    static String yesNo(boolean found) {
        return found ? "yes" : "no";
    }

    public static void main(String[] args) {
        HashTable table = new HashTable();
        for (int x : new int[] {15, 22, 30, 8}) table.insert(x);
        System.out.println(yesNo(table.find(8)) + " " + yesNo(table.find(4)) + " " + table.size());
    }
}
`,
      },
      cpp: {
        builtin: `// 內建的 unordered_set、unordered_map 底下就是雜湊表（unordered_set 只存鍵，unordered_map 存「鍵 → 值」）
#include <iostream>
#include <unordered_set>

const char* yesNo(bool found) { return found ? "yes" : "no"; }

int main() {
    std::unordered_set<int> table;
    for (int x : {15, 22, 30, 8}) table.insert(x);
    std::cout << yesNo(table.count(8)) << " " << yesNo(table.count(4)) << " " << table.size() << "\\n";
}
`,
        handmade: `// 自己刻：大小 7 的雜湊表，h(k) = k % 7，碰撞用鏈結法（每一格接一條串列）
#include <iostream>

const int SIZE = 7;

struct Node {
    int key;
    Node* next;
};

class HashTable {
    Node* buckets[SIZE] = {}; // 每一格放那條串列的第一個節點，一開始都是 nullptr
    int count = 0;

public:
    int indexOf(int key) const { return key % SIZE; }
    void insert(int key) {
        Node* node = new Node{key, nullptr};
        int i = indexOf(key);
        if (!buckets[i]) {
            buckets[i] = node;
        } else {
            Node* last = buckets[i];
            while (last->next) last = last->next; // 碰撞：走到這一格串列的最後面接上去
            last->next = node;
        }
        count++;
    }
    bool find(int key) const {
        // 算出格號直接過去，只比這一格的串列
        for (Node* node = buckets[indexOf(key)]; node; node = node->next) {
            if (node->key == key) return true;
        }
        return false;
    }
    int size() const { return count; }
};

const char* yesNo(bool found) { return found ? "yes" : "no"; }

int main() {
    HashTable table;
    for (int x : {15, 22, 30, 8}) table.insert(x);
    std::cout << yesNo(table.find(8)) << " " << yesNo(table.find(4)) << " " << table.size() << "\\n";
}
`,
      },
      output: 'yes no 4',
    },
    // 沙盒：插入照 INSERTS 依序放，七個放完再按是錯誤；搜尋照 FINDS 輪流找，找完一輪從頭。
    // 這一步的紀錄：op 插入或搜尋、key 哪個數、slot 算到第幾格、compared 搜尋時比了幾個節點、found 有沒有找到
    sandbox: {
      ops: [{ op: 'insert', label: '插入下一個 insert' }, { op: 'find', label: '搜尋下一個 find' }],
      errors: { allInserted: '七個數都插完了，負載因子 7 / 7 = 1。真的雜湊表不會等到這麼滿，像 Java 的 HashMap 超過 0.75 就擴大、重新雜湊。' },
      init() { return { table: Array.from({ length: SIZE }, () => []), nextFind: 0, op: null, key: null, slot: null, compared: 0, found: null, error: null }; },
      apply(s, op) {
        const quiet = { op: null, key: null, slot: null, compared: 0, found: null, error: null };
        if (op === 'insert') {
          const inserted = s.table.flat().length;
          if (inserted === INSERTS.length) return { ...s, ...quiet, error: 'allInserted' };
          const key = INSERTS[inserted], slot = hash(key);
          const table = s.table.map((chain, i) => (i === slot ? [...chain, key] : chain));
          return { ...s, ...quiet, table, op, key, slot };
        }
        const key = FINDS[s.nextFind], slot = hash(key), chain = s.table[slot];
        const at = chain.indexOf(key);
        return { ...s, ...quiet, nextFind: (s.nextFind + 1) % FINDS.length, op, key, slot, compared: at === -1 ? chain.length : at + 1, found: at !== -1 };
      },
      label(op, s) {
        if (op === 'insert') return `insert(${s.key})：${s.key} % ${SIZE} = ${s.slot}${s.table[s.slot].length > 1 ? '，碰撞，接在後面' : ''}`;
        if (!s.compared) return `find(${s.key})：${s.slot} 號格是空的，找不到`;
        return `find(${s.key})：${s.slot} 號格，比了 ${s.compared} 次${s.found ? '找到' : '，找不到'}`;
      },
    },
    // 左邊一欄是 0～6 號格，格子裡的點是指向那條串列第一個節點的指標；節點是「值｜指標」兩格，指標格畫斜線代表 null。
    // 這一步算到的格子和新放的節點上黃色；搜尋時比過的節點畫虛線框，找到的那個上黃色。
    // 底下寫負載因子；沙盒上面多一行下一個要插入、要找的數，整張放大 1.4 倍
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { table, nextFind, op, slot, compared, found }, { sandbox = false } = {}) {
      const top = sandbox ? 24 : 6, w = CHAIN_X + LONGEST * NODE_STEP - GAP + 6, hgt = top + SIZE * ROW_H + 24;
      const s = svgEl(w, hgt); const rc = rough.svg(s);
      if (sandbox) { s.setAttribute('width', Math.round(w * SANDBOX_SCALE)); s.setAttribute('height', Math.round(hgt * SANDBOX_SCALE)); }
      const thin = { stroke: INK, strokeWidth: 1.2, roughness: 0.5 };
      const filled = (fill) => ({ fill, fillStyle: 'hachure', hachureGap: 5 });
      // 指標格：有下一個就畫點和箭頭指到 nextX，沒有就畫斜線（null）
      const pointer = (x, y, cellW, cellH, nextX, seed) => {
        const cy = y + cellH / 2;
        if (nextX === null) { s.append(rc.line(x + 3, y + cellH - 3, x + cellW - 3, y + 3, { ...thin, stroke: NULL_INK, strokeWidth: 1, seed })); return; }
        s.append(rc.circle(x + cellW / 2, cy, 4, { stroke: INK, fill: INK, fillStyle: 'solid', roughness: 0.3, seed }));
        s.append(rc.line(x + cellW / 2 + 2, cy, nextX - 1, cy, { ...thin, seed: seed + 1 }));
        s.append(rc.linearPath([[nextX - 6, cy - 3.5], [nextX - 1, cy], [nextX - 6, cy + 3.5]], { ...thin, seed: seed + 2 }));
      };

      table.forEach((chain, i) => {
        const y = top + i * ROW_H, mid = y + ROW_H / 2, touched = i === slot;
        svgText(s, CELL_X - 10, mid, String(i), 11);
        s.append(rc.rectangle(CELL_X, y, CELL_W, ROW_H, { stroke: INK, roughness: 1, seed: 200 + i, ...(touched ? filled(NEW) : {}) }));
        pointer(CELL_X, y, CELL_W, ROW_H, chain.length ? CHAIN_X : null, 210 + i * 3);
        // seed 跟著值走：同一個節點在每一格長得一樣
        chain.forEach((key, j) => {
          const x = CHAIN_X + j * NODE_STEP, ny = mid - NODE_H / 2, seed = 1000 + key * 4;
          const isNew = touched && ((op === 'insert' && j === chain.length - 1) || (op === 'find' && found && j === compared - 1));
          const dashed = touched && op === 'find' && j < compared ? { strokeLineDash: [4, 3], disableMultiStroke: true } : {};
          s.append(rc.rectangle(x, ny, VAL_W, NODE_H, { stroke: INK, roughness: 1, seed, ...filled(isNew ? NEW : FILL), ...dashed }));
          s.append(rc.rectangle(x + VAL_W, ny, PTR_W, NODE_H, { stroke: INK, roughness: 1, seed: seed + 1, ...dashed }));
          svgText(s, x + VAL_W / 2, mid, String(key), 12);
          pointer(x + VAL_W, ny, PTR_W, NODE_H, j < chain.length - 1 ? x + NODE_STEP : null, seed + 2);
        });
      });

      const count = table.flat().length;
      svgText(s, w / 2, hgt - 10, `負載因子 α = ${count} / ${SIZE}`, 11);
      if (sandbox) {
        const nextInsert = count < INSERTS.length ? `下一個插入：${INSERTS[count]}` : '七個數都插完了';
        svgText(s, w / 2, 11, `${nextInsert}　下一個要找：${FINDS[nextFind]}`, 11);
      }
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('ds', 'hashing', page);
})(typeof window !== 'undefined' ? window : globalThis);
