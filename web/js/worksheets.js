/* LaunchPoint Education — Worksheet & Practice Builder.
   Math problems are generated procedurally (always correct answers, fresh
   numbers every time, three difficulty levels). Other subjects draw on the
   topic library; any topic can be written by the server when available. */

window.App = window.App || {};

(() => {
  /* ---------- Seeded randomness (so versions are reproducible) ---------- */
  const rng = (seed) => {
    let a = seed >>> 0;
    const next = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const R = (lo, hi) => lo + Math.floor(next() * (hi - lo + 1));
    const pick = (arr) => arr[Math.floor(next() * arr.length)];
    const shuffle = (arr) => { const a2 = arr.slice(); for (let i = a2.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a2[i], a2[j]] = [a2[j], a2[i]]; } return a2; };
    return { next, R, pick, shuffle };
  };
  const newSeed = () => Math.floor(Math.random() * 2 ** 31);

  /* ---------- Math helpers ---------- */
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const frac = (n, d) => {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; n /= g; d /= g;
    if (d === 1) return String(n);
    if (Math.abs(n) > d) { const w = Math.trunc(n / d), r = Math.abs(n % d); return `${w} ${r}/${d}`; }
    return `${n}/${d}`;
  };
  const fmt = (x) => (Number.isInteger(x) ? x.toLocaleString("en-US") : String(+x.toFixed(4)));
  const nDigit = (r, n) => r.R(10 ** (n - 1), 10 ** n - 1);
  const money = (x) => `$${x.toFixed(2)}`;
  const NAMES = ["Maya", "Liam", "Aisha", "Diego", "Noah", "Priya", "Kenji", "Zoe", "Omar", "Ava", "Mateo", "Grace", "Jamal", "Lucia", "Ethan", "Sofia"];
  const THINGS = ["stickers", "marbles", "books", "pencils", "apples", "trading cards", "shells", "cookies", "beads", "baseball cards"];

  /* Each skill: label, grade band [lo, hi], gen(r, d) → {q, a, wrong?, stack?}, optional word(r, d).
     d = difficulty: 0 = easier, 1 = on grade, 2 = challenge. */
  const SKILLS = {
    add_facts: { label: "Addition facts", g: [0, 2], gen(r, d) { const m = [10, 20, 100][d]; const a = r.R(0, m), b = r.R(0, m - a); return { q: `${a} + ${b} =`, a: a + b, stack: [a, b, "+"] }; },
      word(r, d) { const m = [10, 20, 60][d]; const n = r.pick(NAMES), t = r.pick(THINGS), a = r.R(1, m), b = r.R(1, m); return r.pick([{ q: `${n} has ${a} ${t}. A friend gives ${n} ${b} more. How many ${t} does ${n} have now?`, a: a + b }, { q: `There are ${a} kids on the playground. ${b} more kids come outside. How many kids are on the playground now?`, a: a + b }, { q: `${n} read ${a} pages on Monday and ${b} pages on Tuesday. How many pages did ${n} read in all?`, a: a + b }]); } },
    sub_facts: { label: "Subtraction facts", g: [0, 2], gen(r, d) { const m = [10, 20, 100][d]; const a = r.R(1, m), b = r.R(0, a); return { q: `${a} − ${b} =`, a: a - b, stack: [a, b, "−"] }; },
      word(r, d) { const m = [10, 20, 60][d]; const n = r.pick(NAMES), t = r.pick(THINGS), a = r.R(3, m), b = r.R(1, a); return r.pick([{ q: `${n} had ${a} ${t} and gave away ${b}. How many ${t} are left?`, a: a - b }, { q: `There were ${a} birds in a tree. ${b} flew away. How many birds are still in the tree?`, a: a - b }, { q: `${n} has ${a} ${t}. ${r.pick(NAMES)} has ${b}. How many more ${t} does ${n} have?`, a: a - b }]); } },
    add_multi: { label: "Multi-digit addition", g: [2, 4], gen(r, d) { const n = [2, 3, 4][d]; const a = nDigit(r, n), b = nDigit(r, n); return { q: `${fmt(a)} + ${fmt(b)} =`, a: a + b, stack: [a, b, "+"] }; },
      word(r, d) { const n = [2, 3, 4][d]; const a = nDigit(r, n), b = nDigit(r, n); const s = r.pick(["school library", "zoo", "fair", "museum"]); return { q: `On Saturday, ${fmt(a)} people visited the ${s}. On Sunday, ${fmt(b)} people visited. How many people visited in all?`, a: a + b }; } },
    sub_multi: { label: "Multi-digit subtraction", g: [2, 4], gen(r, d) { const n = [2, 3, 4][d]; let a = nDigit(r, n), b = nDigit(r, n); if (b > a) [a, b] = [b, a]; return { q: `${fmt(a)} − ${fmt(b)} =`, a: a - b, stack: [a, b, "−"] }; },
      word(r, d) { const n = [2, 3, 4][d]; let a = nDigit(r, n), b = nDigit(r, n); if (b > a) [a, b] = [b, a]; return { q: `A stadium has ${fmt(a)} seats. ${fmt(b)} seats are filled. How many seats are empty?`, a: a - b }; } },
    mult_facts: { label: "Multiplication facts", g: [3, 4], gen(r, d) { const m = [5, 10, 12][d]; const a = r.R(2, m), b = r.R(2, m); return { q: `${a} × ${b} =`, a: a * b, wrong: [a * b + a, a * b - b, a + b], stack: [a, b, "×"] }; },
      word(r, d) { const m = [5, 10, 12][d]; const a = r.R(2, m), b = r.R(2, m), t = r.pick(THINGS); return r.pick([{ q: `There are ${a} bags with ${b} ${t} in each bag. How many ${t} are there in all?`, a: a * b, wrong: [a + b, a * b + b] }, { q: `A classroom has ${a} rows of desks with ${b} desks in each row. How many desks are there?`, a: a * b, wrong: [a + b, a * b - a] }, { q: `Each pack has ${b} juice boxes. How many juice boxes are in ${a} packs?`, a: a * b, wrong: [a + b, a * b + a] }]); } },
    div_facts: { label: "Division facts", g: [3, 4], gen(r, d) { const m = [5, 10, 12][d]; const b = r.R(2, m), q = r.R(1, m); return { q: `${b * q} ÷ ${b} =`, a: q, wrong: [q + 1, b, q * 2] }; },
      word(r, d) { const m = [5, 10, 12][d]; const b = r.R(2, m), q = r.R(2, m), t = r.pick(THINGS); return r.pick([{ q: `${b * q} ${t} are shared equally among ${b} friends. How many ${t} does each friend get?`, a: q }, { q: `A teacher puts ${b * q} students into ${b} equal teams. How many students are on each team?`, a: q }, { q: `${b * q} cupcakes are packed in boxes of ${b}. How many boxes are filled?`, a: q }]); } },
    mult_multi: { label: "Multi-digit multiplication", g: [4, 6], gen(r, d) { const [x, y] = [[2, 1], [3, 1], [2, 2]][d]; const a = nDigit(r, x), b = y === 1 ? r.R(2, 9) : nDigit(r, y); return { q: `${fmt(a)} × ${fmt(b)} =`, a: a * b, stack: [a, b, "×"] }; },
      word(r, d) { const a = [r.R(12, 40), r.R(120, 400), r.R(24, 99)][d], b = [r.R(3, 9), r.R(3, 9), r.R(12, 40)][d]; return r.pick([{ q: `A school orders ${a} boxes of crayons. Each box has ${b} crayons. How many crayons is that?`, a: a * b }, { q: `A theater has ${a} rows with ${b} seats in each row. How many seats are there?`, a: a * b }, { q: `A bakery makes ${a} muffins each day. How many muffins does it make in ${b} days?`, a: a * b }]); } },
    long_div: { label: "Long division", g: [4, 6], gen(r, d) { const b = [r.R(2, 9), r.R(3, 9), r.R(11, 25)][d]; const q = [r.R(11, 30), r.R(40, 250), r.R(20, 99)][d]; const rem = d === 0 ? 0 : r.R(0, b - 1); const a = b * q + rem; return { q: `${fmt(a)} ÷ ${b} =`, a: rem ? `${q} R${rem}` : q, wrong: [`${q + 1}`, `${q} R${Math.min(b - 1, rem + 1)}`, `${q - 1} R${rem}`] }; },
      word(r, d) { const b = r.R(4, 9), q = r.R(12, 60), rem = r.R(1, b - 1); return r.pick([{ q: `${b * q + rem} students are going on a field trip. Each van holds ${b} students. How many vans are needed?`, a: q + 1, wrong: [q, `${q} R${rem}`] }, { q: `${b * q + rem} cookies are packed into boxes of ${b}. How many full boxes are there, and how many cookies are left over?`, a: `${q} boxes, ${rem} left over`, wrong: [`${q + 1} boxes, 0 left over`, `${q} boxes, ${b - rem} left over`] }, { q: `${b * q} books are shared equally on ${b} shelves. How many books go on each shelf?`, a: q, wrong: [q + 1, b * q - b] }]); } },
    place_value: { label: "Place value", g: [1, 4], gen(r, d) { const n = [3, 5, 7][d]; const num = nDigit(r, n); const s = String(num); const i = r.R(0, s.length - 1); const digit = +s[i]; const val = digit * 10 ** (s.length - 1 - i); if (!digit) return SKILLS.place_value.gen(r, d); return { q: `What is the value of the digit ${digit} in ${fmt(num)}?`, a: fmt(val), wrong: [fmt(digit), fmt(val * 10), fmt(Math.max(1, val / 10))] }; } },
    rounding: { label: "Rounding", g: [3, 4], gen(r, d) { const place = [10, 100, 1000][d]; const n = [r.R(11, 99), r.R(101, 999), r.R(1001, 99999)][d]; const a = Math.round(n / place) * place; return { q: `Round ${fmt(n)} to the nearest ${fmt(place)}.`, a: fmt(a), wrong: [fmt(Math.floor(n / place) * place === a ? a + place : Math.floor(n / place) * place), fmt(Math.round(n / (place / 10 || 1)) * (place / 10 || 1))] }; } },
    frac_equiv: { label: "Equivalent fractions", g: [3, 5], gen(r, d) { const b = r.R(2, [5, 8, 12][d]), a = r.R(1, b - 1), k = r.R(2, [3, 5, 9][d]); return { q: `${a}/${b} = ?/${b * k}`, a: a * k, wrong: [a + k, a * k + 1, b * k - a] }; } },
    frac_simplify: { label: "Simplifying fractions", g: [4, 6], gen(r, d) { const b = r.R(2, [6, 9, 12][d]), a = r.R(1, b - 1), k = r.R(2, [4, 6, 9][d]); return { q: `Write ${a * k}/${b * k} in simplest form.`, a: frac(a, b), wrong: [`${a * k}/${b}`, `${a}/${b * k}`, frac(a + 1, b + 1)] }; } },
    frac_compare: { label: "Comparing fractions", g: [3, 5], gen(r, d) { const b1 = r.R(2, [6, 10, 12][d]), b2 = d === 0 ? b1 : r.R(2, [6, 10, 12][d]); const a1 = r.R(1, b1 - 1), a2 = r.R(1, b2 - 1); const c = a1 * b2 - a2 * b1; return { q: `Compare: ${a1}/${b1} ___ ${a2}/${b2}  (write <, >, or =)`, a: c > 0 ? ">" : c < 0 ? "<" : "=", choices: [">", "<", "="] }; } },
    frac_add_like: { label: "Add & subtract fractions (like denominators)", g: [4, 5], gen(r, d) { const b = r.R(3, [8, 10, 12][d]); let a1 = r.R(1, b - 1), a2 = r.R(1, b - 1); const sub = r.next() < 0.4; if (sub && a2 > a1) [a1, a2] = [a2, a1]; return { q: `${a1}/${b} ${sub ? "−" : "+"} ${a2}/${b} =`, a: frac(sub ? a1 - a2 : a1 + a2, b), wrong: [`${sub ? a1 - a2 : a1 + a2}/${b * 2}`, frac((sub ? a1 - a2 : a1 + a2) + 1, b)] }; } },
    frac_add_unlike: { label: "Add & subtract fractions (unlike denominators)", g: [5, 6], gen(r, d) { const b1 = r.R(2, [4, 6, 10][d]), b2 = r.R(2, [4, 8, 12][d]); const a1 = r.R(1, b1 - 1), a2 = r.R(1, b2 - 1); const sub = r.next() < 0.4 && a1 * b2 > a2 * b1; const n = sub ? a1 * b2 - a2 * b1 : a1 * b2 + a2 * b1; return { q: `${a1}/${b1} ${sub ? "−" : "+"} ${a2}/${b2} =`, a: frac(n, b1 * b2), wrong: [`${sub ? a1 - a2 : a1 + a2}/${b1 + b2}`, frac(n + b1, b1 * b2)] }; } },
    frac_mult: { label: "Multiply fractions", g: [5, 6], gen(r, d) { const b1 = r.R(2, 9), b2 = r.R(2, 9), a1 = r.R(1, b1 - (d ? 0 : 1)), a2 = r.R(1, b2 + (d === 2 ? 4 : 0)); return { q: `${a1}/${b1} × ${a2}/${b2} =`, a: frac(a1 * a2, b1 * b2), wrong: [`${a1 * a2}/${b1 + b2}`, frac(a1 * b2, b1 * a2)] }; } },
    dec_add: { label: "Add & subtract decimals", g: [4, 6], gen(r, d) { const p = [1, 2, 2][d]; const a = r.R(10, [99, 999, 9999][d]) / 10 ** p, b = r.R(10, [99, 999, 9999][d]) / 10 ** p; const sub = r.next() < 0.5; const [x, y] = sub && b > a ? [b, a] : [a, b]; return { q: `${x.toFixed(p)} ${sub ? "−" : "+"} ${y.toFixed(p)} =`, a: (sub ? x - y : x + y).toFixed(p), stack: [x.toFixed(p), y.toFixed(p), sub ? "−" : "+"] }; },
      word(r, d) { const a = r.R(150, 999) / 100, b = r.R(150, 999) / 100; return { q: `A notebook costs ${money(a)} and a pen costs ${money(b)}. How much do they cost together?`, a: money(a + b) }; } },
    dec_mult: { label: "Multiply decimals", g: [5, 6], gen(r, d) { const a = r.R(11, [99, 99, 999][d]) / 10, b = [r.R(2, 9), r.R(11, 99) / 10, r.R(11, 99) / 10][d]; return { q: `${a} × ${b} =`, a: fmt(+(a * b).toFixed(3)), wrong: [fmt(+(a * b * 10).toFixed(3)), fmt(+(a * b / 10).toFixed(4))] }; } },
    area_perim: { label: "Area & perimeter", g: [3, 5], gen(r, d) { const l = r.R(2, [9, 15, 25][d]), w = r.R(2, [9, 12, 20][d]); const u = r.pick(["cm", "m", "in", "ft"]); const area = r.next() < 0.5; if (d === 2 && r.next() < 0.5) return { q: `A rectangle has an area of ${l * w} square ${u}. Its length is ${l} ${u}. What is its width?`, a: `${w} ${u}` }; return { q: `Find the ${area ? "area" : "perimeter"} of a rectangle that is ${l} ${u} long and ${w} ${u} wide.`, a: area ? `${l * w} sq ${u}` : `${2 * (l + w)} ${u}`, wrong: area ? [`${2 * (l + w)} sq ${u}`, `${l + w} sq ${u}`] : [`${l * w} ${u}`, `${l + w} ${u}`] }; },
      word(r, d) { const l = r.R(6, 20), w = r.R(4, 15); return { q: `A garden is ${l} feet long and ${w} feet wide. How much fencing is needed to go all the way around it?`, a: `${2 * (l + w)} ft`, wrong: [`${l * w} ft`, `${l + w} ft`] }; } },
    order_ops: { label: "Order of operations", g: [5, 7], gen(r, d) { const a = r.R(2, 12), b = r.R(2, 9), c = r.R(2, 9), e = r.R(1, 20); const forms = [[`${e} + ${b} × ${c}`, e + b * c, (e + b) * c], [`(${e} + ${b}) × ${c}`, (e + b) * c, e + b * c], [`${a * b} ÷ ${b} + ${c}`, a + c, a * b / (b + c)], [`${e} + ${b}² − ${c}`, e + b * b - c, (e + b) ** 2 - c]]; const f = r.pick(forms.slice(0, d + 2)); return { q: `${f[0]} =`, a: fmt(f[1]), wrong: [fmt(Math.round(f[2]))] }; } },
    integers: { label: "Add & subtract integers", g: [6, 7], gen(r, d) { const m = [10, 20, 50][d]; const a = r.R(-m, m), b = r.R(-m, m); const sub = r.next() < 0.5; const bs = b < 0 ? `(${b})` : b; return { q: `${a} ${sub ? "−" : "+"} ${bs} =`, a: sub ? a - b : a + b, wrong: [sub ? a + b : a - b, -(sub ? a - b : a + b)] }; } },
    unit_rate: { label: "Ratios & unit rates", g: [6, 7], gen(r, d) { const n = r.R(2, [6, 10, 15][d]), per = [r.R(2, 9), r.R(2, 15), r.R(15, 95) / 10][d]; const total = +(n * per).toFixed(2); const it = r.pick(["notebooks", "tickets", "pounds of apples", "bottles of water", "movie passes"]); return { q: `${n} ${it} cost ${money(total)}. What is the cost for 1?`, a: money(per), wrong: [money(total * n / 10), money(per + 1)] }; },
      word(r, d) { const mph = r.R(30, 70), h = r.R(2, 6), pages = r.R(12, 40), days = r.R(3, 7); return r.pick([{ q: `A car travels ${mph * h} miles in ${h} hours at a constant speed. How far does it travel in 1 hour?`, a: `${mph} miles`, wrong: [`${mph * h - h} miles`, `${mph + h} miles`] }, { q: `Omar read ${pages * days} pages in ${days} days, reading the same amount each day. How many pages did he read per day?`, a: `${pages} pages`, wrong: [`${pages * days - days} pages`, `${pages + days} pages`] }]); } },
    ratio_prop: { label: "Proportions", g: [6, 7], gen(r, d) { const a = r.R(1, 9), b = r.R(2, 12), k = r.R(2, [4, 8, 12][d]); return { q: `Solve: ${a}/${b} = x/${b * k}`, a: `x = ${a * k}`, wrong: [`x = ${a + k}`, `x = ${b * k - a}`] }; },
      word(r, d) { const a = r.R(2, 5), b = r.R(2, 4), k = r.R(2, 6); return { q: `A recipe uses ${a} cups of flour for ${b} batches of cookies. How many cups of flour are needed for ${b * k} batches?`, a: `${a * k} cups`, wrong: [`${a + k} cups`, `${a * b * k} cups`] }; } },
    percent_of: { label: "Percent of a number", g: [6, 7], gen(r, d) { const p = r.pick([[10, 25, 50], [10, 20, 25, 40, 75], [5, 15, 35, 60, 12.5]][d]); const n = r.R(2, 40) * (d === 2 ? 8 : 4); return { q: `What is ${p}% of ${n}?`, a: fmt(+(p * n / 100).toFixed(2)), wrong: [fmt(p * n / 10), fmt(n - p)] }; },
      word(r, d) { const price = r.R(4, 30) * 5, p = r.pick([10, 20, 25, 30]); const n = r.R(4, 10) * 5, s = r.pick([60, 80, 90]); return r.pick([{ q: `A jacket costs ${money(price)} and is ${p}% off. What is the sale price?`, a: money(price * (1 - p / 100)), wrong: [money(price * p / 100), money(price - p)] }, { q: `A test has ${n} questions. Maya got ${s}% correct. How many questions did she get right?`, a: fmt(n * s / 100), wrong: [fmt(n - s / 10), fmt(s)] }, { q: `A meal costs ${money(price)}. How much is a ${p}% tip?`, a: money(price * p / 100), wrong: [money(price * (1 + p / 100)), money(p)] }]); } },
    eq_one: { label: "One-step equations", g: [6, 7], gen(r, d) { const x = r.R(d === 2 ? -12 : 1, [12, 20, 25][d]), a = r.R(2, [9, 12, 15][d]); const f = r.pick([[`x + ${a} = ${x + a}`], [`x − ${a} = ${x - a}`], [`${a}x = ${a * x}`], [`x ÷ ${a} = ${x}`, x * a]]); const ans = f[1] !== undefined ? f[1] : x; return { q: `Solve: ${f[0]}`, a: `x = ${ans}`, wrong: [`x = ${ans + a}`, `x = ${ans - a}`, `x = ${a}`] }; } },
    eq_two: { label: "Two-step equations", g: [7, 8], gen(r, d) { const x = r.R(d === 2 ? -10 : 1, [10, 15, 20][d]), a = r.R(2, [6, 9, 12][d]), b = r.R(1, 20); const minus = r.next() < 0.4; return { q: `Solve: ${a}x ${minus ? "−" : "+"} ${b} = ${a * x + (minus ? -b : b)}`, a: `x = ${x}`, wrong: [`x = ${x + 1}`, `x = ${(a * x + (minus ? -b : b) + (minus ? -b : b)) / a}`.replace(/\.\d+$/, ""), `x = ${-x}`] }; },
      word(r, d) { const x = r.R(3, 15), fee = r.R(5, 20), per = r.R(4, 12); return { q: `A gym charges a $${fee} sign-up fee plus $${per} per class. Jordan paid $${fee + per * x}. Write and solve an equation to find how many classes Jordan took.`, a: `${per}c + ${fee} = ${fee + per * x}; c = ${x} classes` }; } },
  };
  App.MATH_SKILLS = SKILLS;

  // Library math topics → default skills
  const TOPIC_SKILLS = {
    "Fractions: equivalent fractions": ["frac_equiv", "frac_simplify", "frac_compare"],
    "Ratios & proportional relationships": ["unit_rate", "ratio_prop", "percent_of"],
    "Area & perimeter": ["area_perim"],
    "Solving one-step & two-step equations": ["eq_one", "eq_two"],
    "Place value & rounding": ["place_value", "rounding"],
  };
  App.defaultSkills = (grade, topic) => {
    if (TOPIC_SKILLS[topic]) return TOPIC_SKILLS[topic].slice();
    const g = grade === "K" ? 0 : +grade;
    const fits = Object.entries(SKILLS).filter(([, s]) => g >= s.g[0] && g <= s.g[1]).map(([k]) => k);
    return fits.slice(0, 2);
  };
  App.skillsForGrade = (grade) => {
    const g = grade === "K" ? 0 : +grade;
    return Object.entries(SKILLS).filter(([, s]) => g >= s.g[0] - 1 && g <= s.g[1] + 1);
  };

  const uniq = (arr) => [...new Set(arr.map(String))];
  const numericWrong = (r, a) => {
    const str = String(a); const m = str.match(/-?\d[\d,]*(\.\d+)?/);
    if (!m) return [];
    const n = parseFloat(m[0].replace(/,/g, "")); if (!isFinite(n)) return [];
    const dec = (m[1] || "").length - (m[1] ? 1 : 0);
    const mk = (x) => str.slice(0, m.index) + (dec ? x.toFixed(dec) : fmt(Math.round(x))) + str.slice(m.index + m[0].length);
    return [mk(n + 1), mk(n - 1), mk(n + 10), mk(n * 2), mk(n + r.R(2, 5)), mk(n - r.R(2, 5))];
  };
  const mcChoices = (r, answer, wrong, fixed) => {
    if (fixed) return fixed.slice();
    const pool = uniq([...(wrong || []), ...numericWrong(r, answer)]).filter((w) => w !== String(answer) && w !== "NaN" && !/undefined/.test(w));
    return r.shuffle([String(answer), ...r.shuffle(pool).slice(0, 3)]);
  };

  /* ---------- Build a math worksheet ---------- */
  function buildMath(o, seed, level) {
    const r = rng(seed);
    const skills = (o.skills && o.skills.length ? o.skills : App.defaultSkills(o.grade, o.topic)).filter((k) => SKILLS[k]);
    const formats = o.types.length ? o.types : ["compute"];
    const out = [];
    for (let i = 0; i < o.count; i++) {
      const fmtType = formats[i % formats.length];
      let key = skills[i % skills.length];
      let p;
      if (fmtType === "word") {
        const withWord = skills.filter((k) => SKILLS[k].word);
        if (withWord.length) key = withWord[i % withWord.length];
        p = (SKILLS[key].word || SKILLS[key].gen)(r, level);
      } else p = SKILLS[key].gen(r, level);
      const prob = { id: App.uid(), skill: key, q: p.q, a: String(p.a), stack: p.stack || null };
      if (fmtType === "mc") { prob.type = "mc"; prob.choices = mcChoices(r, p.a, p.wrong, p.choices); }
      else if (fmtType === "word") { prob.type = "word"; }
      else if (fmtType === "work") { prob.type = "work"; }
      else prob.type = "compute";
      out.push(prob);
    }
    return out;
  }

  /* ---------- Build from the topic library (non-math, or math concepts) ---------- */
  function topicData(o) {
    const found = App.findTopic(o.subject, o.topic);
    if (found) return found;
    return null;
  }
  function buildTopic(o, seed) {
    const r = rng(seed);
    const data = topicData(o);
    const t = o.topic || "this topic";
    if (!data) {
      // Template for custom topics without the generation server.
      return [
        { id: App.uid(), type: "short", q: `In your own words, what is ${t}?`, a: "Answers vary." },
        { id: App.uid(), type: "short", q: `List three important facts about ${t}.`, a: "Answers vary." },
        { id: App.uid(), type: "fill", q: `✏️ Write a key sentence about ${t} with one important word replaced by ______.`, a: "✏️" },
        { id: App.uid(), type: "mc", q: `✏️ Write a multiple-choice question about ${t}.`, choices: ["✏️ correct answer", "✏️ choice", "✏️ choice", "✏️ choice"], a: "✏️ correct answer" },
        { id: App.uid(), type: "work", q: `Explain why ${t} matters. Use at least one example.`, a: "Answers vary." },
      ].slice(0, Math.max(1, o.count));
    }
    const subj = App.SUBJECTS[o.subject];
    const otherAnswers = Object.values(subj.topics).flatMap((x) => x.qs.map((q) => q[1])).filter((a) => a.length < 90);
    const otherDefs = Object.values(subj.topics).flatMap((x) => x.vocab.map((v) => v[1]));
    const gens = {
      mc: [
        ...data.qs.map(([q, a]) => () => ({ q, a, choices: r.shuffle([a, ...r.shuffle(otherAnswers.filter((x) => x !== a)).slice(0, 3)]) })),
        ...data.vocab.map(([term, def]) => () => ({ q: `What does "${term}" mean?`, a: def, choices: r.shuffle([def, ...r.shuffle(otherDefs.filter((x) => x !== def)).slice(0, 3)]) })),
      ],
      short: data.qs.map(([q, a]) => () => ({ q, a })),
      fill: [
        ...data.vocab.map(([term, def]) => () => ({ q: `______ : ${def}`, a: term })),
        ...data.ideas.flatMap((idea) => data.vocab.filter(([term]) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(idea)).slice(0, 1).map(([term]) => () => ({ q: idea.replace(new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), "______"), a: term }))),
      ],
      tf: data.vocab.map(([term, def], i) => () => {
        const lie = r.next() < 0.5 && data.vocab.length > 1;
        const other = data.vocab[(i + 1 + r.R(0, data.vocab.length - 2)) % data.vocab.length];
        return lie ? { q: `"${term}" means ${other[1]}.`, a: "False", fix: `"${term}" means ${def}.` } : { q: `"${term}" means ${def}.`, a: "True" };
      }),
      work: [
        ...data.qs.filter(([q]) => /explain|why|how|draw|write|model/i.test(q)).map(([q, a]) => () => ({ q, a })),
        () => ({ q: `Explain one big idea about ${t} in 3–4 sentences. Use at least two vocabulary words.`, a: "Answers vary — look for accurate use of vocabulary." }),
        () => ({ q: `Connect ${t} to your own life or a real-world example. Explain your thinking.`, a: "Answers vary." }),
      ],
      word: data.qs.map(([q, a]) => () => ({ q, a })),
    };
    const types = o.types.filter((ty) => ty !== "match" && ty !== "compute");
    const out = [];
    if (o.types.includes("match")) out.push({ id: App.uid(), type: "match", q: "Match each word to its meaning.", pairs: data.vocab.slice(0, 8).map(([t2, d2]) => ({ term: t2, def: d2 })), a: "" });
    const use = types.length ? types : ["mc", "short"];
    const pools = Object.fromEntries(use.map((ty) => [ty, r.shuffle(gens[ty] || gens.short)]));
    const seen = new Set();
    let guard = 0;
    while (out.filter((p) => p.type !== "match").length < o.count && guard++ < o.count * 6) {
      const ty = use[out.length % use.length];
      const pool = pools[ty];
      if (!pool.length) { pools[ty] = r.shuffle(gens[ty] || gens.short); continue; }
      const p = pool.pop()();
      const qk = p.q.replace(/^What does "(.*)" mean\?$/, "$1").toLowerCase(); if (seen.has(qk)) continue;
      seen.add(qk);
      out.push({ id: App.uid(), type: ty === "word" ? "short" : ty, ...p });
    }
    return out;
  }

  const mathTitle = (skills) => { const ls = (skills || []).map((k) => (SKILLS[k] || {}).label).filter(Boolean); return ls.length ? `${ls.slice(0, 2).join(" & ")}${ls.length > 2 ? " & more" : ""} — Practice` : "Math Practice"; };

  /* ---------- Public builder ---------- */
  App.buildWorksheet = (o) => {
    const seed = o.seed || newSeed();
    const isMath = o.subject === "math" && (o.skills && o.skills.length || !App.findTopic(o.subject, o.topic) || TOPIC_SKILLS[o.topic]);
    const levels = o.leveled ? [0, 1, 2] : [o.difficulty];
    const versions = [];
    const nVersions = o.leveled ? 3 : Math.max(1, Math.min(4, +o.versions || 1));
    for (let v = 0; v < nVersions; v++) {
      const level = o.leveled ? levels[v] : o.difficulty;
      const s = seed + v * 7919;
      versions.push({
        id: App.uid(),
        label: o.leveled ? ["Level 1 · Support", "Level 2 · On grade", "Level 3 · Challenge"][v] : nVersions > 1 ? `Version ${"ABCD"[v]}` : "",
        problems: isMath ? buildMath(o, s, level) : buildTopic(o, s),
      });
    }
    return {
      id: App.uid(),
      createdAt: new Date().toISOString(),
      title: o.title || (isMath && !TOPIC_SKILLS[o.topic] ? mathTitle(o.skills) : `${o.topic || "Practice"} — Practice`),
      subject: o.subject, subjectLabel: App.SUBJECTS[o.subject].label, grade: o.grade, topic: o.topic,
      instructions: o.instructions || (isMath ? "Solve each problem. Show your work." : "Read each question carefully and answer in complete sentences where needed."),
      seed, opts: o, versions, source: isMath ? "math" : App.findTopic(o.subject, o.topic) ? "library" : "template",
    };
  };

  App.regenerateProblem = (ws, vIdx, pIdx) => {
    const o = ws.opts; const v = ws.versions[vIdx]; const old = v.problems[pIdx];
    const level = o.leveled ? vIdx : o.difficulty;
    if (old.skill && SKILLS[old.skill]) {
      const r = rng(newSeed());
      const p = old.type === "word" && SKILLS[old.skill].word ? SKILLS[old.skill].word(r, level) : SKILLS[old.skill].gen(r, level);
      v.problems[pIdx] = { ...old, q: p.q, a: String(p.a), stack: p.stack || null, choices: old.type === "mc" ? mcChoices(r, p.a, p.wrong, p.choices) : undefined };
    } else {
      const fresh = buildTopic({ ...o, types: [old.type], count: 6 }, newSeed()).filter((p) => p.type === old.type && p.q !== old.q);
      if (fresh.length) v.problems[pIdx] = fresh[0];
    }
  };

  /* Normalize problems returned by the server. */
  App.normalizeWorksheetProblems = (list) => (Array.isArray(list) ? list : []).map((p) => {
    const type = ["mc", "short", "fill", "tf", "match", "work", "word", "compute"].includes(p.type) ? p.type : "short";
    const out = { id: App.uid(), type, q: String(p.question || p.q || ""), a: String(p.answer || p.a || "") };
    if (type === "mc") out.choices = (p.choices || []).map(String).slice(0, 5);
    if (type === "match") out.pairs = (p.pairs || []).map((x) => ({ term: String(x.term || ""), def: String(x.def || x.definition || "") }));
    if (p.explanation) out.explain = String(p.explanation);
    return out;
  });

  App.WS_TYPES = {
    compute: { label: "Answer blank", math: true, hint: "Classic practice: problem = ____" },
    word: { label: "Word problems", math: true, hint: "Real-world story problems" },
    mc: { label: "Multiple choice", hint: "4 choices, A–D" },
    short: { label: "Short answer", hint: "Answer on lines" },
    fill: { label: "Fill in the blank", hint: "Key terms left blank" },
    tf: { label: "True / False", hint: "Circle T or F" },
    match: { label: "Vocabulary matching", hint: "Words to meanings" },
    work: { label: "Show your work / explain", hint: "Space to work or write" },
  };

  /* ---------- Exports ---------- */
  const slug = (s) => (s || "worksheet").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const gradeLabel = (g) => (g === "K" ? "Kindergarten" : `Grade ${g}`);
  const letters = "ABCDEFGH";

  function matchOrder(p) { // deterministic shuffle of definitions for matching
    const r = rng(p.pairs.length * 31 + p.pairs.map((x) => x.def.length).reduce((a, b) => a + b, 0));
    const order = r.shuffle(p.pairs.map((_, i) => i));
    for (let i = 0; i < order.length; i++) if (order[i] === i && order.length > 1) { const j = (i + 1) % order.length; [order[i], order[j]] = [order[j], order[i]]; }
    return order;
  }
  App.worksheetAnswer = (p) => {
    if (p.type === "match") { const ord = matchOrder(p); return p.pairs.map((_, i) => `${i + 1}-${letters[ord.indexOf(i)]}`).join(", "); }
    if (p.type === "mc") { const i = (p.choices || []).indexOf(p.a); return i >= 0 ? `${letters[i]}. ${p.a}` : p.a; }
    if (p.type === "tf") return p.a + (p.fix ? ` (${p.fix})` : "");
    return p.a;
  };

  App.exportWorksheetPdf = async (ws, { key = true, large = false, columns = 2 } = {}) => {
    await App.loadLib("jspdf");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const W = 612, M = 50, CW = W - 2 * M, BOT = 792 - 50;
    const safe = (s) => String(s).replace(/[✏️]/g, "").replace(/[–—]/g, "-").replace(/−/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...").replace(/²/g, "^2").replace(/₂/g, "2").replace(/→/g, "->").replace(/[^\x00-\xFF•]/g, "");
    const fs = large ? 15 : 12;
    let y = M;
    const setF = (size, style = "normal", color = [25, 25, 35]) => { doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...color); };
    const need = (h) => { if (y + h > BOT) { doc.addPage(); y = M; return true; } return false; };
    const para = (s, x, w, size = fs, style = "normal") => { setF(size, style); const lines = doc.splitTextToSize(safe(s), w); lines.forEach((ln) => { doc.text(ln, x, y + size); y += size * 1.3; }); return lines.length; };
    const lines = (n, x = M + 18) => { doc.setDrawColor(190); for (let k = 0; k < n; k++) { y += large ? 30 : 24; doc.line(x, y, W - M, y); } y += 8; };

    const header = (v) => {
      setF(19, "bold", [15, 27, 61]); doc.splitTextToSize(safe(ws.title), CW).forEach((ln) => { doc.text(ln, M, y + 18); y += 24; });
      y += 4; setF(10, "normal", [100, 100, 120]); doc.text(safe(`${ws.subjectLabel} · ${gradeLabel(ws.grade)}`), M, y + 10);
      if (v.label) { setF(10, "bold", [255, 107, 44]); doc.text(safe(v.label.toUpperCase()), W - M, y + 10, { align: "right" }); }
      y += 22;
      setF(11); doc.setTextColor(40); doc.text("Name: ______________________________", M, y + 10); doc.text("Date: ____________", M + 290, y + 10); doc.text("Score: ______", W - M - 80, y + 10); y += 24;
      doc.setDrawColor(255, 107, 44); doc.setLineWidth(1.5); doc.line(M, y, W - M, y); doc.setLineWidth(0.5); y += 12;
      para(ws.instructions, M, CW, fs - 1, "italic"); y += 8;
    };

    const stacked = (p, x, colW, num) => {
      const [a, b, op] = p.stack; const sz = large ? 22 : 18; setF(sz, "normal");
      const right = x + Math.min(colW - 30, 150); setF(10, "bold", [120, 120, 140]); doc.text(`${num}.`, x, y + 14);
      setF(sz); doc.setTextColor(20);
      doc.text(safe(typeof a === "number" ? fmt(a) : a), right, y + sz, { align: "right" });
      doc.text(safe(`${op} ${typeof b === "number" ? fmt(b) : b}`), right, y + sz * 2.1, { align: "right" });
      doc.setDrawColor(40); doc.setLineWidth(1.2); doc.line(right - (Math.max(String(a).length, String(b).length + 2) * sz * 0.6), y + sz * 2.4, right + 2, y + sz * 2.4); doc.setLineWidth(0.5);
      return sz * 2.4 + (large ? 44 : 36);
    };

    const renderVersion = (v) => {
      header(v);
      const probs = v.problems;
      const drill = probs.length && probs.every((p) => p.type === "compute");
      if (drill) {
        const cols = Math.max(1, Math.min(4, columns)); const colW = CW / cols;
        const useStack = ws.opts.stacked && probs.some((p) => p.stack);
        for (let i = 0; i < probs.length; i += cols) {
          const rowH = useStack ? (large ? 22 : 18) * 2.4 + (large ? 44 : 36) : (large ? 46 : 38);
          need(rowH);
          probs.slice(i, i + cols).forEach((p, j) => {
            const x = M + j * colW;
            const saveY = y;
            if (useStack && p.stack) stacked(p, x, colW, i + j + 1);
            else { setF(10, "bold", [120, 120, 140]); doc.text(`${i + j + 1}.`, x, y + fs); setF(fs + 1); doc.setTextColor(20); const txt = safe(p.q); doc.text(txt, x + 22, y + fs); const tw = doc.getTextWidth(txt); doc.setDrawColor(150); doc.line(x + 26 + tw, y + fs + 2, x + colW - 12, y + fs + 2); }
            y = saveY;
          });
          y += rowH;
        }
        return;
      }
      probs.forEach((p, i) => {
        const n = i + 1;
        need(p.type === "work" ? 150 : p.type === "match" ? 60 + p.pairs.length * 34 : 70);
        setF(fs, "bold", [15, 27, 61]); doc.text(`${n}.`, M, y + fs);
        const x = M + 22, w = CW - 22;
        if (p.type === "tf") { para(p.q, x, w - 70); setF(fs, "bold"); doc.text("T     F", W - M - 50, y - 4); y += 10; return; }
        if (p.type === "match") {
          para(p.q, x, w); y += 6; const ord = matchOrder(p); const startY = y;
          p.pairs.forEach((pr, k) => { setF(fs); doc.text(safe(`____ ${k + 1}. ${pr.term}`), x, y + fs); y += fs * 2.2; });
          let y2 = startY; ord.forEach((pi, k) => { setF(fs - 1); const ls = doc.splitTextToSize(safe(`${letters[k]}. ${p.pairs[pi].def}`), w * 0.58); ls.forEach((ln, li) => doc.text(ln, x + w * 0.4, y2 + fs + li * (fs * 1.2))); y2 += Math.max(fs * 2.2, ls.length * fs * 1.2 + 6); });
          y = Math.max(y, y2) + 10; return;
        }
        para(p.q, x, w);
        if (p.type === "mc") {
          y += 2; (p.choices || []).forEach((c, k) => { need(fs * 1.6); para(`${letters[k]}.  ${c}`, x + 12, w - 12, fs - 0.5); });
          y += 10; return;
        }
        if (p.type === "fill" || p.type === "compute") { if (p.type === "compute") { setF(fs); doc.setDrawColor(150); doc.line(x + 4, y + 10, x + 180, y + 10); y += 24; } else y += 12; return; }
        if (p.type === "work" || p.type === "word") { if (ws.subject === "math") { doc.setDrawColor(200); const h = p.type === "work" ? 110 : 80; need(h + 30); doc.roundedRect(x, y + 4, w, h, 6, 6); y += h + 10; setF(fs); doc.text("Answer: ____________________", x, y + fs); y += fs + 16; } else lines(p.type === "work" ? 5 : 3, x); return; }
        lines(large ? 2 : 2, x);
      });
    };

    ws.versions.forEach((v, vi) => { if (vi) { doc.addPage(); y = M; } renderVersion(v); });
    if (key) {
      ws.versions.forEach((v) => {
        doc.addPage(); y = M;
        setF(16, "bold", [15, 27, 61]); doc.text(safe(`Answer key${v.label ? " - " + v.label : ""}`), M, y + 16); y += 26;
        setF(10, "normal", [100, 100, 120]); doc.text(safe(ws.title), M, y + 10); y += 22;
        v.problems.forEach((p, i) => { need(30); para(`${i + 1}.  ${App.worksheetAnswer(p)}`, M, CW, 11); y += 3; });
      });
    }
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) { doc.setPage(i); setF(8, "normal", [160, 160, 170]); doc.text(safe(`${ws.title} · LaunchPoint Education`), M, 780); doc.text(`${i}/${pages}`, W - M, 780, { align: "right" }); }
    doc.save(`${slug(ws.title)}.pdf`);
  };

  App.exportWorksheetDocx = async (ws, { key = true } = {}) => {
    await App.loadLib("docx");
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, Table, TableRow, TableCell, WidthType } = window.docx;
    const P = (text, o = {}) => new Paragraph({ spacing: { after: o.after ?? 120 }, indent: o.indent ? { left: o.indent } : undefined, children: [new TextRun({ text, bold: o.bold, italics: o.italic, size: o.size })] });
    const blank = (n) => Array.from({ length: n }, () => P("_______________________________________________________________", { after: 200 }));
    const children = [];
    ws.versions.forEach((v, vi) => {
      if (vi) children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(ws.title + (v.label ? ` (${v.label})` : ""))] }));
      children.push(P(`${ws.subjectLabel} · ${gradeLabel(ws.grade)}`, { italic: true }));
      children.push(P("Name: ______________________    Date: ____________    Score: ______"));
      children.push(P(ws.instructions, { italic: true, after: 240 }));
      v.problems.forEach((p, i) => {
        if (p.type === "match") {
          children.push(P(`${i + 1}. ${p.q}`, { bold: true }));
          const ord = matchOrder(p);
          children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: p.pairs.map((pr, k) => new TableRow({ children: [new TableCell({ children: [P(`____ ${k + 1}. ${pr.term}`)] }), new TableCell({ children: [P(`${letters[k]}. ${p.pairs[ord[k]].def}`)] })] })) }));
          children.push(P("", { after: 200 }));
          return;
        }
        children.push(P(`${i + 1}. ${p.q}${p.type === "tf" ? "      T     F" : ""}`, { bold: true }));
        if (p.type === "mc") (p.choices || []).forEach((c, k) => children.push(P(`${letters[k]}. ${c}`, { indent: 400, after: 60 })));
        else if (p.type === "compute" || p.type === "fill" || p.type === "tf") children.push(P("", { after: 120 }));
        else children.push(...blank(p.type === "work" ? 4 : 2));
      });
    });
    if (key) ws.versions.forEach((v) => {
      children.push(new Paragraph({ children: [new PageBreak()] }));
      children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(`Answer key${v.label ? " — " + v.label : ""}`)] }));
      v.problems.forEach((p, i) => children.push(P(`${i + 1}. ${App.worksheetAnswer(p)}`)));
    });
    const d = new Document({ creator: App.BRAND.name, title: ws.title, sections: [{ children }] });
    App.download(await Packer.toBlob(d), `${slug(ws.title)}.docx`);
  };

  App.exportWorksheetQuiz = (ws) => {
    const cell = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const rows = [["Question", "Answer 1", "Answer 2", "Answer 3", "Answer 4", "Correct answer", "Time limit (sec)"]];
    const r = rng(ws.seed);
    ws.versions[0].problems.forEach((p) => {
      if (p.type === "match") return;
      let choices = p.type === "mc" ? (p.choices || []).slice(0, 4) : p.type === "tf" ? ["True", "False"] : mcChoices(r, p.a, [], null).slice(0, 4);
      if (!choices.includes(p.a)) choices = [p.a, ...choices.slice(0, 3)];
      while (choices.length < 2) choices.push("—");
      rows.push([p.q, ...[0, 1, 2, 3].map((k) => choices[k] || ""), choices.indexOf(p.a) + 1, 30]);
    });
    App.download(new Blob([rows.map((x) => x.map(cell).join(",")).join("\n")], { type: "text/csv" }), `${slug(ws.title)}-quiz.csv`);
  };

  App.exportWorksheetFlashcards = (ws) => {
    const body = ws.versions[0].problems.flatMap((p) => (p.type === "match" ? p.pairs.map((x) => `${x.term}\t${x.def}`) : [`${p.q}\t${App.worksheetAnswer(p)}`])).join("\n");
    App.download(new Blob([body], { type: "text/plain" }), `${slug(ws.title)}-flashcards.txt`);
  };
})();
