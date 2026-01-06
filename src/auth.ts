import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";

export interface DefenderAuthConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

const DEFENDER_SCOPE = "https://api.security.microsoft.com/.default";

let msalClient: ConfidentialClientApplication | null = null;
let cachedToken: { token: string; expiresAt: number } | null = null;

export function initializeAuth(config: DefenderAuthConfig): void {
  const msalConfig: Configuration = {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      clientSecret: config.clientSecret,
    },
  };

  msalClient = new ConfidentialClientApplication(msalConfig);
}

export async function getAccessToken(): Promise<string> {
  if (!msalClient) {
    throw new Error(
      "Authentication not initialized. Please set DEFENDER_TENANT_ID, DEFENDER_CLIENT_ID, and DEFENDER_CLIENT_SECRET environment variables."
    );
  }

  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const result = await msalClient.acquireTokenByClientCredential({
    scopes: [DEFENDER_SCOPE],
  });

  if (!result || !result.accessToken) {
    throw new Error("Failed to acquire access token");
  }

  cachedToken = {
    token: result.accessToken,
    expiresAt: result.expiresOn ? result.expiresOn.getTime() : Date.now() + 3600000,
  };

  return cachedToken.token;
}

export function isAuthConfigured(): boolean {
  return msalClient !== null;
}
