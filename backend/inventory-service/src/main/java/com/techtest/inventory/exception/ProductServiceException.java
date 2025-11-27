package com.techtest.inventory.exception;

/**
 * Excepción cuando hay un error al comunicarse con el servicio de productos.
 */
public class ProductServiceException extends RuntimeException {

    private final Long productId;
    private final String serviceError;

    public ProductServiceException(String message) {
        super(message);
        this.productId = null;
        this.serviceError = message;
    }

    public ProductServiceException(Long productId, String serviceError) {
        super(String.format("Error al consultar producto %d: %s", productId, serviceError));
        this.productId = productId;
        this.serviceError = serviceError;
    }

    public ProductServiceException(String message, Throwable cause) {
        super(message, cause);
        this.productId = null;
        this.serviceError = message;
    }

    public Long getProductId() {
        return productId;
    }

    public String getServiceError() {
        return serviceError;
    }
}