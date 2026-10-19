#!/usr/bin/env node
// Usage: npm run check -- 01/03            (check one exercise)
//        npm run check -- 01               (check every attempted exercise in module 01)
//        npm run check -- 01/03 --solution (verify the reference solution itself; for the tutor)
const fs = require('fs');
const path = require('path');
const { ROOT, EXERCISES, resolveId, hasCode, runCode, runVerify, seed, dropDb, close, compare, preview, UserError } = require('./lib');

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

async function main() {
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
    let actual, expected, warnings = [];
    if (meta.kind === 'write') {
      // Each side runs against its own fresh copy of the data, then the
      // `verify` expression inspects the resulting state.
      await seed('tutor_check_user');
      ({ warnings } = await runCode(answer, 'tutor_check_user', answerPath));
      actual = (await runVerify(meta.verify, 'tutor_check_user')).value;
      await seed('tutor_check_ref');
      await runCode(solution, 'tutor_check_ref', solutionPath);
      expected = (await runVerify(meta.verify, 'tutor_check_ref')).value;
      await dropDb('tutor_check_user');
      await dropDb('tutor_check_ref');
    } else {
      ({ value: actual, warnings } = await runCode(answer, 'tutor', answerPath));
      expected = (await runCode(solution, 'tutor', solutionPath)).value;
    }
    const r = compare(actual, expected, meta);
    if (r.equal) {
      const n = Array.isArray(actual) ? ` (${actual.length} result${actual.length === 1 ? '' : 's'})` : '';
      console.log(`✅ PASS  ${label}${n}`);
      continue;
    }
    failures++;
    console.log(`❌ FAIL  ${label}`);
    for (const w of warnings) console.log(`   ${w.replace(/\n/g, '\n   ')}`);
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
    if (e instanceof UserError) console.log(`❌ ERROR ${label}\n   ${e.message.replace(/\n  /g, "\n   ")}`);
    else throw e;
  }
}
if (ids.length > 1) {
  console.log(attempted ? `\n${attempted - failures}/${attempted} attempted passing (${ids.length} exercises in module)` : `No answers written yet for "${target}".`);
}
return failures;
}

main()
  .then(async (failures) => { await close(); process.exit(failures ? 1 : 0); })
  .catch(async (e) => { await close(); console.error(e instanceof UserError ? e.message : e); process.exit(1); });
