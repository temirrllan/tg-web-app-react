import api from './api';

export const telegramStarsService = {
  // Отправить invoice кнопку пользователю через бота
  async purchaseSubscription(planType) {
    try {
      console.log('💳 Starting purchase for plan:', planType);

      // 1. Создаём invoice и отправляем кнопку через бота
      const { data } = await api.post('/payment/request-invoice-button', { 
        planType 
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to send invoice');
      }

      console.log('✅ Invoice button sent to user');

      return {
        success: true,
        message: 'Check your chat with the bot for payment',
        needsStars: false
      };

    } catch (error) {
      console.error('Purchase error:', error);
      
      // Проверяем тип ошибки
      if (error.response?.status === 403) {
        // Пользователь заблокировал бота
        throw new Error('bot_blocked');
      }
      
      throw error;
    }
  },

  // Проверить статус платежа
  async checkPaymentStatus(invoicePayload) {
    try {
      const { data } = await api.get(`/payment/check-status?payload=${invoicePayload}`);
      return data;
    } catch (error) {
      console.error('Check payment status error:', error);
      return null;
    }
  },

  // Открыть страницу покупки Telegram Stars
  openStarsPurchase() {
    const tg = window.Telegram?.WebApp;
    
    if (tg && tg.openTelegramLink) {
      // Открываем Fragment для покупки Stars
      tg.openTelegramLink('https://t.me/PremiumBot?start=stars');
    } else {
      window.open('https://t.me/PremiumBot?start=stars', '_blank');
    }
  }
};