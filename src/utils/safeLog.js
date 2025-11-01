// src/utils/safeLog.js
export function safeLog(label, data) {
  try {
    const msg =
      typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    console.log(`🧩 ${label}:`, msg);

    // Если Telegram WebApp есть, покажем alert (чтобы увидеть ошибку в Telegram)
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.showPopup({
        title: label,
        message: msg.slice(0, 1000),
        buttons: [{ type: 'ok', text: 'OK' }],
      });
    }
  } catch (err) {
    console.warn('safeLog failed:', err);
  }
}
