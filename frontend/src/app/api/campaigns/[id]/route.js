import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const campaigns = await getCollection('campaigns');
    const segments = await getCollection('segments');
    
    const { id } = await params;
    
    let campaign;
    try {
      campaign = await campaigns.findOne({ _id: new ObjectId(id) });
    } catch (e) {
      campaign = await campaigns.findOne({ _id: id });
    }
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    
    // Get segment info
    let segmentInfo = null;
    if (campaign.segmentId) {
      try {
        segmentInfo = await segments.findOne({ _id: new ObjectId(campaign.segmentId) });
      } catch (e) {
        segmentInfo = await segments.findOne({ _id: campaign.segmentId });
      }
    }

    return NextResponse.json({ campaign, segment: segmentInfo });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
