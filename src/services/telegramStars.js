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

      // 3. Открываем форму оплаты Telegram Stars
      return new Promise((resolve, reject) => {
        // Таймаут на случай если пользователь не завершит оплату
        const timeout = setTimeout(() => {
          reject(new Error('Payment timeout'));
        }, 5 * 60 * 1000); // 5 минут

        // Открываем invoice
        tg.openInvoice(invoiceData.payload, (status) => {
          clearTimeout(timeout);

          console.log('Payment status:', status);

          if (status === 'paid') {
            console.log('✅ Payment successful');
            resolve({
              success: true,
              payload: invoiceData.payload
            });
          } else if (status === 'cancelled') {
            console.log('❌ Payment cancelled by user');
            reject(new Error('Payment cancelled'));
          } else if (status === 'failed') {
            console.log('❌ Payment failed');
            reject(new Error('Payment failed'));
          } else {
            console.log('⚠️ Unknown payment status:', status);
            reject(new Error('Unknown payment status'));
          }
        });
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

    // Telegram не предоставляет прямого API для проверки баланса
    // Но мы можем предложить пользователю купить звёзды если платеж не прошёл
    return true;
  },

  // Открыть страницу покупки Telegram Stars
  openStarsPurchase() {
    const tg = window.Telegram?.WebApp;
    
    if (tg && tg.openTelegramLink) {
      // Открываем бота @donate для покупки звёзд
      tg.openTelegramLink('https://t.me/donate');
    } else {
      window.open('https://t.me/donate', '_blank');
    }
  }
};