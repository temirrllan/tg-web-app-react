import React, { useState, useEffect, useRef } from 'react'; 
import Button from '../common/Button';
import { habitService } from '../../services/habits';
import { DAYS_OF_WEEK } from '../../utils/constants';
import './CreateHabitForm.css';
import { useLocalization } from '../../hooks/useLocalization';

const CreateHabitForm = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
const { dictionary } = useLocalization();

  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  const scheduleRef = useRef(null);
  const timeRef = useRef(null);

  // Инициализация formData с новыми полями
  const [formData, setFormData] = useState({
    title: '',
    goal: '',
    category_id: null,
    schedule_type: 'daily',         // daily, interval, weekly, monthly
    schedule_days: [1, 2, 3, 4, 5, 6, 7], // для weekly/daily
    schedule_interval: '',          // число дней для interval
    schedule_monthly: null,         // { type: 'day_of_month', day: 1 }
    reminder_enabled: true,
    reminder_time: '',
    reminder_days: [],              // дни недели для напоминаний
    is_bad_habit: false
  });

  useEffect(() => {
    loadCategories();
  }, []);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (scheduleRef.current && !scheduleRef.current.contains(event.target)) {
        setShowScheduleDropdown(false);
      }
      if (timeRef.current && !timeRef.current.contains(event.target)) {
        setShowTimeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);
      const data = await habitService.getCategories();
      if (data.success && data.categories) {
        const uniqueCategories = Array.from(
          new Map(data.categories.map(cat => [cat.id, cat])).values()
        );
        setCategories(uniqueCategories);
      } else {
        throw new Error('Invalid categories response');
      }
    } catch (error) {
      setCategoriesError(error.message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Переключение дней для расписания (weekly)
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

  // Переключение дней для напоминаний
  const handleReminderDayToggle = (dayId) => {
    const days = [...formData.reminder_days];
    if (days.includes(dayId)) {
      setFormData(prev => ({
        ...prev,
        reminder_days: days.filter(d => d !== dayId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        reminder_days: [...days, dayId].sort((a, b) => a - b)
      }));
    }
  };

  // Обработка выбора расписания
  const handleScheduleSelect = (type) => {
    let newData = {
      schedule_type: type,
    };

    if (type === 'daily') {
      newData.schedule_days = [1, 2, 3, 4, 5, 6, 7];
      newData.schedule_interval = '';
      newData.schedule_monthly = null;
    } else if (type === 'weekly') {
      newData.schedule_days = [1, 2, 3, 4, 5];
      newData.schedule_interval = '';
      newData.schedule_monthly = null;
    } else if (type === 'interval') {
      newData.schedule_days = [];
      newData.schedule_interval = 1; // default 1 day
      newData.schedule_monthly = null;
    } else if (type === 'monthly') {
      newData.schedule_days = [];
      newData.schedule_interval = '';
      newData.schedule_monthly = { type: 'day_of_month', day: 1 };
    }

    setFormData(prev => ({
      ...prev,
      ...newData
    }));

    setShowScheduleDropdown(false);
  };

  // Форматирование метки расписания
  const getScheduleLabel = () => {
    const { schedule_type, schedule_days, schedule_interval, schedule_monthly } = formData;
    if (schedule_type === 'daily') {
      return 'Every Day';
    } 
    if (schedule_type === 'weekly') {
      if (schedule_days.length === 5 && schedule_days.every(d => d >= 1 && d <= 5)) {
        return 'Weekdays';
      }
      return 'Selected Days';
    }
    if (schedule_type === 'interval') {
      return `Every ${schedule_interval} day${schedule_interval > 1 ? 's' : ''}`;
    }
    if (schedule_type === 'monthly' && schedule_monthly) {
      return `Monthly on day ${schedule_monthly.day}`;
    }
    return 'Custom';
  };

  // Форматирование времени напоминания в AM/PM
  const formatTime = (time) => {
    if (!time) return 'Select time';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Обработка выбора времени напоминания
  const handleTimeSelect = (time) => {
    handleInputChange('reminder_time', time);
    setShowTimeDropdown(false);
  };

  // Валидация перед отправкой
  const canSubmit = () => {
    if (loading) return false;
    if (!formData.title.trim() || !formData.goal.trim()) return false;
    if (!formData.is_bad_habit && !formData.category_id) return false;

    if (formData.schedule_type === 'interval' && (!formData.schedule_interval || formData.schedule_interval < 1)) {
      return false;
    }
    if (formData.schedule_type === 'monthly' && (!formData.schedule_monthly || !formData.schedule_monthly.day || formData.schedule_monthly.day < 1 || formData.schedule_monthly.day > 31)) {
      return false;
    }

    return true;
  };

  // Сабмит формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit()) return;

    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        reminder_time: formData.reminder_time ? `${formData.reminder_time}:00` : null,
        // Чтобы бэкенд правильно получил monthly как объект JSON
        schedule_monthly: formData.schedule_monthly,
      };
      await onSuccess(dataToSubmit);
      onClose();
    } catch (error) {
      alert('Error: ' + (error.message || 'Failed to create habit'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-habit">
      <div className="create-habit__header">
        <button className="create-habit__close" onClick={onClose}>Cancel</button>
        <div className="create-habit__header-title">
          <h2>Habit Tracker</h2>
          <span className="create-habit__subtitle">mini-app</span>
        </div>
        <button className="create-habit__menu">⋯</button>
      </div>

      <form className="create-habit__form" onSubmit={handleSubmit}>
        <div className="create-habit__content">

          {/* Habit name */}
          <div className="form-section">
            <label className="form-label">
<span className="form-label-title">{dictionary.habitName || 'Habit name'}</span>
              <input
                type="text"
                className="form-input"
  placeholder={dictionary.habitPlaceholder || 'What is your goal?'}
                  value={formData.title}
                onChange={e => handleInputChange('title', e.target.value)}
                maxLength={255}
                required
              />
            </label>
            <p className="form-hint">
              Being specific is better. Instead of "Jog", think "Jog for 20 minutes" or "Jog for 2 miles"
            </p>
          </div>

          {/* Goal */}
          <div className="form-section">
            <label className="form-label">
              <span className="form-label-title">Goal</span>
              <textarea
                className="form-textarea"
                placeholder="What's your motivation?"
                value={formData.goal}
                onChange={e => handleInputChange('goal', e.target.value)}
                rows={3}
                required
              />
            </label>
          </div>

          {/* Category (only for good habits) */}
          {!formData.is_bad_habit && (
            <div className="form-section">
              <span className="form-label-title">Category</span>
              {categoriesLoading && <div className="categories-loading">Loading categories...</div>}
              {!categoriesLoading && !categoriesError && categories.length > 0 && (
                <div className="category-grid">
                  {categories.slice(0, 6).map(category => (
                    <button
                      key={category.id}
                      type="button"
                      className={`category-item${formData.category_id === category.id ? ' category-item--selected' : ''}`}
                      onClick={e => {
                        e.preventDefault();
                        handleInputChange('category_id', category.id);
                      }}
                      style={{
                        backgroundColor: formData.category_id === category.id ? category.color : undefined,
                        borderColor: formData.category_id === category.id ? category.color : 'transparent',
                      }}
                    >
                      <span className="category-item__icon">{category.icon}</span>
                      <span className="category-item__name">{category.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schedule (only for good habits) */}
          {!formData.is_bad_habit && (
            <>
              {/* Schedule type selector */}
              <div className="form-section" ref={scheduleRef}>
                <span className="form-label-title">Repeat</span>
                <button
                  type="button"
                  className="dropdown-button"
                  onClick={e => {
                    e.preventDefault();
                    setShowScheduleDropdown(!showScheduleDropdown);
                  }}
                >
                  {getScheduleLabel()}
                </button>

                {showScheduleDropdown && (
                  <div className="dropdown-menu">
                    <button type="button" className="dropdown-item" onClick={e => { e.preventDefault(); e.stopPropagation(); handleScheduleSelect('daily'); }}>
                      Every Day
                    </button>
                    <button type="button" className="dropdown-item" onClick={e => { e.preventDefault(); e.stopPropagation(); handleScheduleSelect('interval'); }}>
                      Every N Days
                    </button>
                    <button type="button" className="dropdown-item" onClick={e => { e.preventDefault(); e.stopPropagation(); handleScheduleSelect('weekly'); }}>
                      Weekly (Days of Week)
                    </button>
                    <button type="button" className="dropdown-item" onClick={e => { e.preventDefault(); e.stopPropagation(); handleScheduleSelect('monthly'); }}>
                      Monthly
                    </button>
                  </div>
                )}
              </div>

              {/* Interval input */}
              {formData.schedule_type === 'interval' && (
                <div className="form-section">
                  <label className="form-label">
                    <span className="form-label-title">Every N days</span>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={formData.schedule_interval}
                      onChange={e => handleInputChange('schedule_interval', e.target.value)}
                      required
                    />
                  </label>
                </div>
              )}

              {/* Weekly days selector */}
              {formData.schedule_type === 'weekly' && (
                <div className="form-section">
                  <span className="form-label-title">On which days?</span>
                  <div className="days-selector">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.id}
                        type="button"
                        className={`day-button${formData.schedule_days.includes(day.id) ? ' day-button--selected' : ''}`}
                        onClick={e => { e.preventDefault(); handleDayToggle(day.id); }}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly day selector */}
              {formData.schedule_type === 'monthly' && (
                <div className="form-section">
                  <label className="form-label">
                    <span className="form-label-title">Day of month</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={formData.schedule_monthly?.day || ''}
                      onChange={e =>
                        handleInputChange('schedule_monthly', { type: 'day_of_month', day: Number(e.target.value) })
                      }
                      required
                    />
                  </label>
                </div>
              )}

              {/* Reminder enabled toggle */}
              <div className="form-section">
                <label className="form-label">
                  <input
                    type="checkbox"
                    checked={formData.reminder_enabled}
                    onChange={e => handleInputChange('reminder_enabled', e.target.checked)}
                  />
                  <span style={{ marginLeft: 8 }}>Enable reminders</span>
                </label>
              </div>

              {/* Reminder time picker */}
              {formData.reminder_enabled && (
                <div className="form-section" ref={timeRef}>
                  <span className="form-label-title">Reminder time</span>
                  <button
                    type="button"
                    className="dropdown-button"
                    onClick={e => {
                      e.preventDefault();
                      setShowTimeDropdown(!showTimeDropdown);
                    }}
                  >
                    {formatTime(formData.reminder_time)}
                  </button>

                  {showTimeDropdown && (
                    <div className="time-picker-dropdown">
                      <div className="time-picker-header">
                        <span>Select time</span>
                        <button
                          type="button"
                          className="time-picker-close"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowTimeDropdown(false);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      <input
                        type="time"
                        value={formData.reminder_time}
                        onChange={e => handleTimeSelect(e.target.value)}
                        className="time-picker-input"
                        autoFocus
                      />
                      <div className="time-picker-preset">
                        <button type="button" onClick={e => { e.preventDefault(); handleTimeSelect('09:00'); }}>
                          9:00 AM
                        </button>
                        <button type="button" onClick={e => { e.preventDefault(); handleTimeSelect('12:00'); }}>
                          12:00 PM
                        </button>
                        <button type="button" onClick={e => { e.preventDefault(); handleTimeSelect('18:00'); }}>
                          6:00 PM
                        </button>
                        <button type="button" onClick={e => { e.preventDefault(); handleTimeSelect('21:00'); }}>
                          9:00 PM
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Reminder days selector */}
              {formData.reminder_enabled && (
                <div className="form-section">
                  <span className="form-label-title">Reminder days</span>
                  <div className="days-selector">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.id}
                        type="button"
                        className={`day-button${formData.reminder_days.includes(day.id) ? ' day-button--selected' : ''}`}
                        onClick={e => {
                          e.preventDefault();
                          handleReminderDayToggle(day.id);
                        }}
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bad habit toggle */}
          <div className="form-section">
            <div className="bad-habit-toggle">
              <div className="bad-habit-label">
                <span className="form-label-title">Bad habit 😈</span>
              </div>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`toggle-button ${!formData.is_bad_habit ? 'toggle-button--active' : ''}`}
                  onClick={() => handleInputChange('is_bad_habit', false)}
                >
                  No
                </button>
                <button
                  type="button"
                  className={`toggle-button ${formData.is_bad_habit ? 'toggle-button--active' : ''}`}
                  onClick={() => handleInputChange('is_bad_habit', true)}
                >
                  Yes
                </button>
              </div>
            </div>
            <p className="form-hint">
              {formData.is_bad_habit
                ? 'For bad habits, you only need to set name and goal.'
                : 'Helping text for explaining about good habits.'}
            </p>
          </div>
        </div>

        {/* Submit button */}
        <div className="form-footer">
          <button
            type="submit"
            className="submit-button"
            disabled={!canSubmit()}
          >
            {loading ? 'Creating...' : 'Create habit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHabitForm;
