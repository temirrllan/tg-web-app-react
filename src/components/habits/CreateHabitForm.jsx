import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { habitService } from '../../services/habits';
import { DAYS_OF_WEEK } from '../../utils/constants';
import './CreateHabitForm.css';

const CreateHabitForm = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
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

  const loadCategories = async () => {
    try {
      const data = await habitService.getCategories();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
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
      setFormData(prev => ({
        ...prev,
        schedule_days: days.filter(d => d !== dayId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        schedule_days: [...days, dayId].sort((a, b) => a - b)
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSuccess(formData);
      onClose();
    } catch (error) {
      console.error('Failed to create habit:', error);
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.title.trim().length > 0 && formData.goal.trim().length > 0;
      case 2:
        return !formData.is_bad_habit ? formData.category_id !== null : true;
      case 3:
        return formData.schedule_days.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="create-habit__step">
            <h3>Habit name</h3>
            <input
              type="text"
              placeholder="What is your goal?"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              maxLength={255}
            />
            
            <p className="create-habit__hint">
              Being specific is better. Instead of "Jog", think "Jog for 20 minutes" or "Jog for 2 miles"
            </p>
            
            <h3>Goal</h3>
            <textarea
              placeholder="What's your motivation?"
              value={formData.goal}
              onChange={(e) => handleInputChange('goal', e.target.value)}
              rows={3}
            />
            
            <div className="create-habit__toggle">
              <label>
                <span>Bad habit 😈</span>
                <div className="toggle-wrapper">
                  <Button
                    variant={!formData.is_bad_habit ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => handleInputChange('is_bad_habit', false)}
                  >
                    No
                  </Button>
                  <Button
                    variant={formData.is_bad_habit ? 'primary' : 'secondary'}
                    size="small"
                    onClick={() => handleInputChange('is_bad_habit', true)}
                  >
                    Yes
                  </Button>
                </div>
              </label>
              <p className="create-habit__hint">
                {formData.is_bad_habit 
                  ? 'For bad habits, you only need to set name and goal.'
                  : 'Helping text for explaining about good habits.'}
              </p>
            </div>
          </div>
        );

      case 2:
        if (formData.is_bad_habit) {
          // Skip to submit for bad habits
          setStep(5);
          return null;
        }
        
        return (
          <div className="create-habit__step">
            <h3>Category</h3>
            <div className="category-grid">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-item ${formData.category_id === category.id ? 'category-item--selected' : ''}`}
                  onClick={() => handleInputChange('category_id', category.id)}
                  style={{ backgroundColor: formData.category_id === category.id ? category.color : undefined }}
                >
                  <span className="category-item__icon">{category.icon}</span>
                  <span className="category-item__name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="create-habit__step">
            <h3>On which days?</h3>
            <div className="days-selector">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.id}
                  className={`day-button ${formData.schedule_days.includes(day.id) ? 'day-button--selected' : ''}`}
                  onClick={() => handleDayToggle(day.id)}
                >
                  {day.short}
                </button>
              ))}
            </div>
            
            <div className="schedule-type">
              <Button
                variant={formData.schedule_type === 'daily' ? 'primary' : 'secondary'}
                fullWidth
                onClick={() => handleInputChange('schedule_type', 'daily')}
              >
                Every Day
              </Button>
              <Button
                variant={formData.schedule_type === 'weekly' ? 'primary' : 'secondary'}
                fullWidth
                onClick={() => handleInputChange('schedule_type', 'weekly')}
              >
                Selected Days
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="create-habit__step">
            <h3>Reminder</h3>
            <label>
              <span>Ping me at</span>
              <input
                type="time"
                value={formData.reminder_time}
                onChange={(e) => handleInputChange('reminder_time', e.target.value)}
              />
            </label>
            
            <div className="reminder-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={formData.reminder_enabled}
                  onChange={(e) => handleInputChange('reminder_enabled', e.target.checked)}
                />
                <span>Enable reminders</span>
              </label>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="create-habit__step">
            <h3>Review</h3>
            <div className="review-summary">
              <p><strong>Name:</strong> {formData.title}</p>
              <p><strong>Goal:</strong> {formData.goal}</p>
              {!formData.is_bad_habit && (
                <>
                  <p><strong>Category:</strong> {categories.find(c => c.id === formData.category_id)?.name}</p>
                  <p><strong>Schedule:</strong> {formData.schedule_type === 'daily' ? 'Every day' : 'Selected days'}</p>
                  {formData.reminder_enabled && formData.reminder_time && (
                    <p><strong>Reminder:</strong> {formData.reminder_time}</p>
                  )}
                </>
              )}
              {formData.is_bad_habit && (
                <p><strong>Type:</strong> Bad habit 😈</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="create-habit">
      <div className="create-habit__header">
        <button className="create-habit__close" onClick={onClose}>
          Cancel
        </button>
        <h2>Habit Tracker</h2>
        <div className="create-habit__menu">⋯</div>
      </div>

      <div className="create-habit__content">
        {renderStep()}
      </div>

      <div className="create-habit__footer">
        {step > 1 && step < 5 && (
          <Button
            variant="secondary"
            onClick={() => setStep(step - 1)}
          >
            Back
          </Button>
        )}
        
        {step < 4 && !formData.is_bad_habit && (
          <Button
            variant="primary"
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
          >
            Next
          </Button>
        )}
        
        {(step === 4 || (step === 2 && formData.is_bad_habit)) && (
          <Button
            variant="primary"
            onClick={() => setStep(5)}
            disabled={!canProceed()}
          >
            Review
          </Button>
        )}
        
        {step === 5 && (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Creating...' : 'Create habit'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CreateHabitForm;