# Build stage
FROM node:22-alpine AS build

WORKDIR /app

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Production stage
FROM nginx:alpine

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build da aplicação
COPY --from=build /app/dist /usr/share/nginx/html

# Expor porta 80
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]