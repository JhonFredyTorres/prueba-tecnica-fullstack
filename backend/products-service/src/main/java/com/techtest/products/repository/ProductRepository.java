package com.techtest.products.repository;

import com.techtest.products.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository para acceder a la tabla de productos.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Buscar producto por SKU (código único)
     */
    Optional<Product> findBySku(String sku);

    /**
     * Verificar si existe un SKU
     */
    boolean existsBySku(String sku);

    /**
     * Buscar productos por categoría con paginación
     */
    Page<Product> findByCategory(String category, Pageable pageable);

    /**
     * Buscar solo productos activos con paginación
     */
    Page<Product> findByActiveTrue(Pageable pageable);

    /**
     * Buscar productos por nombre (búsqueda parcial, ignorando mayúsculas)
     */
    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Product> searchByName(@Param("name") String name);

    /**
     * Buscar productos activos por categoría
     */
    Page<Product> findByCategoryAndActiveTrue(String category, Pageable pageable);
}