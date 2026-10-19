async function solution(db) {
  return db.collection("customers").find({ age: { $gte: 25, $lte: 35 } }).toArray();
}
