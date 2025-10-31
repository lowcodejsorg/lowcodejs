# Build stage
FROM node:22-alpine AS builder
WORKDIR /app

ARG VITE_API_BASE_URL=VITE_API_BASE_URL_PLACEHOLDER
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Production stage
FROM nginx:alpine

# Instalar envsubst para substituição de variáveis
RUN apk add --no-cache gettext

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build da aplicação
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar script de inicialização
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expor porta 80
EXPOSE 80

# Usar script customizado que substitui variáveis antes de iniciar nginx
ENTRYPOINT ["/docker-entrypoint.sh"]