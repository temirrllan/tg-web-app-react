// src/components/hints/SwipeGuide.jsx
// Interactive swipe tutorial — shows animated hand over the first habit card.
// The card area is NOT covered by any overlay element, so the user can swipe it
// directly while the guide is visible. Uses 4 dark panels around the card
// instead of a box-shadow cutout to avoid stacking-context / pointer-events issues.

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

const PADDING = 6; // gap around card for the "cutout"

const SwipeGuide = ({ show, onComplete, targetSelector = '.habit-card-wrapper' }) => {
  const { language } = useTranslation();
  const texts = translations[language] || translations.ru;

  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);
  const [cardRect, setCardRect] = useState(null);
  const rafRef = useRef(null);
  const closedRef = useRef(false);

  // Find the first habit card position
  useEffect(() => {
    if (!show) return;
    closedRef.current = false;

    const findCard = () => {
      const card = document.querySelector(targetSelector);
      if (card) {
        const rect = card.getBoundingClientRect();
        setCardRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
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
    };
  }, [show, targetSelector]);

  // Listen for first successful swipe via MutationObserver
  useEffect(() => {
    if (!show || !visible) return;

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
    if (closedRef.current) return;
    closedRef.current = true;
    setHiding(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 400);
  };

  if (!show || !visible || !cardRect) return null;

  // Cutout boundaries
  const ct = cardRect.top - PADDING;
  const cl = cardRect.left - PADDING;
  const cw = cardRect.width + PADDING * 2;
  const ch = cardRect.height + PADDING * 2;

  return (
    <div className={`swipe-guide ${hiding ? 'swipe-guide--hiding' : ''}`}>
      {/* 4 dark panels around the card — they block taps on the rest of the screen */}
      <div className="sg-panel sg-panel--top" style={{ height: ct }} />
      <div className="sg-panel sg-panel--bottom" style={{ top: ct + ch }} />
      <div className="sg-panel sg-panel--left" style={{ top: ct, height: ch, width: cl }} />
      <div className="sg-panel sg-panel--right" style={{ top: ct, height: ch, left: cl + cw }} />

      {/* Wiggle border around the card */}
      <div
        className="swipe-guide__wiggle-frame"
        style={{ top: ct, left: cl, width: cw, height: ch }}
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
          top: ct + ch + 12,
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
