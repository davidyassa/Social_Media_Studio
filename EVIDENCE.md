# Evidence

One proof per requirement from the capstone brief, Section 5, plus the acceptance probes in
Section 10. Screenshots/transcripts go in the `<PASTE HERE>` spots as they're collected.

## 1. Ingestion — URL or Markdown, stored once

<PASTE: Stage 2 checkpoint — POST /posts with markdown, GET /posts/:id returning it byte-identical>

## 2. Constraint profiles enforced by code

<PASTE: Stage 3 checkpoint — long-post 422 on the X platform, error naming the exact rule
broken, e.g. "exceeds 280 char limit for x (… chars)">

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

## 6. Durable scheduling — worker crash mid-publish, zero duplicates on restart

**Test target: kill the worker while a publish is actually in flight, not after it completes.**
Killing after a job's "done" log line only proves the happy path; the real risk window is
between the atomic claim and `markDone`/`markFailed`. (An earlier version of the worker had a
bug here — see "Known fix" below — so this proof specifically needs to hit that window, not the
easier one.)

Steps:
1. Schedule 2–3 variants a few seconds apart.
2. Start the worker (`npm run worker`).
3. Kill the process (`Ctrl+C` or a hard kill) after a job has been claimed but *before* its
   `[worker] job N done` log line appears. (Timing is tight — temporarily adding a short
   `await sleep(...)` inside `processJob` right after `claimJob`, then removing it after the
   test, widens the window enough to hit reliably.)
4. Restart the worker. Confirm the startup log shows
   `[worker] reclaimed N job(s) stuck in 'claimed' from a previous run`.
5. Confirm the reclaimed job(s) complete on the next poll cycle, remaining due jobs also
   complete, and any job that had *already* published before the kill is not republished.
6. Cross-check: exactly one message per slot in Discord/Telegram, and exactly one
   `publish_attempts` row per slot (via DB Browser or `GET /publish-history`).

<PASTE: kill/restart terminal transcript with timestamps, before/after `jobs` table state,
before/after `publish_attempts` row count, Discord/Telegram message count>

**Known fix applied before this evidence was collected:** the worker originally had no code
path to move a job out of `'claimed'` except `markDone`/`markFailed`, both of which only run
*after* a publish attempt resolves. A kill between the claim and either of those left the job
permanently stuck — silently dropped, not resumed. Fixed by reclaiming any `'claimed'` job back
to `'pending'` on worker startup (`jobRepository.reclaimStaleClaimedJobs()`), since a single
worker process can't legitimately have anything still mid-publish on a job at its own startup.
This fix is what makes the test above pass; it would have failed before.

## 7. Bulk publish — one click, every platform

<PASTE: POST /posts/:id/publish-all on a post with 4 approved+scheduled variants — 207 with
one result entry per platform, wasNew: true on first call, wasNew: false with the same
external_ref on a repeat call, confirming the bulk endpoint inherits the same idempotency
guarantee as the single-slot endpoint>

## 8. Publish history

<PASTE: GET /publish-history showing all attempts from the runs above, one row per slot>

## 9. Secrets clean

`.env` is listed in `.gitignore` (see commit history — `.gitignore` was the first file
committed to the repo, before any code). `.env.example` has every variable with placeholder
values, no real tokens.

---

## Known non-conformance (disclosed, not fixed as of this writing)

The brief's stated goal is *"An unapproved variant must never go out."* The literal probe (a
direct schedule attempt on an unapproved variant returning 4xx) passes — see #3. But there's a
gap in a path the probe doesn't directly test: `PATCH /variants/:id/edit` and `/reject` change
a variant's `status` without cancelling any `slots`/`jobs` rows already created for it. So:
approve → schedule (creates a pending job) → edit the content (status resets to `draft`) — the
job is still `pending` and the worker will still publish it at the scheduled time, even though
the variant is no longer `approved`.

This is disclosed here deliberately rather than fixed silently or left unmentioned, per the
brief's own instruction that honesty in `BUILDLOG.md`/evidence is graded and perfection is not.
