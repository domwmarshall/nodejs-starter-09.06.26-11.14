import { useEffect, useState } from "react";

export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(key);

      if (storedValue) {
        return JSON.parse(storedValue);
      }

      return initialValue;
    } catch (error) {
      console.error(`Could not load ${key} from localStorage`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Could not save ${key} to localStorage`, error);
    }
  }, [key, value]);

  return [value, setValue];
}