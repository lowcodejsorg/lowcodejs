FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Criar setting.properties se não existir (necessário para o build)
RUN if [ ! -f "_system/setting.properties" ]; then \
    cp _system/setting.properties.example _system/setting.properties; \
    fi

# Usar build existente se disponível, senão fazer build
RUN if [ ! -d "build" ] || [ -z "$(ls -A build 2>/dev/null)" ]; then npm run build; fi

RUN mkdir -p build/dist/js
RUN cp node_modules/@scalar/fastify-api-reference/dist/js/standalone.js build/dist/js/

# Stage de produção
FROM node:22-alpine AS production

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm install

RUN mkdir -p dist/js && \
    cp node_modules/@scalar/fastify-api-reference/dist/js/standalone.js dist/js/

COPY --from=build /app/build/application ./application
COPY --from=build /app/build/bin ./bin
COPY --from=build /app/build/config ./config
COPY --from=build /app/build/database ./database
COPY --from=build /app/build/start ./start

COPY --from=build /app/_system ./_system

RUN mkdir -p ./_system/_storage

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "bin/server.js"]