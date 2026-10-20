export function saveToStorage<T>(key: string, data: T): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (err) {
    console.warn(`Error saving to localStorage [${key}]:`, err);
  }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved) as T;
      }
    }
  } catch (err) {
    console.warn(`Error reading from localStorage [${key}]:`, err);
  }
  return fallback;
}
