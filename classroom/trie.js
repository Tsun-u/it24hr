// classroom/trie.js — 小教室「Trie 字典樹」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  // 沙盒依序插入的五個字、輪流查的四個字首（cab 走到 a 就沒路了）
  const WORDS = ['cat', 'car', 'card', 'care', 'dog'];
  const QUERIES = ['ca', 'car', 'd', 'cab'];
  const DEPTH = Math.max(...WORDS.map(w => w.length));

  // 節點是 { end, kids }：end 表示有字在這裡結束，kids 是「字母 → 下一個節點」。
  // 插入時沿路的節點複製一份再改，舊的樹不動
  const EMPTY = { end: false, kids: {} };
  const insert = (node, word) => (!word ? { ...node, end: true }
    : { ...node, kids: { ...node.kids, [word[0]]: insert(node.kids[word[0]] || EMPTY, word.slice(1)) } });
  // 從根照字母往下走：走到哪個節點、走了幾個字母
  function walk(trie, word) {
    let node = trie, n = 0;
    while (n < word.length && node.kids[word[n]]) node = node.kids[word[n++]];
    return { node, n };
  }
  // 這個節點底下所有的字：先收自己，再照字母順序走每個孩子，收到的字就是照字母排的
  const wordsUnder = (node, prefix) => [...(node.end ? [prefix] : []),
    ...Object.keys(node.kids).sort().flatMap(ch => wordsUnder(node.kids[ch], prefix + ch))];
  function startsWith(trie, prefix) {
    const { node, n } = walk(trie, prefix);
    return n < prefix.length ? [] : wordsUnder(node, prefix);
  }
  // word 的前 n 個字母當節點的名字：c、ca、car…（根是空字串）
  const prefixes = (word, from, to) => Array.from({ length: to - from }, (_, k) => word.slice(0, from + k + 1));
  // 每個節點畫在哪：樹葉從左到右等距排開，爸爸放在第一個和最後一個孩子的正中間
  function layout(trie) {
    const spots = []; let leaves = 0;
    (function place(node, id, depth) {
      const below = Object.keys(node.kids).sort().map(ch => place(node.kids[ch], id + ch, depth + 1));
      const col = below.length ? (below[0].col + below[below.length - 1].col) / 2 : leaves++;
      const spot = { id, end: node.end, depth, col, below };
      spots.push(spot);
      return spot;
    })(trie, '', 0);
    return { spots, leaves };
  }
  const seedOf = (id) => [...id].reduce((s, ch) => (s * 31 + ch.charCodeAt(0)) % 9973, 7) + 1;

  const page = {
    analogy: '搜尋框的自動完成：開頭一樣的字共用同一段路，打得越多、候選越少。',
    summary: '下次在搜尋框打了幾個字母、看著自動完成的候選越來越少，你就知道：那是一棵 Trie，開頭一樣的字共用同一段路，打得越多、走得越深、候選越少。',   // 總結：呼應開頭的比喻
    frames: ['insert', 'insert', 'insert', 'insert', 'insert', 'startsWith'],
    uses: [
      '搜尋框、手機鍵盤的自動完成：打了 ca，就從 c → a 走到的那個節點往下找，跳出 car、card、care、cat；多打一個 r，候選就只剩 car 開頭的三個。',
      '拼字檢查：把整本字典放進 Trie，打的字照字母走下去，走到一半沒路、或走完了那個節點卻沒有字尾的標記，就知道字典裡沒有這個字。',
      '過濾留言裡的不雅字、找出文章提到了哪些關鍵字：要找的字有好幾百個時，全放進同一棵 Trie，文章從頭掃一遍就好。AC 自動機（Aho–Corasick）就是在 Trie 上多加「這裡對不上時跳去哪」的連結。',
      '路由器轉送封包：路由表的每一筆是 IP 位址的開頭（例如 192.168.0.0/16），收到封包要找開頭對得最長的那一筆，叫最長字首比對（longest prefix match）。常見做法是把 IP 拆成一個一個位元，放進每個節點只有 0、1 兩個孩子的 Trie，一個位元走一步。',
    ],
    concept: [
      'Trie 又叫字典樹、字首樹（prefix tree），名字取自 retrieval（取回），有人念 tree、有人念 try（跟一般的樹分開）。它不在節點裡放整個字，而是每條邊代表一個字母：從根往下走，路上的字母連起來就是字。所以開頭一樣的字共用同一段路，cat、car、card、care 都從 c → a 出發。',
      '根不代表任何字母。有字在某個節點結束，就在那個節點做標記，圖上畫成雙圈：card、care 都經過 car 的 r，那個 r 也是雙圈，因為 car 本身也是一個字。光看路走不走得到，分不出 car 是不是字，要看標記。',
      '插入（insert）：照字母一個一個往下走，有路就沿用，沒路就長一個新節點，走完在最後那個節點做標記。查一個字（search）：照字母走下去，走完還要那個節點有標記才算。查字首（startsWith）：字首走得完就代表有字是這樣開頭的；要列出接得下去的字，就從走到的節點往下，把有標記的節點都收起來。三個操作都是一個字母走一步，花的時間只跟字長 L 有關，跟存了幾個字無關。',
      { text: '每個節點的孩子怎麼存：只放小寫英文字母時，常見的是留 26 格的陣列（第 0 格是 a、第 25 格是 z），從字母直接算出往哪一格走；字母種類很多（中文、Unicode）時改用雜湊表，只存真的有的孩子。', see: 'hashing' },
    ],
    complexity: [
      ['insert 插入一個字（L 是字長）', 'O(L)'],
      ['search 查一個字在不在', 'O(L)'],
      ['startsWith 查有沒有字是這樣開頭的', 'O(L)'],
      ['列出開頭是這個字首的字', 'O(L)，再加上結果的總長度'],
    ],
    traps: [
      { wrong: '每個節點存一個完整的字', right: '一個節點只對應一個字母（從爸爸走到它的那條邊），字是從根走下來、整條路上的字母連起來的。所以開頭一樣的字才能共用同一段路：car、card、care 都走同一段 c → a → r。' },
      { wrong: '走得到 car 的路，就代表 car 是一個字', right: '要看那個節點有沒有字尾的標記（圖上的雙圈）。只存 card 的話，c → a → r 的路也在，但 r 不是雙圈，car 就不是字。所以查一個字要走完再看標記，查字首只要走得完就算。' },
      { wrong: 'Trie 查一個字一定比雜湊表快', right: '兩個都要把整個字看一遍：雜湊表要用整個字算出雜湊值，Trie 要一個字母走一步，都跟字長成正比。Trie 贏的是找字首、照字母順序列出來；雜湊表只能拿整個字去查，回答不了「開頭是 ca 的有哪些」。' },
      { wrong: 'Trie 很省空間', right: '開頭一樣的字共用前面那段，是省了一些；但每個節點都要留孩子的位置，用 26 格陣列的話，一個節點就是 26 個指標。字少、開頭又各不相同時，大部分格子都空著，比直接把字串存起來還佔空間。' },
      { wrong: 'Trie 列出來的字一定照字母順序', right: '要看孩子怎麼走。26 格陣列從 a 走到 z，出來就是字母順序；孩子用 Python 的 dict、JavaScript 的 Map 存的話，走的是放進去的順序：這頁先放 cat 再放 car，a 底下先有 t 才有 r，不排序就會列出 cat car card care。所以這頁 Python、JavaScript 的程式走孩子之前先排序。' },
    ],
    code: {
      python: {
        builtin: `# 內建的沒有 Trie，考試要自己刻；最接近的是排好序的串列＋bisect。
# 排好序以後，開頭一樣的字會排在一起：二分搜尋找到第一個不比 "car" 小的字，往後拿到開頭不是 car 為止
import bisect

words = sorted(["cat", "car", "card", "care", "dog"])
prefix = "car"
i = bisect.bisect_left(words, prefix)
found = []
while i < len(words) and words[i].startswith(prefix):
    found.append(words[i])
    i += 1
print(*found)
`,
        handmade: `class Node:
    def __init__(self):
        self.children = {}   # 字母 → 下一個節點
        self.end = False     # 有沒有字在這裡結束


class Trie:
    def __init__(self):
        self.root = Node()

    def insert(self, word):
        node = self.root
        for ch in word:                   # 照字母往下走，沒有路就長一個新節點
            if ch not in node.children:
                node.children[ch] = Node()
            node = node.children[ch]
        node.end = True

    def starts_with(self, prefix):
        node = self.root
        for ch in prefix:                 # 先走完字首，走不下去就是沒有
            if ch not in node.children:
                return []
            node = node.children[ch]
        found = []
        self._collect(node, prefix, found)
        return found

    # 先收自己，再走每個孩子；dict 照放進去的順序，要照字母順序列出來就先排序
    def _collect(self, node, word, found):
        if node.end:
            found.append(word)
        for ch in sorted(node.children):
            self._collect(node.children[ch], word + ch, found)


trie = Trie()
for w in ("cat", "car", "card", "care", "dog"):
    trie.insert(w)
print(*trie.starts_with("car"))
`,
      },
      js: {
        builtin: `// 內建的沒有 Trie，考試要自己刻；最接近的是排好序的陣列，filter 留下開頭是 car 的字（要整個陣列掃一遍）
const words = ['cat', 'car', 'card', 'care', 'dog'].sort();
const prefix = 'car';
const found = words.filter(w => w.startsWith(prefix));
console.log(found.join(' '));
`,
        handmade: `class Node {
  constructor() {
    this.children = new Map();   // 字母 → 下一個節點
    this.end = false;            // 有沒有字在這裡結束
  }
}

class Trie {
  constructor() {
    this.root = new Node();
  }
  insert(word) {
    let node = this.root;
    for (const ch of word) {             // 照字母往下走，沒有路就長一個新節點
      if (!node.children.has(ch)) node.children.set(ch, new Node());
      node = node.children.get(ch);
    }
    node.end = true;
  }
  startsWith(prefix) {
    let node = this.root;
    for (const ch of prefix) {           // 先走完字首，走不下去就是沒有
      node = node.children.get(ch);
      if (!node) return [];
    }
    const found = [];
    this.collect(node, prefix, found);
    return found;
  }
  // 先收自己，再走每個孩子；Map 照放進去的順序，要照字母順序列出來就先排序
  collect(node, word, found) {
    if (node.end) found.push(word);
    for (const ch of [...node.children.keys()].sort()) this.collect(node.children.get(ch), word + ch, found);
  }
}

const trie = new Trie();
for (const w of ['cat', 'car', 'card', 'care', 'dog']) trie.insert(w);
console.log(trie.startsWith('car').join(' '));
`,
      },
      java: {
        builtin: `import java.util.StringJoiner;
import java.util.TreeSet;

public class Main {
    public static void main(String[] args) {
        // 內建的沒有 Trie，考試要自己刻；最接近的是 TreeSet，字會照字母順序排好，開頭一樣的排在一起。
        // subSet 拿出從 "car" 到 "car" 接最大字元（不含）的那一段，就是開頭是 car 的字
        TreeSet<String> words = new TreeSet<>();
        for (String w : new String[] {"cat", "car", "card", "care", "dog"}) words.add(w);
        String prefix = "car";
        StringJoiner out = new StringJoiner(" ");
        for (String w : words.subSet(prefix, prefix + Character.MAX_VALUE)) out.add(w);
        System.out.println(out);
    }
}
`,
        handmade: `import java.util.ArrayList;
import java.util.List;

public class Main {
    // 只放小寫英文字母：每個節點留 26 格給孩子，第 0 格是 a、第 25 格是 z
    static class Node {
        Node[] children = new Node[26];
        boolean end;   // 有沒有字在這裡結束
    }

    static class Trie {
        private final Node root = new Node();

        void insert(String word) {
            Node node = root;
            for (char ch : word.toCharArray()) {      // 照字母往下走，沒有路就長一個新節點
                int i = ch - 'a';
                if (node.children[i] == null) node.children[i] = new Node();
                node = node.children[i];
            }
            node.end = true;
        }

        List<String> startsWith(String prefix) {
            List<String> found = new ArrayList<>();
            Node node = root;
            for (char ch : prefix.toCharArray()) {    // 先走完字首，走不下去就是沒有
                node = node.children[ch - 'a'];
                if (node == null) return found;
            }
            collect(node, new StringBuilder(prefix), found);
            return found;
        }

        // 先收自己，再從 a 到 z 走每個孩子，收到的字就是照字母排的
        private void collect(Node node, StringBuilder word, List<String> found) {
            if (node.end) found.add(word.toString());
            for (int i = 0; i < 26; i++) {
                if (node.children[i] == null) continue;
                word.append((char) ('a' + i));
                collect(node.children[i], word, found);
                word.deleteCharAt(word.length() - 1);
            }
        }
    }

    public static void main(String[] args) {
        Trie trie = new Trie();
        for (String w : new String[] {"cat", "car", "card", "care", "dog"}) trie.insert(w);
        System.out.println(String.join(" ", trie.startsWith("car")));
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <set>
#include <string>

int main() {
    // 內建的沒有 Trie，考試要自己刻；最接近的是 std::set，字會照字母順序排好，開頭一樣的排在一起。
    // lower_bound 找到第一個不比 "car" 小的字，往後拿到開頭不是 car 為止
    std::set<std::string> words = {"cat", "car", "card", "care", "dog"};
    std::string prefix = "car";
    bool first = true;
    for (auto it = words.lower_bound(prefix); it != words.end() && it->compare(0, prefix.size(), prefix) == 0; ++it) {
        std::cout << (first ? "" : " ") << *it;
        first = false;
    }
    std::cout << "\\n";
}
`,
        handmade: `#include <iostream>
#include <string>
#include <vector>

// 只放小寫英文字母：每個節點留 26 格給孩子，第 0 格是 a、第 25 格是 z
struct Node {
    Node* children[26] = {};
    bool end = false;   // 有沒有字在這裡結束
};

void insert(Node* root, const std::string& word) {
    Node* node = root;
    for (char ch : word) {                       // 照字母往下走，沒有路就長一個新節點
        Node*& next = node->children[ch - 'a'];
        if (!next) next = new Node();
        node = next;
    }
    node->end = true;
}

// 先收自己，再從 a 到 z 走每個孩子，收到的字就是照字母排的
void collect(const Node* node, std::string& word, std::vector<std::string>& found) {
    if (node->end) found.push_back(word);
    for (int i = 0; i < 26; i++) {
        if (!node->children[i]) continue;
        word.push_back(static_cast<char>('a' + i));
        collect(node->children[i], word, found);
        word.pop_back();
    }
}

std::vector<std::string> startsWith(const Node* root, const std::string& prefix) {
    std::vector<std::string> found;
    const Node* node = root;
    for (char ch : prefix) {                     // 先走完字首，走不下去就是沒有
        node = node->children[ch - 'a'];
        if (!node) return found;
    }
    std::string word = prefix;
    collect(node, word, found);
    return found;
}

// 釋放記憶體：孩子先刪，最後才刪自己
void destroy(Node* node) {
    for (Node* child : node->children) if (child) destroy(child);
    delete node;
}

int main() {
    Node* root = new Node();
    for (const char* w : {"cat", "car", "card", "care", "dog"}) insert(root, w);
    std::vector<std::string> found = startsWith(root, "car");
    for (size_t i = 0; i < found.size(); i++) std::cout << (i ? " " : "") << found[i];
    std::cout << "\\n";
    destroy(root);
}
`,
      },
      output: 'car card care',
    },
    // 沙盒：一開始只有根。insert 依序插 WORDS 的下一個字，五個都放完再按是錯誤；startsWith 輪流查 QUERIES 的字首。
    // 狀態：trie 樹本身、placed 插了幾個、word 這一步插的字、added 新長出來的節點、
    // path 查字首走過的節點、query 這一步查的字首、found 接得下去的字、queried 查過幾次
    sandbox: {
      ops: [{ op: 'insert', label: '插入 insert' }, { op: 'startsWith', label: '查字首 startsWith' }],
      errors: { allPlaced: '五個字都放進去了，按「查字首」看看打幾個字母能接出哪些字。' },
      init() { return { trie: EMPTY, placed: 0, word: null, added: [], path: [], query: null, found: [], queried: 0, error: null }; },
      apply(s, op) {
        const noMarks = { word: null, added: [], path: [], query: null, found: [] };   // 這一步沒有要標色的節點
        if (op === 'insert') {
          if (s.placed >= WORDS.length) return { ...s, ...noMarks, error: 'allPlaced' };
          const word = WORDS[s.placed], { n } = walk(s.trie, word);
          return { ...s, ...noMarks, trie: insert(s.trie, word), placed: s.placed + 1, word, added: prefixes(word, n, word.length), error: null };
        }
        const query = QUERIES[s.queried % QUERIES.length], { n } = walk(s.trie, query);
        return { ...s, ...noMarks, query, path: prefixes(query, 0, n), found: startsWith(s.trie, query), queried: s.queried + 1, error: null };
      },
      // 插入的圖說看共用了哪一段：共用的那個節點只剩新長的這個孩子，就是接在原本那條路的尾巴後面
      label(op, s) {
        if (op === 'startsWith') return `startsWith(${s.query}) → ${s.found.length ? s.found.join(' ') : '（沒有）'}`;
        const shared = s.word.slice(0, s.word.length - s.added.length);
        const onlyChild = Object.keys(walk(s.trie, shared).node.kids).length === 1;
        if (!shared) return onlyChild ? `insert(${s.word})` : `insert(${s.word})：從根長出新的一枝`;
        return onlyChild ? `insert(${s.word})：接在 ${shared} 後面` : `insert(${s.word})：共用 ${[...shared].join('、')}`;
      },
    },
    // 由上往下的樹：每條邊旁邊標一個字母，節點是空的圓，有字在這裡結束的畫雙圈，根寫「根」。
    // 這一步新長出來的、查字首走過的節點上黃色，連到它的邊底下畫一道黃色螢光筆；
    // 查字首時最下面一行列出接得下去的字。高度固定（最長的字四個字母），分格圖的圖說才會對齊。seed 固定，同一格每次畫出來一樣
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { trie, added, path, query, found }, { sandbox = false } = {}) {
      const w = sandbox ? 300 : 240, r = sandbox ? 10 : 8, gap = sandbox ? 42 : 34, pad = 22, letter = sandbox ? 14 : 12;
      const listY = pad + DEPTH * gap + r + 22, hgt = listY + 14;
      const svg = svgEl(w, hgt); const rc = rough.svg(svg);
      const { spots, leaves } = layout(trie);
      const xy = (p) => [pad + ((p.col + 0.5) * (w - pad * 2)) / leaves, pad + p.depth * gap];
      const hot = new Set([...added, ...path]);
      for (const p of spots) for (const k of p.below) {
        const [x1, y1] = xy(p), [x2, y2] = xy(k);
        if (hot.has(k.id)) svg.append(rc.line(x1, y1, x2, y2, { stroke: NEW, strokeWidth: 7, roughness: 0.5, disableMultiStroke: true, seed: seedOf(k.id) + 1 }));
        svg.append(rc.line(x1, y1, x2, y2, { stroke: INK, strokeWidth: 1.4, roughness: 1, seed: seedOf(k.id) }));
        // 字母放在邊的中點往外推一點：往左下的邊推到左上、往右下的推到右上，直的推到左邊
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), side = dx > 0 ? 1 : -1, off = letter * 0.75;
        svgText(svg, (x1 + x2) / 2 + (side * dy / len) * off, (y1 + y2) / 2 - (Math.abs(dx) / len) * off, k.id.slice(-1), letter);
      }
      for (const p of spots) {
        const [x, y] = xy(p);
        if (p.end) svg.append(rc.circle(x, y, (r + 3.5) * 2, { stroke: INK, strokeWidth: 1.2, roughness: 0.6, seed: seedOf(p.id) + 2 }));
        svg.append(rc.circle(x, y, r * 2, { stroke: INK, fill: hot.has(p.id) ? NEW : FILL, fillStyle: 'solid', roughness: 0.8, seed: seedOf(p.id) + 3 }));
      }
      const rootSpot = spots[spots.length - 1];   // layout 先排孩子、最後才排自己，根在最後一個
      svgText(svg, ...xy(rootSpot), '根', sandbox ? 11 : 9);
      if (!rootSpot.below.length) svgText(svg, w / 2, pad + r + 16, '還沒有字', 12);
      if (query !== null) {
        const n = path.length, miss = `${n ? `${query.slice(0, n)} 後面` : '根底下'}沒有 ${query[n]}，沒有候選`;
        svgText(svg, w / 2, listY, found.length ? `候選：${found.join(' ')}` : miss, sandbox ? 12 : 11);
      }
      return svg;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('trie', page);
})(typeof window !== 'undefined' ? window : globalThis);
