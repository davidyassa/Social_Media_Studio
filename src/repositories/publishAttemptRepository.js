const db = require("../db");

function createAttempt({ slotId, idempotencyKey, status, externalRef }) {
    const stmt = db.prepare(
        `INSERT INTO publish_attempts (slot_id, idempotency_key, status, external_ref)
         VALUES (?, ?, ?, ?)`
    );
    const info = stmt.run(slotId, idempotencyKey, status, externalRef ?? null);
    return findAttemptById(info.lastInsertRowid);
}

function findAttemptById(id) {
    return db.prepare("SELECT * FROM publish_attempts WHERE id = ?").get(id);
}

function findAttemptByIdempotencyKey(key) {
    return db.prepare("SELECT * FROM publish_attempts WHERE idempotency_key = ?").get(key);
}

function findAllAttempts() {
    return db.prepare("SELECT * FROM publish_attempts ORDER BY created_at DESC").all();
}

module.exports = {
    createAttempt,
    findAttemptById,
    findAttemptByIdempotencyKey,
    findAllAttempts,
};