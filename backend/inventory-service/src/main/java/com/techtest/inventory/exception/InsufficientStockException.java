package com.techtest.inventory.exception;

/**
 * Excepción cuando no hay stock suficiente para una compra.
 */
public class InsufficientStockException extends RuntimeException {

    private final Long productId;
    private final Integer requestedQuantity;
    private final Integer availableQuantity;

    public InsufficientStockException(Long productId, Integer requestedQuantity, Integer availableQuantity) {
        super(String.format(
                "Stock insuficiente para el producto %d. Solicitado: %d, Disponible: %d",
                productId, requestedQuantity, availableQuantity
        ));
        this.productId = productId;
        this.requestedQuantity = requestedQuantity;
        this.availableQuantity = availableQuantity;
    }

    public Long getProductId() {
        return productId;
    }

    public Integer getRequestedQuantity() {
        return requestedQuantity;
    }

    public Integer getAvailableQuantity() {
        return availableQuantity;
    }
}