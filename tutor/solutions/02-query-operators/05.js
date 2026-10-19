db.customers.find({ tier: { $nin: ["bronze", "silver"] } })
