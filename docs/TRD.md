# Technical Requirements Document — crm.ai

## Technology Stack

| Layer | Technology | Host |
|---|---|---|
| Frontend + API | Next.js 14 (App Router) | Vercel |
| Database | MongoDB Atlas (M0 free tier) | Atlas Cloud |
| Channel Service | Express.js micro-service | Render |
| AI — Primary | Google Gemini (chat + function calling) | API |
| AI — Fallback | Groq (LLaMA-based, low-latency) | API |

## Architecture

A **two-service design** keeps the CRM app decoupled from delivery infrastructure.

```
┌─────────────┐        REST         ┌──────────────────┐
│  CRM App    │ ──── /api/send ───▶ │ Channel Service  │
│ (Next.js)   │                     │ (Express.js)     │
│             │ ◀── /api/webhook ── │                  │
└─────────────┘     (callbacks)     └──────────────────┘
```

### Delivery Loop

1. **Campaign Send** — CRM posts audience + message to Channel Service.
2. **Channel Service** — Simulates per-recipient delivery (10–90 % success).
3. **Async Callbacks** — Status updates (`SENT → DELIVERED / FAILED`) posted back via webhook.
4. **Stats Update** — CRM upserts communication logs and rolls up campaign stats.

## API Contracts

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/customers` | GET / POST | List & create customers |
| `/api/orders` | GET / POST | List & create orders |
| `/api/segments` | GET / POST / PUT | CRUD segments, evaluate rules |
| `/api/campaigns` | GET / POST / PUT | CRUD campaigns, trigger send |
| `/api/campaigns/[id]/send` | POST | Dispatch to Channel Service |
| `/api/ai/chat` | POST | Conversational AI with function calling |
| `/api/webhook/status` | POST | Receive delivery callbacks |

## Data Flow

```
Marketer ──▶ AI Chat / UI ──▶ Next.js API ──▶ MongoDB
                                    │
                                    ▼
                            Channel Service ──▶ Webhook ──▶ MongoDB
```

## Scaling Considerations

| Concern | Current (MVP) | At Scale |
|---|---|---|
| Message dispatch | Synchronous loop | Bull / RabbitMQ job queue |
| Database | Single Atlas M0 | Sharded cluster + read replicas |
| Analytics | Real-time aggregation | Pre-computed via Change Streams pipeline |
| AI rate limits | Sequential calls | Request queue with back-pressure |

## Error Handling

- **AI Fallback** — If Gemini fails or times out, the request is re-routed to Groq automatically.
- **Retry Logic** — Channel Service retries failed deliveries up to 3 times with exponential back-off.
- **Idempotent Webhooks** — Callbacks include a unique `communicationId`; duplicate POSTs are safely ignored.
- **Graceful Degradation** — If the Channel Service is unreachable, campaigns are queued with status `PENDING` for later retry.
