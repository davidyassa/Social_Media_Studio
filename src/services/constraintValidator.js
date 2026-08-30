const { CONSTRAINT_PROFILES } = require("../constraints");

function countHashtags(content) {
    const matches = content.match(/#\w+/g);
    return matches ? matches.length : 0;
}

function validateVariant(platform, content) {
    const profile = CONSTRAINT_PROFILES[platform];
    if (!profile) {
        throw new Error(`Unknown platform: ${platform}`);
    }

    if (content.length > profile.maxLength) {
        throw new Error(
            `exceeds ${profile.maxLength} char limit for ${platform} (${content.length} chars)`
        );
    }

    const hashtagCount = countHashtags(content);
    if (hashtagCount > profile.hashtagCap) {
        throw new Error(
            `exceeds ${profile.hashtagCap} hashtag limit for ${platform} (${hashtagCount} hashtags)`
        );
    }
}

module.exports = { validateVariant, countHashtags };