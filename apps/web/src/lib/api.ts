import type { ApiError, ApiSuccess } from "@buildscience/shared";

export class ApiRequestError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  isFormData?: boolean;
};

export const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, isFormData } = options;

  const res = await fetch(`${API_BASE}${url}`, {
    method,
    credentials: "include",
    headers: isFormData ? undefined : body ? { "Content-Type": "application/json" } : undefined,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const json = (await res.json().catch(() => null)) as ApiSuccess<T> | ApiError | null;

  if (!res.ok || !json || json.success === false) {
    const message = json && "message" in json ? json.message : "Ma'lumotlarni yuklashda xatolik yuz berdi.";
    const errors = json && "errors" in json ? json.errors : undefined;
    throw new ApiRequestError(res.status, message, errors);
  }

  return (json as ApiSuccess<T>).data;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: "POST", body }),
  patch: <T>(url: string, body?: unknown) => request<T>(url, { method: "PATCH", body }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
  postForm: <T>(url: string, formData: FormData) => request<T>(url, { method: "POST", body: formData, isFormData: true }),
  patchForm: <T>(url: string, formData: FormData) => request<T>(url, { method: "PATCH", body: formData, isFormData: true }),
};
