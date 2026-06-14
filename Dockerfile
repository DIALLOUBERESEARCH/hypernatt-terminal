FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js stdio.mjs mcp-signal-server.mjs mcp-session-resilience.mjs agent-payment-error.mjs mcp-free-tools.mjs mcp-growth-tools.mjs base-tokens.mjs \
    x402-signal.mjs x402-mm-hunt.mjs x402-similarity.mjs x402-data-products.mjs \
    x402-facilitator-client.mjs x402-telemetry.mjs x402-beta.mjs x402-quota.mjs server-card-tools.mjs server-card.json server.json ./
COPY scripts/verify-mcp-tool-count.mjs ./scripts/verify-mcp-tool-count.mjs
RUN node scripts/verify-mcp-tool-count.mjs

ENV NODE_ENV=production
ENV MCP_PORT=8011
ENV GATEWAY_URL=https://hypernatt.com
ENV M2M_SERVICE_URL=https://hypernatt.com
ENV PUBLIC_SIGNAL_URL=https://hypernatt.com/api/m2m/signal
ENV PUBLIC_MM_HUNT_URL=https://hypernatt.com/api/m2m/mm-hunt
ENV PUBLIC_SIMILARITY_URL=https://hypernatt.com/api/m2m/similarity-match

EXPOSE 8011

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8011/health || exit 1

CMD ["node", "server.js"]
