db.orders.find({
  total: { $gte: 100 },
  createdAt: { $gte: ISODate("2025-01-01"), $lt: ISODate("2026-01-01") }
})
