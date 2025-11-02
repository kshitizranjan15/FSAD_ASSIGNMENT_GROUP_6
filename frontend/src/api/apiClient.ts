// src/api/apiClient.ts
import { AuthResponse } from '../types/models';

const BASE_URL = 'http://127.0.0.1:8000'; // Assuming your FastAPI server runs on the default host and port

// Interface for a generic error response from the API
interface ApiError {
    detail: string | { msg: string; type: string; loc: (string | number)[] }[];
}


export async function apiCall<T = unknown>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  data?: unknown,
  token?: string | null,
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  };

  try {
    const response = await fetch(`${BASE_URL}${url}`, config);
    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      let errorData: ApiError | string = `HTTP error! Status: ${response.status}`;
      
      // Attempt to parse JSON error response if available
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json();
      }

      // Throw a consistent error object
      throw {
          status: response.status,
          message: typeof errorData === 'string' 
              ? errorData 
              : Array.isArray(errorData.detail) 
                  ? errorData.detail.map(d => d.msg).join('; ')
                  : (errorData.detail as string) || `API Error (${response.status})`
      };
    }

    // Handle 204 No Content
    if (response.status === 204 || (!contentType || !contentType.includes('application/json'))) {
        return {} as T; 
    }

    return response.json() as Promise<T>;
  } catch (error) {
    console.error('API Call Error:', error);
    // Re-throw to be handled by calling component
    throw error;
  }
}