// Shared helpers for running answer files with the MongoDB Node.js driver and comparing results.
const fs = require('fs');
const path = require('path');
const util = require('util');
const vm = require('vm');
const acorn = require('acorn');
const { MongoClient, BSON } = require('mongodb');

const ROOT = path.resolve(__dirname, '..');
const HOST = 'mongodb://localhost:27018';
const uri = (dbName) => `${HOST}/${dbName}?directConnection=true`;

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

const parse = (src) => acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', locations: true });

// Every answer (and reference solution) defines `async function solution(db) { return ... }`.
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

class UserError extends Error {}

// A query started without `await`/`return` can still be running when we close
// the client; its rejection would otherwise crash the process.
process.on('unhandledRejection', (e) => {
  if (e && /^Mongo/.test(e.name)) return;
  console.error(e);
  process.exitCode = 1;
});

// The driver's find()/findOne() take OPTIONS as the second argument, so a
// mongosh-style projection such as find({}, { title: 1 }) is silently ignored.
const FIND_OPTIONS = new Set(['projection', 'sort', 'limit', 'skip', 'hint', 'collation', 'comment', 'maxTimeMS', 'batchSize', 'allowDiskUse', 'let', 'min', 'max', 'returnKey', 'showRecordId', 'session', 'timeoutMS']);
function lintWarnings(ast) {
  const warnings = [];
  const walk = (node) => {
    if (!node || typeof node.type !== 'string') return;
    if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && ['find', 'findOne'].includes(node.callee.property.name)) {
      const opts = node.arguments[1];
      if (opts && opts.type === 'ObjectExpression') {
        const unknown = opts.properties.map((p) => p.key && (p.key.name || p.key.value)).filter((k) => k && !FIND_OPTIONS.has(k));
        if (unknown.length) {
          warnings.push(`⚠️  Line ${node.loc.start.line}: ${node.callee.property.name}() ignores ${unknown.map((k) => `\`${k}\``).join(', ')} — in the Node driver the 2nd argument is *options*.\n   To choose fields, wrap them:  .${node.callee.property.name}(filter, { projection: { ${unknown[0]}: 1 } })`);
        }
      }
    }
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object' && k !== 'loc') walk(v);
    }
  };
  walk(ast);
  return warnings;
}

// ---------- connection (one client per process; call close() before exiting) ----------
let client = null;
async function getClient() {
  if (!client) {
    client = new MongoClient(`${HOST}/?directConnection=true`, { serverSelectionTimeoutMS: 5000 });
    try {
      await client.connect();
    } catch (e) {
      client = null;
      throw new UserError(`Could not connect to MongoDB on localhost:27018 — is it running? Try \`npm run db:up\`.\n  (${e.message})`);
    }
  }
  return client;
}
async function getDb(dbName) {
  return (await getClient()).db(dbName);
}
async function close() {
  if (client) await client.close();
  client = null;
}

// ---------- running answers ----------

// Turns the source into its solution() function. The wrapper is kept on the
// first line so line numbers in error messages match the user's file.
function compile(src, filename) {
  let ast;
  try {
    ast = parse(src);
  } catch (e) {
    throw new UserError(`JavaScript syntax error: ${e.message}\n  (line ${e.loc && e.loc.line}, column ${e.loc && e.loc.column + 1})`);
  }
  const fn = findSolutionFn(ast);
  if (!fn) throw new UserError('No `solution` function found. Your file should contain:\n  async function solution(db) {\n    return ...;\n  }');
  if (!fn.body.body.length) throw new UserError('Your solution() function is still empty — write your query inside it and `return` it.');
  const lines = [];
  const capture = (...args) => lines.push(util.format(...args));
  const sandboxConsole = { log: capture, info: capture, warn: capture, error: capture, dir: (o) => capture(util.inspect(o, { depth: 6 })), table: capture };
  const script = new vm.Script(`(function (require, console) {${src}\n;return solution;})`, { filename });
  return { solution: script.runInThisContext()(require, sandboxConsole), lines, warnings: lintWarnings(ast) };
}

// Explain the most common mistakes in driver terms rather than raw JS errors.
function explainError(e, filename) {
  const at = (e.stack || '').split('\n').find((l) => l.includes(filename));
  const where = at ? `\n  at ${at.trim().replace(/^at /, '').replace(filename, path.relative(process.cwd(), filename) || filename)}` : '';
  let tip = '';
  if (/Cannot read properties of undefined \(reading '(find|findOne|countDocuments|distinct|aggregate|insertOne|insertMany|updateOne|updateMany|deleteOne|deleteMany|replaceOne)'\)/.test(e.message)) {
    tip = '\n  Tip: with the Node driver, get a collection with db.collection("products") — `db.products` is mongosh-only syntax.';
  } else if (/ISODate is not defined/.test(e.message)) {
    tip = '\n  Tip: ISODate() is mongosh-only. In Node, use new Date("2025-01-01").';
  } else if (/ObjectId is not defined/.test(e.message)) {
    tip = '\n  Tip: import it first:  const { ObjectId } = require("mongodb");  then use new ObjectId("…").';
  }
  const kind = e.name && e.name.startsWith('Mongo') ? 'MongoDB error' : 'Error while running your code';
  return new UserError(`${kind}: ${e.message}${where}${tip}`);
}

// Runs the file's solution(db) against `dbName`. The returned value is awaited,
// cursors are drained with toArray(), and the result is converted to relaxed EJSON.
async function runCode(src, dbName, filename = path.join(ROOT, '.tmp', 'answer.js')) {
  const { solution, lines, warnings } = compile(src, filename);
  const db = await getDb(dbName);
  let raw;
  try {
    raw = await solution(db);
    if (raw && typeof raw.toArray === 'function') raw = await raw.toArray();
  } catch (e) {
    throw explainError(e, filename);
  }
  if (raw === undefined) throw new UserError('Your solution() returned nothing (undefined). Did you forget the `return` keyword?\n  e.g.  return db.collection("products").find({ ... }).toArray();');
  const value = JSON.parse(BSON.EJSON.stringify(raw, { relaxed: true }));
  return { value, printed: lines.join('\n'), warnings };
}

// A write exercise's `verify` is a driver expression using `db`, e.g.
// `db.collection("products").find({}, { projection: { stock: 1 } }).sort({ _id: 1 })`.
const runVerify = (expr, dbName) => runCode(`async function solution(db) { return ${expr}; }`, dbName, path.join(ROOT, 'tutor', 'exercises.json'));

async function seed(dbName) {
  return require('../seed/seed').seed(await getDb(dbName));
}

async function dropDb(dbName) {
  await (await getDb(dbName)).dropDatabase();
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

module.exports = { ROOT, EXERCISES, uri, resolveId, hasCode, getDb, close, runCode, runVerify, seed, dropDb, compare, preview, UserError };
