// Your playground. Experiment freely, then run:
//   npm run try -- playground/scratch.js
// console.log() output is shown too. Need an ObjectId?
//   const { ObjectId } = require("mongodb");

async function solution(db) {
  return db.collection("products").findOne();
}
