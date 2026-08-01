# RAKH Frontend — Vite/React SPA, multi-stage build
#
# NOTE on env vars: Vite bakes VITE_* variables into the built JS at BUILD
# time, not at container runtime — so they're passed as build ARGs here,
# not as regular `environment:` entries in docker-compose. VITE_SUPABASE_URL
# and VITE_SUPABASE_ANON_KEY are safe to bake in (the anon key is meant to
# be public-facing; RLS is what actually protects data, not secrecy of this
# key). Never do this pattern with the SERVICE ROLE key — that one only
# ever belongs in the backend container's runtime environment.

FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
