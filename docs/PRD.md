# Product Requirements Document — crm.ai

## Overview

**crm.ai** is an AI-Native Mini CRM designed for D2C and retail brand marketers. It replaces fragmented spreadsheet-and-dashboard workflows with a single conversational interface where marketers describe intent in natural language and the AI co-pilot executes.

## Target Users

| Persona | Description |
|---|---|
| **Brand Marketer** | Runs campaigns across WhatsApp, SMS, Email, RCS for a D2C brand |
| **Growth Lead** | Builds audience segments and monitors campaign performance |
| **Ops Manager** | Ingests customer/order data and ensures delivery health |

## Core Features

### 1. Data Ingestion
- Bulk import of **customers** and **orders** via CSV or API.
- Real-time aggregation of per-customer metrics (total spent, order count, AOV).

### 2. AI-Powered Segmentation
- Natural-language segment creation — e.g., *"High-value women in Mumbai who haven't ordered in 90 days."*
- Rule builder UI as a visual fallback; AI pre-fills conditions.

### 3. Multi-Channel Campaigns
- Supported channels: **WhatsApp · SMS · Email · RCS**.
- Campaign wizard: pick segment → choose channel → craft message (AI-assisted) → send.
- Async delivery loop with real-time status callbacks.

### 4. Performance Analytics
- Per-campaign stats: sent, delivered, failed, opened, clicked.
- Dashboard KPIs: total customers, active campaigns, delivery rate, audience reach.

### 5. AI Chat Co-Pilot
- Always-accessible panel for conversational CRM actions.
- Function calling: the AI can create segments, launch campaigns, and pull analytics on the marketer's behalf.
- Streaming responses for a real-time feel.

## AI Philosophy

> AI is **woven into every step**, not bolted on.

The conversational co-pilot is the **primary workflow surface**. Every feature — segmentation, campaign creation, analytics — is reachable through natural language. The traditional UI exists as a complementary visual layer, not the default.

## Success Metrics

| Metric | Target |
|---|---|
| Campaign delivery rate | ≥ 95 % |
| Audience reach per campaign | Trackable per segment size |
| Marketer time saved | ≥ 50 % vs. manual workflow |
| AI suggestion acceptance rate | ≥ 70 % |

## Out of Scope (v1)

- Drag-and-drop email template editor.
- Real-time event streaming (webhooks inbound from stores).
- Multi-tenant / team-based access control.
