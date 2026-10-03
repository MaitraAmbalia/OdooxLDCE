import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} · Skyline`;
    return () => {
      document.title = "Skyline Student Association";
    };
  }, [title]);
}
