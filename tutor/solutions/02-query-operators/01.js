async function solution(db) {
  return db.collection("products").find({ price: { $lt: 10 } }).toArray();
}
