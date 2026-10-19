async function solution(db) {
  return db.collection("customers")
    .find({ "address.country": "Japan" }, { projection: { firstName: 1, "address.city": 1, _id: 0 } })
    .toArray();
}
