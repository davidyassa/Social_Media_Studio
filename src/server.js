require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const postRoutes = require("./routes/postRoutes");
const variantRoutes = require("./routes/variantRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();
app.use(
    express.json(),
    cors(),
);
app.use(
    postRoutes,
    variantRoutes,
    reviewRoutes,
);

app.get("/", (req, res) => {
    return res.json({
        name: "Social Media Studio",
        version: "1.0",
    });
});

app.get("/health", (req, res) => {
    const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
        .all()
        .map((row) => row.name);
    res.json({ status: "ok", tables });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});