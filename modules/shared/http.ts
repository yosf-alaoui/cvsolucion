export type JsonHttpClientOptions = {
  baseUrl?: string;
  credentials?: RequestCredentials;
  fetchImpl?: typeof fetch;
  defaultHeaders?: HeadersInit;
};

export function createJsonHttpClient(options: JsonHttpClientOptions = {}) {
  const baseUrl = (options.baseUrl || "").replace(/\/+$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;
  const credentials = options.credentials ?? "include";

  return async function request<T>(path: string, init: RequestInit = {}) {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      ...init,
      credentials,
      headers: {
        "Content-Type": "application/json",
        ...(options.defaultHeaders || {}),
        ...(init.headers || {}),
      },
    });

    const data = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    return data as T;
  };
}

