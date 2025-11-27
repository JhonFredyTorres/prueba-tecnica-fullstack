# =============================================
# DOCKERFILE - Products Service
# =============================================
# Multi-stage build para optimizar el tamaño de la imagen

# ---------- STAGE 1: Build ----------
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

# Copiar archivos de configuración de Maven primero (para cache de dependencias)
COPY pom.xml .

# Descargar dependencias (se cachea si pom.xml no cambia)
RUN mvn dependency:go-offline -B

# Copiar código fuente
COPY src ./src

# Compilar y empaquetar (sin ejecutar tests)
RUN mvn package -DskipTests -B

# ---------- STAGE 2: Runtime ----------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar JAR desde la etapa de build
COPY --from=builder /app/target/*.jar app.jar

# Cambiar ownership del archivo
RUN chown appuser:appgroup app.jar

# Usar usuario no-root
USER appuser

# Exponer puerto
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8081/api/v1/actuator/health || exit 1

# Variables de entorno por defecto
ENV JAVA_OPTS="-Xms256m -Xmx512m" \
    DB_HOST=localhost \
    DB_PORT=5433 \
    DB_NAME=products_db \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    API_KEY=my-secret-api-key-12345

# Ejecutar la aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]