#!/usr/bin/env node
// Lists every exercise and whether an answer has been written.
// (Pass/fail history lives in progress/log.md, maintained by the tutor.)
const fs = require('fs');
const path = require('path');
const { ROOT, EXERCISES, hasCode } = require('./lib');

let currentModule = null;
for (const [id, meta] of Object.entries(EXERCISES)) {
  const mod = id.split('/')[0];
  if (mod !== currentModule) { console.log(`\n${mod}`); currentModule = mod; }
  const file = path.join(ROOT, 'answers', id + '.js');
  const done = fs.existsSync(file) && hasCode(fs.readFileSync(file, 'utf8'));
  console.log(`  ${done ? '✍️ ' : '· '} ${id.split('/')[1]}  ${meta.title}`);
}
console.log('\n✍️  = answer written (run `npm run check -- <id>` to grade it)');
