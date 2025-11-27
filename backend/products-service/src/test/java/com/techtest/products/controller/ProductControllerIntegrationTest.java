package com.techtest.products.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techtest.products.dto.request.ProductRequest;
import com.techtest.products.repository.ProductRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Product Controller Integration Tests")
class ProductControllerIntegrationTest {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String API_KEY_VALUE  = "test-api-key";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductRepository productRepository;

    private ProductRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = ProductRequest.builder()
                .name("Test Product")
                .description("Test Description")
                .price(new BigDecimal("99.99"))
                .category("Test Category")
                .sku("TEST-SKU-" + System.currentTimeMillis())
                .active(true)
                .build();
    }

    @AfterEach
    void tearDown() {
        productRepository.deleteAll();
    }

    // ========== CREAR PRODUCTO ==========

    @Test
    @Order(1)
    @DisplayName("POST /products - Debe crear producto y retornar 201")
    void createProduct_ShouldReturn201() throws Exception {
        mockMvc.perform(post("/products")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.type").value("products"))
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.attributes.name").value(validRequest.getName()))
                .andExpect(jsonPath("$.data.attributes.sku").value(validRequest.getSku()));
    }

    @Test
    @Order(2)
    @DisplayName("POST /products - Debe retornar 400 si datos inválidos")
    void createProduct_ShouldReturn400_WhenInvalidData() throws Exception {
        ProductRequest invalidRequest = ProductRequest.builder()
                .name("")
                .price(new BigDecimal("-10"))
                .build();

        mockMvc.perform(post("/products")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors").isArray())
                .andExpect(jsonPath("$.errors[*].code").value(everyItem(is("VALIDATION_ERROR"))));
    }

    @Test
    @Order(3)
    @DisplayName("POST /products - Debe retornar 409 si SKU duplicado")
    void createProduct_ShouldReturn409_WhenDuplicateSku() throws Exception {
        mockMvc.perform(post("/products")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/products")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andDo(print())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errors[0].code").value("DUPLICATE_SKU"));
    }

    // ========== OBTENER PRODUCTO ==========

    @Test
    @Order(4)
    @DisplayName("GET /products/{id} - Debe obtener producto existente")
    void getProductById_ShouldReturnProduct() throws Exception {
        MvcResult result = mockMvc.perform(post("/products")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        String productId = objectMapper.readTree(response).path("data").path("id").asText();

        mockMvc.perform(get("/products/{id}", productId)
                        .header(API_KEY_HEADER, API_KEY_VALUE))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.type").value("products"))
                .andExpect(jsonPath("$.data.id").value(productId))
                .andExpect(jsonPath("$.data.attributes.name").value(validRequest.getName()));
    }

    @Test
    @Order(5)
    @DisplayName("GET /products/{id} - Debe retornar 404 si no existe")
    void getProductById_ShouldReturn404_WhenNotFound() throws Exception {
        mockMvc.perform(get("/products/{id}", 99999L)
                        .header(API_KEY_HEADER, API_KEY_VALUE))
                .andDo(print())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errors[0].code").value("PRODUCT_NOT_FOUND"));
    }

    // ========== LISTAR PRODUCTOS ==========

    @Test
    @Order(6)
    @DisplayName("GET /products - Debe listar productos con paginación")
    void getAllProducts_ShouldReturnPaginatedList() throws Exception {
        for (int i = 0; i < 5; i++) {
            ProductRequest request = ProductRequest.builder()
                    .name("Product " + i)
                    .description("Description " + i)
                    .price(new BigDecimal("10.00").add(new BigDecimal(i)))
                    .category("Category")
                    .sku("SKU-" + i + "-" + System.currentTimeMillis())
                    .active(true)
                    .build();

            mockMvc.perform(post("/products")
                            .header(API_KEY_HEADER, API_KEY_VALUE)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated());
        }

        mockMvc.perform(get("/products")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .param("page", "0")
                        .param("size", "3"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data", hasSize(3)))
                .andExpect(jsonPath("$.meta.totalElements").value(5))
                .andExpect(jsonPath("$.meta.totalPages").value(2))
                .andExpect(jsonPath("$.meta.currentPage").value(0))
                .andExpect(jsonPath("$.links.self").exists())
                .andExpect(jsonPath("$.links.next").exists());
    }

    @Test
    @Order(7)
    @DisplayName("GET /products - Debe filtrar por categoría")
    void getAllProducts_ShouldFilterByCategory() throws Exception {
        ProductRequest electronics = ProductRequest.builder()
                .name("Phone").price(new BigDecimal("500"))
                .category("Electronics").sku("ELEC-001-" + System.currentTimeMillis())
                .build();

        ProductRequest clothing = ProductRequest.builder()
                .name("Shirt").price(new BigDecimal("30"))
                .category("Clothing").sku("CLOTH-001-" + System.currentTimeMillis())
                .build();

        mockMvc.perform(post("/products")
                .header(API_KEY_HEADER, API_KEY_VALUE)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(electronics)));

        mockMvc.perform(post("/products")
                .header(API_KEY_HEADER, API_KEY_VALUE)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(clothing)));

        mockMvc.perform(get("/products")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .param("category", "Electronics"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].attributes.category").value("Electronics"));
    }

    // ========== ACTUALIZAR PRODUCTO ==========

    @Test
    @Order(8)
    @DisplayName("PUT /products/{id} - Debe actualizar producto")
    void updateProduct_ShouldUpdateAndReturn200() throws Exception {
        MvcResult result = mockMvc.perform(post("/products")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String productId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText();

        ProductRequest updateRequest = ProductRequest.builder()
                .name("Updated Product")
                .description("Updated Description")
                .price(new BigDecimal("199.99"))
                .category("Updated Category")
                .sku(validRequest.getSku())
                .active(true)
                .build();

        mockMvc.perform(put("/products/{id}", productId)
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.attributes.name").value("Updated Product"))
                .andExpect(jsonPath("$.data.attributes.price").value(199.99));
    }

    // ========== ELIMINAR PRODUCTO ==========

    @Test
    @Order(9)
    @DisplayName("DELETE /products/{id} - Debe eliminar producto")
    void deleteProduct_ShouldReturn204() throws Exception {
        MvcResult result = mockMvc.perform(post("/products")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String productId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText();

        mockMvc.perform(delete("/products/{id}", productId)
                        .header(API_KEY_HEADER, API_KEY_VALUE))
                .andDo(print())
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/products/{id}", productId)
                        .header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(10)
    @DisplayName("DELETE /products/{id} - Debe retornar 404 si no existe")
    void deleteProduct_ShouldReturn404_WhenNotFound() throws Exception {
        mockMvc.perform(delete("/products/{id}", 99999L)
                        .header(API_KEY_HEADER, API_KEY_VALUE))
                .andDo(print())
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errors[0].code").value("PRODUCT_NOT_FOUND"));
    }

    // ========== EXISTS ==========

    @Test
    @Order(11)
    @DisplayName("GET /products/{id}/exists - Debe retornar true si existe")
    void existsProduct_ShouldReturnTrue() throws Exception {
        MvcResult result = mockMvc.perform(post("/products")
                        .header(API_KEY_HEADER, API_KEY_VALUE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String productId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asText();

        mockMvc.perform(get("/products/{id}/exists", productId)
                        .header(API_KEY_HEADER, API_KEY_VALUE))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(content().string("true"));
    }

    @Test
    @Order(12)
    @DisplayName("GET /products/{id}/exists - Debe retornar false si no existe")
    void existsProduct_ShouldReturnFalse() throws Exception {
        mockMvc.perform(get("/products/{id}/exists", 99999L)
                        .header(API_KEY_HEADER, API_KEY_VALUE))
                .andExpect(status().isOk())
                .andExpect(content().string("false"));
    }
}
