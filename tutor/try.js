#!/usr/bin/env node
// Run any answer/scratch file against the `tutor` DB and pretty-print the result.
// Usage: npm run try -- 01/03          (runs answers/01-.../03.js)
//        npm run try -- scratch.js     (runs any file)
const fs = require('fs');
const path = require('path');
const { ROOT, resolveId, runCode, close, UserError } = require('./lib');

const arg = process.argv[2];
if (!arg) { console.log('Usage: npm run try -- <module>/<exercise> | <file.js>'); process.exit(1); }
const id = resolveId(arg);
const file = id ? path.join(ROOT, 'answers', id + '.js') : path.resolve(arg);
if (!fs.existsSync(file)) { console.log(`File not found: ${file}`); process.exit(1); }

(async () => {
  try {
    const { value, printed, warnings } = await runCode(fs.readFileSync(file, 'utf8'), 'tutor', file);
    for (const w of warnings) console.log(w + '\n');
    if (printed) console.log(printed + '\n');
    const max = Number(process.env.MAX || 20);
    if (Array.isArray(value)) {
      value.slice(0, max).forEach((d) => console.log(JSON.stringify(d, null, 2)));
      console.log(`\n${value.length} result(s)${value.length > max ? ` — showing first ${max} (set MAX=n to see more)` : ''}`);
    } else {
      console.log(JSON.stringify(value, null, 2));
    }
  } catch (e) {
    process.exitCode = 1;
    if (e instanceof UserError) console.log(e.message);
    else console.error(e);
  } finally {
    await close();
  }
})();
