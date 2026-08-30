const jobRepository = require("../repositories/jobRepository");
const publishService = require("./publishService");

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processJob(job) {
    const claimed = jobRepository.claimJob(job.id);
    if (!claimed) {
        return; // lost the race — another run already has it
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            await publishService.publishSlot(job.slot_id);
            jobRepository.markDone(job.id);
            console.log(`[worker] job ${job.id} done (attempt ${attempt})`);
            return;
        } catch (err) {
            console.error(`[worker] job ${job.id} attempt ${attempt} failed: ${err.message}`);
            if (attempt < MAX_ATTEMPTS) {
                await sleep(RETRY_DELAY_MS);
            }
        }
    }

    jobRepository.markFailed(job.id);
    console.error(`[worker] job ${job.id} marked failed after ${MAX_ATTEMPTS} attempts`);
}

async function runOnce() {
    const dueJobs = jobRepository.findDuePendingJobs();
    for (const job of dueJobs) {
        await processJob(job);
    }
}

module.exports = { runOnce, processJob };