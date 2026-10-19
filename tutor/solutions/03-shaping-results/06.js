db.products.countDocuments({ "rating.average": { $gte: 4.5 }, "rating.count": { $gte: 5 } })
