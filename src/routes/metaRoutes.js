const express = require("express");
const metaRepository = require("../repositories/metaRepository");

const router = express.Router();

router.get("/", (req, res) => {
    return res.status(200).json({
        name: "Social Media Studio",
        version: "9.0",
    });
});

router.get("/health", (req, res) => {
    const tables = metaRepository.getDbTables();  //using repo directly because service not necessary

    return res.status(200).json({
        status: "ok",
        tables,
    });
});

module.exports = router;