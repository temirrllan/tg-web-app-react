import React from 'react';

const EmptyState = ({ onCreateClick }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Медведь */}
      <div className="w-48 h-48 mb-8">
        <img 
          src="/images/bear.svg" 
          alt="No habits" 
          className="w-full h-full object-contain opacity-80"
        />
      </div>
      
      <h2 className="text-2xl font-bold text-black mb-3">No Habits Yet</h2>
      <p className="text-gray-500 text-center text-base leading-relaxed mb-2">
        All your habit will showed up here.<br />
        Tap to + to add a Habit.
      </p>
    </div>
  );
};

export default EmptyState;