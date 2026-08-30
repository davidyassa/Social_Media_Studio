const db = require("../db");

function createVariant(postId, platform, content) {
    const stmt = db.prepare(
        "INSERT INTO variants (post_id, platform, content) VALUES (?, ?, ?)"
    );
    const info = stmt.run(postId, platform, content);
    return findVariantById(info.lastInsertRowid);
}

function findVariantById(id) {
    return db.prepare("SELECT * FROM variants WHERE id = ?").get(id);
}

function findVariantsByPostId(postId) {
    return db.prepare("SELECT * FROM variants WHERE post_id = ?").all(postId);
}

module.exports = { createVariant, findVariantById, findVariantsByPostId };