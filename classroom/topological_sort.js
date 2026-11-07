// classroom/topological_sort.js — 小教室「Topological Sort 拓樸排序」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 七門課照課號排；short 是圖上方塊裡寫的簡稱
  const COURSES = [
    { id: 'CS101', name: '計算機概論', short: '計概' },
    { id: 'CS102', name: '程式設計', short: '程設' },
    { id: 'CS103', name: '離散數學', short: '離散' },
    { id: 'CS201', name: '計算機組織', short: '計組' },
    { id: 'CS202', name: '資料結構', short: '資結' },
    { id: 'CS301', name: '作業系統', short: '作業系統' },
    { id: 'CS302', name: '演算法', short: '演算法' },
  ];
  // 八條先修：[先修, 後修]。修完一門時，後面的課照這張表的順序處理
  const PREREQS = [
    ['CS101', 'CS102'], ['CS101', 'CS201'], ['CS102', 'CS202'], ['CS103', 'CS202'],
    ['CS103', 'CS302'], ['CS202', 'CS302'], ['CS202', 'CS301'], ['CS201', 'CS301'],
  ];
  const IDS = COURSES.map(c => c.id);
  const NAME = Object.fromEntries(COURSES.map(c => [c.id, c.name]));
  const NEXT = Object.fromEntries(IDS.map(id => [id, PREREQS.filter(([from]) => from === id).map(([, to]) => to)]));
  const INDEGREE = Object.fromEntries(IDS.map(id => [id, PREREQS.filter(([, to]) => to === id).length]));

  // Kahn 演算法的一步：修佇列最前面那門課，它後面的課入度各減 1，減到 0 的排到佇列最後面
  function takeNext(s) {
    const [current, ...rest] = s.queue;
    const indegree = { ...s.indegree };
    for (const c of NEXT[current]) indegree[c] -= 1;
    const unlocked = NEXT[current].filter(c => indegree[c] === 0);
    return { ...s, taken: [...s.taken, current], queue: [...rest, ...unlocked], indegree, current, lowered: NEXT[current], unlocked, error: null };
  }

  // 畫圖的位置：由左到右是先修到後修（第幾欄＝前面最多連著幾門先修），沒有邊交叉
  const POS = { CS101: [24, 18], CS201: [88, 18], CS301: [216, 18], CS102: [88, 62], CS202: [152, 80], CS103: [24, 110], CS302: [216, 110] };
  const BOX_W = 42, BOX_H = 30, SANDBOX_SCALE = 1.25, SLOTS = 4;   // 佇列最多同時排 3 門
  // 從 a 的中心往 b 的中心走，碰到 a 的方塊邊緣的那一點
  const boxEdge = ([ax, ay], [bx, by]) => {
    const dx = bx - ax, dy = by - ay, t = Math.min(BOX_W / 2 / Math.abs(dx || 1e-9), BOX_H / 2 / Math.abs(dy || 1e-9));
    return [ax + dx * t, ay + dy * t];
  };

  const page = {
    analogy: '選課的先修科目：計算機概論修過，才能修程式設計。',
    summary: '下次選課看到「先修科目」那一欄，你就知道：那是一張有向圖，照拓樸排序修，每門課修的時候先修都已經修過了。',   // 總結：呼應開頭的比喻
    frames: ['take', 'take', 'take', 'take', 'take', 'take', 'take'],
    uses: [
      '早上出門穿衣服：襪子穿了才能穿鞋、襯衫穿了才能打領帶；先穿襪子還是先穿襯衫都可以，先後對了就好。',
      '修課規劃、專案的工作排程：前面的課修完、前面的工作做完，後面的才能開始；排出一個照著做就不會卡住的順序，也看得出哪些可以同時進行。',
      '試算表重算公式：C1 = A1 + B1、D1 = C1 × 2，改了 A1 就要先重算 C1、再算 D1。試算表照儲存格之間的相依關係排好順序再算，公式繞成一圈就會跳出「循環參照」的警告。',
      '安裝套件、編譯程式：pip 安裝時先裝被依賴的套件（官方文件就寫它照「拓樸順序」裝），Make 先做好被依賴的檔案，再做用到它們的那個。',
    ],
    concept: [
      { text: '拓樸排序（topological sort）用在有向圖（directed graph）上：每門課是一個頂點，「計概 → 程設」這條有方向的邊代表計概要先修。把所有頂點排成一列，讓每一條邊都從前面指到後面，就是一個拓樸順序（topological order）；照著修，每門課修的時候先修都已經修過了。', see: 'graph' },
      '指進一個頂點的邊有幾條，叫它的入度（in-degree），在這裡就是「還差幾門先修」。入度是 0 的課現在就能修；修完一門，就把它指出去的邊拿掉（圖上畫成虛線），那幾門課的入度各少 1。',
      { text: 'Kahn 演算法（Kahn 在 1962 年發表）照這個想法一步一步做：先把入度 0 的課排進佇列；每次從佇列最前面拿一門出來修，把它後面那幾門課的入度各減 1，減到 0 的排到佇列最後面。佇列空了就做完了。', see: 'queue' },
      '圖裡有環（cycle）就排不出來：如果資料結構要先修演算法、演算法又要先修資料結構，兩門課的入度永遠到不了 0，誰都修不了。所以拓樸排序只用在有向無環圖（DAG，Directed Acyclic Graph）上；Kahn 做完排出來的頂點比全部少，就代表圖裡有環。',
      '另一種做法用深度優先搜尋（DFS）：一門課後面的課都走完了，才把它記下來（後序），最後整串倒過來就是拓樸順序。兩種做法每個頂點、每條邊都只處理一次。',
    ],
    // 各操作的時間複雜度（V 個頂點、E 條邊；Big-O 的定義與怎麼算在附錄）
    complexity: [
      ['算每個頂點的入度（V 個頂點、E 條邊）', 'O(V + E)'],
      ['Kahn 排出整個順序（相鄰串列）', 'O(V + E)'],
      ['Kahn 排出整個順序（相鄰矩陣）', 'O(V²)'],
      ['DFS 做法排出整個順序', 'O(V + E)'],
      ['判斷圖裡有沒有環', 'O(V + E)'],
    ],
    traps: [
      { wrong: '拓樸排序的答案只有一種', right: '同一刻能修的課先修哪門都可以，所以通常不只一種：這頁的七門課一共有 25 種排法。沙盒排出 CS101 CS103 CS102 CS201 CS202 CS302 CS301；一開始先修離散數學、最後作業系統和演算法對調，也都是對的。' },
      { wrong: '修完一門，就把它後面的課全部排進佇列', right: '只有入度減到 0 的才排進去。修完 CS103 離散數學時，資料結構、演算法的入度都只少 1，還各差一門先修，要等最後一門先修修完才排進佇列。' },
      { wrong: '有環的圖也排得出來', right: '環上的課互相等對方，入度永遠到不了 0，佇列空了還有課沒排到。所以 Kahn 做完要數一下：排出來的比全部少，就是有環；Python 的 graphlib 遇到環會丟出 CycleError。' },
      { wrong: '拓樸排序跟附錄的排序一樣，要比大小', right: '不比大小，只看先後：誰是誰的先修。課號 CS302 比 CS301 大，在這頁卻排在前面。' },
      { wrong: '無向圖也能做拓樸排序', right: '只能用在有向無環圖（DAG）。無向的邊沒有誰先誰後，而且一條無向邊 A–B 等於 A → B、B → A 兩個方向都有，本身就繞成一個環。' },
      { wrong: 'DFS 走過的順序就是拓樸排序', right: '要看「走完」的順序再倒過來。從 CS101 照箭頭 DFS，拜訪順序是 CS101 CS102 CS202 CS302 CS301 CS201，計算機組織排到了作業系統後面；把每門課後面都走完的順序倒過來才對。' },
    ],
    code: {
      python: {
        builtin: `# Python 3.9 起內建 graphlib；add(後修, 先修) 一條一條放進先修關係
from graphlib import TopologicalSorter

# CS101 計算機概論、CS102 程式設計、CS103 離散數學、CS201 計算機組織、
# CS202 資料結構、CS301 作業系統、CS302 演算法
edges = [("CS101", "CS102"), ("CS101", "CS201"), ("CS102", "CS202"), ("CS103", "CS202"),
         ("CS103", "CS302"), ("CS202", "CS302"), ("CS202", "CS301"), ("CS201", "CS301")]  # 先修 → 後修

ts = TopologicalSorter()
for before, after in edges:
    ts.add(after, before)
# 同一刻能修的課誰排前面，取決於放進去的順序，所以照先修表一條一條放
print(" ".join(ts.static_order()))
`,
        handmade: `# 自己刻：課號換成 0～6，相鄰串列記修完這門可以接著修的課，入度陣列記還差幾門先修
COURSES = ["CS101", "CS102", "CS103", "CS201", "CS202", "CS301", "CS302"]
EDGES = [(0, 1), (0, 3), (1, 4), (2, 4), (2, 6), (4, 6), (4, 5), (3, 5)]  # 先修 → 後修


def topo_sort(n, edges):
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    queue = [v for v in range(n) if indeg[v] == 0]  # 沒有先修的課先排進佇列
    front = 0
    while front < len(queue):
        u = queue[front]
        front += 1
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:  # 先修都修完了，才排進佇列
                queue.append(v)
    if len(queue) < n:
        raise ValueError("graph has a cycle")  # 環上的課入度到不了 0，排不進佇列
    return queue  # 每門課只排進來一次，佇列從頭到尾就是拓樸順序


print(" ".join(COURSES[v] for v in topo_sort(len(COURSES), EDGES)))
`,
      },
      js: {
        builtin: `// 內建的沒有拓樸排序，考試要自己刻；這裡用 Map 存相鄰串列和入度、陣列當佇列（push 排進來、shift 拿出來）
// CS101 計算機概論、CS102 程式設計、CS103 離散數學、CS201 計算機組織、CS202 資料結構、CS301 作業系統、CS302 演算法
const courses = ['CS101', 'CS102', 'CS103', 'CS201', 'CS202', 'CS301', 'CS302'];
const edges = [['CS101', 'CS102'], ['CS101', 'CS201'], ['CS102', 'CS202'], ['CS103', 'CS202'],
  ['CS103', 'CS302'], ['CS202', 'CS302'], ['CS202', 'CS301'], ['CS201', 'CS301']]; // 先修 → 後修

const graph = new Map(courses.map((c) => [c, []]));
const indeg = new Map(courses.map((c) => [c, 0]));
for (const [before, after] of edges) {
  graph.get(before).push(after);
  indeg.set(after, indeg.get(after) + 1);
}

const queue = courses.filter((c) => indeg.get(c) === 0); // 沒有先修的課先排進佇列
const order = [];
while (queue.length) {
  const c = queue.shift();
  order.push(c);
  for (const next of graph.get(c)) {
    indeg.set(next, indeg.get(next) - 1);
    if (indeg.get(next) === 0) queue.push(next); // 先修都修完了，才排進佇列
  }
}
console.log(order.join(' '));
`,
        handmade: `// 自己刻：課號換成 0～6，相鄰串列記修完這門可以接著修的課，入度陣列記還差幾門先修
const COURSES = ['CS101', 'CS102', 'CS103', 'CS201', 'CS202', 'CS301', 'CS302'];
const EDGES = [[0, 1], [0, 3], [1, 4], [2, 4], [2, 6], [4, 6], [4, 5], [3, 5]]; // 先修 → 後修

function topoSort(n, edges) {
  const adj = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [u, v] of edges) {
    adj[u].push(v);
    indeg[v]++;
  }
  const queue = new Array(n); // 每門課只排進來一次，長度 n 就夠
  let front = 0, rear = 0;
  for (let v = 0; v < n; v++) if (indeg[v] === 0) queue[rear++] = v; // 沒有先修的課先排進佇列
  while (front < rear) {
    const u = queue[front++];
    for (const v of adj[u]) {
      if (--indeg[v] === 0) queue[rear++] = v; // 先修都修完了，才排進佇列
    }
  }
  if (rear < n) throw new Error('graph has a cycle'); // 環上的課入度到不了 0，排不進佇列
  return queue; // 佇列從頭到尾就是拓樸順序
}

console.log(topoSort(COURSES.length, EDGES).map((v) => COURSES[v]).join(' '));
`,
      },
      java: {
        builtin: `// 內建的沒有拓樸排序，考試要自己刻；這裡用 HashMap 存相鄰串列和入度、ArrayDeque 當佇列
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // CS101 計算機概論、CS102 程式設計、CS103 離散數學、CS201 計算機組織、CS202 資料結構、CS301 作業系統、CS302 演算法
        String[] courses = {"CS101", "CS102", "CS103", "CS201", "CS202", "CS301", "CS302"};
        String[][] edges = {{"CS101", "CS102"}, {"CS101", "CS201"}, {"CS102", "CS202"}, {"CS103", "CS202"},
                {"CS103", "CS302"}, {"CS202", "CS302"}, {"CS202", "CS301"}, {"CS201", "CS301"}}; // 先修 → 後修

        Map<String, List<String>> graph = new HashMap<>();
        Map<String, Integer> indeg = new HashMap<>();
        for (String c : courses) {
            graph.put(c, new ArrayList<>());
            indeg.put(c, 0);
        }
        for (String[] e : edges) {
            graph.get(e[0]).add(e[1]);
            indeg.merge(e[1], 1, Integer::sum);
        }

        // HashMap 走訪的順序不固定，所以照課號陣列找沒有先修的課
        Queue<String> queue = new ArrayDeque<>();
        for (String c : courses) if (indeg.get(c) == 0) queue.offer(c);
        List<String> order = new ArrayList<>();
        while (!queue.isEmpty()) {
            String c = queue.poll();
            order.add(c);
            for (String next : graph.get(c)) {
                indeg.merge(next, -1, Integer::sum);
                if (indeg.get(next) == 0) queue.offer(next); // 先修都修完了，才排進佇列
            }
        }
        System.out.println(String.join(" ", order));
    }
}
`,
        handmade: `// 自己刻：課號換成 0～6，相鄰串列記修完這門可以接著修的課，入度陣列記還差幾門先修
import java.util.ArrayList;
import java.util.List;

public class Main {
    static final String[] COURSES = {"CS101", "CS102", "CS103", "CS201", "CS202", "CS301", "CS302"};
    static final int[][] EDGES = {{0, 1}, {0, 3}, {1, 4}, {2, 4}, {2, 6}, {4, 6}, {4, 5}, {3, 5}}; // 先修 → 後修

    static int[] topoSort(int n, int[][] edges) {
        List<List<Integer>> adj = new ArrayList<>();
        for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
        int[] indeg = new int[n];
        for (int[] e : edges) {
            adj.get(e[0]).add(e[1]);
            indeg[e[1]]++;
        }
        int[] queue = new int[n]; // 每門課只排進來一次，長度 n 就夠
        int front = 0, rear = 0;
        for (int v = 0; v < n; v++) if (indeg[v] == 0) queue[rear++] = v; // 沒有先修的課先排進佇列
        while (front < rear) {
            int u = queue[front++];
            for (int v : adj.get(u)) {
                if (--indeg[v] == 0) queue[rear++] = v; // 先修都修完了，才排進佇列
            }
        }
        if (rear < n) throw new IllegalStateException("graph has a cycle"); // 環上的課入度到不了 0，排不進佇列
        return queue; // 佇列從頭到尾就是拓樸順序
    }

    public static void main(String[] args) {
        StringBuilder out = new StringBuilder();
        for (int v : topoSort(COURSES.length, EDGES)) {
            if (out.length() > 0) out.append(' ');
            out.append(COURSES[v]);
        }
        System.out.println(out);
    }
}
`,
      },
      cpp: {
        builtin: `// 內建的沒有拓樸排序，考試要自己刻；這裡用 std::map 存相鄰串列和入度、std::queue 當佇列
#include <iostream>
#include <map>
#include <queue>
#include <string>
#include <utility>
#include <vector>

int main() {
    // CS101 計算機概論、CS102 程式設計、CS103 離散數學、CS201 計算機組織、CS202 資料結構、CS301 作業系統、CS302 演算法
    std::vector<std::string> courses = {"CS101", "CS102", "CS103", "CS201", "CS202", "CS301", "CS302"};
    std::vector<std::pair<std::string, std::string>> edges = {{"CS101", "CS102"}, {"CS101", "CS201"}, {"CS102", "CS202"}, {"CS103", "CS202"},
        {"CS103", "CS302"}, {"CS202", "CS302"}, {"CS202", "CS301"}, {"CS201", "CS301"}}; // 先修 → 後修

    std::map<std::string, std::vector<std::string>> graph;
    std::map<std::string, int> indeg;
    for (const auto& c : courses) indeg[c] = 0;
    for (const auto& [before, after] : edges) {
        graph[before].push_back(after);
        indeg[after]++;
    }

    std::queue<std::string> queue;
    for (const auto& c : courses) if (indeg[c] == 0) queue.push(c); // 沒有先修的課先排進佇列
    std::string order;
    while (!queue.empty()) {
        std::string c = queue.front(); queue.pop();
        if (!order.empty()) order += ' ';
        order += c;
        for (const auto& next : graph[c]) {
            if (--indeg[next] == 0) queue.push(next); // 先修都修完了，才排進佇列
        }
    }
    std::cout << order << "\\n";
}
`,
        handmade: `// 自己刻：課號換成 0～6，相鄰串列記修完這門可以接著修的課，入度陣列記還差幾門先修
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

const std::string COURSES[] = {"CS101", "CS102", "CS103", "CS201", "CS202", "CS301", "CS302"};
const int N = 7;
const int EDGES[][2] = {{0, 1}, {0, 3}, {1, 4}, {2, 4}, {2, 6}, {4, 6}, {4, 5}, {3, 5}}; // 先修 → 後修

std::vector<int> topoSort() {
    std::vector<int> adj[N];
    int indeg[N] = {};
    for (const auto& e : EDGES) {
        adj[e[0]].push_back(e[1]);
        indeg[e[1]]++;
    }
    std::vector<int> queue(N); // 每門課只排進來一次，長度 N 就夠
    int front = 0, rear = 0;
    for (int v = 0; v < N; v++) if (indeg[v] == 0) queue[rear++] = v; // 沒有先修的課先排進佇列
    while (front < rear) {
        int u = queue[front++];
        for (int v : adj[u]) {
            if (--indeg[v] == 0) queue[rear++] = v; // 先修都修完了，才排進佇列
        }
    }
    if (rear < N) throw std::runtime_error("graph has a cycle"); // 環上的課入度到不了 0，排不進佇列
    return queue; // 佇列從頭到尾就是拓樸順序
}

int main() {
    std::string out;
    for (int v : topoSort()) {
        if (!out.empty()) out += ' ';
        out += COURSES[v];
    }
    std::cout << out << "\\n";
}
`,
      },
      output: 'CS101 CS103 CS102 CS201 CS202 CS302 CS301',
    },
    // 沙盒：一顆「修下一門」，Kahn 演算法、佇列先進先出；一開始排進去的是沒有先修的 CS101、CS103。七門修完再按是錯誤
    sandbox: {
      ops: [{ op: 'take', label: '修下一門' }],
      errors: { done: '七門課都修完了' },
      init() { return { taken: [], queue: IDS.filter(id => INDEGREE[id] === 0), indegree: { ...INDEGREE }, current: null, lowered: [], unlocked: [], error: null }; },
      apply(s) {
        if (s.taken.length === IDS.length) return { ...s, current: null, lowered: [], unlocked: [], error: 'done' };
        return takeNext(s);
      },
      label(op, s) {
        const opened = s.unlocked.length ? `：${s.unlocked.map(c => NAME[c]).join('、')}可以修了` : '';
        return `修 ${s.current} ${NAME[s.current]}${opened}`;
      },
    },
    // 上面是課程圖（方塊寫課號和簡稱，箭頭從先修指到後修），中間是佇列，下面是每門課的入度。
    // 修過的課 FILL、這一步修的黃色；修過的課指出去的邊畫成虛線（已經拿掉）；入度這一步少 1 的格子黃色
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { taken, queue, indegree, current, lowered }, { sandbox = false } = {}) {
      const w = 240, hgt = 240;
      const s = svgEl(w, hgt); const rc = rough.svg(s);
      if (sandbox) { s.setAttribute('width', Math.round(w * SANDBOX_SCALE)); s.setAttribute('height', Math.round(hgt * SANDBOX_SCALE)); }
      const solid = (fill) => (fill ? { fill, fillStyle: 'solid' } : {});
      const courseFill = (id) => (id === current ? NEW : taken.includes(id) ? FILL : null);

      PREREQS.forEach(([from, to], i) => {
        const [x1, y1] = boxEdge(POS[from], POS[to]), [x2, y2] = boxEdge(POS[to], POS[from]);
        const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
        const line = { stroke: INK, strokeWidth: 1.3, roughness: 0.8, ...(taken.includes(from) ? { strokeLineDash: [4, 3], disableMultiStroke: true } : {}) };
        s.append(rc.line(x1, y1, x2, y2, { ...line, seed: 30 + i }));
        s.append(rc.linearPath([[x2 - 6 * ux - 4 * uy, y2 - 6 * uy + 4 * ux], [x2, y2], [x2 - 6 * ux + 4 * uy, y2 - 6 * uy - 4 * ux]], { stroke: INK, strokeWidth: 1.3, roughness: 0.5, seed: 50 + i }));
      });
      COURSES.forEach(({ id, short }, i) => {
        const [x, y] = POS[id];
        s.append(rc.rectangle(x - BOX_W / 2, y - BOX_H / 2, BOX_W, BOX_H, { stroke: INK, strokeWidth: 1.3, roughness: 0.8, seed: 10 + i, ...solid(courseFill(id)) }));
        svgText(s, x, y - 6, id, 10);
        svgText(s, x, y + 7, short, short.length > 3 ? 9 : 10);
      });

      // 佇列：兩頭開的管子，左邊 front 拿出來、右邊 rear 排進去
      const top = 140, bot = 164, mid = (top + bot) / 2, slot = 40, x0 = 38, x1 = x0 + SLOTS * slot + 4;
      svgText(s, 18, mid, '佇列', 12);
      s.append(rc.line(x0, top, x1, top, { stroke: INK, strokeWidth: 1.5, roughness: 1, seed: 7 }));
      s.append(rc.line(x0, bot, x1, bot, { stroke: INK, strokeWidth: 1.5, roughness: 1, seed: 8 }));
      queue.forEach((id, i) => {
        const x = x0 + 4 + i * slot;
        s.append(rc.rectangle(x, top + 4, slot - 4, bot - top - 8, { stroke: INK, roughness: 0.8, seed: 60 + i }));
        svgText(s, x + (slot - 4) / 2, mid, id, 10);
      });
      if (!queue.length) svgText(s, (x0 + x1) / 2, mid, '空了', 11);
      svgText(s, x0, bot + 10, 'front', 9); svgText(s, x1, bot + 10, 'rear', 9);

      // 入度：照課號一格一門課，上面寫課號
      const cell = 33, left = (w - cell * COURSES.length) / 2, rowTop = 208;
      svgText(s, w / 2, 186, '入度：還差幾門先修', 10);
      COURSES.forEach(({ id }, i) => {
        const x = left + i * cell, fill = lowered.includes(id) ? NEW : taken.includes(id) ? FILL : null;
        s.append(rc.rectangle(x + 1, rowTop, cell - 2, 24, { stroke: INK, roughness: 0.6, seed: 80 + i, ...solid(fill) }));
        svgText(s, x + cell / 2, rowTop - 7, id, 9);
        svgText(s, x + cell / 2, rowTop + 12, String(indegree[id]), 12);
      });
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('topological_sort', page);
})(typeof window !== 'undefined' ? window : globalThis);
