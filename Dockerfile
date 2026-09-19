FROM node:20-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV PUPPETEER_SKIP_DOWNLOAD=true
FROM base AS deps
COPY package*.json ./
RUN npm ci --no-audit --fund=false
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_REALM
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ARG NEXT_PUBLIC_DISABLE_SSO
ARG KEYCLOAK_URL
ARG KEYCLOAK_REALM
ARG KEYCLOAK_CLIENT_ID
ARG KEYCLOAK_ISSUER_URL
ARG KEYCLOAK_JWKS_URI
ARG KEYCLOAK_AUDIENCE
ARG SSO_ALLOWED_ROLES
ARG SUPABASE_SERVICE_ROLE_KEY
ARG DATABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_KEYCLOAK_URL=$NEXT_PUBLIC_KEYCLOAK_URL
ENV NEXT_PUBLIC_KEYCLOAK_REALM=$NEXT_PUBLIC_KEYCLOAK_REALM
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=$NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ENV NEXT_PUBLIC_DISABLE_SSO=$NEXT_PUBLIC_DISABLE_SSO
ENV KEYCLOAK_URL=$KEYCLOAK_URL
ENV KEYCLOAK_REALM=$KEYCLOAK_REALM
ENV KEYCLOAK_CLIENT_ID=$KEYCLOAK_CLIENT_ID
ENV KEYCLOAK_ISSUER_URL=$KEYCLOAK_ISSUER_URL
ENV KEYCLOAK_JWKS_URI=$KEYCLOAK_JWKS_URI
ENV KEYCLOAK_AUDIENCE=$KEYCLOAK_AUDIENCE
ENV SSO_ALLOWED_ROLES=$SSO_ALLOWED_ROLES
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV DATABASE_URL=$DATABASE_URL
RUN npm run build
FROM mcr.microsoft.com/playwright:v1.59.1-noble AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV YT_DLP_PATH=/usr/bin/yt-dlp
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip ca-certificates \
    && pip3 install --break-system-packages --no-cache-dir -U "yt-dlp[default]" \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder --chown=pwuser:pwuser /app/.next/standalone ./
COPY --from=builder --chown=pwuser:pwuser /app/.next/static ./.next/static
COPY --from=builder --chown=pwuser:pwuser /app/public ./public
COPY --from=builder --chown=pwuser:pwuser /app/drizzle ./drizzle
COPY --from=builder --chown=pwuser:pwuser /app/migrate.mjs ./migrate.mjs
RUN mkdir -p /app/.cache && chown -R pwuser:pwuser /app/.cache
USER pwuser
EXPOSE 3000
CMD ["sh", "-c", "node migrate.mjs && node server.js"]
