# Social Media Studio

FlyRank Backend Track Capstone. Turns one blog post into a reviewed, scheduled, idempotently
published multi-platform social campaign.

## What it does

1. **Ingest** a blog post as a URL or pasted Markdown — stored once as the single source of truth.
2. **Generate** platform-specific variants (X, Instagram, Discord, Telegram), each with
   keyword-extracted hashtags and validated against that platform's constraint profile
   (length, hashtag count) before it's ever stored. A variant that breaks a rule never becomes
   a row.
3. **Review**: every variant is `draft` until a human approves, edits, or rejects it. An
   unapproved variant cannot be scheduled. An edit re-validates and resets status to `draft` —
   no silent re-approval after a content change.
4. **Schedule**: an approved variant gets a time slot (`slots`) and a job (`jobs`), created
   together in one call.
5. **Publish**, two ways:
   - **Scheduled** — a separate worker process polls for due jobs and publishes them through a
     `SocialPublisher` adapter.
   - **On demand** — `POST /slots/:id/publish` (one) or `POST /posts/:id/publish-all` (every
     scheduled platform for a post, in one click) bypass the schedule and publish immediately.
   - Discord and Telegram are real targets; X and Instagram are mock adapters that record what
     they'd post. Publishing is idempotent (a retried or re-run publish call never posts twice),
     and the worker recovers cleanly if it's killed mid-publish and restarted.
6. **History** — every attempt, visible via `GET /publish-history`.

## Architecture

```
[blog post: URL or markdown]
        |
        v
   ingest + store  --->  variant generator (+ keyword hashtags)  --->  constraint validation
        |                                                                     |
        v                                                                     v
   review workflow: draft -> approved | rejected  <---------------------------+
        |
        v
   schedule: creates a slots row + a jobs row together
        |
        v
   worker (separate process, on startup: reclaims any job orphaned in 'claimed'
   by a previous crashed run, then polls every 5s for due jobs)
        |
        v
   atomic claim (UPDATE ... WHERE status='pending') ---> publish ---> mark done/failed
        |
        v
   SocialPublisher interface
        +-- DiscordPublisher   (real — webhook POST, ?wait=true for the message id)
        +-- TelegramPublisher  (real — Bot API sendMessage)
        +-- MockXPublisher
        +-- MockInstagramPublisher
        |
        v
   publish_attempts: idempotency_key UNIQUE — one slot = one post, always
```

## Platforms

| Platform  | Type | Adapter                                |
| --------- | ---- | --------------------------------------- |
| Discord   | Real | Webhook `POST`                         |
| Telegram  | Real | Bot API `sendMessage`                  |
| X         | Mock | Writes to `publish_attempts` + preview |
| Instagram | Mock | Writes to `publish_attempts` + preview |

## Run it

```bash
git clone https://github.com/davidyassa/Social_Media_Studio.git
cd Social_Media_Studio
npm install
cp .env.example .env
```

Fill in `.env`:
- `DISCORD_WEBHOOK_URL` — from your Discord server's channel → Integrations → Webhooks.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` — from BotFather + `getUpdates` (see
  `DESIGN.md` for the exact steps).

Start the API and the worker together:

```bash
npm run dev     # runs the API and the worker concurrently, labeled output
```

Or separately, in two terminals:

```bash
npm start        # API on http://localhost:3000
npm run worker   # polls every 5s for due jobs; reclaims orphaned jobs on startup
```

`GET /health` reports the server is up and lists the tables that exist, useful as a first
sanity check after `npm start`.

## Seed a sample run

```bash
curl -i -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"markdown":"Idempotency keys are the difference between a retry and a duplicate post."}'

curl -i -X POST http://localhost:3000/posts/1/variants -H "Content-Type: application/json" -d '{}'
curl -i -X PATCH http://localhost:3000/variants/1/approve
curl -i -X POST http://localhost:3000/variants/1/schedule \
  -H "Content-Type: application/json" \
  -d '{"scheduledAt":"2026-08-30T15:00:00.000Z"}'
```

Watch the worker terminal — it publishes on the next poll cycle. Check `GET /publish-history`
for the result.

## API reference

| Method | Route                     | Auth | Notes                                                  |
| ------ | -------------------------- | ---- | ------------------------------------------------------- |
| GET    | `/`                         | none | Service name and version                                |
| GET    | `/health`                   | none | Liveness check + table list                              |
| POST   | `/posts`                    | none | `{ url }` or `{ markdown }`, not both                    |
| GET    | `/posts/:id`                | none |                                                           |
| POST   | `/posts/:id/variants`       | none | `{ platforms: [...] }` optional, defaults to all four    |
| PATCH  | `/variants/:id/approve`     | none |                                                           |
| PATCH  | `/variants/:id/reject`      | none |                                                           |
| PATCH  | `/variants/:id/edit`        | none | `{ content }`; re-validates, resets status to `draft`    |
| POST   | `/variants/:id/schedule`    | none | `{ scheduledAt }`; `409` if not `approved`               |
| POST   | `/slots/:id/publish`        | none | Idempotent — `200` on repeat, `201` on first success     |
| POST   | `/posts/:id/publish-all`    | none | Publishes every scheduled slot for a post now; `207`     |
| GET    | `/publish-history`          | none |                                                           |

## Known limitations

- **No authentication** — every route is open. Out of scope for this capstone per the brief.
- **Hashtag extraction** is frequency-count + stopword filtering, not true NLP — good enough to
  prove the constraint-validation pipeline, not a production keyword extractor.
- **Worker polls every 5 seconds** rather than using a push-based trigger — simplest correct
  option at this scale; a production version would likely use a proper job queue.
- **At-least-once delivery, not exactly-once, across a crash mid-HTTP-call.** If the worker is
  killed *during* the network call to Discord/Telegram — after the platform has received and
  posted the message, but before the response comes back and gets written to
  `publish_attempts` — a restart will retry it and genuinely double-post. This is inherent to
  any local-crash-recovery system when the external platform doesn't support a client-supplied
  idempotency key; the app-side idempotency guarantee covers every other failure window, but not
  this exact one.
- **Editing or rejecting a variant after it's already scheduled doesn't cancel its pending
  job.** `PATCH /variants/:id/edit` and `/reject` change the variant's status but don't touch
  any `slots`/`jobs` rows created while it was `approved`. A variant edited back to `draft`
  after scheduling can still be published by that earlier job when it comes due. Known gap, not
  yet fixed — see `EVIDENCE.md` for the reasoning.
- **The startup job-reclaim assumes a single worker process.** It unconditionally resets every
  `'claimed'` job back to `'pending'` on boot, which is only safe because nothing else could be
  legitimately mid-publish on it right now. Running two worker processes concurrently would
  need a staleness window instead (only reclaim jobs claimed longer than some timeout), not an
  unconditional reset.
- X and Instagram are mock adapters only, per the brief's real-account restrictions.

## Stack

Node.js + Express 5, CommonJS, SQLite (`better-sqlite3`), no external job queue — see `DESIGN.md` for the reasoning behind each choice.
