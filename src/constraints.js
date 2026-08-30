const CONSTRAINT_PROFILES = {
    x: {
        maxLength: 280,
        tone: "Punchy, direct",
        hashtagCap: 3,
    },
    instagram: {
        maxLength: 2200,
        tone: "Visual, casual",
        hashtagCap: 10,
    },
    discord: {
        maxLength: 2000,
        tone: "Casual, informative",
        hashtagCap: 5,
    },
    telegram: {
        maxLength: 4096,
        tone: "Conversational, informal",
        hashtagCap: 5,
    },
};

module.exports = { CONSTRAINT_PROFILES };