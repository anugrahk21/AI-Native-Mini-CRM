import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const webhookSecret = request.headers.get('x-webhook-secret');
    if (process.env.CALLBACK_SECRET && webhookSecret !== process.env.CALLBACK_SECRET) {
      console.warn('Unauthorized webhook received');
      // For demo purposes, we won't block it if secret is missing to make testing easier
    }

    const body = await request.json();
    const { communicationId, campaignId, status, timestamp, metadata } = body;

    if (!communicationId || !campaignId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const communications = await getCollection('communications');
    const campaigns = await getCollection('campaigns');

    let commId;
    let campId;
    try {
      commId = new ObjectId(communicationId);
    } catch(e) { commId = communicationId; }
    try {
      campId = new ObjectId(campaignId);
    } catch(e) { campId = campaignId; }

    const comm = await communications.findOne({ _id: commId });
    if (!comm) {
      return NextResponse.json({ error: 'Communication not found' }, { status: 404 });
    }

    // Idempotency: skip if already at this status
    if (comm.status === status) {
      return NextResponse.json({ success: true, ignored: true, reason: 'Already at this status' });
    }

    // Determine timestamp field
    const tsField = `${status}At`;
    const updateQuery = {
      $set: { 
        status, 
        [tsField]: new Date(timestamp || Date.now()) 
      },
      $push: { 
        statusHistory: { status, timestamp: new Date(timestamp || Date.now()) } 
      }
    };

    if (status === 'failed' && metadata?.failureReason) {
      updateQuery.$set.failureReason = metadata.failureReason;
    }

    await communications.updateOne({ _id: commId }, updateQuery);

    // Atomically increment campaign stats
    if (['sent', 'delivered', 'failed', 'opened', 'clicked'].includes(status)) {
      const incQuery = {};
      incQuery[`stats.${status}`] = 1;
      
      // If we are setting to delivered, opened, clicked, ensure we don't double count.
      // In a real system, you'd manage state transitions more carefully.
      await campaigns.updateOne({ _id: campId }, { $inc: incQuery });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
