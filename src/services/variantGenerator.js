const { CONSTRAINT_PROFILES } = require("../constraints");
const { extractKeywords } = require("./hashtagExtractor");

const TEMPLATE_PREFIXES = {
    x: (content) => content,
    instagram: (content) => content,
    discord: (content) => `📢 New post!\n\n${content}`,
    telegram: (content) => `New post 👇\n\n${content}`,
};

function generateVariantContent(platform, postContent) {
    const prefixFn = TEMPLATE_PREFIXES[platform];
    if (!prefixFn) {
        throw new Error(`Unknown platform: ${platform}`);
    }

    const profile = CONSTRAINT_PROFILES[platform];
    const hashtags = extractKeywords(postContent, profile.hashtagCap);
    const body = prefixFn(postContent.trim());

    return hashtags.length > 0 ? `${body}\n\n${hashtags.join(" ")}` : body;
}

module.exports = { generateVariantContent };