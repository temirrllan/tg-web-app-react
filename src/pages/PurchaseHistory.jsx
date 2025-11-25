import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import { useTranslation } from '../hooks/useTranslation';
import Loader from '../components/common/Loader';
import './PurchaseHistory.css';

const PurchaseHistory = ({ onClose }) => {
  const { t } = useTranslation();
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
      
      if (result.success && result.history) {
        const grouped = groupPurchasesByDate(result.history);
        setPurchases(grouped);
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
  
  const formatValidityDate = (expiresAt) => {
    if (!expiresAt) return 'Lifetime';
    
    const date = new Date(expiresAt);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    
    return `${t('purchaseHistory.item.until')} ${day} ${month} ${year}`;
  };
  
  const getPlanDetails = (planType) => {
    const plans = {
      '6_months': {
        name: t('profile.plan.sixMonths'),
        price: 600
      },
      '1_year': {
        name: t('profile.plan.oneYear'),
        price: 350
      },
      'lifetime': {
        name: t('profile.plan.lifetime'),
        price: 1500
      }
    };
    
    return plans[planType] || { 
      name: t('purchaseHistory.item.subscription'), 
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
                    const plan = getPlanDetails(item.plan_type);
                    const validTo = formatValidityDate(item.expires_at);
                    const orderId = formatOrderId(item.subscription_id);
                    
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
                          <span className="purchase-history__validity-value">
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