import React from 'react';

const Onboarding = ({ user, onComplete }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#5BA3D8] to-[#4A90C8] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button className="text-white text-[17px] font-normal">
          Cancel
        </button>
        <div className="text-center">
          <h1 className="text-white text-[17px] font-semibold">Habit Tracker</h1>
          <p className="text-white/70 text-[13px]">mini-app</p>
        </div>
        <button className="text-white p-1">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="4" cy="10" r="1.5" fill="white"/>
            <circle cx="10" cy="10" r="1.5" fill="white"/>
            <circle cx="16" cy="10" r="1.5" fill="white"/>
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* 3D Illustration */}
        <div className="w-full max-w-[380px] h-[380px] relative mb-8">
          <img 
            src="/images/onboarding.png" 
            alt="Habit Tracker Illustration"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Text Content */}
        <div className="text-center mb-12">
          <h2 className="text-[32px] font-bold text-white mb-6 leading-tight">
            Welcome to the<br />
            Habit Tracker!
          </h2>
          <p className="text-[18px] text-white/90 leading-relaxed">
            Create healthy habits and achieve<br />
            your goals with our easy-to-use<br />
            tracker.
          </p>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-6 pb-8">
        {/* Create Button */}
        <button
          onClick={onComplete}
          className="w-full bg-[#7ED321] text-black py-[18px] rounded-[16px] font-semibold text-[17px] shadow-[0_4px_12px_rgba(126,211,33,0.3)] mb-6"
        >
          Create a New Habit
        </button>

        {/* Tab Bar */}
        <div className="flex items-center justify-center gap-8">
          <button className="bg-[#007AFF] text-white px-5 py-2 rounded-full text-[14px] font-medium flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L1 8L8 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Onboarding
          </button>
          
          <button className="text-white/60 p-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M18 0H2C0.9 0 0 0.9 0 2V14C0 15.1 0.9 16 2 16H6L10 20L14 16H18C19.1 16 20 15.1 20 14V2C20 0.9 19.1 0 18 0ZM18 14H13.2L10 17.2L6.8 14H2V2H18V14Z"/>
            </svg>
          </button>
          
          <button className="text-white/60 p-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path d="M10 6V10L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <button className="text-white/60 p-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15.5 8.5C15.5 8.5 14.5 6.5 12 6.5C9.5 6.5 8.5 8.5 8.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
              <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
          </button>
        </div>

        {/* Home Indicator */}
        <div className="flex justify-center mt-6">
          <div className="w-32 h-1 bg-white/30 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;