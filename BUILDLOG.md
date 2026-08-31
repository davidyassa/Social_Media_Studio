# Build Log — AI Usage

Honest account of where Claude helped and where it didn't, stage by stage. The intent isn't
"AI wrote 0% or 100%" — it's showing where the judgment calls actually happened.

## Stage 0 — Design

AI drafted the initial `DESIGN.md` schema and the `SocialPublisher` interface signature. I
changed the real-target platforms from the brief's suggested Telegram/Mastodon/Discord mix
to specifically Discord + Telegram, and picked X + Instagram as the mocks — that platform
selection was my call, not AI's suggestion.

## Stages 1–6 — Scaffolding, ingestion, generation, review, adapters

AI generated the repository/service/route layering for each stage, matching the pattern
already established in my `CRUD_API` project. I reviewed each stage's checkpoint myself in
Hoppscotch before moving on, and caught the sequencing issue where Stage 5's publish route
had no idempotency guard yet by design — I confirmed that gap was intentional (Stage 7's
job) rather than assuming it was a bug.

## Stage 7 — Idempotency

AI proposed the two-layer defense (check-first, then the UNIQUE constraint as a fallback for
races). I tested the actual race condition isn't really exercisable by a single Hoppscotch
client hitting one endpoint sequentially — the fallback layer is defensive against a
scenario (two concurrent publish calls) I didn't independently construct a test for. Worth
being upfront about: the idempotency *behavior* is verified end-to-end, but the specific
"two requests race past the check-first simultaneously" path is unit-tested by design
reasoning, not by a reproduced concurrent-request test.

## Stage 8 — Durable worker

AI wrote the initial `findDuePendingJobs()` query comparing `scheduled_at` as a raw string.
**I found and fixed the bug**: string comparison on ISO timestamps breaks across differing
timezone offsets or formats. I rewrote it to use SQLite's `julianday()` on both sides of the
comparison, which normalizes before comparing regardless of the string's exact format. This
is the one place in the build where I changed AI-generated logic because I could see it was
wrong, not just where I asked for a stage.

I ran the actual crash-recovery test myself: scheduled real jobs, killed the worker process
by hand mid-batch, restarted it, and manually verified the `jobs` table state and message
counts in Discord/Telegram before writing up `EVIDENCE.md`.

## Keyword hashtags

My request, mid-build — the original brief only needed static template hashtags, and I
wanted something less obviously templated. AI wrote the stopword-filter + frequency-count
extractor. I did not independently verify it against a benchmark keyword extractor; it's
good enough for the constraint-validation pipeline, not something I'd claim as NLP work.

## Where I'd push back on "AI did the hard part"

The idempotency and durability *logic* (the actual architecture: `WHERE status='pending'`
claim guard, UNIQUE constraint, check-first pattern) came from AI proposing the pattern based
on the brief's requirements. What was mine: deciding SQLite + a hand-rolled worker over
Redis/BullMQ (documented in `ROADMAP.md`), running every checkpoint by hand before
progressing, catching the timezone bug, and the platform/adapter choices throughout.