FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

RUN mkdir -p build/dist/js
RUN cp node_modules/@scalar/fastify-api-reference/dist/js/standalone.js build/dist/js/

# Stage de produção
FROM node:22-alpine AS production

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci

RUN mkdir -p dist/js && \
    cp node_modules/@scalar/fastify-api-reference/dist/js/standalone.js dist/js/

COPY --from=build /app/build/app ./app
COPY --from=build /app/build/bin ./bin
COPY --from=build /app/build/config ./config
COPY --from=build /app/build/database ./database
COPY --from=build /app/build/start ./start

COPY --from=build /app/_system ./_system

RUN mkdir -p _storage

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "bin/server.js"]