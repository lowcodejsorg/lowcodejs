# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL="https://api.develop.lowcodejs.org"

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm install
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build da aplicação
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]