"""從標準輸入讀 JSON {code, stdin?}，實際執行那段 Python 程式，印出每一步的 JSON。
每一步是「剛跑完哪一行」：line、跑完之後正在跑的那一層的變數（vars）、到目前為止的輸出（out）。另外：
- 條件判斷那行（while、for、if）記 cond（成立 true、不成立 false）
- 有給 stdin 時記 read：到目前為止讀掉了幾個字
- 在函式裡的時候記 stack：從主程式到正在跑的那一層，每層 { fn, vars }（主程式那層沒有 fn）
- 呼叫函式的那一步記 call（函式名）：這時那一行還沒跑完，vars 是剛進函式、只有參數的那一層；
  函式回來之後，那一行跑完的樣子另外是一步
- 函式跑完的那一步記 ret（回傳值，沒有回傳是 null）
- 定義函式、資料型態的那一步記 def（名字）
程式自己定義的資料型態（class）的值寫成 { "__type": 型態名, 欄位: 值, ... }。
給 scripts/build-traces.js 用，不單獨用。"""
import ast
import copy
import io
import json
import sys
from contextlib import redirect_stdout

SHOWN = (int, float, str, bool, list, tuple, dict, type(None))


def analyze(code):
    """條件判斷那一行 → 條件成立時下一步會跑到的那一行；程式定義的函式名、資料型態名；
    定義的開頭幾行（裝飾器 @dataclass 到 def、class 那行）→ def、class 那行"""
    starts, funcs, classes, header = {}, set(), set(), {}
    for node in ast.walk(ast.parse(code)):
        if isinstance(node, (ast.While, ast.For, ast.If)):
            starts[node.lineno] = node.body[0].lineno
        elif isinstance(node, (ast.FunctionDef, ast.ClassDef)):
            (funcs if isinstance(node, ast.FunctionDef) else classes).add(node.name)
            for line in range(min([d.lineno for d in node.decorator_list] + [node.lineno]), node.lineno + 1):
                header[line] = node.lineno
    return starts, funcs, classes, header


def trace(code, stdin=None):
    starts, funcs, classes, header = analyze(code)
    steps, buf = [], io.StringIO()
    feed = io.StringIO(stdin) if stdin is not None else None
    pending = [None]        # 跑到一半的那一行：(行號, 那一行屬於哪一層)
    defined = [set()]       # 主程式裡已經定義好的函式、資料型態

    def shown(v):
        if type(v).__name__ in classes and hasattr(v, '__dict__'):
            return {'__type': type(v).__name__, **{k: shown(x) for k, x in vars(v).items()}}
        if isinstance(v, (list, tuple)):
            return [shown(x) for x in v]
        if isinstance(v, dict):
            return {k: shown(x) for k, x in v.items()}
        return copy.deepcopy(v)

    def keep(v):
        return isinstance(v, SHOWN) or type(v).__name__ in classes

    def ours(frame):
        return frame is not None and frame.f_code.co_filename == '<trace>' and (
            frame.f_code.co_name == '<module>' or frame.f_code.co_name in funcs)

    def frame_vars(frame):
        return {k: shown(v) for k, v in frame.f_locals.items() if not k.startswith('__') and keep(v)}

    def record(line, owner, frame, **extra):
        chain = []
        f = frame
        while ours(f):
            chain.append(f)
            f = f.f_back
        chain.reverse()
        step = {'line': line, 'vars': frame_vars(frame), 'out': buf.getvalue()}
        if feed is not None:
            step['read'] = feed.tell()
        if len(chain) > 1:
            step['stack'] = [({} if c.f_code.co_name == '<module>' else {'fn': c.f_code.co_name}) | {'vars': frame_vars(c)} for c in chain]
        if owner.f_code.co_name == '<module>':
            names = {k for k, v in owner.f_globals.items() if k in funcs | classes}
            new = sorted(names - defined[0])
            if new:
                step['def'] = new[0] if len(new) == 1 else new
            defined[0] = names
        step.update(extra)
        step['_owner'] = id(owner)
        steps.append(step)

    def tracer(frame, event, arg):
        if not ours(frame):
            return None
        if event == 'call' and frame.f_code.co_name != '<module>':
            if pending[0] is not None:
                line, owner = pending[0]
                record(line, owner, frame, call=frame.f_code.co_name)
            pending[0] = None
        elif event == 'line':
            if pending[0] is not None:
                record(pending[0][0], pending[0][1], frame)
            pending[0] = (frame.f_lineno, frame)
        elif event == 'return':
            if pending[0] is not None:
                extra = {} if frame.f_code.co_name == '<module>' else {'ret': shown(arg)}
                record(pending[0][0], pending[0][1], frame, **extra)
            caller = frame.f_back
            pending[0] = (caller.f_lineno, caller) if ours(caller) else None
        return tracer

    compiled = compile(code, '<trace>', 'exec')
    saved_stdin = sys.stdin
    if feed is not None:
        sys.stdin = feed
    sys.settrace(tracer)
    try:
        with redirect_stdout(buf):
            exec(compiled, {})
    finally:
        sys.settrace(None)
        sys.stdin = saved_stdin

    # 有裝飾器的定義，Python 會在裝飾器和 def、class 那行之間來回跑好幾次：併成 def、class 那行的一步（留最後一次）
    merged = []
    for step in steps:
        if step['line'] in header:
            step['line'] = header[step['line']]
            last = merged[-1] if merged else None
            if last and last['line'] == step['line'] and last['_owner'] == step['_owner'] and 'call' not in last:
                merged.pop()
        merged.append(step)
    steps = merged

    # 條件成不成立：看同一層的下一步是不是跑到條件成立時的那一行（呼叫函式的那一步不是條件跑完）
    for i, step in enumerate(steps):
        if step['line'] in starts and 'call' not in step:
            following = next((s['line'] for s in steps[i + 1:] if s['_owner'] == step['_owner']), None)
            step['cond'] = following == starts[step['line']]
    for step in steps:
        del step['_owner']
    return steps


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    job = json.loads(sys.stdin.read())
    print(json.dumps(trace(job['code'], job.get('stdin')), ensure_ascii=False))
