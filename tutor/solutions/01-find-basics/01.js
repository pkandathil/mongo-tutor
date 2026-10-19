async function solution(db) {
  return db.collection("products").find({ category: "cooking" }).toArray();
}
