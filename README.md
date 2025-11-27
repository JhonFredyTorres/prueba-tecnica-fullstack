# 🏪 Sistema de Gestión de Inventario – Microservicios

> Prueba técnica Full Stack – solución completa de productos e inventario sobre arquitectura de microservicios, pensada para ser desplegable en entornos reales.


## 📋 Tabla de contenidos

1. [Resumen](#-resumen)
2. [Stack tecnológico](#-stack-tecnológico)
3. [Arquitectura](#-arquitectura)
4. [Decisiones técnicas](#-decisiones-técnicas)
5. [Estructura del proyecto](#-estructura-del-proyecto)
6. [Instalación y ejecución](#-instalación-y-ejecución)
7. [APIs](#-apis)
8. [Pruebas](#-pruebas)
9. [Flujo de datos](#-flujo-de-datos)
10. [Funcionalidades](#-funcionalidades)
11. [Próximos pasos](#-próximos-pasos)
12. [Autor](#-autor)

---

## 📖 Resumen

Sistema full-stack para gestionar productos y su inventario:

- CRUD de productos con paginación y filtros.
- Gestión de stock mínimo, detección de stock bajo y procesamiento de compras.
- Comunicación entre microservicios mediante REST + API Key.
- Frontend Angular 17 (Signals) sirviéndose desde Nginx como SPA.
- Despliegue orquestado con Docker Compose (dos BDs PostgreSQL, dos servicios Spring Boot y frontend).

El foco principal fue construir algo **simple de levantar**, pero con decisiones técnicas que se puedan defender en un entorno productivo.

---

## 🛠️ Stack tecnológico

| Capa           | Tecnología         | Rol                                                                 |
|----------------|--------------------|----------------------------------------------------------------------|
| Frontend       | Angular 17         | SPA, manejo de estado con Signals, consumo de APIs                  |
| Backend        | Java 17 + Spring Boot 3.2 | Microservicios REST (productos e inventario)                 |
| Bases de datos | PostgreSQL 15      | Persistencia relacional independiente por servicio                  |
| Infraestructura| Docker + Docker Compose | Orquestación local y aislamiento de servicios               |
| Proxy / Static | Nginx (alpine)     | Reverse proxy + hosting del build Angular                           |
| Docs APIs      | OpenAPI / Swagger  | Documentación interactiva para ambos microservicios                 |

---

## 🏗️ Arquitectura

### Visión general


Cliente (Browser)
        │
        ▼
 ┌─────────────────────────────────────┐
 │              NGINX                 │
 │  /                 → Angular SPA   │
 │  /api/products/*   → products-svc  │
 │  /api/inventory/*  → inventory-svc │
 └─────────────────────────────────────┘
        │                      │
        ▼                      ▼
 ┌───────────────────┐  ┌───────────────────┐
 │ PRODUCTS SERVICE  │  │ INVENTORY SERVICE │
 │  Java 17 + SB 3   │  │  Java 17 + SB 3   │
 └─────────┬─────────┘  └─────────┬─────────┘
           ▼                      ▼
   PostgreSQL products_db   PostgreSQL inventory_db
Cada servicio expone sus endpoints bajo /api/v1 y expone Swagger. La comunicación entre inventory y products se hace vía HTTP interno sobre la red de Docker (products-service:8081).

Frontend (Angular)

Core: servicios, interceptores (API Key, manejo de errores) y modelos.

Shared: componentes reutilizables (loading, modal de confirmación, notificaciones, paginación, etc.).

Features:

products: listado, filtros y formulario de alta/edición.

inventory: detalle de stock, actualización de cantidades, compras, listado de low-stock.

Signals se utilizan como fuente única de verdad por feature (productsSignal, inventorySignal, stockStatus, etc.).

💡 Decisiones técnicas
PostgreSQL como base de datos

Elegido por:

Modelo de datos claramente relacional (producto ↔ inventario).

Transacciones ACID para operaciones de compra/actualización de stock.

Herramientas maduras para indexación, planos de ejecución y optimización.

Mongo/H2 se descartaron para este caso: Mongo añade complejidad innecesaria para un dominio tan tabular y H2 está pensado sobre todo para pruebas/desarrollo, no para una arquitectura que pretende ser cercana a producción.

Microservicios vs monolito

Se podría haber resuelto todo en un solo Spring Boot, pero se optó por separar:

Products Service: catálogo, reglas de SKU y metadatos del producto.

Inventory Service: cantidades, stock mínimo, operaciones de compra y exposición de indicadores.

Ventajas de esta separación:

Despliegues independientes.

Bases de datos aisladas.

Cada servicio puede escalar de forma distinta (ej: inventario con más carga de escritura).

Coste añadido: más puntos de fallo y más networking. Se mitigó con timeouts, reintentos y uso de una red interna de Docker.

Protocolo y formato

REST + JSON.

Formato de respuesta inspirado en JSON:API (data, meta, attributes), que hace más fácil extender propiedades sin romper clientes.

Frontend con Angular 17 + Signals

Angular 17 permite un estilo más limpio apoyado en Signals:

// Ejemplo simplificado
private readonly _inventory = signal<Inventory | null>(null);
inventory = this._inventory.asReadonly();

stockStatus = computed(() => {
  const inv = this._inventory();
  if (!inv) return null;
  if (inv.quantity === 0) return 'out_of_stock';
  if (inv.quantity <= inv.minStock) return 'low';
  return 'available';
});


Beneficios: menos boilerplate comparado con BehaviorSubject, más control sobre el flujo de cambio y preparado para futuros modos zoneless.

Autenticación service-to-service

La seguridad entre servicios se resolvió con una API Key en header:

X-API-Key: my-secret-api-key-12345


Sencillo para una prueba técnica.

Suficiente para tráfico interno en una red confiable (Docker network).

Deja espacio para evolucionar a OAuth2 / JWT para usuarios finales si el producto creciera.

Resiliencia

Timeouts configurables vía propiedades.

Reintentos con backoff exponencial (@Retryable) para llamadas al Products Service.

Puntos de extensión claros para añadir Circuit Breaker con Resilience4j.

📁 Estructura del proyecto
prueba-tecnica-fullstack/
├── docker-compose.yml           # Orquestación completa
├── backend/
│   ├── products-service/
│   │   ├── src/main/java/com/techtest/products/
│   │   │   ├── config/         # Swagger, CORS, API Key filter
│   │   │   ├── controller/     # REST Controllers
│   │   │   ├── service/        # Reglas de dominio de productos
│   │   │   ├── repository/     # Spring Data JPA
│   │   │   ├── entity/         # Entidades JPA
│   │   │   ├── dto/            # DTOs de entrada/salida
│   │   │   └── exception/      # Manejo centralizado de errores
│   │   ├── src/test/java/...   # Tests unitarios e integración
│   │   ├── Dockerfile
│   │   └── pom.xml
│   └── inventory-service/
│       ├── src/main/java/com/techtest/inventory/
│       │   ├── config/         # RestTemplate, retry, OpenAPI
│       │   ├── controller/
│       │   ├── service/        # Negocio + eventos de inventario
│       │   ├── client/         # Cliente HTTP al Products Service
│       │   ├── repository/
│       │   ├── entity/
│       │   ├── dto/
│       │   └── exception/
│       ├── src/test/java/...   # Tests
│       ├── Dockerfile
│       └── pom.xml
└── frontend/
    ├── src/app/
    │   ├── core/
    │   │   ├── services/
    │   │   ├── interceptors/
    │   │   └── models/
    │   ├── shared/
    │   ├── features/
    │   │   ├── products/
    │   │   └── inventory/
    │   └── environments/
    ├── Dockerfile
    ├── nginx.conf
    ├── karma.conf.js
    └── package.json

🚀 Instalación y ejecución
Prerrequisitos

Docker Desktop (20.10+)

Docker Compose v2

4 GB de RAM libres

Puertos 80, 8081, 8082, 5432 y 5433 disponibles

Levantar todo con Docker
# 1. Clonar
git clone [[https://github.com/tu-usuario/prueba-tecnica-fullstack.git](https://github.com/JhonFredyTorres/prueba-tecnica-fullstack.git)
cd prueba-tecnica-fullstack

# 2. Construir e iniciar
docker-compose up -d --build

# 3. Ver estado
docker-compose ps

# 4. Logs (opcional)
docker-compose logs -f

URLs
Servicio	URL
Frontend	http://localhost

Products API	http://localhost:8081/api/v1

Products Swagger	http://localhost:8081/api/v1/swagger-ui.html

Inventory API	http://localhost:8082/api/v1

Inventory Swagger	http://localhost:8082/api/v1/swagger-ui.html
📚 APIs

Todas las llamadas internas llevan:

X-API-Key: my-secret-api-key-12345

Products Service

Endpoints principales:

GET /api/v1/products – listado paginado

GET /api/v1/products/{id} – detalle

GET /api/v1/products/{id}/exists – verificación rápida

POST /api/v1/products – alta

PUT /api/v1/products/{id} – actualización

DELETE /api/v1/products/{id} – baja

Ejemplo creación:

curl -X POST http://localhost:8081/api/v1/products \
  -H "Content-Type: application/json" \
  -H "X-API-Key: my-secret-api-key-12345" \
  -d '{
    "name": "iPhone 15 Pro",
    "sku": "IPH-15-PRO",
    "price": 1199.99,
    "category": "Electronics",
    "description": "Último modelo de iPhone"
  }'

Inventory Service

Endpoints principales:

GET /api/v1/inventory/product/{productId}

POST /api/v1/inventory – crear/actualizar inventario

PATCH /api/v1/inventory/product/{productId}/quantity?quantity=X

POST /api/v1/inventory/product/{productId}/purchase

GET /api/v1/inventory/low-stock

DELETE /api/v1/inventory/product/{productId}

🧪 Pruebas
Backend

Tests unitarios y de integración sobre:

Servicios de dominio (reglas de negocio).

Controladores (status codes, payloads).

Cliente HTTP del Inventory Service hacia Products Service (reintentos, errores, etc.).

Ejemplo de ejecución:

cd backend/products-service
./mvnw test

cd ../inventory-service
./mvnw test

Frontend

Tests unitarios con Karma + Jasmine.

Cobertura sobre:

Servicios (ProductService, InventoryService, NotificationService).

Interceptores (ApiKeyInterceptor, ErrorInterceptor).

Componentes principales de productos e inventario.

cd frontend
npm test        # modo interactivo
# o
npm run test:ci # pensado para pipelines

🔄 Flujo de datos (resumen)
Listado de productos

Angular llama a /api/products (Nginx).

Nginx reenvía a products-service:8081/api/v1/products con la API Key.

Products Service consulta PostgreSQL (products_db) vía JPA.

Devuelve respuesta JSON que se mapea a modelos de frontend y Signals.

Proceso de compra

Angular envía POST /api/inventory/product/{id}/purchase.

Inventory Service:

Verifica que el producto exista llamando a Products Service.

Valida stock.

Actualiza la tabla de inventario.

Emite log estructurado de evento.

✅ Funcionalidades
Backend

CRUD de productos con validación de SKU único, paginación y filtros.

Gestión de inventario con stock mínimo y detección de low-stock.

Procesamiento de compras con verificación de producto y stock.

Comunicación entre servicios autenticada por API Key.

Health checks y documentación Swagger.

Frontend

Listado y mantenimiento de productos.

Visualización y actualización de stock.

Procesos de compra simulados desde la UI.

Indicadores visuales de stock bajo / agotado.

Notificaciones y estados de carga.



👨‍💻 Autor

Jhon Fredy Torres

Full Stack Developer

📧 Jhonfredytorresp@gmail.com
