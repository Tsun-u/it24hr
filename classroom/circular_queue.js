// classroom/circular_queue.js — 小教室「Circular Queue 環狀佇列」這一頁：講義內容、沙盒的純函式、畫圖（寫法見 classroom-handout skill）
(function (root) {
  const SIZE = 6;
  const step = (i) => (i + 1) % SIZE;   // 往前走一格，走到最後一格的下一步繞回 0 號格

  const page = {
    analogy: '迴轉壽司的軌道：盤子轉一圈回到起點，位子重複用。',
    summary: '下次看到迴轉壽司的軌道、行車記錄器的循環錄影，你就知道：那是一個環狀佇列，轉一圈回到起點，位子重複用。',   // 總結：呼應開頭的比喻（教學怪物教案的回環結構）
    frames: ['enqueue', 'enqueue', 'enqueue', 'enqueue', 'enqueue', 'dequeue', 'enqueue'],
    uses: [
      '行車記錄器的循環錄影：記憶卡的空間繞著圈用，錄滿了就從最舊的那段蓋過去。',
      '聽音樂、看影片時的緩衝：先把接下來幾秒載進一塊固定大小的記憶體，播放器從另一頭拿出來播，播完的位子再拿來放新載的。',
      '網路卡收封包：收到的封包依序放進一圈固定的記憶體（ring buffer，環形緩衝區），作業系統從另一頭拿走處理；這一圈滿了，新來的封包只好丟掉。',
      '作業系統的輪流排班（Round-Robin 排程）：等著用 CPU 的程式排成一圈，每個輪流用一小段時間，沒做完就排回後面，一圈一圈輪下去。',
    ],
    concept: [
      '上一頁說過，用陣列做佇列、叫號時不挪動的話，front 和 rear 只會往後走。走到陣列尾巴，前面叫完號空出來的位子再也用不到：明明有空位，卻說滿了。',
      '環狀佇列把陣列的頭尾接成一圈：指標往前走一格寫成 (i + 1) % 6，5 號格的下一格就是 0 號格，空出來的位子可以重複用。它還是先進先出（FIFO），只是位子繞著圈用。',
      '台灣教科書常見的寫法：front 指著第一個元素的前一格、rear 指著最後一個元素，一開始 front = rear = 0。空的時候 front == rear；可是 6 格全放滿的話，rear 繞一圈追上 front，也是 front == rear，分不出滿還是空。所以故意空一格：(rear + 1) % 6 == front 就算滿，6 格最多放 5 個。另一種做法是多記一個 count（現在有幾個），6 格就能全用。',
    ],
    // 各操作的時間複雜度（Big-O 的定義與怎麼算在附錄）
    complexity: [['enqueue 排進來', 'O(1)'], ['dequeue 叫號', 'O(1)'], ['看下一個要叫的', 'O(1)'], ['判斷空／滿', 'O(1)'], ['找某個值在不在裡面', 'O(n)']],
    // 常見誤解：教學怪物教案的 Common Trap，寫成「很多人以為…——其實…」
    traps: [
      { wrong: '環狀佇列在記憶體裡是一個圓', right: '記憶體裡還是一條直直的陣列，「環」是 % 讓指標走到最後一格的下一步跳回 0 號格。' },
      { wrong: '6 格的環狀佇列能放 6 個', right: '照空一格的寫法最多放 5 個。放第 6 個時 rear 會繞一圈追上 front，變成 front == rear，跟空的時候一模一樣，分不出滿還是空。考題問「大小 n 最多放幾個」，答案是 n − 1。' },
      { wrong: '滿是 front == rear，空是 (rear + 1) % n == front', right: '剛好寫反了：front == rear 是空的，(rear + 1) % n == front 才是滿的。記法：rear 再走一步就撞到 front，代表沒位子了。' },
      { wrong: 'front 指著第一個元素', right: '這頁照台灣教科書常見的寫法，front 指著第一個元素的前一格，要拿的是 (front + 1) % n 那格。也有書讓 front 直接指第一個元素、rear 指最後一個的下一格，算式就跟著變；考試先看清楚題目怎麼定義 front 和 rear。' },
      { wrong: 'Python 的 deque(maxlen=3) 放滿了會拒絕新的', right: '它不會報錯，而是默默把最舊的那個從另一頭擠掉：依序放 1、2、3、4，剩下的是 2、3、4。要「滿了就拒絕」得自己先檢查，或改用 queue.Queue(maxsize) 的 put_nowait（滿了丟 queue.Full）。' },
    ],
    code: {
      python: {
        builtin: `# 內建的沒有環狀的概念，考試要自己刻；queue.Queue 是有容量上限的佇列
import queue

q = queue.Queue(maxsize=5)   # 跟自己刻的 6 格環狀佇列一樣最多放 5 個
for x in range(1, 6):
    q.put_nowait(x)          # 滿了再放會丟 queue.Full
a = q.get_nowait()
q.put_nowait(6)
rest = [q.get_nowait() for _ in range(q.qsize())]   # queue.Queue 沒有 peek，全部拿出來看頭尾
print(a, rest[0], rest[-1])
`,
        handmade: `class CircularQueue:
    def __init__(self, size):
        self.items = [None] * size
        self.front = 0   # 第一個元素的前一格
        self.rear = 0    # 最後一個元素

    def is_empty(self):
        return self.front == self.rear

    # 空一格才分得出滿和空：rear 再走一步就撞到 front 算滿
    def is_full(self):
        return (self.rear + 1) % len(self.items) == self.front

    def enqueue(self, x):
        if self.is_full():
            raise OverflowError("queue overflow")
        self.rear = (self.rear + 1) % len(self.items)
        self.items[self.rear] = x

    def dequeue(self):
        if self.is_empty():
            raise IndexError("queue underflow")
        self.front = (self.front + 1) % len(self.items)
        return self.items[self.front]

    def peek(self):
        return self.items[(self.front + 1) % len(self.items)]

    def last(self):
        return self.items[self.rear]


q = CircularQueue(6)
for x in range(1, 6):
    q.enqueue(x)
a = q.dequeue()
q.enqueue(6)
print(a, q.peek(), q.last())
`,
      },
      js: {
        builtin: `// 內建的沒有環狀的概念，考試要自己刻；這裡用陣列 push／shift 加長度檢查
const CAPACITY = 5;   // 跟自己刻的 6 格環狀佇列一樣最多放 5 個
const queue = [];
function enqueue(x) {
  if (queue.length === CAPACITY) throw new Error('queue overflow');
  queue.push(x);
}

for (let x = 1; x <= 5; x++) enqueue(x);
const a = queue.shift();
enqueue(6);
console.log(a, queue[0], queue[queue.length - 1]);
`,
        handmade: `class CircularQueue {
  constructor(size) {
    this.items = new Array(size);
    this.front = 0;   // 第一個元素的前一格
    this.rear = 0;    // 最後一個元素
  }
  isEmpty() {
    return this.front === this.rear;
  }
  // 空一格才分得出滿和空：rear 再走一步就撞到 front 算滿
  isFull() {
    return (this.rear + 1) % this.items.length === this.front;
  }
  enqueue(x) {
    if (this.isFull()) throw new Error('queue overflow');
    this.rear = (this.rear + 1) % this.items.length;
    this.items[this.rear] = x;
  }
  dequeue() {
    if (this.isEmpty()) throw new Error('queue underflow');
    this.front = (this.front + 1) % this.items.length;
    return this.items[this.front];
  }
  peek() {
    return this.items[(this.front + 1) % this.items.length];
  }
  last() {
    return this.items[this.rear];
  }
}

const q = new CircularQueue(6);
for (let x = 1; x <= 5; x++) q.enqueue(x);
const a = q.dequeue();
q.enqueue(6);
console.log(a, q.peek(), q.last());
`,
      },
      java: {
        builtin: `import java.util.concurrent.ArrayBlockingQueue;

// ArrayBlockingQueue 裡面其實是環狀陣列（多記一個 count 的做法），但 front、rear 和繞回都藏起來了，考試要自己刻
public class Main {
    public static void main(String[] args) {
        ArrayBlockingQueue<Integer> queue = new ArrayBlockingQueue<>(5);   // 跟自己刻的 6 格環狀佇列一樣最多放 5 個
        for (int x = 1; x <= 5; x++) queue.add(x);   // 滿了再 add 會丟 IllegalStateException
        int a = queue.poll();
        queue.add(6);
        Integer[] rest = queue.toArray(new Integer[0]);   // 沒有看最後一個的方法，轉成陣列看頭尾
        System.out.println(a + " " + rest[0] + " " + rest[rest.length - 1]);
    }
}
`,
        handmade: `public class Main {
    static class CircularQueue {
        private final int[] items;
        private int front = 0;   // 第一個元素的前一格
        private int rear = 0;    // 最後一個元素

        CircularQueue(int size) {
            items = new int[size];
        }

        boolean isEmpty() {
            return front == rear;
        }

        // 空一格才分得出滿和空：rear 再走一步就撞到 front 算滿
        boolean isFull() {
            return (rear + 1) % items.length == front;
        }

        void enqueue(int x) {
            if (isFull()) throw new IllegalStateException("queue overflow");
            rear = (rear + 1) % items.length;
            items[rear] = x;
        }

        int dequeue() {
            if (isEmpty()) throw new IllegalStateException("queue underflow");
            front = (front + 1) % items.length;
            return items[front];
        }

        int peek() {
            return items[(front + 1) % items.length];
        }

        int last() {
            return items[rear];
        }
    }

    public static void main(String[] args) {
        CircularQueue q = new CircularQueue(6);
        for (int x = 1; x <= 5; x++) q.enqueue(x);
        int a = q.dequeue();
        q.enqueue(6);
        System.out.println(a + " " + q.peek() + " " + q.last());
    }
}
`,
      },
      cpp: {
        builtin: `#include <iostream>
#include <queue>
#include <stdexcept>

// 內建的沒有環狀的概念，考試要自己刻；這裡用 std::queue 加長度檢查
const std::size_t CAPACITY = 5;   // 跟自己刻的 6 格環狀佇列一樣最多放 5 個

void enqueue(std::queue<int>& queue, int x) {
    if (queue.size() == CAPACITY) throw std::overflow_error("queue overflow");
    queue.push(x);
}

int main() {
    std::queue<int> queue;
    for (int x = 1; x <= 5; x++) enqueue(queue, x);
    int a = queue.front(); queue.pop();
    enqueue(queue, 6);
    std::cout << a << " " << queue.front() << " " << queue.back() << "\\n";
}
`,
        handmade: `#include <iostream>
#include <stdexcept>

class CircularQueue {
    static constexpr int SIZE = 6;
    int items[SIZE];
    int front = 0;   // 第一個元素的前一格
    int rear = 0;    // 最後一個元素

public:
    bool isEmpty() const { return front == rear; }
    // 空一格才分得出滿和空：rear 再走一步就撞到 front 算滿
    bool isFull() const { return (rear + 1) % SIZE == front; }
    void enqueue(int x) {
        if (isFull()) throw std::overflow_error("queue overflow");
        rear = (rear + 1) % SIZE;
        items[rear] = x;
    }
    int dequeue() {
        if (isEmpty()) throw std::underflow_error("queue underflow");
        front = (front + 1) % SIZE;
        return items[front];
    }
    int peek() const { return items[(front + 1) % SIZE]; }
    int last() const { return items[rear]; }
};

int main() {
    CircularQueue q;
    for (int x = 1; x <= 5; x++) q.enqueue(x);
    int a = q.dequeue();
    q.enqueue(6);
    std::cout << a << " " << q.peek() << " " << q.last() << "\\n";
}
`,
      },
      output: '1 2 6',
    },
    // 沙盒：長度 6 的陣列繞成環。front 指第一個元素的前一格、rear 指最後一個；空：front == rear，滿：(rear + 1) % 6 == front。
    // slots 是每一格放的數字（沒放是 null），touched 是這一步動到的那格（畫圖上黃色）
    sandbox: {
      capacity: SIZE,
      ops: [{ op: 'enqueue', label: '排進來 enqueue' }, { op: 'dequeue', label: '叫號 dequeue' }],
      errors: {
        underflow: '空的：front == rear，沒東西可以拿（underflow）',
        overflow: `滿了：(rear + 1) % ${SIZE} == front。要空一格才分得出滿和空，${SIZE} 格最多放 ${SIZE - 1} 個（overflow）`,
      },
      init() { return { slots: Array(SIZE).fill(null), front: 0, rear: 0, next: 1, got: null, touched: null, error: null }; },
      apply(s, op) {
        if (op === 'enqueue') {
          if (step(s.rear) === s.front) return { ...s, got: null, touched: null, error: 'overflow' };
          const rear = step(s.rear), slots = [...s.slots];
          slots[rear] = s.next;
          return { ...s, slots, rear, next: s.next + 1, got: null, touched: rear, error: null };
        }
        if (s.front === s.rear) return { ...s, got: null, touched: null, error: 'underflow' };
        const front = step(s.front), slots = [...s.slots], got = slots[front];
        slots[front] = null;
        return { ...s, slots, front, got, touched: front, error: null };
      },
      label(op, s) {
        if (op === 'dequeue') return `dequeue() → ${s.got}`;
        const notes = [s.rear === 0 && '繞回 0 號格', step(s.rear) === s.front && '滿了'].filter(Boolean);
        return `enqueue(${s.slots[s.rear]})${notes.length ? `：${notes.join('，')}` : ''}`;
      },
    },
    // 6 格繞成一圈：0 號格在正上方、順時針排，格號寫在圈裡面；front、rear 從圈外用箭頭指著那一格（指同一格就疊兩行），最下面寫兩個指標的值。
    // 這一步動到的那格上黃色：放進來的那格，或剛叫完號、空出來的那格
    draw({ rough, svgEl, svgText, INK, FILL, NEW }, { slots, front, rear, touched }, { sandbox = false } = {}) {
      const R = sandbox ? 66 : 50, r = Math.round(R * 0.54), w = 2 * R + 96, cy = R + 44, hgt = cy + R + 62, cx = w / 2;
      const s = svgEl(w, hgt); const rc = rough.svg(s);
      const dir = (deg) => [Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180)];
      const at = (rad, deg) => { const [dx, dy] = dir(deg); return [cx + rad * dx, cy + rad * dy]; };
      slots.forEach((v, i) => {
        const [x0, y0] = at(R, i * 60 - 30), [x1, y1] = at(R, i * 60 + 30), [x2, y2] = at(r, i * 60 + 30), [x3, y3] = at(r, i * 60 - 30);
        const fill = i === touched ? NEW : v === null ? null : FILL;
        s.append(rc.path(`M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 0 0 ${x3} ${y3} Z`,
          { stroke: INK, strokeWidth: 1.4, roughness: 0.8, seed: 11 + i, ...(fill && { fill, fillStyle: 'hachure', hachureGap: 5 }) }));
        if (v !== null) svgText(s, ...at((R + r) / 2, i * 60), String(v));
        svgText(s, ...at(r - 9, i * 60), String(i), 10).setAttribute('style', 'fill: #8a8f98; font-weight: 400');
      });
      const pointers = front === rear ? [[front, ['front', 'rear']]] : [[front, ['front']], [rear, ['rear']]];
      for (const [i, names] of pointers) {
        const deg = i * 60, line = { stroke: INK, strokeWidth: 1.3, roughness: 0.6, seed: 31 + i };
        s.append(rc.line(...at(R + 16, deg), ...at(R + 3, deg), line));
        s.append(rc.linearPath([at(R + 9, deg - 5), at(R + 3, deg), at(R + 9, deg + 5)], line));
        // 字往外推半個字寬，斜放的那幾格字才不會壓到箭頭尾巴
        const [ax, ay] = at(R + 20 + (names.length - 1) * 4, deg), [dx, dy] = dir(deg);
        names.forEach((name, k) => svgText(s, ax + dx * 18, ay + dy * 6 + (k - (names.length - 1) / 2) * 12, name, 11));
      }
      svgText(s, cx, hgt - 10, `front = ${front}　rear = ${rear}`, 11);
      return s;
    },
  };
  if (typeof module !== 'undefined') module.exports = page; else root.Classroom.add('circular_queue', page);
})(typeof window !== 'undefined' ? window : globalThis);
