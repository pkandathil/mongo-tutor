async function solution(db) {
  return db.collection("products")
    .find({}, { projection: { title: 1, price: 1 } })
    .sort({ price: 1, _id: 1 })
    .skip(20)
    .limit(10)
    .toArray();
}
