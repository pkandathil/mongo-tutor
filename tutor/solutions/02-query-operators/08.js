async function solution(db) {
  return db.collection("customers").find({ referredBy: { $type: "null" } }).toArray();
}
