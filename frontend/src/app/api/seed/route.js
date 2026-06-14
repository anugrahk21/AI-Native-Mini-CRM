import { NextResponse } from 'next/server';
import { getCollection, ensureIndexes } from '@/lib/db';
import { generateSeedData } from '@/lib/seed-data';

export async function POST() {
  try {
    console.log('🌱 Starting seed process...');
    const { customers, orders, segments } = generateSeedData();

    const customersCol = await getCollection('customers');
    const ordersCol = await getCollection('orders');
    const segmentsCol = await getCollection('segments');
    const campaignsCol = await getCollection('campaigns');
    const communicationsCol = await getCollection('communications');

    // Drop existing collections to start fresh
    console.log('Dropping existing collections...');
    await Promise.all([
      customersCol.deleteMany({}),
      ordersCol.deleteMany({}),
      segmentsCol.deleteMany({}),
      campaignsCol.deleteMany({}),
      communicationsCol.deleteMany({})
    ]);

    console.log('Inserting seed data...');
    // Insert new data
    await customersCol.insertMany(customers);
    await ordersCol.insertMany(orders);
    await segmentsCol.insertMany(segments);

    // Re-create indexes
    console.log('Ensuring indexes...');
    await ensureIndexes();

    console.log('✅ Seed completed successfully!');
    return NextResponse.json({
      success: true,
      counts: {
        customers: customers.length,
        orders: orders.length,
        segments: segments.length
      }
    });
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
