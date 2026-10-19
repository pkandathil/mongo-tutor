// Exercise 01.01 — All cooking products
// Task: exercises/01-find-basics/01.md   ·   Collection: products
//
// `db` is a connected Node.js driver Db — no connection code needed.
// Write your query inside the function and RETURN its result, for example:
//     return db.collection("products").find({ someField: "some value" }).toArray();
//
// See your output:  npm run try -- 01/01
// Grade it:         npm run check -- 01/01

async function solution(db) {
    return db.collection("products").find({ category: "cooking" }).toArray();
}
