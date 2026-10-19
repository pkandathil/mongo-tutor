async function solution(db) {
  return db.collection("customers").findOne({ email: "priya.singh2@example.com" });
}
