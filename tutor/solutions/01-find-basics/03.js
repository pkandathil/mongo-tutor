async function solution(db) {
  return db.collection("products").find({ category: "history", format: "hardcover" }).toArray();
}
