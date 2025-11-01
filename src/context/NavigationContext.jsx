import React, { createContext, useContext, useState, useCallback } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [stack, setStack] = useState([]);

  const push = useCallback((page) => {
    setStack((prev) => [...prev, page]);
  }, []);

  const pop = useCallback(() => {
    setStack((prev) => prev.slice(0, -1));
  }, []);

  const reset = useCallback(() => {
    setStack([]);
  }, []);

  const current = stack[stack.length - 1];
  const previous = stack[stack.length - 2];

  return (
    <NavigationContext.Provider value={{ stack, current, previous, push, pop, reset }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationStack = () => useContext(NavigationContext);
