# =============================================
# DOCKERFILE - Inventory Service
# =============================================

# ---------- STAGE 1: Build ----------
FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn package -DskipTests -B

# ---------- STAGE 2: Runtime ----------
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/target/*.jar app.jar

RUN chown appuser:appgroup app.jar

USER appuser

EXPOSE 8082

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:8082/api/v1/actuator/health || exit 1

ENV JAVA_OPTS="-Xms256m -Xmx512m" \
    DB_HOST=localhost \
    DB_PORT=5432 \
    DB_NAME=inventory_db \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    API_KEY=my-secret-api-key-12345 \
    PRODUCTS_SERVICE_URL=http://products-service:8081/api/v1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]