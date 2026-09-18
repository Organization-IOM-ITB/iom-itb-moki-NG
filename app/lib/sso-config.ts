// Retired, kept for reference only. The browser now receives its Keycloak host
// from /api/sso/config, and an unset KEYCLOAK_URL has to fail loudly instead of
// silently sending users to a third-party identity provider. Do not re-enable:
// a single missing env var would send authorization requests off-domain again.
// const DEFAULT_KEYCLOAK_URL = 'https://iom-sso.kirisame.jp.net';
const DEFAULT_KEYCLOAK_REALM = 'iom-itb-sso';
const DEFAULT_ALLOWED_ROLES = ['admin', 'pengurus-bidang-1'];
export const SSO_SESSION_COOKIE = 'iom_sso_access_token';

export interface PublicSsoConfig {
  keycloakUrl: string;
  realm: string;
  clientId: string;
}

function readEnv(...names: string[]): string {
  for (const name of names) {
    const value = String(process.env[name] || '').trim();

    if (value) {
      return value;
    }
  }

  return '';
}

function readKeycloakUrl(): string {
  return readEnv('KEYCLOAK_URL', 'NEXT_PUBLIC_KEYCLOAK_URL').replace(/\/+$/, '');
}

function readRealm(): string {
  return readEnv('KEYCLOAK_REALM', 'NEXT_PUBLIC_KEYCLOAK_REALM') || DEFAULT_KEYCLOAK_REALM;
}

function readClientId(): string {
  return readEnv('KEYCLOAK_CLIENT_ID', 'NEXT_PUBLIC_KEYCLOAK_CLIENT_ID');
}

function realmBaseUrl(): string {
  const keycloakUrl = readKeycloakUrl();

  return keycloakUrl ? `${keycloakUrl}/realms/${readRealm()}` : '';
}

function parseAllowedRoles(rawValue: string | undefined): string[] {
  const parsed = String(rawValue || '')
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return parsed.length ? parsed : DEFAULT_ALLOWED_ROLES;
}

export const ssoConfig = {
  keycloakUrl: readKeycloakUrl(),
  realm: readRealm(),
  clientId: readClientId(),
  issuer: readEnv('KEYCLOAK_ISSUER_URL') || realmBaseUrl(),
  jwksUri:
    readEnv('KEYCLOAK_JWKS_URI') ||
    (realmBaseUrl() ? `${realmBaseUrl()}/protocol/openid-connect/certs` : ''),
  audience: readEnv('KEYCLOAK_AUDIENCE') || 'backend-api',
  allowedRoles: parseAllowedRoles(process.env.SSO_ALLOWED_ROLES),
};

/**
 * Read the browser-facing SSO settings from the *server* environment on every
 * call, so the identity provider can be changed by restarting the container
 * instead of rebuilding the image. Values are intentionally not read from
 * NEXT_PUBLIC_* in the browser: Next.js inlines those at build time, which is
 * how a stale Keycloak host keeps being requested long after the environment
 * has moved on.
 */
export function getPublicSsoConfig(): PublicSsoConfig {
  return {
    keycloakUrl: readKeycloakUrl(),
    realm: readRealm(),
    clientId: readClientId(),
  };
}
