import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";

export function useSession() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async ({ signal }) => {
      try {
        return await getJson("/auth/me", { signal });
      } catch (error) {
        if (error.status === 401) return { data: null };
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}
