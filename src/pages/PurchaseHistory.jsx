import React, { useState, useEffect } from 'react';
import { useNavigation } from '../hooks/useNavigation';
import { habitService } from '../services/habits';
import { useTranslation } from '../hooks/useTranslation';
import Loader from '../components/common/Loader';
import './PurchaseHistory.css';
import { useTelegramTheme } from '../hooks/useTelegramTheme';

// ── helpers ────────────────────────────────────────────────────────────────
const pad = (n, len = 5) => String(n).padStart(len, '0');

const formatDateKey = (isoStr) => isoStr.slice(0, 10);

const formatDisplayDate = (isoStr, locale = 'en-US') =>
  new Date(isoStr)
    .toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();

// ── SubscriptionCard ───────────────────────────────────────────────────────
const SubscriptionCard = ({ item, t, language }) => {
  const isInactive =
    !item.is_active || item.action === 'cancelled' || item.action === 'expired';

  const validityText = () => {
    if (isInactive) {
      return language === 'ru' ? 'Отменена' : language === 'kk' ? 'Болдырмау' : 'Cancelled';
    }
    if (!item.expires_at) return 'Lifetime ∞';
    const d = new Date(item.expires_at);
    return `${t('purchaseHistory.item.until')} ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'long' })} ${d.getFullYear()}`;
  };

  return (
    <div className={`ph-card ph-card--sub${isInactive ? ' ph-card--inactive' : ''}`}>
      <div className="ph-card__icon-wrap ph-card__icon-wrap--sub">
        <span className="ph-card__emoji">👑</span>
      </div>
      <div className="ph-card__body">
        <div className="ph-card__row ph-card__row--top">
          <span className="ph-card__title">{item.title || t('purchaseHistory.item.subscription')}</span>
          <span className="ph-card__price">{item.price_stars} <span className="ph-card__star">⭐</span></span>
        </div>
        <div className="ph-card__row ph-card__row--bottom">
          <span className={`ph-badge${isInactive ? ' ph-badge--grey' : ' ph-badge--green'}`}>
            {validityText()}
          </span>
          <span className="ph-card__order">#{pad(item.purchase_id)}</span>
        </div>
      </div>
    </div>
  );
};

// ── PackCard ───────────────────────────────────────────────────────────────
const PackCard = ({ item, t }) => (
  <div className="ph-card ph-card--pack">
    <div className="ph-card__icon-wrap ph-card__icon-wrap--pack">
      {item.pack_photo_url
        ? <img src={item.pack_photo_url} alt={item.title} className="ph-card__pack-img" />
        : <span className="ph-card__emoji">📦</span>}
    </div>
    <div className="ph-card__body">
      <div className="ph-card__row ph-card__row--top">
        <span className="ph-card__title">{item.title}</span>
        <span className="ph-card__price">{item.price_stars} <span className="ph-card__star">⭐</span></span>
      </div>
      <div className="ph-card__row ph-card__row--bottom">
        <span className="ph-badge ph-badge--blue">{t('purchaseHistory.pack.purchased')}</span>
        {item.pack_short_description && (
          <span className="ph-card__desc">{item.pack_short_description}</span>
        )}
        <span className="ph-card__order">#{pad(item.purchase_id)}</span>
      </div>
    </div>
  </div>
);

// ── Main ──────────────────────────────────────────────────────────────────
const PurchaseHistory = ({ onClose }) => {
  const { t, language } = useTranslation();
  useNavigation(onClose);
  useTelegramTheme();

  const [loading, setLoading] = useState(true);
  const [groups, setGroups]   = useState([]);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const result = await habitService.getSubscriptionHistory();
      if (result.success && result.history?.length) {
        setGroups(groupByDate(result.history));
      }
    } catch (e) {
      console.error('PurchaseHistory load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const localeForLang = () =>
    language === 'ru' ? 'ru-RU' : language === 'kk' ? 'kk-KZ' : 'en-US';

  const groupByDate = (items) => {
    const map = {};
    items.forEach(item => {
      const key = formatDateKey(item.created_at);
      if (!map[key]) {
        map[key] = {
          key,
          display: formatDisplayDate(item.created_at, localeForLang()),
          items: []
        };
      }
      map[key].items.push(item);
    });
    return Object.values(map).sort((a, b) => b.key.localeCompare(a.key));
  };

  if (loading) {
    return (
      <div className="ph-page">
        <div className="ph-page__loader"><Loader size="large" /></div>
      </div>
    );
  }

  return (
    <div className="ph-page">
      <div className="ph-page__content">
        {groups.length === 0 ? (
          <div className="ph-empty">
            <span className="ph-empty__icon">🛍️</span>
            <p className="ph-empty__title">{t('purchaseHistory.empty.text')}</p>
            <p className="ph-empty__sub">{t('purchaseHistory.empty.subtitle')}</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.key} className="ph-group">
              <p className="ph-group__date">{group.display}</p>
              <div className="ph-group__items">
                {group.items.map((item, idx) =>
                  item.purchase_type === 'pack'
                    ? <PackCard        key={idx} item={item} t={t} />
                    : <SubscriptionCard key={idx} item={item} t={t} language={language} />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PurchaseHistory;
