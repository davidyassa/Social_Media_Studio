const express = require("express");
const variantService = require("../services/variantService");

const router = express.Router();

router.post("/posts/:id/variants", (req, res) => {
    const postId = req.params.id;
    const { platforms } = req.body ?? {};

    try {
        const { created, rejected } = variantService.generateVariantsForPost(postId, platforms);
        const statusCode = created.length > 0 ? 201 : 422;
        return res.status(statusCode).json({ created, rejected });
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ error: err.message });
    }
});

module.exports = router;