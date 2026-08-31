# Social Media Studio

FlyRank Backend Track Capstone. Turns one blog post into a reviewed, scheduled, idempotently
published multi-platform social campaign.

## What it does

1. **Ingest** a blog post as a URL or pasted Markdown — stored once as the single source of truth.
2. **Generate** platform-specific variants (X, Instagram, Discord, Telegram), each with
   keyword-extracted hashtags and validated against that platform's constraint profile
   (length, hashtag count) before it's ever stored.
3. **Review**: every variant is `draft` until a human approves, edits, or rejects it. An
   unapproved variant cannot be scheduled.
4. **Schedule**: an approved variant gets a time slot and a job row.
5. **Publish**: a separate worker process polls for due jobs and publishes them through a
   `SocialPublisher` adapter — Discord and Telegram are real targets; X and Instagram are
   mock adapters that record what they'd post. Publishing is idempotent (a retried or
   re-run publish call never posts twice) and the worker survives a mid-batch crash
   without duplicating anything.

## Architecture
[blog post: URL or markdown]
|
v
ingest + store ---> variant generator ---> constraint validation
| |
v v
review workflow: draft -> approved | rejected
|
v
scheduler (jobs table, polled by a separate worker process)
|
v
SocialPublisher interface
+-- DiscordPublisher (real — webhook POST)
+-- TelegramPublisher (real — Bot API sendMessage)
+-- MockXPublisher
+-- MockInstagramPublisher
|
v
publish_attempts: one slot = one post, always (idempotency_key UNIQUE)

## Platforms

| Platform  | Type | Adapter                                |
| --------- | ---- | -------------------------------------- |
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
- `DISCORD_WEBHOOK_URL` — from your Discord server's channel Integrations → Webhooks.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` — from BotFather + `getUpdates` (see
  `DESIGN.md` for the exact steps).

Start the API and the worker in two terminals:

```bash
npm start     # API on http://localhost:3000
npm run worker  # polls every 5s for due jobs
```

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

| Method | Route                    | Auth | Notes                                                 |
| ------ | ------------------------ | ---- | ----------------------------------------------------- |
| POST   | `/posts`                 | none | `{ url }` or `{ markdown }`, not both                 |
| GET    | `/posts/:id`             | none |                                                       |
| POST   | `/posts/:id/variants`    | none | `{ platforms: [...] }` optional, defaults to all four |
| PATCH  | `/variants/:id/approve`  | none |                                                       |
| PATCH  | `/variants/:id/reject`   | none |                                                       |
| PATCH  | `/variants/:id/edit`     | none | `{ content }`; re-validates, resets status to `draft` |
| POST   | `/variants/:id/schedule` | none | `{ scheduledAt }`; `409` if not `approved`            |
| POST   | `/slots/:id/publish`     | none | Idempotent — `200` on repeat, `201` on first success  |
| POST   | `/posts/:id/publish-all` | none | Publishes every scheduled slot for a post; `207`      |
| GET    | `/publish-history`       | none |                                                       |

## Known limitations

- No authentication — every route is open. Out of scope for this capstone per the brief.
- Hashtag extraction is frequency + stopword filtering, not true NLP — good enough to prove
  the constraint-validation pipeline, not a production keyword extractor.
- Worker polls every 5 seconds rather than using a push-based trigger — simplest correct
  option for a capstone; a production version would likely use a proper job queue.
- X and Instagram are mock adapters only, per the brief's real-account restrictions.

## Stack

Node.js + Express 5, CommonJS, SQLite (`better-sqlite3`), no external job queue — see
`ROADMAP.md` and `DESIGN.md` for the reasoning behind each choice.