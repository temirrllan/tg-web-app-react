import React, { useState, useEffect, useRef } from 'react';
import { habitService } from '../../services/habits';
import { DAYS_OF_WEEK } from '../../utils/constants';
import './CreateHabitForm.css';

const CreateHabitForm = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Состояния для выпадающих меню
  const [showRepeatDropdown, setShowRepeatDropdown] = useState(false);
  
  // Refs для обработки кликов вне элементов
  const repeatRef = useRef(null);
  
  // Состояние для анимации появления блока "On which days"
  const [showDaysAnimation, setShowDaysAnimation] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    goal: '',
    category_id: null,
    schedule_type: 'weekly', // По умолчанию "Every Week"
    schedule_days: [1, 2, 3, 4, 5], // Monday-Friday по умолчанию
    reminder_time: '',
    reminder_enabled: true,
    is_bad_habit: false
  });

  useEffect(() => {
    loadCategories();
  }, []);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (repeatRef.current && !repeatRef.current.contains(event.target)) {
        setShowRepeatDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Анимация появления блока дней
  useEffect(() => {
    if (formData.schedule_type === 'daily') {
      setTimeout(() => setShowDaysAnimation(true), 50);
    } else {
      setShowDaysAnimation(false);
    }
  }, [formData.schedule_type]);

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
    if (type === 'weekly') {
      // Every Week = Monday to Friday
      setFormData(prev => ({
        ...prev,
        schedule_type: 'weekly',
        schedule_days: [1, 2, 3, 4, 5]
      }));
    } else if (type === 'weekend') {
      // Weekend = Saturday and Sunday
      setFormData(prev => ({
        ...prev,
        schedule_type: 'weekend',
        schedule_days: [6, 7]
      }));
    } else if (type === 'daily') {
      // Every Day = показываем селектор дней, выбираем все дни
      setFormData(prev => ({
        ...prev,
        schedule_type: 'daily',
        schedule_days: [1, 2, 3, 4, 5, 6, 7]
      }));
    }
    setShowRepeatDropdown(false);
  };

  const formatTime = (time) => {
    if (!time) return 'Select time';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getRepeatLabel = () => {
    if (formData.schedule_type === 'weekly') return 'Every Week';
    if (formData.schedule_type === 'weekend') return 'Weekend';
    return 'Every Day';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация для "Every Day" - должен быть выбран хотя бы один день
    if (formData.schedule_type === 'daily' && formData.schedule_days.length === 0) {
      alert('Please select at least one day');
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
      alert('Error: ' + (error.message || 'Failed to create habit'));
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

  return (
    <div className="create-habit">
      <div className="create-habit__header">
        <button className="create-habit__cancel" onClick={onClose}>
          Cancel
        </button>
        <div className="create-habit__title-wrapper">
          <h2 className="create-habit__title">Habit Tracker</h2>
          <span className="create-habit__subtitle">mini-app</span>
        </div>
        <button className="create-habit__menu">⋯</button>
      </div>

      <form className="create-habit__form" onSubmit={handleSubmit}>
        <div className="create-habit__content">
          {/* Habit name */}
          <div className="form-section">
            <label className="form-label">
              <span className="form-label-title">Habit name</span>
              <input
                type="text"
                className="form-input"
                placeholder="What is your goal?"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
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
                onChange={(e) => handleInputChange('goal', e.target.value)}
                rows={3}
                required
              />
            </label>
          </div>

          {/* Category - только для good habits */}
          {!formData.is_bad_habit && (
            <div className="form-section">
              <span className="form-label-title">Category</span>
              {!categoriesLoading && categories.length > 0 && (
                <div className="category-scroll-container">
                  <div className="category-scroll">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        className={`category-item ${formData.category_id === category.id ? 'category-item--selected' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleInputChange('category_id', category.id);
                        }}
                        style={{
                          backgroundColor: formData.category_id === category.id 
                            ? category.color 
                            : category.color + '20' // Светлый оттенок для неактивных
                        }}
                        type="button"
                      >
                        <div className="category-item__icon">{category.icon}</div>
                        <span className="category-item__name">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schedule blocks - только для good habits */}
          {!formData.is_bad_habit && (
            <>
              {/* On which days - показываем только для "Every Day" */}
              {formData.schedule_type === 'daily' && (
                <div className={`form-section days-section ${showDaysAnimation ? 'days-section--visible' : ''}`}>
                  <span className="form-label-title">On which days?</span>
                  <div className="days-selector">
                    {DAYS_OF_WEEK.map(day => (
                      <button
                        key={day.id}
                        className={`day-button ${formData.schedule_days.includes(day.id) ? 'day-button--selected' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleDayToggle(day.id);
                        }}
                        type="button"
                      >
                        {day.short}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Repeat */}
              <div className="form-section" ref={repeatRef}>
                <span className="form-label-title">Repeat</span>
                <button
                  type="button"
                  className="form-button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowRepeatDropdown(!showRepeatDropdown);
                  }}
                >
                  {getRepeatLabel()}
                </button>
                
                {showRepeatDropdown && (
                  <div className="dropdown-menu">
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRepeatSelect('daily');
                      }}
                    >
                      Every Day
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRepeatSelect('weekly');
                      }}
                    >
                      Every Week
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRepeatSelect('weekend');
                      }}
                    >
                      Weekend
                    </button>
                  </div>
                )}
              </div>

              {/* Ping me - нативный time picker */}
              <div className="form-section">
                <span className="form-label-title">Ping me</span>
                <div className="form-button time-input-wrapper">
                  <input
                    type="time"
                    value={formData.reminder_time}
                    onChange={(e) => handleInputChange('reminder_time', e.target.value)}
                    className="time-input-hidden"
                    id="time-picker"
                  />
                  <label htmlFor="time-picker" className="time-input-label">
                    {formatTime(formData.reminder_time)}
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Bad habit toggle */}
          <div className="form-section">
            <div className="bad-habit-section">
              <span className="form-label-title">Bad habit 😈</span>
              <div className="toggle-buttons">
                <button
                  type="button"
                  className={`toggle-button ${!formData.is_bad_habit ? '' : 'toggle-button--inactive'}`}
                  onClick={() => handleInputChange('is_bad_habit', true)}
                >
                  Yes
                </button>
                <button
                  type="button"
                  className={`toggle-button ${formData.is_bad_habit ? '' : 'toggle-button--active'}`}
                  onClick={() => handleInputChange('is_bad_habit', false)}
                >
                  No
                </button>
              </div>
            </div>
            <p className="form-hint">
              Helping text for explaining about bad habit switcher.
            </p>
          </div>
        </div>

        {/* Submit button */}
        <div className="form-footer">
          <button
            type="submit"
            className="submit-button"
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Creating...' : 'Create habit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHabitForm;