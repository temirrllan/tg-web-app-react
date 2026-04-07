// src/components/hints/SwipeGuide.jsx
// Multi-step swipe tutorial: complete → skip → fail → skip → finale with bear.
// Uses 4-panel overlay so the card is always swipeable.
// Listens for 'habit-status-change' CustomEvent dispatched by Today.jsx.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import bearImg from '../../../public/images/bear.png';
import './SwipeGuide.css';

// ── Step definitions ────────────────────────────────────────────────────────
// direction: which way the hand animates & which swipe we expect
// expectedStatus: the status we expect after the swipe
const SWIPE_STEPS = [
  { id: 'complete',    direction: 'left',  expectedStatus: 'completed' },
  { id: 'skip1',       direction: 'right', expectedStatus: 'skipped'   },
  { id: 'fail',        direction: 'right', expectedStatus: 'failed'    },
  { id: 'skip2',       direction: 'left',  expectedStatus: 'skipped'   },
];

const translations = {
  en: {
    complete:    'Swipe left to complete ✅',
    skip1:       'Swipe right to skip ⏭',
    fail:        'Swipe right to mark as failed ❌',
    skip2:       'Swipe left to skip ⏭',
    wrongWay:    'Try the other direction! 🔄',
    skip:        'Skip tutorial',
    finaleTitle: "You're all set!",
    finaleText:  'Now you know all the swipes.\nSee you around! 👋',
    finaleBtn:   'Got it!',
  },
  ru: {
    complete:    'Свайпните влево — выполнить ✅',
    skip1:       'Свайпните вправо — пропустить ⏭',
    fail:        'Свайпните вправо — провалить ❌',
    skip2:       'Свайпните влево — пропустить ⏭',
    wrongWay:    'Попробуйте в другую сторону! 🔄',
    skip:        'Пропустить обучение',
    finaleTitle: 'Вы всё освоили!',
    finaleText:  'Теперь вы знаете все свайпы.\nУвидимся! 👋',
    finaleBtn:   'Понятно!',
  },
  kk: {
    complete:    'Орындау үшін солға сырғытыңыз ✅',
    skip1:       'Өткізу үшін оңға сырғытыңыз ⏭',
    fail:        'Орындалмады деп белгілеу үшін оңға ❌',
    skip2:       'Өткізу үшін солға сырғытыңыз ⏭',
    wrongWay:    'Екінші жаққа сырғытыңыз! 🔄',
    skip:        'Оқытуды өткізу',
    finaleTitle: 'Бәрін үйрендіңіз!',
    finaleText:  'Енді барлық свайптарды білесіз.\nКездескенше! 👋',
    finaleBtn:   'Түсінікті!',
  },
};

const PADDING = 6;

const SwipeGuide = ({ show, onComplete, onResetHabit, targetSelector = '.habit-card-wrapper' }) => {
  const { language } = useTranslation();
  const texts = translations[language] || translations.ru;

  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [cardRect, setCardRect] = useState(null);
  const [wrongWay, setWrongWay] = useState(false);
  const [showFinale, setShowFinale] = useState(false);
  const [hiding, setHiding] = useState(false);

  const closedRef = useRef(false);
  const rafRef = useRef(null);
  const wrongTimerRef = useRef(null);

  const step = SWIPE_STEPS[stepIndex] || null;

  // ── Find card and measure it ──────────────────────────────────────────────
  const measureCard = useCallback(() => {
    const card = document.querySelector(targetSelector);
    if (!card) return false;
    const r = card.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    setCardRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    return true;
  }, [targetSelector]);

  useEffect(() => {
    if (!show) return;
    closedRef.current = false;
    setStepIndex(0);
    setShowFinale(false);
    setHiding(false);
    setWrongWay(false);

    const findCard = () => {
      if (measureCard()) {
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
  }, [show, measureCard]);

  // ── Listen for habit-status-change events ─────────────────────────────────
  useEffect(() => {
    if (!show || !visible || showFinale || !step) return;

    const handleStatusChange = (e) => {
      const { status } = e.detail;

      if (status === step.expectedStatus) {
        // Correct swipe!
        setWrongWay(false);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }

        // Small delay to let the card animate, then advance
        setTimeout(() => {
          const nextIndex = stepIndex + 1;
          if (nextIndex >= SWIPE_STEPS.length) {
            // All steps done → reset habit to pending → show finale
            onResetHabit?.();
            setTimeout(() => {
              setShowFinale(true);
            }, 600);
          } else {
            setStepIndex(nextIndex);
            // Re-measure card after status change
            setTimeout(() => measureCard(), 300);
          }
        }, 500);
      } else if (status !== 'pending') {
        // Wrong direction!
        setWrongWay(true);
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
        }
        clearTimeout(wrongTimerRef.current);
        wrongTimerRef.current = setTimeout(() => setWrongWay(false), 2000);
      }
    };

    window.addEventListener('habit-status-change', handleStatusChange);
    return () => window.removeEventListener('habit-status-change', handleStatusChange);
  }, [show, visible, showFinale, step, stepIndex, onResetHabit, measureCard]);

  // ── Close ─────────────────────────────────────────────────────────────────
  const triggerClose = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    // Reset habit to pending before closing if mid-tutorial
    if (!showFinale && stepIndex > 0) {
      onResetHabit?.();
    }
    setHiding(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 400);
  }, [onComplete, onResetHabit, showFinale, stepIndex]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(wrongTimerRef.current);
    };
  }, []);

  if (!show || !visible) return null;

  // ── Finale screen ─────────────────────────────────────────────────────────
  if (showFinale) {
    return (
      <div className={`swipe-guide sg-finale ${hiding ? 'swipe-guide--hiding' : ''}`}>
        <div className="sg-finale__backdrop" />
        <div className="sg-finale__content">
          <div className="sg-finale__bear-container">
            <img src={bearImg} alt="Bear" className="sg-finale__bear" />
            <div className="sg-finale__sparkles">
              <span className="sg-finale__sparkle sg-finale__sparkle--1">✨</span>
              <span className="sg-finale__sparkle sg-finale__sparkle--2">⭐</span>
              <span className="sg-finale__sparkle sg-finale__sparkle--3">✨</span>
            </div>
          </div>
          <h2 className="sg-finale__title">{texts.finaleTitle}</h2>
          <p className="sg-finale__text">
            {texts.finaleText.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </React.Fragment>
            ))}
          </p>
          <button className="sg-finale__btn" onClick={triggerClose}>
            {texts.finaleBtn}
          </button>
        </div>
      </div>
    );
  }

  // ── Swipe step overlay ────────────────────────────────────────────────────
  if (!cardRect || !step) return null;

  const ct = cardRect.top - PADDING;
  const cl = cardRect.left - PADDING;
  const cw = cardRect.width + PADDING * 2;
  const ch = cardRect.height + PADDING * 2;

  const dirClass = step.direction === 'left' ? 'sg-hand--left' : 'sg-hand--right';
  const arrowChar = step.direction === 'left' ? '←' : '→';
  const label = texts[step.id] || '';

  // Step indicator (1/4, 2/4, etc.)
  const stepLabel = `${stepIndex + 1}/${SWIPE_STEPS.length}`;

  return (
    <div className={`swipe-guide ${hiding ? 'swipe-guide--hiding' : ''}`}>
      {/* 4 dark panels */}
      <div className="sg-panel sg-panel--top" style={{ height: Math.max(0, ct) }} />
      <div className="sg-panel sg-panel--bottom" style={{ top: ct + ch }} />
      <div className="sg-panel sg-panel--left" style={{ top: ct, height: ch, width: Math.max(0, cl) }} />
      <div className="sg-panel sg-panel--right" style={{ top: ct, height: ch, left: cl + cw }} />

      {/* Wiggle border */}
      <div
        className="swipe-guide__wiggle-frame"
        style={{ top: ct, left: cl, width: cw, height: ch }}
      />

      {/* Animated hand */}
      <div
        className={`swipe-guide__hand-container ${dirClass}`}
        key={step.id} /* re-trigger animation on step change */
        style={{
          top: cardRect.top + cardRect.height / 2 - 24,
          left: cardRect.left + cardRect.width / 2,
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
          <span>{arrowChar}</span>
        </div>
        <span className="swipe-guide__label-text">{label}</span>
      </div>

      {/* Wrong direction toast */}
      {wrongWay && (
        <div className="sg-wrong-way">
          {texts.wrongWay}
        </div>
      )}

      {/* Step counter + skip */}
      <div className="sg-bottom">
        <span className="sg-step-counter">{stepLabel}</span>
        <button className="swipe-guide__skip" onClick={triggerClose}>
          {texts.skip}
        </button>
      </div>
    </div>
  );
};

export default SwipeGuide;
