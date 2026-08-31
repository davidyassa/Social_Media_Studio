require("dotenv").config();
const { runOnce } = require("./services/workerService");
const jobRepository = require("./repositories/jobRepository");

const POLL_INTERVAL_MS = 5000;

// Crash recovery: reclaim anything orphaned by a previous run before this one
// starts polling. This is the fix for the bug where a job killed mid-publish
// (after claimJob, before markDone/markFailed) would sit in 'claimed' forever,
// since findDuePendingJobs() only ever looks at 'pending' jobs.
const reclaimed = jobRepository.reclaimStaleClaimedJobs();
if (reclaimed > 0) {
    console.log(`[worker] reclaimed ${reclaimed} job(s) stuck in 'claimed' from a previous run`);
}

console.log(`[worker] starting, polling every ${POLL_INTERVAL_MS}ms`);

let isRunning = false;
setInterval(() => {
    if (isRunning) {
        return; // previous poll cycle still in flight — don't let ticks overlap
    }
    isRunning = true;
    runOnce()
        .catch((err) => console.error("[worker] poll cycle error:", err))
        .finally(() => {
            isRunning = false;
        });
}, POLL_INTERVAL_MS);