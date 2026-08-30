const SocialPublisher = require("./SocialPublisher");

class MockInstagramPublisher extends SocialPublisher {
    async publish(variant, idempotencyKey) {
        console.log(`[MockInstagram] Would post: "${variant.content}"`);
        return { externalRef: `mock-instagram-${idempotencyKey}` };
    }
}

module.exports = MockInstagramPublisher;