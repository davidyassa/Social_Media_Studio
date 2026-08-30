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

    // Layer 1: check-first. If this exact slot already has a recorded attempt,
    // return it without calling the adapter again.
    const existingAttempt = publishAttemptRepository.findAttemptByIdempotencyKey(idempotencyKey);
    if (existingAttempt) {
        return { attempt: existingAttempt, wasNew: false };
    }

    const adapter = getAdapterForPlatform(variant.platform);
    const { externalRef } = await adapter.publish(variant, idempotencyKey);

    let attempt;
    try {
        attempt = publishAttemptRepository.createAttempt({
            slotId: slot.id,
            idempotencyKey,
            status: "success",
            externalRef,
        });
    } catch (err) {
        // Layer 2: DB constraint as fallback. We lost a race to a concurrent call
        // for the same slot — it already recorded success, so return that instead
        // of surfacing a crash. The UNIQUE constraint, not application logic, is
        // what makes this race-safe.
        if (err.code === "SQLITE_CONSTRAINT_UNIQUE" || err.code === "SQLITE_CONSTRAINT") {
            return {
                attempt: publishAttemptRepository.findAttemptByIdempotencyKey(idempotencyKey),
                wasNew: false,
            };
        }
        throw err;
    }

    variantRepository.updateStatus(variant.id, "published");
    return { attempt, wasNew: true };
}

async function publishAllForPost(postId) {
    const variants = variantRepository.findVariantsByPostId(postId);
    if (variants.length === 0) {
        const error = new Error("Post not found or has no variants");
        error.statusCode = 404;
        throw error;
    }

    const results = [];
    for (const variant of variants) {
        const slots = slotRepository.findSlotsByVariantId(variant.id);
        for (const slot of slots) {
            try {
                const { attempt, wasNew } = await publishSlot(slot.id);
                results.push({
                    slotId: slot.id,
                    platform: variant.platform,
                    status: "success",
                    wasNew,
                    attempt,
                });
            } catch (err) {
                results.push({
                    slotId: slot.id,
                    platform: variant.platform,
                    status: "failed",
                    error: err.message,
                });
            }
        }
    }
    return results;
}

function getPublishHistory() {
    return publishAttemptRepository.findAllAttempts();
}

module.exports = { publishSlot, publishAllForPost, getPublishHistory };