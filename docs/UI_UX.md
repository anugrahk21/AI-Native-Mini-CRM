# UI/UX Design Document — crm.ai

## Design Tokens

| Token | Value |
|---|---|
| Background | `#0a0f1e` (dark navy) |
| Surface / Card | `rgba(255,255,255,0.05)` with backdrop-blur |
| Accent Gradient | `#3b82f6` → `#8b5cf6` (electric blue → purple) |
| Text Primary | `#f1f5f9` |
| Text Secondary | `#94a3b8` |
| Font Family | **Inter** (Google Fonts) |
| Border Radius | `12px` (cards), `8px` (inputs) |

## Layout Structure

```
┌──────────┬──────────────────────────────┬────────────┐
│          │                              │            │
│ Sidebar  │       Main Content           │  AI Chat   │
│  Nav     │       (scrollable)           │  Panel     │
│          │                              │ (slide-in) │
│          │                              │            │
└──────────┴──────────────────────────────┴────────────┘
```

- **Sidebar** — Fixed left, icon + label nav. Sections: Dashboard, Customers, Segments, Campaigns.
- **Main Content** — Fluid center area, max-width constrained for readability.
- **AI Chat Panel** — Slides in from the right; toggled via floating button with accent gradient.

## Key Screens

### Dashboard
- KPI cards: Total Customers, Active Campaigns, Delivery Rate, Audience Reach.
- Charts: Campaign performance over time, channel distribution (pie), recent activity feed.

### Customers
- Searchable, sortable data table with pagination.
- Click-through to customer profile: order history, segment memberships, timeline.

### Segments
- Visual **rule builder**: field → operator → value rows, AND/OR logic toggle.
- AI-generated segments display the original natural-language query.
- Live audience count preview before saving.

### Campaigns
- **Wizard flow**: Select Segment → Choose Channel → Compose Message → Review → Send.
- Post-send analytics: delivery funnel (sent → delivered → opened → clicked), per-recipient log.

## AI Chat Panel

- **Trigger**: Floating gradient button (bottom-right) or keyboard shortcut.
- **Streaming**: Token-by-token response rendering for real-time feel.
- **Function Calling**: AI can create segments, launch campaigns, pull stats — results render inline as interactive cards.
- **Context**: Chat is aware of the current screen for contextual suggestions.

## Design Principles

| Principle | Implementation |
|---|---|
| **Glassmorphism** | Semi-transparent cards with `backdrop-filter: blur(16px)` and subtle borders |
| **Micro-animations** | Framer Motion for page transitions, hover lifts, and skeleton loaders |
| **Responsive** | Desktop-first; graceful adaptation for tablet (≥768 px) |
| **Accessibility** | WCAG AA contrast on all text; focus-visible outlines; keyboard navigation |
| **Consistency** | Shared component library (Button, Card, Input, Table, Modal) with variant props |
