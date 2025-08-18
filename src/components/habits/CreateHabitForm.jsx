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
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Refs для обработки кликов вне элементов
  const repeatRef = useRef(null);
  const timeRef = useRef(null);
  
  // Состояние для анимации появления блока "On which days"
  const [showDaysAnimation, setShowDaysAnimation] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    goal: '',
    category_id: null,
    schedule_type: 'weekly', // По умолчанию "Every Week" (каждый день)
    schedule_days: [1, 2, 3, 4, 5, 6, 7], // Все дни по умолчанию
    reminder_time: '',
    reminder_enabled: true,
    is_bad_habit: false
  });

  // State для time picker
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState('AM');

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
        if (showTimePicker) {
          handleTimeConfirm();
        }
        setShowTimePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTimePicker, selectedHour, selectedMinute, selectedPeriod]);

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
      // Every Week = все дни
      setFormData(prev => ({
        ...prev,
        schedule_type: 'weekly',
        schedule_days: [1, 2, 3, 4, 5, 6, 7]
      }));
    } else if (type === 'daily') {
      // Every Day = выбранные дни (показываем селектор)
      setFormData(prev => ({
        ...prev,
        schedule_type: 'daily',
        schedule_days: prev.schedule_days.length === 7 ? [1, 2, 3, 4, 5] : prev.schedule_days
      }));
    }
    setShowRepeatDropdown(false);
  };

  const handleTimeConfirm = () => {
    // Конвертируем в 24-часовой формат для backend
    let hour = parseInt(selectedHour);
    if (selectedPeriod === 'PM' && hour !== 12) hour += 12;
    if (selectedPeriod === 'AM' && hour === 12) hour = 0;
    
    const time = `${hour.toString().padStart(2, '0')}:${selectedMinute}`;
    handleInputChange('reminder_time', time);
  };

  const formatTimeDisplay = () => {
    if (!formData.reminder_time) return 'Select time';
    
    const [hours, minutes] = formData.reminder_time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${displayHour}:${minutes} ${period}`;
  };

  const getRepeatLabel = () => {
    return formData.schedule_type === 'weekly' ? 'Every Week' : 'Every Day';
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

  // Генерация часов и минут для picker
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const isFormValid = () => {
    return formData.title.trim() && 
           formData.goal.trim() && 
           (!formData.is_bad_habit ? formData.category_id : true) &&
           (formData.schedule_type === 'weekly' || formData.schedule_days.length > 0);
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
                <div className="category-grid">
                  {categories.slice(0, 6).map(category => (
                    <button
                      key={category.id}
                      className={`category-item ${formData.category_id === category.id ? 'category-item--selected' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleInputChange('category_id', category.id);
                      }}
                      type="button"
                    >
                      <div className="category-item__icon">{category.icon}</div>
                      <span className="category-item__name">{category.name}</span>
                    </button>
                  ))}
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
                  className="form-dropdown-button"
                  onClick={() => setShowRepeatDropdown(!showRepeatDropdown)}
                >
                  {getRepeatLabel()}
                </button>
                
                {showRepeatDropdown && (
                  <div className="dropdown-menu">
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => handleRepeatSelect('daily')}
                    >
                      Every Day
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => handleRepeatSelect('weekly')}
                    >
                      Every Week
                    </button>
                  </div>
                )}
              </div>

              {/* Ping me */}
              <div className="form-section" ref={timeRef}>
                <span className="form-label-title">Ping me</span>
                <button
                  type="button"
                  className="form-dropdown-button"
                  onClick={() => setShowTimePicker(!showTimePicker)}
                >
                  {formatTimeDisplay()}
                </button>
                
                {showTimePicker && (
                  <div className="time-picker">
                    <div className="time-picker__columns">
                      {/* Hours column */}
                      <div className="time-picker__column">
                        <div className="time-picker__scroll">
                          {hours.map(hour => (
                            <div
                              key={hour}
                              className={`time-picker__item ${selectedHour === hour ? 'time-picker__item--selected' : ''}`}
                              onClick={() => setSelectedHour(hour)}
                            >
                              {parseInt(hour)}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Minutes column */}
                      <div className="time-picker__column">
                        <div className="time-picker__scroll">
                          {minutes.map(minute => (
                            <div
                              key={minute}
                              className={`time-picker__item ${selectedMinute === minute ? 'time-picker__item--selected' : ''}`}
                              onClick={() => setSelectedMinute(minute)}
                            >
                              {minute}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* AM/PM column */}
                      <div className="time-picker__column time-picker__column--period">
                        <div
                          className={`time-picker__item ${selectedPeriod === 'AM' ? 'time-picker__item--selected' : ''}`}
                          onClick={() => setSelectedPeriod('AM')}
                        >
                          AM
                        </div>
                        <div
                          className={`time-picker__item ${selectedPeriod === 'PM' ? 'time-picker__item--selected' : ''}`}
                          onClick={() => setSelectedPeriod('PM')}
                        >
                          PM
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bad habit toggle */}
          <div className="form-section">
            <div className="bad-habit-section">
              <div className="bad-habit-label">
                <span className="form-label-title">Bad habit 😈</span>
              </div>
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