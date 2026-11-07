// classroom/avl.js — 小教室「AVL 樹」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 沙盒依序插入的七個數：LL、RR、LR、RL 四種旋轉各出現一次，放完剛好是三層填滿的樹
  const SEEDS = [70, 50, 5, 10, 35, 20, 65];
  const RED = '#d1495b', MUTED = '#6b7280';   // 失衡節點的紅框；平衡因子的灰字

  // 節點是 { value, left, right, height }，高度從 1 數（只有自己是 1、空的是 0）。
  // 節點建好就不改，要改就做一個新的，舊的樹不動
  const heightOf = (n) => (n ? n.height : 0);
  const node = (value, left, right) => ({ value, left, right, height: 1 + Math.max(heightOf(left), heightOf(right)) });
  const balanceOf = (n) => heightOf(n.left) - heightOf(n.right);   // 平衡因子：左高 − 右高
  // 右旋：左孩子升上來當爸爸，它原本的右子樹改接到舊的爸爸左邊；左旋左右相反
  const rotateRight = (z) => node(z.left.value, z.left.left, node(z.value, z.left.right, z.right));
  const rotateLeft = (z) => node(z.right.value, node(z.value, z.left, z.right.left), z.right.right);

  // 插入 x：跟二元搜尋樹一樣比下去、放在空位，回程由下往上檢查，遇到第一個失衡的節點就轉。
  // 回傳新的樹和這次怎麼轉的 fix：kind 是 LL／RR／LR／RL，pivot 是失衡的節點，child 是它比較重那邊的孩子，
  // grandchild 是 child 往新節點那邊的孩子；沒轉的話 fix 是 null
  function insert(n, x) {
    if (!n) return { tree: node(x, null, null), fix: null };
    if (x === n.value) return { tree: n, fix: null };   // 一樣大的不放
    const goLeft = x < n.value;
    const sub = insert(goLeft ? n.left : n.right, x);
    const t = goLeft ? node(n.value, sub.tree, n.right) : node(n.value, n.left, sub.tree);
    const bf = balanceOf(t);
    if (bf > 1) {
      const child = t.left, kind = x < child.value ? 'LL' : 'LR';
      const grandchild = kind === 'LL' ? child.left : child.right;
      const tree = kind === 'LL' ? rotateRight(t) : rotateRight(node(t.value, rotateLeft(child), t.right));
      return { tree, fix: { kind, pivot: t.value, child: child.value, grandchild: grandchild.value } };
    }
    if (bf < -1) {
      const child = t.right, kind = x > child.value ? 'RR' : 'RL';
      const grandchild = kind === 'RR' ? child.right : child.left;
      const tree = kind === 'RR' ? rotateLeft(t) : rotateLeft(node(t.value, t.left, rotateRight(child)));
      return { tree, fix: { kind, pivot: t.value, child: child.value, grandchild: grandchild.value } };
    }
    return { tree: t, fix: sub.fix };
  }
  // 轉的時候換過位置的節點：單旋是失衡的節點和它的孩子，雙旋再加上孫子
  const rotatedBy = (fix) => (fix.kind === 'LL' || fix.kind === 'RR' ? [fix.pivot, fix.child] : [fix.pivot, fix.child, fix.grandchild]);
  // 中序走訪：左 → 自己 → 右
  const inorder = (n) => (n ? [...inorder(n.left), n.value, ...inorder(n.right)] : []);
  // 每個節點畫在哪：第 depth 層（樹根是 0）從左數第 slot 格；左子節點是 slot*2、右子節點是 slot*2+1
  function placed(n, depth = 0, slot = 0, parent = null, out = []) {
    if (!n) return out;
    const spot = { value: n.value, bf: balanceOf(n), depth, slot, parent };
    out.push(spot);
    placed(n.left, depth + 1, slot * 2, spot, out);
    placed(n.right, depth + 1, slot * 2 + 1, spot, out);
    return out;
  }
  const bfText = (bf) => (bf > 0 ? `+${bf}` : bf < 0 ? `−${-bf}` : '0');

  const page = {
    analogy: '疊積木：一邊太高就扶正，左右兩邊的高度差不能超過 1。',
    summary: '下次疊積木疊到一邊太高、伸手把它扶正，你就知道：那就是 AVL 樹每放一個就在做的事，左右兩邊的高度差不能超過 1。',   // 總結：呼應開頭的比喻
    frames: ['insert', 'insert', 'insert', 'insert', 'insert', 'insert', 'insert'],
    uses: [
      '會員名單、通訊錄這種一直有人加入，又要隨時找人、照順序列出來的資料：新會員的編號照註冊順序一直變大，一般的二元搜尋樹會歪成一條直線；AVL 每放一個就檢查，不管照什麼順序加，一百萬筆找一筆最多比 28 次。',
      '查得多、改得少的資料，像字典的單字表、郵遞區號對照表：AVL 管得比紅黑樹嚴，樹比較矮，找東西比較快；代價是插入、刪除時比較常要轉。',
      { text: '程式語言內建的排序集合：Java 的 TreeSet、TreeMap，C++ 的 std::set、std::map，底下也是會自己平衡的二元搜尋樹，只是它們選了轉得比較少的紅黑樹。', see: 'red_black' },
      '在節點上多記一點東西、插入和旋轉時沿路更新，是很多進階結構的起點：AVL 記的是高度；多記「這棵子樹有幾個節點」，就能在 O(log n) 找出第 k 小的數、算出某個分數排第幾，像排行榜上的「你是第 1234 名」。',
    ],
    concept: [
      { text: '初階的樹那頁說過，二元搜尋樹不一定 O(log n)：照 10、20、30、40、50 排好的順序插進去，樹會歪成一條直線。AVL 樹（AVL tree）是會自己保持平衡的二元搜尋樹（self-balancing binary search tree），每插一個就檢查，歪了當場轉回來。名字取自 1962 年發明它的兩位蘇聯數學家 Adelson-Velsky 和 Landis，是最早的一種自平衡二元搜尋樹。', see: 'tree' },
      '每個節點都有一個平衡因子（balance factor）＝左子樹的高度 − 右子樹的高度。AVL 只有一條規定：每個節點的平衡因子只能是 −1、0、+1，也就是左右兩邊的高度差不超過 1。圖上每個節點下面的小數字就是它的平衡因子；高度從 0 還是 1 開始數都一樣，兩邊相減就抵掉了。',
      '插入跟一般的二元搜尋樹一樣比下去、放在空位，再從新節點往上一個一個檢查。遇到的第一個平衡因子變成 2 或 −2 的節點就是失衡的節點（圖上的紅框），只要修好它：修完那棵子樹的高度跟插入前一樣，上面的節點就都不會失衡。',
      '怎麼轉，看新節點落在失衡節點的哪一邊的哪一邊：LL（左邊的左邊）對它右旋一次；RR（右邊的右邊）左旋一次；LR（左邊的右邊）先對左孩子左旋、拉直成 LL，再對它右旋；RL（右邊的左邊）先對右孩子右旋、再對它左旋。旋轉（rotation）只改上下、不改左右的順序：三個節點裡大小排中間的升上來當爸爸，小的在左、大的在右，所以轉完還是二元搜尋樹，中序走訪一樣由小到大。',
      { text: '因為每個節點左右最多差 1，n 個節點的 AVL 樹最高大約 1.44 log₂ n 層：一百萬筆資料最多 28 層，找一個值最多比 28 次。紅黑樹的規定比較鬆，樹可能高一點，但插入、刪除時轉得比較少。', see: 'red_black' },
    ],
    complexity: [['search 找某個值', '最差也是 O(log n)'], ['insert 插入', '最差也是 O(log n)'], ['delete 刪除', '最差也是 O(log n)'], ['一次旋轉', 'O(1)'], ['中序走訪', 'O(n)']],
    traps: [
      { wrong: '失衡了就轉樹根', right: '轉的是從新節點往上遇到的第一個失衡的節點。插入 35 時，5 和樹根 50 的平衡因子都超過了（−2 和 +2），但只要轉最下面的 5，50 就跟著回到 +1。' },
      { wrong: '平衡是左右兩邊的節點一樣多', right: '看的是高度差，不是節點數。左子樹是滿的三層（7 個節點）、右子樹只有兩層（2 個節點），高度差 1，還是合格的 AVL 樹。' },
      { wrong: 'LL 型就要左旋', right: 'LL 說的是新節點落在失衡節點左邊的左邊，左邊太重，要往右轉回來，是右旋；RR 才是左旋。名字講的是新節點在哪，不是往哪邊轉。' },
      { wrong: 'LR 轉一次就好', right: '要轉兩次。插入 20 時直接對 50 右旋，10 升上去，左邊一層、右邊三層，還是差 2；要先對 10 左旋、拉直成 LL，再對 50 右旋。' },
      { wrong: 'AVL 每次插入都要轉', right: '平衡因子變成 2 或 −2 才轉。這頁七次插入只有四次要轉，另外三次放進去就是平衡的。' },
      { wrong: '刪除跟插入一樣，最多修一個地方', right: '刪除可能要一路往上轉好幾次：轉完的子樹會矮一層，上面的節點可能接著失衡，最多 O(log n) 次。插入才是修好一個地方就結束。' },
    ],
    code: {
      python: {
        builtin: `# 內建的沒有 AVL 樹，考試要自己刻；最接近的是排好序的串列＋bisect（用二分搜尋找插入的位置），
# 只拿得到排好的順序，拿不到樹根和高度
import bisect

values = []
for x in (70, 50, 5, 10, 35, 20, 65):
    bisect.insort(values, x)
print(*values)
`,
        handmade: `class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None
        self.height = 1                  # 只有自己一個節點時高度是 1


def height(node):
    return node.height if node else 0


def update(node):
    node.height = 1 + max(height(node.left), height(node.right))


# 平衡因子：左高 − 右高
def balance(node):
    return height(node.left) - height(node.right)


# 右旋：左孩子升上來當爸爸，它原本的右子樹改接到舊的爸爸左邊
def rotate_right(z):
    y = z.left
    z.left = y.right
    y.right = z
    update(z)
    update(y)
    return y


# 左旋：右孩子升上來當爸爸，它原本的左子樹改接到舊的爸爸右邊
def rotate_left(z):
    y = z.right
    z.right = y.left
    y.left = z
    update(z)
    update(y)
    return y


# 跟二元搜尋樹一樣比下去、放在空位（一樣大的不放）；回程由下往上更新高度，失衡就轉
def insert(node, x):
    if node is None:
        return Node(x)
    if x < node.value:
        node.left = insert(node.left, x)
    elif x > node.value:
        node.right = insert(node.right, x)
    else:
        return node
    update(node)
    bf = balance(node)
    if bf > 1:                           # 左邊太重
        if x > node.left.value:          # LR：先對左孩子左旋，變成 LL
            node.left = rotate_left(node.left)
        return rotate_right(node)        # LL：右旋
    if bf < -1:                          # 右邊太重
        if x < node.right.value:         # RL：先對右孩子右旋，變成 RR
            node.right = rotate_right(node.right)
        return rotate_left(node)         # RR：左旋
    return node


# 中序：左 → 自己 → 右
def inorder(node, out):
    if node is None:
        return
    inorder(node.left, out)
    out.append(node.value)
    inorder(node.right, out)


root = None
for x in (70, 50, 5, 10, 35, 20, 65):
    root = insert(root, x)
out = []
inorder(root, out)
print(*out)
`,
      },
      js: {
        builtin: `// 內建的沒有 AVL 樹，考試要自己刻；最接近的是陣列放進去再排序（sort 要給比較函式，不然會照字串排），
// 只拿得到排好的順序，拿不到樹根和高度
const values = [];
for (const x of [70, 50, 5, 10, 35, 20, 65]) values.push(x);
values.sort((a, b) => a - b);
console.log(values.join(' '));
`,
        handmade: `class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
    this.height = 1;                    // 只有自己一個節點時高度是 1
  }
}

const height = (node) => (node ? node.height : 0);
const update = (node) => { node.height = 1 + Math.max(height(node.left), height(node.right)); };
const balance = (node) => height(node.left) - height(node.right);   // 平衡因子：左高 − 右高

// 右旋：左孩子升上來當爸爸，它原本的右子樹改接到舊的爸爸左邊
function rotateRight(z) {
  const y = z.left;
  z.left = y.right;
  y.right = z;
  update(z);
  update(y);
  return y;
}

// 左旋：右孩子升上來當爸爸，它原本的左子樹改接到舊的爸爸右邊
function rotateLeft(z) {
  const y = z.right;
  z.right = y.left;
  y.left = z;
  update(z);
  update(y);
  return y;
}

// 跟二元搜尋樹一樣比下去、放在空位（一樣大的不放）；回程由下往上更新高度，失衡就轉
function insert(node, x) {
  if (node === null) return new Node(x);
  if (x < node.value) node.left = insert(node.left, x);
  else if (x > node.value) node.right = insert(node.right, x);
  else return node;
  update(node);
  const bf = balance(node);
  if (bf > 1) {                         // 左邊太重
    if (x > node.left.value) node.left = rotateLeft(node.left);       // LR：先對左孩子左旋，變成 LL
    return rotateRight(node);           // LL：右旋
  }
  if (bf < -1) {                        // 右邊太重
    if (x < node.right.value) node.right = rotateRight(node.right);   // RL：先對右孩子右旋，變成 RR
    return rotateLeft(node);            // RR：左旋
  }
  return node;
}

// 中序：左 → 自己 → 右
function inorder(node, out) {
  if (node === null) return;
  inorder(node.left, out);
  out.push(node.value);
  inorder(node.right, out);
}

let root = null;
for (const x of [70, 50, 5, 10, 35, 20, 65]) root = insert(root, x);
const out = [];
inorder(root, out);
console.log(out.join(' '));
`,
      },
      java: {
        builtin: `import java.util.StringJoiner;
import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        // 內建的沒有 AVL 樹，考試要自己刻。TreeSet 也是會自己平衡的二元搜尋樹，但底下是紅黑樹；
        // 只拿得到排好的順序，從頭走到尾就是由小到大
        TreeSet<Integer> tree = new TreeSet<>();
        for (int x : new int[] {70, 50, 5, 10, 35, 20, 65}) tree.add(x);
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
        int height = 1;                   // 只有自己一個節點時高度是 1
        Node left, right;

        Node(int value) {
            this.value = value;
        }
    }

    static int height(Node node) {
        return node == null ? 0 : node.height;
    }

    static void update(Node node) {
        node.height = 1 + Math.max(height(node.left), height(node.right));
    }

    // 平衡因子：左高 − 右高
    static int balance(Node node) {
        return height(node.left) - height(node.right);
    }

    // 右旋：左孩子升上來當爸爸，它原本的右子樹改接到舊的爸爸左邊
    static Node rotateRight(Node z) {
        Node y = z.left;
        z.left = y.right;
        y.right = z;
        update(z);
        update(y);
        return y;
    }

    // 左旋：右孩子升上來當爸爸，它原本的左子樹改接到舊的爸爸右邊
    static Node rotateLeft(Node z) {
        Node y = z.right;
        z.right = y.left;
        y.left = z;
        update(z);
        update(y);
        return y;
    }

    // 跟二元搜尋樹一樣比下去、放在空位（一樣大的不放）；回程由下往上更新高度，失衡就轉
    static Node insert(Node node, int x) {
        if (node == null) return new Node(x);
        if (x < node.value) node.left = insert(node.left, x);
        else if (x > node.value) node.right = insert(node.right, x);
        else return node;
        update(node);
        int bf = balance(node);
        if (bf > 1) {                                                   // 左邊太重
            if (x > node.left.value) node.left = rotateLeft(node.left);       // LR：先對左孩子左旋，變成 LL
            return rotateRight(node);                                   // LL：右旋
        }
        if (bf < -1) {                                                  // 右邊太重
            if (x < node.right.value) node.right = rotateRight(node.right);   // RL：先對右孩子右旋，變成 RR
            return rotateLeft(node);                                    // RR：左旋
        }
        return node;
    }

    // 中序：左 → 自己 → 右
    static void inorder(Node node, StringJoiner out) {
        if (node == null) return;
        inorder(node.left, out);
        out.add(String.valueOf(node.value));
        inorder(node.right, out);
    }

    public static void main(String[] args) {
        Node root = null;
        for (int x : new int[] {70, 50, 5, 10, 35, 20, 65}) root = insert(root, x);
        StringJoiner out = new StringJoiner(" ");
        inorder(root, out);
        System.out.println(out);
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <set>

int main() {
    // 內建的沒有 AVL 樹，考試要自己刻。std::set 也是會自己平衡的二元搜尋樹，常見的實作底下是紅黑樹；
    // 只拿得到排好的順序，從頭走到尾就是由小到大
    std::set<int> tree;
    for (int x : {70, 50, 5, 10, 35, 20, 65}) tree.insert(x);
    bool first = true;
    for (int x : tree) {
        std::cout << (first ? "" : " ") << x;
        first = false;
    }
    std::cout << "\\n";
}
`,
        handmade: `#include <algorithm>
#include <iostream>
#include <vector>

struct Node {
    int value;
    int height = 1;                       // 只有自己一個節點時高度是 1
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(int v) : value(v) {}
};

int height(const Node* node) { return node ? node->height : 0; }
void update(Node* node) { node->height = 1 + std::max(height(node->left), height(node->right)); }
int balance(const Node* node) { return height(node->left) - height(node->right); }   // 平衡因子：左高 − 右高

// 右旋：左孩子升上來當爸爸，它原本的右子樹改接到舊的爸爸左邊
Node* rotateRight(Node* z) {
    Node* y = z->left;
    z->left = y->right;
    y->right = z;
    update(z);
    update(y);
    return y;
}

// 左旋：右孩子升上來當爸爸，它原本的左子樹改接到舊的爸爸右邊
Node* rotateLeft(Node* z) {
    Node* y = z->right;
    z->right = y->left;
    y->left = z;
    update(z);
    update(y);
    return y;
}

// 跟二元搜尋樹一樣比下去、放在空位（一樣大的不放）；回程由下往上更新高度，失衡就轉
Node* insert(Node* node, int x) {
    if (!node) return new Node(x);
    if (x < node->value) node->left = insert(node->left, x);
    else if (x > node->value) node->right = insert(node->right, x);
    else return node;
    update(node);
    int bf = balance(node);
    if (bf > 1) {                                                        // 左邊太重
        if (x > node->left->value) node->left = rotateLeft(node->left);        // LR：先對左孩子左旋，變成 LL
        return rotateRight(node);                                        // LL：右旋
    }
    if (bf < -1) {                                                       // 右邊太重
        if (x < node->right->value) node->right = rotateRight(node->right);    // RL：先對右孩子右旋，變成 RR
        return rotateLeft(node);                                         // RR：左旋
    }
    return node;
}

// 中序：左 → 自己 → 右
void inorder(const Node* node, std::vector<int>& out) {
    if (!node) return;
    inorder(node->left, out);
    out.push_back(node->value);
    inorder(node->right, out);
}

// 釋放記憶體用後序：子節點先刪，最後才刪自己
void destroy(Node* node) {
    if (!node) return;
    destroy(node->left);
    destroy(node->right);
    delete node;
}

int main() {
    Node* root = nullptr;
    for (int x : {70, 50, 5, 10, 35, 20, 65}) root = insert(root, x);
    std::vector<int> out;
    inorder(root, out);
    for (size_t i = 0; i < out.size(); i++) std::cout << (i ? " " : "") << out[i];
    std::cout << "\\n";
    destroy(root);
}
`,
      },
      output: '5 10 20 35 50 65 70',
    },
    // 沙盒：一開始是空的 AVL 樹。insert 依序放 SEEDS 的下一個數，失衡就轉；七個都放完再按是錯誤。
    // inorder 走訪整棵樹，確認轉完還是由小到大；空的樹是 underflow。狀態：tree 樹本身、placed 放了幾個、
    // added 這一步新放的、fix 這一步怎麼轉的（見 insert）、visited 中序走訪的順序
    sandbox: {
      ops: [{ op: 'insert', label: '插入 insert' }, { op: 'inorder', label: '中序走訪 inorder' }],
      errors: { allPlaced: '七個數都放進去了，四種旋轉都轉過一次；按「中序走訪」確認還是由小到大。', underflow: '樹是空的，沒有節點可以走訪（underflow）' },
      init() { return { tree: null, placed: 0, added: null, fix: null, visited: [], error: null }; },
      apply(s, op) {
        const noMarks = { added: null, fix: null, visited: [] };   // 這一步沒有要標色的節點
        if (op === 'insert') {
          if (s.placed >= SEEDS.length) return { ...s, ...noMarks, error: 'allPlaced' };
          const x = SEEDS[s.placed];
          const { tree, fix } = insert(s.tree, x);
          return { tree, placed: s.placed + 1, added: x, fix, visited: [], error: null };
        }
        if (!s.tree) return { ...s, ...noMarks, error: 'underflow' };
        return { ...s, ...noMarks, visited: inorder(s.tree), error: null };
      },
      label(op, s) {
        if (op === 'inorder') return `inorder() → ${s.visited.join(' ')}：由小到大，還是二元搜尋樹`;
        const f = s.fix;
        if (!f) return `insert(${s.added})`;
        const how = { LL: '右旋', RR: '左旋', LR: `先對 ${f.child} 左旋、再對 ${f.pivot} 右旋`, RL: `先對 ${f.child} 右旋、再對 ${f.pivot} 左旋` }[f.kind];
        return `insert(${s.added})：${f.pivot} ${f.kind[0] === 'L' ? '左' : '右'}邊太重（${f.kind}），${how}`;
      },
    },
    // 畫轉完以後的樹：先畫連線再畫實心的圓蓋上去，每個節點下面標平衡因子。這一步新放的和轉過的上黃色，
    // 剛才失衡的節點外面圍一圈紅框；中序走訪時每個節點左邊標第幾個被走到。seed 固定，同一格每次畫出來一樣
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { tree, added, fix, visited }, { sandbox = false } = {}) {
      const w = sandbox ? 300 : 240, r = sandbox ? 17 : 13, gap = sandbox ? 56 : 44, pad = r + 10;
      const bfY = r + (sandbox ? 13 : 12), bfSize = sandbox ? 11 : 10, hgt = pad + gap * 2 + bfY + bfSize;
      const svg = svgEl(w, hgt); const rc = rough.svg(svg);
      const xy = ({ depth, slot }) => [pad + ((slot + 0.5) * (w - pad * 2)) / 2 ** depth, pad + depth * gap];
      const spots = placed(tree);
      if (!spots.length) {
        svg.append(rc.circle(w / 2, pad, r * 2, { stroke: INK, strokeLineDash: [4, 3], roughness: 0.6, disableMultiStroke: true, seed: 2 }));
        svgText(svg, w / 2, pad + r + 14, '空的樹', 12);
        return svg;
      }
      const hot = new Set([added, ...(fix ? rotatedBy(fix) : [])]);
      for (const p of spots) if (p.parent) svg.append(rc.line(...xy(p.parent), ...xy(p), { stroke: INK, strokeWidth: 1.4, roughness: 1, seed: 30 + p.value }));
      for (const p of spots) {
        const [x, y] = xy(p);
        if (fix && p.value === fix.pivot) {
          svg.append(rc.circle(x, y, (r + 4) * 2, { stroke: RED, strokeWidth: 2, roughness: 0.6, disableMultiStroke: true, seed: 60 + p.value }));
        }
        svg.append(rc.circle(x, y, r * 2, { stroke: INK, fill: hot.has(p.value) ? NEW : FILL, fillStyle: 'solid', roughness: 1, seed: p.value }));
        svgText(svg, x, y, String(p.value), sandbox ? 15 : 13);
        svgText(svg, x, y + bfY, bfText(p.bf), bfSize).setAttribute('style', `fill: ${MUTED}; font-weight: 400`);
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
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('avl', page);
})(typeof window !== 'undefined' ? window : globalThis);
