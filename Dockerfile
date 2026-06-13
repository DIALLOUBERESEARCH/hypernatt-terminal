FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY server.js stdio.mjs mcp-signal-server.mjs mcp-free-tools.mjs mcp-growth-tools.mjs base-tokens.mjs x402-facilitator-client.mjs x402-buyer.mjs x402-signal.mjs x402-mm-hunt.mjs x402-similarity.mjs x402-data-products.mjs x402-telemetry.mjs x402-beta.mjs x402-quota.mjs server-card-tools.mjs server-card.json ./
ENV MCP_PORT=8011
ENV M2M_SERVICE_URL=http://m2m-service:8010
ENV GATEWAY_URL=https://hypernatt.com
ENV PUBLIC_SIGNAL_URL=https://hypernatt.com/api/m2m/signal
EXPOSE 8011
CMD ["node", "server.js"]
