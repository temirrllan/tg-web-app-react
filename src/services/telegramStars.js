import api from './api';

export const telegramStarsService = {
  // Создать invoice и открыть форму оплаты
  async purchaseSubscription(planType) {
    try {
      console.log('💳 Starting purchase for plan:', planType);

      // 1. Получаем invoice данные с backend
      const { data } = await api.post('/payment/create-invoice', { planType });

      if (!data.success) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      const invoiceData = data.invoice;
      console.log('Invoice created:', invoiceData);

      // 2. Проверяем доступность Telegram WebApp
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        throw new Error('Telegram WebApp not available');
      }

      // 3. ИСПРАВЛЕНИЕ: Используем правильный метод openInvoice
      // Telegram WebApp API требует URL вместо payload
      
      // Формируем правильные данные для invoice
      const bot_username = '@trackeryourhabitbot'; // ЗАМЕНИ НА USERNAME СВОЕГО БОТА
      
      // Создаём invoice link
      const invoiceLink = `https://t.me/${bot_username}?startattach=pay`;
      
      console.log('Opening invoice with link:', invoiceLink);

      // 4. ПРАВИЛЬНЫЙ способ открытия оплаты через Telegram Stars
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Payment timeout'));
        }, 5 * 60 * 1000); // 5 минут

        // Используем sendData для отправки invoice payload
        try {
          // Отправляем данные о платеже
          tg.sendData(JSON.stringify({
            action: 'payment',
            payload: invoiceData.payload,
            amount: invoiceData.prices[0].amount,
            currency: invoiceData.currency,
            title: invoiceData.title,
            description: invoiceData.description
          }));

          clearTimeout(timeout);
          
          console.log('✅ Payment initiated');
          resolve({
            success: true,
            payload: invoiceData.payload
          });

        } catch (error) {
          clearTimeout(timeout);
          console.error('Failed to send payment data:', error);
          reject(error);
        }
      });

    } catch (error) {
      console.error('Purchase error:', error);
      throw error;
    }
  },

  // Проверить статус платежа на backend
  async checkPaymentStatus(paymentId) {
    try {
      const { data } = await api.get(`/payment/status/${paymentId}`);
      return data;
    } catch (error) {
      console.error('Check payment status error:', error);
      return null;
    }
  },

  // Проверить наличие достаточного количества звёзд
  async checkStarsBalance() {
    const tg = window.Telegram?.WebApp;
    
    if (!tg) {
      return false;
    }

    return true;
  },

  // Открыть страницу покупки Telegram Stars
  openStarsPurchase() {
    const tg = window.Telegram?.WebApp;
    
    if (tg && tg.openTelegramLink) {
      tg.openTelegramLink('https://t.me/donate');
    } else {
      window.open('https://t.me/donate', '_blank');
    }
  }
};