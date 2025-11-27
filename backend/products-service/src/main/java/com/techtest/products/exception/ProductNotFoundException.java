package com.techtest.products.exception;

/**
 * Excepción lanzada cuando no se encuentra un producto.
 *
 * Extiende RuntimeException porque:
 * 1. No queremos obligar a capturarla en cada llamada
 * 2. Spring la puede manejar con @ExceptionHandler
 */
public class ProductNotFoundException extends RuntimeException {

    private final Long productId;
    private final String sku;

    public ProductNotFoundException(Long productId) {
        super(String.format("Producto con ID %d no encontrado", productId));
        this.productId = productId;
        this.sku = null;
    }

    public ProductNotFoundException(String sku) {
        super(String.format("Producto con SKU '%s' no encontrado", sku));
        this.productId = null;
        this.sku = sku;
    }

    public Long getProductId() {
        return productId;
    }

    public String getSku() {
        return sku;
    }
}