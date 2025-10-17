import api from './api';

export const telegramStarsService = {
  // Отправить invoice и открыть платежную форму Telegram
  async purchaseSubscription(planType) {
    try {
      console.log('💳 Starting purchase for plan:', planType);

      const tg = window.Telegram?.WebApp;
      
      if (!tg) {
        throw new Error('Telegram WebApp not available');
      }

      // Получаем цену плана
      const planPrices = {
        '6_months': 1,
        '1_year': 1
      };
      
      const price = planPrices[planType];
      
      if (!price) {
        throw new Error('Invalid plan type');
      }

      console.log('💰 Plan price:', price, 'XTR');

      // Создаём invoice payload на бэкенде
      const { data } = await api.post('/payment/request-invoice-button', { 
        planType 
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      console.log('✅ Invoice created:', data.invoicePayload);

      // Получаем информацию о плане для отображения
      const planNames = {
        '6_months': 'Premium for 6 Months',
        '1_year': 'Premium for 1 Year'
      };

      // ВАЖНО: Открываем платежную форму Telegram напрямую
      // Если у пользователя есть Stars - оплата пройдет сразу
      // Если нет Stars - Telegram сам покажет кнопку пополнения
      tg.openInvoice(
        // URL invoice не нужен - используем внутренний механизм Telegram
        `https://t.me/$telegramBotName?start=invoice_${data.invoicePayload}`,
        (status) => {
          console.log('💳 Payment status:', status);
          
          if (status === 'paid') {
            console.log('✅ Payment successful!');
            
            // Показываем успешное уведомление
            if (tg.showAlert) {
              tg.showAlert('🎉 Payment successful! Your Premium subscription is now active!');
            }
            
            // Генерируем событие для обновления UI
            window.dispatchEvent(new CustomEvent('payment_success'));
            
          } else if (status === 'cancelled') {
            console.log('❌ Payment cancelled by user');
          } else if (status === 'failed') {
            console.log('❌ Payment failed');
            
            if (tg.showAlert) {
              tg.showAlert('❌ Payment failed. Please try again.');
            }
          }
        }
      );

      return {
        success: true,
        message: 'Payment form opened',
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