# Evidence

One proof per requirement from the capstone brief, Section 5.

## 1. Ingestion — URL or Markdown, stored once

<PASTE: Stage 2 checkpoint — POST /posts with markdown, GET /posts/:id returning it byte-identical>

## 2. Constraint profiles enforced by code

<PASTE: Stage 3 checkpoint — long-post 422 on the X platform, error naming the exact rule
broken, e.g. "exceeds 280 char limit for x (…) chars">

## 3. Review workflow — unapproved variant cannot be scheduled

<PASTE: Stage 4 checkpoint — POST /variants/:id/schedule on a draft variant returning 409
with { "error": "variant must be approved before scheduling" }>

## 4. Adapter layer — swap changes config, not code

<PASTE: Stage 5 checkpoint — PLATFORM_ADAPTER_MAP changed in .env from mock_x to
mock_instagram, log line showing [MockInstagram] instead of [MockX], zero code diff outside .env>

## 5. Idempotent publish — retried call never posts twice

<PASTE: Stage 7 checkpoint — first POST /slots/:id/publish returns 201 with an external_ref;
second call on the same slot returns 200 with the SAME external_ref; Discord/Telegram channel
shows exactly one message>

## 6. Durable scheduling — worker crash mid-batch, zero duplicates on restart

<PASTE: Stage 8 checkpoint — 3+ jobs scheduled seconds apart, worker killed right after the
first "done" log line, restarted, remaining jobs complete, already-done job not re-published.
Include the jobs table before/after (via DB Browser) and exact kill/restart timestamps>

## 7. Publish history

<PASTE: GET /publish-history showing all attempts from the runs above, one row per slot>

## 8. Secrets clean

`.env` is listed in `.gitignore` (see commit history — `.gitignore` was the first file
committed to the repo, before any code). `.env.example` has every variable with placeholder
values, no real tokens.