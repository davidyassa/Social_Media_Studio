const express = require("express");
const publishService = require("../services/publishService");

const router = express.Router();

router.post("/slots/:id/publish", async (req, res) => {
    try {
        const attempt = await publishService.publishSlot(req.params.id);
        return res.status(201).json(attempt);
    } catch (err) {
        return res.status(err.statusCode || 500).json({ error: err.message });
    }
});

router.get("/publish-history", (req, res) => {
    return res.json(publishService.getPublishHistory());
});

module.exports = router;