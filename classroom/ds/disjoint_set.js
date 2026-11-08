// classroom/disjoint_set.js — 小教室「Disjoint Set 互斥集合」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 沙盒的六個人，和 union 依序合併的五對；五對合完剛好六個人同一組
  const NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];
  const PAIRS = [['A', 'B'], ['C', 'D'], ['B', 'D'], ['E', 'F'], ['F', 'D']];
  const WHO = 'D';   // find 鈕找的人

  // 從 x 一路往上走到組長（上一層是自己的人），走過的人連同組長記在 path。
  // 路徑壓縮：路上還沒直接接在組長下面的人（moved）改成直接接到組長，回傳新的 parent，舊的不動
  function findLeader(parent, x) {
    const path = [x];
    while (parent[path.at(-1)] !== path.at(-1)) path.push(parent[path.at(-1)]);
    const leader = path.at(-1);
    const moved = path.slice(0, -1).filter(p => parent[p] !== leader);
    const next = { ...parent };
    for (const p of moved) next[p] = leader;
    return { parent: next, leader, path, moved };
  }
  const compression = (who, f) => (f.moved.length ? [{ who, leader: f.leader, moved: f.moved }] : []);

  const page = {
    analogy: '分組報告：要知道兩個人是不是同一組，各自問到組長，組長一樣就是同組。',
    summary: '下次分組報告有人問「我們是同一組嗎？」，你就知道：各自問到組長、組長一樣就是同組，這就是互斥集合。',   // 總結：呼應開頭的比喻
    frames: ['union', 'union', 'union', 'find', 'union', 'union'],
    uses: [
      '班上分組、公司部門合併：兩組併成一組以後，要確認兩個人是不是同一組，各自問到組長比一比就知道。',
      '社群網站的朋友圈：A 和 B 是朋友、B 和 C 是朋友，A 和 C 就有共同朋友 B，三個人算同一圈；這樣一直連下去的人都在同一圈。每多一對朋友就 union 一次，要問兩個人在不在同一圈，各自 find 出組長比一比。',
      '迷宮產生：一開始每一格都是四面封死的小房間、各自一組。隨機挑一面牆，牆兩邊還不同組才打掉、併成一組，已經同組就留著，不然會繞出一圈；全部併成一組時，任兩格之間剛好只有一條路。',
      { text: '最小生成樹的 Kruskal 演算法：邊從短到長一條一條看，兩端已經同組的邊選了會成環，跳過；不同組才選，再把兩組 union 起來。', see: 'mst' },
    ],
    concept: [
      '互斥集合（disjoint set）把一群東西分成好幾組，每個剛好在一組裡，任兩組沒有共同的成員，「互斥」說的就是這件事。它只做兩件事，所以又叫 Union-Find：union（合併）把兩組併成一組，find（找組長）回答某個人在哪一組。',
      '每組選一個人當代表（representative），就是比喻裡的組長。每個人只記自己的上一層（parent）是誰，組長的上一層是自己；find 就是一路往上問，問到組長為止，兩個人的組長一樣就是同組。所以每組都是一棵樹、組長是樹根，全部合起來是一片森林（forest），用一個 parent 陣列就存得下。',
      'union(a, b) 先找到兩個人各自的組長，再把一個組長接到另一個組長下面。隨便接的話，樹可能越長越高、變成一條直線，find 每次都要走 O(n) 步，所以有兩個招式：依大小合併（union by size）把人數少的那組接到人數多的下面，樹就長不高（改比樹高的版本叫 union by rank）；路徑壓縮（path compression）是 find 走到組長以後，把路上的人都直接接到組長下面，下次一步就到。這頁的沙盒兩招都有用，兩組一樣大時，第二個人的組長接到第一個人的組長下面。',
      '兩招一起用，find 和 union 平攤（amortized）下來幾乎是常數時間：嚴格說是 O(α(n))，α 是反阿克曼函數（inverse Ackermann function），長得非常慢，實際用得到的 n，α(n) 都不超過 4（《演算法導論》CLRS 的說法）。',
    ],
    complexity: [
      ['find 找組長（依大小合併＋路徑壓縮）', 'O(α(n))，接近 O(1)'],
      ['union 合併（依大小合併＋路徑壓縮）', 'O(α(n))，接近 O(1)'],
      ['find、union（只有依大小合併）', 'O(log n)'],
      ['find、union（兩個都不加）', '最壞 O(n)'],
      ['find（內建那份：字典直接記組長）', 'O(1)'],
      ['union（內建那份：整組的組長改掉）', 'O(n)'],
    ],
    traps: [
      { wrong: 'union(B, D) 就是把 D 接到 B 下面', right: '接的是兩組的組長。沙盒的 union(B, D) 先找到 B 的組長 A、D 的組長 C，再把 C 接到 A 下面。直接把 D 接到 B 下面的話，C 被留在原來那組，D 反而跟 C 分開了。' },
      { wrong: '找組長只要看自己的上一層', right: '上一層不一定是組長，要一路往上走到上一層是自己的那個人。沙盒合併完 B–D 以後，D 的上一層是 C，C 上面還有 A，D 的組長是 A。' },
      { wrong: '路徑壓縮會改掉分組', right: '只改走法：路上的人改成直接接到組長下面，組長沒換，誰跟誰同組也沒變。分格圖的 find(D) 把 D 從 C 下面搬到 A 下面，A 那組還是那 4 個人。' },
      { wrong: '互斥集合也可以把一組拆開', right: '只能合併、不能拆。合併以後只剩一個組長，當初是哪兩組併起來的沒有記下來，路徑壓縮還會改掉樹的形狀，所以互斥集合沒有拆開這個操作。' },
      { wrong: 'C++ 也可以把合併的函式取名叫 union', right: 'union 是 C 和 C++ 的保留字（用來宣告 union 型別），拿來當函式名稱會編譯錯誤，常見的寫法叫 unite 或 merge。Python、JavaScript、Java 叫 union 沒問題。' },
    ],
    code: {
      python: {
        builtin: `# 內建的沒有互斥集合，考試要自己刻；這裡用字典記每個人的組長，合併時把整組的組長改掉（要掃過每個人，O(n)）
leader = {p: p for p in "ABCDEF"}


def union(a, b):
    la, lb = leader[a], leader[b]
    for p in leader:
        if leader[p] == lb:
            leader[p] = la


def yes_no(ok):
    return "yes" if ok else "no"


union("A", "B")
union("C", "D")
union("B", "D")
union("E", "F")
size_a = sum(1 for p in leader if leader[p] == leader["A"])
print(yes_no(leader["D"] == leader["A"]), yes_no(leader["E"] == leader["A"]), size_a)
`,
        handmade: `class DisjointSet:
    def __init__(self, n):
        self.parent = list(range(n))   # 一開始每個人自己就是組長
        self.size = [1] * n            # 組長那一格記這組有幾個人

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])   # 路徑壓縮：路上的人直接接到組長下面
        return self.parent[x]

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return
        if self.size[ra] < self.size[rb]:   # 依大小合併：小的那組接到大的下面
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]

    def same(self, a, b):
        return self.find(a) == self.find(b)

    def group_size(self, x):
        return self.size[self.find(x)]


def yes_no(ok):
    return "yes" if ok else "no"


A, B, C, D, E, F = range(6)
ds = DisjointSet(6)
ds.union(A, B)
ds.union(C, D)
ds.union(B, D)
ds.union(E, F)
print(yes_no(ds.same(D, A)), yes_no(ds.same(E, A)), ds.group_size(A))
`,
      },
      js: {
        builtin: `// 內建的沒有互斥集合，考試要自己刻；這裡用 Map 記每個人的組長，合併時把整組的組長改掉（要掃過每個人，O(n)）
const leader = new Map([...'ABCDEF'].map(p => [p, p]));

function union(a, b) {
  const la = leader.get(a), lb = leader.get(b);
  for (const [p, l] of leader) if (l === lb) leader.set(p, la);
}

const yesNo = (ok) => (ok ? 'yes' : 'no');

union('A', 'B');
union('C', 'D');
union('B', 'D');
union('E', 'F');
const la = leader.get('A');
const sizeA = [...leader.values()].filter(l => l === la).length;
console.log(yesNo(leader.get('D') === la), yesNo(leader.get('E') === la), sizeA);
`,
        handmade: `class DisjointSet {
  constructor(n) {
    this.parent = Array.from({ length: n }, (_, i) => i);   // 一開始每個人自己就是組長
    this.size = new Array(n).fill(1);                         // 組長那一格記這組有幾個人
  }
  find(x) {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);   // 路徑壓縮：路上的人直接接到組長下面
    return this.parent[x];
  }
  union(a, b) {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return;
    if (this.size[ra] < this.size[rb]) [ra, rb] = [rb, ra];   // 依大小合併：小的那組接到大的下面
    this.parent[rb] = ra;
    this.size[ra] += this.size[rb];
  }
  same(a, b) {
    return this.find(a) === this.find(b);
  }
  groupSize(x) {
    return this.size[this.find(x)];
  }
}

const yesNo = (ok) => (ok ? 'yes' : 'no');

const [A, B, C, D, E, F] = [0, 1, 2, 3, 4, 5];
const ds = new DisjointSet(6);
ds.union(A, B);
ds.union(C, D);
ds.union(B, D);
ds.union(E, F);
console.log(yesNo(ds.same(D, A)), yesNo(ds.same(E, A)), ds.groupSize(A));
`,
      },
      java: {
        builtin: `import java.util.HashMap;
import java.util.Map;

public class Main {
    // 內建的沒有互斥集合，考試要自己刻；這裡用 HashMap 記每個人的組長，合併時把整組的組長改掉（要掃過每個人，O(n)）
    static Map<Character, Character> leader = new HashMap<>();

    static void union(char a, char b) {
        char la = leader.get(a), lb = leader.get(b);
        for (Map.Entry<Character, Character> e : leader.entrySet()) {
            if (e.getValue() == lb) e.setValue(la);
        }
    }

    static String yesNo(boolean ok) {
        return ok ? "yes" : "no";
    }

    public static void main(String[] args) {
        for (char p : "ABCDEF".toCharArray()) leader.put(p, p);
        union('A', 'B');
        union('C', 'D');
        union('B', 'D');
        union('E', 'F');
        char la = leader.get('A');
        int sizeA = 0;
        for (char l : leader.values()) if (l == la) sizeA++;
        System.out.println(yesNo(leader.get('D') == la) + " " + yesNo(leader.get('E') == la) + " " + sizeA);
    }
}
`,
        handmade: `public class Main {
    static class DisjointSet {
        private final int[] parent;
        private final int[] size;

        DisjointSet(int n) {
            parent = new int[n];
            size = new int[n];
            for (int i = 0; i < n; i++) {
                parent[i] = i;                    // 一開始每個人自己就是組長
                size[i] = 1;                      // 組長那一格記這組有幾個人
            }
        }

        int find(int x) {
            if (parent[x] != x) parent[x] = find(parent[x]);   // 路徑壓縮：路上的人直接接到組長下面
            return parent[x];
        }

        void union(int a, int b) {
            int ra = find(a), rb = find(b);
            if (ra == rb) return;
            if (size[ra] < size[rb]) {            // 依大小合併：小的那組接到大的下面
                int t = ra;
                ra = rb;
                rb = t;
            }
            parent[rb] = ra;
            size[ra] += size[rb];
        }

        boolean same(int a, int b) {
            return find(a) == find(b);
        }

        int groupSize(int x) {
            return size[find(x)];
        }
    }

    static String yesNo(boolean ok) {
        return ok ? "yes" : "no";
    }

    public static void main(String[] args) {
        int A = 0, B = 1, C = 2, D = 3, E = 4, F = 5;
        DisjointSet ds = new DisjointSet(6);
        ds.union(A, B);
        ds.union(C, D);
        ds.union(B, D);
        ds.union(E, F);
        System.out.println(yesNo(ds.same(D, A)) + " " + yesNo(ds.same(E, A)) + " " + ds.groupSize(A));
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <map>

// 內建的沒有互斥集合，考試要自己刻；這裡用 std::map 記每個人的組長，合併時把整組的組長改掉（要掃過每個人，O(n)）
std::map<char, char> leader;

// union 是 C++ 的保留字，所以叫 unite
void unite(char a, char b) {
    char la = leader[a], lb = leader[b];
    for (auto& [person, l] : leader)
        if (l == lb) l = la;
}

const char* yesNo(bool ok) { return ok ? "yes" : "no"; }

int main() {
    for (char p : {'A', 'B', 'C', 'D', 'E', 'F'}) leader[p] = p;
    unite('A', 'B');
    unite('C', 'D');
    unite('B', 'D');
    unite('E', 'F');
    char la = leader['A'];
    int sizeA = 0;
    for (const auto& [person, l] : leader)
        if (l == la) sizeA++;
    std::cout << yesNo(leader['D'] == la) << " " << yesNo(leader['E'] == la) << " " << sizeA << "\\n";
}
`,
        handmade: `#include <iostream>
#include <utility>
#include <vector>

class DisjointSet {
    std::vector<int> parent, size;

public:
    explicit DisjointSet(int n) : parent(n), size(n, 1) {   // 組長那一格記這組有幾個人
        for (int i = 0; i < n; i++) parent[i] = i;           // 一開始每個人自己就是組長
    }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);     // 路徑壓縮：路上的人直接接到組長下面
        return parent[x];
    }
    // union 是 C++ 的保留字，所以叫 unite
    void unite(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return;
        if (size[ra] < size[rb]) std::swap(ra, rb);         // 依大小合併：小的那組接到大的下面
        parent[rb] = ra;
        size[ra] += size[rb];
    }
    bool same(int a, int b) { return find(a) == find(b); }
    int groupSize(int x) { return size[find(x)]; }
};

const char* yesNo(bool ok) { return ok ? "yes" : "no"; }

int main() {
    enum { A, B, C, D, E, F };
    DisjointSet ds(6);
    ds.unite(A, B);
    ds.unite(C, D);
    ds.unite(B, D);
    ds.unite(E, F);
    std::cout << yesNo(ds.same(D, A)) << " " << yesNo(ds.same(E, A)) << " " << ds.groupSize(A) << "\\n";
}
`,
      },
      output: 'yes no 4',
    },
    // 沙盒：六個人一開始各自一組。union 依序合併 PAIRS 的下一對（照人數，一樣大時第二個的組長接到第一個下面），
    // 五對合完再按是錯誤；find 從 D 往上走到組長，順便路徑壓縮。union 裡的 find 也會壓縮。
    // 狀態：parent 每個人的上一層、size 組長那組的人數、joined 合併了幾對、merge 這一步的合併、
    // found／path 這一步 find 到的組長和走過的人、compressed 這一步路徑壓縮搬過的人
    sandbox: {
      ops: [{ op: 'union', label: '合併 union' }, { op: 'find', label: '找組長 find(D)' }],
      errors: { allJoined: '六個人都同一組了，按「重來」可以再分一次。' },
      init() {
        return {
          parent: Object.fromEntries(NAMES.map(p => [p, p])), size: Object.fromEntries(NAMES.map(p => [p, 1])),
          joined: 0, merge: null, found: null, path: [], compressed: [], error: null,
        };
      },
      apply(s, op) {
        const noMarks = { merge: null, found: null, path: [], compressed: [] };
        if (op === 'find') {
          const f = findLeader(s.parent, WHO);
          return { ...s, ...noMarks, parent: f.parent, found: f.leader, path: f.path, compressed: compression(WHO, f), error: null };
        }
        if (s.joined >= PAIRS.length) return { ...s, ...noMarks, error: 'allJoined' };
        const [x, y] = PAIRS[s.joined];
        const fx = findLeader(s.parent, x), fy = findLeader(fx.parent, y);
        const [rx, ry] = [fx.leader, fy.leader], [sx, sy] = [s.size[rx], s.size[ry]];
        const [big, small] = sx >= sy ? [rx, ry] : [ry, rx];
        return {
          ...s, ...noMarks,
          parent: { ...fy.parent, [small]: big }, size: { ...s.size, [big]: sx + sy }, joined: s.joined + 1,
          merge: { x, y, rx, ry, sx, sy, big, small }, compressed: [...compression(x, fx), ...compression(y, fy)], error: null,
        };
      },
      label(op, s) {
        if (op === 'find') {
          const { found, path, compressed } = s;
          if (path.length === 1) return `find(${WHO}) → ${found}：${WHO} 自己就是組長`;
          const after = compressed.length ? `${compressed[0].moved.join('、')} 直接接到 ${found}` : `${WHO} 本來就直接接在 ${found} 下面`;
          return `find(${WHO}) → ${found}：走 ${path.join(' → ')}，${after}`;
        }
        const { x, y, rx, ry, sx, sy, big, small } = s.merge;
        const how = sx === 1 && sy === 1 ? `${small} 接到 ${big} 下面`
          : sx === sy ? `組長 ${rx}、${ry} 一樣大，${small} 那組接到 ${big} 下面`
            : `${small} 那組比較小，接到 ${big} 下面`;
        const squash = s.compressed.map(c => `；找 ${c.who} 的組長時路徑壓縮，${c.moved.join('、')} 直接接到 ${c.leader}`).join('');
        return `union(${x}, ${y})：${how}${squash}`;
      },
    },
    // 好幾棵小樹：組長在最上面、上方標這組幾個人；樹照組長的字母排，每個人佔的寬度看他底下有幾個沒有孩子的人。
    // 這一步接過去的組長、路徑壓縮搬過的人上黃色；find 走過的人外面圍一圈虛線。沙盒最下面寫下一對要合併誰。
    // 互斥集合依大小合併，六個人的樹最多兩層，所以圖的高度固定。seed 固定，同一格每次畫出來一樣
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { parent, size, joined, merge, path, compressed }, { sandbox = false } = {}) {
      const w = sandbox ? 300 : 240, r = sandbox ? 16 : 13, gapY = sandbox ? 50 : 42, margin = 6;
      const slot = (w - margin * 2) / NAMES.length, top = r + (sandbox ? 28 : 26);
      const treeBottom = top + gapY * 2 + r + 8, hgt = treeBottom + (sandbox ? 22 : 0);
      const svg = svgEl(w, hgt); const rc = rough.svg(svg);

      const kids = Object.fromEntries(NAMES.map(p => [p, NAMES.filter(c => c !== p && parent[c] === p)]));
      const leaves = (p) => (kids[p].length ? kids[p].reduce((n, c) => n + leaves(c), 0) : 1);
      const leaders = NAMES.filter(p => parent[p] === p);
      const used = leaders.reduce((n, p) => n + leaves(p), 0) * slot;
      const between = leaders.length > 1 ? Math.min(slot, (w - margin * 2 - used) / (leaders.length - 1)) : 0;
      const pos = {};
      const place = (p, depth, left) => {
        pos[p] = [left + (leaves(p) * slot) / 2, top + depth * gapY];
        let x = left;
        for (const c of kids[p]) { place(c, depth + 1, x); x += leaves(c) * slot; }
      };
      let left = (w - used - between * (leaders.length - 1)) / 2;
      for (const p of leaders) { place(p, 0, left); left += leaves(p) * slot + between; }

      const hot = new Set([...(merge ? [merge.small] : []), ...compressed.flatMap(c => c.moved)]);
      NAMES.forEach((p, i) => { if (parent[p] !== p) svg.append(rc.line(...pos[parent[p]], ...pos[p], { stroke: INK, strokeWidth: 1.4, roughness: 1, seed: 30 + i })); });
      NAMES.forEach((p, i) => {
        const [x, y] = pos[p];
        if (path.includes(p)) svg.append(rc.circle(x, y, (r + 5) * 2, { stroke: INK, strokeWidth: 1.2, strokeLineDash: [4, 3], roughness: 0.6, disableMultiStroke: true, seed: 60 + i }));
        svg.append(rc.circle(x, y, r * 2, { stroke: INK, fill: hot.has(p) ? NEW : FILL, fillStyle: 'solid', roughness: 1, seed: 10 + i }));
        svgText(svg, x, y, p, sandbox ? 15 : 13);
      });
      for (const p of leaders) svgText(svg, pos[p][0], top - r - 12, `${size[p]} 人`, sandbox ? 12 : 11);
      if (sandbox) svgText(svg, w / 2, hgt - 12, joined < PAIRS.length ? `下一對：${PAIRS[joined].join('–')}` : '六個人都同一組了', 12);
      return svg;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('ds', 'disjoint_set', page);
})(typeof window !== 'undefined' ? window : globalThis);
