async function solution(db) {
  return db.collection("customers").find({ tier: { $nin: ["bronze", "silver"] } }).toArray();
}
