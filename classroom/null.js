// classroom/null.js — 小教室彩蛋「null 還沒初始化」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  const GRAY = '#8a8f98', RED = '#d1495b';   // null 的灰字；對 null push 時把 null 圈起來的紅線

  const page = {
    stamp: 'null',
    analogy: '領到鑰匙、打開置物櫃沒東西，是空的；連鑰匙都還沒領到，是 null。',
    summary: '下次看到 null，想想那把還沒領到的置物櫃鑰匙：打開沒東西是空的，連櫃子都還沒有才是 null——先 new 一個，再放東西。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['push', 'create', 'push', 'push'],
    game: '結算卡蓋 null，是因為你今天的點擊紀錄一筆都沒有：一張卡都沒點開，更別說動手，判定的第一條就是「什麼都沒有 → null」。你就像一個宣告好了、卻一直沒指向任何東西的變數，看板上的卡全都在等你 new 一下。往好處想：今天零 bug——因為一行程式都沒寫。',
    uses: [
      '表單沒填的欄位：會員資料的年齡沒填，資料庫存的是 NULL（不知道），不是 0 歲，也不是空字串。',
      '找不到時回傳 null：在通訊錄搜一個沒存過的名字，程式回傳 null 代表「沒有這個人」。網頁的 document.querySelector、Java 的 Map.get 找不到都回 null，Python 的 dict.get 回 None。',
      '鏈結串列（Linked List）最後一個節點的 next 是 null：從頭一路走，走到 null 就知道到底了。',
      '樹（Tree）的葉子底下：葉子的左右子節點都是 null。遞迴走訪一棵樹時，「碰到 null 就回頭」是最常見的終止條件（base case）。',
    ],
    concept: [
      '在 Python、JavaScript、Java 裡，存物件的變數放的不是物件本身，而是指向它的參考（reference），就像一把對到某個置物櫃的鑰匙；C++ 要用指標（pointer）才有這一層。null 就是這個參考沒指向任何東西：鑰匙還沒對到任何櫃子。',
      '所以 null 跟「空的」不一樣。空的堆疊是真的有一個堆疊、只是裡面沒東西，可以問它空了沒、可以 push；null 是根本還沒有堆疊，對它做任何事都會出錯。要先 new 一個堆疊、讓 s 真的指向它，s 才有東西可以用，這一步常被叫做初始化（initialize）。',
      '四種語言的寫法：Python 是 None，JavaScript 有 null 和 undefined 兩種，Java 是 null，C++ 是 nullptr（C++11 起；更早的程式寫 NULL 或 0）。null 參考是 Tony Hoare 在 1965 年設計 ALGOL W 時加進去的，2009 年他在演講裡自己稱它是「十億美元的錯誤」（billion-dollar mistake）。',
    ],
    complexity: [['檢查是不是 null', 'O(1)'], ['建立空的堆疊 new Stack()', 'O(1)'], ['push 放進', 'O(1)']],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: 'null 就是空的', right: '不一樣。空的堆疊有盒子、只是裡面沒東西，可以 push、可以問它空了沒；null 是連盒子都沒有，連「空了沒」都問不了，一問就出錯。' },
      { wrong: 'null、0、空字串都代表『沒有』，所以一樣', right: '0 是一個數字、"" 是一個長度 0 的字串，它們都是真的存在的值；null 是根本沒有值。表單的年齡填 0 跟沒填是兩回事。偏偏在 if 判斷裡，這三個在 JavaScript 和 Python 都算「假」，寫 if (!age) 會把填 0 的人當成沒填；要分清楚就明寫 age === null（Python 寫 age is None）。' },
      { wrong: '宣告了變數，它就自動是 null', right: '不一定。Java 物件型別的欄位（field）沒給值預設是 null，但區域變數沒給值就拿來用會編譯錯誤；JavaScript 寫 let s; 得到的是 undefined；Python 沒給過值的名字根本不存在，一用就 NameError；C++ 沒初始化的區域指標裡是一個亂七八糟的位址，不是 nullptr，比 null 更危險。' },
      { wrong: 'JavaScript 的 undefined 跟 null 一樣', right: '不一樣。undefined 是「還沒給值」（宣告了沒給值、物件沒有那個屬性、函式沒有 return），null 是程式刻意放進去的「沒有」。null == undefined 是 true，但 null === undefined 是 false；typeof null 還會得到 "object"，這是 JavaScript 早年留下來的 bug。' },
      { wrong: 'Python 判斷 None 用 == 就好', right: '要寫 x is None。== 會呼叫物件自己定義的比較方法（__eq__），有些類別會給出意想不到的結果（NumPy 陣列跟 None 用 == 比，得到的是一整排 True／False）；None 整個程式只有一個，用 is 直接比「是不是同一個」最準，PEP 8 也這樣規定。' },
      { wrong: 'C++ 的 nullptr、NULL、0 都一樣', right: 'NULL 通常是代表整數 0 的巨集（macro）。同時有 f(int) 和 f(char*) 兩個多載（overload）時，f(NULL) 可能跑去呼叫 f(int)，也可能編譯器直接說呼叫不明確（ambiguous）；nullptr（C++11 起）有自己的型別 std::nullptr_t，只會被當成指標，f(nullptr) 一定呼叫 f(char*)。新的 C++ 程式一律寫 nullptr。' },
      { wrong: '對 null 呼叫方法，頂多回傳 null', right: '沒那麼客氣。Java 丟 NullPointerException、JavaScript 丟 TypeError、Python 丟 AttributeError，C++ 是未定義行為（undefined behavior），常常直接當掉。JavaScript 的 s?.push(1) 會安靜地回傳 undefined，那是用 ?.（optional chaining）刻意要求「是 null 就跳過」，不是預設行為。' },
    ],
    code: {
      python: {
        builtin: `s = None                # 還沒有堆疊：s 沒指向任何東西
before = "null" if s is None else "not null"   # new 之前：s 是不是 null
s = []                  # 建立空的堆疊：Python 的 list 就能當堆疊用
s.append(1)             # push(1)
print(before, s[-1])
`,
        handmade: `class Node:
    def __init__(self, value, next_node):
        self.value = value
        self.next = next_node


class Stack:
    def __init__(self):
        self.top = None     # 空的堆疊：堆疊本身在，只是 top 還沒指向任何節點

    def push(self, x):
        self.top = Node(x, self.top)    # 新節點壓在原本的頂端上面

    def peek(self):
        if self.top is None:
            raise IndexError("stack underflow")
        return self.top.value


s = None                # 還沒有堆疊：s 沒指向任何東西
before = "null" if s is None else "not null"   # new 之前：s 是不是 null
s = Stack()             # 建立空的堆疊
s.push(1)
print(before, s.peek())
`,
      },
      js: {
        builtin: `let s = null;           // 還沒有堆疊：s 沒指向任何東西（只寫 let s; 會是 undefined，不是 null）
const before = s === null ? 'null' : 'not null';   // new 之前：s 是不是 null
s = [];                 // 建立空的堆疊：JS 的陣列就能當堆疊用
s.push(1);
console.log(before, s[s.length - 1]);
`,
        handmade: `class Stack {
  constructor() {
    this.top = null;    // 空的堆疊：堆疊本身在，只是 top 還沒指向任何節點
  }
  push(x) {
    this.top = { value: x, next: this.top };   // 新節點壓在原本的頂端上面
  }
  peek() {
    if (this.top === null) throw new Error('stack underflow');
    return this.top.value;
  }
}

let s = null;           // 還沒有堆疊：s 沒指向任何東西
const before = s === null ? 'null' : 'not null';   // new 之前：s 是不是 null
s = new Stack();        // 建立空的堆疊
s.push(1);
console.log(before, s.peek());
`,
      },
      java: {
        builtin: `import java.util.ArrayDeque;

public class Main {
    public static void main(String[] args) {
        ArrayDeque<Integer> s = null;   // 還沒有堆疊：s 沒指向任何東西
        String before = s == null ? "null" : "not null";   // new 之前：s 是不是 null
        s = new ArrayDeque<>();         // 建立空的堆疊
        s.push(1);
        System.out.println(before + " " + s.peek());
    }
}
`,
        handmade: `public class Main {
    static class Node {
        int value;
        Node next;

        Node(int value, Node next) {
            this.value = value;
            this.next = next;
        }
    }

    static class Stack {
        private Node top = null;   // 空的堆疊：堆疊本身在，只是 top 還沒指向任何節點

        void push(int x) {
            top = new Node(x, top);   // 新節點壓在原本的頂端上面
        }

        int peek() {
            if (top == null) throw new IllegalStateException("stack underflow");
            return top.value;
        }
    }

    public static void main(String[] args) {
        Stack s = null;            // 還沒有堆疊：s 沒指向任何東西
        String before = s == null ? "null" : "not null";   // new 之前：s 是不是 null
        s = new Stack();           // 建立空的堆疊
        s.push(1);
        System.out.println(before + " " + s.peek());
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <stack>

int main() {
    std::stack<int>* s = nullptr;   // 還沒有堆疊：s 沒指向任何東西
    const char* before = s == nullptr ? "null" : "not null";   // new 之前：s 是不是 null
    s = new std::stack<int>();      // 建立空的堆疊
    s->push(1);
    std::cout << before << " " << s->top() << "\\n";
    delete s;
}
`,
        handmade: `#include <iostream>
#include <stdexcept>

struct Node {
    int value;
    Node* next;
};

class Stack {
    Node* top = nullptr;   // 空的堆疊：堆疊本身在，只是 top 還沒指向任何節點

public:
    ~Stack() {
        while (top != nullptr) {   // 一路走到最底下那個節點的 next（nullptr）
            Node* old = top;
            top = top->next;
            delete old;
        }
    }
    void push(int x) {
        top = new Node{x, top};   // 新節點壓在原本的頂端上面
    }
    int peek() const {
        if (top == nullptr) throw std::underflow_error("stack underflow");
        return top->value;
    }
};

int main() {
    Stack* s = nullptr;    // 還沒有堆疊：s 沒指向任何東西
    const char* before = s == nullptr ? "null" : "not null";   // new 之前：s 是不是 null
    s = new Stack();       // 建立空的堆疊
    s->push(1);
    std::cout << before << " " << s->peek() << "\\n";
    delete s;
}
`,
      },
      output: 'null 1',
    },
    // 沙盒：items 是 null 代表 s 還沒指向任何堆疊、是陣列代表 s 指向一個堆疊（[] 是空的堆疊）。
    // create 建立新的空堆疊（已經有了就換掉、舊的丟掉）；push 放下一個數字，s 是 null 時是錯誤、數字不前進；容量 6，放滿再放是 overflow。
    // created 記這一步有沒有建立：'new' 第一次建立、'replaced' 換掉舊的、null 沒有建立
    sandbox: {
      capacity: 6,
      ops: [{ op: 'create', label: '建立 new Stack()' }, { op: 'push', label: '放一個 push' }],
      errors: { null: 's 是 null，沒有堆疊可以 push：Java 丟 NullPointerException、JavaScript 丟 TypeError、Python 丟 AttributeError，C++ 是未定義行為（常常直接當掉）。先按「建立」。' },
      init() { return { items: null, next: 1, created: null, error: null }; },
      apply(s, op) {
        if (op === 'create') return { ...s, items: [], created: s.items === null ? 'new' : 'replaced', error: null };
        if (s.items === null) return { ...s, created: null, error: 'null' };
        if (s.items.length >= this.capacity) return { ...s, created: null, error: 'overflow' };
        return { items: [...s.items, s.next], next: s.next + 1, created: null, error: null };
      },
      label(op, s) {
        if (op === 'create') return s.created === 'replaced' ? 's = new Stack()：舊的丟掉，換成新的空堆疊' : 's = new Stack()';
        return s.error === 'null' ? `s.push(${s.next}) → 錯誤：s 是 null` : `s.push(${s.items[s.items.length - 1]})`;
      },
    },
    // 左邊是變數 s，箭頭指向它參考的東西：null 時只指到灰字 null、沒有盒子；建立後指向開口朝上的堆疊容器（畫法同 stack 頁）。
    // 剛建立的容器、最新放進去的盒子上黃色；對 null push 時用紅線把 null 圈起來。null 跟堆疊畫在一樣大的畫布，分格圖的圖說才會對齊
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { items, created, error }, { sandbox = false } = {}) {
      const capacity = 6, boxH = 26, pad = 8, hgt = capacity * boxH + pad * 2 + 6, bottom = hgt - pad, midY = hgt / 2;
      const varX = 6, varW = 26, arrowLen = 32, contW = sandbox ? 100 : 76;
      const left = varX + varW + arrowLen + 6, right = left + contW, w = right + 8, tip = left - 4;
      const s = svgEl(w, hgt); const rc = rough.svg(s);
      s.append(rc.rectangle(varX, midY - 13, varW, 26, { stroke: INK, strokeWidth: 1.4, roughness: 1, seed: 3 }));
      svgText(s, varX + varW / 2, midY, 's');
      s.append(rc.line(varX + varW + 3, midY, tip, midY, { stroke: INK, strokeWidth: 1.4, roughness: 0.8, seed: 4 }));
      s.append(rc.linearPath([[tip - 7, midY - 5], [tip, midY], [tip - 7, midY + 5]], { stroke: INK, strokeWidth: 1.4, roughness: 0.6, seed: 5 }));
      if (items === null) {
        svgText(s, left + 22, midY, 'null').style.fill = GRAY;   // 文字的 class（cr-num）會蓋過 fill 屬性，所以用 style
        if (error) s.append(rc.ellipse(left + 22, midY, 54, 30, { stroke: RED, strokeWidth: 1.6, roughness: 1.4, seed: 9 }));
        return s;
      }
      const walls = [[left, pad], [left, bottom], [right, bottom], [right, pad]];
      if (created) s.append(rc.linearPath(walls, { stroke: NEW, strokeWidth: 7, roughness: 1, seed: 6 }));   // 剛建立的容器：外框底下墊一道黃色螢光筆，裡面留白才看得出是空的
      s.append(rc.linearPath(walls, { stroke: INK, strokeWidth: 1.6, roughness: 1.2, seed: 7 }));
      items.forEach((v, i) => {
        const y = bottom - (i + 1) * boxH;
        s.append(rc.rectangle(left + 5, y + 2, contW - 10, boxH - 4,
          { stroke: INK, fill: i === items.length - 1 ? NEW : FILL, fillStyle: 'hachure', hachureGap: 5, roughness: 1, seed: 11 + v }));
        svgText(s, left + contW / 2, y + boxH / 2, String(v));
      });
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('null', page);
})(typeof window !== 'undefined' ? window : globalThis);
