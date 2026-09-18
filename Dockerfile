FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js stdio.mjs mcp-signal-server.mjs mcp-session-resilience.mjs mcp-session-bind.mjs agent-payment-error.mjs mcp-free-tools.mjs mcp-growth-tools.mjs base-tokens.mjs \
    x402-buyer-copy.mjs x402-data-products.mjs x402-networks.mjs x402-builder-code.mjs \
    x402-facilitator-client.mjs x402-facilitator-error.mjs x402-telemetry.mjs x402-beta.mjs x402-quota.mjs \
    x402-settlement-cache.mjs x402-funnel-terminal.mjs \
    x402-svm-hydrate.mjs x402-svm-ata.mjs x402-svm-prepare.mjs \
    server-card-tools.mjs server-card.json server.json ./
COPY native-depth-public.mjs native-depth-catalog.mjs native-depth-http.mjs ./
COPY terminal-trial-policy.mjs ./
COPY scripts/verify-mcp-tool-count.mjs ./scripts/verify-mcp-tool-count.mjs
RUN node scripts/verify-mcp-tool-count.mjs
RUN node --input-type=module -e "import {createMcpServer} from './mcp-signal-server.mjs'; await createMcpServer().close()"

ENV NODE_ENV=production
ENV MCP_PORT=8011
ENV GATEWAY_URL=https://hypernatt.com
ENV M2M_SERVICE_URL=https://hypernatt.com
ENV PUBLIC_LIQ_RADAR_URL=https://hypernatt.com/api/m2m/liq-radar

EXPOSE 8011

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8011/health || exit 1

CMD ["node", "server.js"]
