import React from 'react';

const Header = ({ user, onProfileClick }) => {
  return (
    <div className="p-4">
      <div 
        className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm"
        onClick={onProfileClick}
      >
        {/* Аватар */}
        {user?.photo_url ? (
          <img 
            src={user.photo_url} 
            alt={user.first_name} 
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-white font-semibold text-lg">
              {user?.first_name?.[0] || '?'}
            </span>
          </div>
        )}

        {/* Имя пользователя */}
        <div className="flex-1">
          <h2 className="font-semibold text-black text-lg">
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
  );
};

export default Header;