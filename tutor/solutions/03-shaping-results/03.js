db.customers.find({}, { firstName: 1, lastName: 1, _id: 0 }).sort({ lastName: 1, firstName: 1 }).limit(10)
