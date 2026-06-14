/**
 * Webhook Callback Handler
 * ==========================
 * Sends delivery status updates back to the CRM backend via HTTP POST.
 * Includes retry logic with exponential backoff and a shared secret header
 * so the receiving server can verify authenticity.
 *
 * Uses the native fetch API available in Node 18+.
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const WEBHOOK_SECRET = process.env.CALLBACK_SECRET || 'crm-ai-default-secret';
const MAX_RETRIES    = 3;
const BASE_DELAY_MS  = 1000; // 1 s → 2 s → 4 s (exponential backoff)

// ---------------------------------------------------------------------------
// Core callback sender
// ---------------------------------------------------------------------------

/**
 * Sends a status update payload to the given callback URL.
 *
 * @param {string} callbackUrl - The CRM backend webhook endpoint
 * @param {Object} data        - Status payload to deliver
 * @param {string} data.communicationId
 * @param {string} data.campaignId
 * @param {string} data.status   - SENT | DELIVERED | FAILED | OPENED | CLICKED
 * @param {string} data.timestamp
 * @param {Object} data.metadata - { channel, failureReason? }
 */
export async function sendCallback(callbackUrl, data) {
  const tag = `[${data.communicationId.slice(0, 8)}…]`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': WEBHOOK_SECRET,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log(
          `   🔔 ${tag} Callback → ${data.status} delivered to CRM (attempt ${attempt})`
        );
        return; // success — stop retrying
      }

      // Non-2xx response — log and retry
      console.warn(
        `   ⚠️  ${tag} Callback HTTP ${response.status} (attempt ${attempt}/${MAX_RETRIES})`
      );
    } catch (err) {
      // Network-level error (DNS, connection refused, timeout, etc.)
      console.warn(
        `   ⚠️  ${tag} Callback failed (attempt ${attempt}/${MAX_RETRIES}): ${err.message}`
      );
    }

    // ── Exponential backoff before next attempt ───────────────────────────
    if (attempt < MAX_RETRIES) {
      const backoff = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1 s, 2 s, 4 s
      console.log(`   ⏳ ${tag} Retrying in ${backoff}ms…`);
      await new Promise((resolve) => setTimeout(resolve, backoff));
    }
  }

  // All retries exhausted
  console.error(
    `   ❌ ${tag} Callback FAILED after ${MAX_RETRIES} attempts — status ${data.status} lost`
  );
}
