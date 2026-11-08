// classroom/queue.js — 小教室「Queue 佇列」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  const page = {
    stamp: 'queue',
    analogy: '排隊買飲料：先到的先點。',
    summary: '下次排隊買飲料、按下列印，你就知道：那是一個佇列，先到的先走。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['enqueue', 'enqueue', 'enqueue', 'dequeue', 'enqueue', 'dequeue'],
    game: '結算卡蓋 Queue，是因為你總是照卡片進來的順序做：最早來的先處理，後來的乖乖排隊。很公平——但老闆的急件也得排在阿賢後面，所以沒有人覺得你公平。',
    uses: [
      '客服專線、網購出貨：照順序一個一個處理。',
      '印表機的列印工作：先送出的先印。',
      '鍵盤輸入：你打的字照順序送進程式，不會亂掉。',
      '在地圖上找最近的路（廣度優先搜尋 BFS）：一層一層往外找，靠的就是佇列。',
    ],
    concept: [
      '佇列有兩個口：新來的從後面（rear）排進來，輪到的從前面（front）離開。',
      '所以最先進來的會最先出去，這個特性叫 FIFO（First In, First Out，先進先出）。',
    ],
    complexity: [['enqueue 排進來', 'O(1)'], ['dequeue 叫號', 'O(1)'], ['front 看下一個', 'O(1)'], ['找某個值在不在裡面', 'O(n)']],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: '佇列跟堆疊差不多', right: '堆疊是最後來的先走（LIFO），佇列是最先來的先走（FIFO）；堆疊只有頂端一個口，佇列前後各一個口。' },
      { wrong: 'dequeue 會把最後排進來的拿走', right: 'dequeue 永遠從最前面（front）拿，拿的是最早排進來的那個。' },
      { wrong: '用陣列做佇列很簡單，叫號就把第一個刪掉', right: '刪掉第一個之後，後面全部要往前挪一格，資料一多就很慢。JavaScript 的 shift()、Python 的 list.pop(0) 都是這樣；Python 請改用 collections.deque。' },
      { wrong: '不挪的話，front 和 rear 一直往後走就好', right: '走到陣列尾巴就沒地方放了，前面空出來的位子卻用不到，明明有空位卻說滿了。環狀佇列（下一頁）讓它們繞回開頭，就是為了解決這件事。' },
    ],
    code: {
      python: {
        builtin: `from collections import deque

queue = deque()
queue.append(1)
queue.append(2)
queue.append(3)
a = queue.popleft()
b = queue.popleft()
print(a, b, queue[0])
`,
        handmade: `class Node:
    def __init__(self, value):
        self.value = value
        self.next = None


class Queue:
    def __init__(self):
        self.front = None
        self.rear = None

    def enqueue(self, x):
        node = Node(x)
        if self.rear is None:
            self.front = self.rear = node
        else:
            self.rear.next = node
            self.rear = node

    def dequeue(self):
        if self.front is None:
            raise IndexError("queue underflow")
        x = self.front.value
        self.front = self.front.next
        if self.front is None:
            self.rear = None
        return x

    def peek(self):
        return self.front.value


q = Queue()
for x in (1, 2, 3):
    q.enqueue(x)
a = q.dequeue()
b = q.dequeue()
print(a, b, q.peek())
`,
      },
      js: {
        builtin: `// JS 沒有內建佇列，常見寫法是陣列 push／shift；shift 要搬整排，資料多時改用自己刻的
const queue = [];
queue.push(1);
queue.push(2);
queue.push(3);
const a = queue.shift();
const b = queue.shift();
console.log(a, b, queue[0]);
`,
        handmade: `class Queue {
  constructor() {
    this.front = null;
    this.rear = null;
  }
  enqueue(x) {
    const node = { value: x, next: null };
    if (this.rear === null) this.front = this.rear = node;
    else {
      this.rear.next = node;
      this.rear = node;
    }
  }
  dequeue() {
    if (this.front === null) throw new Error('queue underflow');
    const x = this.front.value;
    this.front = this.front.next;
    if (this.front === null) this.rear = null;
    return x;
  }
  peek() {
    return this.front.value;
  }
}

const q = new Queue();
for (const x of [1, 2, 3]) q.enqueue(x);
const a = q.dequeue();
const b = q.dequeue();
console.log(a, b, q.peek());
`,
      },
      java: {
        builtin: `import java.util.ArrayDeque;
import java.util.Queue;

public class Main {
    public static void main(String[] args) {
        Queue<Integer> queue = new ArrayDeque<>();
        queue.offer(1);
        queue.offer(2);
        queue.offer(3);
        int a = queue.poll();
        int b = queue.poll();
        System.out.println(a + " " + b + " " + queue.peek());
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

    static class Queue {
        private Node front, rear;

        void enqueue(int x) {
            Node node = new Node(x);
            if (rear == null) front = rear = node;
            else {
                rear.next = node;
                rear = node;
            }
        }

        int dequeue() {
            if (front == null) throw new IllegalStateException("queue underflow");
            int x = front.value;
            front = front.next;
            if (front == null) rear = null;
            return x;
        }

        int peek() {
            return front.value;
        }
    }

    public static void main(String[] args) {
        Queue q = new Queue();
        for (int x : new int[] {1, 2, 3}) q.enqueue(x);
        int a = q.dequeue();
        int b = q.dequeue();
        System.out.println(a + " " + b + " " + q.peek());
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <queue>

int main() {
    std::queue<int> queue;
    queue.push(1);
    queue.push(2);
    queue.push(3);
    int a = queue.front(); queue.pop();
    int b = queue.front(); queue.pop();
    std::cout << a << " " << b << " " << queue.front() << "\\n";
}
`,
        handmade: `#include <iostream>
#include <stdexcept>

struct Node {
    int value;
    Node* next;
};

class Queue {
    Node* front = nullptr;
    Node* rear = nullptr;

public:
    void enqueue(int x) {
        Node* node = new Node{x, nullptr};
        if (!rear) front = rear = node;
        else {
            rear->next = node;
            rear = node;
        }
    }
    int dequeue() {
        if (!front) throw std::underflow_error("queue underflow");
        Node* old = front;
        int x = old->value;
        front = front->next;
        if (!front) rear = nullptr;
        delete old;
        return x;
    }
    int peek() const { return front->value; }
};

int main() {
    Queue q;
    for (int x : {1, 2, 3}) q.enqueue(x);
    int a = q.dequeue();
    int b = q.dequeue();
    std::cout << a << " " << b << " " << q.peek() << "\\n";
}
`,
      },
      output: '1 2 3',
    },
    // 沙盒：容量 6；enqueue 從尾端 rear 排進來、dequeue 從前端 front 叫號；空的 dequeue 是 underflow
    sandbox: {
      capacity: 6,
      ops: [{ op: 'enqueue', label: '排進來 enqueue' }, { op: 'dequeue', label: '叫號 dequeue' }],
      init() { return { items: [], next: 1, got: null, error: null }; },
      apply(s, op) {
        if (op === 'enqueue') {
          if (s.items.length >= this.capacity) return { ...s, got: null, error: 'overflow' };
          return { items: [...s.items, s.next], next: s.next + 1, got: null, error: null };
        }
        if (!s.items.length) return { ...s, got: null, error: 'underflow' };
        return { ...s, items: s.items.slice(1), got: s.items[0], error: null };
      },
      label(op, s) { return op === 'enqueue' ? `enqueue(${s.items[s.items.length - 1]})` : `dequeue() → ${s.got}`; },
    },
    // 橫的管子，左邊出口 front、右邊入口 rear；最新排進來的上黃色
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { items }) {
      const capacity = 6, boxW = 30, pad = 30, width = capacity * boxW + pad * 2, hgt = 74, top = 14, bot = 50;
      const s = svgEl(width, hgt); const rc = rough.svg(s);
      s.append(rc.line(pad - 6, top, width - pad + 6, top, { stroke: INK, strokeWidth: 1.6, roughness: 1.2, seed: 7 }));
      s.append(rc.line(pad - 6, bot, width - pad + 6, bot, { stroke: INK, strokeWidth: 1.6, roughness: 1.2, seed: 8 }));
      const x0 = pad + (width - pad * 2 - capacity * boxW) / 2;
      items.forEach((v, i) => {
        s.append(rc.rectangle(x0 + i * boxW + 2, top + 5, boxW - 4, bot - top - 10,
          { stroke: INK, fill: i === items.length - 1 ? NEW : FILL, fillStyle: 'hachure', hachureGap: 5, roughness: 1, seed: 11 + v }));
        svgText(s, x0 + i * boxW + boxW / 2, (top + bot) / 2, String(v));
      });
      svgText(s, pad - 4, hgt - 10, 'front', 11); svgText(s, width - pad + 4, hgt - 10, 'rear', 11);
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('ds', 'queue', page);
})(typeof window !== 'undefined' ? window : globalThis);
