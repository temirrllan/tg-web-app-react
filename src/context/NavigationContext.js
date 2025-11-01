import React, { createContext, useContext, useState, useCallback } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [stack, setStack] = useState(['Today']); // Начальная страница

  const push = useCallback((page) => {
    setStack((prev) => [...prev, page]);
  }, []);

  const pop = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback(() => {
    setStack(['Today']);
  }, []);

  const current = stack[stack.length - 1];
  const previous = stack.length > 1 ? stack[stack.length - 2] : null;

  return (
    <NavigationContext.Provider value={{ stack, current, previous, push, pop, reset }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationStack = () => useContext(NavigationContext);
