// classroom/mst.js — 小教室「MST 最小生成樹」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 跟最短路徑那頁同一張圖：6 個點、9 條加權無向邊，每條邊 [一頭, 另一頭, 長度]；Prim 從 A 長出去
  const NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];
  const EDGES = [['A', 'B', 3], ['A', 'C', 7], ['B', 'C', 2], ['B', 'D', 5], ['C', 'D', 4], ['C', 'E', 8], ['D', 'E', 1], ['D', 'F', 6], ['E', 'F', 9]];
  const BY_LENGTH = [...EDGES].sort((p, q) => p[2] - q[2]);
  const START = 'A';
  const TREE_SIZE = NAMES.length - 1;   // 生成樹剛好 V − 1 條邊
  const edgeName = ([a, b, w]) => `${a}–${b} ${w}`;
  const lengthOf = (edges) => edges.reduce((sum, [, , w]) => sum + w, 0);
  const endpoints = (edges) => new Set(edges.flatMap(([a, b]) => [a, b]));

  // 只走已經選的邊，從 a 走得到 b 嗎（走得到的話，再接 a–b 就會成環）
  function linked(chosen, a, b) {
    const seen = new Set([a]), todo = [a];
    while (todo.length) {
      const v = todo.pop();
      for (const [x, y] of chosen) {
        const w = x === v ? y : y === v ? x : null;
        if (w && !seen.has(w)) { seen.add(w); todo.push(w); }
      }
    }
    return seen.has(b);
  }

  const start = (mode) => ({ mode, chosen: [], skipped: [], current: null, error: null });
  // Prim 一步：在一頭在樹裡、一頭在樹外的邊裡挑最短的（這張圖每條邊都不一樣長，不會平手）
  function primStep(s) {
    const tree = endpoints(s.chosen).add(START);
    const next = EDGES.filter(([a, b]) => tree.has(a) !== tree.has(b)).reduce((p, q) => (q[2] < p[2] ? q : p));
    return { ...s, chosen: [...s.chosen, next], current: next, error: null };
  }
  // Kruskal 一步：照長度看下一條邊（看過的＝選的＋跳過的），兩頭已經連在一起就跳過
  function kruskalStep(s) {
    const next = BY_LENGTH[s.chosen.length + s.skipped.length];
    if (linked(s.chosen, next[0], next[1])) return { ...s, skipped: [...s.skipped, next], current: next, error: null };
    return { ...s, chosen: [...s.chosen, next], current: next, error: null };
  }

  // 畫圖的位置：跟最短路徑那頁一樣，點的座標是圖的寬、高乘上這裡的比例
  const SPOT = { A: [0.08, 0.5], B: [0.36, 0.12], C: [0.36, 0.88], D: [0.64, 0.5], E: [0.92, 0.88], F: [0.92, 0.12] };
  const W = 240, GRAPH_H = 140, HGT = 168, RADIUS = 12, LABEL_GAP = 11, CROSS = 7, SANDBOX_SCALE = 1.25;
  const POS = Object.fromEntries(NAMES.map(v => [v, [SPOT[v][0] * W, SPOT[v][1] * GRAPH_H]]));

  const page = {
    analogy: '幫六個村子拉電線：每村都要通到，電線總長最短，不用繞成一圈。',
    summary: '下次看到電線桿一根一根把村子連起來，你就知道：那是一棵最小生成樹，每村都通到、電線總長最短，不繞成一圈。',   // 總結：呼應開頭的比喻
    frames: ['kruskal', 'kruskal', 'kruskal', 'kruskal', 'kruskal', 'kruskal'],
    uses: [
      '拉電線、鋪水管、埋光纖：每個地方都要接到，線越短越省錢。',
      '遊戲裡的迷宮：每一格是點、相鄰兩格中間的牆是邊，給每面牆一個隨機的長度再跑 Kruskal，把選到的牆打掉，就是一座每格都走得到、又不會繞圈的迷宮。',
      '把資料分群（clustering）：每筆資料是點、兩筆資料差多少是邊長，做出最小生成樹以後剪掉最長的 k − 1 條邊，剩下的 k 塊就是 k 群（單一連結分群，single-linkage clustering）。',
      '旅行推銷員問題（TSP）的近似解：走遍所有城市再回家的最短路線很難算，但沿著最小生成樹繞一圈、走過的城市就跳過，總長不會超過最短路線的兩倍（城市之間的距離要符合三角不等式）。',
    ],
    concept: [
      '生成樹（spanning tree）：從一張連通的無向圖裡挑一些邊，把全部 V 個點都連起來、而且沒有環（點數記成 V、邊數記成 E）。這樣挑出來剛好是 V − 1 條邊：少一條，就有點接不到；多一條，就一定繞成一圈。這頁的圖 6 個點，生成樹都是 5 條邊。',
      '邊上有長度的圖（加權圖）可以挑出很多棵生成樹，邊長加起來最短的那棵叫最小生成樹（MST，Minimum Spanning Tree）。每條邊都不一樣長的時候，最小生成樹只有一棵；這頁的是 A–B、B–C、C–D、D–E、D–F，總長 16。',
      { text: 'Prim 演算法：從一個點開始長（這頁從 A），每次在「一頭在樹裡、一頭在樹外」的邊裡挑最短的接進來，直到每個點都進到樹裡。它跟 Dijkstra 很像，都從起點往外一次收一個點、也都可以用堆積挑下一個；差在比的東西：Dijkstra 比「離起點多遠」（一路加起來），Prim 只比「這條邊多長」。', see: 'shortest_path' },
      { text: 'Kruskal 演算法：把所有的邊從短到長排好，一條一條看，接上去不會成環就選、會成環就跳過，選滿 V − 1 條為止。過程中圖上是好幾塊各自連通的小樹（森林），選一條邊就把兩塊併成一塊，所以「會不會成環」就是問這條邊的兩頭是不是已經在同一塊：互斥集合（Union-Find）的 find 找出兩頭的組長，一樣就會成環，不一樣就 union 併成一組。', see: 'disjoint_set' },
      '兩個演算法都對，靠的是切割性質（cut property）：把點隨便分成兩邊，跨兩邊的邊裡最短的那條，一定可以放進最小生成樹。Prim 的「樹裡／樹外」就是一刀切；Kruskal 選一條邊的時候，比它短的邊都看過了，所以它就是這一塊連到外面最短的那條。',
    ],
    complexity: [
      ['Kruskal（邊排序＋互斥集合）', 'O(E log E)'],
      ['Prim（用堆積挑最短的邊）', 'O(E log V)'],
      ['Prim（用相鄰矩陣，每次線性找最短）', 'O(V²)'],
      ['Kruskal 判斷一條邊會不會成環（互斥集合，接近 O(1)）', 'O(α(V))'],
    ],
    traps: [
      { wrong: '最小生成樹就是最短路徑樹', right: '兩個要的不一樣：最短路徑樹要每個點離起點最近，最小生成樹要全部的邊加起來最短。同一張圖，從 A 出發的最短路徑樹是 A–B、B–C、B–D、D–E、D–F，總長 17；最小生成樹是 A–B、B–C、C–D、D–E、D–F，總長 16，差在 B–D 5 和 C–D 4。' },
      { wrong: '挑最短的邊就好，不用管會不會成環', right: '會成環就要跳過。Kruskal 看到 B–D 5 的時候，B 和 D 已經透過 B–C、C–D 連在一起，再接只是繞成一圈，多花 5 卻沒有多接到任何一個點。' },
      { wrong: 'Prim 和 Kruskal 選出來的一定是同一棵', right: '有邊一樣長的時候，最小生成樹可能不只一棵，兩個可能選到不同的邊，但總長一定一樣。這頁每條邊都不一樣長，所以選到同一組邊，只是順序不同：Kruskal 先選最短的 D–E 1，Prim 從 A 出發，先加 A–B 3。' },
      { wrong: 'Prim 從不同的點開始，會長出不一樣的樹', right: '每條邊都不一樣長的時候，最小生成樹只有一棵，從哪個點開始長都會得到它，只是加進來的順序不同。會跟著起點變的是最短路徑樹。' },
      { wrong: '有向圖也能用 Prim、Kruskal', right: '這兩個只用在無向圖。有向圖要找的是從一個點出發、每個點都走得到的最便宜的樹，叫最小樹形圖（minimum spanning arborescence），要用 Chu–Liu／Edmonds 演算法。' },
    ],
    code: {
      python: {
        builtin: `# 內建的沒有最小生成樹，考試要自己刻；這裡用內建的 sorted 排邊、字典記每個點在哪一組
edges = [("A", "B", 3), ("A", "C", 7), ("B", "C", 2), ("B", "D", 5), ("C", "D", 4),
         ("C", "E", 8), ("D", "E", 1), ("D", "F", 6), ("E", "F", 9)]
group = {v: v for v in "ABCDEF"}  # 一開始每個點自己一組，組名就是自己

total = count = 0
for u, v, w in sorted(edges, key=lambda e: e[2]):  # 邊從短到長
    if group[u] == group[v]:
        continue  # 兩頭已經同一組：再接就成環
    old, new = group[v], group[u]
    for x in group:
        if group[x] == old:
            group[x] = new  # 合併：v 那組的點全部改成 u 的組名
    total += w
    count += 1
print(total, count)
`,
        handmade: `# 自己刻：Kruskal ＋ 互斥集合（Union-Find），find 加路徑壓縮、union 依大小合併
NAMES = "ABCDEF"
N = len(NAMES)
EDGES = [(0, 1, 3), (0, 2, 7), (1, 2, 2), (1, 3, 5), (2, 3, 4),
         (2, 4, 8), (3, 4, 1), (3, 5, 6), (4, 5, 9)]  # (一頭, 另一頭, 長度)，0～5 是 A～F

parent = list(range(N))  # 一開始每個點自己一組，自己就是組長
size = [1] * N


def find(x):
    if parent[x] != x:
        parent[x] = find(parent[x])  # 路徑壓縮：沿路的點直接接到組長下面
    return parent[x]


def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False  # 已經同一組：再接就成環
    if size[ra] < size[rb]:
        ra, rb = rb, ra
    parent[rb] = ra  # 依大小合併：小的那組接到大的下面
    size[ra] += size[rb]
    return True


def kruskal():
    total = count = 0
    for u, v, w in sorted(EDGES, key=lambda e: e[2]):  # 邊從短到長
        if union(u, v):
            total += w
            count += 1
            if count == N - 1:
                break  # 選滿 V - 1 條就是一棵生成樹
    return total, count


total, count = kruskal()
print(total, count)
`,
      },
      js: {
        builtin: `// 內建的沒有最小生成樹，考試要自己刻；這裡用內建的 sort 排邊、Map 記每個點在哪一組
const edges = [['A', 'B', 3], ['A', 'C', 7], ['B', 'C', 2], ['B', 'D', 5], ['C', 'D', 4],
  ['C', 'E', 8], ['D', 'E', 1], ['D', 'F', 6], ['E', 'F', 9]];
const group = new Map([...'ABCDEF'].map((v) => [v, v])); // 一開始每個點自己一組，組名就是自己

let total = 0, count = 0;
for (const [u, v, w] of [...edges].sort((p, q) => p[2] - q[2])) { // 邊從短到長
  if (group.get(u) === group.get(v)) continue; // 兩頭已經同一組：再接就成環
  const oldName = group.get(v), newName = group.get(u);
  for (const [x, g] of group) if (g === oldName) group.set(x, newName); // 合併：v 那組的點全部改成 u 的組名
  total += w;
  count++;
}
console.log(total, count);
`,
        handmade: `// 自己刻：Kruskal ＋ 互斥集合（Union-Find），find 加路徑壓縮、union 依大小合併
const N = 6;
const EDGES = [[0, 1, 3], [0, 2, 7], [1, 2, 2], [1, 3, 5], [2, 3, 4],
  [2, 4, 8], [3, 4, 1], [3, 5, 6], [4, 5, 9]]; // [一頭, 另一頭, 長度]，0～5 是 A～F

const parent = Array.from({ length: N }, (_, i) => i); // 一開始每個點自己一組，自己就是組長
const size = new Array(N).fill(1);

function find(x) {
  if (parent[x] !== x) parent[x] = find(parent[x]); // 路徑壓縮：沿路的點直接接到組長下面
  return parent[x];
}

function union(a, b) {
  let ra = find(a), rb = find(b);
  if (ra === rb) return false; // 已經同一組：再接就成環
  if (size[ra] < size[rb]) [ra, rb] = [rb, ra];
  parent[rb] = ra; // 依大小合併：小的那組接到大的下面
  size[ra] += size[rb];
  return true;
}

function kruskal() {
  let total = 0, count = 0;
  for (const [u, v, w] of [...EDGES].sort((p, q) => p[2] - q[2])) { // 邊從短到長
    if (!union(u, v)) continue;
    total += w;
    count++;
    if (count === N - 1) break; // 選滿 V - 1 條就是一棵生成樹
  }
  return [total, count];
}

const [total, count] = kruskal();
console.log(total, count);
`,
      },
      java: {
        builtin: `// 內建的沒有最小生成樹，考試要自己刻；這裡用內建的排序排邊、HashMap 記每個點在哪一組
import java.util.*;

public class Main {
    record Edge(char u, char v, int w) {}

    public static void main(String[] args) {
        List<Edge> edges = new ArrayList<>(List.of(
            new Edge('A', 'B', 3), new Edge('A', 'C', 7), new Edge('B', 'C', 2),
            new Edge('B', 'D', 5), new Edge('C', 'D', 4), new Edge('C', 'E', 8),
            new Edge('D', 'E', 1), new Edge('D', 'F', 6), new Edge('E', 'F', 9)));
        edges.sort(Comparator.comparingInt(Edge::w)); // 邊從短到長

        Map<Character, Character> group = new HashMap<>();
        for (char v : "ABCDEF".toCharArray()) group.put(v, v); // 一開始每個點自己一組，組名就是自己
        int total = 0, count = 0;
        for (Edge e : edges) {
            char oldName = group.get(e.v()), newName = group.get(e.u());
            if (oldName == newName) continue; // 兩頭已經同一組：再接就成環
            for (Map.Entry<Character, Character> x : group.entrySet()) {
                if (x.getValue() == oldName) x.setValue(newName); // 合併：v 那組的點全部改成 u 的組名
            }
            total += e.w();
            count++;
        }
        System.out.println(total + " " + count);
    }
}
`,
        handmade: `// 自己刻：Kruskal ＋ 互斥集合（Union-Find），find 加路徑壓縮、union 依大小合併
import java.util.Arrays;

public class Main {
    static final int N = 6;
    static final int[] parent = new int[N];
    static final int[] size = new int[N];

    static int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]); // 路徑壓縮：沿路的點直接接到組長下面
        return parent[x];
    }

    static boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false; // 已經同一組：再接就成環
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra; // 依大小合併：小的那組接到大的下面
        size[ra] += size[rb];
        return true;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1, 3}, {0, 2, 7}, {1, 2, 2}, {1, 3, 5}, {2, 3, 4},
                         {2, 4, 8}, {3, 4, 1}, {3, 5, 6}, {4, 5, 9}}; // {一頭, 另一頭, 長度}，0～5 是 A～F
        for (int i = 0; i < N; i++) { parent[i] = i; size[i] = 1; } // 一開始每個點自己一組，自己就是組長
        Arrays.sort(edges, (p, q) -> p[2] - q[2]); // 邊從短到長

        int total = 0, count = 0;
        for (int[] e : edges) {
            if (!union(e[0], e[1])) continue;
            total += e[2];
            count++;
            if (count == N - 1) break; // 選滿 V - 1 條就是一棵生成樹
        }
        System.out.println(total + " " + count);
    }
}
`,
      },
      cpp: {
        builtin: `// 內建的沒有最小生成樹，考試要自己刻；這裡用 std::sort 排邊、std::map 記每個點在哪一組
#include <algorithm>
#include <iostream>
#include <map>
#include <string>
#include <vector>

struct Edge { char u, v; int w; };

int main() {
    std::vector<Edge> edges = {{'A', 'B', 3}, {'A', 'C', 7}, {'B', 'C', 2}, {'B', 'D', 5}, {'C', 'D', 4},
                               {'C', 'E', 8}, {'D', 'E', 1}, {'D', 'F', 6}, {'E', 'F', 9}};
    std::sort(edges.begin(), edges.end(), [](const Edge& p, const Edge& q) { return p.w < q.w; }); // 邊從短到長

    std::map<char, char> group;
    for (char v : std::string("ABCDEF")) group[v] = v; // 一開始每個點自己一組，組名就是自己
    int total = 0, count = 0;
    for (const Edge& e : edges) {
        char oldName = group[e.v], newName = group[e.u];
        if (oldName == newName) continue; // 兩頭已經同一組：再接就成環
        for (auto& [x, g] : group) if (g == oldName) g = newName; // 合併：v 那組的點全部改成 u 的組名
        total += e.w;
        count++;
    }
    std::cout << total << " " << count << "\\n";
}
`,
        handmade: `// 自己刻：Kruskal ＋ 互斥集合（Union-Find），find 加路徑壓縮、合併依大小
#include <algorithm>
#include <iostream>
#include <utility>
#include <vector>

struct Edge { int u, v, w; };
const int N = 6;
int parent[N], size[N];

int find(int x) {
    if (parent[x] != x) parent[x] = find(parent[x]); // 路徑壓縮：沿路的點直接接到組長下面
    return parent[x];
}

bool unite(int a, int b) { // union 是 C++ 的保留字，所以叫 unite
    int ra = find(a), rb = find(b);
    if (ra == rb) return false; // 已經同一組：再接就成環
    if (size[ra] < size[rb]) std::swap(ra, rb);
    parent[rb] = ra; // 依大小合併：小的那組接到大的下面
    size[ra] += size[rb];
    return true;
}

int main() {
    std::vector<Edge> edges = {{0, 1, 3}, {0, 2, 7}, {1, 2, 2}, {1, 3, 5}, {2, 3, 4},
                               {2, 4, 8}, {3, 4, 1}, {3, 5, 6}, {4, 5, 9}}; // {一頭, 另一頭, 長度}，0～5 是 A～F
    for (int i = 0; i < N; i++) { parent[i] = i; size[i] = 1; } // 一開始每個點自己一組，自己就是組長
    std::sort(edges.begin(), edges.end(), [](const Edge& p, const Edge& q) { return p.w < q.w; }); // 邊從短到長

    int total = 0, count = 0;
    for (const Edge& e : edges) {
        if (!unite(e.u, e.v)) continue;
        total += e.w;
        count++;
        if (count == N - 1) break; // 選滿 V - 1 條就是一棵生成樹
    }
    std::cout << total << " " << count << "\\n";
}
`,
      },
      output: '16 5',
    },
    // 沙盒：Prim、Kruskal 各一顆「下一步」；按的跟正在做的不同種，就從頭開始那一種；選滿五條再按是錯誤
    sandbox: {
      ops: [{ op: 'prim', label: 'Prim 下一步' }, { op: 'kruskal', label: 'Kruskal 下一步' }],
      errors: { done: '五條邊選滿了：六個村子都通電了，再拉一條就會繞成一圈。' },
      init() { return start(null); },
      apply(s, op) {
        const run = s.mode === op ? s : start(op);
        if (run.chosen.length === TREE_SIZE) return { ...run, current: null, error: 'done' };
        return op === 'prim' ? primStep(run) : kruskalStep(run);
      },
      label(op, s) {
        if (s.skipped.includes(s.current)) return `跳過 ${edgeName(s.current)}：會成環`;
        return `${op === 'prim' ? '加' : '選'} ${edgeName(s.current)}${s.chosen.length === TREE_SIZE ? '：五條邊，完成' : ''}`;
      },
    },
    // 上面是圖、下面一行是選了幾條、總長多少。選到的邊加粗、跳過的邊打叉、這一步看的那條邊底下塗黃色；
    // 已經接上電線的點塗 FILL（Prim 是長出來的那一棵、Kruskal 是好幾塊小樹），邊長標在邊的外側
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { mode, chosen, skipped, current }, { sandbox = false } = {}) {
      const s = svgEl(W, HGT); const rc = rough.svg(s);
      if (sandbox) { s.setAttribute('width', Math.round(W * SANDBOX_SCALE)); s.setAttribute('height', Math.round(HGT * SANDBOX_SCALE)); }
      const wired = endpoints(chosen); if (mode === 'prim') wired.add(START);
      const cross = { stroke: INK, strokeWidth: 2.2, roughness: 0.6, disableMultiStroke: true };

      EDGES.forEach((e, i) => {   // 邊畫到圓圈外緣為止，才不會穿過點
        const [a, b, w] = e, [x1, y1] = POS[a], [x2, y2] = POS[b];
        const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
        const ends = [x1 + ux * RADIUS, y1 + uy * RADIUS, x2 - ux * RADIUS, y2 - uy * RADIUS];
        if (e === current) s.append(rc.line(...ends, { stroke: NEW, strokeWidth: 9, roughness: 0.4, disableMultiStroke: true, seed: 60 + i }));
        s.append(rc.line(...ends, { stroke: INK, strokeWidth: chosen.includes(e) ? 3.6 : 1.3, roughness: 1, seed: 30 + i }));
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        if (skipped.includes(e)) {   // 叉的兩筆跟邊各夾 45 度，不管邊怎麼斜都是一個 X、也碰不到旁邊的邊長
          const k = CROSS / Math.SQRT2;
          s.append(rc.line(mx - (ux - uy) * k, my - (uy + ux) * k, mx + (ux - uy) * k, my + (uy + ux) * k, { ...cross, seed: 80 + i }));
          s.append(rc.line(mx - (ux + uy) * k, my - (uy - ux) * k, mx + (ux + uy) * k, my + (uy - ux) * k, { ...cross, seed: 90 + i }));
        }
        const side = -uy * (mx - W / 2) + ux * (my - GRAPH_H / 2) < 0 ? -1 : 1;   // 法向量朝離圖中心遠的那一邊
        svgText(s, mx - uy * side * LABEL_GAP, my + ux * side * LABEL_GAP, String(w), 11);
      });
      NAMES.forEach((v, i) => {
        const [x, y] = POS[v];
        const fill = wired.has(v) ? { fill: FILL, fillStyle: 'hachure', hachureGap: 4 } : {};
        s.append(rc.circle(x, y, RADIUS * 2, { stroke: INK, strokeWidth: 1.4, roughness: 1, seed: 40 + i, ...fill }));
        svgText(s, x, y, v, 13);
      });

      const status = mode ? `${mode === 'prim' ? 'Prim' : 'Kruskal'}：選了 ${chosen.length} 條，總長 ${lengthOf(chosen)}` : 'Prim 從 A 長出去，Kruskal 從最短的邊挑起';
      svgText(s, W / 2, GRAPH_H + 16, status, 12);
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('mst', page);
})(typeof window !== 'undefined' ? window : globalThis);
