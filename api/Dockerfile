FROM node:22-alpine AS build
WORKDIR /app

# Copiar apenas package files primeiro (melhor cache)
COPY package*.json ./
RUN npm install
RUN npm cache clean --force

# Copiar código fonte
COPY . .

# Build
RUN npm run build 
RUN mkdir -p build/dist/js 
RUN cp node_modules/@scalar/fastify-api-reference/dist/js/standalone.js build/dist/js/

# ============================================
FROM node:22-alpine AS production
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm install
RUN npm cache clean --force
RUN mkdir -p dist/js
RUN cp node_modules/@scalar/fastify-api-reference/dist/js/standalone.js dist/js/

# Copiar arquivos buildados
COPY --from=build /app/build/app ./app
COPY --from=build /app/build/bin ./bin
COPY --from=build /app/build/config ./config
COPY --from=build /app/build/database ./database
COPY --from=build /app/build/start ./start

# Copiar _system se necessário (avalie se realmente precisa)
COPY --from=build /app/_system ./_system

# Criar diretório para volumes
RUN mkdir -p _storage

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001 -G nodejs 
RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "bin/server.js"]