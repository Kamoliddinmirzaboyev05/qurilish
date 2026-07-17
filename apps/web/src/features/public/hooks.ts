import { useQuery } from "@tanstack/react-query";
import type { PublicStats } from "@buildscience/shared";
import { api } from "@/lib/api";

export function usePublicStats() {
  return useQuery({ queryKey: ["public-stats"], queryFn: () => api.get<PublicStats>("/public/stats") });
}
