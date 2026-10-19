// Exercise 01.04 — Customers in Lisbon
// Task: exercises/01-find-basics/04.md   ·   Collection: customers
//
// `db` is a connected Node.js driver Db — no connection code needed.
// Write your query inside the function and RETURN its result, for example:
//     return db.collection("customers").find({ someField: "some value" }).toArray();
//
// See your output:  npm run try -- 01/04
// Grade it:         npm run check -- 01/04

async function solution(db) {
    return db.collection("customers").find({"address.city": "Lisbon"})
}
