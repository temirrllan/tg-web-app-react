import React, { useState, useEffect, useRef } from 'react';
import { habitService } from '../../services/habits';
import { DAYS_OF_WEEK } from '../../utils/constants';
import './EditHabitForm.css';
import { useNavigation } from '../../hooks/useNavigation';

const EditHabitForm = ({ habit, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Состояния для выпадающих меню
  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const repeatRef = useRef(null);
  const timeRef = useRef(null);
  
  useNavigation(onClose);

  // Инициализируем форму данными привычки
  const [formData, setFormData] = useState({
    title: habit.title || '',
    goal: habit.goal || '',
    category_id: habit.category_id || null,
    schedule_type: habit.schedule_type || 'daily',
    schedule_days: habit.schedule_days || [1, 2, 3, 4, 5, 6, 7],
    reminder_time: habit.reminder_time ? habit.reminder_time.substring(0, 5) : '',
    reminder_enabled: habit.reminder_enabled !== false,
    is_bad_habit: habit.is_bad_habit || false
  });

  // Дополнительные опции для формы
  const [frequency, setFrequency] = useState(habit.frequency || 'daily');
  const [frequencyCount, setFrequencyCount] = useState(habit.frequency_count || 3);
  const [duration, setDuration] = useState(habit.duration || '3months');
  const [earlyNotification, setEarlyNotification] = useState(habit.early_notification || '1hour');

  useEffect(() => {
    loadCategories();
  }, []);

  // Закрытие dropdown при клике вне
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    
    if (type === 'everyday') {
      newDays = [1, 2, 3, 4, 5, 6, 7];
    } else if (type === 'weekdays') {
      newDays = [1, 2, 3, 4, 5];
    } else if (type === 'weekend') {
      newDays = [6, 7];
    } else if (type === 'custom') {
      newDays = formData.schedule_days;
    }
    
    setFormData(prev => ({
      ...prev,
      schedule_type: type === 'everyday' ? 'daily' : type,
      schedule_days: newDays
    }));
    
    setShowRepeatDropdown(false);
  };

  const getRepeatLabel = () => {
    const days = formData.schedule_days;
    if (days.length === 7) return 'Everyday';
    if (days.length === 5 && days.every(d => d >= 1 && d <= 5)) return 'Weekdays';
    if (days.length === 2 && days.includes(6) && days.includes(7)) return 'Weekend';
    return 'Custom';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.schedule_days.length === 0) {
      alert('Please select at least one day');
      return;
    }
    
    setLoading(true);
    try {
      const dataToSubmit = {
        ...formData,
        reminder_time: formData.reminder_time ? `${formData.reminder_time}:00` : null
      };
      
      await habitService.updateHabit(habit.id, dataToSubmit);
      
      if (onSuccess) {
        await onSuccess();
      }
      
      onClose();
    } catch (error) {
      alert('Error: ' + (error.message || 'Failed to update habit'));
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

  // Маппинг дней недели для отображения
  const dayMapping = {
    7: 'Su', // Воскресенье
    1: 'Mo',
    2: 'Tu',
    3: 'We',
    4: 'Th',
    5: 'Fr',
    6: 'Sa'
  };

  return (
    <div className="edit-habit">
      <div className="edit-habit__header">
        <button className="edit-habit__cancel" onClick={onClose}>
          Cancel
        </button>
        <div className="edit-habit__title-wrapper">
          <h1 className="edit-habit__title">Habit Tracker</h1>
          <span className="edit-habit__subtitle">mini-app</span>
        </div>
        <button className="edit-habit__menu">⋯</button>
      </div>

      <form className="edit-habit__form" onSubmit={handleSubmit}>
        <div className="edit-habit__content">
          
          {/* Title field */}
          <div className="edit-form-section">
            <label className="edit-form-label">
              <span className="edit-form-label-title">What?</span>
              <input
                type="text"
                className="edit-form-input"
                placeholder="Jog for 30 minutes or Jog for 2 minutes"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                maxLength={255}
                required
              />
            </label>
          </div>

          {/* Goal field */}
          <div className="edit-form-section">
            <label className="edit-form-label">
              <span className="edit-form-label-title">Why?</span>
              <textarea
                className="edit-form-textarea"
                placeholder="What's your motivation? Allow yourself a minute to think about it."
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                rows={4}
                required
              />
            </label>
          </div>

          {/* How frequently */}
          <div className="edit-form-section">
            <span className="edit-form-label-title">How frequently will you do it?</span>
            <div className="frequency-selector">
              <div className="frequency-counter">
                <button 
                  type="button"
                  className="frequency-btn frequency-btn--minus"
                  onClick={() => setFrequencyCount(Math.max(1, frequencyCount - 1))}
                >
                  −
                </button>
                <span className="frequency-value">{frequencyCount}</span>
                <button 
                  type="button"
                  className="frequency-btn frequency-btn--plus"
                  onClick={() => setFrequencyCount(Math.min(7, frequencyCount + 1))}
                >
                  +
                </button>
              </div>
              <div className="frequency-type">
                <button
                  type="button"
                  className={`frequency-type-btn ${frequency === 'daily' ? 'active' : ''}`}
                  onClick={() => setFrequency('daily')}
                >
                  Daily
                </button>
                <button
                  type="button"
                  className={`frequency-type-btn ${frequency === 'weekly' ? 'active' : ''}`}
                  onClick={() => setFrequency('weekly')}
                >
                  Weekly
                </button>
              </div>
            </div>
          </div>

          {/* On which days */}
          <div className="edit-form-section">
            <span className="edit-form-label-title">On which days?</span>
            <div className="days-selector-edit">
              {[7, 1, 2, 3, 4, 5, 6].map(dayId => (
                <button
                  key={dayId}
                  type="button"
                  className={`day-button-edit ${formData.schedule_days.includes(dayId) ? 'day-button-edit--selected' : ''}`}
                  onClick={() => handleDayToggle(dayId)}
                >
                  {dayMapping[dayId]}
                </button>
              ))}
            </div>
          </div>

          {/* For the next */}
          <div className="edit-form-section">
            <span className="edit-form-label-title">For the next:</span>
            <div className="duration-selector">
              <button
                type="button"
                className={`duration-btn ${duration === '2weeks' ? 'active' : ''}`}
                onClick={() => setDuration('2weeks')}
              >
                2 weeks
              </button>
              <button
                type="button"
                className={`duration-btn ${duration === '1month' ? 'active' : ''}`}
                onClick={() => setDuration('1month')}
              >
                1 month
              </button>
              <button
                type="button"
                className={`duration-btn ${duration === '3months' ? 'active' : ''}`}
                onClick={() => setDuration('3months')}
              >
                3 months
              </button>
            </div>
          </div>

          {/* Early notification */}
          <div className="edit-form-section-row">
            <span className="edit-form-label-title">Early notification</span>
            <div className="edit-form-value">1 hour</div>
          </div>

          {/* Repeat */}
          <div className="edit-form-section-row" ref={repeatRef}>
            <span className="edit-form-label-title">Repeat</span>
            <button
              type="button"
              className="edit-form-value edit-form-value--button"
              onClick={() => setShowRepeatDropdown(!showRepeatDropdown)}
            >
              {getRepeatLabel()}
            </button>
            
            {showRepeatDropdown && (
              <div className="dropdown-menu">
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => handleRepeatSelect('everyday')}
                >
                  Everyday
                </button>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => handleRepeatSelect('weekdays')}
                >
                  Weekdays
                </button>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => handleRepeatSelect('weekend')}
                >
                  Weekend
                </button>
                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => handleRepeatSelect('custom')}
                >
                  Custom
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Submit button */}
        <div className="edit-form-footer">
          <button
            type="submit"
            className="edit-submit-button"
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditHabitForm;