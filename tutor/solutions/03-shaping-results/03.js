async function solution(db) {
  return db.collection("customers")
    .find({}, { projection: { firstName: 1, lastName: 1, _id: 0 } })
    .sort({ lastName: 1, firstName: 1 })
    .limit(10)
    .toArray();
}
