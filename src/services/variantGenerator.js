const TEMPLATES = {
    x: (content) => `${content}\n\n#backend #buildinpublic`,
    instagram: (content) => `${content}\n\n#backend #buildinpublic #devlife`,
    discord: (content) => `📢 New post!\n\n${content}\n\n#backend #buildinpublic`,
    telegram: (content) => `New post 👇\n\n${content}\n\n#backend #buildinpublic`,
};

function generateVariantContent(platform, postContent) {
    const template = TEMPLATES[platform];
    if (!template) {
        throw new Error(`Unknown platform: ${platform}`);
    }
    return template(postContent.trim());
}

module.exports = { generateVariantContent };