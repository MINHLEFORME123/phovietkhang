// Telegram notifications are relayed through the Cloudflare Worker.
// The bot token and chat id live ONLY in the Worker's environment variables
// (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) — never in client-side code.
const WORKER_URL = 'https://pvk-admin.minhbeo993.workers.dev';

// Escape user-provided text for Telegram parse_mode=HTML messages.
// Without this, a "<" typed by a customer makes the Telegram API reject
// the whole message and the restaurant never gets notified.
export function escapeTelegramHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

// Pass `orderId` to attach the confirm / out-of-stock / cancel inline buttons
// to the Telegram message (staff decisions come back via the Worker webhook).
export async function sendTelegramNotification(message, orderId = null) {
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'sendTelegram',
                args: orderId ? { message, orderId } : { message }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("Telegram relay error:", data.error || response.status);
        }
    } catch (error) {
        console.error("Error sending Telegram message:", error);
    }
}
