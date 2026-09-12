'use strict';

function numberQ(prompt, answer, sub = 'Enter the exact answer, including any decimal.') {
  return {
    kind: 'number',
    prompt,
    answer,
    sub,
    input: {
      type: 'decimal',
      signed: true
    }
  };
}
function choiceQ(prompt, options, answer, sub = '', meta = {}) {
  return {
    kind: 'choice',
    prompt,
    options,
    answer,
    sub,
    meta
  };
}
function opts(ans, ds) {
  return sh([ans, ...ds.filter(x => String(x) !== String(ans))]).slice(0, 4);
}
function genArithmetic(l) {
  let r = ri(1, 10);
  if (l <= 2) {
    if (r < 6) {
      let a = ri(15, 99),
        b = ri(10, 79);
      return numberQ(`${a} + ${b}`, a + b);
    }
    let a = ri(3, 12),
      b = ri(3, 12);
    return numberQ(`${a} × ${b}`, a * b);
  }
  if (l <= 4) {
    if (r < 5) {
      let a = ri(13, 49),
        b = ri(3, 12);
      return numberQ(`${a} × ${b}`, a * b);
    }
    let p = pk([10, 20, 25, 50, 75]),
      b = ri(4, 20) * 20;
    return numberQ(`${p}% of ${b}`, b * p / 100);
  }
  if (l <= 6) {
    if (r < 5) {
      let a = ri(12, 29),
        b = ri(11, 19);
      return numberQ(`${a} × ${b}`, a * b);
    }
    let p = pk([5, 12.5, 15, 30, 40, 60]),
      b = ri(5, 50) * 20;
    return numberQ(`${p}% of ${b}`, b * p / 100);
  }
  if (l <= 8) {
    let p = pk([5, 10, 12, 15, 20, 25]),
      b = ri(5, 40) * 20,
      up = random() < .5,
      ans = Number((b * (up ? 1 + p / 100 : 1 - p / 100)).toFixed(6));
    return numberQ(`${b} ${up ? 'increased' : 'reduced'} by ${p}%`, ans);
  }
  if (r < 5) {
    let a = ri(4, 12),
      k = ri(3, 9),
      b = a * k,
      m = ri(2, 7);
    return numberQ(`${a} : ${b} = ${a * m} : ?`, b * m);
  }
  let start = ri(200, 1200),
    p1 = pk([5, 10, 15, 20]),
    p2 = pk([5, 10, 15]),
    ans = Number((start * (1 + p1 / 100) * (1 - p2 / 100)).toFixed(6));
  return numberQ(`${start} +${p1}% then −${p2}%`, ans, 'Apply both percentage changes in sequence.');
}
function roundSig(n) {
  let m = 10 ** Math.max(0, String(Math.round(n)).length - 3);
  return Math.round(n / m) * m;
}
function genEstimation(l) {
  let a = ri(50 + l * 60, 450 + l * 950),
    b = ri(7 + l, 18 + l * 7),
    truth = a * b,
    ans = roundSig(truth),
    delta = Math.max(.045, .29 - l * .023),
    set = new Set([ans]);
  while (set.size < 4) {
    let f = 1 + (random() < .5 ? -1 : 1) * (delta * .55 + random() * delta);
    set.add(roundSig(truth * f));
  }
  return choiceQ(`Estimate\n${a.toLocaleString()} × ${b}`, sh([...set]).map(String), String(ans), 'Choose the closest answer without fully calculating it.');
}
const NOUNS = ['analysts', 'pilots', 'engineers', 'traders', 'runners', 'builders', 'designers', 'drivers'];
function singular(x) {
  return x.endsWith('s') ? x.slice(0, -1) : x;
}
function genLogic(l) {
  let [A, B, C] = sh(NOUNS).slice(0, 3),
    X = pk(['Kel', 'Rav', 'Tam', 'Ori']),
    f = pk(l < 5 ? ['valid', 'contra', 'affirm', 'some'] : ['valid', 'contra', 'affirm', 'some', 'chain', 'break', 'double']),
    lines = [],
    concl = '',
    ans = '';
  if (f === 'valid') {
    lines = [`All ${A} are ${B}.`, `${X} is a ${singular(A)}.`];
    concl = `${X} is a ${singular(B)}.`;
    ans = 'MUST BE TRUE';
  }
  if (f === 'contra') {
    lines = [`No ${A} are ${B}.`, `${X} is a ${singular(A)}.`];
    concl = `${X} is a ${singular(B)}.`;
    ans = 'CANNOT BE TRUE';
  }
  if (f === 'affirm') {
    lines = [`All ${A} are ${B}.`, `${X} is a ${singular(B)}.`];
    concl = `${X} is a ${singular(A)}.`;
    ans = 'NOT ENOUGH INFO';
  }
  if (f === 'some') {
    lines = [`Some ${A} are ${B}.`, `${X} is a ${singular(A)}.`];
    concl = `${X} is a ${singular(B)}.`;
    ans = 'NOT ENOUGH INFO';
  }
  if (f === 'chain') {
    lines = [`All ${A} are ${B}.`, `All ${B} are ${C}.`, `${X} is a ${singular(A)}.`];
    concl = `${X} is a ${singular(C)}.`;
    ans = 'MUST BE TRUE';
  }
  if (f === 'break') {
    lines = [`All ${A} are ${B}.`, `All ${C} are ${B}.`, `${X} is a ${singular(A)}.`];
    concl = `${X} is a ${singular(C)}.`;
    ans = 'NOT ENOUGH INFO';
  }
  if (f === 'double') {
    lines = [`No ${A} are ${C}.`, `All ${B} are ${A}.`, `${X} is a ${singular(B)}.`];
    concl = `${X} is a ${singular(C)}.`;
    ans = 'CANNOT BE TRUE';
  }
  return choiceQ(lines.join('\n'), ['MUST BE TRUE', 'CANNOT BE TRUE', 'NOT ENOUGH INFO'], ans, `Conclusion: ${concl}`);
}
function genPatterns(l) {
  let kind = pk(l <= 3 ? ['arith', 'geo', 'alt'] : l <= 6 ? ['alt', 'inc', 'geo', 'fib'] : ['inc', 'fib', 'inter', 'alt2', 'square']),
    t = [];
  if (kind === 'arith') {
    let s = ri(2, 30),
      d = ri(3, 12);
    for (let i = 0; i < 6; i++) t.push(s + d * i);
  }
  if (kind === 'geo') {
    let s = ri(2, 6),
      r = pk([2, 3]);
    for (let i = 0; i < 6; i++) t.push(s * r ** i);
  }
  if (kind === 'alt') {
    let s = ri(3, 20),
      a = ri(3, 9),
      b = ri(2, 7);
    t = [s, s + a, s + a - b, s + 2 * a - b, s + 2 * a - 2 * b, s + 3 * a - 2 * b];
  }
  if (kind === 'inc') {
    let x = ri(2, 15),
      d = ri(2, 5);
    t = [x];
    for (let i = 0; i < 5; i++) {
      x += d + i;
      t.push(x);
    }
  }
  if (kind === 'fib') {
    let a = ri(1, 6),
      b = ri(2, 8);
    t = [a, b];
    for (let i = 2; i < 6; i++) t.push(t[i - 1] + t[i - 2]);
  }
  if (kind === 'inter') {
    let a = ri(2, 6),
      b = ri(15, 30),
      da = ri(2, 5),
      db = ri(3, 7);
    t = [a, b, a + da, b + db, a + 2 * da, b + 2 * db];
  }
  if (kind === 'alt2') {
    let x = ri(3, 9),
      m = pk([2, 3]),
      s = ri(1, 4);
    t = [x];
    for (let i = 1; i < 6; i++) {
      x = i % 2 ? x * m : x - s;
      t.push(x);
    }
  }
  if (kind === 'square') {
    let a = ri(1, 5),
      d = ri(1, 3);
    for (let i = 0; i < 6; i++) t.push((a + i * d) ** 2);
  }
  let ans = t[5],
    d = cl(Math.round(Math.abs(ans) * .15), 2, 50);
  return choiceQ(`${t.slice(0, 5).join('   ')}   ?`, opts(ans, [ans + d, ans - d, ans + 2 * d]), ans, 'Complete the sequence.');
}
function matrixToken(shape, filled, dir = '') {
  let o = ['○', '△', '□'],
    s = ['●', '▲', '■'],
    i = ['circle', 'tri', 'square'].indexOf(shape);
  return (filled ? s : o)[i] + dir;
}
function posToken(ix) {
  let z = [];
  for (let r = 0; r < 3; r++) {
    let row = '';
    for (let c = 0; c < 3; c++) row += r * 3 + c === ix ? '●' : '·';
    z.push(row);
  }
  return z.join('\n');
}
function xorKey(a, b) {
  return a.split('').map((x, i) => x === b[i] ? '0' : '1').join('');
}
function unionKey(a, b) {
  return a.split('').map((x, i) => x === '1' || b[i] === '1' ? '1' : '0').join('');
}
function subtractKey(a, b) {
  return a.split('').map((x, i) => x === '1' && b[i] === '0' ? '1' : '0').join('');
}
function rotateKey(key, n) {
  let a = key.split(''),
    o = Array(a.length).fill('0');
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) o[c * n + n - 1 - r] = a[r * n + c];
  return o.join('');
}
function mirrorKey(key, n) {
  let a = key.split(''),
    o = [];
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) o.push(a[r * n + n - 1 - c]);
  return o.join('');
}
function randomPattern(n, count) {
  let a = Array(n * n).fill('0');
  sh(Array.from({
    length: n * n
  }, (_, i) => i)).slice(0, count).forEach(i => a[i] = '1');
  return a.join('');
}
function mutateKey(k, n) {
  let a = k.split(''),
    on = [],
    off = [];
  a.forEach((x, i) => (x === '1' ? on : off).push(i));
  if (on.length && off.length) {
    let i = pk(on),
      j = pk(off);
    a[i] = '0';
    a[j] = '1';
  }
  return a.join('');
}
function applyMatrixRule(op, a, b) {
  if (op === 'union') return unionKey(a, b);
  if (op === 'subtract') return subtractKey(a, b);
  const key = xorKey(a, b);
  return op === 'xorRotate' ? rotateKey(key, 3) : key;
}
const MATRIX_RULES = ['xor', 'union', 'subtract', 'xorRotate'];
function matrixAmbiguous(cells) {
  const fits = MATRIX_RULES.filter(op => [0, 3].every(i => applyMatrixRule(op, cells[i], cells[i + 1]) === cells[i + 2]));
  return new Set(fits.map(op => applyMatrixRule(op, cells[6], cells[7]))).size !== 1;
}
function genMatrixGrid(l) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const op = pk(l >= 10 ? MATRIX_RULES : ['xor', 'union', 'subtract']),
      cells = [];
    for (let r = 0; r < 3; r++) {
      const a = randomPattern(3, ri(2, 5)),
        b = randomPattern(3, ri(2, 5));
      cells.push(a, b, applyMatrixRule(op, a, b));
    }
    if (matrixAmbiguous(cells)) continue;
    const answer = cells[8],
      options = new Set([answer]);
    for (const key of sh(MATRIX_RULES.map(o => applyMatrixRule(o, cells[6], cells[7])))) if (options.size < 4) options.add(key);
    for (let i = 0; options.size < 4 && i < 100; i++) options.add(randomPattern(3, ri(1, 7)));
    if (options.size < 4) continue;
    cells[8] = '?';
    return {
      kind: 'matrixGrid',
      n: 3,
      cells,
      answer,
      options: sh([...options]),
      sub: 'Infer how the first two tiles produce the third in each row.',
      meta: {
        rule: op
      }
    };
  }
  throw new Error('Could not generate an unambiguous matrix');
}
function genMatrix(l) {
  if (l >= 8 && random() < .62) return genMatrixGrid(l);
  let kind = pk(l <= 2 ? ['cycle', 'rotate'] : l <= 4 ? ['cycle', 'rotate', 'count', 'position'] : l <= 6 ? ['dual', 'rowsum', 'position', 'shapeDir'] : ['triple', 'rowsumDual', 'position2', 'shapeDir']),
    cells = [],
    answer,
    options = [],
    rule = '';
  if (kind === 'cycle') {
    let sy = sh(['●', '▲', '■']),
      off = ri(0, 2);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(sy[(r + c + off) % 3]);
    answer = cells[8];
    options = sy;
    rule = 'Shape cycles across rows and columns.';
  }
  if (kind === 'rotate') {
    let a = ['↑', '→', '↓', '←'],
      rs = l >= 4 ? pk([1, 2, 3]) : 1,
      cs = l >= 5 ? pk([1, 2, 3]) : 1,
      o = ri(0, 3);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(a[(o + r * rs + c * cs) % 4]);
    answer = cells[8];
    options = a;
    rule = 'Orientation changes by fixed row/column steps.';
  }
  if (kind === 'count') {
    let b = ri(1, 2),
      ra = pk([1, 2]),
      ca = pk([1, 2]);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push('●'.repeat(b + r * ra + c * ca));
    answer = cells[8];
    let n = answer.length;
    options = [n, n - 1, n + 1, Math.max(1, n - 2)].map(x => '●'.repeat(x));
    rule = 'Quantity changes across both axes.';
  }
  if (kind === 'position' || kind === 'position2') {
    let sr = kind === 'position2' ? pk([2, 4]) : 3,
      sc = kind === 'position2' ? pk([1, 2, 4]) : 1,
      o = ri(0, 8);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(posToken((o + r * sr + c * sc) % 9));
    answer = cells[8];
    options = [answer, ...sh(Array.from({
      length: 9
    }, (_, i) => posToken(i)).filter(x => x !== answer)).slice(0, 3)];
    rule = 'Dot position moves by separate row/column steps.';
  }
  if (kind === 'dual') {
    let shapes = ['circle', 'tri', 'square'],
      o = ri(0, 2);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(matrixToken(shapes[(o + r + c) % 3], (r + c) % 2 === 0));
    answer = cells[8];
    let pool = [];
    for (let x of shapes) for (let f of [false, true]) pool.push(matrixToken(x, f));
    options = [answer, ...sh(pool.filter(x => x !== answer)).slice(0, 3)];
    rule = 'Shape and fill state change independently.';
  }
  if (kind === 'rowsum' || kind === 'rowsumDual') {
    let vals = [];
    for (let r = 0; r < 3; r++) {
      let a = ri(1, 2),
        b = ri(1, 2);
      vals.push(a, b, a + b);
    }
    for (let i = 0; i < 9; i++) {
      let f = kind === 'rowsumDual' ? (Math.floor(i / 3) + i % 3) % 2 === 0 : true;
      cells.push((f ? '●' : '○').repeat(vals[i]));
    }
    answer = cells[8];
    let n = answer.length,
      ch = answer[0],
      other = ch === '●' ? '○' : '●';
    options = [answer, ch.repeat(Math.max(1, n - 1)), ch.repeat(n + 1), other.repeat(n)];
    rule = 'Third tile equals first + second; higher levels add fill parity.';
  }
  if (kind === 'shapeDir' || kind === 'triple') {
    let shapes = ['circle', 'tri', 'square'],
      dirs = ['↑', '→', '↓', '←'],
      o = ri(0, 2),
      d = ri(0, 3);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cells.push(matrixToken(shapes[(o + r + c) % 3], kind === 'triple' && (r + c) % 2 === 0, dirs[(d + r + 2 * c) % 4]));
    answer = cells[8];
    let pool = [];
    for (let x of shapes) for (let f of kind === 'triple' ? [false, true] : [false]) for (let dr of dirs) pool.push(matrixToken(x, f, dr));
    options = [answer, ...sh(pool.filter(x => x !== answer)).slice(0, 3)];
    rule = kind === 'triple' ? 'Three rules interact: shape, fill and direction.' : 'Shape and direction follow separate rules.';
  }
  cells[8] = '?';
  options = [...new Set(options)];
  while (options.length < 4) {
    let x = pk(['●', '▲', '■', '○', '△', '□', '↑', '→', '↓', '←']);
    if (!options.includes(x)) options.push(x);
  }
  return {
    kind: 'matrix',
    cells,
    answer,
    options: sh(options.slice(0, 4)),
    sub: l >= 7 ? 'Multiple simultaneous rules may be active.' : 'Choose the missing tile.',
    explain: rule
  };
}
function dihedralKeys(key, n) {
  const keys = [];
  let a = key;
  for (let i = 0; i < 4; i++) {
    keys.push(a, mirrorKey(a, n));
    a = rotateKey(a, n);
  }
  return [...new Set(keys)];
}
function genSpatial(l) {
  const n = l >= 7 ? 4 : 3,
    count = cl(3 + Math.floor(l / 3), 3, n * n - 3);
  let base;
  for (let i = 0; i < 200; i++) {
    base = randomPattern(n, count);
    if (dihedralKeys(base, n).length === 8) break;
  }
  if (dihedralKeys(base, n).length !== 8) throw new Error('Could not generate asymmetric spatial content');
  const ops = l <= 3 ? ['Rotate 90° clockwise', 'Rotate 180°'] : l <= 6 ? ['Rotate 90° clockwise', 'Rotate 180°', 'Rotate 270° clockwise', 'Mirror left ↔ right'] : ['Rotate 90° clockwise, then mirror', 'Rotate 180°, then mirror', 'Rotate 270° clockwise', 'Mirror left ↔ right'];
  const op = pk(ops);
  let answer = base;
  if (op.startsWith('Rotate 90')) answer = rotateKey(base, n);else if (op.startsWith('Rotate 180')) answer = rotateKey(rotateKey(base, n), n);else if (op.startsWith('Rotate 270')) answer = rotateKey(rotateKey(rotateKey(base, n), n), n);else answer = mirrorKey(base, n);
  if (op.includes('then mirror')) answer = mirrorKey(answer, n);
  return {
    kind: 'spatial',
    n,
    baseKey: base,
    answer,
    options: sh([answer, ...sh(dihedralKeys(base, n).filter(k => k !== answer)).slice(0, 3)]),
    sub: op
  };
}
function genVisualMemory(l) {
  let n = l >= 8 ? 5 : 4,
    count = cl(3 + Math.floor(l / 2), 3, n * n - 4),
    base = randomPattern(n, count),
    set = new Set([base]);
  while (set.size < 4) set.add(mutateKey(base, n));
  return {
    kind: 'visualmem',
    n,
    pattern: base,
    answer: base,
    options: sh([...set]),
    display: cl(2300 - l * 120, 950, 2300),
    sub: 'Memorise the highlighted cells.'
  };
}
function genProcessing(l) {
  let chars = (l >= 7 ? 'O0I1S5B8Z2G6Q9' : 'ABCDEFGHJKLMNPQRSTUVWXYZ234679').split(''),
    len = cl(4 + Math.floor(l / 2), 4, 9),
    a = Array.from({
      length: len
    }, () => pk(chars)).join(''),
    same = random() < .5,
    b = a;
  if (!same) {
    let i = ri(0, len - 1);
    b = a.slice(0, i) + pk(chars.filter(x => x !== a[i])) + a.slice(i + 1);
  }
  return choiceQ(`${a}\n${b}`, ['SAME', 'DIFFERENT'], same ? 'SAME' : 'DIFFERENT', l >= 7 ? 'Visually similar characters are used.' : 'Are the strings identical?');
}
function bfs(n, walls, start = 0, goal = n * n - 1) {
  let q = [[start, 0]],
    seen = new Set([start]),
    dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (q.length) {
    let [p, d] = q.shift();
    if (p === goal) return d;
    let r = Math.floor(p / n),
      c = p % n;
    for (let [dr, dc] of dirs) {
      let rr = r + dr,
        cc = c + dc,
        v = rr * n + cc;
      if (rr >= 0 && cc >= 0 && rr < n && cc < n && !walls.has(v) && !seen.has(v)) {
        seen.add(v);
        q.push([v, d + 1]);
      }
    }
  }
  return null;
}
function genPlanning(l) {
  const n = l >= 7 ? 6 : l >= 4 ? 5 : 4;
  for (let i = 0; i < 800; i++) {
    const start = ri(0, n * n - 1),
      goal = ri(0, n * n - 1),
      min = Math.abs(Math.floor(start / n) - Math.floor(goal / n)) + Math.abs(start % n - goal % n);
    if (min < Math.max(3, n - 1)) continue;
    const count = ri(Math.floor(n * n * .22), Math.floor(n * n * .4));
    const cells = Array.from({
      length: n * n
    }, (_, j) => j).filter(j => j !== start && j !== goal);
    const walls = new Set(sh(cells).slice(0, count)),
      dist = bfs(n, walls, start, goal);
    if (dist == null || dist < min + 2) continue;
    const distractors = Array.from({
      length: Math.floor((n * n - min) / 2)
    }, (_, j) => min + 2 * j).filter(x => x !== dist);
    if (distractors.length < 3) continue;
    return {
      kind: 'route',
      n,
      start,
      goal,
      walls: [...walls],
      answer: dist,
      options: sh([dist, ...sh(distractors).slice(0, 3)]),
      sub: 'Minimum moves from START to GOAL. Up, down, left or right; dark cells are blocked.'
    };
  }
  return {
    kind: 'route',
    n: 5,
    start: 0,
    goal: 24,
    walls: [19, 21, 16, 18, 6, 11, 7, 10],
    answer: 10,
    options: sh([8, 10, 12, 14]),
    sub: 'Minimum moves from START to GOAL. Up, down, left or right; dark cells are blocked.'
  };
}
const COLORS = [['RED', '#ff6666'], ['BLUE', '#6aa9ff'], ['GREEN', '#75d67a'], ['YELLOW', '#ffd85c']];
let stroopBag = [];
function resetStroop() {
  const inks = sh([...COLORS, ...COLORS]),
    congruent = new Set(sh([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 2));
  stroopBag = inks.map((ink, i) => {
    const word = congruent.has(i) ? ink : pk(COLORS.filter(c => c[0] !== ink[0]));
    return {
      kind: 'stroop',
      prompt: word[0],
      ink: ink[1],
      answer: ink[0],
      options: COLORS.map(c => c[0]),
      sub: 'Answer the INK colour. Ignore the word.',
      meta: {
        congruent: congruent.has(i)
      }
    };
  });
}
function genAttention() {
  if (!stroopBag.length) resetStroop();
  return stroopBag.shift();
}
function prime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
  return true;
}
function genFlex(l, prev) {
  let rules = l <= 3 ? ['parity', 'size'] : l <= 6 ? ['parity', 'size', 'div3'] : ['parity', 'size', 'div3', 'prime'],
    rule = prev && rules.includes(prev) && random() < .5 ? prev : pk(rules.filter(x => x !== prev)),
    v = ri(2, 30),
    ans,
    options,
    sub;
  if (rule === 'parity') {
    ans = v % 2 ? 'ODD' : 'EVEN';
    options = ['EVEN', 'ODD'];
    sub = 'RULE: EVEN or ODD';
  }
  if (rule === 'size') {
    ans = v > 15 ? 'HIGH' : 'LOW';
    options = ['HIGH', 'LOW'];
    sub = 'RULE: HIGH if >15, otherwise LOW';
  }
  if (rule === 'div3') {
    ans = v % 3 === 0 ? 'YES' : 'NO';
    options = ['YES', 'NO'];
    sub = 'RULE: divisible by 3?';
  }
  if (rule === 'prime') {
    ans = prime(v) ? 'PRIME' : 'NOT PRIME';
    options = ['PRIME', 'NOT PRIME'];
    sub = 'RULE: prime number?';
  }
  return choiceQ(String(v), options, ans, sub, {
    rule,
    switched: prev != null && rule !== prev
  });
}
function genMemory(l) {
  let len = cl(3 + Math.floor(l / 2), 3, 8),
    arr = Array.from({
      length: len
    }, () => ri(1, 9)),
    ans = [...arr].reverse().join('');
  return {
    kind: 'memory',
    prompt: arr.join('   '),
    answer: ans,
    sub: 'Memorise this sequence. You will enter it backwards.',
    display: cl(2700 - l * 130, 1200, 2700)
  };
}
const VERBAL_RELATIONS = [{
  kind: 'tool→action',
  pairs: [['knife', 'cut'], ['pen', 'write'], ['key', 'unlock'], ['brush', 'paint'], ['camera', 'photograph'], ['needle', 'sew'], ['hammer', 'strike'], ['scissors', 'snip'], ['broom', 'sweep'], ['thermometer', 'measure']]
}, {
  kind: 'profession→place',
  pairs: [['doctor', 'hospital'], ['teacher', 'school'], ['judge', 'court'], ['pilot', 'cockpit'], ['chef', 'kitchen'], ['farmer', 'field'], ['librarian', 'library'], ['mechanic', 'garage'], ['scientist', 'laboratory'], ['cashier', 'store']]
}, {
  kind: 'young→adult',
  pairs: [['calf', 'cow'], ['foal', 'horse'], ['kitten', 'cat'], ['puppy', 'dog'], ['chick', 'chicken'], ['cub', 'bear'], ['lamb', 'sheep'], ['duckling', 'duck'], ['fawn', 'deer'], ['joey', 'kangaroo']]
}, {
  kind: 'part→whole',
  pairs: [['wheel', 'car'], ['page', 'book'], ['branch', 'tree'], ['finger', 'hand'], ['petal', 'flower'], ['key', 'keyboard'], ['room', 'house'], ['chapter', 'novel'], ['engine', 'aircraft'], ['brick', 'wall']]
}, {
  kind: 'object→container',
  pairs: [['letter', 'envelope'], ['water', 'bottle'], ['soup', 'bowl'], ['money', 'wallet'], ['arrow', 'quiver'], ['clothes', 'wardrobe'], ['tool', 'toolbox'], ['food', 'fridge'], ['fuel', 'tank'], ['document', 'folder']]
}, {
  kind: 'instrument→measure',
  pairs: [['scale', 'weight'], ['clock', 'time'], ['speedometer', 'speed'], ['thermometer', 'temperature'], ['odometer', 'distance'], ['barometer', 'pressure'], ['voltmeter', 'voltage'], ['ammeter', 'current'], ['ruler', 'length'], ['compass', 'direction']]
}, {
  kind: 'cause→effect',
  pairs: [['heat', 'expansion'], ['friction', 'heat'], ['rain', 'flooding'], ['practice', 'improvement'], ['gravity', 'fall'], ['infection', 'fever'], ['drought', 'shortage'], ['collision', 'damage'], ['exercise', 'fatigue'], ['spark', 'ignition']]
}];
const VERBAL_CATEGORIES = {
  metals: ['copper', 'iron', 'silver', 'gold', 'zinc', 'tin'],
  birds: ['eagle', 'falcon', 'sparrow', 'robin', 'pigeon', 'owl'],
  tools: ['hammer', 'pliers', 'wrench', 'saw', 'drill', 'chisel'],
  fruits: ['apple', 'orange', 'pear', 'mango', 'peach', 'plum'],
  vehicles: ['car', 'train', 'truck', 'bus', 'boat', 'plane'],
  shapes: ['circle', 'square', 'triangle', 'oval', 'cube', 'sphere'],
  professions: ['doctor', 'teacher', 'pilot', 'chef', 'judge', 'farmer']
};
function genVerbal(l) {
  if (l >= 6 && random() < .35) {
    const cats = sh(Object.keys(VERBAL_CATEGORIES)).slice(0, 2),
      a = sh(VERBAL_CATEGORIES[cats[0]]).slice(0, 3),
      odd = pk(VERBAL_CATEGORIES[cats[1]]);
    return choiceQ('Which item does NOT belong?', sh([...a, odd]), odd, 'Three items share one category.');
  }
  const fam = pk(VERBAL_RELATIONS),
    pairs = sh(fam.pairs),
    [a, b] = pairs[0],
    [c, d] = pairs[1];
  const wrong = sh([...new Set(fam.pairs.map(p => p[1]))].filter(x => x !== b && x !== d)).slice(0, 3);
  const reverse = l >= 8 && random() < .35;
  return choiceQ(reverse ? `${b.toUpperCase()} : ${a.toUpperCase()}\n? : ${c.toUpperCase()}` : `${a.toUpperCase()} : ${b.toUpperCase()}\n${c.toUpperCase()} : ?`, sh([d, ...wrong]), d, 'Identify the relationship, then complete the analogy.', {
    family: fam.kind,
    reverse
  });
}
function mixedEV(p, gain, loss) {
  return p * gain - (1 - p) * loss;
}
function genStrategy(l) {
  for (let attempt = 0; attempt < 200; attempt++) {
    if (l >= 9 && random() < .45) {
      const prior = pk([.2, .3, .4, .5]),
        sens = pk([.7, .8, .9]),
        fp = pk([.1, .15, .2]),
        cost = pk([8, 12, 18]),
        gain = pk([120, 160, 220]),
        loss = pk([70, 100, 140]);
      const pp = prior * sens + (1 - prior) * fp,
        pn = 1 - pp;
      const act = mixedEV(prior, gain, loss),
        test = -cost + Math.max(0, prior * sens * gain - (1 - prior) * fp * loss) + Math.max(0, prior * (1 - sens) * gain - (1 - prior) * (1 - fp) * loss);
      const values = {
          'BUY INFORMATION': test,
          'ACT NOW': act,
          'DO NOTHING': 0
        },
        rank = Object.keys(values).sort((a, b) => values[b] - values[a]);
      if (Math.abs(values[rank[0]] - values[rank[1]]) < 1e-8) continue;
      return choiceQ(`Prior success chance: ${prior * 100}%\nGood outcome: +£${gain}; bad outcome: −£${loss}.\nTest cost: £${cost}; sensitivity ${sens * 100}%; false-positive rate ${fp * 100}%.`, sh(Object.keys(values)), rank[0], 'Maximise expected value. After the test, you may decide whether to act. Doing nothing pays £0.', {
        family: 'information',
        prior,
        sens,
        fp,
        cost,
        gain,
        loss,
        values
      });
    }
    const make = () => ({
      p: ri(3, 8) / 10,
      g: ri(8, 30) * 10,
      loss: l <= 3 ? 0 : ri(3, 24) * 10
    });
    const a = make(),
      b = make(),
      cap = l >= 7 && l <= 8 ? pk([60, 80, 100, 120]) : null;
    const values = {
      'OPTION A': cap != null && a.loss > cap ? -Infinity : mixedEV(a.p, a.g, a.loss),
      'OPTION B': cap != null && b.loss > cap ? -Infinity : mixedEV(b.p, b.g, b.loss)
    };
    if (l >= 7) values['DO NOTHING'] = 0;
    const rank = Object.keys(values).sort((x, y) => values[y] - values[x]);
    if (Math.abs(values[rank[0]] - values[rank[1]]) < 1e-8) continue;
    const text = (name, x) => `${name}: ${Math.round(x.p * 100)}% +£${x.g} / ${Math.round((1 - x.p) * 100)}% ${x.loss ? '−£' + x.loss : '£0'}`;
    return choiceQ(`${cap == null ? '' : `Maximum acceptable loss: £${cap}\n`}${text('A', a)}\n${text('B', b)}`, sh(Object.keys(values)), rank[0], `${cap == null ? '' : 'Respect the loss constraint. '}Choose the highest expected value.${l >= 7 ? ' Doing nothing pays £0.' : ''}`, {
      family: cap == null ? 'outcomes' : 'constraint',
      a,
      b,
      cap,
      values
    });
  }
  throw new Error('Could not generate a unique decision answer');
}
function gen(id, l, prev) {
  return ({
    arithmetic: genArithmetic,
    estimation: genEstimation,
    logic: genLogic,
    patterns: genPatterns,
    matrix: genMatrix,
    spatial: genSpatial,
    planning: genPlanning,
    attention: genAttention,
    processing: genProcessing,
    flexibility: x => genFlex(x, prev),
    memory: genMemory,
    visualmem: genVisualMemory,
    verbal: genVerbal,
    strategy: genStrategy
  }[id] || (() => null))(l);
}
function validResponse(q, r) {
  const text = String(r ?? '').trim();
  if (q.kind === 'number') return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text);
  if (q.kind === 'memory') return /^\d+$/.test(text);
  return text.length > 0;
}
function correct(q, r) {
  if (!validResponse(q, r)) return false;
  if (q.kind === 'number') return Math.abs(Number(String(r).replace(',', '.')) - Number(q.answer)) < 1e-8;
  return String(r).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
}
function timeLimit(id, l) {
  let base = {
    arithmetic: 22,
    estimation: 18,
    logic: 28,
    patterns: 22,
    matrix: 36,
    spatial: 29,
    planning: 31,
    attention: 2.8,
    processing: 2.3,
    flexibility: 4.2,
    memory: 12,
    visualmem: 15,
    verbal: 18,
    strategy: 24,
    dual: 18
  }[id] || 20;
  let floor = {
    arithmetic: 10,
    estimation: 9,
    logic: 16,
    patterns: 11,
    matrix: 24,
    spatial: 18,
    planning: 20,
    attention: 1.4,
    processing: 1.05,
    flexibility: 2.3,
    memory: 7,
    visualmem: 8,
    verbal: 10,
    strategy: 13,
    dual: 10
  }[id] || 8;
  return Math.max(floor, base - (l - 1) * (base - floor) / 9);
}
function score(acc, ms, l, id, extra = {}) {
  acc = cl(acc, 0, 1);
  const speed = ms > 0 ? cl(timeLimit(id, l) * 1000 * .55 / Math.max(250, ms), 0, 1) : 0;
  if (id === 'reflex') return cl(Math.round(acc * cl(100 - (Math.max(180, ms) - 180) * .22, 0, 100)), 0, 100);
  if (id === 'words') return cl(Math.round(acc * (85 + cl((70000 - ms) / 35000, 0, 1) * 15)), 0, 100);
  if (id === 'sustained') return cl(Math.round((extra.hitRate ?? acc) * (1 - (extra.commissionRate ?? 0)) * (90 + 10 * cl(1 - (extra.drift ?? 0) / 500, 0, 1))), 0, 100);
  if (id === 'dual') return cl(Math.round((.6 * (extra.recall ?? acc) + .4 * (extra.math ?? acc)) * (86 + 14 * speed)), 0, 100);
  return cl(Math.round(acc * (70 + 30 * speed)), 0, 100);
}
function stroopSummary(trials) {
  const group = congruent => trials.filter(t => t.question?.meta?.congruent === congruent && t.status !== 'interrupted');
  const c = group(true),
    i = group(false),
    cs = c.filter(t => t.correct),
    is = i.filter(t => t.correct);
  return {
    congruent: c.length,
    incongruent: i.length,
    congErr: c.length ? 1 - avg(c.map(t => t.correct ? 1 : 0)) : null,
    incongErr: i.length ? 1 - avg(i.map(t => t.correct ? 1 : 0)) : null,
    congMs: cs.length ? med(cs.map(t => t.ms)) : null,
    incongMs: is.length ? med(is.map(t => t.ms)) : null,
    interference: cs.length >= 2 && is.length >= 4 ? med(is.map(t => t.ms)) - med(cs.map(t => t.ms)) : null
  };
}
function stableAdapt(id, d, newResult) {
  // Reflex keeps a fixed measurement protocol; reaction improvement is shown directly.
  if (id === 'reflex') return d.level;
  const recent = [...(d.recent || []), newResult].filter(r => r.level === d.level && r.scoringVersion === SCORING_VERSION).slice(-3),
    last2 = recent.slice(-2);
  if (recent.length === 3 && avg(recent.map(r => r.acc)) >= .88) {
    const untimedSpeed = id === 'words' || id === 'sustained';
    if (untimedSpeed || recent.every(r => r.ms > 0) && avg(recent.map(r => r.ms / (timeLimit(id, r.level) * 1000))) <= .86) return cl(d.level + 1, 1, 10);
  }
  if (last2.length === 2 && avg(last2.map(r => r.acc)) < .65) return cl(d.level - 1, 1, 10);
  return d.level;
}
