/**
 * crm.ai — Channel Delivery Service
 * ===================================
 * A stubbed Express microservice that simulates multi-channel message delivery
 * (SMS, email, push, WhatsApp). It accepts send requests, simulates a realistic
 * delivery lifecycle (SENT → DELIVERED → OPENED → CLICKED), and fires webhook
 * callbacks to the main CRM backend at each status transition.
 *
 * This service is designed to run independently and communicate with the main
 * crm.ai backend exclusively via HTTP webhooks.
 */

import express from 'express';
import cors from 'cors';

import sendRouter from './routes/send.js';
import healthRouter from './routes/health.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------------------
// Express app setup
// ---------------------------------------------------------------------------
const app = express();

// Middleware — allow all origins for demo/dev convenience
app.use(cors());

// Parse incoming JSON bodies (with a generous 1 MB limit)
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/', sendRouter);   // POST /send
app.use('/', healthRouter); // GET  /health

// Catch-all 404 for undefined routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('💥 Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('┌──────────────────────────────────────────────┐');
  console.log('│       📡  crm.ai Channel Service             │');
  console.log('│──────────────────────────────────────────────│');
  console.log(`│  ➜  Running on http://localhost:${PORT}          │`);
  console.log(`│  ➜  Environment: ${process.env.NODE_ENV || 'development'}            │`);
  console.log('│  ➜  POST /send   — queue a message           │');
  console.log('│  ➜  GET  /health — service health check       │');
  console.log('└──────────────────────────────────────────────┘');
  console.log('');
});

export default app;
