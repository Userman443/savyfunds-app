import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Custom timeout for fetch operations
const FETCH_TIMEOUT = 5000; // 5 seconds timeout
const AI_FETCH_TIMEOUT = 60000; // 60 seconds for AI requests

// Helper function to add timeout to fetch
async function fetchWithTimeout(url: string, options?: RequestInit, timeout = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const { signal } = controller;
  
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timeout after ${timeout}ms`));
    }, timeout);
  });
  
  // Create the fetch promise with the abort signal
  const fetchPromise = fetch(url, { ...options, signal });
  
  // Race the fetch against the timeout
  return Promise.race([fetchPromise, timeoutPromise]);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    } catch (err) {
      // If we can't get the response text, still throw something useful
      throw new Error(`Request failed with status ${res.status}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    // Use longer timeout for AI-related endpoints
    const timeout = url.includes('/financial-ai/') || url.includes('/ai/') ? AI_FETCH_TIMEOUT : FETCH_TIMEOUT;
    
    const res = await fetchWithTimeout(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    }, timeout);

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`API request error (${method} ${url}):`, error);
    throw error; // Re-throw to let caller handle it
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options?: {
  on401?: UnauthorizedBehavior;
}) => QueryFunction<T> =
  (options = { on401: "returnNull" }) =>  // Default to returnNull for 401 (anonymous users)
  async ({ queryKey }) => {
    const unauthorizedBehavior = options.on401 || "returnNull";
    try {
      const res = await fetchWithTimeout(queryKey[0] as string, {
        credentials: "include",
      });

      // Always return null for 401 on auth endpoints
      if (res.status === 401) {
        if ((queryKey[0] as string).includes('/api/auth/')) {
          return null; // Silent handling for auth checks
        }
        if (unauthorizedBehavior === "returnNull") {
          return null;
        }
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // For 401 errors, return null instead of throwing
      if (error instanceof Error && error.message.includes('401')) {
        return null;
      }
      
      console.error(`Query error (${queryKey[0]}):`, error);
      throw error; // Re-throw for React Query to handle
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 10000, // 10 seconds instead of Infinity
      retry: 1, // Try once more if it fails
      retryDelay: 1000, // Wait 1 second before retry
      gcTime: 30000, // 30 seconds
    },
    mutations: {
      retry: 1, // Try once more if it fails
      retryDelay: 1000, // Wait 1 second before retry
    },
  },
});
