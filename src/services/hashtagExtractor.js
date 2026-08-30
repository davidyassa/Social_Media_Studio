const STOPWORDS = new Set([
    "the", "and", "for", "are", "but", "not", "you", "your", "with", "this",
    "that", "have", "has", "had", "was", "were", "will", "would", "could",
    "should", "can", "just", "about", "into", "than", "then", "them", "they",
    "their", "there", "here", "what", "when", "where", "which", "while",
    "from", "over", "under", "more", "most", "some", "such", "only", "very",
    "also", "been", "being", "does", "doing", "done", "each", "every",
    "these", "those", "than", "because", "before", "after", "between",
    "through", "during", "without", "within", "again", "further", "once",
    "same", "other", "own", "off", "out", "down", "who", "whom", "why", "how",
]);

/**
 * Extracts the most frequent, non-trivial words from text as hashtags.
 * @param {string} text - source content to pull keywords from
 * @param {number} maxCount - hard cap on hashtags returned (pass the platform's hashtagCap)
 * @returns {string[]} - e.g. ["#idempotency", "#backend"]
 */
function extractKeywords(text, maxCount) {
    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3 && !STOPWORDS.has(word));

    const frequency = new Map();
    for (const word of words) {
        frequency.set(word, (frequency.get(word) || 0) + 1);
    }

    return [...frequency.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxCount)
        .map(([word]) => `#${word}`);
}

module.exports = { extractKeywords };