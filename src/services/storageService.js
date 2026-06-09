export function readStorage(key, fallbackValue) {
    try {
      const storedValue = window.localStorage.getItem(key);
  
      if (!storedValue) {
        return fallbackValue;
      }
  
      return JSON.parse(storedValue);
    } catch (error) {
      console.error(`Could not read ${key} from localStorage`, error);
      return fallbackValue;
    }
  }
  
  export function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Could not write ${key} to localStorage`, error);
      return false;
    }
  }
  
  export function removeStorage(key) {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Could not remove ${key} from localStorage`, error);
      return false;
    }
  }
  
  export function clearStorageKeys(keys) {
    keys.forEach((key) => removeStorage(key));
  }