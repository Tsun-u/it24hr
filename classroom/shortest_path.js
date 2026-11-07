// classroom/shortest_path.js — 小教室「最短路徑（Dijkstra）」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 這頁固定的加權無向圖：6 個點、9 條邊，從 A 出發；跟最小生成樹那頁是同一張圖
  const NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];
  const EDGES = [['A', 'B', 3], ['A', 'C', 7], ['B', 'C', 2], ['B', 'D', 5], ['C', 'D', 4], ['C', 'E', 8], ['D', 'E', 1], ['D', 'F', 6], ['E', 'F', 9]];
  const START = 'A';
  // 每個點的鄰居和那條邊的權重，鄰居照字母順序
  const NEIGHBORS = Object.fromEntries(NAMES.map(v => [v, EDGES.flatMap(([a, b, w]) => (a === v ? [[b, w]] : b === v ? [[a, w]] : [])).sort(([p], [q]) => (p < q ? -1 : 1))]));

  // 確定下一個點：從還沒確定的點裡挑距離最小的（NAMES 照字母排、只換嚴格比較小的，所以一樣近時字母小的先），
  // 再鬆弛它還沒確定的鄰居：從它繞過去比較近就改小，記下改小前的距離、是從哪個點過來的
  function settleNext(s) {
    const current = NAMES.filter(v => !s.done.includes(v)).reduce((best, v) => (s.dist[v] < s.dist[best] ? v : best));
    const dist = { ...s.dist }, prev = { ...s.prev }, improved = [];
    for (const [v, w] of NEIGHBORS[current]) {
      if (s.done.includes(v) || dist[current] + w >= dist[v]) continue;
      improved.push({ v, was: dist[v] });
      dist[v] = dist[current] + w;
      prev[v] = current;
    }
    return { ...s, dist, prev, done: [...s.done, current], current, improved, error: null };
  }

  // 畫圖的位置：寬、高各 0～1 的比例，跟最小生成樹那頁一樣；分格圖 240 寬，沙盒放大成 300
  const W = 240, GRAPH_H = 140, R = 12, SANDBOX_SCALE = 1.25;
  const RATIO = { A: [0.08, 0.5], B: [0.36, 0.12], C: [0.36, 0.88], D: [0.64, 0.5], E: [0.92, 0.88], F: [0.92, 0.12] };
  const POS = Object.fromEntries(NAMES.map(v => [v, [RATIO[v][0] * W, RATIO[v][1] * GRAPH_H]]));
  const CENTER = [0, 1].map(k => NAMES.reduce((sum, v) => sum + POS[v][k], 0) / NAMES.length);   // 權重標在邊離圖中心遠的那一側
  const WEIGHT_GAP = 9;
  const CELL_W = 32, CELL_H = 26, ROW_X = 38, ROW_Y = GRAPH_H + 18, HEIGHT = ROW_Y + CELL_H + 6;   // 下面那列距離表

  const page = {
    analogy: '導航找最快的路：先確定離起點最近的那一站，再從它往外推。',
    summary: '下次打開導航、看它幫你找最快的路，你就知道：那是 Dijkstra 的做法，先確定離起點最近的那一站，再從它往外推。',   // 總結：呼應開頭的比喻
    frames: ['settle', 'settle', 'settle', 'settle', 'settle', 'settle'],
    uses: [
      '地圖 App 導航：路口是點、道路是邊，權重是距離或開車要花的時間；導航找路的方法，很多是從 Dijkstra 改良來的。',
      '遊戲角色自動走路：地圖切成格子，平地好走、沼澤難走，每一格的權重不一樣；遊戲常用的 A* 演算法，就是 Dijkstra 再加上「離終點大概還有多遠」的估計，先往終點的方向找。',
      '網路的路由（routing）：路由器是點、線路是邊，權重是線路的成本；OSPF 這種路由協定，每台路由器都用 Dijkstra 算出封包往哪裡送成本最低。',
    ],
    concept: [
      '最短路徑（shortest path）問的是：在加權圖（weighted graph）上，從起點到每個點，怎麼走權重加起來最小。荷蘭電腦科學家 Edsger Dijkstra 在 1959 年發表的 Dijkstra 演算法（Dijkstra\'s algorithm），是最常用的解法。',
      '做法是把點分成「已經確定」和「還沒確定」兩群。一開始只知道起點到自己是 0，其他點都寫 ∞（還不知道怎麼走到）。每一輪從還沒確定的點裡，挑目前距離最小的那個確定下來。敢直接確定，是因為權重都不是負的：要繞別的還沒確定的點過來，光是走到那個點就不比它近，後面再走的邊也不會讓路變短。',
      '確定一個點之後，看它每個還沒確定的鄰居：從這個點繞過去，如果比鄰居目前的距離近，就把鄰居的距離改小，這一步叫鬆弛（relaxation）。像這頁的 C：一開始從 A 直接走是 7，確定 B 之後發現 A → B → C 只要 3 + 2 = 5，就改成 5。',
      '權重不能是負的。有負的邊，已經確定的點之後還可能被繞得更近，上面「不會讓路變短」那句就不成立了。有負的權重要改用 Bellman-Ford 演算法：把所有的邊一輪一輪重新鬆弛，做 V − 1 輪（V 是點的數量），還能順便發現「繞一圈會越來越短」的負環（negative cycle）。',
      { text: '「挑距離最小的點」有兩種做法（V 個點、E 條邊）：每次把還沒確定的點掃一遍，是 O(V²)；或是用最小堆積（min heap）當優先佇列，每次拿最上面那個，是 O((V + E) log V)，邊不多的圖比較快。內建的優先佇列沒辦法把裡面的值改小，常見寫法是改小時再放一筆新的進去，之後拿到舊的那筆就跳過。', see: 'heap' },
      { text: '每個點確定時，記下它是從哪個點過來的（圖上加粗的邊）。全部確定後，這些邊連成一棵最短路徑樹（shortest path tree），從 A 沿著樹走到任何一點，都是最短的路。它跟最小生成樹長得像，要的東西卻不一樣。', see: 'mst' },
    ],
    // 各操作的時間複雜度（V 個點、E 條邊；Big-O 的定義與怎麼算在附錄）
    complexity: [['Dijkstra，用最小堆積挑點', 'O((V + E) log V)'], ['Dijkstra，每次把陣列掃一遍挑點', 'O(V²)'], ['Bellman-Ford（可以有負的權重）', 'O(VE)']],
    traps: [
      { wrong: '最短路徑就是經過的邊最少的那條', right: '看的是權重加起來。A 到 C 直接走只要一條邊，長度 7；繞 B 走兩條邊，3 + 2 = 5 比較短。只數邊數的話（每條邊一樣長），初階「圖」那頁的 BFS 一層一層走就找得到。' },
      { wrong: '一個點第一次算到的距離就是答案', right: '還沒確定的點都可能被改小：C 一開始從 A 算到 7，確定 B 之後改成 5；E 先算到 13，確定 D 之後改成 9。要等它被挑出來確定的那一刻，距離才不會再變。' },
      { wrong: '有負的權重也能用 Dijkstra', right: '不行。敢確定一個點，靠的是「再繞別的路不會更近」，有負的邊就不成立，已經確定的點之後可能還有更短的路。有負的權重要用 Bellman-Ford。' },
      { wrong: '把每個點的最短路徑連起來，就是最小生成樹', right: '兩個要的東西不一樣：最短路徑樹讓每個點離起點最近，最小生成樹讓全部的邊加起來最短。這張圖的最短路徑樹是 A–B、B–C、B–D、D–E、D–F，總長 17；最小生成樹是 A–B、B–C、C–D、D–E、D–F，總長 16，差在 B–D 5 和 C–D 4。見最小生成樹那頁。' },
      { wrong: 'C++ 的 priority_queue 拿出來的是最小的', right: 'priority_queue 預設是最大堆積，Dijkstra 要先拿距離最小的，要寫成 priority_queue<T, vector<T>, greater<T>>。Python 的 heapq、Java 的 PriorityQueue 預設才是最小。' },
    ],
    code: {
      python: {
        builtin: `import heapq

edges = [("A", "B", 3), ("A", "C", 7), ("B", "C", 2), ("B", "D", 5), ("C", "D", 4),
         ("C", "E", 8), ("D", "E", 1), ("D", "F", 6), ("E", "F", 9)]
graph = {v: [] for v in "ABCDEF"}
for u, v, w in edges:
    graph[u].append((v, w))
    graph[v].append((u, w))  # 無向邊：兩頭都要記

dist = {v: float("inf") for v in graph}
dist["A"] = 0
heap = [(0, "A")]  # 放 (距離, 點)；heapq 是最小堆積，每次拿出距離最小的
while heap:
    d, u = heapq.heappop(heap)
    if d > dist[u]:
        continue  # 改小之前放進去的舊紀錄，跳過
    for v, w in graph[u]:
        if d + w < dist[v]:  # 鬆弛：從 u 繞過去比較近就改小
            dist[v] = d + w
            heapq.heappush(heap, (dist[v], v))
print(" ".join(str(dist[v]) for v in "ABCDEF"))
`,
        handmade: `INF = float("inf")  # 沒有邊、還沒算到
N = 6  # 0～5 是 A～F
EDGES = [(0, 1, 3), (0, 2, 7), (1, 2, 2), (1, 3, 5), (2, 3, 4),
         (2, 4, 8), (3, 4, 1), (3, 5, 6), (4, 5, 9)]

cost = [[INF] * N for _ in range(N)]  # 相鄰矩陣：cost[u][v] 是 u–v 這條邊的權重
for u, v, w in EDGES:
    cost[u][v] = cost[v][u] = w


def dijkstra(start):
    dist = [INF] * N
    done = [False] * N
    dist[start] = 0
    for _ in range(N):
        u = -1
        for v in range(N):  # 每次把還沒確定的點掃一遍，挑距離最小的
            if not done[v] and (u == -1 or dist[v] < dist[u]):
                u = v
        if dist[u] == INF:
            break  # 剩下的點都走不到
        done[u] = True
        for v in range(N):
            if not done[v] and dist[u] + cost[u][v] < dist[v]:
                dist[v] = dist[u] + cost[u][v]  # 鬆弛：從 u 繞過去比較近就改小
    return dist


print(" ".join(str(d) for d in dijkstra(0)))
`,
      },
      js: {
        builtin: `// JavaScript 沒有內建的堆積：這裡每次從還沒確定的點裡挑距離最小的（挑一次要把那些點看過一遍），要用堆積就得自己刻
const edges = [['A', 'B', 3], ['A', 'C', 7], ['B', 'C', 2], ['B', 'D', 5], ['C', 'D', 4], ['C', 'E', 8], ['D', 'E', 1], ['D', 'F', 6], ['E', 'F', 9]];
const graph = new Map([...'ABCDEF'].map((v) => [v, []]));
for (const [u, v, w] of edges) {
  graph.get(u).push([v, w]);
  graph.get(v).push([u, w]); // 無向邊：兩頭都要記
}

const dist = new Map([...graph.keys()].map((v) => [v, Infinity]));
dist.set('A', 0);
const unsettled = new Set(graph.keys()); // 還沒確定的點
while (unsettled.size) {
  let u = null;
  for (const v of unsettled) if (u === null || dist.get(v) < dist.get(u)) u = v;
  unsettled.delete(u);
  for (const [v, w] of graph.get(u)) {
    if (unsettled.has(v) && dist.get(u) + w < dist.get(v)) dist.set(v, dist.get(u) + w); // 鬆弛：從 u 繞過去比較近就改小
  }
}
console.log([...dist.values()].join(' '));
`,
        handmade: `const INF = Infinity; // 沒有邊、還沒算到
const N = 6; // 0～5 是 A～F
const EDGES = [[0, 1, 3], [0, 2, 7], [1, 2, 2], [1, 3, 5], [2, 3, 4], [2, 4, 8], [3, 4, 1], [3, 5, 6], [4, 5, 9]];

const cost = Array.from({ length: N }, () => new Array(N).fill(INF)); // 相鄰矩陣：cost[u][v] 是 u–v 這條邊的權重
for (const [u, v, w] of EDGES) cost[u][v] = cost[v][u] = w;

function dijkstra(start) {
  const dist = new Array(N).fill(INF);
  const done = new Array(N).fill(false);
  dist[start] = 0;
  for (let round = 0; round < N; round++) {
    let u = -1;
    for (let v = 0; v < N; v++) { // 每次把還沒確定的點掃一遍，挑距離最小的
      if (!done[v] && (u === -1 || dist[v] < dist[u])) u = v;
    }
    if (dist[u] === INF) break; // 剩下的點都走不到
    done[u] = true;
    for (let v = 0; v < N; v++) {
      if (!done[v] && dist[u] + cost[u][v] < dist[v]) dist[v] = dist[u] + cost[u][v]; // 鬆弛：從 u 繞過去比較近就改小
    }
  }
  return dist;
}

console.log(dijkstra(0).join(' '));
`,
      },
      java: {
        builtin: `import java.util.*;

public class Main {
    static final int INF = 1_000_000_000; // 還沒算到

    public static void main(String[] args) {
        int n = 6; // 0～5 是 A～F
        int[][] edges = {{0, 1, 3}, {0, 2, 7}, {1, 2, 2}, {1, 3, 5}, {2, 3, 4}, {2, 4, 8}, {3, 4, 1}, {3, 5, 6}, {4, 5, 9}};
        List<List<int[]>> graph = new ArrayList<>(); // graph.get(u) 放 {鄰居, 權重}
        for (int i = 0; i < n; i++) graph.add(new ArrayList<>());
        for (int[] e : edges) {
            graph.get(e[0]).add(new int[] {e[1], e[2]});
            graph.get(e[1]).add(new int[] {e[0], e[2]}); // 無向邊：兩頭都要記
        }

        int[] dist = new int[n];
        Arrays.fill(dist, INF);
        dist[0] = 0;
        // 放 {距離, 點}，照距離比大小；PriorityQueue 預設是最小堆積，每次拿出距離最小的
        PriorityQueue<int[]> heap = new PriorityQueue<>((p, q) -> Integer.compare(p[0], q[0]));
        heap.add(new int[] {0, 0});
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int d = top[0], u = top[1];
            if (d > dist[u]) continue; // 改小之前放進去的舊紀錄，跳過
            for (int[] next : graph.get(u)) {
                int v = next[0], w = next[1];
                if (d + w < dist[v]) { // 鬆弛：從 u 繞過去比較近就改小
                    dist[v] = d + w;
                    heap.add(new int[] {dist[v], v});
                }
            }
        }
        StringJoiner out = new StringJoiner(" ");
        for (int d : dist) out.add(String.valueOf(d));
        System.out.println(out);
    }
}
`,
        handmade: `public class Main {
    static final int INF = 1_000_000_000; // 沒有邊、還沒算到；不用 Integer.MAX_VALUE，加上權重才不會溢位
    static final int N = 6; // 0～5 是 A～F
    static final int[][] cost = new int[N][N]; // 相鄰矩陣：cost[u][v] 是 u–v 這條邊的權重

    static int[] dijkstra(int start) {
        int[] dist = new int[N];
        boolean[] done = new boolean[N];
        for (int v = 0; v < N; v++) dist[v] = INF;
        dist[start] = 0;
        for (int round = 0; round < N; round++) {
            int u = -1;
            for (int v = 0; v < N; v++) { // 每次把還沒確定的點掃一遍，挑距離最小的
                if (!done[v] && (u == -1 || dist[v] < dist[u])) u = v;
            }
            if (dist[u] == INF) break; // 剩下的點都走不到
            done[u] = true;
            for (int v = 0; v < N; v++) {
                if (!done[v] && dist[u] + cost[u][v] < dist[v]) dist[v] = dist[u] + cost[u][v]; // 鬆弛：從 u 繞過去比較近就改小
            }
        }
        return dist;
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1, 3}, {0, 2, 7}, {1, 2, 2}, {1, 3, 5}, {2, 3, 4}, {2, 4, 8}, {3, 4, 1}, {3, 5, 6}, {4, 5, 9}};
        for (int u = 0; u < N; u++) for (int v = 0; v < N; v++) cost[u][v] = INF;
        for (int[] e : edges) cost[e[0]][e[1]] = cost[e[1]][e[0]] = e[2];
        int[] dist = dijkstra(0);
        StringBuilder out = new StringBuilder();
        for (int v = 0; v < N; v++) out.append(v > 0 ? " " : "").append(dist[v]);
        System.out.println(out);
    }
}
`,
      },
      cpp: {
        builtin: `#include <functional>
#include <iostream>
#include <queue>
#include <utility>
#include <vector>

using Item = std::pair<int, int>; // {距離, 點}
const int INF = 1000000000; // 還沒算到

int main() {
    const int n = 6; // 0～5 是 A～F
    int edges[][3] = {{0, 1, 3}, {0, 2, 7}, {1, 2, 2}, {1, 3, 5}, {2, 3, 4}, {2, 4, 8}, {3, 4, 1}, {3, 5, 6}, {4, 5, 9}};
    std::vector<std::vector<std::pair<int, int>>> graph(n); // graph[u] 放 {鄰居, 權重}
    for (auto& e : edges) {
        graph[e[0]].push_back({e[1], e[2]});
        graph[e[1]].push_back({e[0], e[2]}); // 無向邊：兩頭都要記
    }

    std::vector<int> dist(n, INF);
    dist[0] = 0;
    // priority_queue 預設是最大堆積；第三個參數給 std::greater，才會每次拿出距離最小的
    std::priority_queue<Item, std::vector<Item>, std::greater<Item>> heap;
    heap.push({0, 0});
    while (!heap.empty()) {
        auto [d, u] = heap.top();
        heap.pop();
        if (d > dist[u]) continue; // 改小之前放進去的舊紀錄，跳過
        for (auto [v, w] : graph[u]) {
            if (d + w < dist[v]) { // 鬆弛：從 u 繞過去比較近就改小
                dist[v] = d + w;
                heap.push({dist[v], v});
            }
        }
    }
    for (int v = 0; v < n; v++) std::cout << (v ? " " : "") << dist[v];
    std::cout << "\\n";
}
`,
        handmade: `#include <iostream>

const int INF = 1000000000; // 沒有邊、還沒算到；不用 INT_MAX，加上權重才不會溢位
const int N = 6; // 0～5 是 A～F
int cost[N][N]; // 相鄰矩陣：cost[u][v] 是 u–v 這條邊的權重

void dijkstra(int start, int dist[N]) {
    bool done[N] = {};
    for (int v = 0; v < N; v++) dist[v] = INF;
    dist[start] = 0;
    for (int round = 0; round < N; round++) {
        int u = -1;
        for (int v = 0; v < N; v++) { // 每次把還沒確定的點掃一遍，挑距離最小的
            if (!done[v] && (u == -1 || dist[v] < dist[u])) u = v;
        }
        if (dist[u] == INF) break; // 剩下的點都走不到
        done[u] = true;
        for (int v = 0; v < N; v++) {
            if (!done[v] && dist[u] + cost[u][v] < dist[v]) dist[v] = dist[u] + cost[u][v]; // 鬆弛：從 u 繞過去比較近就改小
        }
    }
}

int main() {
    int edges[][3] = {{0, 1, 3}, {0, 2, 7}, {1, 2, 2}, {1, 3, 5}, {2, 3, 4}, {2, 4, 8}, {3, 4, 1}, {3, 5, 6}, {4, 5, 9}};
    for (int u = 0; u < N; u++) for (int v = 0; v < N; v++) cost[u][v] = INF;
    for (auto& e : edges) cost[e[0]][e[1]] = cost[e[1]][e[0]] = e[2];
    int dist[N];
    dijkstra(0, dist);
    for (int v = 0; v < N; v++) std::cout << (v ? " " : "") << dist[v];
    std::cout << "\\n";
}
`,
      },
      output: '0 3 5 8 9 14',
    },
    // 沙盒：一顆「確定下一個點」，一開始只有 A 是 0、其他都是 ∞；六個點都確定了再按是錯誤
    sandbox: {
      ops: [{ op: 'settle', label: '確定下一個點' }],
      errors: { done: '六個點都確定了，表上的距離就是從 A 出發的最短距離。' },
      init() { return { dist: Object.fromEntries(NAMES.map(v => [v, v === START ? 0 : Infinity])), prev: {}, done: [], current: null, improved: [], error: null }; },
      apply(s) {
        if (s.done.length === NAMES.length) return { ...s, current: null, improved: [], error: 'done' };
        return settleNext(s);
      },
      label(op, s) {
        const changes = s.improved.map(({ v, was }) => `${v} ${was === Infinity ? '' : '改成 '}${s.dist[v]}`);
        return `確定 ${s.current}（${s.dist[s.current]}）${changes.length ? `：${changes.join('、')}` : ''}`;
      },
    },
    // 上面是圖（邊上標權重）、下面是每個點目前的距離。點和格子同一套顏色：確定過的 FILL、這一步改小的黃色、其他留白；
    // 這一步確定的點外框加粗，確定過的點連回來源的那條邊加粗（全部確定後就是最短路徑樹）。seed 固定，同一格每次畫出來一樣
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { dist, prev, done, current, improved }, { sandbox = false } = {}) {
      const s = svgEl(W, HEIGHT); const rc = rough.svg(s);
      if (sandbox) { s.setAttribute('width', Math.round(W * SANDBOX_SCALE)); s.setAttribute('height', Math.round(HEIGHT * SANDBOX_SCALE)); }
      const changed = improved.map(({ v }) => v);
      const fillOf = (v) => (changed.includes(v) ? NEW : done.includes(v) ? FILL : null);
      const filled = (fill) => (fill ? { fill, fillStyle: 'hachure', hachureGap: 4 } : {});
      const inTree = (a, b) => (done.includes(b) && prev[b] === a) || (done.includes(a) && prev[a] === b);

      EDGES.forEach(([a, b, w], i) => {   // 邊畫到圓圈外緣為止，權重標在中點往外推一點
        const [x1, y1] = POS[a], [x2, y2] = POS[b], len = Math.hypot(x2 - x1, y2 - y1);
        const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
        s.append(rc.line(x1 + ux * R, y1 + uy * R, x2 - ux * R, y2 - uy * R, { stroke: INK, strokeWidth: inTree(a, b) ? 3 : 1.4, roughness: 1, seed: 30 + i }));
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const side = -uy * (mx - CENTER[0]) + ux * (my - CENTER[1]) >= 0 ? 1 : -1;
        svgText(s, mx - uy * WEIGHT_GAP * side, my + ux * WEIGHT_GAP * side, String(w), 11);
      });
      NAMES.forEach((v, i) => {
        const [x, y] = POS[v];
        s.append(rc.circle(x, y, R * 2, { stroke: INK, strokeWidth: v === current ? 2.6 : 1.4, roughness: 1, seed: 40 + i, ...filled(fillOf(v)) }));
        svgText(s, x, y, v, 14);
      });

      svgText(s, ROW_X / 2, ROW_Y + CELL_H / 2, '距離', 11);
      NAMES.forEach((v, i) => {
        const x = ROW_X + i * CELL_W;
        s.append(rc.rectangle(x, ROW_Y, CELL_W, CELL_H, { stroke: INK, roughness: 0.8, seed: 60 + i, ...filled(fillOf(v)) }));
        svgText(s, x + CELL_W / 2, ROW_Y - 8, v, 10);
        svgText(s, x + CELL_W / 2, ROW_Y + CELL_H / 2, dist[v] === Infinity ? '∞' : String(dist[v]), 12);
      });
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('shortest_path', page);
})(typeof window !== 'undefined' ? window : globalThis);
