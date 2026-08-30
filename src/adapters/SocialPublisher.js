class SocialPublisher {
    /**
     * @param {object} variant - { id, platform, content }
     * @param {string} idempotencyKey - unique per (variantId, slotId)
     * @returns {Promise<{ externalRef: string }>}
     */
    async publish(variant, idempotencyKey) {
        throw new Error("publish() not implemented");
    }
}

module.exports = SocialPublisher;