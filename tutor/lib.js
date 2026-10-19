// Shared helpers for running answer files through mongosh and comparing results.
const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const acorn = require('acorn');

const ROOT = path.resolve(__dirname, '..');
const HOST = 'mongodb://localhost:27018';
const uri = (dbName) => `${HOST}/${dbName}?directConnection=true`;
const MARKER = '__TUTOR_RESULT__';

const EXERCISES = JSON.parse(fs.readFileSync(path.join(__dirname, 'exercises.json'), 'utf8'));

// "1/3", "01/03", "01-find-basics/03" -> "01-find-basics/03"
function resolveId(arg) {
  if (!arg) return null;
  arg = arg.replace(/^answers\//, '').replace(/\.js$/, '').replace(/^exercises\//, '').replace(/\.md$/, '');
  if (EXERCISES[arg]) return arg;
  const m = arg.match(/^([^/]+)\/(\d+)$/);
  if (!m) return null;
  const [, mod, num] = m;
  const n = num.padStart(2, '0');
  return Object.keys(EXERCISES).find((id) => {
    const [idMod, idNum] = id.split('/');
    return idNum === n && (idMod === mod || idMod.startsWith(mod.padStart(2, '0') + '-') || idMod.startsWith(mod + '-'));
  }) || null;
}

const parse = (src) => acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', allowAwaitOutsideFunction: true });

// Answers are normally written as `function solution(db) { return ... }`.
// A bare expression as the last statement is also accepted (used by the
// reference solutions and for quick experiments).
const findSolutionFn = (ast) => ast.body.find((n) => n.type === 'FunctionDeclaration' && n.id && n.id.name === 'solution');

// True if the file contains real code (a non-empty solution() body, or any statement).
function hasCode(src) {
  try {
    const ast = parse(src);
    const fn = findSolutionFn(ast);
    return fn ? fn.body.body.length > 0 : ast.body.length > 0;
  } catch {
    return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim().length > 0;
  }
}

// Rewrite the answer so the value of its last expression is captured, then
// serialised as relaxed EJSON (cursors are drained with toArray()).
function buildScript(src) {
  let ast;
  try {
    ast = parse(src);
  } catch (e) {
    throw new UserError(`JavaScript syntax error: ${e.message}\n  (line ${e.loc && e.loc.line}, column ${e.loc && e.loc.column + 1})`);
  }
  const fn = findSolutionFn(ast);
  if (fn) {
    if (!fn.body.body.length) throw new UserError('Your solution() function is still empty — write your query inside it and `return` it.');
    return `${src}
globalThis.__tutorRaw = solution(db);
if (globalThis.__tutorRaw === undefined) {
  print(${JSON.stringify(MARKER)} + JSON.stringify({ noReturn: true }));
} else {
  let __tutorVal = globalThis.__tutorRaw;
  if (__tutorVal && typeof __tutorVal.toArray === 'function') __tutorVal = __tutorVal.toArray();
  print(${JSON.stringify(MARKER)} + EJSON.stringify({ value: __tutorVal }, { relaxed: true }));
}
`;
  }
  const last = ast.body[ast.body.length - 1];
  if (!last) throw new UserError('The answer file has no code yet.');
  if (last.type !== 'ExpressionStatement') {
    throw new UserError('Your answer must END with the expression whose result should be checked,\n  e.g. `db.products.find({...})` — not with a variable declaration or other statement.');
  }
  const before = src.slice(0, last.start);
  const expr = src.slice(last.expression.start, last.expression.end);
  return `${before}
globalThis.__tutorRaw = (${expr});
let __tutorVal = globalThis.__tutorRaw;
if (__tutorVal && typeof __tutorVal.toArray === 'function') __tutorVal = __tutorVal.toArray();
if (__tutorVal === undefined) __tutorVal = null;
print(${JSON.stringify(MARKER)} + EJSON.stringify({ value: __tutorVal }, { relaxed: true }));
`;
}

class UserError extends Error {}

function runCode(src, dbName) {
  const script = buildScript(src);
  const tmpDir = path.join(ROOT, '.tmp');
  fs.mkdirSync(tmpDir, { recursive: true });
  const file = path.join(tmpDir, `run-${process.pid}-${Date.now()}.js`);
  fs.writeFileSync(file, script);
  try {
    const res = spawnSync('mongosh', [uri(dbName), '--quiet', file], { encoding: 'utf8', env: { ...process.env, NODE_NO_WARNINGS: '1' } });
    const out = res.stdout || '';
    const idx = out.lastIndexOf(MARKER);
    if (idx === -1) {
      const err = (res.stderr || out).trim().split('\n').filter((l) => !/DeprecationWarning|trace-warnings|MONGODB DRIVER/.test(l)).join('\n');
      throw new UserError(`MongoDB/mongosh error:\n  ${err.replace(/\n/g, '\n  ')}`);
    }
    const printed = out.slice(0, idx).trim();
    const parsed = JSON.parse(out.slice(idx + MARKER.length).trim().split('\n')[0]);
    if (parsed.noReturn) throw new UserError('Your solution() returned nothing (undefined). Did you forget the `return` keyword?\n  e.g.  return db.products.find({ ... });');
    const value = parsed.value;
    return { value, printed };
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function seed(dbName) {
  execFileSync('mongosh', [uri('admin'), '--quiet', path.join(ROOT, 'seed', 'seed.js')], {
    encoding: 'utf8', env: { ...process.env, SEED_DB: dbName },
  });
}

function dropDb(dbName) {
  spawnSync('mongosh', [uri(dbName), '--quiet', '--eval', 'db.dropDatabase()'], { encoding: 'utf8' });
}

// Canonical form for comparison: object keys sorted, floats rounded.
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = canon(v[k]);
    return out;
  }
  if (typeof v === 'number' && !Number.isInteger(v)) return Math.round(v * 1e6) / 1e6;
  return v;
}
const key = (v) => JSON.stringify(canon(v));

function compare(actual, expected, { orderMatters }) {
  const a = canon(actual), e = canon(expected);
  if (Array.isArray(a) && Array.isArray(e)) {
    if (!orderMatters) {
      const as = a.map(key).sort(), es = e.map(key).sort();
      return { equal: JSON.stringify(as) === JSON.stringify(es), ...diffSets(a, e) };
    }
    const equal = key(a) === key(e);
    let firstMismatch = -1;
    if (!equal) for (let i = 0; i < Math.max(a.length, e.length); i++) if (key(a[i]) !== key(e[i])) { firstMismatch = i; break; }
    return { equal, firstMismatch, ...diffSets(a, e) };
  }
  return { equal: key(a) === key(e) };
}

function diffSets(a, e) {
  const count = (arr) => arr.reduce((m, x) => m.set(key(x), (m.get(key(x)) || 0) + 1), new Map());
  const ac = count(a), ec = count(e);
  const missing = [], extra = [];
  for (const [k, n] of ec) for (let i = 0; i < n - (ac.get(k) || 0); i++) missing.push(JSON.parse(k));
  for (const [k, n] of ac) for (let i = 0; i < n - (ec.get(k) || 0); i++) extra.push(JSON.parse(k));
  return { missing, extra };
}

const preview = (v, max = 3) => {
  if (Array.isArray(v)) {
    const shown = v.slice(0, max).map((x) => '    ' + JSON.stringify(x));
    if (v.length > max) shown.push(`    … and ${v.length - max} more`);
    return shown.join('\n') || '    (empty array)';
  }
  return '    ' + JSON.stringify(v);
};

module.exports = { ROOT, EXERCISES, uri, resolveId, hasCode, runCode, seed, dropDb, compare, preview, UserError };
