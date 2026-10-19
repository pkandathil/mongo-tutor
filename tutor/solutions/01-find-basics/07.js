async function solution(db) {
  return db.collection("customers").find({ tags: "vip" }).toArray();
}
