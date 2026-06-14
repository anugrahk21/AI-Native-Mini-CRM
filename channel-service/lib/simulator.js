/**
 * Delivery Lifecycle Simulator
 * ==============================
 * Simulates a realistic multi-stage message delivery pipeline:
 *
 *   SENT  →  DELIVERED (or FAILED)  →  OPENED  →  CLICKED
 *
 * Probabilities and delays are tuned to mimic real-world channel behaviour.
 * Each status transition fires a webhook callback to the CRM backend.
 */

import { sendCallback } from './callback.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns a random integer between min and max (inclusive, in ms). */
const randomDelay = (minMs, maxMs) =>
  Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

/** Promisified setTimeout for clean async/await flow. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Returns true with the given probability (0-1). */
const chance = (probability) => Math.random() < probability;

// ---------------------------------------------------------------------------
// Failure reason pool — picked at random when delivery fails
// ---------------------------------------------------------------------------
const FAILURE_REASONS = [
  'Invalid phone number',
  'Network timeout',
  'Rate limited',
  'Mailbox full',
  'Carrier rejected',
  'Unknown subscriber',
  'Service temporarily unavailable',
];

const pickFailureReason = () =>
  FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];

// ---------------------------------------------------------------------------
// Core simulator
// ---------------------------------------------------------------------------

/**
 * Simulates the full delivery lifecycle for a single message.
 *
 * @param {Object} payload
 * @param {string} payload.communicationId - Unique ID for this communication
 * @param {string} payload.campaignId      - Parent campaign ID
 * @param {Object} payload.recipient       - { name, email, phone }
 * @param {string} payload.message         - Message body
 * @param {string} payload.channel         - Channel type (sms, email, push, whatsapp)
 * @param {string} payload.callbackUrl     - Webhook URL for status updates
 */
export async function simulateDelivery(payload) {
  const { communicationId, campaignId, channel, callbackUrl, recipient } = payload;
  const tag = `[${communicationId.slice(0, 8)}…]`;

  try {
    // ── Step 1: SENT (immediate) ──────────────────────────────────────────
    console.log(`📤 ${tag} SENT via ${channel} → ${recipient.name}`);
    await sendCallback(callbackUrl, {
      communicationId,
      campaignId,
      status: 'SENT',
      timestamp: new Date().toISOString(),
      metadata: { channel },
    });

    // ── Step 2: DELIVERED or FAILED (1-3 s delay) ─────────────────────────
    const deliveryDelay = randomDelay(1000, 3000);
    await sleep(deliveryDelay);

    const delivered = chance(0.92); // 92 % success rate

    if (!delivered) {
      const failureReason = pickFailureReason();
      console.log(`❌ ${tag} FAILED — ${failureReason}`);
      await sendCallback(callbackUrl, {
        communicationId,
        campaignId,
        status: 'FAILED',
        timestamp: new Date().toISOString(),
        metadata: { channel, failureReason },
      });
      return; // lifecycle ends here on failure
    }

    console.log(`✅ ${tag} DELIVERED (after ${deliveryDelay}ms)`);
    await sendCallback(callbackUrl, {
      communicationId,
      campaignId,
      status: 'DELIVERED',
      timestamp: new Date().toISOString(),
      metadata: { channel },
    });

    // ── Step 3: OPENED (2-5 s delay, 65 % of delivered) ──────────────────
    const openDelay = randomDelay(2000, 5000);
    await sleep(openDelay);

    if (!chance(0.65)) {
      console.log(`📭 ${tag} Not opened — lifecycle complete`);
      return;
    }

    console.log(`👀 ${tag} OPENED (after +${openDelay}ms)`);
    await sendCallback(callbackUrl, {
      communicationId,
      campaignId,
      status: 'OPENED',
      timestamp: new Date().toISOString(),
      metadata: { channel },
    });

    // ── Step 4: CLICKED (3-8 s delay, 30 % of opened) ────────────────────
    const clickDelay = randomDelay(3000, 8000);
    await sleep(clickDelay);

    if (!chance(0.30)) {
      console.log(`🙈 ${tag} Not clicked — lifecycle complete`);
      return;
    }

    console.log(`🖱️  ${tag} CLICKED (after +${clickDelay}ms)`);
    await sendCallback(callbackUrl, {
      communicationId,
      campaignId,
      status: 'CLICKED',
      timestamp: new Date().toISOString(),
      metadata: { channel },
    });

    console.log(`🏁 ${tag} Full lifecycle complete`);
  } catch (err) {
    console.error(`💥 ${tag} Simulator error:`, err.message);
  }
}
