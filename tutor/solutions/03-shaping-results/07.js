db.orders.find({}, { orderNumber: 1, createdAt: 1, total: 1, _id: 0 }).sort({ createdAt: -1 }).limit(3)
