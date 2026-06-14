import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const campaigns = await getCollection('campaigns');
    const communications = await getCollection('communications');
    
    const { id } = await params;
    
    let campaignId;
    try {
      campaignId = new ObjectId(id);
    } catch (e) {
      campaignId = id;
    }
    
    const campaign = await campaigns.findOne({ _id: campaignId });
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Aggregate real-time stats from communications collection
    const commStats = await communications.aggregate([
      { $match: { campaignId: campaignId } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();

    const aggregated = {
      total: campaign.stats?.total || 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      clicked: 0
    };

    commStats.forEach(stat => {
      if (aggregated.hasOwnProperty(stat._id)) {
        aggregated[stat._id] = stat.count;
      } else if (stat._id === 'queued') {
        // Unsent queued items can be tracked if needed
      }
    });

    const rates = {
      deliveryRate: aggregated.sent > 0 ? (aggregated.delivered / aggregated.sent) * 100 : 0,
      openRate: aggregated.delivered > 0 ? (aggregated.opened / aggregated.delivered) * 100 : 0,
      clickRate: aggregated.opened > 0 ? (aggregated.clicked / aggregated.opened) * 100 : 0
    };

    return NextResponse.json({ 
      stats: aggregated, 
      campaignStats: campaign.stats, // Original stats stored in campaign doc
      rates 
    });
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
