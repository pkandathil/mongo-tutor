async function solution(db) {
  return db.collection("customers").find({ phone: { $exists: false } }).toArray();
}
