package com.techtest.inventory.service.impl;

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
import com.techtest.inventory.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementación del servicio de inventario.
 *
 * Características:
 * - Valida existencia de productos llamando al otro microservicio
 * - Emite eventos (logs) cuando cambia el inventario
 * - Maneja transacciones de base de datos
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductServiceClient productServiceClient;

    @Override
    @Transactional
    public InventoryResponse createOrUpdateInventory(InventoryRequest request) {
        log.info("Creando/actualizando inventario para producto: {}", request.getProductId());

        // Validar que el producto existe en el servicio de productos
        validateProductExists(request.getProductId());

        // Buscar inventario existente o crear nuevo
        Inventory inventory = inventoryRepository.findByProductId(request.getProductId())
                .orElse(Inventory.builder()
                        .productId(request.getProductId())
                        .build());

        Integer previousQuantity = inventory.getQuantity();

        // Actualizar valores
        inventory.setQuantity(request.getQuantity());
        if (request.getMinStock() != null) {
            inventory.setMinStock(request.getMinStock());
        }

        Inventory saved = inventoryRepository.save(inventory);

        // Emitir evento de cambio de inventario
        emitInventoryChangedEvent(saved.getProductId(), previousQuantity, saved.getQuantity(), "STOCK_UPDATE");

        return mapToResponse(saved, getProductInfoSafely(saved.getProductId()));
    }

    @Override
    public InventoryResponse getInventoryByProductId(Long productId) {
        log.debug("Consultando inventario para producto: {}", productId);

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(productId));

        // Obtener información del producto del otro servicio
        ProductInfo productInfo = getProductInfoSafely(productId);

        return mapToResponse(inventory, productInfo);
    }

    @Override
    @Transactional
    public InventoryResponse updateQuantity(Long productId, Integer quantity) {
        log.info("Actualizando cantidad de producto {} a {}", productId, quantity);

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(productId));

        Integer previousQuantity = inventory.getQuantity();
        inventory.setQuantity(quantity);

        Inventory saved = inventoryRepository.save(inventory);

        // Emitir evento
        emitInventoryChangedEvent(productId, previousQuantity, quantity, "QUANTITY_ADJUSTMENT");

        return mapToResponse(saved, getProductInfoSafely(productId));
    }

    @Override
    @Transactional
    public InventoryResponse processPurchase(Long productId, PurchaseRequest request) {
        log.info("Procesando compra - Producto: {}, Cantidad: {}", productId, request.getQuantity());

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(productId));

        // Verificar stock disponible
        if (!inventory.hasStock(request.getQuantity())) {
            throw new InsufficientStockException(
                    productId,
                    request.getQuantity(),
                    inventory.getAvailableQuantity()
            );
        }

        Integer previousQuantity = inventory.getQuantity();
        Integer newQuantity = previousQuantity - request.getQuantity();
        inventory.setQuantity(newQuantity);

        Inventory saved = inventoryRepository.save(inventory);

        // Emitir evento de compra
        emitInventoryChangedEvent(productId, previousQuantity, newQuantity, "PURCHASE");

        // Alerta si stock bajo
        if (saved.isLowStock()) {
            emitLowStockAlert(productId, newQuantity, saved.getMinStock());
        }

        return mapToResponse(saved, getProductInfoSafely(productId));
    }

    @Override
    public List<InventoryResponse> getLowStockItems() {
        log.debug("Consultando productos con stock bajo");

        return inventoryRepository.findLowStockItems().stream()
                .map(inv -> mapToResponse(inv, getProductInfoSafely(inv.getProductId())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteInventory(Long productId) {
        log.info("Eliminando inventario de producto: {}", productId);

        Inventory inventory = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new InventoryNotFoundException(productId));

        inventoryRepository.delete(inventory);

        // Emitir evento
        emitInventoryChangedEvent(productId, inventory.getQuantity(), 0, "DELETED");
    }

    @Override
    public boolean hasStock(Long productId, Integer quantity) {
        return inventoryRepository.findByProductId(productId)
                .map(inv -> inv.hasStock(quantity))
                .orElse(false);
    }

    // ==================== MÉTODOS PRIVADOS ====================

    /**
     * Valida que el producto exista en el servicio de productos.
     */
    private void validateProductExists(Long productId) {
        log.debug("Validando existencia de producto: {}", productId);

        boolean exists = productServiceClient.productExists(productId);

        if (!exists) {
            throw new ProductServiceException(productId, "El producto no existe");
        }
    }

    /**
     * Obtiene información del producto de forma segura (no falla si el servicio no está disponible).
     */
    private ProductInfo getProductInfoSafely(Long productId) {
        try {
            return productServiceClient.getProductInfo(productId);
        } catch (ProductServiceException e) {
            log.warn("No se pudo obtener info del producto {}: {}", productId, e.getMessage());
            // Retornar info básica si el servicio no está disponible
            return ProductInfo.builder()
                    .id(productId)
                    .build();
        }
    }

    /**
     * Convierte entidad a DTO de respuesta.
     */
    private InventoryResponse mapToResponse(Inventory inventory, ProductInfo productInfo) {
        return InventoryResponse.builder()
                .id(inventory.getId())
                .productId(inventory.getProductId())
                .quantity(inventory.getQuantity())
                .reservedQuantity(inventory.getReservedQuantity())
                .availableQuantity(inventory.getAvailableQuantity())
                .minStock(inventory.getMinStock())
                .lowStock(inventory.isLowStock())
                .createdAt(inventory.getCreatedAt())
                .updatedAt(inventory.getUpdatedAt())
                .product(productInfo)
                .build();
    }

    // ==================== EVENTOS (LOGS EN CONSOLA) ====================

    /**
     * Emite un evento cuando cambia el inventario.
     * En un sistema real, esto enviaría un mensaje a un broker (Kafka, RabbitMQ).
     * Para esta prueba, lo implementamos como logs estructurados.
     */
    private void emitInventoryChangedEvent(Long productId, Integer previousQty, Integer newQty, String reason) {
        log.info("========== EVENTO DE INVENTARIO ==========");
        log.info("| Tipo:              INVENTORY_CHANGED");
        log.info("| Timestamp:         {}", LocalDateTime.now());
        log.info("| Product ID:        {}", productId);
        log.info("| Cantidad Anterior: {}", previousQty);
        log.info("| Cantidad Nueva:    {}", newQty);
        log.info("| Diferencia:        {}", newQty - previousQty);
        log.info("| Razón:             {}", reason);
        log.info("===========================================");
    }

    /**
     * Emite alerta de stock bajo.
     */
    private void emitLowStockAlert(Long productId, Integer currentStock, Integer minStock) {
        log.warn("⚠️ ========== ALERTA DE STOCK BAJO ==========");
        log.warn("| Tipo:           LOW_STOCK_ALERT");
        log.warn("| Timestamp:      {}", LocalDateTime.now());
        log.warn("| Product ID:     {}", productId);
        log.warn("| Stock Actual:   {}", currentStock);
        log.warn("| Stock Mínimo:   {}", minStock);
        log.warn("| Acción:         Reponer inventario");
        log.warn("⚠️ ============================================");
    }
}