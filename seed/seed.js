// Seeds the "Page & Quill" online bookstore practice dataset.
// Run with: npm run seed   (or SEED_DB=other_db npm run seed)
// The data is generated from a fixed random seed, so every reseed produces
// exactly the same documents. Exercise answers depend on that, so do not
// change the generator without re-verifying every reference solution.

const { MongoClient, ObjectId } = require('mongodb');

// Builds the four collections in memory. Deterministic: same output every call.
function generate() {
  // ---------- deterministic random helpers ----------
  let state = 20241019;
  function rand() {
    // mulberry32
    state |= 0; state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const chance = (p) => rand() < p;
  const round2 = (n) => Math.round(n * 100) / 100;
  function sample(arr, n) {
    const copy = arr.slice();
    const out = [];
    while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
    return out;
  }
  function weighted(pairs) {
    const total = pairs.reduce((s, [, w]) => s + w, 0);
    let r = rand() * total;
    for (const [v, w] of pairs) { if ((r -= w) < 0) return v; }
    return pairs[pairs.length - 1][0];
  }
  function dateBetween(start, end) {
    const s = start.getTime(), e = end.getTime();
    const d = new Date(s + Math.floor(rand() * (e - s)));
    d.setUTCSeconds(0, 0);
    return d;
  }
  function oid(prefix, n) {
    // deterministic ObjectId: 8 hex prefix + 16 hex counter
    return new ObjectId(prefix + n.toString(16).padStart(16, '0'));
  }

  // ---------- reference data ----------
  const FIRST = ['Ava', 'Liam', 'Noah', 'Emma', 'Olivia', 'Mateo', 'Sofia', 'Lucas', 'Mia', 'Arjun', 'Priya', 'Chen', 'Yuki', 'Hana', 'Omar', 'Layla', 'Ethan', 'Zoe', 'Diego', 'Isabel', 'Kofi', 'Amara', 'Lars', 'Freya', 'Ravi', 'Anika', 'Tom', 'Grace', 'Ben', 'Chloe', 'Sam', 'Nora', 'Leo', 'Ines', 'Hugo', 'Elena', 'Kai', 'Maya', 'Jonas', 'Lea'];
  const LAST = ['Smith', 'Garcia', 'Nguyen', 'Patel', 'Kim', 'Müller', 'Rossi', 'Silva', 'Tanaka', 'Okafor', 'Johansson', 'Dubois', 'Kowalski', 'Haddad', 'Brown', 'Lopez', 'Singh', 'Chen', 'Wilson', 'Novak', 'Andersen', 'Moreau', 'Costa', 'Ito', 'Mensah'];
  const CITIES = [
    { city: 'London', country: 'UK' }, { city: 'Manchester', country: 'UK' }, { city: 'Edinburgh', country: 'UK' },
    { city: 'New York', country: 'USA' }, { city: 'Austin', country: 'USA' }, { city: 'Seattle', country: 'USA' }, { city: 'Chicago', country: 'USA' },
    { city: 'Toronto', country: 'Canada' }, { city: 'Vancouver', country: 'Canada' },
    { city: 'Berlin', country: 'Germany' }, { city: 'Munich', country: 'Germany' },
    { city: 'Paris', country: 'France' }, { city: 'Lyon', country: 'France' },
    { city: 'Madrid', country: 'Spain' }, { city: 'Lisbon', country: 'Portugal' },
    { city: 'Tokyo', country: 'Japan' }, { city: 'Mumbai', country: 'India' }, { city: 'Bangalore', country: 'India' },
    { city: 'Sydney', country: 'Australia' }, { city: 'Melbourne', country: 'Australia' },
  ];
  const STREETS = ['High St', 'Main St', 'Park Ave', 'Oak Rd', 'Mill Lane', 'King St', 'Station Rd', 'Elm St', 'River Way', 'Church Rd'];
  const CUSTOMER_TAGS = ['newsletter', 'student', 'vip', 'bookclub', 'early-adopter', 'gift-buyer'];
  const GENRES = ['fiction', 'mystery', 'sci-fi', 'fantasy', 'history', 'science', 'biography', 'cooking', 'self-help', 'children'];
  const FORMATS = ['paperback', 'hardcover', 'ebook', 'audiobook'];

  const AUTHORS = [];
  for (let i = 0; i < 45; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    if (!AUTHORS.includes(name)) AUTHORS.push(name);
  }
  const PUBLISHERS = [
    { name: 'Lantern House', country: 'UK' }, { name: 'Bluefin Press', country: 'USA' }, { name: 'Northwind Books', country: 'Canada' },
    { name: 'Kestrel & Co', country: 'UK' }, { name: 'Sunrise Publishing', country: 'Japan' }, { name: 'Atlas Verlag', country: 'Germany' },
    { name: 'Maple Leaf Media', country: 'Canada' }, { name: 'Indigo Ink', country: 'India' },
  ];
  const TITLE_A = ['The', 'A', 'Beyond the', 'Under the', 'Secrets of the', 'Return to the', 'Last', 'Into the', 'Songs of the', 'Children of the'];
  const TITLE_B = ['Silent', 'Hidden', 'Crimson', 'Forgotten', 'Endless', 'Broken', 'Golden', 'Midnight', 'Winter', 'Distant', 'Clockwork', 'Wild'];
  const TITLE_C = ['Harbor', 'Kingdom', 'Garden', 'Signal', 'Library', 'River', 'Empire', 'Orchard', 'Lighthouse', 'Machine', 'Forest', 'City', 'Kitchen', 'Atlas'];
  const GENRE_PRICE = { fiction: [8, 22], mystery: [8, 20], 'sci-fi': [9, 24], fantasy: [9, 28], history: [14, 40], science: [15, 45], biography: [12, 35], cooking: [18, 45], 'self-help': [10, 25], children: [5, 15] };
  const GENRE_TAGS = {
    fiction: ['literary', 'bestseller', 'award-winner', 'debut'], mystery: ['thriller', 'detective', 'bestseller', 'cozy'],
    'sci-fi': ['space', 'dystopian', 'ai', 'award-winner'], fantasy: ['epic', 'dragons', 'magic', 'series'],
    history: ['ww2', 'ancient', 'medieval', 'award-winner'], science: ['physics', 'biology', 'space', 'popular-science'],
    biography: ['memoir', 'sports', 'music', 'politics'], cooking: ['vegan', 'baking', 'quick-meals', 'regional'],
    'self-help': ['productivity', 'mindfulness', 'career', 'bestseller'], children: ['picture-book', 'bedtime', 'animals', 'series'],
  };
  const ACCESSORIES = [
    { title: 'Leather Bookmark', category: 'bookmark', price: 6.5, specs: { material: 'leather', color: 'brown' } },
    { title: 'Magnetic Bookmark Set', category: 'bookmark', price: 4.99, specs: { material: 'paper', color: 'assorted', pieces: 6 } },
    { title: 'Brass Bookmark', category: 'bookmark', price: 9.0, specs: { material: 'brass', color: 'gold' } },
    { title: 'Canvas Tote Bag', category: 'tote', price: 15.0, specs: { material: 'canvas', color: 'natural' } },
    { title: 'Book Lover Tote', category: 'tote', price: 18.5, specs: { material: 'cotton', color: 'navy' } },
    { title: 'Clip-on Reading Light', category: 'reading-light', price: 12.99, specs: { material: 'plastic', color: 'white', batteryHours: 20 } },
    { title: 'Rechargeable Neck Light', category: 'reading-light', price: 24.99, specs: { material: 'silicone', color: 'black', batteryHours: 40 } },
    { title: 'Wooden Book Stand', category: 'book-stand', price: 29.0, specs: { material: 'bamboo', color: 'natural' } },
  ];

  // ---------- customers ----------
  const customers = [];
  for (let i = 1; i <= 200; i++) {
    const firstName = pick(FIRST), lastName = pick(LAST);
    const loc = pick(CITIES);
    const c = {
      _id: oid('c0ffee00', i),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace('ü', 'u')}${i}@example.com`,
      age: int(17, 78),
      address: { street: `${int(1, 250)} ${pick(STREETS)}`, city: loc.city, country: loc.country, zip: String(int(10000, 99999)) },
      tier: weighted([['bronze', 50], ['silver', 30], ['gold', 15], ['platinum', 5]]),
      tags: sample(CUSTOMER_TAGS, weighted([[0, 25], [1, 40], [2, 25], [3, 10]])),
      joinedAt: dateBetween(new Date('2021-01-01'), new Date('2025-06-30')),
      isActive: chance(0.88),
      preferences: { genres: sample(GENRES, int(1, 3)), format: pick(FORMATS), newsletter: chance(0.5) },
    };
    if (chance(0.8)) c.phone = `+${int(1, 99)} ${int(100, 999)} ${int(1000000, 9999999)}`;
    // referredBy: present-with-a-value, present-but-null, or missing entirely
    const r = rand();
    if (r < 0.3 && customers.length > 0) c.referredBy = pick(customers)._id;
    else if (r < 0.45) c.referredBy = null;
    customers.push(c);
  }

  // ---------- products ----------
  const products = [];
  let bookNo = 0;
  for (let i = 1; i <= 140; i++) {
    const category = pick(GENRES);
    const [lo, hi] = GENRE_PRICE[category];
    let title;
    do { title = `${pick(TITLE_A)} ${pick(TITLE_B)} ${pick(TITLE_C)}`; } while (products.some((p) => p.title === title));
    bookNo++;
    const p = {
      _id: `BK-${String(bookNo).padStart(4, '0')}`,
      type: 'book',
      title,
      authors: sample(AUTHORS, weighted([[1, 85], [2, 12], [3, 3]])),
      category,
      price: round2(lo + rand() * (hi - lo)),
      stock: chance(0.1) ? 0 : int(1, 120),
      format: weighted([['paperback', 45], ['hardcover', 25], ['ebook', 20], ['audiobook', 10]]),
      pages: category === 'children' ? int(24, 64) : int(150, 720),
      publishedYear: int(1985, 2025),
      publisher: pick(PUBLISHERS),
      tags: sample(GENRE_TAGS[category], int(0, 3)),
      rating: { average: 0, count: 0 },
    };
    if (p.format === 'ebook' || p.format === 'audiobook') p.stock = null; // digital: no stock concept
    if (p.format === 'audiobook') { delete p.pages; p.durationMinutes = int(240, 1500); }
    if (chance(0.15)) { p.onSale = true; p.discountPct = pick([10, 15, 20, 25, 30]); }
    if (chance(0.06)) p.discontinued = true;
    products.push(p);
  }
  ACCESSORIES.forEach((a, idx) => {
    products.push({
      _id: `AC-${String(idx + 1).padStart(4, '0')}`,
      type: 'accessory',
      title: a.title,
      category: a.category,
      price: a.price,
      stock: chance(0.15) ? 0 : int(5, 300),
      specs: a.specs,
      tags: [],
      rating: { average: 0, count: 0 },
    });
  });

  // ---------- orders ----------
  const orders = [];
  const START = new Date('2024-01-01T00:00:00Z'), END = new Date('2025-12-31T23:59:00Z');
  const sellable = products.filter((p) => !p.discontinued);
  for (let i = 1; i <= 1500; i++) {
    const customer = pick(customers);
    const createdAt = dateBetween(START, END);
    const lines = sample(sellable, weighted([[1, 45], [2, 30], [3, 15], [4, 7], [5, 3]]));
    const items = lines.map((p) => {
      const unitPrice = p.onSale && chance(0.7) ? round2(p.price * (1 - p.discountPct / 100)) : p.price;
      return { productId: p._id, title: p.title, qty: weighted([[1, 75], [2, 18], [3, 5], [5, 2]]), unitPrice };
    });
    const subtotal = round2(items.reduce((s, it) => s + it.qty * it.unitPrice, 0));
    const method = weighted([['standard', 60], ['express', 25], ['pickup', 15]]);
    const shippingCost = method === 'pickup' ? 0 : method === 'express' ? 9.99 : subtotal >= 35 ? 0 : 3.99;
    const ageDays = (END - createdAt) / 86400000;
    const status = ageDays < 14
      ? weighted([['pending', 60], ['shipped', 40]])
      : weighted([['delivered', 78], ['cancelled', 8], ['returned', 6], ['shipped', 8]]);
    const o = {
      _id: oid('0de10000', i),
      orderNumber: 100000 + i,
      customerId: customer._id,
      createdAt,
      status,
      items,
      subtotal,
      shipping: { method, cost: shippingCost, city: customer.address.city, country: customer.address.country },
      total: round2(subtotal + shippingCost),
      paymentMethod: weighted([['card', 65], ['paypal', 20], ['gift-card', 8], ['apple-pay', 7]]),
    };
    if (chance(0.12)) o.couponCode = pick(['WELCOME10', 'SUMMER24', 'BOOKWORM', 'FREESHIP', 'VIP20']);
    if (status === 'delivered') {
      const d = new Date(createdAt.getTime() + int(1, method === 'express' ? 3 : 9) * 86400000);
      o.deliveredAt = d;
    }
    if (chance(0.05)) o.giftMessage = pick(['Happy birthday!', 'Enjoy the read', 'Congrats!', 'Merry Christmas']);
    orders.push(o);
  }

  // ---------- reviews ----------
  const reviews = [];
  const REVIEW_TITLES = { 5: ['Loved it', 'Masterpiece', 'Could not put it down'], 4: ['Really good', 'Great read', 'Solid'], 3: ['It was okay', 'Mixed feelings', 'Average'], 2: ['Disappointing', 'Not for me', 'Slow'], 1: ['Terrible', 'Waste of money', 'Arrived damaged'] };
  // Reviews come from delivered orders (verified) plus some unverified ones.
  let reviewNo = 0;
  for (const o of orders) {
    if (o.status !== 'delivered') continue;
    for (const it of o.items) {
      if (!chance(0.35)) continue;
      const quality = (it.productId.charCodeAt(5) + it.productId.charCodeAt(6)) % 3; // some products are just better
      const stars = Math.max(1, Math.min(5, weighted([[5, 30 + quality * 15], [4, 35], [3, 18], [2, 9], [1, 6]]) - (quality === 0 && chance(0.3) ? 1 : 0)));
      reviewNo++;
      reviews.push({
        _id: oid('5eed0000', reviewNo),
        productId: it.productId,
        customerId: o.customerId,
        stars,
        title: pick(REVIEW_TITLES[stars]),
        createdAt: new Date(o.deliveredAt.getTime() + int(1, 40) * 86400000),
        helpfulVotes: weighted([[0, 50], [int(1, 5), 35], [int(6, 40), 15]]),
        verifiedPurchase: true,
      });
    }
  }
  for (let i = 0; i < 80; i++) {
    const p = pick(products);
    const stars = weighted([[5, 25], [4, 20], [3, 15], [2, 15], [1, 25]]);
    reviewNo++;
    reviews.push({
      _id: oid('5eed0000', reviewNo),
      productId: p._id,
      customerId: pick(customers)._id,
      stars,
      title: pick(REVIEW_TITLES[stars]),
      createdAt: dateBetween(START, END),
      helpfulVotes: int(0, 3),
      verifiedPurchase: false,
    });
  }
  // Denormalised rating summary on each product.
  const byProduct = {};
  for (const r of reviews) (byProduct[r.productId] ||= []).push(r.stars);
  for (const p of products) {
    const s = byProduct[p._id] || [];
    p.rating = { average: s.length ? round2(s.reduce((a, b) => a + b, 0) / s.length) : null, count: s.length };
  }

  return { customers, products, orders, reviews };
}

// ---------- write ----------
// Replaces everything in `db` (a driver Db) with a fresh copy of the dataset.
async function seed(db) {
  const data = generate();
  await db.dropDatabase();
  for (const [name, docs] of Object.entries(data)) await db.collection(name).insertMany(docs);
  return Object.fromEntries(Object.entries(data).map(([name, docs]) => [name, docs.length]));
}

module.exports = { generate, seed };

if (require.main === module) {
  const dbName = process.env.SEED_DB || 'tutor';
  const client = new MongoClient('mongodb://localhost:27018/?directConnection=true', { serverSelectionTimeoutMS: 5000 });
  seed(client.db(dbName))
    .then((n) => console.log(`Seeded "${dbName}": customers=${n.customers} products=${n.products} orders=${n.orders} reviews=${n.reviews}`))
    .catch((e) => { console.error(`Seeding failed: ${e.message}`); process.exitCode = 1; })
    .finally(() => client.close());
}
