import { getAccessToken } from "./auth.js";

const BASE_URL = "https://api.security.microsoft.com/api";

export interface ApiResponse<T = unknown> {
  value?: T[];
  "@odata.context"?: string;
  "@odata.nextLink"?: string;
  [key: string]: unknown;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  queryParams?: Record<string, string | number | boolean | undefined>;
}

function buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
  if (!params) return "";

  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return filtered.length > 0 ? `?${filtered.join("&")}` : "";
}

export async function defenderApiRequest<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, queryParams } = options;

  const token = await getAccessToken();
  const url = `${BASE_URL}${endpoint}${buildQueryString(queryParams)}`;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body && (method === "POST" || method === "PATCH")) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Defender API error (${response.status}): ${errorText}`);
  }

  // Handle empty responses (e.g., DELETE operations)
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text) as T;
}

export async function defenderApiRequestPaginated<T = unknown>(
  endpoint: string,
  options: RequestOptions = {},
  maxResults?: number
): Promise<T[]> {
  const results: T[] = [];
  let nextLink: string | undefined;
  let currentUrl = endpoint;

  do {
    const response = await defenderApiRequest<ApiResponse<T>>(
      nextLink ? nextLink.replace(BASE_URL, "") : currentUrl,
      nextLink ? { method: options.method } : options
    );

    if (response.value) {
      results.push(...response.value);
    }

    nextLink = response["@odata.nextLink"];

    if (maxResults && results.length >= maxResults) {
      return results.slice(0, maxResults);
    }
  } while (nextLink);

  return results;
}
