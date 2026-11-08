// classroom/red_black.js — 小教室「紅黑樹」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 沙盒依序插入的七個數：插入的四種情況（根變黑、叔叔是紅的、叔叔是黑的一直線、叔叔是黑的拐彎）都會出現
  const SEEDS = [10, 20, 30, 15, 25, 28, 5];
  // 這頁自己的兩個顏色：紅節點配深色字、黑節點配白字
  const RED = '#e8645a', BLACK = '#1f2328', ON_BLACK = '#fff';

  // 樹存成 { value, red, left, right }。插入時複製成帶 parent 的節點跑 CLRS 的插入與修正，再轉回來，舊的樹不動
  const linked = (node, parent = null) => {
    if (!node) return null;
    const n = { value: node.value, red: node.red, parent, left: null, right: null };
    n.left = linked(node.left, n); n.right = linked(node.right, n);
    return n;
  };
  const plain = (n) => (n ? { value: n.value, red: n.red, left: plain(n.left), right: plain(n.right) } : null);

  // 回傳新的樹、修正的每一步（fixes）、這一步新放的或變色、轉過的節點（touched）
  function insert(tree, x) {
    const t = { root: linked(tree) }, fixes = [], touched = new Set([x]);
    const paint = (n, red) => { if (n.red !== red) { n.red = red; touched.add(n.value); } };
    // 對 a 旋轉：dir 是 left 時 a 的右孩子轉上來、a 變成它的左孩子（左旋），right 反過來（右旋）
    const rotate = (a, dir) => {
      const up = dir === 'left' ? 'right' : 'left', b = a[up];
      a[up] = b[dir]; if (b[dir]) b[dir].parent = a;
      b.parent = a.parent;
      if (!a.parent) t.root = b; else if (a === a.parent.left) a.parent.left = b; else a.parent.right = b;
      b[dir] = a; a.parent = b;
      touched.add(a.value); touched.add(b.value);
    };
    // 照二元搜尋樹的規則往下找空位，新節點塗紅
    let parent = null;
    for (let n = t.root; n; n = x < n.value ? n.left : n.right) parent = n;
    let z = { value: x, red: true, parent, left: null, right: null };
    if (!parent) t.root = z; else if (x < parent.value) parent.left = z; else parent.right = z;
    // 爸爸也是紅的就要修：叔叔紅的變色、往上檢查；叔叔黑的轉一兩次再換顏色
    while (z.parent && z.parent.red) {
      const p = z.parent, g = p.parent, side = p === g.left ? 'left' : 'right', far = side === 'left' ? 'right' : 'left', uncle = g[far];
      if (uncle && uncle.red) {
        paint(p, false); paint(uncle, false); paint(g, true);
        fixes.push({ kind: 'uncleRed', parent: p.value, uncle: uncle.value, grand: g.value });
        z = g;
        continue;
      }
      if (z === p[far]) {
        rotate(p, side);
        fixes.push({ kind: 'bend', parent: p.value, first: side, grand: g.value, second: far });
        z = p;
      } else fixes.push({ kind: 'line', grand: g.value, dir: far });
      paint(z.parent, false); paint(g, true); rotate(g, far);
    }
    if (t.root.red) { paint(t.root, false); fixes.push({ kind: 'root' }); }
    return { tree: plain(t.root), fixes, touched: [...touched] };
  }
  const TURN = { left: '左旋', right: '右旋' };
  function fixText(f) {
    if (f.kind === 'uncleRed') return `叔叔 ${f.uncle} 是紅的，${f.parent}、${f.uncle} 變黑、${f.grand} 變紅`;
    if (f.kind === 'line') return `連兩個紅，叔叔是黑的，對 ${f.grand} ${TURN[f.dir]}、換顏色`;
    return `拐彎了，先對 ${f.parent} ${TURN[f.first]}、再對 ${f.grand} ${TURN[f.second]}、換顏色`;
  }
  // 中序走訪：左 → 自己 → 右
  const inorder = (node) => (node ? [...inorder(node.left), node.value, ...inorder(node.right)] : []);
  // 每個節點畫在哪：第 depth 層（樹根是 0）從左數第 slot 格；左孩子是 slot*2、右孩子是 slot*2+1
  function placed(node, depth = 0, slot = 0, parent = null, out = []) {
    if (!node) return out;
    const spot = { value: node.value, red: node.red, depth, slot, parent };
    out.push(spot);
    placed(node.left, depth + 1, slot * 2, spot, out);
    placed(node.right, depth + 1, slot * 2 + 1, spot, out);
    return out;
  }

  const page = {
    analogy: '倉庫排揀貨單：不求每個人的單一樣多，但最忙的人不會超過最閒的兩倍，大家下班時間差不多。',
    summary: '下次看到倉庫的揀貨單，每個人手上的單不一樣多、大家卻差不多時間下班，你就知道：那是一棵紅黑樹，大單一樣多、小單不連著兩張，最忙的不會超過最閒的兩倍。',   // 總結：呼應開頭的比喻
    frames: ['insert', 'insert', 'insert', 'insert', 'insert', 'insert', 'insert'],
    uses: [
      '遊戲排行榜、網拍照價格篩選：分數和商品一直進來、一直變，又要隨時照順序列出前幾名，或某個範圍裡的。資料一直變、又要隨時排好，就是會自己保持平衡的樹在做的事。',
      '寫程式要一個「隨時排好的字典或集合」：Java 的 TreeMap、TreeSet 底下是紅黑樹，C++ 的 std::map、std::set 常見的實作也是。放進去、拿掉都是 O(log n)，從頭走到尾就是由小到大，還能問「比 25 大的下一個是誰」。',
      { text: 'Java 8 起的 HashMap：同一格撞太多個（超過 8 個，而且表至少有 64 格）時，那一格的鏈結串列會換成紅黑樹，最慢的情況從一個一個比的 O(n) 變成 O(log n)。', see: 'hashing' },
      'Linux 核心的排程器：等著用 CPU 的程式放在一棵紅黑樹裡排好，每次挑最該輪到的那個先跑。2023 年以前預設的 CFS 照每個程式已經跑了多久（依優先權加權）排，挑最左邊、跑得最少的那個；Linux 6.6 起換成 EEVDF，挑的規則改了，用的還是紅黑樹。',
    ],
    concept: [
      '紅黑樹（red-black tree）是會自己保持平衡的二元搜尋樹：左小右大的規則不變，每個節點多記一個顏色。顏色要守五條規則：① 每個節點不是紅的就是黑的；② 根是黑的；③ 空的葉子（NIL）都算黑的；④ 紅節點的孩子一定是黑的，所以路上不會連著兩個紅；⑤ 每條從根走到葉子（NIL）的路，經過的黑節點一樣多。',
      '回到倉庫：每個人手上的單，是一條從根走到葉子的路；黑節點是大單，紅節點是附在大單後面的小單。規則 ⑤ 說每個人的大單一樣多，規則 ④ 說小單不能連著兩張。所以每個人至少有那幾張大單；最忙的人頂多每張大單後面都跟一張小單，也只是兩倍。換成樹：最長的路不超過最短的兩倍，n 個節點的紅黑樹最多 2 log₂(n + 1) 層，搜尋、插入、刪除最慢也是 O(log n)。',
      '插入：先照二元搜尋樹的規則往下放，新節點塗成紅的（塗紅不會讓哪條路的黑節點變多，最多只會跟爸爸連成兩個紅）。爸爸是黑的就結束；爸爸也是紅的，就看叔叔（爸爸的兄弟）：叔叔是紅的，爸爸和叔叔變黑、爺爺變紅，再從爺爺往上檢查；叔叔是黑的，轉一兩次再換顏色就修好。新節點、爸爸、爺爺排成一直線時轉一次，拐彎時先轉成一直線、再轉一次。左旋（left rotation）是把右孩子轉上來、自己變成它的左孩子，右旋反過來，轉完還是左小右大。最後根如果變紅了，塗回黑的。',
      { text: '跟 AVL 樹比：AVL 規定每個節點左右子樹的高度差不能超過 1，超過就轉回來扶正；紅黑樹只要最長的路不超過最短的兩倍，很多時候變個顏色就好，所以轉得比較少，代價是樹可能比 AVL 高一點。資料常常進進出出的時候紅黑樹比較划算，所以函式庫愛用它：Java 的 TreeMap、TreeSet 底下是紅黑樹，C++ 的 std::map、std::set 常見的實作也是。', see: 'avl' },
    ],
    // 各操作的時間複雜度（Big-O 的定義與怎麼算在附錄）
    complexity: [['search 搜尋', 'O(log n)'], ['insert 插入', 'O(log n)'], ['delete 刪除', 'O(log n)'], ['中序走訪', 'O(n)']],
    traps: [
      { wrong: '紅黑樹比 AVL 樹更平衡', right: 'AVL 比較嚴格：每個節點左右子樹的高度差不能超過 1。紅黑樹只要最長的路不超過最短的兩倍，左右可以差不只一層，所以插入、刪除時轉得比較少，函式庫愛用的是它；AVL 比較矮，查詢稍微快一點。' },
      { wrong: '新節點塗成黑的比較安全', right: '塗黑會讓經過它的路多一個黑節點，跟其他路對不上（規則 ⑤），很難修。塗紅不會改變黑節點的數量，最多只會跟爸爸連成兩個紅，在附近變色、轉一兩次就修好。' },
      { wrong: '葉子的顏色不用管', right: '空的葉子 NIL 一律算黑的。所以沒有孩子的紅節點不算違規（它的兩個孩子是 NIL，是黑的）；數一條路上有幾個黑節點，也是一路數到 NIL。' },
      { wrong: '紅黑樹一定是一層紅、一層黑', right: '規則只說紅節點的孩子一定是黑的，黑節點的孩子紅黑都可以。沙盒的七個數放完，根 20 的兩個孩子 10、28 都是黑的。' },
      { wrong: '每插一個都要旋轉', right: '很多時候變個顏色就好。沙盒的七次插入只有放 30 和 28 時要轉；放 15 只變色，放 10 只把根塗黑，放 20、25、5 時爸爸是黑的，什麼都不用做。' },
      { wrong: '每種語言都有內建的紅黑樹', right: 'Java 的 TreeMap、TreeSet 底下是紅黑樹，C++ 的 std::map、std::set 常見的實作也是（C++ 標準沒有規定一定要用紅黑樹）。Python、JavaScript 的標準函式庫沒有排好序的集合，要自己刻，或用排好序的串列加二分搜尋代替，但插入要搬動後面的元素，是 O(n)。' },
    ],
    code: {
      python: {
        builtin: `# Python 沒有內建的紅黑樹，考試要自己刻；最接近的是排好序的串列＋bisect
# （二分搜尋找位置，但插入時後面的元素要往後搬，是 O(n)）
import bisect

values = []
for x in (10, 20, 30, 15, 25, 28, 5):
    bisect.insort(values, x)
print(*values)
`,
        handmade: `class Node:
    def __init__(self, value, red, nil=None):
        self.value = value
        self.red = red
        self.left = self.right = self.parent = nil


class RedBlackTree:
    def __init__(self):
        self.nil = Node(None, False)          # 空的葉子 NIL：大家共用一個黑節點
        self.root = self.nil

    # 左旋：x 的右孩子 y 轉上來，x 變成 y 的左孩子
    def left_rotate(self, x):
        y = x.right
        x.right = y.left
        if y.left is not self.nil:
            y.left.parent = x
        y.parent = x.parent
        if x.parent is self.nil:
            self.root = y
        elif x is x.parent.left:
            x.parent.left = y
        else:
            x.parent.right = y
        y.left = x
        x.parent = y

    # 右旋：x 的左孩子 y 轉上來，x 變成 y 的右孩子
    def right_rotate(self, x):
        y = x.left
        x.left = y.right
        if y.right is not self.nil:
            y.right.parent = x
        y.parent = x.parent
        if x.parent is self.nil:
            self.root = y
        elif x is x.parent.right:
            x.parent.right = y
        else:
            x.parent.left = y
        y.right = x
        x.parent = y

    def insert(self, value):
        z = Node(value, True, self.nil)       # 新節點塗紅：不會讓哪條路的黑節點變多
        parent, x = self.nil, self.root
        while x is not self.nil:              # 照二元搜尋樹的規則往下找空位
            parent = x
            x = x.left if value < x.value else x.right
        z.parent = parent
        if parent is self.nil:
            self.root = z
        elif value < parent.value:
            parent.left = z
        else:
            parent.right = z
        self.insert_fixup(z)

    # 爸爸也是紅的（連著兩個紅）就要修，看叔叔是紅的還是黑的
    def insert_fixup(self, z):
        while z.parent.red:
            grand = z.parent.parent
            if z.parent is grand.left:
                uncle = grand.right
                if uncle.red:                 # 叔叔是紅的：爸爸、叔叔變黑，爺爺變紅，換爺爺往上檢查
                    z.parent.red = False
                    uncle.red = False
                    grand.red = True
                    z = grand
                else:
                    if z is z.parent.right:   # 拐彎：先對爸爸左旋，變成一直線
                        z = z.parent
                        self.left_rotate(z)
                    z.parent.red = False      # 一直線：爸爸變黑、爺爺變紅，再對爺爺右旋
                    grand.red = True
                    self.right_rotate(grand)
            else:                             # 爸爸是右孩子：左右對調
                uncle = grand.left
                if uncle.red:
                    z.parent.red = False
                    uncle.red = False
                    grand.red = True
                    z = grand
                else:
                    if z is z.parent.left:
                        z = z.parent
                        self.right_rotate(z)
                    z.parent.red = False
                    grand.red = True
                    self.left_rotate(grand)
        self.root.red = False                 # 根一定是黑的

    # 中序：左 → 自己 → 右
    def inorder(self, x, out):
        if x is self.nil:
            return
        self.inorder(x.left, out)
        out.append(x.value)
        self.inorder(x.right, out)


tree = RedBlackTree()
for x in (10, 20, 30, 15, 25, 28, 5):
    tree.insert(x)
out = []
tree.inorder(tree.root, out)
print(*out)
`,
      },
      js: {
        builtin: `// JavaScript 沒有內建的紅黑樹，考試要自己刻；這裡用一直保持排好的陣列代替
// （找到位置插進去，後面的元素要往後搬，是 O(n)）
const values = [];
for (const x of [10, 20, 30, 15, 25, 28, 5]) {
  const i = values.findIndex(v => v > x);
  values.splice(i === -1 ? values.length : i, 0, x);
}
console.log(values.join(' '));
`,
        handmade: `class Node {
  constructor(value, red, nil = null) {
    this.value = value;
    this.red = red;
    this.left = this.right = this.parent = nil;
  }
}

class RedBlackTree {
  constructor() {
    this.nil = new Node(null, false);   // 空的葉子 NIL：大家共用一個黑節點
    this.root = this.nil;
  }

  // 左旋：x 的右孩子 y 轉上來，x 變成 y 的左孩子
  leftRotate(x) {
    const y = x.right;
    x.right = y.left;
    if (y.left !== this.nil) y.left.parent = x;
    y.parent = x.parent;
    if (x.parent === this.nil) this.root = y;
    else if (x === x.parent.left) x.parent.left = y;
    else x.parent.right = y;
    y.left = x;
    x.parent = y;
  }

  // 右旋：x 的左孩子 y 轉上來，x 變成 y 的右孩子
  rightRotate(x) {
    const y = x.left;
    x.left = y.right;
    if (y.right !== this.nil) y.right.parent = x;
    y.parent = x.parent;
    if (x.parent === this.nil) this.root = y;
    else if (x === x.parent.right) x.parent.right = y;
    else x.parent.left = y;
    y.right = x;
    x.parent = y;
  }

  insert(value) {
    const z = new Node(value, true, this.nil);   // 新節點塗紅：不會讓哪條路的黑節點變多
    let parent = this.nil, x = this.root;
    while (x !== this.nil) {                      // 照二元搜尋樹的規則往下找空位
      parent = x;
      x = value < x.value ? x.left : x.right;
    }
    z.parent = parent;
    if (parent === this.nil) this.root = z;
    else if (value < parent.value) parent.left = z;
    else parent.right = z;
    this.insertFixup(z);
  }

  // 爸爸也是紅的（連著兩個紅）就要修，看叔叔是紅的還是黑的
  insertFixup(z) {
    while (z.parent.red) {
      const grand = z.parent.parent;
      if (z.parent === grand.left) {
        const uncle = grand.right;
        if (uncle.red) {                // 叔叔是紅的：爸爸、叔叔變黑，爺爺變紅，換爺爺往上檢查
          z.parent.red = false;
          uncle.red = false;
          grand.red = true;
          z = grand;
        } else {
          if (z === z.parent.right) {   // 拐彎：先對爸爸左旋，變成一直線
            z = z.parent;
            this.leftRotate(z);
          }
          z.parent.red = false;         // 一直線：爸爸變黑、爺爺變紅，再對爺爺右旋
          grand.red = true;
          this.rightRotate(grand);
        }
      } else {                          // 爸爸是右孩子：左右對調
        const uncle = grand.left;
        if (uncle.red) {
          z.parent.red = false;
          uncle.red = false;
          grand.red = true;
          z = grand;
        } else {
          if (z === z.parent.left) {
            z = z.parent;
            this.rightRotate(z);
          }
          z.parent.red = false;
          grand.red = true;
          this.leftRotate(grand);
        }
      }
    }
    this.root.red = false;              // 根一定是黑的
  }

  // 中序：左 → 自己 → 右
  inorder(x, out) {
    if (x === this.nil) return;
    this.inorder(x.left, out);
    out.push(x.value);
    this.inorder(x.right, out);
  }
}

const tree = new RedBlackTree();
for (const x of [10, 20, 30, 15, 25, 28, 5]) tree.insert(x);
const out = [];
tree.inorder(tree.root, out);
console.log(out.join(' '));
`,
      },
      java: {
        builtin: `import java.util.StringJoiner;
import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        // TreeSet 是用 TreeMap 做的，TreeMap 底下就是紅黑樹；從頭走到尾就是中序、由小到大
        TreeSet<Integer> tree = new TreeSet<>();
        for (int x : new int[] {10, 20, 30, 15, 25, 28, 5}) tree.add(x);
        StringJoiner out = new StringJoiner(" ");
        for (int x : tree) out.add(String.valueOf(x));
        System.out.println(out);
    }
}
`,
        handmade: `import java.util.StringJoiner;

public class Main {
    static class Node {
        int value;
        boolean red;
        Node left, right, parent;

        Node(int value, boolean red, Node nil) {
            this.value = value;
            this.red = red;
            left = right = parent = nil;
        }
    }

    static class RedBlackTree {
        final Node nil = new Node(0, false, null);   // 空的葉子 NIL：大家共用一個黑節點
        Node root = nil;

        // 左旋：x 的右孩子 y 轉上來，x 變成 y 的左孩子
        void leftRotate(Node x) {
            Node y = x.right;
            x.right = y.left;
            if (y.left != nil) y.left.parent = x;
            y.parent = x.parent;
            if (x.parent == nil) root = y;
            else if (x == x.parent.left) x.parent.left = y;
            else x.parent.right = y;
            y.left = x;
            x.parent = y;
        }

        // 右旋：x 的左孩子 y 轉上來，x 變成 y 的右孩子
        void rightRotate(Node x) {
            Node y = x.left;
            x.left = y.right;
            if (y.right != nil) y.right.parent = x;
            y.parent = x.parent;
            if (x.parent == nil) root = y;
            else if (x == x.parent.right) x.parent.right = y;
            else x.parent.left = y;
            y.right = x;
            x.parent = y;
        }

        void insert(int value) {
            Node z = new Node(value, true, nil);     // 新節點塗紅：不會讓哪條路的黑節點變多
            Node parent = nil, x = root;
            while (x != nil) {                       // 照二元搜尋樹的規則往下找空位
                parent = x;
                x = value < x.value ? x.left : x.right;
            }
            z.parent = parent;
            if (parent == nil) root = z;
            else if (value < parent.value) parent.left = z;
            else parent.right = z;
            insertFixup(z);
        }

        // 爸爸也是紅的（連著兩個紅）就要修，看叔叔是紅的還是黑的
        void insertFixup(Node z) {
            while (z.parent.red) {
                Node grand = z.parent.parent;
                if (z.parent == grand.left) {
                    Node uncle = grand.right;
                    if (uncle.red) {                 // 叔叔是紅的：爸爸、叔叔變黑，爺爺變紅，換爺爺往上檢查
                        z.parent.red = false;
                        uncle.red = false;
                        grand.red = true;
                        z = grand;
                    } else {
                        if (z == z.parent.right) {   // 拐彎：先對爸爸左旋，變成一直線
                            z = z.parent;
                            leftRotate(z);
                        }
                        z.parent.red = false;        // 一直線：爸爸變黑、爺爺變紅，再對爺爺右旋
                        grand.red = true;
                        rightRotate(grand);
                    }
                } else {                             // 爸爸是右孩子：左右對調
                    Node uncle = grand.left;
                    if (uncle.red) {
                        z.parent.red = false;
                        uncle.red = false;
                        grand.red = true;
                        z = grand;
                    } else {
                        if (z == z.parent.left) {
                            z = z.parent;
                            rightRotate(z);
                        }
                        z.parent.red = false;
                        grand.red = true;
                        leftRotate(grand);
                    }
                }
            }
            root.red = false;                        // 根一定是黑的
        }

        // 中序：左 → 自己 → 右
        void inorder(Node x, StringJoiner out) {
            if (x == nil) return;
            inorder(x.left, out);
            out.add(String.valueOf(x.value));
            inorder(x.right, out);
        }
    }

    public static void main(String[] args) {
        RedBlackTree tree = new RedBlackTree();
        for (int x : new int[] {10, 20, 30, 15, 25, 28, 5}) tree.insert(x);
        StringJoiner out = new StringJoiner(" ");
        tree.inorder(tree.root, out);
        System.out.println(out);
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <set>

int main() {
    // std::set 常見的實作底下就是紅黑樹（C++ 標準沒有規定）；從頭走到尾就是中序、由小到大
    std::set<int> tree;
    for (int x : {10, 20, 30, 15, 25, 28, 5}) tree.insert(x);
    bool first = true;
    for (int x : tree) {
        std::cout << (first ? "" : " ") << x;
        first = false;
    }
    std::cout << "\\n";
}
`,
        handmade: `#include <iostream>
#include <vector>

struct Node {
    int value;
    bool red;
    Node* left;
    Node* right;
    Node* parent;
    Node(int v, bool r, Node* nil) : value(v), red(r), left(nil), right(nil), parent(nil) {}
};

class RedBlackTree {
    Node* nil = new Node(0, false, nullptr);   // 空的葉子 NIL：大家共用一個黑節點
    Node* root = nil;

    // 左旋：x 的右孩子 y 轉上來，x 變成 y 的左孩子
    void leftRotate(Node* x) {
        Node* y = x->right;
        x->right = y->left;
        if (y->left != nil) y->left->parent = x;
        y->parent = x->parent;
        if (x->parent == nil) root = y;
        else if (x == x->parent->left) x->parent->left = y;
        else x->parent->right = y;
        y->left = x;
        x->parent = y;
    }

    // 右旋：x 的左孩子 y 轉上來，x 變成 y 的右孩子
    void rightRotate(Node* x) {
        Node* y = x->left;
        x->left = y->right;
        if (y->right != nil) y->right->parent = x;
        y->parent = x->parent;
        if (x->parent == nil) root = y;
        else if (x == x->parent->right) x->parent->right = y;
        else x->parent->left = y;
        y->right = x;
        x->parent = y;
    }

    // 爸爸也是紅的（連著兩個紅）就要修，看叔叔是紅的還是黑的
    void insertFixup(Node* z) {
        while (z->parent->red) {
            Node* grand = z->parent->parent;
            if (z->parent == grand->left) {
                Node* uncle = grand->right;
                if (uncle->red) {                 // 叔叔是紅的：爸爸、叔叔變黑，爺爺變紅，換爺爺往上檢查
                    z->parent->red = false;
                    uncle->red = false;
                    grand->red = true;
                    z = grand;
                } else {
                    if (z == z->parent->right) {  // 拐彎：先對爸爸左旋，變成一直線
                        z = z->parent;
                        leftRotate(z);
                    }
                    z->parent->red = false;       // 一直線：爸爸變黑、爺爺變紅，再對爺爺右旋
                    grand->red = true;
                    rightRotate(grand);
                }
            } else {                              // 爸爸是右孩子：左右對調
                Node* uncle = grand->left;
                if (uncle->red) {
                    z->parent->red = false;
                    uncle->red = false;
                    grand->red = true;
                    z = grand;
                } else {
                    if (z == z->parent->left) {
                        z = z->parent;
                        rightRotate(z);
                    }
                    z->parent->red = false;
                    grand->red = true;
                    leftRotate(grand);
                }
            }
        }
        root->red = false;                        // 根一定是黑的
    }

    // 中序：左 → 自己 → 右
    void inorder(const Node* x, std::vector<int>& out) const {
        if (x == nil) return;
        inorder(x->left, out);
        out.push_back(x->value);
        inorder(x->right, out);
    }

    // 釋放記憶體用後序：孩子先刪，最後才刪自己
    void destroy(Node* x) {
        if (x == nil) return;
        destroy(x->left);
        destroy(x->right);
        delete x;
    }

public:
    ~RedBlackTree() {
        destroy(root);
        delete nil;
    }

    void insert(int value) {
        Node* z = new Node(value, true, nil);     // 新節點塗紅：不會讓哪條路的黑節點變多
        Node* parent = nil;
        Node* x = root;
        while (x != nil) {                        // 照二元搜尋樹的規則往下找空位
            parent = x;
            x = value < x->value ? x->left : x->right;
        }
        z->parent = parent;
        if (parent == nil) root = z;
        else if (value < parent->value) parent->left = z;
        else parent->right = z;
        insertFixup(z);
    }

    std::vector<int> inorder() const {
        std::vector<int> out;
        inorder(root, out);
        return out;
    }
};

int main() {
    RedBlackTree tree;
    for (int x : {10, 20, 30, 15, 25, 28, 5}) tree.insert(x);
    std::vector<int> out = tree.inorder();
    for (size_t i = 0; i < out.size(); i++) std::cout << (i ? " " : "") << out[i];
    std::cout << "\\n";
}
`,
      },
      output: '5 10 15 20 25 28 30',
    },
    // 沙盒：一開始是空的紅黑樹。insert 依序插入 SEEDS 的下一個數，七個都放完再按是錯誤；inorder 走訪整棵樹，空的樹是 underflow。
    // 狀態：tree 樹本身、placed 放了幾個、added 這一步新放的、fixes 修正的每一步、touched 這一步新放的或變色、轉過的節點、visited 中序走訪的順序
    sandbox: {
      ops: [{ op: 'insert', label: '插入 insert' }, { op: 'inorder', label: '中序走訪 inorder' }],
      errors: { allPlaced: '七個數都放進去了，按「中序走訪」看看是不是由小到大，或按「重來」再放一次。', underflow: '樹是空的，沒有節點可以走訪（underflow）' },
      init() { return { tree: null, placed: 0, added: null, fixes: [], touched: [], visited: [], error: null }; },
      apply(s, op) {
        const noMarks = { added: null, fixes: [], touched: [], visited: [] };   // 這一步沒有要標色的節點
        if (op === 'insert') {
          if (s.placed >= SEEDS.length) return { ...s, ...noMarks, error: 'allPlaced' };
          const x = SEEDS[s.placed];
          const { tree, fixes, touched } = insert(s.tree, x);
          return { tree, placed: s.placed + 1, added: x, fixes, touched, visited: [], error: null };
        }
        if (!s.tree) return { ...s, ...noMarks, error: 'underflow' };
        return { ...s, ...noMarks, visited: inorder(s.tree), error: null };
      },
      label(op, s) {
        if (op === 'inorder') return `inorder() → ${s.visited.join(' ')}`;
        const turns = s.fixes.filter(f => f.kind !== 'root').map(fixText).join('；');
        const rootText = s.fixes.some(f => f.kind === 'root') ? (turns ? '根再變回黑' : '根變黑') : '';
        const text = [turns, rootText].filter(Boolean).join('，');
        return `insert(${s.added})${text ? `：${text}` : ''}`;
      },
    },
    // 上下層的樹：先畫連線再畫實心的圓蓋上去，節點塗紅或黑；這一步新放的或變色、轉過的，外面圍一圈黃色。
    // 中序走訪時每個節點左邊標第幾個被走到。seed 固定，同一格每次畫出來一樣
    draw({ rough, svgEl, svgText, INK, NEW }, { tree, touched, visited }, { sandbox = false } = {}) {
      const spots = placed(tree);
      const deepest = spots.reduce((d, p) => Math.max(d, p.depth), 0);
      const w = sandbox ? 300 : 240, r = sandbox ? 17 : 13, gap = sandbox ? 56 : 44, pad = r + 10, hgt = pad * 2 + gap * Math.max(2, deepest);
      const svg = svgEl(w, hgt); const rc = rough.svg(svg);
      const xy = ({ depth, slot }) => [pad + ((slot + 0.5) * (w - pad * 2)) / 2 ** depth, pad + depth * gap];
      if (!spots.length) {
        svg.append(rc.circle(w / 2, pad, r * 2, { stroke: INK, strokeLineDash: [4, 3], roughness: 0.6, disableMultiStroke: true, seed: 2 }));
        svgText(svg, w / 2, pad + r + 14, '空的樹', 12);
        return svg;
      }
      for (const p of spots) if (p.parent) svg.append(rc.line(...xy(p.parent), ...xy(p), { stroke: INK, strokeWidth: 1.4, roughness: 1, seed: 30 + p.value }));
      for (const p of spots) {
        const [x, y] = xy(p);
        if (touched.includes(p.value)) {
          svg.append(rc.circle(x, y, (r + 5) * 2, { stroke: NEW, strokeWidth: 2, fill: NEW, fillStyle: 'solid', roughness: 0.6, seed: 60 + p.value }));
        }
        svg.append(rc.circle(x, y, r * 2, { stroke: INK, fill: p.red ? RED : BLACK, fillStyle: 'solid', roughness: 1, seed: p.value }));
        // .cr-num 用 CSS 設了字色，要用 inline style 才蓋得過去
        const label = svgText(svg, x, y, String(p.value), sandbox ? 15 : 13);
        if (!p.red) label.style.fill = ON_BLACK;
        const nth = visited.indexOf(p.value);
        if (nth >= 0) {
          const bx = x - r - 9, br = sandbox ? 8 : 7;
          svg.append(rc.circle(bx, y, br * 2, { stroke: INK, fill: NEW, fillStyle: 'solid', roughness: 0.6, seed: 90 + p.value }));
          svgText(svg, bx, y, String(nth + 1), sandbox ? 11 : 10);
        }
      }
      return svg;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('ds', 'red_black', page);
})(typeof window !== 'undefined' ? window : globalThis);
