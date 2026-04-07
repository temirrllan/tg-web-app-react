// src/components/hints/OnboardingGuide.jsx
// Step-by-step onboarding: Week → FAB → Menu → Form.
// Uses 4-panel dark overlay so the target element is always tappable.
// Each step waits for the user to interact, then advances automatically.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import './OnboardingGuide.css';

const STEPS = ['week', 'fab', 'menu', 'form'];

const translations = {
  en: {
    week: 'Swipe to navigate between days',
    fab: 'Tap + to create your first habit!',
    menu: 'Tap "Custom habit"',
    form: 'Enter a name and tap "Create"',
    skip: 'Skip',
    next: 'Next',
  },
  ru: {
    week: 'Листайте, чтобы переключать дни',
    fab: 'Нажмите +, чтобы создать привычку!',
    menu: 'Нажмите «Своя привычка»',
    form: 'Введите название и нажмите «Создать»',
    skip: 'Пропустить',
    next: 'Далее',
  },
  kk: {
    week: 'Күндерді ауыстыру үшін сырғытыңыз',
    fab: 'Әдет жасау үшін + басыңыз!',
    menu: '«Өз әдетім» басыңыз',
    form: 'Атауын жазып, «Жасау» басыңыз',
    skip: 'Өткізу',
    next: 'Келесі',
  },
};

const STEP_SELECTORS = {
  week: '.week-navigation',
  fab: '.fab',
  menu: '.ahm-row--custom',
  form: '.form-input',
};

const STEP_BUBBLE_POS = {
  week: 'below',
  fab: 'above-left',
  menu: 'left',
  form: 'below',
};

const PADDING = 8;
const POLL_MS = 80;

const OnboardingGuide = ({ show, onComplete }) => {
  const { language } = useTranslation();
  const texts = translations[language] || translations.ru;

  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [hiding, setHiding] = useState(false);
  const closedRef = useRef(false);
  const pollRef = useRef(null);

  const step = STEPS[stepIndex];

  // ── Poll for the target element until it appears ──────────────────────────
  const acquireTarget = useCallback((selector) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setRect(null);

    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      return true;
    };

    if (!measure()) {
      pollRef.current = setInterval(() => {
        if (measure()) clearInterval(pollRef.current);
      }, POLL_MS);
    }
  }, []);

  const advanceStep = useCallback(() => {
    setRect(null);
    setStepIndex((prev) => prev + 1);
  }, []);

  // ── When step changes, acquire its target ─────────────────────────────────
  useEffect(() => {
    if (!show || hiding) return;
    if (stepIndex >= STEPS.length) {
      triggerClose();
      return;
    }
    const selector = STEP_SELECTORS[step];
    if (!selector) return;

    const delay = step === 'week' ? 400 : 350;
    const t = setTimeout(() => acquireTarget(selector), delay);
    return () => {
      clearTimeout(t);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [show, stepIndex, hiding, acquireTarget]);

  // ── Detect user interaction to advance steps ──────────────────────────────
  useEffect(() => {
    if (!show || hiding || !rect) return;

    if (step === 'week') {
      // "Next" button handles advance — no auto-detect needed
      return;
    }

    if (step === 'fab') {
      // Wait for AddHabitMenu to appear → advance to menu
      const poll = setInterval(() => {
        if (document.querySelector('.ahm-container--open')) {
          clearInterval(poll);
          advanceStep();
        }
      }, POLL_MS);
      return () => clearInterval(poll);
    }

    if (step === 'menu') {
      // Wait for CreateHabitForm to appear → advance to form
      const poll = setInterval(() => {
        if (document.querySelector('.create-habit')) {
          clearInterval(poll);
          advanceStep();
        }
      }, POLL_MS);
      return () => clearInterval(poll);
    }

    if (step === 'form') {
      const input = document.querySelector(STEP_SELECTORS.form);
      if (!input) return;

      const handleFocus = () => triggerClose();
      input.addEventListener('focus', handleFocus);
      const timer = setTimeout(() => triggerClose(), 4000);

      return () => {
        input.removeEventListener('focus', handleFocus);
        clearTimeout(timer);
      };
    }
  }, [show, step, hiding, rect, advanceStep]);

  // ── Close / cleanup ───────────────────────────────────────────────────────
  const triggerClose = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    setHiding(true);
    setTimeout(() => onComplete?.(), 350);
  }, [onComplete]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (!show || !rect) return null;

  const ct = rect.top - PADDING;
  const cl = rect.left - PADDING;
  const cw = rect.width + PADDING * 2;
  const ch = rect.height + PADDING * 2;

  // Bubble positioning
  const bubblePos = STEP_BUBBLE_POS[step] || 'below';
  const bubbleStyle = {};
  if (bubblePos === 'above-left') {
    bubbleStyle.bottom = `calc(100vh - ${ct}px + 12px)`;
    bubbleStyle.right = `${window.innerWidth - (cl + cw)}px`;
  } else if (bubblePos === 'left') {
    bubbleStyle.top = `${rect.top + rect.height / 2}px`;
    bubbleStyle.right = `${window.innerWidth - cl + 12}px`;
    bubbleStyle.transform = 'translateY(-50%)';
  } else {
    // below
    bubbleStyle.top = `${ct + ch + 12}px`;
    bubbleStyle.left = `50%`;
    bubbleStyle.transform = 'translateX(-50%)';
  }

  const label = texts[step] || '';

  return (
    <div className={`ob-guide ${hiding ? 'ob-guide--hiding' : ''}`}>
      {/* 4 dark panels around the target */}
      <div className="ob-panel ob-panel--top" style={{ height: Math.max(0, ct) }} />
      <div className="ob-panel ob-panel--bottom" style={{ top: ct + ch }} />
      <div className="ob-panel ob-panel--left" style={{ top: ct, height: ch, width: Math.max(0, cl) }} />
      <div className="ob-panel ob-panel--right" style={{ top: ct, height: ch, left: cl + cw }} />

      {/* Pulse ring around the target */}
      <div
        className="ob-pulse-ring"
        style={{ top: ct - 4, left: cl - 4, width: cw + 8, height: ch + 8,
                 borderRadius: step === 'fab' ? '50%' : '16px' }}
      />

      {/* Swipe animation inside week navigation */}
      {step === 'week' && (
        <div
          className="ob-week-swipe"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        >
          <span className="ob-week-swipe__arrow ob-week-swipe__arrow--left">‹</span>
          <span className="ob-week-swipe__hand">👆</span>
          <span className="ob-week-swipe__arrow ob-week-swipe__arrow--right">›</span>
        </div>
      )}

      {/* Bubble with text */}
      <div className={`ob-bubble ob-bubble--${bubblePos}`} style={bubbleStyle}>
        <span className="ob-bubble__text">{label}</span>
      </div>

      {/* Bottom actions */}
      <div className="ob-actions">
        <button className="ob-skip" onClick={triggerClose}>
          {texts.skip}
        </button>
        {step === 'week' && (
          <button className="ob-next" onClick={advanceStep}>
            {texts.next} →
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingGuide;
