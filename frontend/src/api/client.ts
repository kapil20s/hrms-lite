import axios, { AxiosError } from "axios";
import type { ApiEnvelope, ApiError } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Extract data from envelope
export function unwrap<T>(response: { data: ApiEnvelope<T> }): T {
  return response.data.data;
}

// Extract error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiError | undefined;
    if (data?.error?.message) return data.error.message;
    if (error.response?.status === 409) return "A record with this data already exists.";
    if (error.response?.status === 404) return "Record not found.";
    if (error.response?.status === 422) return "Invalid data submitted. Please check your inputs.";
    return error.message;
  }
  return "An unexpected error occurred.";
}
