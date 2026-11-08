// classroom/linked_list.js — 小教室「Linked List 鏈結串列」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const page = {
    stamp: 'mixed',
    analogy: '尋寶遊戲：每張紙條寫著下一張藏在哪。',
    summary: '下次照著紙條尋寶、在播放清單裡插一首歌，你就知道：那是一個鏈結串列，每張紙條只知道下一張藏在哪。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['append', 'append', 'insertHead', 'removeHead', 'append'],
    game: '結算卡蓋 Linked List，是因為你做卡沒有固定從哪一頭拿：不是一直挑最新的，也不是一直挑最早的，下一張做哪張，要看當下誰來拉你。鏈結串列也是這樣，下一個是誰跟擺在哪裡無關，全看指標指向誰——只是你的 next 指標，常常握在別人手上。',
    uses: [
      '音樂 App 的播放清單：每首歌記著下一首是誰，臨時插一首、刪一首，只要改前後的連結，不用整份清單重排。',
      '看相簿的上一張、下一張：每張照片同時記著前一張和後一張，這就是雙向鏈結串列。',
      '堆疊、佇列的另一種做法：Queue 那頁「自己刻」的版本就是用節點串起來的，要排多少就接多少，不用先決定容量。',
      '雜湊表把撞在同一格的資料串成一條（附錄「雜湊」的鏈結法）；作業系統也用它記下哪些記憶體區塊還空著。',
    ],
    concept: [
      '鏈結串列（linked list）由一個個節點（node）串成。每個節點放兩樣東西：資料，和指向下一個節點的指標（pointer）。第一個節點叫 head，最後一個的指標指向 null，代表到底了。',
      '節點散落在記憶體各處，全靠指標接起來。所以插到最前面只要改兩個指標：新節點指向原本的第一個、head 改指新節點，串列再長都一樣快（O(1)）。但要找第 k 個、或走到最後一個，就得從 head 照著指標一個一個走（O(n)）。',
      '這跟上一頁的陣列剛好相反：陣列排成一排，知道編號就能直接算出位置，插到最前面卻要整排往後搬。只能往後走的是單向鏈結串列（singly linked list）；每個節點再多記前一個是誰，就是雙向鏈結串列（doubly linked list），可以往回走。',
    ],
    complexity: [
      ['insertHead 插到頭', 'O(1)'], ['removeHead 刪頭', 'O(1)'],
      ['append 接到尾（只記 head）', 'O(n)'], ['append 接到尾（多記一個尾指標 tail）', 'O(1)'],
      ['讀第 k 個', 'O(n)'], ['找某個值在不在裡面', 'O(n)'],
    ],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: '鏈結串列也能像陣列一樣，直接跳到第 k 個', right: '不行。節點散在記憶體各處，沒有編號能算出位置，只能從 head 照著指標一個一個數過去，越後面越久（O(n)）。' },
      { wrong: '鏈結串列插入一定是 O(1)', right: '要「已經站在那個位置」才是。插到頭是 O(1)；要插到第 k 個，得先從 head 走過去，光走路就是 O(n)。只記 head、沒有尾指標（tail）的話，接到最後面也要走完全程。' },
      { wrong: '插入時要改兩個指標，先改哪個都一樣', right: '順序反了，後面整串就不見了。把 node 插在 A 後面，要先寫 node.next = A.next，再寫 A.next = node；先改 A.next 的話，原本接在 A 後面的那一串就再也找不到了。' },
      { wrong: '刪掉一個節點，只要把前一個接到下一個就好', right: '刪的是第一個時沒有「前一個」，要改的是 head；刪的是最後一個時，前一個要改成指向 null，有尾指標的話也要跟著改。這兩個邊界最常漏掉。' },
      { wrong: '空的時候刪頭也沒關係', right: 'head 是 null 時還去拿 head.next，Python、Java、JavaScript 會直接報錯（AttributeError、NullPointerException、TypeError），C++ 對 nullptr 取值是未定義行為，常常直接當掉。刪之前先檢查 head 是不是 null。' },
      { wrong: 'Python 的 list、JavaScript 的 Array 就是鏈結串列', right: '它們都是會自動變長的陣列。這兩種語言沒有內建鏈結串列，考試要自己刻；Java 有 LinkedList（雙向），C++ 有 std::list（雙向）和 std::forward_list（單向）。' },
    ],
    code: {
      python: {
        builtin: `# 內建的沒有鏈結串列，考試要自己刻；最接近的是 collections.deque（頭尾加東西都是 O(1)）
from collections import deque

nums = deque()
nums.append(1)
nums.append(2)
nums.appendleft(0)
print(*nums)
`,
        handmade: `class Node:
    def __init__(self, value):
        self.value = value
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None

    def insert_head(self, x):
        node = Node(x)
        node.next = self.head  # 先接上原本的第一個，再改 head；反過來後面整串會不見
        self.head = node

    def append(self, x):
        node = Node(x)
        if self.head is None:
            self.head = node
            return
        last = self.head
        while last.next is not None:  # 沒有尾指標，從頭走到最後一個
            last = last.next
        last.next = node

    def print_all(self):
        values = []
        node = self.head
        while node is not None:
            values.append(node.value)
            node = node.next
        print(*values)


nums = LinkedList()
nums.append(1)
nums.append(2)
nums.insert_head(0)
nums.print_all()
`,
      },
      js: {
        builtin: `// 內建的沒有鏈結串列，考試要自己刻；最接近的是陣列，但 unshift（插到頭）要整排往後搬，是 O(n)
const nums = [];
nums.push(1);
nums.push(2);
nums.unshift(0);
console.log(nums.join(' '));
`,
        handmade: `class Node {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
  }
  insertHead(x) {
    const node = new Node(x);
    node.next = this.head; // 先接上原本的第一個，再改 head；反過來後面整串會不見
    this.head = node;
  }
  append(x) {
    const node = new Node(x);
    if (this.head === null) {
      this.head = node;
      return;
    }
    let last = this.head;
    while (last.next !== null) last = last.next; // 沒有尾指標，從頭走到最後一個
    last.next = node;
  }
  printAll() {
    const values = [];
    for (let node = this.head; node !== null; node = node.next) values.push(node.value);
    console.log(values.join(' '));
  }
}

const nums = new LinkedList();
nums.append(1);
nums.append(2);
nums.insertHead(0);
nums.printAll();
`,
      },
      java: {
        builtin: `import java.util.LinkedList;

public class Main {
    public static void main(String[] args) {
        LinkedList<Integer> nums = new LinkedList<>();
        nums.addLast(1);
        nums.addLast(2);
        nums.addFirst(0);
        String sep = "";
        for (int x : nums) {
            System.out.print(sep + x);
            sep = " ";
        }
        System.out.println();
    }
}
`,
        handmade: `public class Main {
    static class Node {
        int value;
        Node next;

        Node(int value) {
            this.value = value;
        }
    }

    static class LinkedList {
        private Node head;

        void insertHead(int x) {
            Node node = new Node(x);
            node.next = head;
            head = node;
        }

        void append(int x) {
            Node node = new Node(x);
            if (head == null) {
                head = node;
                return;
            }
            Node last = head;
            while (last.next != null) last = last.next;
            last.next = node;
        }

        void printAll() {
            String sep = "";
            for (Node node = head; node != null; node = node.next) {
                System.out.print(sep + node.value);
                sep = " ";
            }
            System.out.println();
        }
    }

    public static void main(String[] args) {
        LinkedList nums = new LinkedList();
        nums.append(1);
        nums.append(2);
        nums.insertHead(0);
        nums.printAll();
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <list>

int main() {
    std::list<int> nums;
    nums.push_back(1);
    nums.push_back(2);
    nums.push_front(0);
    const char* sep = "";
    for (int x : nums) {
        std::cout << sep << x;
        sep = " ";
    }
    std::cout << "\\n";
}
`,
        handmade: `#include <iostream>

struct Node {
    int value;
    Node* next;
};

class LinkedList {
    Node* head = nullptr;

public:
    void insertHead(int x) {
        Node* node = new Node{x, head}; // 先接上原本的第一個，再改 head；反過來後面整串會不見
        head = node;
    }
    void append(int x) {
        Node* node = new Node{x, nullptr};
        if (!head) {
            head = node;
            return;
        }
        Node* last = head;
        while (last->next) last = last->next; // 沒有尾指標，從頭走到最後一個
        last->next = node;
    }
    void printAll() const {
        const char* sep = "";
        for (Node* node = head; node; node = node->next) {
            std::cout << sep << node->value;
            sep = " ";
        }
        std::cout << "\\n";
    }
};

int main() {
    LinkedList nums;
    nums.append(1);
    nums.append(2);
    nums.insertHead(0);
    nums.printAll();
}
`,
      },
      output: '0 1 2',
    },
    // 鏈結串列：只記 head、沒有尾指標。insertHead 放 0、−1、−2…往前長；append 放 1、2、3…，要從頭走過每一個節點才接得上；
    // 空的 removeHead 是 underflow。capacity 是畫面放得下的節點數，鏈結串列本身沒有容量上限，所以放不下時換掉 overflow 的說法。
    // fresh：這一步新放的節點在第幾格；walked：接到尾之前走過幾個節點（畫圖標色用）
    sandbox: {
      capacity: 6,
      ops: [{ op: 'insertHead', label: '插到頭 insertHead' }, { op: 'append', label: '接到尾 append' }, { op: 'removeHead', label: '刪頭 removeHead' }],
      errors: {
        overflow: '畫面放不下了——鏈結串列本身沒有容量上限，記憶體夠就能一直接下去。',
        underflow: '空的，head 指著 null，沒有節點可以刪（underflow）',
      },
      init() { return { items: [], nextHead: 0, nextTail: 1, fresh: null, walked: 0, got: null, error: null }; },
      apply(s, op) {
        const quiet = { fresh: null, walked: 0, got: null, error: null };
        if (op === 'removeHead') {
          if (!s.items.length) return { ...s, ...quiet, error: 'underflow' };
          return { ...s, ...quiet, items: s.items.slice(1), got: s.items[0] };
        }
        if (s.items.length >= this.capacity) return { ...s, ...quiet, error: 'overflow' };
        if (op === 'insertHead') return { ...s, ...quiet, items: [s.nextHead, ...s.items], nextHead: s.nextHead - 1, fresh: 0 };
        return { ...s, ...quiet, items: [...s.items, s.nextTail], nextTail: s.nextTail + 1, fresh: s.items.length, walked: s.items.length };
      },
      label(op, s) {
        if (op === 'insertHead') return `insertHead(${s.items[0]})`;
        if (op === 'removeHead') return `removeHead() → ${s.got}`;
        const value = s.items[s.items.length - 1];
        return s.walked ? `append(${value})：走 ${s.walked} 步` : `append(${value})`;
      },
    },
    // 鏈結串列：一個節點是「值｜指標」兩格，箭頭指到下一個；head 從上面指著第一個，最後一個指到 null。
    // 這一步新放的上黃色；接到尾時從頭走過的節點畫虛線框、底下圈出第幾步；剛刪掉的頭留淡淡的殘影，看得出 head 往後移了一格。
    // 沙盒固定畫 6 個節點的寬（312px，手機上的講義約 330px 寬），分格圖照節點數決定寬度
    draw(kit, { items, fresh, walked, got }, { sandbox = false } = {}) {
      const { rough, svgEl, svgText, INK, FILL, NEW } = kit;
      const VAL_W = 24, PTR_W = 10, GAP = 12, NULL_W = 28, PAD = 4, TOP = 26, NODE_H = 26, BADGE_Y = 64, hgt = 76;
      const NODE_W = VAL_W + PTR_W, SLOT = NODE_W + GAP, mid = TOP + NODE_H / 2;
      const ghost = got !== null;
      const first = ghost ? 1 : 0;   // 第一個還在串列裡的節點畫在第幾格
      const slots = sandbox ? this.sandbox.capacity : first + items.length;
      const s = svgEl(PAD * 2 + slots * SLOT + NULL_W, hgt); const rc = rough.svg(s);
      const slotX = (slot) => PAD + slot * SLOT;
      const thin = { stroke: INK, strokeWidth: 1.2, roughness: 0.5 };
      const arrow = (parent, x1, y1, x2, y2, seed) => {
        const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;   // 箭頭朝向
        parent.append(rc.line(x1, y1, x2, y2, { ...thin, seed }));
        parent.append(rc.linearPath([[x2 - 5 * ux - 3.5 * uy, y2 - 5 * uy + 3.5 * ux], [x2, y2], [x2 - 5 * ux + 3.5 * uy, y2 - 5 * uy - 3.5 * ux]], { ...thin, seed: seed + 1 }));
      };
      // seed 跟著值走：同一個節點在每一格長得一樣
      const drawNode = (parent, slot, value, { fill, dashed }) => {
        const x = slotX(slot), seed = 1000 + value, line = dashed ? { strokeLineDash: [4, 3], disableMultiStroke: true } : {};
        parent.append(rc.rectangle(x, TOP, VAL_W, NODE_H, { stroke: INK, fill, fillStyle: 'hachure', hachureGap: 5, roughness: 1, seed, ...line }));
        parent.append(rc.rectangle(x + VAL_W, TOP, PTR_W, NODE_H, { stroke: INK, roughness: 1, seed: seed + 1, ...line }));
        parent.append(rc.circle(x + VAL_W + PTR_W / 2, mid, 4, { stroke: INK, fill: INK, fillStyle: 'solid', roughness: 0.3, seed: seed + 2 }));
        svgText(parent, x + VAL_W / 2, mid, String(value), String(value).length > 2 ? 11 : 14);
        arrow(parent, x + VAL_W + PTR_W / 2 + 2, mid, x + SLOT - 1, mid, 60 + slot);
      };
      if (ghost) {
        const faded = document.createElementNS(SVG_NS, 'g'); faded.setAttribute('opacity', '0.45'); s.append(faded);
        drawNode(faded, 0, got, { fill: FILL, dashed: false });
      }
      items.forEach((v, i) => drawNode(s, first + i, v, { fill: i === fresh ? NEW : FILL, dashed: i < walked }));
      for (let i = 0; i < walked; i++) {
        const cx = slotX(first + i) + NODE_W / 2;
        s.append(rc.circle(cx, BADGE_Y, 14, { stroke: INK, roughness: 0.5, seed: 80 + i }));
        svgText(s, cx, BADGE_Y, String(i + 1), 10);
      }
      svgText(s, slotX(first + items.length) + NULL_W / 2, mid, 'null', 11);
      const headX = items.length ? slotX(first) + VAL_W / 2 : slotX(first) + NULL_W / 2;
      svgText(s, headX, 8, 'head', 11);
      arrow(s, headX, 15, headX, items.length ? TOP - 1 : mid - 8, 50);
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('ds', 'linked_list', page);
})(typeof window !== 'undefined' ? window : globalThis);
