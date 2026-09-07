const API_BASE = "/api";

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const rawText = await response.text();
    let errorMessage = rawText;
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && typeof parsed.error === "string") {
        errorMessage = parsed.error;
      }
    } catch {
      // Keep rawText if not JSON
    }
    throw new Error(errorMessage || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),

  post: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(url: string, body: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(url: string) =>
    request<T>(url, {
      method: "DELETE",
    }),
};