const db = require("../db");

function createJob(slotId) {
    const stmt = db.prepare("INSERT INTO jobs (slot_id) VALUES (?)");
    const info = stmt.run(slotId);
    return findJobById(info.lastInsertRowid);
}

function findJobById(id) {
    return db.prepare("SELECT * FROM jobs WHERE id = ?").get(id);
}

function findDuePendingJobs() {
    return db
        .prepare(
            `SELECT jobs.* FROM jobs
             JOIN slots ON slots.id = jobs.slot_id
             WHERE jobs.status = 'pending'
               AND julianday(slots.scheduled_at) <= julianday('now')
             ORDER BY jobs.id`
        )
        .all();
}

function claimJob(id) {
    const stmt = db.prepare(
        `UPDATE jobs SET status = 'claimed', claimed_at = datetime('now')
         WHERE id = ? AND status = 'pending'`
    );
    const info = stmt.run(id);
    return info.changes === 1; // true only if THIS call won the claim
}

function markDone(id) {
    db.prepare("UPDATE jobs SET status = 'done' WHERE id = ?").run(id);
}

function markFailed(id) {
    db.prepare("UPDATE jobs SET status = 'failed' WHERE id = ?").run(id);
}

function reclaimStaleClaimedJobs() {
    // A job left 'claimed' at startup was claimed by a previous run that never
    // reached markDone/markFailed (killed, crashed, etc). With a single worker
    // process, nothing else could be legitimately mid-publish on it right now —
    // reset it to 'pending' so this run's first poll cycle picks it back up.
    const stmt = db.prepare(
        `UPDATE jobs SET status = 'pending', claimed_at = NULL WHERE status = 'claimed'`
    );
    const info = stmt.run();
    return info.changes;
}

module.exports = {
    createJob,
    findJobById,
    findDuePendingJobs,
    claimJob,
    markDone,
    markFailed,
    reclaimStaleClaimedJobs,
};