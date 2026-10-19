# Curriculum

All exercises use the **Page & Quill bookstore** dataset (database `tutor`): see [`../DATASET.md`](../DATASET.md).

| # | Module | Status | Concepts |
|---|--------|--------|----------|
| 01 | [find() basics & equality](01-find-basics/README.md) | ✅ written | `find`, `findOne`, equality, implicit AND, dot notation, array contains, `countDocuments`, `distinct` |
| 02 | [Query operators](02-query-operators/README.md) | ✅ written | `$gt/$gte/$lt/$lte`, ranges, dates, `$in/$nin`, `$or`, `$exists`, null vs missing, `$type`, `$regex` |
| 03 | [Shaping results](03-shaping-results/README.md) | ✅ written | projection (include/exclude/nested), `sort` (multi-key), `limit`, `skip`, pagination |
| 04 | Arrays & embedded documents | planned | `$elemMatch`, `$all`, `$size`, array-of-documents queries, `items.productId`, positional projection, `$slice` |
| 05 | Writing data | planned | `insertOne/Many`, `updateOne/Many`, `$set/$unset/$inc/$push/$pull/$addToSet`, upsert, `arrayFilters`, `deleteMany`, `replaceOne` |
| 06 | Aggregation basics | planned | pipeline mental model, `$match`, `$group` + accumulators (`$sum/$avg/$min/$max/$count`), `$sort`, `$limit`, `$project` |
| 07 | Reshaping & joining | planned | `$unwind`, `$lookup`, `$addFields/$set`, expressions (`$multiply`, `$cond`, `$ifNull`, `$concat`), `$replaceRoot` |
| 08 | Advanced aggregation | planned | `$facet`, `$bucket/$bucketAuto`, `$setWindowFields`, date operators (`$dateTrunc`, `$dateToString`), `$filter/$map/$reduce` |
| 09 | Indexes & performance | planned | `createIndex`, compound indexes & ESR rule, `explain("executionStats")`, covered queries |
| 10 | From the Node.js driver | planned | same queries from app code, async/await, cursors, `ObjectId` handling |

Additional targeted practice lives in [`drills/`](drills/) — short exercises generated when progress shows a concept is shaky.
