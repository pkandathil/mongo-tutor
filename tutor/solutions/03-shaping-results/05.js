async function solution(db) {
  return db.collection("orders").find({ status: "pending" }, { projection: { items: 0 } }).toArray();
}
