/**
 * utils.js — Shared utility functions for crm.ai
 *
 * Pure, side-effect-free helpers used across the frontend.
 * All functions are individually exported for tree-shaking.
 */

// ─── Currency ──────────────────────────────────────────────────────────────────

/**
 * Format a number as Indian Rupees (₹).
 * Uses the en-IN locale so lakhs / crores are comma-separated correctly.
 *
 * @param {number} amount
 * @returns {string} e.g. "₹1,234" or "₹12,34,567"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── Dates ─────────────────────────────────────────────────────────────────────

/**
 * Format a date as a short human-readable string.
 *
 * @param {Date|string|number} date
 * @returns {string} e.g. "Jan 15, 2025"
 */
export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date as a relative time string (e.g. "3 days ago").
 * Falls back to formatDate() for dates older than 30 days.
 *
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';

  const now = Date.now();
  const diffMs = now - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;

  return formatDate(d);
}

// ─── Text ──────────────────────────────────────────────────────────────────────

/**
 * Truncate text to a maximum length, appending "…" if trimmed.
 *
 * @param {string} text
 * @param {number} [maxLength=50]
 * @returns {string}
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

// ─── IDs ───────────────────────────────────────────────────────────────────────

/**
 * Generate a random unique ID (URL-safe, 16-char hex).
 * Not cryptographically secure — use for UI keys only.
 *
 * @returns {string}
 */
export function generateId() {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// ─── Math ──────────────────────────────────────────────────────────────────────

/**
 * Calculate a percentage with safe division.
 *
 * @param {number} part
 * @param {number} total
 * @param {number} [decimals=1]
 * @returns {number} e.g. 42.5
 */
export function calcPercentage(part, total, decimals = 1) {
  if (!total || total === 0) return 0;
  return Number(((part / total) * 100).toFixed(decimals));
}

// ─── Channel & Status Mappings ─────────────────────────────────────────────────

const CHANNEL_ICONS = {
  whatsapp: '💬',
  sms: '📱',
  email: '📧',
  rcs: '💎',
};

/**
 * Get the emoji icon for a delivery channel.
 *
 * @param {string} channel
 * @returns {string}
 */
export function getChannelIcon(channel) {
  return CHANNEL_ICONS[channel?.toLowerCase()] || '📨';
}

const STATUS_COLORS = {
  sent: 'text-blue-400 bg-blue-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  failed: 'text-red-400 bg-red-400/10',
  opened: 'text-purple-400 bg-purple-400/10',
  clicked: 'text-orange-400 bg-orange-400/10',
  pending: 'text-yellow-400 bg-yellow-400/10',
};

/**
 * Get Tailwind color classes for a campaign / message status.
 *
 * @param {string} status
 * @returns {string} Tailwind utility classes
 */
export function getStatusColor(status) {
  return STATUS_COLORS[status?.toLowerCase()] || 'text-gray-400 bg-gray-400/10';
}

// ─── Debounce ──────────────────────────────────────────────────────────────────

/**
 * Debounce a function: delays invocation until `delay` ms after the last call.
 *
 * @param {Function} fn
 * @param {number} [delay=300]
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// ─── API ───────────────────────────────────────────────────────────────────────

/**
 * Build a full API URL from a relative path.
 * Reads NEXT_PUBLIC_API_URL from env, falls back to '/api'.
 *
 * @param {string} path - e.g. '/customers' or 'customers'
 * @returns {string} e.g. 'http://localhost:3000/api/customers'
 */
export function apiUrl(path) {
  const base =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '/api';
  // Normalise: strip trailing slash from base, ensure leading slash on path
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
