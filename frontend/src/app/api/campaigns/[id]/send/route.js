import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { buildMongoQuery } from '@/lib/ai-tools';
import { ObjectId } from 'mongodb';

const CHANNEL_SERVICE_URL = process.env.CHANNEL_SERVICE_URL || 'http://localhost:4000';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request, { params }) {
  try {
    const campaigns = await getCollection('campaigns');
    const segments = await getCollection('segments');
    const customers = await getCollection('customers');
    const communications = await getCollection('communications');
    
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
    
    if (campaign.status === 'sending' || campaign.status === 'sent') {
      return NextResponse.json({ error: 'Campaign already sent or sending' }, { status: 400 });
    }

    // Get segment rules
    let segment;
    try {
      segment = await segments.findOne({ _id: new ObjectId(campaign.segmentId) });
    } catch (e) {
      segment = await segments.findOne({ _id: campaign.segmentId });
    }

    if (!segment) {
      return NextResponse.json({ error: 'Target segment not found' }, { status: 404 });
    }

    const query = buildMongoQuery(segment.rules?.conditions || [], segment.rules?.logic || 'AND');
    const targetCustomers = await customers.find(query).toArray();

    // Update campaign status to 'sending'
    await campaigns.updateOne(
      { _id: campaign._id },
      { 
        $set: { 
          status: 'sending', 
          'stats.total': targetCustomers.length,
          updatedAt: new Date()
        } 
      }
    );

    let totalSent = 0;

    // Send to each customer
    for (const customer of targetCustomers) {
      // Personalize message
      let personalizedMsg = campaign.messageTemplate || '';
      personalizedMsg = personalizedMsg.replace(/{{name}}/g, customer.name || 'Customer');
      personalizedMsg = personalizedMsg.replace(/{{email}}/g, customer.email || '');
      personalizedMsg = personalizedMsg.replace(/{{city}}/g, customer.city || '');

      // Create communication doc
      const commId = new ObjectId();
      const commDoc = {
        _id: commId,
        campaignId: campaign._id,
        customerId: customer._id,
        channel: campaign.channel,
        message: personalizedMsg,
        status: 'queued',
        statusHistory: [{ status: 'queued', timestamp: new Date() }],
        createdAt: new Date()
      };

      await communications.insertOne(commDoc);

      // Trigger Channel Service
      try {
        const payload = {
          communicationId: commId.toString(),
          campaignId: campaign._id.toString(),
          recipient: { 
            name: customer.name, 
            email: customer.email, 
            phone: customer.phone 
          },
          message: personalizedMsg,
          channel: campaign.channel,
          callbackUrl: `${APP_URL}/api/webhooks/delivery-receipt`
        };

        // Fire and forget
        fetch(`${CHANNEL_SERVICE_URL}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => {
          console.error(`Failed to trigger channel service for ${commId}:`, err.message);
        });

        totalSent++;
      } catch (err) {
        console.error(`Error sending to customer ${customer._id}:`, err);
        // Mark as failed locally if HTTP fails completely
        await communications.updateOne(
          { _id: commId },
          { 
            $set: { status: 'failed', failedAt: new Date(), failureReason: err.message },
            $push: { statusHistory: { status: 'failed', timestamp: new Date() } }
          }
        );
        await campaigns.updateOne({ _id: campaign._id }, { $inc: { 'stats.failed': 1 } });
      }
    }

    // Update campaign status to 'sent'
    await campaigns.updateOne(
      { _id: campaign._id },
      { 
        $set: { status: 'sent', sentAt: new Date(), updatedAt: new Date() } 
      }
    );

    return NextResponse.json({ success: true, totalSent, campaignId: campaign._id });
  } catch (error) {
    console.error('Error sending campaign:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
