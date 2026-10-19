async function solution(db) {
  return db.collection("orders").countDocuments({ status: "cancelled" });
}
