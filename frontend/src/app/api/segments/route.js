import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { buildMongoQuery } from '@/lib/ai-tools';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const segments = await getCollection('segments');
    const customers = await getCollection('customers');
    
    const data = await segments.find({}).sort({ createdAt: -1 }).toArray();
    
    // Compute live customerCount for each segment
    const enhancedData = await Promise.all(data.map(async (segment) => {
      let count = segment.customerCount || 0;
      if (segment.rules && segment.rules.conditions) {
        const query = buildMongoQuery(segment.rules.conditions, segment.rules.logic);
        count = await customers.countDocuments(query);
      }
      return { ...segment, customerCount: count };
    }));

    return NextResponse.json({ segments: enhancedData });
  } catch (error) {
    console.error('Error fetching segments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const segments = await getCollection('segments');
    const customers = await getCollection('customers');

    let count = 0;
    if (body.rules && body.rules.conditions) {
      const query = buildMongoQuery(body.rules.conditions, body.rules.logic);
      count = await customers.countDocuments(query);
    }

    const doc = {
      ...body,
      customerCount: count,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await segments.insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId, segment: { ...doc, _id: result.insertedId } });
  } catch (error) {
    console.error('Error creating segment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
