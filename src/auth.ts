import { readFileSync } from "node:fs";
import { ConfidentialClientApplication, Configuration } from "@azure/msal-node";

export interface DefenderAuthConfig {
  tenantId: string;
  clientId: string;
  // Provide EITHER clientSecret OR clientCertificate; cert is preferred for
  // long-running deployments (no plaintext secret on disk after the cert is
  // converted to PEM, and easier rotation via Entra without code changes).
  clientSecret?: string;
  clientCertificate?: {
    thumbprint: string;       // SHA-1 of the public cert (Entra "Thumbprint")
    privateKeyPem: string;    // PEM-encoded private key (PKCS#8 or PKCS#1)
  };
}

// Two separate resource scopes
const MTP_SCOPE   = "https://api.security.microsoft.com/.default";   // Incidents, XDR Advanced Hunting
const WDATP_SCOPE = "https://api.securitycenter.microsoft.com/.default"; // Alerts, Machines, Files, IPs, etc.

let msalClient: ConfidentialClientApplication | null = null;

// Separate token caches per scope
const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

export function initializeAuth(config: DefenderAuthConfig): void {
  if (!config.clientSecret && !config.clientCertificate) {
    throw new Error(
      "Auth misconfigured: provide either clientSecret or clientCertificate."
    );
  }

  const authConfig: Configuration["auth"] = {
    clientId: config.clientId,
    authority: `https://login.microsoftonline.com/${config.tenantId}`,
  };

  if (config.clientCertificate) {
    authConfig.clientCertificate = {
      thumbprint: config.clientCertificate.thumbprint,
      privateKey: config.clientCertificate.privateKeyPem,
    };
  } else {
    authConfig.clientSecret = config.clientSecret;
  }

  msalClient = new ConfidentialClientApplication({ auth: authConfig });
}

/**
 * Build a DefenderAuthConfig from process.env. Prefers cert if both are set.
 * Cert env vars: DEFENDER_CERT_THUMBPRINT + DEFENDER_CERT_KEY_PATH (file path
 * to the PEM private key). Falls back to DEFENDER_CLIENT_SECRET.
 */
export function authConfigFromEnv(): DefenderAuthConfig {
  const tenantId = required("DEFENDER_TENANT_ID");
  const clientId = required("DEFENDER_CLIENT_ID");
  const certThumbprint = process.env.DEFENDER_CERT_THUMBPRINT?.trim();
  const certKeyPath    = process.env.DEFENDER_CERT_KEY_PATH?.trim();
  if (certThumbprint && certKeyPath) {
    return {
      tenantId,
      clientId,
      clientCertificate: {
        thumbprint: certThumbprint,
        privateKeyPem: readFileSync(certKeyPath, "utf8"),
      },
    };
  }
  return {
    tenantId,
    clientId,
    clientSecret: required("DEFENDER_CLIENT_SECRET"),
  };
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function getTokenForScope(scope: string): Promise<string> {
  if (!msalClient) {
    throw new Error(
      "Authentication not initialized. Please set DEFENDER_TENANT_ID, DEFENDER_CLIENT_ID, and DEFENDER_CLIENT_SECRET environment variables."
    );
  }

  // Return cached token if still valid (with 60s buffer)
  const cached = tokenCache[scope];
  if (cached && Date.now() < cached.expiresAt - 60000) {
    return cached.token;
  }

  const result = await msalClient.acquireTokenByClientCredential({
    scopes: [scope],
  });

  if (!result || !result.accessToken) {
    throw new Error(`Failed to acquire access token for scope: ${scope}`);
  }

  tokenCache[scope] = {
    token: result.accessToken,
    expiresAt: result.expiresOn ? result.expiresOn.getTime() : Date.now() + 3600000,
  };

  return tokenCache[scope].token;
}

/** Token for Incidents and XDR Advanced Hunting (Microsoft Threat Protection) */
export async function getAccessToken(): Promise<string> {
  return getTokenForScope(MTP_SCOPE);
}

/** Token for Alerts, Machines, Files, IPs, URLs, Users, WDATP Advanced Queries */
export async function getWdatpAccessToken(): Promise<string> {
  return getTokenForScope(WDATP_SCOPE);
}

export function isAuthConfigured(): boolean {
  return msalClient !== null;
}
