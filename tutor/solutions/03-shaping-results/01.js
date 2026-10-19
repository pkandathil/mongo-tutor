async function solution(db) {
  return db.collection("products")
    .find({ category: "sci-fi" }, { projection: { title: 1, price: 1, _id: 0 } })
    .toArray();
}
