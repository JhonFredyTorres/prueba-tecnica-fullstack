package com.techtest.products.service;

import com.techtest.products.dto.request.ProductRequest;
import com.techtest.products.dto.response.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Interface del servicio de productos.
 *
 * Define las operaciones disponibles sin revelar la implementación.
 * Esto permite:
 * 1. Múltiples implementaciones (producción, mock para tests)
 * 2. Desacoplamiento entre capas
 * 3. Facilita testing con Mockito
 */
public interface ProductService {

    /**
     * Crea un nuevo producto.
     *
     * @param request datos del producto a crear
     * @return el producto creado
     * @throws com.techtest.products.exception.DuplicateSkuException si el SKU ya existe
     */
    ProductResponse createProduct(ProductRequest request);

    /**
     * Obtiene un producto por su ID.
     *
     * @param id identificador del producto
     * @return el producto encontrado
     * @throws com.techtest.products.exception.ProductNotFoundException si no existe
     */
    ProductResponse getProductById(Long id);

    /**
     * Obtiene un producto por su SKU.
     *
     * @param sku código único del producto
     * @return el producto encontrado
     * @throws com.techtest.products.exception.ProductNotFoundException si no existe
     */
    ProductResponse getProductBySku(String sku);

    /**
     * Lista todos los productos con paginación.
     *
     * @param pageable configuración de paginación
     * @return página de productos
     */
    Page<ProductResponse> getAllProducts(Pageable pageable);

    /**
     * Lista productos por categoría con paginación.
     *
     * @param category categoría a filtrar
     * @param pageable configuración de paginación
     * @return página de productos filtrados
     */
    Page<ProductResponse> getProductsByCategory(String category, Pageable pageable);

    /**
     * Actualiza un producto existente.
     *
     * @param id identificador del producto
     * @param request datos actualizados
     * @return el producto actualizado
     * @throws com.techtest.products.exception.ProductNotFoundException si no existe
     * @throws com.techtest.products.exception.DuplicateSkuException si el nuevo SKU ya existe
     */
    ProductResponse updateProduct(Long id, ProductRequest request);

    /**
     * Elimina un producto por su ID.
     *
     * @param id identificador del producto
     * @throws com.techtest.products.exception.ProductNotFoundException si no existe
     */
    void deleteProduct(Long id);

    /**
     * Verifica si un producto existe.
     *
     * @param id identificador del producto
     * @return true si existe, false si no
     */
    boolean existsById(Long id);
}