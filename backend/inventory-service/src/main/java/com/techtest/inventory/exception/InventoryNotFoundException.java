package com.techtest.inventory.exception;

/**
 * Excepción cuando no se encuentra inventario para un producto.
 */
public class InventoryNotFoundException extends RuntimeException {

    private final Long productId;

    public InventoryNotFoundException(Long productId) {
        super(String.format("No se encontró inventario para el producto con ID: %d", productId));
        this.productId = productId;
    }

    public Long getProductId() {
        return productId;
    }
}