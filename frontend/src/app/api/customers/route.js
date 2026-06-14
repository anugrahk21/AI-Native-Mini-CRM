import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city');
    const tag = searchParams.get('tag');

    const customers = await getCollection('customers');

    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (city) query.city = { $regex: city, $options: 'i' };
    if (tag) query.tags = tag;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      customers.find(query).sort({ lastOrderDate: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
      customers.countDocuments(query)
    ]);

    return NextResponse.json({
      customers: data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const customersCol = await getCollection('customers');

    if (body.customers && Array.isArray(body.customers)) {
      // Bulk insert
      const docs = body.customers.map(c => ({
        ...c,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      const result = await customersCol.insertMany(docs);
      return NextResponse.json({ success: true, insertedCount: result.insertedCount });
    } else {
      // Single insert
      const doc = {
        ...body,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await customersCol.insertOne(doc);
      return NextResponse.json({ success: true, id: result.insertedId, customer: doc });
    }
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
