import React, { useEffect, useState } from 'react';

const SwipeHint = ({ show, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-20 left-4 right-4 bg-black/80 text-white rounded-xl p-4 z-50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👈</span>
          <span className="text-sm">Swipe left to complete</span>
        </div>
        <div className="w-px h-6 bg-white/30"></div>
        <div className="flex items-center gap-2">
          <span className="text-sm">Swipe right to undo</span>
          <span className="text-2xl">👉</span>
        </div>
      </div>
    </div>
  );
};

export default SwipeHint;
