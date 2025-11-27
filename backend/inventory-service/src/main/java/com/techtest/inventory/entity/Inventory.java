package com.techtest.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad Inventory - Almacena el stock de cada producto.
 *
 * Nota: productId es una referencia al microservicio de Productos.
 * No usamos FK porque están en bases de datos diferentes (microservicios independientes).
 */
@Entity
@Table(name = "inventory", indexes = {
        @Index(name = "idx_product_id", columnList = "product_id", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false, unique = true)
    private Long productId;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 0;

    @Column(name = "reserved_quantity", nullable = false)
    @Builder.Default
    private Integer reservedQuantity = 0;  // Cantidad reservada en órdenes pendientes

    @Column(name = "min_stock")
    @Builder.Default
    private Integer minStock = 5;  // Alerta cuando el stock baja de este valor

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Calcula la cantidad disponible para venta
     * (stock total - reservado)
     */
    public Integer getAvailableQuantity() {
        return quantity - reservedQuantity;
    }

    /**
     * Verifica si hay stock suficiente para una cantidad solicitada
     */
    public boolean hasStock(Integer requestedQuantity) {
        return getAvailableQuantity() >= requestedQuantity;
    }

    /**
     * Verifica si el stock está por debajo del mínimo
     */
    public boolean isLowStock() {
        return quantity <= minStock;
    }
}