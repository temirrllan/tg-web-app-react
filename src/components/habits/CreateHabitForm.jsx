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
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  
  // Refs для обработки кликов вне элементов
  const repeatRef = useRef(null);
  const timeRef = useRef(null);
  
  // Состояние для анимации появления блока "On which days"
  const [showDaysAnimation, setShowDaysAnimation] = useState(true); // Всегда показываем

  const [formData, setFormData] = useState({
    title: '',
    goal: '',
    category_id: null,
    schedule_type: 'daily', // По умолчанию "Every day"
    schedule_days: [1, 2, 3, 4, 5, 6, 7], // Все дни по умолчанию
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
    
    if (type === 'daily') {
      // Every day = все дни недели
      newDays = [1, 2, 3, 4, 5, 6, 7];
    } else if (type === 'weekly') {
      // Every week = будние дни (Monday-Friday)
      newDays = [1, 2, 3, 4, 5];
    } else if (type === 'weekend') {
      // Weekend = выходные (Saturday-Sunday)
      newDays = [6, 7];
    } else if (type === 'monthly') {
      // Every month = все дни по умолчанию
      newDays = [1, 2, 3, 4, 5, 6, 7];
    }
    
    setFormData(prev => ({
      ...prev,
      schedule_type: type,
      schedule_days: newDays
    }));
    
    setShowRepeatDropdown(false);
  };

  const handleTimeConfirm = () => {
    // Закрываем dropdown при нажатии Done
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

  const getRepeatLabel = () => {
    switch(formData.schedule_type) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return 'Every week';
      case 'weekend':
        return 'Weekend';
      case 'monthly':
        return 'Every month';
      default:
        return 'Every day';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Валидация - должен быть выбран хотя бы один день
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
                        type="button"
                        style={{
                          backgroundColor: formData.category_id === category.id 
                            ? category.color 
                            : category.color + '20' // Добавляем прозрачность для неактивных
                        }}
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
              {/* On which days - ВСЕГДА показываем */}
              <div className="form-section">
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

              {/* Repeat */}
              <div className="form-section" ref={repeatRef}>
                <span className="form-label-title">Repeat</span>
                <button
                  type="button"
                  className="dropdown-button"
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
                      Every day
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRepeatSelect('weekly');
                      }}
                    >
                      Every week
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
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRepeatSelect('monthly');
                      }}
                    >
                      Every month
                    </button>
                  </div>
                )}
              </div>

              {/* Ping me - обновленный */}
              <div className="form-section" ref={timeRef}>
                <span className="form-label-title">Ping me</span>
                <button
                  type="button"
                  className="dropdown-button"
                  onClick={(e) => {
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
                        className="time-picker-done"
                        onClick={(e) => {
                          e.preventDefault();
                          handleTimeConfirm();
                        }}
                      >
                        Done
                      </button>
                    </div>
                    <input
                      type="time"
                      value={formData.reminder_time}
                      onChange={(e) => {
                        handleInputChange('reminder_time', e.target.value);
                      }}
                      className="time-picker-input"
                      autoFocus
                    />
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