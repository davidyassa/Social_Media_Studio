const variantRepository = require("../repositories/variantRepository");
const slotRepository = require("../repositories/slotRepository");
const jobRepository = require("../repositories/jobRepository");
const { validateVariant } = require("./constraintValidator");

function getVariantOrThrow(id) {
    const variant = variantRepository.findVariantById(id);
    if (!variant) {
        const error = new Error("Variant not found");
        error.statusCode = 404;
        throw error;
    }
    return variant;
}

function approveVariant(id) {
    getVariantOrThrow(id);
    return variantRepository.updateStatus(id, "approved");
}

function rejectVariant(id) {
    getVariantOrThrow(id);
    return variantRepository.updateStatus(id, "rejected");
}

function editVariant(id, content) {
    const variant = getVariantOrThrow(id);
    validateVariant(variant.platform, content); // throws with the exact rule broken
    variantRepository.updateContent(id, content);
    return variantRepository.updateStatus(id, "draft"); // an edit resets review — no silent re-approval
}

function scheduleVariant(id, scheduledAt) {
    const variant = getVariantOrThrow(id);
    if (variant.status !== "approved") {
        const error = new Error("variant must be approved before scheduling");
        error.statusCode = 409;
        throw error;
    }
    if (!scheduledAt) {
        const error = new Error("scheduledAt is required");
        error.statusCode = 400;
        throw error;
    }
    const slot = slotRepository.createSlot(id, scheduledAt);
    jobRepository.createJob(slot.id);
    return slot;
}

module.exports = { approveVariant, rejectVariant, editVariant, scheduleVariant };