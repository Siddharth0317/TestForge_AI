export interface ApiErrorPayload {
  code: string;
  message: string;
  request_id?: string;
  details?: Array<{ field?: string; message: string }>;
  timestamp?: string;
}

export class ApiError extends Error {
  public code: string;
  public details: Array<{ field?: string; message: string }>;
  public requestId?: string;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.code = payload.code || 'UNKNOWN_ERROR';
    this.details = payload.details || [];
    this.requestId = payload.request_id;
  }
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('testforge_token');
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload: ApiErrorPayload = data.error || {
      code: `HTTP_${response.status}`,
      message: response.statusText || 'An error occurred during the request.',
      details: []
    };
    throw new ApiError(errorPayload);
  }

  return (data.data !== undefined ? data.data : data) as T;
}
