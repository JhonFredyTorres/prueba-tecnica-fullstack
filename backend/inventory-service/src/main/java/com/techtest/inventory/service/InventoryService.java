package com.techtest.inventory.service;

import com.techtest.inventory.dto.request.InventoryRequest;
import com.techtest.inventory.dto.request.PurchaseRequest;
import com.techtest.inventory.dto.response.InventoryResponse;

import java.util.List;

/**
 * Interface del servicio de inventario.
 */
public interface InventoryService {

    /**
     * Crea o actualiza el inventario de un producto.
     * Valida que el producto exista en el servicio de productos.
     */
    InventoryResponse createOrUpdateInventory(InventoryRequest request);

    /**
     * Obtiene el inventario de un producto por su ID.
     * Incluye información del producto obtenida del otro microservicio.
     */
    InventoryResponse getInventoryByProductId(Long productId);

    /**
     * Actualiza la cantidad de inventario directamente.
     */
    InventoryResponse updateQuantity(Long productId, Integer quantity);

    /**
     * Procesa una compra (decrementa el inventario).
     * Emite un evento (log) cuando cambia el inventario.
     */
    InventoryResponse processPurchase(Long productId, PurchaseRequest request);

    /**
     * Obtiene productos con stock bajo.
     */
    List<InventoryResponse> getLowStockItems();

    /**
     * Elimina el registro de inventario de un producto.
     */
    void deleteInventory(Long productId);

    /**
     * Verifica si hay stock disponible para un producto.
     */
    boolean hasStock(Long productId, Integer quantity);
}