import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const campaigns = await getCollection('campaigns');
    const data = await campaigns.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ campaigns: data });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const campaigns = await getCollection('campaigns');

    let segId = body.segmentId;
    if (typeof segId === 'string' && segId.length === 24) {
      segId = new ObjectId(segId);
    }

    const doc = {
      ...body,
      segmentId: segId,
      status: 'draft',
      stats: { total: 0, sent: 0, delivered: 0, failed: 0, opened: 0, clicked: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await campaigns.insertOne(doc);
    return NextResponse.json({ success: true, id: result.insertedId, campaign: { ...doc, _id: result.insertedId } });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
