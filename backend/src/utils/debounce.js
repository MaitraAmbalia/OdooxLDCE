/**
 * Standard debounce utility for backend operations (e.g. batching logs, coalescing cache writes, socket notifications).
 *
 * @param {Function} func The function to debounce.
 * @param {number} wait Milliseconds to wait before executing.
 * @param {Object} options { leading: boolean, trailing: boolean }
 * @returns {Function} Debounced function with .cancel(), .flush(), and .pending() methods.
 */
export function debounce(func, wait = 300, { leading = false, trailing = true } = {}) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let result = null;

  function invoke() {
    if (lastArgs !== null) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    const callNow = leading && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing && !callNow) {
        invoke();
      }
    }, wait);

    if (callNow) {
      invoke();
    }

    return result;
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      invoke();
    }
    return result;
  };

  debounced.pending = () => Boolean(timeoutId);

  return debounced;
}

/**
 * Async debounce that coalesces concurrent/rapid calls and resolves all callers with the same result.
 *
 * @param {Function} asyncFn Async function returning a promise.
 * @param {number} wait Milliseconds to wait.
 * @returns {Function} Async function returning a promise.
 */
export function debounceAsync(asyncFn, wait = 300) {
  let timeoutId = null;
  let pendingPromises = [];
  let lastArgs = null;
  let lastThis = null;

  return function (...args) {
    lastArgs = args;
    lastThis = this;

    return new Promise((resolve, reject) => {
      pendingPromises.push({ resolve, reject });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        timeoutId = null;
        const currentPromises = pendingPromises;
        pendingPromises = [];
        const currentArgs = lastArgs;
        const currentThis = lastThis;
        lastArgs = null;
        lastThis = null;

        try {
          const res = await asyncFn.apply(currentThis, currentArgs);
          currentPromises.forEach(({ resolve }) => resolve(res));
        } catch (err) {
          currentPromises.forEach(({ reject }) => reject(err));
        }
      }, wait);
    });
  };
}
