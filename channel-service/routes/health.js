/**
 * GET /health — Health Check Endpoint
 * =====================================
 * Returns basic service health information for monitoring and load-balancer
 * probes. Includes service name, current timestamp, and process uptime.
 */

import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'crm-ai-channel-service',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

export default router;
