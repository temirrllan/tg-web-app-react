// src/services/telegramStars.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

import api from './api';
import habitServiceOptimized from './habitsOptimized';

export const telegramStarsService = {
  /**
   * Валидация промокода
   */
  async validatePromoCode(code, planType) {
    try {
      const { data } = await api.post('/payment/validate-promo', { code, planType });
      return data;
    } catch (error) {
      console.error('Validate promo error:', error);
      return { success: false, valid: false, error: 'server_error' };
    }
  },

  /**
   * Активация бесплатной подписки через промокод
   */
  async activateFreeSubscription(planType, promoCode) {
    try {
      console.log('🎁 Activating free subscription with promo:', promoCode);
      const { data } = await api.post('/payment/activate-promo', { planType, promoCode });

      if (!data.success) {
        throw new Error(data.error || 'Failed to activate');
      }

      // Инвалидируем кэши
      habitServiceOptimized.invalidateSubscriptionCache();
      habitServiceOptimized.invalidateHabitsCache();
      habitServiceOptimized.clearCache();
      localStorage.removeItem('cache_subscription_limits');
      localStorage.removeItem('cache_user_profile');

      // Принудительно обновляем статус
      const freshStatus = await habitServiceOptimized.checkSubscriptionLimits(true);

      // Уведомляем UI
      window.dispatchEvent(new CustomEvent('payment_success', {
        detail: { subscription: freshStatus, planType, promoApplied: true }
      }));

      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }

      return { success: true, subscription: freshStatus, free: true };
    } catch (error) {
      console.error('❌ Free activation error:', error);
      throw error;
    }
  },

  /**
   * 🔥 Купить подписку через Telegram Stars с автоматическим обновлением
   */
  async purchaseSubscription(planType, promoCode = null) {
    try {
      console.log('💳 Starting purchase for plan:', planType, 'promo:', promoCode || 'none');

      const tg = window.Telegram?.WebApp;

      if (!tg) {
        throw new Error('Telegram WebApp not available');
      }

      console.log('📞 Requesting invoice from backend...');

      // Создаём invoice на бэкенде (с промокодом если есть)
      const { data } = await api.post('/payment/create-invoice', {
        planType,
        promoCode: promoCode || undefined
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to create invoice');
      }

      console.log('✅ Invoice created:', {
        url: data.invoiceUrl,
        payload: data.invoicePayload,
        price: data.price
      });

      // 🔥 КРИТИЧНО: Возвращаем Promise для ожидания оплаты
      return new Promise((resolve, reject) => {
        // Открываем invoice
        tg.openInvoice(data.invoiceUrl, async (status) => {
          console.log('💳 Invoice status:', status);
          
          if (status === 'paid') {
            console.log('✅ Payment confirmed by Telegram!');
            
            try {
              // 🔥 ШАГ 1: НЕМЕДЛЕННАЯ проверка статуса
              console.log('🔍 Step 1: Immediate check...');
              await this.waitForPaymentProcessing(data.invoicePayload, 1);
              
              // 🔥 ШАГ 2: Инвалидируем ВСЕ кэши
              console.log('🧹 Step 2: Clearing all caches...');
              habitServiceOptimized.invalidateSubscriptionCache();
              habitServiceOptimized.invalidateHabitsCache();
              habitServiceOptimized.clearCache();
              localStorage.removeItem('cache_subscription_limits');
              localStorage.removeItem('cache_user_profile');
              
              // 🔥 ШАГ 3: Принудительная загрузка свежих данных
              console.log('📥 Step 3: Force refresh subscription...');
              const freshStatus = await habitServiceOptimized.checkSubscriptionLimits(true);
              
              console.log('✅ Fresh subscription status:', {
                isPremium: freshStatus.isPremium,
                plan: freshStatus.subscription?.planType,
                active: freshStatus.subscription?.isActive
              });
              
              // 🔥 ШАГ 4: Уведомляем UI об успехе
              console.log('📢 Step 4: Broadcasting payment success...');
              window.dispatchEvent(new CustomEvent('payment_success', {
                detail: { 
                  subscription: freshStatus,
                  planType 
                }
              }));
              
              // Показываем уведомление
              if (tg.showAlert) {
                tg.showAlert('🎉 Payment successful! Your Premium subscription is now active!');
              }
              
              // Вибрация успеха
              if (tg.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
              }
              
              resolve({
                success: true,
                subscription: freshStatus
              });
              
            } catch (processingError) {
              console.error('❌ Post-payment processing failed:', processingError);
              
              // Даже если что-то упало - всё равно пытаемся обновить UI
              window.dispatchEvent(new CustomEvent('payment_success'));
              
              resolve({
                success: true,
                warning: 'Payment completed but status update delayed'
              });
            }
            
          } else if (status === 'cancelled') {
            console.log('❌ Payment cancelled by user');
            reject(new Error('Payment cancelled'));
            
          } else if (status === 'failed') {
            console.log('❌ Payment failed');
            
            if (tg.showAlert) {
              tg.showAlert('❌ Payment failed. Please try again.');
            }
            
            reject(new Error('Payment failed'));
            
          } else if (status === 'pending') {
            console.log('⏳ Payment is pending...');
            // Не делаем ничего, ждём финального статуса
          }
        });
      });

    } catch (error) {
      console.error('💥 Purchase error:', error);
      
      if (error.response?.status === 403) {
        throw new Error('bot_blocked');
      }
      
      throw error;
    }
  },

  /**
   * 🔥 НОВЫЙ: Ожидание обработки платежа с polling
   */
  async waitForPaymentProcessing(invoicePayload, maxAttempts = 10) {
    console.log('⏳ Waiting for payment processing:', { invoicePayload, maxAttempts });
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`🔍 Polling attempt ${attempt}/${maxAttempts}...`);
      
      try {
        // Проверяем статус платежа
        const status = await this.checkPaymentStatus(invoicePayload);
        
        console.log(`📊 Payment status on attempt ${attempt}:`, {
          paid: status?.paid,
          subscriptionActive: status?.subscriptionActive,
          isPremium: status?.isPremium
        });
        
        // Если платёж обработан и подписка активна
        if (status?.paid && status?.subscriptionActive && status?.isPremium) {
          console.log('✅ Payment fully processed!');
          return status;
        }
        
        // Если это не последняя попытка - ждём
        if (attempt < maxAttempts) {
          const delay = attempt === 1 ? 500 : 1000; // Первая попытка быстрая
          console.log(`⏱️ Waiting ${delay}ms before next check...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`❌ Polling attempt ${attempt} failed:`, error);
        
        // Продолжаем пытаться даже при ошибках
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.warn('⚠️ Payment processing timeout - returning anyway');
    return null;
  },

  /**
   * Проверить статус платежа
   */
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