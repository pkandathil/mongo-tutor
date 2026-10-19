# Mongo Tutor 🍃

A hands-on practice environment for learning MongoDB queries and aggregation pipelines, with Claude as your tutor.

## Setup (once)

Requires Docker, Node.js and `mongosh`.

```sh
npm install
npm run db:up        # starts MongoDB on localhost:27018 and seeds it if empty
```

`npm run db:down` stops it. `npm run seed` resets the data to its original state (do this if you ever change data while experimenting).

## How to practise

1. Pick the next exercise: `npm run status` (or browse [`exercises/CURRICULUM.md`](exercises/CURRICULUM.md)).
2. Read it, e.g. [`exercises/01-find-basics/01.md`](exercises/01-find-basics/01.md). The data is described in [`DATASET.md`](DATASET.md).
3. Open the matching answer file, e.g. `answers/01-find-basics/01.js`. It already contains a `solution(db)` function — `db` is connected for you, so just write the query and **return** it:
   ```js
   function solution(db) {
     return db.products.find({ ... });
   }
   ```
   You can use variables inside the function (e.g. build a `filter` first), as long as you `return` the result at the end.
4. See what it returns: `npm run try -- 01/01`
5. Grade it: `npm run check -- 01/01` (or a whole module: `npm run check -- 01`)
6. Ask Claude to review it — e.g. *"check 01/01"* or *"review my module 2 answers"*. Claude runs it, explains what's right or wrong, and records your progress in [`progress/`](progress/).
7. Commit your answers whenever you like — they're yours, and git history shows your learning.

Experiment freely in [`playground/scratch.js`](playground/scratch.js) (`npm run try -- playground/scratch.js`) or in the interactive shell (`npm run db:shell`).

## Things to ask Claude

- "What should I do next?"
- "Check 02/08" / "Why is my answer wrong?" / "Give me a hint, not the answer"
- "Explain `$elemMatch` with an example from the dataset"
- "Write the next module" / "Give me some drills on what I'm weak at"
- "How am I doing?" (reads `progress/skills.md`)

## Layout

| Path | What |
|---|---|
| `exercises/` | Exercise descriptions, by module |
| `answers/` | **Your** answers (one `.js` file per exercise) |
| `progress/` | Your learning log and skills map (maintained by Claude) |
| `playground/` | Scratch space |
| `seed/` | Dataset generator |
| `tutor/` | Checker scripts, exercise metadata — and ⚠️ `tutor/solutions/` (spoilers!) |
