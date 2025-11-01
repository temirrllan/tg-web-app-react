// src/context/NavigationContext.jsx
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const [stack, setStack] = useState([]);
  const current = stack[stack.length - 1];
  const previous = stack[stack.length - 2];

  const push = useCallback((route) => {
    setStack((prev) => [...prev, route]);
  }, []);

  const pop = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback(() => {
    setStack([]);
  }, []);

  const value = useMemo(
    () => ({ stack, current, previous, push, pop, reset }),
    [stack, current, previous, push, pop, reset]
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// ✅ Добавляем этот экспорт:
export const useNavigationStack = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationStack must be used within a NavigationProvider');
  }
  return context;
};
