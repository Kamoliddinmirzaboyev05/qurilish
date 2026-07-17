import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CompanyStats, CreateProblemInput, Paginated, ProblemDetail, ProblemListItem } from "@buildscience/shared";
import { api } from "@/lib/api";

export interface ProblemFilters {
  search?: string;
  category?: string;
  budgetType?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

function toQueryString(filters: object) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "" && value !== null) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useProblems(filters: ProblemFilters) {
  return useQuery({
    queryKey: ["problems", filters],
    queryFn: () => api.get<Paginated<ProblemListItem>>(`/problems${toQueryString(filters)}`),
  });
}

export function useCompanyProblems(status: string, page: number) {
  return useQuery({
    queryKey: ["company-problems", status, page],
    queryFn: () => api.get<Paginated<ProblemListItem>>(`/company/problems${toQueryString({ status, page, pageSize: 20 })}`),
  });
}

export function useCompanyStats() {
  return useQuery({
    queryKey: ["company-stats"],
    queryFn: () => api.get<CompanyStats>("/company/stats"),
  });
}

export function useProblem(problemId: string | undefined) {
  return useQuery({
    queryKey: ["problem", problemId],
    queryFn: () => api.get<ProblemDetail>(`/problems/${problemId}`),
    enabled: !!problemId,
  });
}

export function useCreateProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProblemInput) => api.post<ProblemDetail>("/problems", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-problems"] });
      queryClient.invalidateQueries({ queryKey: ["company-stats"] });
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    },
  });
}

export function useUpdateProblem(problemId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProblemInput) => api.patch<ProblemDetail>(`/problems/${problemId}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-problems"] });
      queryClient.invalidateQueries({ queryKey: ["problem", problemId] });
    },
  });
}

export function useCloseProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (problemId: string) => api.post<ProblemDetail>(`/problems/${problemId}/close`),
    onSuccess: (_data, problemId) => {
      queryClient.invalidateQueries({ queryKey: ["company-problems"] });
      queryClient.invalidateQueries({ queryKey: ["company-stats"] });
      queryClient.invalidateQueries({ queryKey: ["problem", problemId] });
    },
  });
}

export function useDeleteProblem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (problemId: string) => api.delete(`/problems/${problemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-problems"] });
      queryClient.invalidateQueries({ queryKey: ["company-stats"] });
    },
  });
}
