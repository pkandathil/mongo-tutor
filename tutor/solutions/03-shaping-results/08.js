db.customers.find({ "address.country": "Japan" }, { firstName: 1, "address.city": 1, _id: 0 })
