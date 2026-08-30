const express = require("express");
const postService = require("../services/postService");

const router = express.Router();

router.post("/posts", async (req, res) => {
    const { url, markdown } = req.body ?? {};

    if (!url && !markdown) {
        return res.status(400).json({ error: "Provide either 'url' or 'markdown'" });
    }
    if (url && markdown) {
        return res.status(400).json({ error: "Provide only one of 'url' or 'markdown', not both" });
    }

    try {
        const post = await postService.ingestPost({ url, markdown });
        return res.status(201).json(post);
    } catch (err) {
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ error: err.message });
    }
});

router.get("/posts/:id", (req, res) => {
    const post = postService.getPost(req.params.id);
    if (!post) {
        return res.status(404).json({ error: "Post not found" });
    }
    return res.json(post);
});

module.exports = router;