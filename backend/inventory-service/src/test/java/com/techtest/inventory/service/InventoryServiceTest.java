package com.techtest.inventory.service;

import com.techtest.inventory.client.ProductServiceClient;
import com.techtest.inventory.dto.request.InventoryRequest;
import com.techtest.inventory.dto.request.PurchaseRequest;
import com.techtest.inventory.dto.response.InventoryResponse;
import com.techtest.inventory.dto.response.InventoryResponse.ProductInfo;
import com.techtest.inventory.entity.Inventory;
import com.techtest.inventory.exception.InsufficientStockException;
import com.techtest.inventory.exception.InventoryNotFoundException;
import com.techtest.inventory.exception.ProductServiceException;
import com.techtest.inventory.repository.InventoryRepository;
import com.techtest.inventory.service.impl.InventoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("InventoryService Tests")
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private ProductServiceClient productServiceClient;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private Inventory testInventory;
    private InventoryRequest testRequest;
    private ProductInfo testProductInfo;

    @BeforeEach
    void setUp() {
        testInventory = Inventory.builder()
                .id(1L)
                .productId(100L)
                .quantity(50)
                .reservedQuantity(0)
                .minStock(5)
                .build();

        testRequest = InventoryRequest.builder()
                .productId(100L)
                .quantity(50)
                .minStock(5)
                .build();

        testProductInfo = ProductInfo.builder()
                .id(100L)
                .name("Test Product")
                .sku("TEST-001")
                .category("Electronics")
                .build();
    }

    @Nested
    @DisplayName("Crear/Actualizar Inventario")
    class CreateOrUpdateInventoryTests {

        @Test
        @DisplayName("Debe crear inventario cuando producto existe")
        void shouldCreateInventoryWhenProductExists() {
            when(productServiceClient.productExists(100L)).thenReturn(true);
            when(inventoryRepository.findByProductId(100L)).thenReturn(Optional.empty());
            when(inventoryRepository.save(any(Inventory.class))).thenReturn(testInventory);
            when(productServiceClient.getProductInfo(100L)).thenReturn(testProductInfo);

            InventoryResponse response = inventoryService.createOrUpdateInventory(testRequest);

            assertThat(response).isNotNull();
            assertThat(response.getProductId()).isEqualTo(100L);
            assertThat(response.getQuantity()).isEqualTo(50);

            verify(productServiceClient).productExists(100L);
            verify(inventoryRepository).save(any(Inventory.class));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando producto no existe")
        void shouldThrowExceptionWhenProductNotExists() {
            when(productServiceClient.productExists(100L)).thenReturn(false);

            assertThatThrownBy(() -> inventoryService.createOrUpdateInventory(testRequest))
                    .isInstanceOf(ProductServiceException.class)
                    .hasMessageContaining("no existe");

            verify(inventoryRepository, never()).save(any(Inventory.class));
        }
    }

    @Nested
    @DisplayName("Consultar Inventario")
    class GetInventoryTests {

        @Test
        @DisplayName("Debe obtener inventario por producto ID")
        void shouldGetInventoryByProductId() {
            when(inventoryRepository.findByProductId(100L)).thenReturn(Optional.of(testInventory));
            when(productServiceClient.getProductInfo(100L)).thenReturn(testProductInfo);

            InventoryResponse response = inventoryService.getInventoryByProductId(100L);

            assertThat(response).isNotNull();
            assertThat(response.getProductId()).isEqualTo(100L);
            assertThat(response.getProduct()).isNotNull();
            assertThat(response.getProduct().getName()).isEqualTo("Test Product");
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando inventario no existe")
        void shouldThrowExceptionWhenInventoryNotFound() {
            when(inventoryRepository.findByProductId(anyLong())).thenReturn(Optional.empty());

            assertThatThrownBy(() -> inventoryService.getInventoryByProductId(999L))
                    .isInstanceOf(InventoryNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Procesar Compra")
    class ProcessPurchaseTests {

        @Test
        @DisplayName("Debe procesar compra cuando hay stock suficiente")
        void shouldProcessPurchaseWithSufficientStock() {
            PurchaseRequest purchaseRequest = new PurchaseRequest(10);

            when(inventoryRepository.findByProductId(100L)).thenReturn(Optional.of(testInventory));
            when(inventoryRepository.save(any(Inventory.class))).thenAnswer(inv -> {
                Inventory saved = inv.getArgument(0);
                return saved;
            });
            when(productServiceClient.getProductInfo(100L)).thenReturn(testProductInfo);

            InventoryResponse response = inventoryService.processPurchase(100L, purchaseRequest);

            assertThat(response).isNotNull();
            assertThat(response.getQuantity()).isEqualTo(40); // 50 - 10

            verify(inventoryRepository).save(any(Inventory.class));
        }

        @Test
        @DisplayName("Debe lanzar excepción cuando stock insuficiente")
        void shouldThrowExceptionWhenInsufficientStock() {
            PurchaseRequest purchaseRequest = new PurchaseRequest(100); // Más de lo disponible

            when(inventoryRepository.findByProductId(100L)).thenReturn(Optional.of(testInventory));

            assertThatThrownBy(() -> inventoryService.processPurchase(100L, purchaseRequest))
                    .isInstanceOf(InsufficientStockException.class)
                    .hasMessageContaining("Stock insuficiente");

            verify(inventoryRepository, never()).save(any(Inventory.class));
        }
    }

    @Nested
    @DisplayName("Verificar Stock")
    class HasStockTests {

        @Test
        @DisplayName("Debe retornar true cuando hay stock suficiente")
        void shouldReturnTrueWhenStockAvailable() {
            when(inventoryRepository.findByProductId(100L)).thenReturn(Optional.of(testInventory));

            boolean hasStock = inventoryService.hasStock(100L, 30);

            assertThat(hasStock).isTrue();
        }

        @Test
        @DisplayName("Debe retornar false cuando no hay stock suficiente")
        void shouldReturnFalseWhenInsufficientStock() {
            when(inventoryRepository.findByProductId(100L)).thenReturn(Optional.of(testInventory));

            boolean hasStock = inventoryService.hasStock(100L, 100);

            assertThat(hasStock).isFalse();
        }

        @Test
        @DisplayName("Debe retornar false cuando inventario no existe")
        void shouldReturnFalseWhenInventoryNotExists() {
            when(inventoryRepository.findByProductId(anyLong())).thenReturn(Optional.empty());

            boolean hasStock = inventoryService.hasStock(999L, 10);

            assertThat(hasStock).isFalse();
        }
    }
}