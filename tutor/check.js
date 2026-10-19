#!/usr/bin/env node
// Usage: npm run check -- 01/03            (check one exercise)
//        npm run check -- 01               (check every attempted exercise in module 01)
//        npm run check -- 01/03 --solution (verify the reference solution itself; for the tutor)
const fs = require('fs');
const path = require('path');
const { ROOT, EXERCISES, resolveId, hasCode, runCode, seed, dropDb, compare, preview, UserError } = require('./lib');

const args = process.argv.slice(2);
const useSolution = args.includes('--solution');
const target = args.find((a) => !a.startsWith('--'));
if (!target) {
  console.log('Usage: npm run check -- <module>/<exercise>   e.g. npm run check -- 01/03');
  process.exit(1);
}

let ids;
if (/^[\w-]+$/.test(target) && !resolveId(target)) {
  const mod = target.padStart(2, '0');
  ids = Object.keys(EXERCISES).filter((id) => id.startsWith(mod + '-') || id.split('/')[0] === target);
} else {
  const id = resolveId(target);
  ids = id ? [id] : [];
}
if (!ids.length) {
  console.log(`No exercise matches "${target}". Run \`npm run status\` to see them all.`);
  process.exit(1);
}

let failures = 0, attempted = 0;
for (const id of ids) {
  const meta = EXERCISES[id];
  const answerPath = useSolution ? path.join(ROOT, 'tutor', 'solutions', id + '.js') : path.join(ROOT, 'answers', id + '.js');
  const solutionPath = path.join(ROOT, 'tutor', 'solutions', id + '.js');
  const label = `${id} — ${meta.title}`;
  if (!fs.existsSync(answerPath) || !hasCode(fs.readFileSync(answerPath, 'utf8'))) {
    if (ids.length === 1) console.log(`⏳ ${label}\n   Not attempted yet: write your answer in answers/${id}.js`);
    continue;
  }
  attempted++;
  const answer = fs.readFileSync(answerPath, 'utf8');
  const solution = fs.readFileSync(solutionPath, 'utf8');
  try {
    let actual, expected;
    if (meta.kind === 'write') {
      // Each side runs against its own fresh copy of the data, then the
      // `verify` expression inspects the resulting state.
      seed('tutor_check_user');
      runCode(answer, 'tutor_check_user');
      actual = runCode(meta.verify, 'tutor_check_user').value;
      seed('tutor_check_ref');
      runCode(solution, 'tutor_check_ref');
      expected = runCode(meta.verify, 'tutor_check_ref').value;
      dropDb('tutor_check_user');
      dropDb('tutor_check_ref');
    } else {
      actual = runCode(answer, 'tutor').value;
      expected = runCode(solution, 'tutor').value;
    }
    const r = compare(actual, expected, meta);
    if (r.equal) {
      const n = Array.isArray(actual) ? ` (${actual.length} result${actual.length === 1 ? '' : 's'})` : '';
      console.log(`✅ PASS  ${label}${n}`);
      continue;
    }
    failures++;
    console.log(`❌ FAIL  ${label}`);
    if (Array.isArray(actual) && Array.isArray(expected)) {
      console.log(`   You returned ${actual.length} item(s); expected ${expected.length}.`);
      if (r.missing.length) console.log(`   Missing (expected but not in yours) — ${r.missing.length}:\n${preview(r.missing)}`);
      if (r.extra.length) console.log(`   Unexpected (in yours but not expected) — ${r.extra.length}:\n${preview(r.extra)}`);
      if (!r.missing.length && !r.extra.length && meta.orderMatters) {
        console.log(`   Same items, but the ORDER is different (first difference at position ${r.firstMismatch}).`);
      }
    } else {
      console.log(`   Your result:\n${preview(actual)}`);
      if (Array.isArray(actual) !== Array.isArray(expected)) {
        console.log(`   Expected ${Array.isArray(expected) ? 'a list of results' : 'a single value/document'}, got ${Array.isArray(actual) ? 'a list' : 'a single value'}.`);
      }
    }
  } catch (e) {
    failures++;
    if (e instanceof UserError) console.log(`❌ ERROR ${label}\n   ${e.message}`);
    else throw e;
  }
}
if (ids.length > 1) {
  console.log(attempted ? `\n${attempted - failures}/${attempted} attempted passing (${ids.length} exercises in module)` : `No answers written yet for "${target}".`);
}
process.exit(failures ? 1 : 0);
