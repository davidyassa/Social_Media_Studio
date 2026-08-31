const db = require("../db");

function getDbTables() {
    return db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row) => row.name);
}

module.exports = { getDbTables };