const express = require("express");
const reviewService = require("../services/reviewService");

const router = express.Router();

router.patch("/variants/:id/approve", (req, res) => {
    try {
        const variant = reviewService.approveVariant(req.params.id);
        return res.json(variant);
    } catch (err) {
        return res.status(err.statusCode || 500).json({ error: err.message });
    }
});

router.patch("/variants/:id/reject", (req, res) => {
    try {
        const variant = reviewService.rejectVariant(req.params.id);
        return res.json(variant);
    } catch (err) {
        return res.status(err.statusCode || 500).json({ error: err.message });
    }
});

router.patch("/variants/:id/edit", (req, res) => {
    const { content } = req.body ?? {};
    if (!content) {
        return res.status(400).json({ error: "content is required" });
    }
    try {
        const variant = reviewService.editVariant(req.params.id, content);
        return res.json(variant);
    } catch (err) {
        return res.status(err.statusCode || 500).json({ error: err.message });
    }
});

router.post("/variants/:id/schedule", (req, res) => {
    const { scheduledAt } = req.body ?? {};
    try {
        const slot = reviewService.scheduleVariant(req.params.id, scheduledAt);
        return res.status(201).json(slot);
    } catch (err) {
        return res.status(err.statusCode || 500).json({ error: err.message });
    }
});

module.exports = router;