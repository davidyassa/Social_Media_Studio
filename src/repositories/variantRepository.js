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

function updateStatus(id, status) {
    db.prepare("UPDATE variants SET status = ? WHERE id = ?").run(status, id);
    return findVariantById(id);
}

function updateContent(id, content) {
    db.prepare("UPDATE variants SET content = ? WHERE id = ?").run(content, id);
    return findVariantById(id);
}

module.exports = {
    createVariant,
    findVariantById,
    findVariantsByPostId,
    updateStatus,
    updateContent,
};