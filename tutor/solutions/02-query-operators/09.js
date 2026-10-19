async function solution(db) {
  return db.collection("products").find({ title: /^The / }).toArray();
}
