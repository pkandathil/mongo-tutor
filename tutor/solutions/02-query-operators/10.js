db.products.find({
  format: "paperback",
  $or: [{ price: { $lt: 12 } }, { "rating.average": { $gte: 4.5 } }]
})
