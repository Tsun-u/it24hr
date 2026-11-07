// classroom/b_tree.js — 小教室「B-Tree B 樹」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 3 階 B 樹（2-3 樹）：一個節點最多 ORDER − 1 = 2 個鍵、ORDER = 3 個孩子
  const ORDER = 3;
  // 沙盒依序放進的七個數，由小到大放完是三層；「找」固定找 TARGET
  const SEEDS = [10, 20, 30, 40, 50, 60, 70];
  const TARGET = 60;

  // 節點是 { keys, kids }：keys 由小到大，葉子的 kids 是空的，不是葉子的話 kids 比 keys 多一個。
  // x 該插在第幾格、也是該往第幾個孩子走：前面有幾個鍵比 x 小
  const slot = (node, x) => node.keys.filter(k => k < x).length;
  const insertAt = (arr, i, v) => [...arr.slice(0, i), v, ...arr.slice(i)];
  const keysText = (keys) => `[${keys.join(' ')}]`;

  // 把 x 放進以 node 為根的子樹，沿路的節點複製一份再改，舊的樹不動。
  // 沒拆回傳 { node }；塞到 ORDER 個鍵就從中間拆開，回傳 { up, left, right }，並把這次拆開記進 splits
  function put(node, x, splits) {
    const i = slot(node, x);
    let keys = node.keys, kids = node.kids;
    if (!kids.length) keys = insertAt(keys, i, x);   // 新的鍵一律放進葉子
    else {
      const r = put(kids[i], x, splits);
      if (r.node) kids = kids.map((k, j) => (j === i ? r.node : k));
      else {                                          // 孩子拆成兩半：升上來的鍵插在第 i 格，兩半接在它左右
        keys = insertAt(keys, i, r.up);
        kids = [...kids.slice(0, i), r.left, r.right, ...kids.slice(i + 1)];
      }
    }
    if (keys.length < ORDER) return { node: { keys, kids } };
    const mid = Math.floor(keys.length / 2);
    const left = { keys: keys.slice(0, mid), kids: kids.slice(0, mid + 1) };
    const right = { keys: keys.slice(mid + 1), kids: kids.slice(mid + 1) };
    splits.push({ full: keys, up: keys[mid], left: left.keys, right: right.keys });
    return { up: keys[mid], left, right };
  }
  // 回傳新的樹、這一步依序拆開的節點、根有沒有拆（根拆了，升上去的鍵當新的根，樹長高一層）
  function insert(tree, x) {
    if (!tree) return { tree: { keys: [x], kids: [] }, splits: [], grew: false };
    const splits = [];
    const r = put(tree, x, splits);
    if (r.node) return { tree: r.node, splits, grew: false };
    return { tree: { keys: [r.up], kids: [r.left, r.right] }, splits, grew: true };
  }
  // 從根往下找 x：path 是一路比過的節點（寫成它的鍵）、turns 是每一步往第幾個孩子走
  function search(tree, x) {
    const path = [], turns = [];
    let node = tree;
    for (;;) {
      path.push(node.keys);
      if (node.keys.includes(x)) return { path, turns, found: true };
      if (!node.kids.length) return { path, turns, found: false };
      const i = slot(node, x);
      turns.push(i);
      node = node.kids[i];
    }
  }
  const turnText = (keyCount, i) => (i === 0 ? '往左' : i === keyCount ? '往右' : '往中間');

  // 每個節點畫在哪：葉子由左到右一個接一個排，上面的節點擺在自己那排孩子的正中間；
  // 換一個爸爸的葉子之前多空半個間距，看得出誰跟誰是兄弟
  function layout(tree, cell, gap) {
    const boxes = [];
    let cursor = 0;
    const place = (node, depth) => {
      const w = node.keys.length * cell;
      const kids = node.kids.map(k => place(k, depth + 1));
      let x;
      if (kids.length) { x = (kids[0].x + kids.at(-1).x + kids.at(-1).w - w) / 2; cursor += gap / 2; }
      else { x = cursor; cursor += w + gap; }
      const box = { keys: node.keys, depth, x, w, kids };
      boxes.push(box);
      return box;
    };
    place(tree, 0);
    return boxes;
  }
  // 箭頭：一條虛線＋兩撇箭頭，從 from 指到 to
  function arrow(INK, svg, rc, [x1, y1], [x2, y2], seed) {
    const angle = Math.atan2(y2 - y1, x2 - x1), head = 5;
    const wing = (turn) => [x2 - head * Math.cos(angle + turn), y2 - head * Math.sin(angle + turn)];
    svg.append(
      rc.line(x1, y1, x2, y2, { stroke: INK, strokeWidth: 1.4, strokeLineDash: [3, 2], roughness: 0.4, disableMultiStroke: true, seed }),
      rc.linearPath([wing(0.6), [x2, y2], wing(-0.6)], { stroke: INK, strokeWidth: 1.4, roughness: 0.4, seed: seed + 1 }),
    );
  }

  const page = {
    analogy: '圖書館的目錄抽屜：一個抽屜放好幾張卡片，塞滿了就從中間拆成兩個。',
    summary: '下次在圖書館拉開目錄抽屜、在網路商店一下子就查到訂單，你就知道：那是一棵 B 樹，一個抽屜放好幾張卡片，塞滿了就從中間拆成兩個。',   // 總結：呼應開頭的比喻
    frames: ['insert', 'insert', 'insert', 'insert', 'insert', 'insert', 'insert'],
    uses: [
      '網路商店查訂單、銀行 App 查交易紀錄：幾千萬筆資料裡輸入編號，一下子就跳出來，靠的是資料庫替這個欄位建的索引（index）。',
      '資料庫的索引：MySQL（InnoDB）、PostgreSQL、SQLite 建索引預設用的都是 B 樹這一家，多半是 B+ 樹。一個節點放幾百個鍵，一百萬筆資料從根往下讀三四個節點就找到。',
      '電腦的檔案系統：Windows 的 NTFS、macOS 的 APFS 都用 B 樹這一家記住資料夾裡有哪些檔案；Linux 的 Btrfs，名字就是 B-tree file system。',
      { text: '範圍查詢：「價格在 100 到 500 之間的商品」。雜湊索引把鍵打散了，只能整張表掃過一遍；B+ 樹的葉子照順序串成一條，找到 100 就沿著葉子往右讀到 500 為止。', see: 'hashing' },
    ],
    concept: [
      'B 樹（B-tree）是一個節點可以放好幾個鍵（key）、接好幾個孩子的搜尋樹。節點裡的鍵由小到大排好，k 個鍵把範圍切成 k + 1 段，每一段接一個孩子：比第一個鍵小的往最左邊走，夾在兩個鍵中間的走中間，比最後一個鍵大的往最右邊。找東西就是從根開始，在節點裡比一比、挑一段走下去，走到葉子還沒有就是不在。',
      { text: '為什麼要一個節點放好幾個鍵？資料庫和檔案系統的資料放在硬碟（或 SSD）上，讀一次不是讀一個數，而是讀一整塊（常見 4 KB 到 16 KB），讀一次硬碟又比讀記憶體慢上千倍。讓一個節點剛好佔一整塊、放幾百個鍵，樹就很矮：一百萬筆資料放進平衡的二元搜尋樹至少 20 層，找一筆最多要讀 20 次硬碟；B 樹三四層就到底，節點裡要比幾次都在記憶體裡比，很快。', see: 'tree' },
      'm 階（order m）的 B 樹規定：每個節點最多 m 個孩子、m − 1 個鍵；根以外的節點至少要半滿，不會太空；所有的葉子都在同一層，所以永遠是平衡的。這頁用 3 階：一個節點放 1～2 個鍵、不是葉子的接 2～3 個孩子，又叫 2-3 樹（2-3 tree）。',
      '放進來（insert）：先找到該放的葉子，照大小插進去。超過 m − 1 個鍵就從中間拆開（split）：左半、右半變成兩個節點，正中間那個鍵升上去，插進爸爸裡。爸爸也塞爆了就再拆，一路往上；連根都拆了，升上去的鍵自己當新的根，樹就長高一層。所以 B 樹是從下往上長的，葉子才會永遠在同一層。刪除（delete）反過來：節點太空就跟隔壁的兄弟借一個鍵，借不到就跟兄弟合併；合併到根都空了，樹就矮一層。',
      'B+ 樹（B+ tree）是資料庫最常用的變形：上面的節點只放鍵當路標，資料都放在葉子，葉子再從左到右串成一條，找一段範圍就沿著葉子往右讀。',
    ],
    complexity: [['search 找一個鍵', 'O(log n)'], ['insert 插入（含一路往上拆）', 'O(log n)'], ['delete 刪除（含借鍵、合併）', 'O(log n)'], ['讀硬碟的次數（樹的高度）', 'O(log n)，底數是階數 m']],
    traps: [
      { wrong: 'B 樹的 B 是 binary，B 樹就是一種二元樹', right: '一個節點有好幾個孩子，3 階就最多 3 個，二元樹才是最多 2 個。B 代表什麼，1970 年代初發明它的 Bayer 和 McCreight 沒有定論，常見的猜法是 balanced（平衡）、Bayer 的姓、他們當時工作的波音（Boeing）。' },
      { wrong: '跟二元搜尋樹一樣，新的鍵往下接成新的葉子，樹是往下長的', right: 'B 樹是從下往上長的。新的鍵一律放進現有的葉子，塞爆了就拆開、中間的鍵升上去；要變高只有一個辦法：根也拆了，在最上面多一個新的根。所以葉子永遠在同一層。' },
      { wrong: '照排好的順序插進去，B 樹也會像二元搜尋樹一樣歪成一條', right: '不會，所有的葉子一律在同一層。沙盒照 10、20、…、70 由小到大插，二元搜尋樹會歪成一條 7 層的直線，B 樹插完只有 3 層。' },
      { wrong: '節點塞爆時，升上去的是剛放進來的那個鍵', right: '升上去的是塞爆那個節點正中間的鍵，不一定是新來的。insert(50) 時塞爆的是 [30 40 50]，升上去的是 40，不是 50。' },
      { wrong: 'B 樹找一個鍵比的次數比二元搜尋樹少', right: '比的次數差不多：每一層都要在節點裡找（可以用二分搜尋），加起來一樣是 O(log n)。B 樹省的是讀硬碟的次數：在節點裡比都在記憶體裡、很快，慢的是從硬碟讀下一個節點，而 B 樹的層數少得多。' },
      { wrong: 'B 樹和 B+ 樹是同一個東西', right: 'B 樹每個鍵都帶著資料，在哪一層找到就停；B+ 樹上面的節點只放鍵當路標，資料都在葉子，葉子還串成一條。B+ 樹找什麼都要走到葉子，但範圍查詢、照順序列出來快得多，資料庫索引多半用 B+ 樹。' },
      { wrong: 'm 階的 B 樹，就是一個節點最多放 m 個鍵', right: '常見的定義（Knuth）是最多 m 個孩子、m − 1 個鍵，所以 3 階最多 2 個鍵。CLRS《演算法導論》改用最小分支度 t：根以外的節點有 t − 1 到 2t − 1 個鍵。各本書不同，考試前先看清楚題目用哪一種。' },
    ],
    code: {
      python: {
        builtin: `# 內建的沒有 B 樹，B 樹多半住在資料庫和檔案系統裡，考試要自己刻；最接近的是排好序的串列＋bisect（用二分搜尋找位置）
from bisect import bisect_left, insort

keys = []
for x in range(10, 71, 10):
    insort(keys, x)


def contains(x):
    i = bisect_left(keys, x)              # x 該插在第幾格；那格剛好是 x 才算找到
    return i < len(keys) and keys[i] == x


def yes_no(found):
    return "yes" if found else "no"


print(yes_no(contains(60)), yes_no(contains(35)), len(keys))
`,
        handmade: `M = 3   # 3 階：一個節點最多 M - 1 = 2 個鍵、M = 3 個孩子


class Node:
    def __init__(self, keys, children):
        self.keys = keys            # 由小到大
        self.children = children    # 葉子沒有孩子；不是葉子的話，孩子比鍵多一個


# 前面有幾個鍵比 x 小：x 該插在第幾格，也是要往下走的第幾個孩子
def position(node, x):
    i = 0
    while i < len(node.keys) and node.keys[i] < x:
        i += 1
    return i


class BTree:
    def __init__(self):
        self.root = Node([], [])
        self.size = 0

    def contains(self, x):
        node = self.root
        while True:
            i = position(node, x)
            if i < len(node.keys) and node.keys[i] == x:
                return True
            if not node.children:             # 走到葉子還沒有：不在裡面
                return False
            node = node.children[i]

    def insert(self, x):
        if self.contains(x):                  # 一樣的鍵不重複放
            return
        up = self._insert(self.root, x)
        if up:                                # 根也拆了：升上去的鍵當新的根，樹長高一層
            key, right = up
            self.root = Node([key], [self.root, right])
        self.size += 1

    # 把 x 放進以 node 為根的子樹；node 塞到 M 個鍵就從中間拆開，回傳（升上去的鍵, 右半邊的新節點）
    def _insert(self, node, x):
        i = position(node, x)
        if not node.children:
            node.keys.insert(i, x)            # 新的鍵一律放進葉子
        else:
            up = self._insert(node.children[i], x)
            if up:                            # 孩子拆成兩半：升上來的鍵插在第 i 格，右半邊接在它右邊
                key, right = up
                node.keys.insert(i, key)
                node.children.insert(i + 1, right)
        if len(node.keys) < M:
            return None
        mid = len(node.keys) // 2             # 正中間那個鍵升上去，左半留在原本的節點
        right = Node(node.keys[mid + 1:], node.children[mid + 1:])
        key = node.keys[mid]
        node.keys = node.keys[:mid]
        node.children = node.children[:mid + 1]
        return key, right


def yes_no(found):
    return "yes" if found else "no"


tree = BTree()
for x in range(10, 71, 10):
    tree.insert(x)
print(yes_no(tree.contains(60)), yes_no(tree.contains(35)), tree.size)
`,
      },
      js: {
        builtin: `// 內建的沒有 B 樹，B 樹多半住在資料庫和檔案系統裡，考試要自己刻；最接近的是排好序的陣列（sort 要給比較函式，不然會照字串排）
const keys = [];
for (let x = 10; x <= 70; x += 10) keys.push(x);
keys.sort((a, b) => a - b);
const yesNo = (x) => (keys.includes(x) ? 'yes' : 'no');   // includes 從頭一個一個比
console.log(yesNo(60), yesNo(35), keys.length);
`,
        handmade: `const M = 3;   // 3 階：一個節點最多 M - 1 = 2 個鍵、M = 3 個孩子

class Node {
  constructor(keys = [], children = []) {
    this.keys = keys;           // 由小到大
    this.children = children;   // 葉子沒有孩子；不是葉子的話，孩子比鍵多一個
  }
}

// 前面有幾個鍵比 x 小：x 該插在第幾格，也是要往下走的第幾個孩子
function position(node, x) {
  let i = 0;
  while (i < node.keys.length && node.keys[i] < x) i++;
  return i;
}

class BTree {
  constructor() {
    this.root = new Node();
    this.size = 0;
  }
  contains(x) {
    let node = this.root;
    for (;;) {
      const i = position(node, x);
      if (node.keys[i] === x) return true;
      if (!node.children.length) return false;   // 走到葉子還沒有：不在裡面
      node = node.children[i];
    }
  }
  insert(x) {
    if (this.contains(x)) return;                // 一樣的鍵不重複放
    const up = this.insertInto(this.root, x);
    if (up) this.root = new Node([up.key], [this.root, up.right]);   // 根也拆了：升上去的鍵當新的根，樹長高一層
    this.size++;
  }
  // 把 x 放進以 node 為根的子樹；node 塞到 M 個鍵就從中間拆開，回傳升上去的鍵和右半邊的新節點
  insertInto(node, x) {
    const i = position(node, x);
    if (!node.children.length) node.keys.splice(i, 0, x);   // 新的鍵一律放進葉子
    else {
      const up = this.insertInto(node.children[i], x);
      if (up) {                                             // 孩子拆成兩半：升上來的鍵插在第 i 格，右半邊接在它右邊
        node.keys.splice(i, 0, up.key);
        node.children.splice(i + 1, 0, up.right);
      }
    }
    if (node.keys.length < M) return null;
    const mid = Math.floor(node.keys.length / 2);           // 正中間那個鍵升上去，左半留在原本的節點
    const right = new Node(node.keys.slice(mid + 1), node.children.slice(mid + 1));
    const key = node.keys[mid];
    node.keys = node.keys.slice(0, mid);
    node.children = node.children.slice(0, mid + 1);
    return { key, right };
  }
}

const tree = new BTree();
for (let x = 10; x <= 70; x += 10) tree.insert(x);
const yesNo = (x) => (tree.contains(x) ? 'yes' : 'no');
console.log(yesNo(60), yesNo(35), tree.size);
`,
      },
      java: {
        builtin: `import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        // 內建的沒有 B 樹，B 樹多半住在資料庫和檔案系統裡，考試要自己刻；
        // 最接近的是排好序的集合 TreeSet（底下是前一頁的紅黑樹）
        TreeSet<Integer> keys = new TreeSet<>();
        for (int x = 10; x <= 70; x += 10) keys.add(x);
        System.out.println(yesNo(keys.contains(60)) + " " + yesNo(keys.contains(35)) + " " + keys.size());
    }

    static String yesNo(boolean found) {
        return found ? "yes" : "no";
    }
}
`,
        handmade: `import java.util.ArrayList;
import java.util.List;

public class Main {
    static final int M = 3;   // 3 階：一個節點最多 M - 1 = 2 個鍵、M = 3 個孩子

    static class Node {
        List<Integer> keys = new ArrayList<>();    // 由小到大
        List<Node> children = new ArrayList<>();   // 葉子沒有孩子；不是葉子的話，孩子比鍵多一個

        boolean isLeaf() {
            return children.isEmpty();
        }

        // 前面有幾個鍵比 x 小：x 該插在第幾格，也是要往下走的第幾個孩子
        int position(int x) {
            int i = 0;
            while (i < keys.size() && keys.get(i) < x) i++;
            return i;
        }
    }

    // 節點拆開時升上去的鍵，和右半邊的新節點
    static class Split {
        final int key;
        final Node right;

        Split(int key, Node right) {
            this.key = key;
            this.right = right;
        }
    }

    static class BTree {
        Node root = new Node();
        int size = 0;

        boolean contains(int x) {
            Node node = root;
            while (true) {
                int i = node.position(x);
                if (i < node.keys.size() && node.keys.get(i) == x) return true;
                if (node.isLeaf()) return false;      // 走到葉子還沒有：不在裡面
                node = node.children.get(i);
            }
        }

        void insert(int x) {
            if (contains(x)) return;                  // 一樣的鍵不重複放
            Split up = insertInto(root, x);
            if (up != null) {                         // 根也拆了：升上去的鍵當新的根，樹長高一層
                Node newRoot = new Node();
                newRoot.keys.add(up.key);
                newRoot.children.add(root);
                newRoot.children.add(up.right);
                root = newRoot;
            }
            size++;
        }

        // 把 x 放進以 node 為根的子樹；node 塞到 M 個鍵就從中間拆開，回傳升上去的鍵和右半邊
        Split insertInto(Node node, int x) {
            int i = node.position(x);
            if (node.isLeaf()) node.keys.add(i, x);   // 新的鍵一律放進葉子
            else {
                Split up = insertInto(node.children.get(i), x);
                if (up != null) {                     // 孩子拆成兩半：升上來的鍵插在第 i 格，右半邊接在它右邊
                    node.keys.add(i, up.key);
                    node.children.add(i + 1, up.right);
                }
            }
            if (node.keys.size() < M) return null;
            int mid = node.keys.size() / 2;           // 正中間那個鍵升上去，左半留在原本的節點
            int key = node.keys.get(mid);
            Node right = new Node();
            right.keys.addAll(node.keys.subList(mid + 1, node.keys.size()));
            node.keys.subList(mid, node.keys.size()).clear();
            if (!node.isLeaf()) {                     // 葉子沒有孩子可以分
                right.children.addAll(node.children.subList(mid + 1, node.children.size()));
                node.children.subList(mid + 1, node.children.size()).clear();
            }
            return new Split(key, right);
        }
    }

    static String yesNo(boolean found) {
        return found ? "yes" : "no";
    }

    public static void main(String[] args) {
        BTree tree = new BTree();
        for (int x = 10; x <= 70; x += 10) tree.insert(x);
        System.out.println(yesNo(tree.contains(60)) + " " + yesNo(tree.contains(35)) + " " + tree.size);
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <set>

int main() {
    // 內建的沒有 B 樹，B 樹多半住在資料庫和檔案系統裡，考試要自己刻；
    // 最接近的是排好序的集合 std::set（常見的實作底下是前一頁的紅黑樹）
    std::set<int> keys;
    for (int x = 10; x <= 70; x += 10) keys.insert(x);
    auto yesNo = [&](int x) { return keys.count(x) ? "yes" : "no"; };
    std::cout << yesNo(60) << " " << yesNo(35) << " " << keys.size() << "\\n";
}
`,
        handmade: `#include <iostream>
#include <vector>

const int M = 3;   // 3 階：一個節點最多 M - 1 = 2 個鍵、M = 3 個孩子

struct Node {
    std::vector<int> keys;          // 由小到大
    std::vector<Node*> children;    // 葉子沒有孩子；不是葉子的話，孩子比鍵多一個

    bool isLeaf() const { return children.empty(); }

    // 前面有幾個鍵比 x 小：x 該插在第幾格，也是要往下走的第幾個孩子
    int position(int x) const {
        int i = 0;
        while (i < (int)keys.size() && keys[i] < x) i++;
        return i;
    }
};

// 節點拆開時升上去的鍵，和右半邊的新節點（沒拆的話 right 是 nullptr）
struct Split {
    int key = 0;
    Node* right = nullptr;
};

class BTree {
    Node* root = new Node();
    int count = 0;

    // 把 x 放進以 node 為根的子樹；node 塞到 M 個鍵就從中間拆開，回傳升上去的鍵和右半邊
    Split insertInto(Node* node, int x) {
        int i = node->position(x);
        if (node->isLeaf()) node->keys.insert(node->keys.begin() + i, x);   // 新的鍵一律放進葉子
        else {
            Split up = insertInto(node->children[i], x);
            if (up.right) {      // 孩子拆成兩半：升上來的鍵插在第 i 格，右半邊接在它右邊
                node->keys.insert(node->keys.begin() + i, up.key);
                node->children.insert(node->children.begin() + i + 1, up.right);
            }
        }
        if ((int)node->keys.size() < M) return {};
        int mid = node->keys.size() / 2;                                     // 正中間那個鍵升上去，左半留在原本的節點
        Node* right = new Node();
        right->keys.assign(node->keys.begin() + mid + 1, node->keys.end());
        int key = node->keys[mid];
        node->keys.resize(mid);
        if (!node->isLeaf()) {                                               // 葉子沒有孩子可以分
            right->children.assign(node->children.begin() + mid + 1, node->children.end());
            node->children.resize(mid + 1);
        }
        return {key, right};
    }

    // 釋放記憶體用後序：孩子先刪，最後才刪自己
    static void destroy(Node* node) {
        for (Node* child : node->children) destroy(child);
        delete node;
    }

public:
    ~BTree() { destroy(root); }

    bool contains(int x) const {
        const Node* node = root;
        while (true) {
            int i = node->position(x);
            if (i < (int)node->keys.size() && node->keys[i] == x) return true;
            if (node->isLeaf()) return false;    // 走到葉子還沒有：不在裡面
            node = node->children[i];
        }
    }

    void insert(int x) {
        if (contains(x)) return;                 // 一樣的鍵不重複放
        Split up = insertInto(root, x);
        if (up.right) {                          // 根也拆了：升上去的鍵當新的根，樹長高一層
            Node* newRoot = new Node();
            newRoot->keys.push_back(up.key);
            newRoot->children = {root, up.right};
            root = newRoot;
        }
        count++;
    }

    int size() const { return count; }
};

int main() {
    BTree tree;
    for (int x = 10; x <= 70; x += 10) tree.insert(x);
    auto yesNo = [&](int x) { return tree.contains(x) ? "yes" : "no"; };
    std::cout << yesNo(60) << " " << yesNo(35) << " " << tree.size() << "\\n";
}
`,
      },
      output: 'yes no 7',
    },
    // 沙盒：3 階 B 樹、一開始是空的。insert 依序放 SEEDS 的下一個，塞爆的節點從中間拆開、中間的鍵升上去；
    // search 從根往下找 60，記下一路比過的節點。狀態：tree 樹本身、placed 放了幾個、added 這一步放的數、
    // splits 這一步依序拆開的節點、grew 根有沒有拆、path／turns／found 找 60 走過的路
    sandbox: {
      ops: [{ op: 'insert', label: '放進 insert' }, { op: 'search', label: '找 60 search' }],
      errors: { allPlaced: '七個數都放進去了，按「找 60」從根往下找找看。', empty: '樹是空的，先放幾個數進去再找。' },
      init() { return { tree: null, placed: 0, added: null, splits: [], grew: false, path: [], turns: [], found: null, error: null }; },
      apply(s, op) {
        const noMarks = { added: null, splits: [], grew: false, path: [], turns: [], found: null };
        if (op === 'insert') {
          if (s.placed >= SEEDS.length) return { ...s, ...noMarks, error: 'allPlaced' };
          const x = SEEDS[s.placed];
          const { tree, splits, grew } = insert(s.tree, x);
          return { ...s, ...noMarks, tree, placed: s.placed + 1, added: x, splits, grew, error: null };
        }
        if (!s.tree) return { ...s, ...noMarks, error: 'empty' };
        return { ...s, ...noMarks, ...search(s.tree, TARGET), error: null };
      },
      // 拆開幾次就寫幾段；連根都拆了，補一句樹長高一層
      label(op, s) {
        if (op === 'search') {
          const steps = s.path.map((keys, j) => `${keysText(keys)} ${j < s.turns.length ? turnText(keys.length, s.turns[j]) : s.found ? '找到了' : '沒有，不在裡面'}`);
          return `search(${TARGET})：${steps.join(' → ')}`;
        }
        if (!s.splits.length) return `insert(${s.added})`;
        const parts = s.splits.map((sp, j) => `${keysText(sp.full)} ${j ? '也' : ''}滿了，${sp.up} 升上去`);
        return `insert(${s.added})：${parts.join('；')}${s.grew ? '，樹長高一層' : ''}`;
      },
    },
    // 節點畫成一排格子、一格一個鍵，孩子的連線從鍵和鍵之間的邊界拉下去。這一步拆出來的兩半整個上黃色，
    // 升上去的鍵和新放的鍵那格上黃色，升上去的鍵從兩半中間畫一支箭頭指上去；找 60 時比過的節點外面圍一圈虛線，
    // 找到的那格上黃色。最多三層，高度固定，分格圖每一格對得齊。seed 固定，同一格每次畫出來一樣
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { tree, added, splits, path, found }, { sandbox = false } = {}) {
      const w = sandbox ? 300 : 240, cell = sandbox ? 28 : 22, gap = sandbox ? 16 : 12, level = sandbox ? 62 : 50, top = 8;
      const svg = svgEl(w, top * 2 + cell + level * 2); const rc = rough.svg(svg);
      if (!tree) {
        svg.append(rc.rectangle(w / 2 - cell, top, cell * 2, cell, { stroke: INK, strokeLineDash: [4, 3], roughness: 0.6, disableMultiStroke: true, seed: 2 }));
        svgText(svg, w / 2, top + cell + 14, '空的 B 樹', 12);
        return svg;
      }
      const boxes = layout(tree, cell, gap);
      const left = Math.min(...boxes.map(b => b.x)), right = Math.max(...boxes.map(b => b.x + b.w));
      const shift = (w - (right - left)) / 2 - left;
      for (const b of boxes) b.x += shift;
      const y = (b) => top + b.depth * level;
      // 每個鍵只在一個節點裡，所以用節點的第一個鍵認節點
      const halves = new Set(splits.flatMap(sp => [sp.left[0], sp.right[0]]));
      const ups = splits.map(sp => sp.up);
      const hotKeys = new Set([added, ...ups, ...(found ? [TARGET] : [])]);
      const compared = new Set(path.map(keys => keys[0]));

      for (const b of boxes) b.kids.forEach((k, i) => svg.append(rc.line(b.x + i * cell, y(b) + cell, k.x + k.w / 2, y(k), { stroke: INK, strokeWidth: 1.3, roughness: 1, seed: 30 + k.keys[0] })));
      for (const up of ups) {
        const b = boxes.find(bx => bx.keys.includes(up)), i = b.keys.indexOf(up);
        const [l, r] = [b.kids[i], b.kids[i + 1]];
        arrow(INK, svg, rc, [(l.x + l.w + r.x) / 2, y(l) - 3], [b.x + (i + 0.5) * cell, y(b) + cell + 4], 120 + up);
      }
      for (const b of boxes) {
        if (compared.has(b.keys[0])) {
          svg.append(rc.rectangle(b.x - 5, y(b) - 5, b.w + 10, cell + 10, { stroke: INK, strokeWidth: 1.2, strokeLineDash: [4, 3], roughness: 0.6, disableMultiStroke: true, seed: 60 + b.keys[0] }));
        }
        b.keys.forEach((k, i) => {
          const x = b.x + i * cell;
          svg.append(rc.rectangle(x, y(b), cell, cell, { stroke: INK, fill: halves.has(b.keys[0]) || hotKeys.has(k) ? NEW : FILL, fillStyle: 'solid', roughness: 0.8, seed: k }));
          svgText(svg, x + cell / 2, y(b) + cell / 2, String(k), sandbox ? 13 : 11);
        });
      }
      return svg;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('b_tree', page);
})(typeof window !== 'undefined' ? window : globalThis);
