import { NextResponse } from 'next/server';

import { getPublicSsoConfig } from '@/app/lib/sso-config';

export const dynamic = 'force-dynamic';

/**
 * Serves the browser-facing Keycloak settings at request time. These values
 * (issuer host, realm, public client id) are already visible in every
 * authorization redirect, so exposing them here reveals nothing new — but
 * reading them per request is what lets the identity provider move without a
 * rebuild of the web image.
 */
export async function GET() {
  return NextResponse.json(getPublicSsoConfig(), {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
