import React, { createContext, useContext, useState } from "react";

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [stack, setStack] = useState([]);
  const current = stack[stack.length - 1];
  const previous = stack[stack.length - 2];

  const push = (page) => setStack((prev) => [...prev, page]);
  const pop = () => setStack((prev) => prev.slice(0, -1));
  const reset = () => setStack([]);

  return (
    <NavigationContext.Provider value={{ stack, current, previous, push, pop, reset }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => useContext(NavigationContext);
