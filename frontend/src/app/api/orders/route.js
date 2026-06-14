import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const customerId = searchParams.get('customerId');

    const orders = await getCollection('orders');

    const query = {};
    if (customerId) {
      try {
        query.customerId = new ObjectId(customerId);
      } catch (e) {
        query.customerId = customerId; // allow string if it was seeded as string
      }
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      orders.find(query).sort({ orderDate: -1 }).skip(skip).limit(limit).toArray(),
      orders.countDocuments(query)
    ]);

    return NextResponse.json({
      orders: data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
