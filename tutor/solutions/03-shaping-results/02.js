db.products.find({}, { title: 1, price: 1, _id: 0 }).sort({ price: -1 }).limit(5)
