import { useState, useEffect, useRef, useCallback } from "react";

export function debounce(func, wait = 300) {
  let timeoutId = null;

  const debounced = (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * React hook that debounces any fast-changing value (e.g. search input).
 * @param {*} value The value to debounce.
 * @param {number} delay Milliseconds to delay (default: 300ms).
 * @returns The debounced value.
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * React hook that returns a memoized debounced callback function.
 * @param {Function} callback The function to debounce.
 * @param {number} delay Milliseconds to delay (default: 300ms).
 * @returns {Function} The debounced callback with a .cancel() method.
 */
export function useDebouncedCallback(callback, delay = 300) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timeoutRef.current = null;
      }, delay);
    },
    [delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return debouncedCallback;
}
