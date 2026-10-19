# The Page & Quill bookstore dataset

Database **`tutor`** on `localhost:27018`. Regenerate any time with `npm run seed` — the data is generated from a fixed random seed, so it is identical every time.

| Collection | Docs | What it is |
|---|---|---|
| `customers` | 200 | People who shop at the store |
| `products` | 148 | 140 books (`BK-0001`…) + 8 accessories (`AC-0001`…) |
| `orders` | 1,500 | Orders placed Jan 2024 – Dec 2025 |
| `reviews` | ~870 | Star ratings left on products |

Explore it yourself: `npm run try -- playground/scratch.js` (returns one product), or `npm run db:shell` then `db.products.findOne()`. The examples below are in shell notation: `ObjectId('…')` and `ISODate('…')` are `new ObjectId('…')` and `new Date('…')` in Node.

## customers
```js
{
  _id: ObjectId('c0ffee000000000000000002'),
  firstName: 'Priya', lastName: 'Singh',
  email: 'priya.singh2@example.com',
  age: 29,
  address: { street: '16 Elm St', city: 'Mumbai', country: 'India', zip: '85037' },  // embedded document
  tier: 'bronze',                       // bronze | silver | gold | platinum
  tags: ['vip'],                        // array of strings, may be empty
  joinedAt: ISODate('2021-12-05T10:08:00Z'),
  isActive: true,
  preferences: { genres: ['history'], format: 'ebook', newsletter: false },
  phone: '+70 877 1568572',             // ⚠️ missing on ~20% of customers
  referredBy: ObjectId('…')             // ⚠️ an id, explicitly null, OR missing
}
```

## products
```js
{
  _id: 'BK-0001',                       // string ids (not ObjectId)
  type: 'book',                         // book | accessory
  title: 'Songs of the Broken Kingdom',
  authors: ['Lea Rossi'],               // array (books only)
  category: 'biography',                // fiction, mystery, sci-fi, fantasy, history, science, biography,
                                        // cooking, self-help, children | bookmark, tote, reading-light, book-stand
  price: 33.4,
  stock: null,                          // number; 0 = out of stock; null for ebooks/audiobooks
  format: 'audiobook',                  // paperback | hardcover | ebook | audiobook (books only)
  pages: 412,                           // not on audiobooks…
  durationMinutes: 1471,                // …which have this instead
  publishedYear: 2013,
  publisher: { name: 'Sunrise Publishing', country: 'Japan' },
  tags: ['sports', 'music'],
  rating: { average: 4, count: 3 },     // summary of reviews; average is null when count is 0
  onSale: true, discountPct: 20,        // only on some products
  discontinued: true,                   // only on some products
  specs: { material: 'brass', color: 'gold' }  // accessories only
}
```

## orders
```js
{
  _id: ObjectId('0de100000000000000000001'),
  orderNumber: 100001,
  customerId: ObjectId('c0ffee…'),      // → customers._id
  createdAt: ISODate('2025-06-16T22:29:00Z'),
  status: 'shipped',                    // pending | shipped | delivered | cancelled | returned
  items: [                              // array of embedded documents
    { productId: 'BK-0017', title: '…', qty: 1, unitPrice: 33.32 }   // productId → products._id
  ],
  subtotal: 33.32,
  shipping: { method: 'express', cost: 9.99, city: 'Mumbai', country: 'India' },
  total: 43.31,
  paymentMethod: 'card',                // card | paypal | gift-card | apple-pay
  couponCode: 'SUMMER24',               // only some orders
  deliveredAt: ISODate('…'),            // only delivered orders
  giftMessage: 'Enjoy the read'         // only some orders
}
```

## reviews
```js
{
  _id: ObjectId('5eed00000000000000000001'),
  productId: 'BK-0042',                 // → products._id
  customerId: ObjectId('c0ffee…'),      // → customers._id
  stars: 4,                             // 1–5
  title: 'Really good',
  createdAt: ISODate('2025-02-19T11:07:00Z'),
  helpfulVotes: 0,
  verifiedPurchase: true
}
```
