FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* tsconfig.json ./
RUN npm ci --no-audit --no-fund
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Runtime image is the mcp-auth-proxy (Debian slim + Node already preinstalled).
# The proxy ENTRYPOINT spawns our Node process via stdio and exposes
# https://<host>/mcp with OAuth 2.1 (DCR) terminating at the proxy.
FROM ghcr.io/sigbit/mcp-auth-proxy:v2.10.2
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
# CMD is passed as the backend command to mcp-auth-proxy
CMD ["node", "/app/dist/index.js"]
