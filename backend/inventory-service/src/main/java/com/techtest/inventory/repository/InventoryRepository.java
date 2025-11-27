package com.techtest.inventory.repository;

import com.techtest.inventory.entity.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para acceso a la tabla de inventario.
 */
@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    /**
     * Buscar inventario por ID de producto
     */
    Optional<Inventory> findByProductId(Long productId);

    /**
     * Verificar si existe inventario para un producto
     */
    boolean existsByProductId(Long productId);

    /**
     * Obtener productos con stock bajo
     */
    @Query("SELECT i FROM Inventory i WHERE i.quantity <= i.minStock")
    List<Inventory> findLowStockItems();

    /**
     * Obtener productos sin stock
     */
    @Query("SELECT i FROM Inventory i WHERE i.quantity = 0")
    List<Inventory> findOutOfStockItems();

    /**
     * Actualizar cantidad directamente
     */
    @Modifying
    @Query("UPDATE Inventory i SET i.quantity = :quantity WHERE i.productId = :productId")
    int updateQuantityByProductId(@Param("productId") Long productId, @Param("quantity") Integer quantity);

    /**
     * Decrementar cantidad (para compras)
     * Retorna el número de filas afectadas (0 si no hay stock suficiente)
     */
    @Modifying
    @Query("UPDATE Inventory i SET i.quantity = i.quantity - :amount " +
            "WHERE i.productId = :productId AND i.quantity >= :amount")
    int decrementQuantity(@Param("productId") Long productId, @Param("amount") Integer amount);
}