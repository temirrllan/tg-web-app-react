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
  const [repeatActive, setRepeatActive] = useState(false);
  const [timeActive, setTimeActive] = useState(false);
  // Refs для обработки кликов вне элементов
  const repeatRef = useRef(null);
  const timeRef = useRef(null);
  
  // Состояние для анимации появления блока "On which days"
  const [showDaysAnimation, setShowDaysAnimation] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    goal: '',
    category_id: null,
    schedule_type: 'daily',
    schedule_days: [1, 2, 3, 4, 5, 6, 7], // По умолчанию все дни
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
    let newDays = [];
    
    if (type === 'everyday') {
      newDays = [1, 2, 3, 4, 5, 6, 7];
    } else if (type === 'weekdays') {
      newDays = [1, 2, 3, 4, 5];
    } else if (type === 'weekend') {
      newDays = [6, 7];
    } else if (type === 'custom') {
      // При custom оставляем текущий выбор
      newDays = formData.schedule_days;
    }
    
    setFormData(prev => ({
      ...prev,
      schedule_type: type,
      schedule_days: newDays
    }));
    
    setShowRepeatDropdown(false);
    setRepeatActive(true);
  };


  const handleTimeSelect = () => {
    setTimeActive(true);
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
    if (!repeatActive) return 'Default';
    
    switch(formData.schedule_type) {
      case 'everyday':
        return 'Every day';
      case 'weekdays':
        return 'Weekdays';
      case 'weekend':
        return 'Weekend';
      case 'custom':
        return 'Custom';
      default:
        return 'Every day';
    }
  };
const getTimeLabel = () => {
    if (!timeActive || !formData.reminder_time) return 'Default';
    
    const [hours, minutes] = formData.reminder_time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
              <input
                className="form-textarea"
                placeholder="What's your motivation?"
                value={formData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                rows={3}
                required
              />
            </label>
          </div>

          {/* Category - только для good habits - ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ */}
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
                            : category.color + '20'
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
              {/* On which days - показываем только для "Every Day" */}
              {/* {formData.schedule_type === 'daily' && (
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
              )} */}

              {/* Repeat */}
              <div className="form-section-row" ref={repeatRef}>
                <span className="form-label-title">Repeat</span>
                <button
                  type="button"
                  className={`dropdown-button ${repeatActive ? 'active' : ''}`}
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
                        // e.stopPropagation();
                        handleRepeatSelect('everyday');
                      }}
                    >
                      Every Day
                    </button>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        // e.stopPropagation();
                        handleRepeatSelect('weekdays');
                      }}
                    >
                      Weekdays
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
                       handleRepeatSelect('custom');
                     }}
                   >
                     Custom
                   </button>
                  </div>
                )}
              </div>
{/* On which days - показываем если выбран режим или активирован */}
             {repeatActive && (
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
             )}
              {/* Reminder time - СТАРЫЙ ДИЗАЙН С ПРАВИЛЬНЫМ ФУНКЦИОНАЛОМ */}
             <div className="form-section-row" ref={timeRef}>
               <span className="form-label-title">Ping me</span>
               <button
                 type="button"
                 className={`dropdown-button ${timeActive ? 'active' : ''}`}
                 onClick={(e) => {
                   e.preventDefault();
                   setShowTimeDropdown(!showTimeDropdown);
                 }}
               >
                 {getTimeLabel()}
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
                         handleTimeSelect();
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
               : 'Helping text for explaining about bad habit switcher.'}
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