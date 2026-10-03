import { useLayoutEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

export function useUrlFilters() {
  const [params, setParams] = useSearchParams();
  const pending = useRef(params);
  useLayoutEffect(() => {
    pending.current = params;
  }, [params]);

  function updateParams(update, options = {}) {
    // Compose rapid edits against the latest requested filters, even while
    // Router is still rendering the previous navigation.
    const next = new URLSearchParams(pending.current);
    const result = typeof update === "function" ? update(next) : update;
    pending.current = new URLSearchParams(result);
    setParams(pending.current, { preventScrollReset: true, ...options });
  }

  return [params, updateParams];
}
