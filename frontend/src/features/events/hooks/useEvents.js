import { useQuery } from "@tanstack/react-query";
import { getJson } from "@/lib/api";

export function useEvents() {
  return useQuery({
    queryKey: ["events", "list"],
    queryFn: async ({ signal }) => {
      const response = await getJson("/events", { signal });
      if (!Array.isArray(response.data))
        throw new Error("Unexpected event response.");
      return response;
    },
    staleTime: 30_000,
    retry: 1,
  });
}
