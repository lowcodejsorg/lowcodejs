FROM node:22-alpine AS build

# Declarar build arguments
ARG APP_SERVER_URL
ARG APP_CLIENT_URL

# Configurar como variáveis de ambiente para o build
ENV APP_SERVER_URL=$APP_SERVER_URL
ENV APP_CLIENT_URL=$APP_CLIENT_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

RUN mkdir -p build/dist/js
RUN cp node_modules/@scalar/fastify-api-reference/dist/js/standalone.js build/dist/js/


# Stage de produção
FROM node:22-alpine AS production

# Declarar build arguments novamente no stage de produção
ARG APP_SERVER_URL
ARG APP_CLIENT_URL

# Configurar como variáveis de ambiente
ENV APP_SERVER_URL=$APP_SERVER_URL
ENV APP_CLIENT_URL=$APP_CLIENT_URL

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
RUN npm ci

RUN mkdir -p dist/js && \
    cp node_modules/@scalar/fastify-api-reference/dist/js/standalone.js dist/js/

# Criar a estrutura que o código espera: /app/app/controllers
# O código está procurando resolve(process.cwd(), 'app', 'controllers')
# process.cwd() = /app, então precisa de /app/app/controllers
COPY --from=build /app/build/app ./app
COPY --from=build /app/build/bin ./bin
COPY --from=build /app/build/config ./config
COPY --from=build /app/build/database ./database
COPY --from=build /app/build/start ./start

# Copiar pastas de arquivos estáticos (necessárias para fastifyStatic)
# COPY --from=build /app/_storage ./_storage
COPY --from=build /app/_system ./_system

# Criar diretório para volumes
RUN mkdir -p _storage

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "bin/server.js"]