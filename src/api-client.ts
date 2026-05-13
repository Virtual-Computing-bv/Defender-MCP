import { getAccessToken, getWdatpAccessToken } from "./auth.js";

// Regional API endpoints. Defender for Endpoint and M365 Defender are sharded
// per region — using the wrong base URL returns 403/404 for tenants located
// outside the global default. Set DEFENDER_REGION ("global" | "eu" | "uk" |
// "us") or override the two URLs explicitly via env.
//
// Confirmed against Microsoft docs + a working n8n integration in May 2026:
//   eu:     MTP = https://eu.api.security.microsoft.com/api
//           WDATP = https://api-eu.securitycenter.microsoft.com/api
//   uk:     MTP = https://uk.api.security.microsoft.com/api
//           WDATP = https://api-uk.securitycenter.microsoft.com/api
//   us:     MTP = https://api-us.security.microsoft.com/api
//           WDATP = https://api-us.securitycenter.microsoft.com/api
//   global: MTP = https://api.security.microsoft.com/api
//           WDATP = https://api.securitycenter.microsoft.com/api
const REGION = (process.env.DEFENDER_REGION ?? "global").toLowerCase();

function regionalBaseUrls(region: string): { mtp: string; wdatp: string } {
  switch (region) {
    case "eu":
      return {
        mtp:   "https://eu.api.security.microsoft.com/api",
        wdatp: "https://api-eu.securitycenter.microsoft.com/api",
      };
    case "uk":
      return {
        mtp:   "https://uk.api.security.microsoft.com/api",
        wdatp: "https://api-uk.securitycenter.microsoft.com/api",
      };
    case "us":
      return {
        mtp:   "https://api-us.security.microsoft.com/api",
        wdatp: "https://api-us.securitycenter.microsoft.com/api",
      };
    default:
      return {
        mtp:   "https://api.security.microsoft.com/api",
        wdatp: "https://api.securitycenter.microsoft.com/api",
      };
  }
}

const defaults = regionalBaseUrls(REGION);
const MTP_BASE_URL   = process.env.DEFENDER_MTP_BASE_URL   ?? defaults.mtp;
const WDATP_BASE_URL = process.env.DEFENDER_WDATP_BASE_URL ?? defaults.wdatp;

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
  /** Set to true for Alerts, Machines, Files, IPs, URLs, Users, WDATP AdvancedQueries */
  useWdatp?: boolean;
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
  const { method = "GET", body, queryParams, useWdatp = false } = options;

  const token   = useWdatp ? await getWdatpAccessToken() : await getAccessToken();
  const baseUrl = useWdatp ? WDATP_BASE_URL : MTP_BASE_URL;
  const url     = `${baseUrl}${endpoint}${buildQueryString(queryParams)}`;

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
  const baseUrl = options.useWdatp ? WDATP_BASE_URL : MTP_BASE_URL;

  do {
    const response = await defenderApiRequest<ApiResponse<T>>(
      nextLink ? nextLink.replace(baseUrl, "") : currentUrl,
      nextLink ? { method: options.method, useWdatp: options.useWdatp } : options
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
