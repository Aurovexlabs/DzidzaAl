FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
COPY package*.json ./
RUN npm install --omit=dev

FROM base AS runtime
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package*.json ./
EXPOSE 5000
CMD ["node", "src/server.js"]
