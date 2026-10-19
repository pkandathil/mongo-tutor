async function solution(db) {
  return db.collection("products").find({ "publisher.name": "Lantern House" }).toArray();
}
