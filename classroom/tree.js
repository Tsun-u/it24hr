// classroom/tree.js — 小教室「Tree 樹」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 沙盒依序插入的七個數，全部放完剛好是三層、每層都滿的二元搜尋樹
  const SEEDS = [50, 30, 70, 20, 40, 60, 80];

  // 二元搜尋樹的節點是 { value, left, right }。插入時從樹根比下去，小的往左、大的往右，走到空位就放；
  // 沿路的節點複製一份再改，舊的樹不動
  const insert = (node, x) => (!node ? { value: x, left: null, right: null }
    : x < node.value ? { ...node, left: insert(node.left, x) } : { ...node, right: insert(node.right, x) });
  // 插入 x 時一路比過的節點值
  function comparedOnTheWay(tree, x) {
    const path = [];
    for (let node = tree; node; node = x < node.value ? node.left : node.right) path.push(node.value);
    return path;
  }
  // 中序走訪：左 → 自己 → 右
  const inorder = (node) => (node ? [...inorder(node.left), node.value, ...inorder(node.right)] : []);
  // 每個節點畫在哪：第 depth 層（樹根是 0）從左數第 slot 格；左子節點是 slot*2、右子節點是 slot*2+1
  function placed(node, depth = 0, slot = 0, parent = null, out = []) {
    if (!node) return out;
    const spot = { value: node.value, depth, slot, parent };
    out.push(spot);
    placed(node.left, depth + 1, slot * 2, spot, out);
    placed(node.right, depth + 1, slot * 2 + 1, spot, out);
    return out;
  }

  const page = {
    stamp: 'tree',
    analogy: '公司組織圖：最上面一個老闆，往下一層層分出去，每個人只有一個直屬主管。',
    summary: '下次看到公司組織圖、打開一層層的資料夾，你就知道：那是一棵樹，老闆是樹根，每個人只有一個直屬主管，就是他的父節點。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['insert', 'insert', 'insert', 'insert', 'insert', 'inorder'],
    game: '結算卡蓋 Tree，是因為你點開了很多張卡，看了沒做，來回比較好幾張才動手。每點開一張就多長出一根樹枝，難怪這棵樹這麼漂亮：枝葉茂盛，就是還沒結果。往好處想，你把整棵樹都走訪過了；只是走訪的意思是每個節點拜訪一次，不是每個節點做完一次。',
    uses: [
      '運動比賽的淘汰賽賽程表：兩隊一組比，贏的往上一層，最上面是冠軍。每一場只接下面兩場的勝隊，所以它是一棵二元樹。',
      '電腦裡的資料夾：磁碟底下有資料夾，資料夾裡又有資料夾和檔案；每個檔案只會在一個資料夾裡，一層一層往下長。',
      '在大量資料裡快速找東西：二元搜尋樹每比一次就決定往左還是往右，樹夠平衡的話，一百萬筆資料大約比 20 次就找到。資料庫的索引用的是它的進化版 B 樹（進階篇會講）。',
      '編譯器讀算式：3 + 4 * 2 會被拆成一棵運算式樹，乘法在下層、加法在樹根。用後序走訪得到 3 4 2 * +，電腦就照這個順序算（堆疊那頁的「中序轉後序」就是這件事）。',
    ],
    concept: [
      '樹由節點（node）和連線組成。最上面那個叫樹根（root）；往下連到的是它的子節點（child），往上連回的是父節點（parent）。除了樹根，每個節點都剛好有一個父節點，所以樹不會繞圈。沒有子節點的叫樹葉（leaf）；某個節點連同它底下的全部，叫一棵子樹（subtree）。樹根到最深的樹葉有多深，叫樹的高度（height），從 0 還是 1 開始數，各本書不同。',
      '二元樹（binary tree）的每個節點最多只有兩個子節點，分成左子節點和右子節點，左右是有分別的。每一層都放滿的話，三層剛好 7 個節點。',
      '二元搜尋樹（binary search tree，BST）是多了一條規則的二元樹：每個節點的左子樹都比它小、右子樹都比它大。所以找東西像查字典：從樹根開始比大小，小的往左、大的往右，一路走下去就找到；走到沒有路，就知道不在裡面。插入也是這樣比下去，走到空位就放進去。',
      '把每個節點都拜訪一次，叫走訪（traversal）。二元樹有三種常見的走法：前序（preorder）自己 → 左 → 右、中序（inorder）左 → 自己 → 右、後序（postorder）左 → 右 → 自己。二元搜尋樹用中序走訪，剛好由小到大：左子樹都比自己小、右子樹都比自己大，「左、自己、右」就是排好的順序。',
    ],
    // 各操作的時間複雜度（Big-O 的定義與怎麼算在附錄 D）
    complexity: [['insert 插入', '平均 O(log n)、最差 O(n)'], ['search 找某個值', '平均 O(log n)、最差 O(n)'], ['前序／中序／後序走訪', 'O(n)']],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: '二元搜尋樹找東西一定是 O(log n)', right: '要看樹長得平不平衡。照 10、20、30、40、50 這種排好的順序插進去，每個都比前一個大、一路往右，樹會長成一條直線（歪斜樹），跟鏈結串列一樣得一個一個比，變成 O(n)。會自己保持平衡的 AVL 樹、紅黑樹，進階篇會講。' },
      { wrong: '二元樹就是二元搜尋樹', right: '二元樹只規定每個節點最多兩個子節點，沒管大小；「左小右大」是二元搜尋樹另外加的規則。堆積（Heap）也是二元樹，規則又不一樣：父節點一定比子節點大（或小），所以最大（或最小）的永遠在樹根；堆積排序（heap sort）就是靠它，放在進階篇。' },
      { wrong: '中序走訪出來一定是排好的', right: '只有二元搜尋樹才是。一般的二元樹沒有左小右大的規則，中序走出來就只是其中一種順序。' },
      { wrong: '前序、中序、後序的前中後，說的是先走左邊還是右邊', right: '三種都是先左後右。前中後說的是「自己」排在哪：自己在最前面是前序、夾在中間是中序、排最後是後序。' },
      { wrong: '樹的高度一定從 1 開始算', right: '各本教科書不同：有的數層數，只有樹根的樹高度是 1（例如 Horowitz 的資料結構課本）；有的數連線，同一棵樹高度是 0（例如 CLRS《演算法導論》）。滿的二元樹節點數公式也跟著變，2ʰ − 1 或 2ʰ⁺¹ − 1，考試前先看清楚題目怎麼定義。' },
    ],
    code: {
      python: {
        builtin: `# 內建的沒有樹，考試要自己刻；最接近的是排好序的串列＋bisect（用二分搜尋找插入的位置）
import bisect

values = []
for x in (50, 30, 70, 20, 40):
    bisect.insort(values, x)
print(*values)
`,
        handmade: `class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None


# 走到空位就放新節點；比自己小往左、比自己大往右，一樣大的不放
def insert(node, x):
    if node is None:
        return Node(x)
    if x < node.value:
        node.left = insert(node.left, x)
    elif x > node.value:
        node.right = insert(node.right, x)
    return node


# 中序：左 → 自己 → 右
def inorder(node, out):
    if node is None:
        return
    inorder(node.left, out)
    out.append(node.value)
    inorder(node.right, out)


root = None
for x in (50, 30, 70, 20, 40):
    root = insert(root, x)
out = []
inorder(root, out)
print(*out)
`,
      },
      js: {
        builtin: `// 內建的沒有樹，考試要自己刻；最接近的是陣列放進去再排序（sort 要給比較函式，不然會照字串排）
const values = [];
for (const x of [50, 30, 70, 20, 40]) values.push(x);
values.sort((a, b) => a - b);
console.log(values.join(' '));
`,
        handmade: `class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

// 走到空位就放新節點；比自己小往左、比自己大往右，一樣大的不放
function insert(node, x) {
  if (node === null) return new Node(x);
  if (x < node.value) node.left = insert(node.left, x);
  else if (x > node.value) node.right = insert(node.right, x);
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
for (const x of [50, 30, 70, 20, 40]) root = insert(root, x);
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
        // TreeSet 底下是紅黑樹（會自己保持平衡的二元搜尋樹，進階篇會講），從頭走到尾就是由小到大
        TreeSet<Integer> tree = new TreeSet<>();
        for (int x : new int[] {50, 30, 70, 20, 40}) tree.add(x);
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
        Node left, right;

        Node(int value) {
            this.value = value;
        }
    }

    // 走到空位就放新節點；比自己小往左、比自己大往右，一樣大的不放
    static Node insert(Node node, int x) {
        if (node == null) return new Node(x);
        if (x < node.value) node.left = insert(node.left, x);
        else if (x > node.value) node.right = insert(node.right, x);
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
        for (int x : new int[] {50, 30, 70, 20, 40}) root = insert(root, x);
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
    // std::set 常見的實作底下是紅黑樹（會自己保持平衡的二元搜尋樹，進階篇會講），從頭走到尾就是由小到大
    std::set<int> tree;
    for (int x : {50, 30, 70, 20, 40}) tree.insert(x);
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
    Node* left = nullptr;
    Node* right = nullptr;
    explicit Node(int v) : value(v) {}
};

// 走到空位就放新節點；比自己小往左、比自己大往右，一樣大的不放
Node* insert(Node* node, int x) {
    if (!node) return new Node(x);
    if (x < node->value) node->left = insert(node->left, x);
    else if (x > node->value) node->right = insert(node->right, x);
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
    for (int x : {50, 30, 70, 20, 40}) root = insert(root, x);
    std::vector<int> out;
    inorder(root, out);
    for (size_t i = 0; i < out.size(); i++) std::cout << (i ? " " : "") << out[i];
    std::cout << "\\n";
    destroy(root);
}
`,
      },
      output: '20 30 40 50 70',
    },
    // 沙盒：一開始是空的二元搜尋樹。insert 依序種下 SEEDS 的下一個數，記下一路比過的節點；七個都種完再按是錯誤。
    // inorder 走訪整棵樹，空的樹是 underflow。狀態：tree 樹本身、size 種了幾個、added 這一步新插的、
    // path 插入時一路比過的、visited 中序走訪的順序
    sandbox: {
      ops: [{ op: 'insert', label: '插入 insert' }, { op: 'inorder', label: '中序走訪 inorder' }],
      errors: { allPlanted: '七個數都種進去了，按「重來」可以再種一次。', underflow: '樹是空的，沒有節點可以走訪（underflow）' },
      init() { return { tree: null, size: 0, added: null, path: [], visited: [], error: null }; },
      apply(s, op) {
        const noMarks = { added: null, path: [], visited: [] };   // 這一步沒有要標色的節點
        if (op === 'insert') {
          if (s.size >= SEEDS.length) return { ...s, ...noMarks, error: 'allPlanted' };
          const x = SEEDS[s.size];
          return { tree: insert(s.tree, x), size: s.size + 1, added: x, path: comparedOnTheWay(s.tree, x), visited: [], error: null };
        }
        if (!s.tree) return { ...s, ...noMarks, error: 'underflow' };
        return { ...s, ...noMarks, visited: inorder(s.tree), error: null };
      },
      label(op, s) {
        if (op === 'inorder') return `inorder() → ${s.visited.join(' ')}`;
        const steps = s.path.map(v => `比 ${v} ${s.added < v ? '小往左' : '大往右'}`);
        return `insert(${s.added})${steps.length ? `：${steps.join('、')}` : ''}`;
      },
    },
    // 上下層的樹：先畫連線再畫實心的圓蓋上去。這一步新插入的上黃色、一路比過的外面圍一圈虛線；
    // 中序走訪時每個節點左邊標第幾個被走到。seed 固定，同一格每次畫出來一樣
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { tree, added, path, visited }, { sandbox = false } = {}) {
      const w = sandbox ? 300 : 240, r = sandbox ? 17 : 13, gap = sandbox ? 56 : 44, pad = r + 10, hgt = pad * 2 + gap * 2;
      const svg = svgEl(w, hgt); const rc = rough.svg(svg);
      const xy = ({ depth, slot }) => [pad + ((slot + 0.5) * (w - pad * 2)) / 2 ** depth, pad + depth * gap];
      const spots = placed(tree);
      if (!spots.length) {
        svg.append(rc.circle(w / 2, pad, r * 2, { stroke: INK, strokeLineDash: [4, 3], roughness: 0.6, disableMultiStroke: true, seed: 2 }));
        svgText(svg, w / 2, pad + r + 14, '空的樹', 12);
        return svg;
      }
      for (const p of spots) if (p.parent) svg.append(rc.line(...xy(p.parent), ...xy(p), { stroke: INK, strokeWidth: 1.4, roughness: 1, seed: 30 + p.value }));
      for (const p of spots) {
        const [x, y] = xy(p);
        if (path.includes(p.value)) {
          svg.append(rc.circle(x, y, (r + 5) * 2, { stroke: INK, strokeWidth: 1.2, strokeLineDash: [4, 3], roughness: 0.6, disableMultiStroke: true, seed: 60 + p.value }));
        }
        svg.append(rc.circle(x, y, r * 2, { stroke: INK, fill: p.value === added ? NEW : FILL, fillStyle: 'solid', roughness: 1, seed: p.value }));
        svgText(svg, x, y, String(p.value), sandbox ? 15 : 13);
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
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('tree', page);
})(typeof window !== 'undefined' ? window : globalThis);
