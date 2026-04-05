// src/components/hints/SwipeGuide.jsx
// Interactive swipe tutorial — shows animated hand over the first habit card.
// User must actually swipe the card to dismiss (not just tap).

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import './SwipeGuide.css';

const translations = {
  en: {
    label: 'Swipe left to complete',
    skip: 'Skip',
  },
  ru: {
    label: 'Свайпните влево, чтобы выполнить',
    skip: 'Пропустить',
  },
  kk: {
    label: 'Орындау үшін солға сырғытыңыз',
    skip: 'Өткізу',
  },
};

const SwipeGuide = ({ show, onComplete, targetSelector = '.habit-card-wrapper' }) => {
  const { language } = useTranslation();
  const texts = translations[language] || translations.ru;

  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [cardRect, setCardRect] = useState(null);
  const rafRef = useRef(null);

  // Find the first habit card position and elevate it above overlay
  useEffect(() => {
    if (!show) return;

    let cardEl = null;

    const findCard = () => {
      const card = document.querySelector(targetSelector);
      if (card) {
        cardEl = card;
        const rect = card.getBoundingClientRect();
        setCardRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });

        // Elevate the card above the overlay so user can swipe it
        card.style.position = 'relative';
        card.style.zIndex = '10003';

        setVisible(true);

        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
      } else {
        rafRef.current = requestAnimationFrame(findCard);
      }
    };

    const timer = setTimeout(findCard, 500);
    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      // Restore card z-index on unmount
      if (cardEl) {
        cardEl.style.position = '';
        cardEl.style.zIndex = '';
      }
    };
  }, [show, targetSelector]);

  // Listen for first successful swipe mark
  useEffect(() => {
    if (!show || !visible) return;

    const handleMark = () => {
      triggerClose();
    };

    // HabitCard dispatches haptic on mark — we listen for status changes
    // We use a MutationObserver on the first card to detect status change
    const card = document.querySelector(targetSelector);
    if (!card) return;

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const el = m.target;
          if (el.classList.contains('completed') || el.classList.contains('failed')) {
            triggerClose();
            break;
          }
        }
      }
    });

    const habitCard = card.querySelector('.habit-card');
    if (habitCard) {
      observer.observe(habitCard, { attributes: true, attributeFilter: ['class'] });
    }

    return () => observer.disconnect();
  }, [show, visible, targetSelector]);

  const triggerClose = () => {
    // Restore the elevated card
    const card = document.querySelector(targetSelector);
    if (card) {
      card.style.position = '';
      card.style.zIndex = '';
    }
    setHiding(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 400);
  };

  if (!show || !visible || !cardRect) return null;

  return (
    <div className={`swipe-guide ${hiding ? 'swipe-guide--hiding' : ''}`}>
      {/* Dark overlay with cutout for the card */}
      <div
        className="swipe-guide__spotlight"
        style={{
          top: cardRect.top - 6,
          left: cardRect.left - 6,
          width: cardRect.width + 12,
          height: cardRect.height + 12,
        }}
      />

      {/* Transparent touch-through zone over the card */}
      <div
        className="swipe-guide__touch-zone"
        style={{
          top: cardRect.top,
          left: cardRect.left,
          width: cardRect.width,
          height: cardRect.height,
        }}
      />

      {/* Wiggle indicator on the card */}
      <div
        className="swipe-guide__wiggle-frame"
        style={{
          top: cardRect.top - 4,
          left: cardRect.left - 4,
          width: cardRect.width + 8,
          height: cardRect.height + 8,
        }}
      />

      {/* Animated hand */}
      <div
        className="swipe-guide__hand-container"
        style={{
          top: cardRect.top + cardRect.height / 2 - 24,
          left: cardRect.left + cardRect.width / 2 + 20,
        }}
      >
        <div className="swipe-guide__hand">
          <span className="swipe-guide__hand-emoji">👆</span>
        </div>
      </div>

      {/* Label below card */}
      <div
        className="swipe-guide__label"
        style={{
          top: cardRect.top + cardRect.height + 16,
          left: cardRect.left,
          width: cardRect.width,
        }}
      >
        <div className="swipe-guide__label-arrow">
          <span>←</span>
        </div>
        <span className="swipe-guide__label-text">{texts.label}</span>
      </div>

      {/* Skip button */}
      <button className="swipe-guide__skip" onClick={triggerClose}>
        {texts.skip}
      </button>
    </div>
  );
};

export default SwipeGuide;
