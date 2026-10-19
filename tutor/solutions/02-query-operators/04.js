async function solution(db) {
  return db.collection("products").find({ category: { $in: ["fiction", "mystery", "fantasy"] } }).toArray();
}
