package com.techtest.products.service.impl;

import com.techtest.products.dto.request.ProductRequest;
import com.techtest.products.dto.response.ProductResponse;
import com.techtest.products.entity.Product;
import com.techtest.products.exception.DuplicateSkuException;
import com.techtest.products.exception.ProductNotFoundException;
import com.techtest.products.repository.ProductRepository;
import com.techtest.products.service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación del servicio de productos.
 *
 * Contiene toda la lógica de negocio:
 * - Validaciones de negocio (SKU duplicado, etc.)
 * - Conversión entre entidades y DTOs
 * - Manejo de transacciones
 */
@Service
@RequiredArgsConstructor  // Lombok genera el constructor con los campos final
@Slf4j
@Transactional(readOnly = true)  // Por defecto, operaciones de solo lectura
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;

    @Override
    @Transactional  // Esta operación modifica la BD
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creando producto con SKU: {}", request.getSku());

        // Validar que el SKU no exista
        if (productRepository.existsBySku(request.getSku())) {
            throw new DuplicateSkuException(request.getSku());
        }

        // Convertir DTO a entidad
        Product product = mapToEntity(request);

        // Guardar en BD
        Product savedProduct = productRepository.save(product);
        log.info("Producto creado con ID: {}", savedProduct.getId());

        // Convertir entidad a DTO de respuesta
        return mapToResponse(savedProduct);
    }

    @Override
    public ProductResponse getProductById(Long id) {
        log.debug("Buscando producto con ID: {}", id);

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        return mapToResponse(product);
    }

    @Override
    public ProductResponse getProductBySku(String sku) {
        log.debug("Buscando producto con SKU: {}", sku);

        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new ProductNotFoundException(sku));

        return mapToResponse(product);
    }

    @Override
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        log.debug("Listando productos - página: {}, tamaño: {}",
                pageable.getPageNumber(), pageable.getPageSize());

        return productRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    @Override
    public Page<ProductResponse> getProductsByCategory(String category, Pageable pageable) {
        log.debug("Listando productos de categoría: {}", category);

        return productRepository.findByCategory(category, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.info("Actualizando producto con ID: {}", id);

        // Buscar producto existente
        Product existingProduct = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException(id));

        // Si el SKU cambió, verificar que no exista otro producto con ese SKU
        if (!existingProduct.getSku().equals(request.getSku())) {
            if (productRepository.existsBySku(request.getSku())) {
                throw new DuplicateSkuException(request.getSku());
            }
        }

        // Actualizar campos
        updateEntityFromRequest(existingProduct, request);

        // Guardar cambios
        Product updatedProduct = productRepository.save(existingProduct);
        log.info("Producto actualizado: {}", updatedProduct.getId());

        return mapToResponse(updatedProduct);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        log.info("Eliminando producto con ID: {}", id);

        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException(id);
        }

        productRepository.deleteById(id);
        log.info("Producto eliminado: {}", id);
    }

    @Override
    public boolean existsById(Long id) {
        return productRepository.existsById(id);
    }

    // ==================== MÉTODOS PRIVADOS DE MAPEO ====================

    /**
     * Convierte un ProductRequest (DTO) a Product (Entidad)
     */
    private Product mapToEntity(ProductRequest request) {
        return Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .sku(request.getSku())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();
    }

    /**
     * Convierte un Product (Entidad) a ProductResponse (DTO)
     */
    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .category(product.getCategory())
                .sku(product.getSku())
                .active(product.getActive())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    /**
     * Actualiza una entidad existente con los datos del request
     */
    private void updateEntityFromRequest(Product product, ProductRequest request) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setCategory(request.getCategory());
        product.setSku(request.getSku());
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }
    }
}