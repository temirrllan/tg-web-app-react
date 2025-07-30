import React from 'react';

const Header = ({ user, onProfileClick }) => {
  // Заголовок Telegram WebApp
  const tg = window.Telegram?.WebApp;
  React.useEffect(() => {
    if (tg) {
      tg.setHeaderColor('#ffffff');
      tg.setBackgroundColor('#f5f5f5');
    }
  }, []);

  return (
    <>
      {/* Telegram WebApp Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between">
        <button className="text-[#007AFF] text-[17px] font-medium">Close</button>
        <div className="text-center">
          <h1 className="text-[17px] font-bold text-black">Habit Tracker</h1>
          <p className="text-[13px] text-gray-400">mini-app</p>
        </div>
        <button className="w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center">
          <svg width="16" height="4" viewBox="0 0 16 4" fill="none">
            <circle cx="2" cy="2" r="1.5" fill="white"/>
            <circle cx="8" cy="2" r="1.5" fill="white"/>
            <circle cx="14" cy="2" r="1.5" fill="white"/>
          </svg>
        </button>
      </div>

      {/* User Profile Card */}
      <div className="px-4 pt-3 pb-1">
        <div 
          className="bg-white rounded-[16px] p-4 flex items-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer"
          onClick={onProfileClick}
        >
          {/* Аватар */}
          {user?.photo_url ? (
            <img 
              src={user.photo_url} 
              alt={user.first_name} 
              className="w-[48px] h-[48px] rounded-full object-cover"
            />
          ) : (
            <div className="w-[48px] h-[48px] rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-white font-semibold text-[18px]">
                {user?.first_name?.[0] || '?'}
              </span>
            </div>
          )}

          {/* Имя пользователя */}
          <div className="flex-1 ml-3">
            <h2 className="font-semibold text-black text-[18px]">
              {user?.first_name} {user?.last_name}
            </h2>
          </div>

          {/* Стрелка */}
          <div className="text-gray-400">
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1L7 7L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;