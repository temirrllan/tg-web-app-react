import React, { useState, useEffect, useRef } from 'react'; 
import Button from '../common/Button';
import { habitService } from '../../services/habits';
import { DAYS_OF_WEEK } from '../../utils/constants';
import './CreateHabitForm.css';

const CreateHabitForm = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);
  
  // Состояния для выпадающих меню
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  // Debug
  console.log('Dropdown states:', { showScheduleDropdown, showTimeDropdown });
  
  // Refs для обработки кликов вне элементов
  const scheduleRef = useRef(null);
  const timeRef = useRef(null);

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
        // Убираем дубликаты
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

  const handleDayToggle = (dayId) => {
    const days = [...formData.schedule_days];
    if (days.includes(dayId)) {
      // Не даем убрать все дни
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

  const handleScheduleSelect = (type) => {
    if (type === 'daily') {
      setFormData(prev => ({
        ...prev,
        schedule_type: 'daily',
        schedule_days: [1, 2, 3, 4, 5, 6, 7]
      }));
    } else if (type === 'weekdays') {
      setFormData(prev => ({
        ...prev,
        schedule_type: 'weekly',
        schedule_days: [1, 2, 3, 4, 5]
      }));
    }
    setShowScheduleDropdown(false);
  };

  const handleTimeSelect = (time) => {
    handleInputChange('reminder_time', time);
    setShowTimeDropdown(false);
  };

  const formatTime = (time) => {
    if (!time) return 'Select time';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getScheduleLabel = () => {
    if (formData.schedule_type === 'daily') {
      return 'Every Day';
    } else if (formData.schedule_days.length === 5 && 
               formData.schedule_days.every(d => d >= 1 && d <= 5)) {
      return 'Weekdays';
    } else {
      return 'Selected Days';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="create-habit">
      <div className="create-habit__header">
        <button className="create-habit__close" onClick={onClose}>
          Cancel
        </button>
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
              {categoriesLoading && (
                <div className="categories-loading">Loading categories...</div>
              )}
              {!categoriesLoading && !categoriesError && categories.length > 0 && (
                <div className="category-grid">
                  {categories.slice(0, 6).map(category => (
                    <button
                      key={category.id}
                      className={`category-item${formData.category_id === category.id ? ' category-item--selected' : ''}`}
                      onClick={(e) => { 
                        e.preventDefault(); 
                        handleInputChange('category_id', category.id); 
                      }}
                      style={{ 
                        backgroundColor: formData.category_id === category.id ? category.color : undefined,
                        borderColor: formData.category_id === category.id ? category.color : 'transparent'
                      }}
                      type="button"
                    >
                      <span className="category-item__icon">{category.icon}</span>
                      <span className="category-item__name">{category.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schedule - Only for good habits */}
          {!formData.is_bad_habit && (
            <>
              {/* Days selector */}
              <div className="form-section">
                <span className="form-label-title">On which days?</span>
                <div className="days-selector">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.id}
                      className={`day-button${formData.schedule_days.includes(day.id) ? ' day-button--selected' : ''}`}
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

              {/* Repeat dropdown */}
              <div className="form-section" ref={scheduleRef}>
                <span className="form-label-title">Repeat</span>
                <button
                  type="button"
                  className="dropdown-button"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Schedule dropdown clicked');
                    setShowScheduleDropdown(!showScheduleDropdown);
                  }}
                >
                  {getScheduleLabel()}
                </button>
                
                {showScheduleDropdown && (
                  <div className="dropdown-menu">
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleScheduleSelect('daily');
                      }}
                    >
                      Every Day
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleScheduleSelect('weekdays');
                      }}
                    >
                      Every Week
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowScheduleDropdown(false);
                      }}
                    >
                      Every Month
                    </button>
                  </div>
                )}
              </div>

              {/* Reminder time */}
              <div className="form-section" ref={timeRef}>
                <span className="form-label-title">Ping me</span>
                <button
                  type="button"
                  className="dropdown-button"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Time dropdown clicked');
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
                        onClick={(e) => {
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
                      onChange={(e) => handleTimeSelect(e.target.value)}
                      className="time-picker-input"
                      autoFocus
                    />
                    <div className="time-picker-preset">
                      <button type="button" onClick={(e) => {
                        e.preventDefault();
                        handleTimeSelect('09:00');
                      }}>9:00 AM</button>
                      <button type="button" onClick={(e) => {
                        e.preventDefault();
                        handleTimeSelect('12:00');
                      }}>12:00 PM</button>
                      <button type="button" onClick={(e) => {
                        e.preventDefault();
                        handleTimeSelect('18:00');
                      }}>6:00 PM</button>
                      <button type="button" onClick={(e) => {
                        e.preventDefault();
                        handleTimeSelect('21:00');
                      }}>9:00 PM</button>
                    </div>
                  </div>
                )}
              </div>
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
            disabled={loading || !formData.title.trim() || !formData.goal.trim() || (!formData.is_bad_habit && !formData.category_id)}
          >
            {loading ? 'Creating...' : 'Create habit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateHabitForm;