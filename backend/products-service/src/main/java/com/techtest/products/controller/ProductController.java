package com.techtest.products.controller;

import com.techtest.products.dto.request.ProductRequest;
import com.techtest.products.dto.response.*;
import com.techtest.products.entity.Product;
import com.techtest.products.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller REST para gestión de productos.
 *
 * Todos los endpoints siguen el estándar JSON:API.
 * Base path: /api/v1/products (configurado en application.yml + @RequestMapping)
 */
@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Productos", description = "API para gestión de productos")
public class ProductController {

    private final ProductService productService;

    private static final String RESOURCE_TYPE = "products";
    private static final String BASE_PATH = "/api/v1/products";

    // ==================== CREAR PRODUCTO ====================

    @PostMapping
    @Operation(
            summary = "Crear un producto",
            description = "Crea un nuevo producto en el sistema"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "201",
                    description = "Producto creado exitosamente",
                    content = @Content(schema = @Schema(implementation = JsonApiResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos inválidos",
                    content = @Content(schema = @Schema(implementation = JsonApiErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "SKU duplicado",
                    content = @Content(schema = @Schema(implementation = JsonApiErrorResponse.class))
            )
    })
    public ResponseEntity<JsonApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request) {

        log.info("POST /products - Creando producto: {}", request.getSku());

        ProductResponse created = productService.createProduct(request);
        JsonApiResponse<ProductResponse> response = JsonApiResponse.of(
                RESOURCE_TYPE,
                created.getId(),
                created
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ==================== OBTENER PRODUCTO POR ID ====================

    @GetMapping("/{id}")
    @Operation(
            summary = "Obtener producto por ID",
            description = "Retorna un producto específico por su identificador"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Producto encontrado",
                    content = @Content(schema = @Schema(implementation = JsonApiResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Producto no encontrado",
                    content = @Content(schema = @Schema(implementation = JsonApiErrorResponse.class))
            )
    })
    public ResponseEntity<JsonApiResponse<ProductResponse>> getProductById(
            @Parameter(description = "ID del producto", example = "1")
            @PathVariable Long id) {

        log.info("GET /products/{} - Obteniendo producto", id);

        ProductResponse product = productService.getProductById(id);
        JsonApiResponse<ProductResponse> response = JsonApiResponse.of(
                RESOURCE_TYPE,
                product.getId(),
                product
        );

        return ResponseEntity.ok(response);
    }

    // ==================== LISTAR PRODUCTOS CON PAGINACIÓN ====================

    @GetMapping
    @Operation(
            summary = "Listar productos",
            description = "Lista todos los productos con paginación. " +
                    "Parámetros: page (número de página, desde 0), " +
                    "size (elementos por página), " +
                    "sort (campo,dirección)"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Lista de productos",
                    content = @Content(schema = @Schema(implementation = JsonApiListResponse.class))
            )
    })
    public ResponseEntity<JsonApiListResponse<ProductResponse>> getAllProducts(
            @Parameter(description = "Número de página (desde 0)", example = "0")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Elementos por página", example = "10")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "Campo de ordenamiento", example = "name")
            @RequestParam(defaultValue = "id") String sortBy,

            @Parameter(description = "Dirección de ordenamiento", example = "asc")
            @RequestParam(defaultValue = "asc") String sortDir,

            @Parameter(description = "Filtrar por categoría (opcional)")
            @RequestParam(required = false) String category) {

        log.info("GET /products - Listando productos (page={}, size={}, category={})",
                page, size, category);

        // Construir objeto Pageable con ordenamiento
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        // Obtener productos (filtrados por categoría si se especifica)
        Page<ProductResponse> productPage;
        if (category != null && !category.isBlank()) {
            productPage = productService.getProductsByCategory(category, pageable);
        } else {
            productPage = productService.getAllProducts(pageable);
        }

        // Construir respuesta JSON:API con paginación
        JsonApiListResponse<ProductResponse> response = JsonApiListResponse.fromPage(
                productPage,
                RESOURCE_TYPE,
                BASE_PATH,
                p -> p,  // Ya viene como ProductResponse, no necesita conversión
                ProductResponse::getId
        );

        return ResponseEntity.ok(response);
    }

    // ==================== ACTUALIZAR PRODUCTO ====================

    @PutMapping("/{id}")
    @Operation(
            summary = "Actualizar producto",
            description = "Actualiza todos los campos de un producto existente"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "Producto actualizado",
                    content = @Content(schema = @Schema(implementation = JsonApiResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "Datos inválidos",
                    content = @Content(schema = @Schema(implementation = JsonApiErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Producto no encontrado",
                    content = @Content(schema = @Schema(implementation = JsonApiErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "409",
                    description = "SKU duplicado",
                    content = @Content(schema = @Schema(implementation = JsonApiErrorResponse.class))
            )
    })
    public ResponseEntity<JsonApiResponse<ProductResponse>> updateProduct(
            @Parameter(description = "ID del producto", example = "1")
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {

        log.info("PUT /products/{} - Actualizando producto", id);

        ProductResponse updated = productService.updateProduct(id, request);
        JsonApiResponse<ProductResponse> response = JsonApiResponse.of(
                RESOURCE_TYPE,
                updated.getId(),
                updated
        );

        return ResponseEntity.ok(response);
    }

    // ==================== ELIMINAR PRODUCTO ====================

    @DeleteMapping("/{id}")
    @Operation(
            summary = "Eliminar producto",
            description = "Elimina un producto por su ID"
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "204",
                    description = "Producto eliminado exitosamente"
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "Producto no encontrado",
                    content = @Content(schema = @Schema(implementation = JsonApiErrorResponse.class))
            )
    })
    public ResponseEntity<Void> deleteProduct(
            @Parameter(description = "ID del producto", example = "1")
            @PathVariable Long id) {

        log.info("DELETE /products/{} - Eliminando producto", id);

        productService.deleteProduct(id);

        return ResponseEntity.noContent().build();
    }

    // ==================== VERIFICAR SI EXISTE (Interno para Inventory Service) ====================

    @GetMapping("/{id}/exists")
    @Operation(
            summary = "Verificar existencia",
            description = "Verifica si un producto existe (usado por otros microservicios)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Resultado de verificación")
    })
    public ResponseEntity<Boolean> existsProduct(
            @Parameter(description = "ID del producto", example = "1")
            @PathVariable Long id) {

        log.debug("GET /products/{}/exists - Verificando existencia", id);

        boolean exists = productService.existsById(id);
        return ResponseEntity.ok(exists);
    }
}