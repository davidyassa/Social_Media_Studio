const SocialPublisher = require("./SocialPublisher");

class TelegramPublisher extends SocialPublisher {
    async publish(variant, idempotencyKey) {
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (!botToken || !chatId) {
            throw new Error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured");
        }

        const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: variant.content }),
        });

        const result = await response.json();
        if (!response.ok || !result.ok) {
            throw new Error(`Telegram publish failed: ${JSON.stringify(result)}`);
        }

        return { externalRef: `telegram-message-${result.result.message_id}` };
    }
}

module.exports = TelegramPublisher;