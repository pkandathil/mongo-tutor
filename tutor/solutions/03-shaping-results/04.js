db.products.find({}, { title: 1, price: 1 }).sort({ price: 1, _id: 1 }).skip(20).limit(10)
