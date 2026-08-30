const SocialPublisher = require("./SocialPublisher");

class MockXPublisher extends SocialPublisher {
    async publish(variant, idempotencyKey) {
        console.log(`[MockX] Would post: "${variant.content}"`);
        return { externalRef: `mock-x-${idempotencyKey}` };
    }
}

module.exports = MockXPublisher;