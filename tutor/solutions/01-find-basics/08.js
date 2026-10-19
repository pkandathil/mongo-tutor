async function solution(db) {
  return db.collection("customers").distinct("address.country");
}
