import api from './api';

export const telegramStarsService = {
  // Купить подписку через Telegram Stars
  async purchaseSubscription(planType) {
    try {
      console.log('💳 Starting purchase for plan:', planType);

      const tg = window.Telegram?.WebApp;
      
      if (!tg) {
        throw new Error('Telegram WebApp not available');
      }

      console.log('📞 Requesting invoice from backend...');

      // Создаём invoice на бэкенде и получаем invoice URL
      const { data } = await api.post('/payment/create-invoice', { 
        planType 
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      console.log('✅ Invoice created, URL:', data.invoiceUrl);

      // ВАЖНО: Открываем invoice через Telegram WebApp
      // Telegram автоматически проверит баланс Stars
      tg.openInvoice(data.invoiceUrl, (status) => {
        console.log('💳 Invoice status:', status);
        
        if (status === 'paid') {
          console.log('✅ Payment successful!');
          
          // Показываем уведомление об успехе
          if (tg.showAlert) {
            tg.showAlert('🎉 Payment successful! Your Premium subscription is now active!');
          }
          
          // Генерируем событие для обновления UI
          window.dispatchEvent(new CustomEvent('payment_success'));
          
        } else if (status === 'cancelled') {
          console.log('❌ Payment cancelled by user');
          
          if (tg.showAlert) {
            tg.showAlert('Payment was cancelled.');
          }
          
        } else if (status === 'failed') {
          console.log('❌ Payment failed');
          
          if (tg.showAlert) {
            tg.showAlert('❌ Payment failed. Please try again.');
          }
        } else if (status === 'pending') {
          console.log('⏳ Payment is pending');
        }
      });

      return {
        success: true,
        message: 'Invoice opened',
        needsStars: false
      };

    } catch (error) {
      console.error('Purchase error:', error);
      
      // Проверяем тип ошибки
      if (error.response?.status === 403) {
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
  }
};