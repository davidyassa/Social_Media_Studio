# Design — Social Media Studio

## Problem

Turn one blog post into platform-specific social variants, route each through a human
approval gate, then publish it exactly once at a scheduled time — surviving retries and
worker crashes without duplicate posts.

## Non-goal

No image generation, no analytics/engagement tracking, no real X or Instagram accounts.
Those platforms get mock adapters only; Discord and Telegram are the real publish targets.

## Constraint profiles

| Platform         | Max length | Tone                     | Hashtag cap |
| ---------------- | ---------- | ------------------------ | ----------- |
| X (mock)         | 280 chars  | Punchy, direct           | 3           |
| Instagram (mock) | 2200 chars | Visual, casual           | 10          |
| Discord (real)   | 2000 chars | Casual, informative      | 5           |
| Telegram (real)  | 4096 chars | Conversational, informal | 5           |

Profiles live as plain data in `src/constraints.js` — no rule is hardcoded inside the
generator or validator logic itself; both read from this table.

## SocialPublisher interface

Every adapter implements the same contract:

```js
// src/adapters/SocialPublisher.js
class SocialPublisher {
  /**
   * @param {object} variant - { id, platform, content }
   * @param {string} idempotencyKey - unique per (variantId, slotId)
   * @returns {Promise<{ externalRef: string }>} - reference to the published post
   */
  async publish(variant, idempotencyKey) {
    throw new Error("publish() not implemented");
  }
}
module.exports = SocialPublisher;
```

Adapter tree:  
- SocialPublisher  
- DiscordPublisher (real — webhook POST)  
- TelegramPublisher (real — Bot API sendMessage)  
- MockXPublisher (writes to publish_attempts + preview)  
- MockInstagramPublisher  


The service layer calls `publisher.publish(variant, idempotencyKey)` and never knows or
cares which of these four it's talking to.

## Data model

posts
id INTEGER PRIMARY KEY
source TEXT -- original URL or raw markdown
content TEXT -- resolved markdown, the single source of truth
created_at TEXT

variants
id INTEGER PRIMARY KEY
post_id INTEGER -- FK -> posts.id
platform TEXT -- 'x' | 'instagram' | 'discord' | 'telegram'
content TEXT
status TEXT -- 'draft' | 'approved' | 'rejected' | 'published'
created_at TEXT

slots
id INTEGER PRIMARY KEY
variant_id INTEGER -- FK -> variants.id
scheduled_at TEXT

publish_attempts
id INTEGER PRIMARY KEY
slot_id INTEGER -- FK -> slots.id
idempotency_key TEXT UNIQUE -- ${variantId}:${slotId}
status TEXT -- 'success' | 'failed'
external_ref TEXT -- adapter's reference to the published post
created_at TEXT

jobs
id INTEGER PRIMARY KEY
slot_id INTEGER -- FK -> slots.id
status TEXT -- 'pending' | 'claimed' | 'done' | 'failed'
claimed_at TEXT


## Why this shape

- `posts` and `variants` are separate so regenerating a variant never touches the source.
- `slots` is separate from `variants` so one variant could (later, as a stretch) have
  multiple scheduled attempts without changing the review model.
- `publish_attempts.idempotency_key` carries a `UNIQUE` constraint — the database is the
  second line of defense against a duplicate post, not just application logic.
- `jobs` is deliberately its own table rather than a status column on `slots`, so the
  worker's claim step (`UPDATE jobs SET status='claimed' WHERE status='pending'`) is a
  single atomic statement with no risk of racing the scheduling logic.
- Two real adapters (Discord, Telegram) rather than one gives a genuine second data point
  for the "adapter swap changes config, not code" proof — both need to route through the
  exact same interface despite very different transport shapes (webhook POST vs. bot API).