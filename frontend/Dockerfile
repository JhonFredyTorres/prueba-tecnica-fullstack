# ============================================
# STAGE 1: Build Angular Application
# ============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Construir la aplicación para producción
RUN npm run build

# ============================================
# STAGE 2: Serve with Nginx
# ============================================
FROM nginx:alpine AS production

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copiar los archivos compilados de Angular
COPY --from=build /app/dist/inventory-app/browser /usr/share/nginx/html

# Exponer puerto 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]