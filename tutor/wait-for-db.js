#!/usr/bin/env node
// Waits until the tutor MongoDB answers a ping, then seeds it if empty.
const { MongoClient } = require('mongodb');
const { seed } = require('../seed/seed');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  for (let i = 0; i < 60; i++) {
    const client = new MongoClient('mongodb://localhost:27018/?directConnection=true', { serverSelectionTimeoutMS: 2000 });
    try {
      const db = client.db('tutor');
      await db.command({ ping: 1 });
      if (!(await db.collection('products').estimatedDocumentCount())) {
        console.log('Database is empty — seeding…');
        const n = await seed(db);
        console.log(`Seeded "tutor": customers=${n.customers} products=${n.products} orders=${n.orders} reviews=${n.reviews}`);
      }
      console.log('MongoDB is ready on localhost:27018 (database: tutor)');
      return;
    } catch {
      await sleep(2000);
    } finally {
      await client.close();
    }
  }
  console.error('MongoDB did not become ready in time. Check `docker compose logs mongo-tutor`.');
  process.exitCode = 1;
})();
