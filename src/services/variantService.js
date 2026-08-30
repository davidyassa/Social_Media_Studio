const postRepository = require("../repositories/postRepository");
const variantRepository = require("../repositories/variantRepository");
const { generateVariantContent } = require("./variantGenerator");
const { validateVariant } = require("./constraintValidator");
const { CONSTRAINT_PROFILES } = require("../constraints");

function generateVariantsForPost(postId, platforms) {
    const post = postRepository.findPostById(postId);
    if (!post) {
        const error = new Error("Post not found");
        error.statusCode = 404;
        throw error;
    }

    const targetPlatforms =
        platforms && platforms.length > 0 ? platforms : Object.keys(CONSTRAINT_PROFILES);

    const created = [];
    const rejected = [];

    for (const platform of targetPlatforms) {
        if (!CONSTRAINT_PROFILES[platform]) {
            rejected.push({ platform, error: `Unknown platform: ${platform}` });
            continue;
        }

        try {
            const content = generateVariantContent(platform, post.content);
            validateVariant(platform, content);
            const variant = variantRepository.createVariant(postId, platform, content);
            created.push(variant);
        } catch (err) {
            rejected.push({ platform, error: err.message });
        }
    }

    return { created, rejected };
}

module.exports = { generateVariantsForPost };