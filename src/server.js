require("dotenv").config();
const express = require("express"),
    cors = require("cors");

const postRoutes = require("./routes/postRoutes"),
    variantRoutes = require("./routes/variantRoutes"),
    reviewRoutes = require("./routes/reviewRoutes"),
    publishRoutes = require("./routes/publishRoutes"),
    metaRoutes = require("./routes/metaRoutes");

const app = express();
app.use(
    express.json(),
    cors(),
);

app.use(
    postRoutes,
    variantRoutes,
    reviewRoutes,
    publishRoutes,
    metaRoutes,
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});