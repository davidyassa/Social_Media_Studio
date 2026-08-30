const db = require("../db");

function createPost(source, content) {
    const stmt = db.prepare(
        "INSERT INTO posts (source, content) VALUES (?, ?)"
    );
    const info = stmt.run(source, content);
    return findPostById(info.lastInsertRowid);
}

function findPostById(id) {
    return db.prepare("SELECT * FROM posts WHERE id = ?").get(id);
}

module.exports = { createPost, findPostById };