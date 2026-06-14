# Backend Schema Document — crm.ai

## Database

**MongoDB Atlas** (M0 free tier). All collections use auto-generated `_id` (ObjectId) and include `createdAt` / `updatedAt` timestamps via Mongoose.

---

## Collections

### customers

| Field | Type | Description |
|---|---|---|
| name | String | Full name |
| email | String | Unique, indexed |
| phone | String | With country code |
| age | Number | Optional |
| gender | String | `male` / `female` / `other` |
| city | String | City of residence |
| state | String | State / province |
| totalSpent | Number | Denormalized aggregate |
| totalOrders | Number | Denormalized count |
| lastOrderDate | Date | Most recent order |
| firstOrderDate | Date | Earliest order |
| averageOrderValue | Number | `totalSpent / totalOrders` |
| tags | [String] | Marketer-defined labels |

**Indexes**: `{ email: 1 }` unique · `{ phone: 1 }` · `{ city: 1, state: 1 }` · `{ totalSpent: -1 }` · `{ lastOrderDate: -1 }`

---

### orders

| Field | Type | Description |
|---|---|---|
| customerId | ObjectId | Ref → customers |
| orderNumber | String | Unique identifier |
| items | Array | `[{ name, category, quantity, price }]` |
| totalAmount | Number | Sum of line items |
| status | String | `pending` / `confirmed` / `shipped` / `delivered` / `cancelled` |
| orderDate | Date | When the order was placed |

**Indexes**: `{ customerId: 1 }` · `{ orderNumber: 1 }` unique · `{ orderDate: -1 }` · `{ "items.category": 1 }`

---

### segments

| Field | Type | Description |
|---|---|---|
| name | String | Segment display name |
| description | String | Optional summary |
| rules.conditions | Array | `[{ field, operator, value }]` |
| rules.logic | String | `AND` / `OR` |
| customerCount | Number | Cached audience size |
| aiGenerated | Boolean | `true` if created via AI |
| naturalLanguageQuery | String | Original prompt (if AI-generated) |

**Indexes**: `{ name: 1 }` · `{ aiGenerated: 1 }`

---

### campaigns

| Field | Type | Description |
|---|---|---|
| name | String | Campaign title |
| segmentId | ObjectId | Ref → segments |
| channel | String | `whatsapp` / `sms` / `email` / `rcs` |
| messageTemplate | String | Message body with `{{placeholders}}` |
| subject | String | Email subject (optional) |
| status | String | `draft` / `sending` / `sent` / `failed` |
| stats.total | Number | Total recipients |
| stats.sent | Number | Messages dispatched |
| stats.delivered | Number | Confirmed delivered |
| stats.failed | Number | Delivery failures |
| stats.opened | Number | Opens tracked |
| stats.clicked | Number | Click-throughs |
| aiGenerated | Boolean | Created via AI co-pilot |

**Indexes**: `{ segmentId: 1 }` · `{ status: 1 }` · `{ channel: 1 }` · `{ createdAt: -1 }`

---

### communications

| Field | Type | Description |
|---|---|---|
| campaignId | ObjectId | Ref → campaigns |
| customerId | ObjectId | Ref → customers |
| channel | String | Delivery channel used |
| message | String | Rendered message body |
| status | String | `PENDING` / `SENT` / `DELIVERED` / `FAILED` |
| statusHistory | Array | `[{ status, timestamp }]` |
| sentAt | Date | When dispatched |
| deliveredAt | Date | When confirmed delivered |
| openedAt | Date | When opened (if tracked) |
| clickedAt | Date | When clicked (if tracked) |

**Indexes**: `{ campaignId: 1, status: 1 }` · `{ customerId: 1 }` · `{ status: 1 }` · `{ sentAt: -1 }`

---

## Denormalization Strategy

Customer aggregates (`totalSpent`, `totalOrders`, `averageOrderValue`, `lastOrderDate`) are **denormalized onto the customer document** and updated on every order write. This avoids expensive `$lookup` aggregations when evaluating segment rules against the full customer collection. Campaign `stats` are similarly rolled up from the `communications` collection on each webhook callback to enable instant dashboard reads.
