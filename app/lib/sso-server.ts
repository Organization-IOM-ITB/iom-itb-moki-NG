import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

import { ssoConfig } from './sso-config';

let remoteJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getRemoteJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!remoteJwks) {
    if (!ssoConfig.jwksUri) {
      throw new Error('KEYCLOAK_URL or KEYCLOAK_JWKS_URI is required to verify SSO tokens.');
    }

    remoteJwks = createRemoteJWKSet(new URL(ssoConfig.jwksUri));
  }

  return remoteJwks;
}

export interface VerifiedSsoToken extends JWTPayload {
  email?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: {
    roles?: string[];
  };
}

function extractRoles(payload: VerifiedSsoToken): string[] {
  return Array.isArray(payload.realm_access?.roles)
    ? payload.realm_access.roles.filter((role): role is string => typeof role === 'string')
    : [];
}

export async function verifySsoAccessToken(token: string): Promise<VerifiedSsoToken> {
  const { payload } = await jwtVerify(token, getRemoteJwks(), {
    issuer: ssoConfig.issuer,
    audience: ssoConfig.audience,
    algorithms: ['RS256'],
  });

  const typedPayload = payload as VerifiedSsoToken;
  const allowedRoles = ssoConfig.allowedRoles;

  if (allowedRoles.length) {
    const roles = extractRoles(typedPayload);
    const authorized = roles.some((role) => allowedRoles.includes(role));

    if (!authorized) {
      throw new Error(`Forbidden role. Allowed roles: ${allowedRoles.join(', ')}`);
    }
  }

  return typedPayload;
}
