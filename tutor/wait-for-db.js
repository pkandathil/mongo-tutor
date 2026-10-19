#!/usr/bin/env node
// Waits until the tutor MongoDB answers a ping, then seeds it if empty.
const { spawnSync } = require('child_process');
const path = require('path');
const { uri } = require('./lib');

const ping = () => spawnSync('mongosh', [uri('tutor'), '--quiet', '--eval', 'db.runCommand({ping:1}).ok && db.products.estimatedDocumentCount()'], { encoding: 'utf8' });
for (let i = 0; i < 60; i++) {
  const r = ping();
  if (r.status === 0) {
    const count = Number(r.stdout.trim());
    if (!count) {
      console.log('Database is empty — seeding…');
      spawnSync('mongosh', [uri('tutor'), '--quiet', path.join(__dirname, '..', 'seed', 'seed.js')], { stdio: 'inherit' });
    }
    console.log('MongoDB is ready on localhost:27018 (database: tutor)');
    process.exit(0);
  }
  spawnSync('sleep', ['2']);
}
console.error('MongoDB did not become ready in time. Check `docker compose logs mongo-tutor`.');
process.exit(1);
