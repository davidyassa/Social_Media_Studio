const slotRepository = require("../repositories/slotRepository");
const variantRepository = require("../repositories/variantRepository");
const publishAttemptRepository = require("../repositories/publishAttemptRepository");
const { getAdapterForPlatform } = require("../adapters/adapterRegistry");

function buildIdempotencyKey(variantId, slotId) {
    return `${variantId}:${slotId}`;
}

async function publishSlot(slotId) {
    const slot = slotRepository.findSlotById(slotId);
    if (!slot) {
        const error = new Error("Slot not found");
        error.statusCode = 404;
        throw error;
    }

    const variant = variantRepository.findVariantById(slot.variant_id);
    const idempotencyKey = buildIdempotencyKey(variant.id, slot.id);
    const adapter = getAdapterForPlatform(variant.platform);

    const { externalRef } = await adapter.publish(variant, idempotencyKey);

    const attempt = publishAttemptRepository.createAttempt({
        slotId: slot.id,
        idempotencyKey,
        status: "success",
        externalRef,
    });
    variantRepository.updateStatus(variant.id, "published");
    return attempt;
}

function getPublishHistory() {
    return publishAttemptRepository.findAllAttempts();
}

module.exports = { publishSlot, getPublishHistory };