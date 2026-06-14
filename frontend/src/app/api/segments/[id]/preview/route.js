import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { buildMongoQuery } from '@/lib/ai-tools';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const segments = await getCollection('segments');
    const customersCol = await getCollection('customers');
    
    const { id } = await params;
    
    let segment;
    try {
      segment = await segments.findOne({ _id: new ObjectId(id) });
    } catch (e) {
      segment = await segments.findOne({ _id: id });
    }
    
    if (!segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 });
    }
    
    const query = buildMongoQuery(segment.rules?.conditions || [], segment.rules?.logic || 'AND');
    
    const [count, sample] = await Promise.all([
      customersCol.countDocuments(query),
      customersCol.find(query).limit(50).toArray()
    ]);

    return NextResponse.json({ 
      count, 
      customers: sample, 
      segmentName: segment.name 
    });
  } catch (error) {
    console.error('Error previewing segment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
