// src/pages/AIPackGenerator.jsx
// AI-генератор паков привычек. Флоу: ввод+опрос → оплата ДО генерации →
// анимация → превью (без ачивок) → активация. См. ADR 0006.
import React, { useState, useEffect, useCallback } from 'react';
import { aiPacksService } from '../services/aiPacks';
import { useNavigation } from '../hooks/useNavigation';
import { useTelegramTheme } from '../hooks/useTelegramTheme';
import { useTranslation } from '../hooks/useTranslation';
import { getPackBackground } from '../constants/gradientPresets';
import Loader from '../components/common/Loader';
import './AIPackGenerator.css';

const DAY_NAMES = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const AIPackGenerator = ({ onClose }) => {
  useTelegramTheme();
  useNavigation(onClose);
  const { t } = useTranslation();

  // step: loading | input | generating | preview | activated | unavailable
  const [step, setStep] = useState('loading');
  const [options, setOptions] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [survey, setSurvey] = useState({});
  const [requestId, setRequestId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [redoAvailable, setRedoAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // ── Загрузка опций ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await aiPacksService.getOptions();
        setOptions(data);
        setStep(data.configured ? 'input' : 'unavailable');
      } catch (e) {
        console.error('aiPacks.getOptions failed', e);
        setStep('unavailable');
      }
    })();
  }, []);

  const pickChip = (group, value) => {
    setSurvey((s) => ({ ...s, [group]: s[group] === value ? undefined : value }));
  };

  // ── Запуск генерации (после оплаты/free) ─────────────────────────────────────
  const runGeneration = useCallback(async (id) => {
    setStep('generating');
    setError('');
    try {
      const res = await aiPacksService.generate(id);
      setPreview(res.preview);
      setRedoAvailable(true);
      setStep('preview');
    } catch (e) {
      const code = e?.response?.data?.code;
      const msg = e?.response?.data?.error
        || t('aiPack.errorGeneric') || 'Не удалось сгенерировать пак.';
      setError(msg);
      setStep('input');
      if (code) console.warn('generation error code:', code);
    }
  }, [t]);

  // ── Сабмит: создаём запрос, free → сразу генерим, paid → инвойс ──────────────
  const handleSubmit = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await aiPacksService.createRequest({
        prompt: prompt.trim(),
        survey,
        lang: 'ru',
      });
      setRequestId(res.request_id);

      if (res.free) {
        setBusy(false);
        await runGeneration(res.request_id);
        return;
      }

      // Paid → открываем инвойс Telegram Stars
      const tg = window.Telegram?.WebApp;
      if (!res.invoice_link || !tg?.openInvoice) {
        setBusy(false);
        setError(t('aiPack.errorPay') || 'Оплата недоступна.');
        return;
      }
      tg.openInvoice(res.invoice_link, async (status) => {
        setBusy(false);
        if (status === 'paid') {
          await runGeneration(res.request_id);
        } else if (status === 'cancelled') {
          // тихо возвращаемся к вводу
        } else {
          setError(t('aiPack.errorPay') || 'Платёж не прошёл.');
        }
      });
    } catch (e) {
      setBusy(false);
      const code = e?.response?.data?.code;
      if (code === 'AI_NOT_CONFIGURED') {
        setStep('unavailable');
        return;
      }
      setError(e?.response?.data?.error || t('aiPack.errorGeneric') || 'Что-то пошло не так.');
    }
  };

  const handleRedo = async () => {
    if (busy || !requestId) return;
    setBusy(true);
    setStep('generating');
    setError('');
    try {
      const res = await aiPacksService.redo(requestId);
      setPreview(res.preview);
      setRedoAvailable(false);
      setStep('preview');
    } catch (e) {
      setError(e?.response?.data?.error || t('aiPack.errorGeneric') || 'Не удалось переделать.');
      setStep('preview');
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async () => {
    if (busy || !requestId) return;
    setBusy(true);
    setError('');
    try {
      await aiPacksService.activate(requestId);
      setStep('activated');
    } catch (e) {
      setError(e?.response?.data?.error || t('aiPack.errorGeneric') || 'Не удалось активировать.');
    } finally {
      setBusy(false);
    }
  };

  // ── Рендер шагов ──────────────────────────────────────────────────────────────
  const renderInput = () => {
    const free = options?.free_remaining > 0;
    const priceLabel = free
      ? (t('aiPack.freeBadge') || 'Бесплатно')
      : `${options?.price_stars ?? 1} ⭐`;
    return (
      <div className="aigen__body">
        <h1 className="aigen__title">{t('aiPack.title') || 'AI-генератор паков'}</h1>
        <p className="aigen__subtitle">
          {t('aiPack.subtitle') || 'Опиши цель — ИИ соберёт персональный пак привычек'}
        </p>

        <textarea
          className="aigen__textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder={t('aiPack.placeholder') || 'Например: хочу стать продуктивнее по утрам'}
        />

        {options?.survey_options && (
          <div className="aigen__survey">
            {Object.entries(options.survey_options).map(([group, values]) => (
              <div className="aigen__survey-group" key={group}>
                <div className="aigen__survey-label">
                  {t(`aiPack.survey.${group}`) || group}
                </div>
                <div className="aigen__chips">
                  {values.map((v) => (
                    <button
                      key={v}
                      className={`aigen__chip ${survey[group] === v ? 'aigen__chip--active' : ''}`}
                      onClick={() => pickChip(group, v)}
                      type="button"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <div className="aigen__error">{error}</div>}

        <button
          className="aigen__cta"
          disabled={!prompt.trim() || busy}
          onClick={handleSubmit}
          type="button"
        >
          {busy
            ? (t('aiPack.preparing') || 'Готовим…')
            : `${t('aiPack.generate') || 'Сгенерировать'} · ${priceLabel}`}
        </button>
        {!free && (
          <p className="aigen__hint">{t('aiPack.payHint') || 'Оплата до генерации. 1 бесплатная переделка включена.'}</p>
        )}
      </div>
    );
  };

  const renderGenerating = () => (
    <div className="aigen__gen">
      <div className="aigen__orb">
        <span className="aigen__orb-ring" />
        <span className="aigen__orb-ring aigen__orb-ring--2" />
        <span className="aigen__orb-core" />
      </div>
      <p className="aigen__gen-text">{t('aiPack.generating') || 'ИИ собирает твой пак…'}</p>
      <p className="aigen__gen-sub">{t('aiPack.generatingSub') || 'Это займёт несколько секунд'}</p>
    </div>
  );

  const renderPreview = () => {
    if (!preview) return null;
    const bg = getPackBackground(preview);
    return (
      <div className="aigen__body">
        <div className="aigen__preview-hero" style={{ background: bg }}>
          <span className="aigen__preview-spark">✨</span>
          <h2 className="aigen__preview-name">{preview.name}</h2>
          {preview.short_description && (
            <p className="aigen__preview-desc">{preview.short_description}</p>
          )}
        </div>

        <div className="aigen__preview-count">
          {(t('aiPack.habitsCount') || '{n} привычек').replace('{n}', preview.habit_count)}
        </div>

        <div className="aigen__habits">
          {preview.habits.map((h, i) => (
            <div className="aigen__habit" key={i}>
              <div className="aigen__habit-title">{h.title}</div>
              {h.goal && <div className="aigen__habit-goal">{h.goal}</div>}
              <div className="aigen__habit-meta">
                <span>{(h.schedule_days || []).map((d) => DAY_NAMES[d]).join(' ')}</span>
                {h.reminder_time && <span>⏰ {h.reminder_time}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="aigen__surprise">🎁 {t('aiPack.surprise') || 'Достижения откроются в процессе — сюрприз!'}</div>

        {error && <div className="aigen__error">{error}</div>}

        <button className="aigen__cta" disabled={busy} onClick={handleActivate} type="button">
          {busy ? (t('aiPack.activating') || 'Активируем…') : (t('aiPack.activate') || 'Активировать пак')}
        </button>
        {redoAvailable && (
          <button className="aigen__secondary" disabled={busy} onClick={handleRedo} type="button">
            🔄 {t('aiPack.redo') || 'Переделать (бесплатно)'}
          </button>
        )}
      </div>
    );
  };

  const renderActivated = () => (
    <div className="aigen__done">
      <div className="aigen__done-check">✓</div>
      <h2 className="aigen__done-title">{t('aiPack.activatedTitle') || 'Пак активирован!'}</h2>
      <p className="aigen__done-sub">
        {t('aiPack.activatedSub') || 'Привычки появились в «Сегодня». Удачи!'}
      </p>
      <button className="aigen__cta" onClick={onClose} type="button">
        {t('aiPack.toToday') || 'Перейти к привычкам'}
      </button>
    </div>
  );

  const renderUnavailable = () => (
    <div className="aigen__done">
      <div className="aigen__orb aigen__orb--static">
        <span className="aigen__orb-core" />
      </div>
      <h2 className="aigen__done-title">{t('aiPack.soonTitle') || 'Скоро будет доступно'}</h2>
      <p className="aigen__done-sub">
        {t('aiPack.soonSub') || 'AI-генератор паков скоро заработает. Загляни позже ✨'}
      </p>
      <button className="aigen__cta" onClick={onClose} type="button">
        {t('aiPack.back') || 'Назад'}
      </button>
    </div>
  );

  return (
    <div className="aigen">
      {step === 'loading' && (
        <div className="aigen__loader"><Loader /></div>
      )}
      {step === 'input' && renderInput()}
      {step === 'generating' && renderGenerating()}
      {step === 'preview' && renderPreview()}
      {step === 'activated' && renderActivated()}
      {step === 'unavailable' && renderUnavailable()}
    </div>
  );
};

export default AIPackGenerator;
