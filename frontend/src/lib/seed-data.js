/**
 * seed-data.js — Deterministic seed data generator for crm.ai
 *
 * Generates realistic data modeled after an Indian D2C fashion & beauty brand:
 *   • 200 customers with Indian names, cities, demographics
 *   • ~800 orders with products across Skincare, Makeup, Haircare, Fragrance, Accessories
 *   • 4 pre-built audience segments with structured rules
 *
 * The generator uses a simple seeded PRNG so every call produces identical output,
 * making tests and demo environments fully reproducible.
 */

// ─── Seeded PRNG (Mulberry32) ──────────────────────────────────────────────────
function createRng(seed = 42) {
  let s = seed | 0;
  return function random() {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Reference Data ────────────────────────────────────────────────────────────

const MALE_NAMES = [
  'Aarav', 'Arjun', 'Vihaan', 'Rohan', 'Karan',
  'Aditya', 'Dev', 'Raj', 'Vikram', 'Nikhil',
  'Siddharth', 'Amit', 'Rahul', 'Sahil', 'Kabir',
  'Ishaan', 'Yash', 'Harsh', 'Ankit', 'Pranav',
  'Rishi', 'Varun', 'Akash', 'Manish', 'Kunal',
  'Dhruv', 'Vivek', 'Abhinav', 'Rishabh', 'Gaurav',
  'Tanmay', 'Shivam', 'Chirag', 'Mayank', 'Kartik',
  'Tushar', 'Deepak', 'Ajay', 'Saurabh', 'Neeraj',
  'Mohit', 'Pratik', 'Suresh', 'Hemant', 'Lokesh',
  'Vikas', 'Tarun', 'Naveen', 'Pawan', 'Rajesh',
];

const FEMALE_NAMES = [
  'Priya', 'Ananya', 'Ishita', 'Sneha', 'Pooja',
  'Riya', 'Neha', 'Kavya', 'Divya', 'Meera',
  'Aisha', 'Tanvi', 'Simran', 'Sakshi', 'Shruti',
  'Nisha', 'Aditi', 'Swati', 'Pallavi', 'Anjali',
  'Kriti', 'Bhavna', 'Jyoti', 'Megha', 'Shweta',
  'Tanya', 'Nikita', 'Aarti', 'Mansi', 'Ritika',
  'Komal', 'Sonal', 'Deepika', 'Varsha', 'Rashmi',
  'Payal', 'Nupur', 'Poonam', 'Khushi', 'Mahi',
  'Sonali', 'Radhika', 'Garima', 'Akanksha', 'Preeti',
  'Anushka', 'Trisha', 'Ira', 'Sanya', 'Diya',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta',
  'Mehta', 'Joshi', 'Verma', 'Nair', 'Reddy',
  'Iyer', 'Pillai', 'Rao', 'Deshmukh', 'Kulkarni',
  'Banerjee', 'Chatterjee', 'Das', 'Bose', 'Sen',
  'Mishra', 'Pandey', 'Tiwari', 'Chauhan', 'Thakur',
];

/** City → State mapping for realistic addresses */
const CITY_STATE_MAP = {
  Mumbai: 'Maharashtra',
  Delhi: 'Delhi',
  Bangalore: 'Karnataka',
  Hyderabad: 'Telangana',
  Chennai: 'Tamil Nadu',
  Kolkata: 'West Bengal',
  Pune: 'Maharashtra',
  Jaipur: 'Rajasthan',
  Ahmedabad: 'Gujarat',
  Lucknow: 'Uttar Pradesh',
};
const CITIES = Object.keys(CITY_STATE_MAP);

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.co.in', 'outlook.com', 'hotmail.com', 'rediffmail.com'];

// ─── Product Catalog ───────────────────────────────────────────────────────────

const PRODUCTS = {
  Skincare: [
    { name: 'Hydrating Face Serum', price: 899 },
    { name: 'Vitamin C Moisturizer', price: 749 },
    { name: 'Retinol Night Cream', price: 1299 },
    { name: 'Sunscreen SPF 50', price: 499 },
    { name: 'Clay Face Mask', price: 599 },
  ],
  Makeup: [
    { name: 'Matte Lipstick', price: 599 },
    { name: 'Liquid Foundation', price: 1499 },
    { name: 'Kajal Liner', price: 299 },
    { name: 'Compact Powder', price: 799 },
    { name: 'Blush Palette', price: 999 },
  ],
  Haircare: [
    { name: 'Argan Oil Shampoo', price: 649 },
    { name: 'Keratin Conditioner', price: 699 },
    { name: 'Hair Growth Serum', price: 1199 },
    { name: 'Anti-Dandruff Treatment', price: 549 },
    { name: 'Heat Protectant Spray', price: 449 },
  ],
  Fragrance: [
    { name: 'Oud Eau de Parfum', price: 4999 },
    { name: 'Jasmine Body Mist', price: 799 },
    { name: 'Sandalwood Cologne', price: 2499 },
    { name: 'Rose Attar Roll-On', price: 1499 },
    { name: 'Citrus Fresh EDT', price: 1999 },
  ],
  Accessories: [
    { name: 'Jade Roller', price: 999 },
    { name: 'Silk Scrunchie Set', price: 499 },
    { name: 'Makeup Brush Kit', price: 1799 },
    { name: 'Cosmetic Pouch', price: 699 },
    { name: 'Hair Claw Clips', price: 349 },
  ],
};

const ALL_CATEGORIES = Object.keys(PRODUCTS);

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Pick a random element from an array */
function pick(arr, rng) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Approximate normal distribution via Box-Muller (clamped) */
function normalRandom(mean, stddev, min, max, rng) {
  let u1 = rng();
  let u2 = rng();
  // Avoid log(0)
  if (u1 === 0) u1 = 0.0001;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const value = Math.round(mean + z * stddev);
  return Math.max(min, Math.min(max, value));
}

/** Simple ObjectId-like hex string */
function objectId(rng) {
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += hex[Math.floor(rng() * 16)];
  }
  return id;
}

/** Generate a random date within the last N days, weighted toward recent dates */
function randomRecentDate(daysBack, rng) {
  // Bias toward recent: square the random to skew distribution
  const daysAgo = Math.floor(Math.pow(rng(), 1.5) * daysBack);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  // Add random hours/minutes for realism
  d.setHours(Math.floor(rng() * 14) + 8); // 8 AM – 10 PM
  d.setMinutes(Math.floor(rng() * 60));
  d.setSeconds(Math.floor(rng() * 60));
  d.setMilliseconds(0);
  return d;
}

// ─── Generator ─────────────────────────────────────────────────────────────────

/**
 * Generate the full seed dataset.
 *
 * @param {number} [seed=42] - PRNG seed for deterministic output
 * @returns {{ customers: object[], orders: object[], segments: object[] }}
 */
export function generateSeedData(seed = 42) {
  const rng = createRng(seed);

  const TOTAL_CUSTOMERS = 200;
  const TOTAL_ORDERS = 800;

  // ── Step 1: Generate customer shells ─────────────────────────────────────

  const customers = [];
  const customerIds = [];

  for (let i = 0; i < TOTAL_CUSTOMERS; i++) {
    const isMale = i < 100; // first 100 male, next 100 female
    const firstName = isMale
      ? MALE_NAMES[i % MALE_NAMES.length]
      : FEMALE_NAMES[(i - 100) % FEMALE_NAMES.length];
    const lastName = pick(LAST_NAMES, rng);
    const city = pick(CITIES, rng);
    const domain = pick(EMAIL_DOMAINS, rng);
    const age = normalRandom(28, 7, 18, 55, rng);
    const id = objectId(rng);

    // Phone: +91 followed by first digit 6-9, then 9 random digits
    const phoneFirst = String(6 + Math.floor(rng() * 4));
    let phoneRest = '';
    for (let d = 0; d < 9; d++) phoneRest += Math.floor(rng() * 10);
    const phone = `+91${phoneFirst}${phoneRest}`;

    // Unique-ish email: add index suffix to avoid collisions
    const emailBase = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const email = i < 50 ? `${emailBase}@${domain}` : `${emailBase}${i}@${domain}`;

    customerIds.push(id);

    customers.push({
      _id: id,
      name: `${firstName} ${lastName}`,
      email,
      phone,
      age,
      gender: isMale ? 'male' : 'female',
      city,
      state: CITY_STATE_MAP[city],
      // These will be computed after orders are generated
      totalSpent: 0,
      totalOrders: 0,
      lastOrderDate: null,
      firstOrderDate: null,
      averageOrderValue: 0,
      tags: [],
      createdAt: new Date(Date.now() - Math.floor(rng() * 365 * 24 * 60 * 60 * 1000)),
    });
  }

  // ── Step 2: Distribute orders across customers ───────────────────────────
  //
  // Strategy: assign each customer a "weight" that determines how many orders
  // they receive.  Top ~10% get heavy weight (VIPs), bottom ~20% get 1 order.

  const weights = customers.map((_, i) => {
    const r = rng();
    if (i < 20) return 8 + Math.floor(rng() * 6);   // VIPs: 8-13 orders
    if (i < 50) return 4 + Math.floor(rng() * 4);    // Regulars: 4-7
    if (i < 160) return 2 + Math.floor(rng() * 3);   // Moderate: 2-4
    return 1;                                          // New: 1 order
  });

  // Normalise so total = TOTAL_ORDERS exactly
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const orderCounts = weights.map((w) => Math.max(1, Math.round((w / weightSum) * TOTAL_ORDERS)));

  // Adjust to hit the target exactly — distribute remainder across heaviest buckets
  let currentTotal = orderCounts.reduce((a, b) => a + b, 0);
  let idx = 0;
  while (currentTotal < TOTAL_ORDERS) {
    orderCounts[idx % TOTAL_CUSTOMERS]++;
    currentTotal++;
    idx++;
  }
  while (currentTotal > TOTAL_ORDERS && idx < TOTAL_CUSTOMERS) {
    if (orderCounts[idx] > 1) { orderCounts[idx]--; currentTotal--; }
    idx++;
  }

  // ── Step 3: Generate orders ──────────────────────────────────────────────

  const orders = [];

  for (let ci = 0; ci < TOTAL_CUSTOMERS; ci++) {
    const count = orderCounts[ci];

    for (let oi = 0; oi < count; oi++) {
      const orderId = objectId(rng);
      const orderDate = randomRecentDate(365, rng);

      // Pick 1-4 items
      const itemCount = 1 + Math.floor(rng() * 4);
      const items = [];
      let orderTotal = 0;

      for (let it = 0; it < itemCount; it++) {
        const category = pick(ALL_CATEGORIES, rng);
        const product = pick(PRODUCTS[category], rng);
        const qty = rng() < 0.8 ? 1 : 2; // 20% chance of qty 2
        const lineTotal = product.price * qty;
        orderTotal += lineTotal;
        items.push({
          product: product.name,
          category,
          price: product.price,
          quantity: qty,
          lineTotal,
        });
      }

      // Status distribution: 85% completed, 10% cancelled, 5% returned
      const statusRoll = rng();
      let status;
      if (statusRoll < 0.85) status = 'completed';
      else if (statusRoll < 0.95) status = 'cancelled';
      else status = 'returned';

      orders.push({
        _id: orderId,
        customerId: customerIds[ci],
        items,
        totalAmount: orderTotal,
        status,
        orderDate,
        createdAt: orderDate,
      });
    }
  }

  // ── Step 4: Compute denormalized customer metrics ────────────────────────

  for (const customer of customers) {
    const custOrders = orders.filter((o) => o.customerId === customer._id);
    const completed = custOrders.filter((o) => o.status === 'completed');

    customer.totalOrders = completed.length;
    customer.totalSpent = completed.reduce((sum, o) => sum + o.totalAmount, 0);
    customer.averageOrderValue =
      customer.totalOrders > 0
        ? Math.round(customer.totalSpent / customer.totalOrders)
        : 0;

    if (custOrders.length > 0) {
      const dates = custOrders.map((o) => new Date(o.orderDate).getTime());
      customer.lastOrderDate = new Date(Math.max(...dates));
      customer.firstOrderDate = new Date(Math.min(...dates));
    }

    // ── Compute tags ───────────────────────────────────────────────────
    const tags = [];
    const daysSinceLast = customer.lastOrderDate
      ? Math.floor((Date.now() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    if (customer.totalSpent >= 10000) tags.push('vip');
    if (customer.totalOrders > 5) tags.push('loyal');
    if (customer.totalOrders <= 1) tags.push('new');
    if (daysSinceLast >= 60) tags.push('churning');
    if (customer.averageOrderValue > 3000) tags.push('high_aov');

    customer.tags = tags;
  }

  // ── Step 5: Pre-built audience segments ──────────────────────────────────

  const segments = [
    {
      _id: objectId(rng),
      name: 'VIP Customers',
      description: 'High-value customers who have spent over ₹10,000',
      rules: {
        combinator: 'AND',
        conditions: [
          { field: 'totalSpent', operator: '>', value: 10000 },
        ],
      },
      color: '#8b5cf6',
      createdAt: new Date(),
    },
    {
      _id: objectId(rng),
      name: 'At Risk',
      description: 'Customers who haven\'t ordered in 60+ days — win them back',
      rules: {
        combinator: 'AND',
        conditions: [
          { field: 'lastOrderDate', operator: 'daysAgo >', value: 60 },
        ],
      },
      color: '#ef4444',
      createdAt: new Date(),
    },
    {
      _id: objectId(rng),
      name: 'New Shoppers',
      description: 'Recent first-time buyers — nurture to a second purchase',
      rules: {
        combinator: 'AND',
        conditions: [
          { field: 'totalOrders', operator: '<=', value: 1 },
        ],
      },
      color: '#3b82f6',
      createdAt: new Date(),
    },
    {
      _id: objectId(rng),
      name: 'High AOV Loyalists',
      description: 'Repeat buyers with consistently high cart values',
      rules: {
        combinator: 'AND',
        conditions: [
          { field: 'averageOrderValue', operator: '>', value: 3000 },
          { field: 'totalOrders', operator: '>=', value: 3 },
        ],
      },
      color: '#10b981',
      createdAt: new Date(),
    },
  ];

  return { customers, orders, segments };
}
