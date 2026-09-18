'use client';

import Keycloak from 'keycloak-js';

import type { PublicSsoConfig } from './sso-config';

let keycloakInstance: Keycloak | null = null;
let initPromise: Promise<boolean> | null = null;
let configPromise: Promise<PublicSsoConfig> | null = null;

async function fetchRuntimeSsoConfig(): Promise<PublicSsoConfig> {
  const response = await fetch('/api/sso/config', {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Gagal memuat konfigurasi SSO dari server.');
  }

  const payload = (await response.json().catch(() => null)) as Partial<PublicSsoConfig> | null;
  const keycloakUrl = String(payload?.keycloakUrl || '');
  const realm = String(payload?.realm || '');
  const clientId = String(payload?.clientId || '');

  if (!keycloakUrl) {
    throw new Error('KEYCLOAK_URL belum diset pada environment server.');
  }

  if (!clientId) {
    throw new Error('KEYCLOAK_CLIENT_ID belum diset pada environment server.');
  }

  return { keycloakUrl, realm, clientId };
}

function getRuntimeSsoConfig(): Promise<PublicSsoConfig> {
  if (!configPromise) {
    configPromise = fetchRuntimeSsoConfig().catch((error: unknown) => {
      configPromise = null;
      throw error;
    });
  }

  return configPromise;
}

async function resolveKeycloakInstance(): Promise<Keycloak> {
  if (!keycloakInstance) {
    const config = await getRuntimeSsoConfig();

    keycloakInstance = new Keycloak({
      url: config.keycloakUrl,
      realm: config.realm,
      clientId: config.clientId,
    });
  }

  return keycloakInstance;
}

export async function initKeycloak(): Promise<boolean> {
  if (!initPromise) {
    initPromise = (async () => {
      const keycloak = await resolveKeycloakInstance();

      return keycloak.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        responseMode: 'query',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        silentCheckSsoFallback: true,
      });
    })().catch((error: unknown) => {
      initPromise = null;
      throw error;
    });
  }

  return initPromise;
}

export function getKeycloak(): Keycloak {
  if (!keycloakInstance) {
    throw new Error('Keycloak belum siap. Panggil initKeycloak() lebih dulu.');
  }

  return keycloakInstance;
}

export async function getValidAccessToken(minValidity = 30): Promise<string | undefined> {
  const keycloak = await resolveKeycloakInstance();

  if (!keycloak.authenticated) {
    return undefined;
  }

  await keycloak.updateToken(minValidity);
  return keycloak.token;
}

export async function loginWithSso(redirectUri = window.location.href): Promise<void> {
  const keycloak = await resolveKeycloakInstance();
  await keycloak.login({ redirectUri });
}

export async function logoutFromSso(redirectUri = `${window.location.origin}/`): Promise<void> {
  const keycloak = await resolveKeycloakInstance();
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
  await keycloak.logout({ redirectUri });
}
