// classroom/graph.js — 小教室「Graph 圖」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 這頁固定的圖：6 個頂點、7 條無向邊，從 A 出發；邊照字母順序列，鄰居也照字母順序
  const NAMES = ['A', 'B', 'C', 'D', 'E', 'F'];
  const EDGES = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'E'], ['C', 'F'], ['E', 'F']];
  const START = 'A';
  const NEIGHBORS = Object.fromEntries(NAMES.map(v => [v, EDGES.flatMap(([a, b]) => (a === v ? [b] : b === v ? [a] : [])).sort()]));
  const firstUnvisited = (v, visited) => NEIGHBORS[v].find(w => !visited.includes(w));

  // 開始一種走法：BFS 先把起點排進佇列；DFS 的堆疊是「目前走的這條路」，第一步才走到起點
  const start = (mode) => ({ mode, visited: [], queue: mode === 'bfs' ? [START] : [], stack: [], current: null, error: null });
  // BFS 一步：拜訪佇列最前面的點，把還沒排過的鄰居排到後面（走過的、排著的都算排過）
  function bfsStep(s) {
    const [current, ...rest] = s.queue;
    const queued = [...s.visited, ...s.queue];
    return { ...s, visited: [...s.visited, current], queue: [...rest, ...NEIGHBORS[current].filter(w => !queued.includes(w))], current, error: null };
  }
  // DFS 一步：從頂端那個點走到字母最小、還沒走過的鄰居；頂端沒路可走就退一格再找
  function dfsStep(s) {
    if (!s.stack.length) return { ...s, visited: [START], stack: [START], current: START, error: null };
    const stack = [...s.stack];
    while (!firstUnvisited(stack.at(-1), s.visited)) stack.pop();
    const next = firstUnvisited(stack.at(-1), s.visited);
    return { ...s, visited: [...s.visited, next], stack: [...stack, next], current: next, error: null };
  }

  // 畫圖的位置：照離 A 幾步排成三欄（BFS 的一層一層看得出來），像一張小捷運圖
  const POS = { A: [28, 66], B: [104, 26], C: [104, 106], D: [180, 26], E: [180, 66], F: [180, 106] };
  const CENTER = [104, 66];   // 第幾個走到的數字標在頂點朝外的那一側，不壓到邊
  const RADIUS = 13, SLOTS = 5, SANDBOX_SCALE = 1.35;   // 佇列最多排 3 個、堆疊最深 5 個

  const page = {
    analogy: '捷運路線圖：站是點、路線是邊。',
    summary: '下次打開捷運路線圖、用地圖 App 找路，你就知道：那是一張圖，站是點、路線是邊。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['bfs', 'bfs', 'bfs', 'bfs', 'bfs', 'bfs'],
    uses: [
      '捷運轉乘、地圖導航：車站或路口是點、路線或道路是邊，App 就是在這張圖上幫你找路。',
      '社群網站的「你可能認識的人」：每個人是點、朋友關係是邊，朋友的朋友就是從你出發走兩步到得了的人——BFS 的第二層。',
      '網頁之間的超連結：每個網頁是點、連結是有方向的邊；搜尋引擎的爬蟲沿著邊一頁一頁走，把網頁收進來。',
      '安裝套件、編譯程式的相依關係：「要先有 A 才能裝 B」是一條有方向的邊，電腦照著這些邊排出先後順序。',
    ],
    concept: [
      '圖（Graph）由頂點（vertex）和邊（edge）組成：頂點是東西，邊把兩個有關係的頂點連起來。有邊直接連著的兩個頂點叫相鄰（adjacent），也就是彼此的鄰居。圖論從 1736 年尤拉（Euler）的七橋問題開始：他把陸地看成點、橋看成邊，證明七座橋沒辦法各走一次走完——就是一筆畫問題。',
      '邊沒有方向的叫無向圖（undirected graph），像捷運兩個方向都能搭；邊有方向的叫有向圖（directed graph），像單行道、社群網站的追蹤（你追蹤他，他不一定追蹤你）。邊上帶數字（距離、票價、時間）的叫加權圖（weighted graph）。',
      '一張有 n 個頂點、e 條邊的圖，常見兩種存法。相鄰矩陣（adjacency matrix）是 n × n 的表格，第 i 列第 j 行填 1 代表 i 和 j 之間有邊：問「這兩點有沒有邊」看一格就知道，但不管邊多少都要 n² 格。相鄰串列（adjacency list）是每個頂點各記一串自己的鄰居：只記真的有的邊，省空間、列出鄰居也快，但問兩點有沒有邊要翻那一串。',
      '把每個頂點都走過一次叫走訪（traversal），有兩種走法。廣度優先搜尋（BFS，Breadth-First Search）靠前面的佇列（Queue）：先走完離起點一步的點，再走兩步的，一層一層往外；佇列先進先出，所以先排到的、離起點近的先走。',
      '深度優先搜尋（DFS，Depth-First Search）靠前面的堆疊（Stack）：一條路走到底，走不下去就退回上一個點，換一個還沒走過的鄰居。堆疊後進先出，最後走到的點最先退掉；寫成遞迴時，幫你記這條路的就是 call stack。',
      { text: '圖還有很多經典問題：最短路徑（Dijkstra）、最小生成樹（Prim、Kruskal）、拓樸排序，屬於研究所考試的範圍，進階篇各有一頁。', see: ['shortest_path', 'mst', 'topological_sort'] },
    ],
    // 各操作的時間複雜度（n 個頂點、e 條邊；Big-O 的定義與怎麼算在附錄 D）
    complexity: [
      ['查兩點之間有沒有邊（相鄰矩陣）', 'O(1)'],
      ['查兩點之間有沒有邊（相鄰串列）', 'O(n)'],
      ['BFS／DFS 走訪（相鄰串列）', 'O(n + e)'],
      ['BFS／DFS 走訪（相鄰矩陣）', 'O(n²)'],
      ['相鄰串列佔的空間', 'O(n + e)'],
      ['相鄰矩陣佔的空間', 'O(n²)'],
    ],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: '樹和圖是兩種不一樣的東西', right: '樹就是一種圖：連通（任兩點之間都有路）、而且沒有環的圖。n 個頂點的樹剛好 n − 1 條邊，再多一條就會出現環。' },
      { wrong: '照著鄰居一直走就好，不用記走過哪裡', right: '圖可能有環，像這頁的 A → B → E → C → A。不標記走過的點，就會在環上繞不停。' },
      { wrong: 'BFS 的點從佇列拿出來時再標記就好', right: '這樣同一個點會被排進去好幾次：這頁的 E 會被 B 排一次、被 C 再排一次。要在排進佇列的那一刻就標記，所以沙盒說「把還沒排過的鄰居排進去」。' },
      { wrong: 'BFS、DFS 走出來的順序只有一種', right: '要看鄰居先看誰。這頁約定照字母順序，BFS 是 A B C D E F；如果 B 的鄰居先看 E 再看 D，就變成 A B C E D F。考題通常會講好「字母（或編號）小的先走」，沒講的話答案不只一種。' },
      { wrong: '無向圖的一條邊，存一次就好', right: 'A–B 要在 A 的串列記 B、也在 B 的串列記 A（矩陣是 [A][B] 和 [B][A] 都填 1），所以相鄰串列總共記 2e 筆。只記一邊，就變成有向圖了。' },
      { wrong: '相鄰矩陣查得快，所以一定比較好', right: '要看圖長什麼樣子。矩陣不管幾條邊都佔 n² 格：一萬個人就是一億格，社群網站這種每個人只連少數朋友的圖（稀疏圖），大部分格子都是 0。邊少用相鄰串列；邊很多（稠密圖）、或常常要問兩點有沒有邊，才用矩陣。' },
    ],
    code: {
      python: {
        builtin: `# 內建的沒有圖，考試要自己刻；這裡用字典存相鄰串列、deque 當佇列
from collections import deque

edges = [("A", "B"), ("A", "C"), ("B", "D"), ("B", "E"), ("C", "E"), ("C", "F"), ("E", "F")]
graph = {v: [] for v in "ABCDEF"}
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)  # 無向邊：兩頭都要記

visited = {"A"}
queue = deque(["A"])
order = []
while queue:
    v = queue.popleft()
    order.append(v)
    for w in graph[v]:
        if w not in visited:
            visited.add(w)  # 排進佇列就標記，同一個點才不會排兩次
            queue.append(w)
print(" ".join(order))
`,
        handmade: `# 自己刻：相鄰矩陣存圖、陣列加 front／rear 當佇列
NAMES = "ABCDEF"
N = len(NAMES)
EDGES = [(0, 1), (0, 2), (1, 3), (1, 4), (2, 4), (2, 5), (4, 5)]  # 0～5 是 A～F

adj = [[0] * N for _ in range(N)]
for u, v in EDGES:
    adj[u][v] = adj[v][u] = 1  # 無向邊：矩陣沿對角線對稱


def bfs(start):
    visited = [False] * N
    queue = [0] * N  # 每個點最多排進來一次，長度 N 就夠
    front = rear = 0  # front 指第一個，rear 指下一個空位
    order = []
    visited[start] = True
    queue[rear] = start
    rear += 1
    while front < rear:
        v = queue[front]
        front += 1
        order.append(NAMES[v])
        for w in range(N):  # 照 A～F 的順序看鄰居
            if adj[v][w] and not visited[w]:
                visited[w] = True  # 排進佇列就標記，同一個點才不會排兩次
                queue[rear] = w
                rear += 1
    return order


print(" ".join(bfs(0)))
`,
      },
      js: {
        builtin: `// 內建的沒有圖，考試要自己刻；這裡用 Map 存相鄰串列、陣列當佇列（push 排進來、shift 叫號）
const edges = [['A', 'B'], ['A', 'C'], ['B', 'D'], ['B', 'E'], ['C', 'E'], ['C', 'F'], ['E', 'F']];
const graph = new Map([...'ABCDEF'].map((v) => [v, []]));
for (const [u, v] of edges) {
  graph.get(u).push(v);
  graph.get(v).push(u); // 無向邊：兩頭都要記
}

const visited = new Set(['A']);
const queue = ['A'];
const order = [];
while (queue.length) {
  const v = queue.shift();
  order.push(v);
  for (const w of graph.get(v)) {
    if (!visited.has(w)) {
      visited.add(w); // 排進佇列就標記，同一個點才不會排兩次
      queue.push(w);
    }
  }
}
console.log(order.join(' '));
`,
        handmade: `// 自己刻：相鄰矩陣存圖、陣列加 front／rear 當佇列
const NAMES = 'ABCDEF';
const N = NAMES.length;
const EDGES = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [2, 5], [4, 5]]; // 0～5 是 A～F

const adj = Array.from({ length: N }, () => new Array(N).fill(0));
for (const [u, v] of EDGES) adj[u][v] = adj[v][u] = 1; // 無向邊：矩陣沿對角線對稱

function bfs(start) {
  const visited = new Array(N).fill(false);
  const queue = new Array(N); // 每個點最多排進來一次，長度 N 就夠
  let front = 0, rear = 0; // front 指第一個，rear 指下一個空位
  const order = [];
  visited[start] = true;
  queue[rear++] = start;
  while (front < rear) {
    const v = queue[front++];
    order.push(NAMES[v]);
    for (let w = 0; w < N; w++) { // 照 A～F 的順序看鄰居
      if (adj[v][w] && !visited[w]) {
        visited[w] = true; // 排進佇列就標記，同一個點才不會排兩次
        queue[rear++] = w;
      }
    }
  }
  return order;
}

console.log(bfs(0).join(' '));
`,
      },
      java: {
        builtin: `// 內建的沒有圖，考試要自己刻；這裡用 HashMap 存相鄰串列、ArrayDeque 當佇列
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[][] edges = {{"A", "B"}, {"A", "C"}, {"B", "D"}, {"B", "E"}, {"C", "E"}, {"C", "F"}, {"E", "F"}};
        Map<String, List<String>> graph = new HashMap<>();
        for (String v : "ABCDEF".split("")) graph.put(v, new ArrayList<>());
        for (String[] e : edges) {
            graph.get(e[0]).add(e[1]);
            graph.get(e[1]).add(e[0]); // 無向邊：兩頭都要記
        }

        Set<String> visited = new HashSet<>(List.of("A"));
        Queue<String> queue = new ArrayDeque<>(List.of("A"));
        List<String> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            String v = queue.poll();
            order.add(v);
            for (String w : graph.get(v)) {
                if (!visited.contains(w)) {
                    visited.add(w); // 排進佇列就標記，同一個點才不會排兩次
                    queue.offer(w);
                }
            }
        }
        System.out.println(String.join(" ", order));
    }
}
`,
        handmade: `// 自己刻：相鄰矩陣存圖、陣列加 front／rear 當佇列
public class Main {
    static final String NAMES = "ABCDEF";
    static final int N = NAMES.length();
    static final int[][] adj = new int[N][N];

    static String bfs(int start) {
        boolean[] visited = new boolean[N];
        int[] queue = new int[N]; // 每個點最多排進來一次，長度 N 就夠
        int front = 0, rear = 0; // front 指第一個，rear 指下一個空位
        StringBuilder order = new StringBuilder();
        visited[start] = true;
        queue[rear++] = start;
        while (front < rear) {
            int v = queue[front++];
            if (order.length() > 0) order.append(' ');
            order.append(NAMES.charAt(v));
            for (int w = 0; w < N; w++) { // 照 A～F 的順序看鄰居
                if (adj[v][w] == 1 && !visited[w]) {
                    visited[w] = true; // 排進佇列就標記，同一個點才不會排兩次
                    queue[rear++] = w;
                }
            }
        }
        return order.toString();
    }

    public static void main(String[] args) {
        int[][] edges = {{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 4}, {2, 5}, {4, 5}}; // 0～5 是 A～F
        for (int[] e : edges) adj[e[0]][e[1]] = adj[e[1]][e[0]] = 1; // 無向邊：矩陣沿對角線對稱
        System.out.println(bfs(0));
    }
}
`,
      },
      cpp: {
        builtin: `// 內建的沒有圖，考試要自己刻；這裡用 std::map 存相鄰串列、std::queue 當佇列
#include <iostream>
#include <map>
#include <queue>
#include <set>
#include <string>
#include <utility>
#include <vector>

int main() {
    std::vector<std::pair<char, char>> edges = {{'A', 'B'}, {'A', 'C'}, {'B', 'D'}, {'B', 'E'}, {'C', 'E'}, {'C', 'F'}, {'E', 'F'}};
    std::map<char, std::vector<char>> graph;
    for (auto [u, v] : edges) {
        graph[u].push_back(v);
        graph[v].push_back(u); // 無向邊：兩頭都要記
    }

    std::set<char> visited = {'A'};
    std::queue<char> queue;
    queue.push('A');
    std::string order;
    while (!queue.empty()) {
        char v = queue.front(); queue.pop();
        if (!order.empty()) order += ' ';
        order += v;
        for (char w : graph[v]) {
            if (!visited.count(w)) {
                visited.insert(w); // 排進佇列就標記，同一個點才不會排兩次
                queue.push(w);
            }
        }
    }
    std::cout << order << "\\n";
}
`,
        handmade: `// 自己刻：相鄰矩陣存圖、陣列加 front／rear 當佇列
#include <iostream>
#include <string>

const char NAMES[] = "ABCDEF";
const int N = 6;
int adj[N][N];

std::string bfs(int start) {
    bool visited[N] = {};
    int queue[N]; // 每個點最多排進來一次，長度 N 就夠
    int front = 0, rear = 0; // front 指第一個，rear 指下一個空位
    std::string order;
    visited[start] = true;
    queue[rear++] = start;
    while (front < rear) {
        int v = queue[front++];
        if (!order.empty()) order += ' ';
        order += NAMES[v];
        for (int w = 0; w < N; w++) { // 照 A～F 的順序看鄰居
            if (adj[v][w] && !visited[w]) {
                visited[w] = true; // 排進佇列就標記，同一個點才不會排兩次
                queue[rear++] = w;
            }
        }
    }
    return order;
}

int main() {
    int edges[][2] = {{0, 1}, {0, 2}, {1, 3}, {1, 4}, {2, 4}, {2, 5}, {4, 5}}; // 0～5 是 A～F
    for (auto& e : edges) adj[e[0]][e[1]] = adj[e[1]][e[0]] = 1; // 無向邊：矩陣沿對角線對稱
    std::cout << bfs(0) << "\\n";
}
`,
      },
      output: 'A B C D E F',
    },
    // 沙盒：BFS、DFS 各一顆「下一步」；按的跟正在做的不同種，就從 A 重新開始那一種；六個點都走過再按是錯誤
    sandbox: {
      ops: [{ op: 'bfs', label: 'BFS 下一步' }, { op: 'dfs', label: 'DFS 下一步' }],
      errors: { done: '六個站都走過了' },
      init() { return { mode: null, visited: [], queue: [], stack: [], current: null, error: null }; },
      apply(s, op) {
        const run = s.mode === op ? s : start(op);
        if (run.visited.length === NAMES.length) return { ...run, current: null, error: 'done' };
        return op === 'bfs' ? bfsStep(run) : dfsStep(run);
      },
      label(op, s) {
        const [name, items] = op === 'bfs' ? ['佇列', s.queue] : ['堆疊', s.stack];
        return `${op.toUpperCase()}：拜訪 ${s.current}，${name}${items.length ? ` ${items.join(' ')}` : '空了'}`;
      },
    },
    // 上面是圖、下面是 BFS 的佇列（兩頭開的管子）或 DFS 的堆疊（橫躺、只有右邊開口）。
    // 頂點和格子同一套顏色：走過的 FILL、這一步拜訪的黃色、還沒走到的留白；走過的點旁邊標第幾個走到
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { mode, visited, queue, stack, current }, { sandbox = false } = {}) {
      const w = 220, hgt = 186, r = RADIUS;
      const s = svgEl(w, hgt); const rc = rough.svg(s);
      if (sandbox) { s.setAttribute('width', Math.round(w * SANDBOX_SCALE)); s.setAttribute('height', Math.round(hgt * SANDBOX_SCALE)); }
      const fillOf = (v) => (v === current ? NEW : visited.includes(v) ? FILL : null);
      const filled = (fill) => (fill ? { fill, fillStyle: 'hachure', hachureGap: 4 } : {});

      EDGES.forEach(([a, b], i) => {   // 邊畫到圓圈外緣為止，才不會穿過頂點
        const [x1, y1] = POS[a], [x2, y2] = POS[b], len = Math.hypot(x2 - x1, y2 - y1);
        const dx = ((x2 - x1) / len) * r, dy = ((y2 - y1) / len) * r;
        s.append(rc.line(x1 + dx, y1 + dy, x2 - dx, y2 - dy, { stroke: INK, strokeWidth: 1.6, roughness: 1, seed: 30 + i }));
      });
      NAMES.forEach((v, i) => {
        const [x, y] = POS[v];
        s.append(rc.circle(x, y, r * 2, { stroke: INK, strokeWidth: 1.4, roughness: 1, seed: 40 + i, ...filled(fillOf(v)) }));
        svgText(s, x, y, v);
        if (visited.includes(v)) {
          const ox = x - CENTER[0], oy = y - CENTER[1], len = Math.hypot(ox, oy);
          svgText(s, x + (ox / len) * (r + 7), y + (oy / len) * (r + 7), String(visited.indexOf(v) + 1), 10);
        }
      });

      const top = 138, bot = 166, mid = (top + bot) / 2, slot = 28, x0 = 46, x1 = x0 + SLOTS * slot + 4;
      if (!mode) { svgText(s, w / 2, mid, 'BFS 畫佇列、DFS 畫堆疊', 12); return s; }
      const items = mode === 'bfs' ? queue : stack;
      svgText(s, 22, mid, mode === 'bfs' ? '佇列' : '堆疊', 13);
      const line = { stroke: INK, strokeWidth: 1.6, roughness: 1.2 };
      if (mode === 'bfs') {
        s.append(rc.line(x0, top, x1, top, { ...line, seed: 7 }));
        s.append(rc.line(x0, bot, x1, bot, { ...line, seed: 8 }));
      } else s.append(rc.linearPath([[x1, top], [x0, top], [x0, bot], [x1, bot]], { ...line, seed: 9 }));
      items.forEach((v, i) => {
        const x = x0 + 4 + i * slot;
        s.append(rc.rectangle(x, top + 4, slot - 4, bot - top - 8, { stroke: INK, roughness: 1, seed: 50 + i, ...filled(fillOf(v)) }));
        svgText(s, x + (slot - 4) / 2, mid, v, 13);
      });
      const [left, right] = mode === 'bfs' ? ['front', 'rear'] : ['bottom', 'top'];
      svgText(s, x0, hgt - 9, left, 10); svgText(s, x1, hgt - 9, right, 10);
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('ds', 'graph', page);
})(typeof window !== 'undefined' ? window : globalThis);
