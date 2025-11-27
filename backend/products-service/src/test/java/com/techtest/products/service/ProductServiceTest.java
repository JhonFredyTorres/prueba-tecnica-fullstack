package com.techtest.products.service;

import com.techtest.products.dto.request.ProductRequest;
import com.techtest.products.dto.response.ProductResponse;
import com.techtest.products.entity.Product;
import com.techtest.products.exception.DuplicateSkuException;
import com.techtest.products.exception.ProductNotFoundException;
import com.techtest.products.repository.ProductRepository;
import com.techtest.products.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Pruebas unitarias del ProductService.
 *
 * Usamos Mockito para simular el repositorio y probar
 * la lógica de negocio de forma aislada.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService Tests")
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product testProduct;
    private ProductRequest testRequest;

    @BeforeEach
    void setUp() {
        // Producto de prueba
        testProduct = Product.builder()
                .id(1L)
                .name("Laptop Gaming")
                .description("Laptop para gaming de alta gama")
                .price(new BigDecimal("1299.99"))
                .category("Electronics")
                .sku("LAP-GAM-001")
                .active(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Request de prueba
        testRequest = ProductRequest.builder()
                .name("Laptop Gaming")
                .description("Laptop para gaming de alta gama")
                .price(new BigDecimal("1299.99"))
                .category("Electronics")
                .sku("LAP-GAM-001")
                .active(true)
                .build();
    }

    // ==================== TESTS DE CREAR PRODUCTO ====================

    @Nested
    @DisplayName("Crear Producto")
    class CreateProductTests {

        @Test
        @DisplayName("Debe crear un producto correctamente")
        void shouldCreateProductSuccessfully() {
            // Given (Preparación)
            when(productRepository.existsBySku(anyString())).thenReturn(false);
            when(productRepository.save(any(Product.class))).thenReturn(testProduct);

            // When (Ejecución)
            ProductResponse response = productService.createProduct(testRequest);

            // Then (Verificación)
            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo(testRequest.getName());
            assertThat(response.getSku()).isEqualTo(testRequest.getSku());
            assertThat(response.getPrice()).isEqualByComparingTo(testRequest.getPrice());

            verify(productRepository).existsBySku(testRequest.getSku());
            verify(productRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("Debe lanzar excepción si SKU ya existe")
        void shouldThrowExceptionWhenSkuExists() {
            // Given
            when(productRepository.existsBySku(anyString())).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> productService.createProduct(testRequest))
                    .isInstanceOf(DuplicateSkuException.class)
                    .hasMessageContaining(testRequest.getSku());

            verify(productRepository).existsBySku(testRequest.getSku());
            verify(productRepository, never()).save(any(Product.class));
        }
    }

    // ==================== TESTS DE OBTENER PRODUCTO ====================

    @Nested
    @DisplayName("Obtener Producto")
    class GetProductTests {

        @Test
        @DisplayName("Debe obtener producto por ID correctamente")
        void shouldGetProductByIdSuccessfully() {
            // Given
            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

            // When
            ProductResponse response = productService.getProductById(1L);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getName()).isEqualTo(testProduct.getName());

            verify(productRepository).findById(1L);
        }

        @Test
        @DisplayName("Debe lanzar excepción si producto no existe")
        void shouldThrowExceptionWhenProductNotFound() {
            // Given
            when(productRepository.findById(anyLong())).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> productService.getProductById(999L))
                    .isInstanceOf(ProductNotFoundException.class)
                    .hasMessageContaining("999");

            verify(productRepository).findById(999L);
        }

        @Test
        @DisplayName("Debe obtener producto por SKU correctamente")
        void shouldGetProductBySkuSuccessfully() {
            // Given
            when(productRepository.findBySku("LAP-GAM-001"))
                    .thenReturn(Optional.of(testProduct));

            // When
            ProductResponse response = productService.getProductBySku("LAP-GAM-001");

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getSku()).isEqualTo("LAP-GAM-001");
        }
    }

    // ==================== TESTS DE LISTAR PRODUCTOS ====================

    @Nested
    @DisplayName("Listar Productos")
    class ListProductsTests {

        @Test
        @DisplayName("Debe listar productos con paginación")
        void shouldListProductsWithPagination() {
            // Given
            Product product2 = Product.builder()
                    .id(2L)
                    .name("Mouse Gaming")
                    .sku("MOU-GAM-001")
                    .price(new BigDecimal("49.99"))
                    .category("Electronics")
                    .active(true)
                    .build();

            List<Product> products = Arrays.asList(testProduct, product2);
            Page<Product> productPage = new PageImpl<>(products, PageRequest.of(0, 10), 2);

            when(productRepository.findAll(any(Pageable.class))).thenReturn(productPage);

            // When
            Page<ProductResponse> response = productService.getAllProducts(PageRequest.of(0, 10));

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(2);
            assertThat(response.getTotalElements()).isEqualTo(2);

            verify(productRepository).findAll(any(Pageable.class));
        }

        @Test
        @DisplayName("Debe retornar página vacía si no hay productos")
        void shouldReturnEmptyPageWhenNoProducts() {
            // Given
            Page<Product> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
            when(productRepository.findAll(any(Pageable.class))).thenReturn(emptyPage);

            // When
            Page<ProductResponse> response = productService.getAllProducts(PageRequest.of(0, 10));

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getContent()).isEmpty();
            assertThat(response.getTotalElements()).isZero();
        }
    }

    // ==================== TESTS DE ACTUALIZAR PRODUCTO ====================

    @Nested
    @DisplayName("Actualizar Producto")
    class UpdateProductTests {

        @Test
        @DisplayName("Debe actualizar producto correctamente")
        void shouldUpdateProductSuccessfully() {
            // Given
            ProductRequest updateRequest = ProductRequest.builder()
                    .name("Laptop Gaming PRO")
                    .description("Versión mejorada")
                    .price(new BigDecimal("1499.99"))
                    .category("Electronics")
                    .sku("LAP-GAM-001")  // Mismo SKU
                    .active(true)
                    .build();

            Product updatedProduct = Product.builder()
                    .id(1L)
                    .name("Laptop Gaming PRO")
                    .description("Versión mejorada")
                    .price(new BigDecimal("1499.99"))
                    .category("Electronics")
                    .sku("LAP-GAM-001")
                    .active(true)
                    .build();

            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
            when(productRepository.save(any(Product.class))).thenReturn(updatedProduct);

            // When
            ProductResponse response = productService.updateProduct(1L, updateRequest);

            // Then
            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Laptop Gaming PRO");
            assertThat(response.getPrice()).isEqualByComparingTo(new BigDecimal("1499.99"));

            verify(productRepository).findById(1L);
            verify(productRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("Debe lanzar excepción si nuevo SKU ya existe")
        void shouldThrowExceptionWhenNewSkuExists() {
            // Given
            ProductRequest updateRequest = ProductRequest.builder()
                    .name("Laptop Gaming PRO")
                    .price(new BigDecimal("1499.99"))
                    .category("Electronics")
                    .sku("EXISTING-SKU")  // SKU diferente que ya existe
                    .build();

            when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
            when(productRepository.existsBySku("EXISTING-SKU")).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> productService.updateProduct(1L, updateRequest))
                    .isInstanceOf(DuplicateSkuException.class);

            verify(productRepository, never()).save(any(Product.class));
        }
    }

    // ==================== TESTS DE ELIMINAR PRODUCTO ====================

    @Nested
    @DisplayName("Eliminar Producto")
    class DeleteProductTests {

        @Test
        @DisplayName("Debe eliminar producto correctamente")
        void shouldDeleteProductSuccessfully() {
            // Given
            when(productRepository.existsById(1L)).thenReturn(true);
            doNothing().when(productRepository).deleteById(1L);

            // When
            productService.deleteProduct(1L);

            // Then
            verify(productRepository).existsById(1L);
            verify(productRepository).deleteById(1L);
        }

        @Test
        @DisplayName("Debe lanzar excepción si producto a eliminar no existe")
        void shouldThrowExceptionWhenDeletingNonExistentProduct() {
            // Given
            when(productRepository.existsById(anyLong())).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> productService.deleteProduct(999L))
                    .isInstanceOf(ProductNotFoundException.class);

            verify(productRepository, never()).deleteById(anyLong());
        }
    }
}