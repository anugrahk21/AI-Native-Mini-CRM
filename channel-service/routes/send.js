/**
 * POST /send — Message Send Endpoint
 * ====================================
 * Accepts a delivery request, validates required fields, immediately responds
 * with 202 Accepted, and kicks off the asynchronous delivery simulation in
 * the background. The caller is notified of status transitions via webhooks.
 */

import { Router } from 'express';
import { simulateDelivery } from '../lib/simulator.js';

const router = Router();

router.post('/send', (req, res) => {
  const { communicationId, campaignId, recipient, message, channel, callbackUrl } = req.body;

  // ── Validate required fields ──────────────────────────────────────────────
  const missing = [];
  if (!communicationId) missing.push('communicationId');
  if (!campaignId)      missing.push('campaignId');
  if (!recipient)       missing.push('recipient');
  if (!message)         missing.push('message');
  if (!channel)         missing.push('channel');
  if (!callbackUrl)     missing.push('callbackUrl');

  if (missing.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      missing,
    });
  }

  // Validate recipient has at least a name and one contact method
  if (!recipient.name || (!recipient.email && !recipient.phone)) {
    return res.status(400).json({
      error: 'Recipient must have a name and at least one contact method (email or phone)',
    });
  }

  // ── Log the incoming request ──────────────────────────────────────────────
  console.log(`📤 [QUEUED] commId=${communicationId} campaign=${campaignId} channel=${channel} → ${recipient.name}`);

  // ── Immediately return 202 — processing happens async ─────────────────────
  res.status(202).json({
    status: 'queued',
    communicationId,
    message: 'Delivery simulation started. Status updates will be sent to the callback URL.',
  });

  // ── Fire-and-forget: kick off the delivery lifecycle simulation ───────────
  simulateDelivery({
    communicationId,
    campaignId,
    recipient,
    message,
    channel,
    callbackUrl,
  });
});

export default router;
