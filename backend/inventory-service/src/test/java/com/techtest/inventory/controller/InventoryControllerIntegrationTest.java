package com.techtest.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.client.WireMock;
import com.techtest.inventory.dto.request.InventoryRequest;
import com.techtest.inventory.dto.request.PurchaseRequest;
import com.techtest.inventory.entity.Inventory;
import com.techtest.inventory.repository.InventoryRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de integración para InventoryController.
 *
 * <p>Estas pruebas verifican el comportamiento completo del API de inventario,
 * incluyendo la comunicación con el microservicio de productos (simulado con WireMock).</p>
 *
 * <p>Escenarios cubiertos:</p>
 * <ul>
 *   <li>CRUD completo de inventario</li>
 *   <li>Procesamiento de compras</li>
 *   <li>Validación de stock</li>
 *   <li>Manejo de errores y autenticación</li>
 *   <li>Comunicación entre microservicios</li>
 * </ul>
 *
 * @author Jhon Fredy Torres
 * @version 1.0.0
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Inventory Controller - Integration Tests")
class InventoryControllerIntegrationTest {

    // ==================== DEPENDENCIAS ====================

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InventoryRepository inventoryRepository;

    // ==================== CONSTANTES ====================

    private static WireMockServer wireMockServer;

    private static final String API_KEY = "test-api-key";
    private static final String API_KEY_HEADER = "X-API-Key";
    private static final int WIREMOCK_PORT = 8089;

    private static final Long DEFAULT_PRODUCT_ID = 1L;
    private static final int DEFAULT_QUANTITY = 50;
    private static final int DEFAULT_MIN_STOCK = 5;

    private static final String PRODUCT_EXISTS_URL_PATTERN = "/api/v1/products/\\d+/exists";
    private static final String PRODUCT_DETAILS_URL_PATTERN = "/api/v1/products/\\d+";

    private static final String MOCK_PRODUCT_RESPONSE = """
            {
                "data": {
                    "type": "products",
                    "id": "1",
                    "attributes": {
                        "name": "Test Product",
                        "sku": "TEST-001",
                        "category": "Electronics",
                        "price": 99.99
                    }
                }
            }
            """;

    // ==================== SETUP / TEARDOWN ====================

    @BeforeAll
    static void startWireMock() {
        wireMockServer = new WireMockServer(WIREMOCK_PORT);
        wireMockServer.start();
        WireMock.configureFor("localhost", WIREMOCK_PORT);
    }

    @AfterAll
    static void stopWireMock() {
        if (wireMockServer != null && wireMockServer.isRunning()) {
            wireMockServer.stop();
        }
    }

    @BeforeEach
    void setUp() {
        wireMockServer.resetAll();
        inventoryRepository.deleteAll();
        setupDefaultProductMocks();
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("services.products.url", () -> "http://localhost:" + WIREMOCK_PORT + "/api/v1");
    }

    // ==================== TESTS: CREAR INVENTARIO ====================

    @Nested
    @DisplayName("POST /inventory - Crear Inventario")
    class CreateInventoryTests {

        @Test
        @Order(1)
        @DisplayName("Debe crear inventario exitosamente cuando producto existe")
        void shouldCreateInventory_WhenProductExists() throws Exception {
            InventoryRequest request = buildInventoryRequest(DEFAULT_PRODUCT_ID, 100, 10);

            mockMvc.perform(post("/inventory")
                            .header(API_KEY_HEADER, API_KEY)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.type").value("inventory"))
                    .andExpect(jsonPath("$.data.id").exists())
                    .andExpect(jsonPath("$.data.attributes.productId").value(DEFAULT_PRODUCT_ID))
                    .andExpect(jsonPath("$.data.attributes.quantity").value(100))
                    .andExpect(jsonPath("$.data.attributes.minStock").value(10));

            // Verificar que se guardó en BD
            assertThat(inventoryRepository.findByProductId(DEFAULT_PRODUCT_ID)).isPresent();
        }

        @Test
        @Order(2)
        @DisplayName("Debe retornar 400 cuando datos son inválidos")
        void shouldReturn400_WhenInvalidData() throws Exception {
            InventoryRequest request = InventoryRequest.builder()
                    .productId(null)  // Requerido
                    .quantity(-10)    // No puede ser negativo
                    .build();

            mockMvc.perform(post("/inventory")
                            .header(API_KEY_HEADER, API_KEY)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors").isArray())
                    .andExpect(jsonPath("$.errors[0].code").value("VALIDATION_ERROR"));
        }

        @Test
        @Order(3)
        @DisplayName("Debe retornar 503 cuando producto no existe")
        void shouldReturn503_WhenProductNotExists() throws Exception {
            // Simular que el producto no existe
            setupProductNotExistsMock();

            InventoryRequest request = buildInventoryRequest(999L, 100, 10);

            mockMvc.perform(post("/inventory")
                            .header(API_KEY_HEADER, API_KEY)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isServiceUnavailable())
                    .andExpect(jsonPath("$.errors[0].code").value("PRODUCT_SERVICE_ERROR"));
        }
    }

    // ==================== TESTS: CONSULTAR INVENTARIO ====================

    @Nested
    @DisplayName("GET /inventory/product/{id} - Consultar Inventario")
    class GetInventoryTests {

        @Test
        @Order(4)
        @DisplayName("Debe obtener inventario con información del producto")
        void shouldReturnInventory_WithProductInfo() throws Exception {
            createTestInventory(DEFAULT_PRODUCT_ID, DEFAULT_QUANTITY, DEFAULT_MIN_STOCK);

            mockMvc.perform(get("/inventory/product/{id}", DEFAULT_PRODUCT_ID)
                            .header(API_KEY_HEADER, API_KEY))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.type").value("inventory"))
                    .andExpect(jsonPath("$.data.attributes.productId").value(DEFAULT_PRODUCT_ID))
                    .andExpect(jsonPath("$.data.attributes.quantity").value(DEFAULT_QUANTITY))
                    .andExpect(jsonPath("$.data.attributes.availableQuantity").value(DEFAULT_QUANTITY))
                    .andExpect(jsonPath("$.data.attributes.product.name").value("Test Product"))
                    .andExpect(jsonPath("$.data.attributes.product.sku").value("TEST-001"));
        }

        @Test
        @Order(5)
        @DisplayName("Debe retornar 404 cuando inventario no existe")
        void shouldReturn404_WhenInventoryNotFound() throws Exception {
            mockMvc.perform(get("/inventory/product/{id}", 999L)
                            .header(API_KEY_HEADER, API_KEY))
                    .andDo(print())
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errors[0].code").value("INVENTORY_NOT_FOUND"))
                    .andExpect(jsonPath("$.errors[0].status").value("404"));
        }
    }

    // ==================== TESTS: PROCESAR COMPRA ====================

    @Nested
    @DisplayName("POST /inventory/product/{id}/purchase - Procesar Compra")
    class PurchaseTests {

        @Test
        @Order(6)
        @DisplayName("Debe decrementar stock correctamente")
        void shouldDecrementStock_WhenPurchaseSuccessful() throws Exception {
            createTestInventory(DEFAULT_PRODUCT_ID, 50, DEFAULT_MIN_STOCK);
            PurchaseRequest request = new PurchaseRequest(10);

            mockMvc.perform(post("/inventory/product/{id}/purchase", DEFAULT_PRODUCT_ID)
                            .header(API_KEY_HEADER, API_KEY)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.attributes.quantity").value(40)); // 50 - 10

            // Verificar en BD
            Inventory updated = inventoryRepository.findByProductId(DEFAULT_PRODUCT_ID).orElseThrow();
            assertThat(updated.getQuantity()).isEqualTo(40);
        }

        @Test
        @Order(7)
        @DisplayName("Debe retornar 400 cuando stock es insuficiente")
        void shouldReturn400_WhenInsufficientStock() throws Exception {
            createTestInventory(DEFAULT_PRODUCT_ID, 5, DEFAULT_MIN_STOCK);
            PurchaseRequest request = new PurchaseRequest(100); // Más de lo disponible

            mockMvc.perform(post("/inventory/product/{id}/purchase", DEFAULT_PRODUCT_ID)
                            .header(API_KEY_HEADER, API_KEY)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].code").value("INSUFFICIENT_STOCK"));

            // Verificar que stock no cambió
            Inventory unchanged = inventoryRepository.findByProductId(DEFAULT_PRODUCT_ID).orElseThrow();
            assertThat(unchanged.getQuantity()).isEqualTo(5);
        }

        @Test
        @Order(8)
        @DisplayName("Debe retornar 404 cuando producto no tiene inventario")
        void shouldReturn404_WhenNoInventoryForProduct() throws Exception {
            PurchaseRequest request = new PurchaseRequest(10);

            mockMvc.perform(post("/inventory/product/{id}/purchase", 999L)
                            .header(API_KEY_HEADER, API_KEY)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andDo(print())
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.errors[0].code").value("INVENTORY_NOT_FOUND"));
        }
    }

    // ==================== TESTS: ACTUALIZAR CANTIDAD ====================

    @Nested
    @DisplayName("PATCH /inventory/product/{id}/quantity - Actualizar Cantidad")
    class UpdateQuantityTests {

        @Test
        @Order(9)
        @DisplayName("Debe actualizar cantidad correctamente")
        void shouldUpdateQuantity() throws Exception {
            createTestInventory(DEFAULT_PRODUCT_ID, 50, DEFAULT_MIN_STOCK);

            mockMvc.perform(patch("/inventory/product/{id}/quantity", DEFAULT_PRODUCT_ID)
                            .header(API_KEY_HEADER, API_KEY)
                            .param("quantity", "100"))
                    .andDo(print())
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.attributes.quantity").value(100));
        }
    }

    // ==================== TESTS: VERIFICAR STOCK ====================

    @Nested
    @DisplayName("GET /inventory/product/{id}/check-stock - Verificar Stock")
    class CheckStockTests {

        @Test
        @Order(10)
        @DisplayName("Debe retornar true cuando hay stock suficiente")
        void shouldReturnTrue_WhenStockAvailable() throws Exception {
            createTestInventory(DEFAULT_PRODUCT_ID, 50, DEFAULT_MIN_STOCK);

            mockMvc.perform(get("/inventory/product/{id}/check-stock", DEFAULT_PRODUCT_ID)
                            .header(API_KEY_HEADER, API_KEY)
                            .param("quantity", "30"))
                    .andExpect(status().isOk())
                    .andExpect(content().string("true"));
        }

        @Test
        @Order(11)
        @DisplayName("Debe retornar false cuando stock es insuficiente")
        void shouldReturnFalse_WhenStockInsufficient() throws Exception {
            createTestInventory(DEFAULT_PRODUCT_ID, 10, DEFAULT_MIN_STOCK);

            mockMvc.perform(get("/inventory/product/{id}/check-stock", DEFAULT_PRODUCT_ID)
                            .header(API_KEY_HEADER, API_KEY)
                            .param("quantity", "100"))
                    .andExpect(status().isOk())
                    .andExpect(content().string("false"));
        }
    }

    // ==================== TESTS: ELIMINAR INVENTARIO ====================

    @Nested
    @DisplayName("DELETE /inventory/product/{id} - Eliminar Inventario")
    class DeleteInventoryTests {

        @Test
        @Order(12)
        @DisplayName("Debe eliminar inventario correctamente")
        void shouldDeleteInventory() throws Exception {
            createTestInventory(DEFAULT_PRODUCT_ID, DEFAULT_QUANTITY, DEFAULT_MIN_STOCK);

            mockMvc.perform(delete("/inventory/product/{id}", DEFAULT_PRODUCT_ID)
                            .header(API_KEY_HEADER, API_KEY))
                    .andDo(print())
                    .andExpect(status().isNoContent());

            // Verificar eliminación
            assertThat(inventoryRepository.findByProductId(DEFAULT_PRODUCT_ID)).isEmpty();
        }

        @Test
        @Order(13)
        @DisplayName("Debe retornar 404 al eliminar inventario inexistente")
        void shouldReturn404_WhenDeletingNonExistent() throws Exception {
            mockMvc.perform(delete("/inventory/product/{id}", 999L)
                            .header(API_KEY_HEADER, API_KEY))
                    .andDo(print())
                    .andExpect(status().isNotFound());
        }
    }

    // ==================== TESTS: SEGURIDAD ====================

    @Nested
    @DisplayName("Seguridad - API Key")
    class SecurityTests {

        @Test
        @Order(14)
        @DisplayName("Debe retornar 401 cuando falta API Key")
        void shouldReturn401_WhenNoApiKey() throws Exception {
            mockMvc.perform(get("/inventory/product/{id}", DEFAULT_PRODUCT_ID))
                    .andDo(print())
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.errors[0].code").value("UNAUTHORIZED"));
        }

        @Test
        @Order(15)
        @DisplayName("Debe retornar 401 cuando API Key es inválida")
        void shouldReturn401_WhenInvalidApiKey() throws Exception {
            mockMvc.perform(get("/inventory/product/{id}", DEFAULT_PRODUCT_ID)
                            .header(API_KEY_HEADER, "invalid-key"))
                    .andDo(print())
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.errors[0].code").value("UNAUTHORIZED"));
        }
    }

    // ==================== HELPER METHODS ====================

    /**
     * Configura los mocks por defecto para el servicio de productos.
     */
    private void setupDefaultProductMocks() {
        // Mock: producto existe
        WireMock.stubFor(
                WireMock.get(WireMock.urlPathMatching(PRODUCT_EXISTS_URL_PATTERN))
                        .willReturn(WireMock.aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBody("true"))
        );

        // Mock: obtener detalles del producto
        WireMock.stubFor(
                WireMock.get(WireMock.urlPathMatching(PRODUCT_DETAILS_URL_PATTERN))
                        .willReturn(WireMock.aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBody(MOCK_PRODUCT_RESPONSE))
        );
    }

    /**
     * Configura mock para simular que el producto no existe.
     */
    private void setupProductNotExistsMock() {
        wireMockServer.resetAll();
        WireMock.stubFor(
                WireMock.get(WireMock.urlPathMatching(PRODUCT_EXISTS_URL_PATTERN))
                        .willReturn(WireMock.aResponse()
                                .withStatus(200)
                                .withHeader("Content-Type", "application/json")
                                .withBody("false"))
        );
    }

    /**
     * Crea un registro de inventario para tests.
     */
    private Inventory createTestInventory(Long productId, int quantity, int minStock) {
        Inventory inventory = Inventory.builder()
                .productId(productId)
                .quantity(quantity)
                .reservedQuantity(0)
                .minStock(minStock)
                .build();
        return inventoryRepository.save(inventory);
    }

    /**
     * Builder para crear InventoryRequest.
     */
    private InventoryRequest buildInventoryRequest(Long productId, int quantity, int minStock) {
        return InventoryRequest.builder()
                .productId(productId)
                .quantity(quantity)
                .minStock(minStock)
                .build();
    }
}