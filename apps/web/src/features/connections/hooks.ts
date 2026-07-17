import { useQuery } from "@tanstack/react-query";
import type { ConnectionCompanyView, ConnectionScientistView } from "@buildscience/shared";
import { api } from "@/lib/api";

export function useConnections<T = ConnectionCompanyView | ConnectionScientistView>() {
  return useQuery({
    queryKey: ["connections"],
    queryFn: () => api.get<{ items: T[] }>("/connections"),
  });
}

export function useConnection(proposalId: string | undefined) {
  return useQuery({
    queryKey: ["connection", proposalId],
    queryFn: () => api.get<ConnectionCompanyView | ConnectionScientistView>(`/connections/${proposalId}`),
    enabled: !!proposalId,
  });
}
