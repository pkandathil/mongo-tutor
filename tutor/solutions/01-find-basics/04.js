async function solution(db) {
  return db.collection("customers").find({ "address.city": "Lisbon" }).toArray();
}
