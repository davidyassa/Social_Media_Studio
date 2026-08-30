const SocialPublisher = require("./SocialPublisher");

class DiscordPublisher extends SocialPublisher {
    async publish(variant, idempotencyKey) {
        const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
        if (!webhookUrl) {
            throw new Error("DISCORD_WEBHOOK_URL is not configured");
        }

        // ?wait=true makes Discord return the created message object (with its id)
        // instead of an empty 204 response — we need that id as the externalRef.
        const response = await fetch(`${webhookUrl}?wait=true`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: variant.content }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Discord publish failed: ${response.status} ${errorBody}`);
        }

        const message = await response.json();
        return { externalRef: `discord-message-${message.id}` };
    }
}

module.exports = DiscordPublisher;