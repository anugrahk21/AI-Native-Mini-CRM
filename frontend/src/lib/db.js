// MongoDB connection singleton for Next.js serverless environment
// Uses a cached connection to avoid creating multiple connections in dev/serverless

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

const DB_NAME = 'crm_ai';

let cached = global._mongoClientPromise;

if (!cached) {
  cached = global._mongoClientPromise = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts)
      .then((client) => {
        const db = client.db(DB_NAME);
        console.log('✅ Connected to MongoDB Atlas');
        return { client, db };
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Helper to get a specific collection
export async function getCollection(name) {
  const { db } = await connectToDatabase();
  return db.collection(name);
}

// Helper to get the database instance
export async function getDb() {
  const { db } = await connectToDatabase();
  return db;
}

// Ensure indexes exist (call once on startup/seed)
export async function ensureIndexes() {
  const { db } = await connectToDatabase();

  // Customers indexes
  const customers = db.collection('customers');
  await customers.createIndex({ email: 1 }, { unique: true, sparse: true });
  await customers.createIndex({ phone: 1 }, { sparse: true });
  await customers.createIndex({ city: 1 });
  await customers.createIndex({ totalSpent: -1 });
  await customers.createIndex({ lastOrderDate: -1 });
  await customers.createIndex({ tags: 1 });

  // Orders indexes
  const orders = db.collection('orders');
  await orders.createIndex({ customerId: 1 });
  await orders.createIndex({ orderDate: -1 });
  await orders.createIndex({ totalAmount: -1 });

  // Segments indexes
  const segments = db.collection('segments');
  await segments.createIndex({ createdAt: -1 });

  // Campaigns indexes
  const campaigns = db.collection('campaigns');
  await campaigns.createIndex({ status: 1 });
  await campaigns.createIndex({ createdAt: -1 });
  await campaigns.createIndex({ segmentId: 1 });

  // Communications indexes
  const communications = db.collection('communications');
  await communications.createIndex({ campaignId: 1 });
  await communications.createIndex({ customerId: 1 });
  await communications.createIndex({ status: 1 });
  await communications.createIndex({ campaignId: 1, status: 1 });

  console.log('✅ Database indexes ensured');
}

export default connectToDatabase;
