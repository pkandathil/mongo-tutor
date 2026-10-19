// Exercise 01.02 — Look up one customer by email
// Task: exercises/01-find-basics/02.md   ·   Collection: customers
//
// `db` is a connected Node.js driver Db — no connection code needed.
// Write your query inside the function and RETURN its result, for example:
//     return db.collection("customers").find({ someField: "some value" }).toArray();
//
// See your output:  npm run try -- 01/02
// Grade it:         npm run check -- 01/02

async function solution(db) {
    return db.collection("customers").findOne({"email": "priya.singh2@example.com"});
}
