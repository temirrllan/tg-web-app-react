import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import { useTranslation } from '../hooks/useTranslation';
import Loader from '../components/common/Loader';
import './PurchaseHistory.css';

const PurchaseHistory = ({ onClose }) => {
  const { t, language } = useTranslation();
  useNavigation(onClose);
  
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  
  useEffect(() => {
    loadPurchaseHistory();
  }, []);
  
  const loadPurchaseHistory = async () => {
    try {
      setLoading(true);
      const result = await habitService.getSubscriptionHistory();
      
      console.log('📥 Purchase history received:', result);
      
      if (result.success && result.history) {
        const grouped = groupPurchasesByDate(result.history);
        setPurchases(grouped);
        
        console.log('📊 Grouped purchases:', grouped);
      }
    } catch (error) {
      console.error('Failed to load purchase history:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const groupPurchasesByDate = (history) => {
    const groups = {};
    
    history.forEach(item => {
      const date = new Date(item.created_at);
      const dateKey = formatDateKey(date);
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          displayDate: formatDisplayDate(date),
          items: []
        };
      }
      
      groups[dateKey].items.push({
        ...item,
        formattedDate: date.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      });
    });
    
    return Object.values(groups).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
  };
  
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0];
  };
  
  const formatDisplayDate = (date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
  };
  
  const formatOrderId = (id) => {
    if (!id) return 'MANUNYA2HEHE';
    return `MANUNYA${id.toString().padStart(5, '0')}`;
  };
  
  const formatValidityDate = (item) => {
    console.log('🔍 Formatting validity for:', {
      subscription_id: item.subscription_id,
      expires_at: item.expires_at,
      is_active: item.is_active,
      action: item.action
    });
    
    // 🔥 Если подписка отменена или истекла - показываем статус
    if (!item.is_active || item.action === 'cancelled' || item.action === 'expired') {
      if (language === 'ru') return 'Отменена';
      if (language === 'kk') return 'Болдырмау';
      return 'Cancelled';
    }
    
    // Если нет даты истечения - Lifetime
    if (!item.expires_at) {
      return 'Lifetime';
    }
    
    const date = new Date(item.expires_at);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    return `${t('purchaseHistory.item.until')} ${day} ${month} ${year}`;
  };
  
  const getPlanDetails = (item) => {
    console.log('🔍 Getting plan details for item:', {
      subscription_id: item.subscription_id,
      plan_type: item.plan_type,
      plan_name: item.plan_name,
      price_stars: item.price_stars
    });
    
    // 🔥 ПРИОРИТЕТ 1: Используем реальную цену из истории
    const actualPrice = parseInt(item.price_stars) || 0;
    
    // Если цена есть в записи - используем её
    if (actualPrice > 0) {
      console.log(`✅ Using actual price from history: ${actualPrice} XTR`);
      return {
        name: item.plan_name || t('purchaseHistory.item.subscription'),
        price: actualPrice
      };
    }
    
    // 🔥 FALLBACK: Если почему-то цена не записалась, берём из плана
    console.warn(`⚠️ Price not found in history for subscription ${item.subscription_id}, using plan defaults`);
    
    const plans = {
      'test': { name: 'Test Plan (1 Star)', price: 1 },
      'month': { name: 'Premium for 1 Month', price: 59 },
      '6_months': { name: 'Premium for 6 Months', price: 299 },
      '1_year': { name: 'Premium for 1 Year', price: 500 }
    };
    
    const fallbackPlan = plans[item.plan_type];
    
    if (fallbackPlan) {
      console.log(`📦 Using fallback price for ${item.plan_type}: ${fallbackPlan.price} XTR`);
      return {
        name: item.plan_name || fallbackPlan.name,
        price: fallbackPlan.price
      };
    }
    
    // Последний fallback
    console.error(`❌ No plan found for ${item.plan_type}`);
    return { 
      name: item.plan_name || t('purchaseHistory.item.subscription'), 
      price: 0 
    };
  };
  
  if (loading) {
    return (
      <div className="purchase-history">
        <div className="purchase-history__content" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Loader size="large" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="purchase-history">
      <div className="purchase-history__content">
        {purchases.length === 0 ? (
          <div className="purchase-history__empty">
            <div className="purchase-history__empty-icon">
              {t('purchaseHistory.empty.icon')}
            </div>
            <p className="purchase-history__empty-text">
              {t('purchaseHistory.empty.text')}
            </p>
          </div>
        ) : (
          <div className="purchase-history__list">
            {purchases.map((group, groupIndex) => (
              <div key={groupIndex} className="purchase-history__date-group">
                <p className="purchase-history__date">{group.displayDate}</p>
                <div className="purchase-history__items">
                  {group.items.map((item, index) => {
                    const plan = getPlanDetails(item);
                    const validTo = formatValidityDate(item);
                    const orderId = formatOrderId(item.subscription_id);
                    
                    // 🔥 Определяем стиль в зависимости от статуса
                    const isInactive = !item.is_active || item.action === 'cancelled' || item.action === 'expired';
                    const validityStyle = isInactive ? { 
                      color: '#999',
                      textDecoration: 'line-through'
                    } : {};
                    
                    console.log('📋 Rendering history item:', {
                      subscription_id: item.subscription_id,
                      plan_name: plan.name,
                      price: plan.price,
                      is_active: item.is_active,
                      action: item.action,
                      validity: validTo
                    });
                    
                    return (
                      <div key={index}>
                        <div className="purchase-history__item">
                          <div className="purchase-history__item-icon">
                            📋
                          </div>
                          <div className="purchase-history__item-info">
                            <h3 className="purchase-history__item-title">
                              {plan.name}
                            </h3>
                            <p className="purchase-history__item-subscription">
                              {t('purchaseHistory.item.subscription')}
                            </p>
                          </div>
                          <div className="purchase-history__item-details">
                            <div className="purchase-history__item-price">
                              <span>{plan.price}</span>
                              <span className="purchase-history__item-star">⭐</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="purchase-history__item-validity">
                          <span className="purchase-history__validity-label">
                            {t('purchaseHistory.item.validTo')}
                          </span>
                          <span 
                            className="purchase-history__validity-value"
                            style={validityStyle}
                          >
                            {validTo}
                          </span>
                          <div className="purchase-history__validity-order">
                            <span className="purchase-history__validity-label">
                              {t('purchaseHistory.item.orderId')}
                            </span>
                            <span className="purchase-history__validity-value">
                              {orderId}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseHistory;