import React, { useState, useEffect, useRef } from 'react';
import { habitService } from '../../services/habits';
import { DAYS_OF_WEEK } from '../../utils/constants';
import './CreateHabitForm.css';
import { useNavigation } from '../../hooks/useNavigation';
import { useTranslation } from '../../hooks/useTranslation';

const CreateHabitForm = ({ onClose, onSuccess }) => {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [repeatActive, setRepeatActive] = useState(false);
  const [timeActive, setTimeActive] = useState(false);

  const repeatRef = useRef(null);
  const timeRef = useRef(null);
  useNavigation(onClose);

  const [showDaysAnimation, setShowDaysAnimation] = useState(false);

  // 🆕 Счетчики символов
  const [titleLength, setTitleLength] = useState(0);
  const [goalLength, setGoalLength] = useState(0);

  const [formData, setFormData] = useState({
    title: '',
    goal: '',
    category_id: null,
    schedule_type: 'daily',
    schedule_days: [1, 2, 3, 4, 5, 6, 7],
    reminder_time: '',
    reminder_enabled: true,
    is_bad_habit: false
  });

  const [repeatMode, setRepeatMode] = useState('everyday');

  // 🆕 Константы лимитов
  const TITLE_MAX_LENGTH = 25;
  const GOAL_MAX_LENGTH = 35;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (repeatRef.current && !repeatRef.current.contains(event.target)) {
        setShowRepeatDropdown(false);
      }
      if (timeRef.current && !timeRef.current.contains(event.target)) {
        setShowTimeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (repeatActive && repeatMode !== 'everyday') {
      setTimeout(() => setShowDaysAnimation(true), 50);
    } else {
      setShowDaysAnimation(false);
    }
  }, [repeatActive, repeatMode]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await habitService.getCategories();
      if (data.success && data.categories) {
        const uniqueCategories = Array.from(
          new Map(data.categories.map(cat => [cat.id, cat])).values()
        );
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // 🆕 Обновленный handleInputChange с проверкой длины
  const handleInputChange = (field, value) => {
    if (field === 'title') {
      // Ограничиваем длину title до 15 символов
      if (value.length <= TITLE_MAX_LENGTH) {
        setFormData(prev => ({ ...prev, [field]: value }));
        setTitleLength(value.length);
      }
    } else if (field === 'goal') {
      // Ограничиваем длину goal до 35 символов
      if (value.length <= GOAL_MAX_LENGTH) {
        setFormData(prev => ({ ...prev, [field]: value }));
        setGoalLength(value.length);
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDayToggle = (dayId) => {
    const days = [...formData.schedule_days];
    if (days.includes(dayId)) {
      if (days.length > 1) {
        setFormData(prev => ({
          ...prev,
          schedule_days: days.filter(d => d !== dayId)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        schedule_days: [...days, dayId].sort((a, b) => a - b)
      }));
    }
  };

  const handleRepeatSelect = (type) => {
    let newDays = [];
    setRepeatMode(type);

    if (type === 'everyday') {
      newDays = [1, 2, 3, 4, 5, 6, 7];
      setFormData(prev => ({ ...prev, schedule_type: 'daily', schedule_days: newDays }));
    } else if (type === 'weekdays') {
      newDays = [1, 2, 3, 4, 5];
      setFormData(prev => ({ ...prev, schedule_type: 'weekdays', schedule_days: newDays }));
    } else if (type === 'weekend') {
      newDays = [6, 7];
      setFormData(prev => ({ ...prev, schedule_type: 'weekend', schedule_days: newDays }));
    } else if (type === 'custom') {
      if (formData.schedule_days.length === 7 || formData.schedule_days.length === 0) {
        newDays = [1, 2, 3, 4, 5];
      } else {
        newDays = formData.schedule_days;
      }
      setFormData(prev => ({ ...prev, schedule_type: 'custom', schedule_days: newDays }));
    }

    setShowRepeatDropdown(false);
    setRepeatActive(true);
  };

  const handleTimeSelect = () => {
    setTimeActive(true);
    setShowTimeDropdown(false);
  };

  const formatTime12h = (time) => {
    if (!time) return t('createHabit.default');
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? t('createHabit.pm') : t('createHabit.am');
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getRepeatLabel = () => {
    if (!repeatActive) return t('createHabit.default');
    switch (repeatMode) {
      case 'everyday': return t('createHabit.repeat.everyDay');
      case 'weekdays': return t('createHabit.repeat.weekdays');
      case 'weekend':  return t('createHabit.repeat.weekend');
      case 'custom':   return t('createHabit.repeat.custom');
      default:         return t('createHabit.repeat.everyDay');
    }
  };

  const getTimeLabel = () => {
    if (!timeActive || !formData.reminder_time) return t('createHabit.default');
    return formatTime12h(formData.reminder_time);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.schedule_days.length === 0) {
      alert(t('createHabit.errors.selectAtLeastOneDay'));
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        reminder_time: formData.reminder_time ? `${formData.reminder_time}:00` : null
      };
      await onSuccess(dataToSubmit);
      onClose();
    } catch (error) {
      alert(`${t('createHabit.errors.createFailed')}: ${error.message || t('createHabit.errors.unknown')}`);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.title.trim() &&
           formData.goal.trim() &&
           (!formData.is_bad_habit ? formData.category_id : true) &&
           formData.schedule_days.length > 0;
  };

  const shouldUseWhiteText = (category) => {
    const color = category.color;
    if (!color) return false;
    const darkColors = ['#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#6366F1', '#F59E0B', '#14B8A6', '#84CC16', '#6B7280', '#A855F7'];
    return darkColors.includes(color);
  };

  return (
    <div className="create-habit">
      <form className="create-habit__form" onSubmit={handleSubmit}>
        <div className="create-habit__content">
          {/* Habit name with character counter */}
          <div className="form-section">
            <label className="form-label">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="form-label-title">{t('createHabit.habitName')}</span>
                <span style={{ 
                  fontSize: '13px', 
                  color: titleLength >= TITLE_MAX_LENGTH ? '#FF3B30' : '#8E8E93',
                  fontWeight: titleLength >= TITLE_MAX_LENGTH ? '600' : '400'
                }}>
                  {titleLength}/{TITLE_MAX_LENGTH}
                </span>
              </div>
              <input
                type="text"
                className="form-input"
                placeholder={t('createHabit.habitNamePlaceholder')}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                maxLength={TITLE_MAX_LENGTH}
                required
              />
            </label>
            <p className="form-hint">
              {t('createHabit.habitNameHint')}
            </p>
          </div>

          {/* Goal with character counter */}
          <div className="form-section">
            <label className="form-label">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="form-label-title">{t('createHabit.goal')}</span>
                <span style={{ 
                  fontSize: '13px', 
                  color: goalLength >= GOAL_MAX_LENGTH ? '#FF3B30' : '#8E8E93',
                  fontWeight: goalLength >= GOAL_MAX_LENGTH ? '600' : '400'
                }}>
                  {goalLength}/{GOAL_MAX_LENGTH}
                </span>
              </div>
              <input
                className="form-textarea"
                placeholder={t('createHabit.goalPlaceholder')}
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                maxLength={GOAL_MAX_LENGTH}
                required
              />
            </label>
          </div>

          {/* Category */}
          {!formData.is_bad_habit && (
            <div className="form-section">
              <span className="form-label-title">{t('createHabit.category')}</span>
              {!categoriesLoading && categories.length > 0 && (
                <div className="category-scroll-container">
                  <div className="category-scroll">
                    {categories.map(category => {
                      const isSelected = formData.category_id === category.id;
                      const useWhiteText = isSelected && shouldUseWhiteText(category);
                      return (
                        <button
                          key={category.id}
                          className={`category-item ${isSelected ? 'category-item--selected' : ''} ${useWhiteText ? 'category-item--colored' : ''}`}
                          onClick={(e) => { e.preventDefault(); handleInputChange('category_id', category.id); }}
                          type="button"
                          style={{
                            backgroundColor: isSelected ? category.color : category.color + '20',
                            color: useWhiteText ? 'white' : undefined
                          }}
                        >
                          <div className="category-item__icon">{category.icon}</div>
                          <span className="category-item__name" style={{ color: useWhiteText ? 'white' : undefined }}>
                            {category.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schedule (only for good habits) */}
          {!formData.is_bad_habit && (
            <>
              {/* Repeat */}
              <div className="form-section-row" ref={repeatRef}>
                <span className="form-label-title">{t('createHabit.repeat.title')}</span>
                <button
                  type="button"
                  className={`dropdown-button ${repeatActive ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setShowRepeatDropdown(!showRepeatDropdown); }}
                >
                  {getRepeatLabel()}
                </button>

                {showRepeatDropdown && (
                  <div className="dropdown-menu">
                    <button type="button" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleRepeatSelect('everyday'); }}>
                      {t('createHabit.repeat.everyDay')}
                    </button>
                    <button type="button" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleRepeatSelect('weekdays'); }}>
                      {t('createHabit.repeat.weekdays')}
                    </button>
                    <button type="button" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleRepeatSelect('weekend'); }}>
                      {t('createHabit.repeat.weekend')}
                    </button>
                    <button type="button" className="dropdown-item" onClick={(e) => { e.preventDefault(); handleRepeatSelect('custom'); }}>
                      {t('createHabit.repeat.custom')}
                    </button>
                  </div>
                )}
              </div>

              {/* On which days? */}
              {repeatActive && repeatMode !== 'everyday' && (
                <div className={`form-section days-section ${showDaysAnimation ? 'days-section--visible' : ''}`}>
                  <span className="form-label-title">{t('createHabit.onWhichDays')}</span>
                  <div className="days-selector">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.id}
                        className={`day-button ${formData.schedule_days.includes(day.id) ? 'day-button--selected' : ''}`}
                        onClick={(e) => { e.preventDefault(); handleDayToggle(day.id); }}
                        type="button"
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reminder time */}
              <div className="form-section-rw2" ref={timeRef}>
                <span className="form-label-title">{t('createHabit.pingMe')}</span>
                <button
                  type="button"
                  className={`dropdown-button ${timeActive ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); setShowTimeDropdown(!showTimeDropdown); }}
                >
                  {getTimeLabel()}
                </button>

                {showTimeDropdown && (
                  <div className="time-picker-dropdown">
                    <div className="time-picker-header">
                      <span>{t('createHabit.selectTime')}</span>
                      <button
                        type="button"
                        className="time-picker-done"
                        onClick={(e) => { e.preventDefault(); handleTimeSelect(); }}
                      >
                        {t('common.done')}
                      </button>
                    </div>
                    <input
                      type="time"
                      value={formData.reminder_time}
                      onChange={(e) => { handleInputChange('reminder_time', e.target.value); }}
                      className="time-picker-input"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bad habit toggle */}
          {/* Bad habit toggle */}
          <div className="form-section">
            <div className="bad-habit-toggle">
              <div className="bad-habit-label">
                <span className="form-label-title">{t('createHabit.badHabit')} 😈</span>
              </div>
              <button
                type="button"
                className={`toggle-switch ${formData.is_bad_habit ? 'toggle-switch--active' : ''}`}
                onClick={() => handleInputChange('is_bad_habit', !formData.is_bad_habit)}
                aria-label="Toggle bad habit"
              >
                <div className="toggle-switch__slider" />
              </button>
            </div>
            <p className="form-hint">
              {formData.is_bad_habit
                ? t('createHabit.badHabitHintOn')
                : t('createHabit.badHabitHintOff')}
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="form-footer">
          <button type="submit" className="submit-button" disabled={loading || !isFormValid()}>
            {loading ? t('createHabit.creating') : t('createHabit.create')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHabitForm;

