async function solution(db) {
  return db.collection("products").find({ $or: [{ stock: 0 }, { discontinued: true }] }).toArray();
}
