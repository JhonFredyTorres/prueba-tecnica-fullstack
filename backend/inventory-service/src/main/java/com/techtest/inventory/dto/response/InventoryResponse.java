package com.techtest.inventory.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;

/**
 * DTO de respuesta para inventario.
 * Incluye información del producto obtenida del servicio de productos.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InventoryResponse {

    private Long id;
    private Long productId;
    private Integer quantity;
    private Integer reservedQuantity;
    private Integer availableQuantity;
    private Integer minStock;
    private Boolean lowStock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Información del producto (del servicio de productos)
    private ProductInfo product;

    /**
     * Información básica del producto obtenida del otro microservicio
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ProductInfo {
        private Long id;
        private String name;
        private String sku;
        private String category;
    }
}