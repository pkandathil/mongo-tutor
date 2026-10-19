db.products.find({ $or: [{ stock: 0 }, { discontinued: true }] })
