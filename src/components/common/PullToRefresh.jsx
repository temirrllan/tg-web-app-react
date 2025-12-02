// src/components/common/PullToRefresh.jsx

import React, { useState, useRef, useEffect } from 'react';
import './PullToRefresh.css';

const PullToRefresh = ({ onRefresh, children }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const containerRef = useRef(null);
  
  const PULL_THRESHOLD = 80; // Расстояние для активации
  const MAX_PULL = 120; // Максимальное расстояние

  const handleTouchStart = (e) => {
    // Запускаем pull только если скролл в самом верху
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = currentY - startY.current;
    
    // Pull только вниз и только если у края
    if (distance > 0 && containerRef.current.scrollTop === 0) {
      e.preventDefault();
      
      // Применяем эффект резинки
      const rubberBandDistance = Math.min(
        distance * 0.5,
        MAX_PULL
      );
      
      setPullDistance(rubberBandDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || isRefreshing) return;
    
    setIsPulling(false);
    
    // Если дотянули до порога - запускаем обновление
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      // Иначе возвращаемся обратно
      setPullDistance(0);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      setIsPulling(false);
      setPullDistance(0);
      setIsRefreshing(false);
    };
  }, []);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const rotation = progress * 360;

  return (
    <div 
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Индикатор Pull-to-Refresh */}
      <div 
        className="pull-to-refresh-indicator"
        style={{
          transform: `translateY(${pullDistance - 60}px)`,
          opacity: pullDistance > 0 ? 1 : 0
        }}
      >
        <div 
          className={`refresh-icon ${isRefreshing ? 'spinning' : ''}`}
          style={{
            transform: `rotate(${rotation}deg)`
          }}
        >
          {isRefreshing ? (
            <svg viewBox="0 0 24 24" width="24" height="24">
              <circle 
                cx="12" cy="12" r="10" 
                stroke="currentColor" 
                strokeWidth="2" 
                fill="none"
                strokeDasharray="60"
                strokeDashoffset="15"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path 
                d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
                fill="currentColor"
              />
            </svg>
          )}
        </div>
        <span className="refresh-text">
          {isRefreshing 
            ? 'Refreshing...' 
            : pullDistance >= PULL_THRESHOLD 
              ? 'Release to refresh' 
              : 'Pull to refresh'
          }
        </span>
      </div>

      {/* Контент */}
      <div 
        className="pull-to-refresh-content"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;