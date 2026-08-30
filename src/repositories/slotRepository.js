const db = require("../db");

function createSlot(variantId, scheduledAt) {
    const stmt = db.prepare(
        "INSERT INTO slots (variant_id, scheduled_at) VALUES (?, ?)"
    );
    const info = stmt.run(variantId, scheduledAt);
    return findSlotById(info.lastInsertRowid);
}

function findSlotById(id) {
    return db.prepare("SELECT * FROM slots WHERE id = ?").get(id);
}

module.exports = { createSlot, findSlotById };