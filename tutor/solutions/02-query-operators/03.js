async function solution(db) {
  return db.collection("orders").find({
    total: { $gte: 100 },
    createdAt: { $gte: new Date("2025-01-01"), $lt: new Date("2026-01-01") },
  }).toArray();
}
