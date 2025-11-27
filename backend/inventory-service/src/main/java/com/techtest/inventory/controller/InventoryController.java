package com.techtest.inventory.controller;

import com.techtest.inventory.dto.request.InventoryRequest;
import com.techtest.inventory.dto.request.PurchaseRequest;
import com.techtest.inventory.dto.response.InventoryResponse;
import com.techtest.inventory.dto.response.JsonApiErrorResponse;
import com.techtest.inventory.dto.response.JsonApiResponse;
import com.techtest.inventory.service.InventoryService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller REST para gestión de inventario.
 *
 * Base path: /api/v1/inventory
 */
@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Inventario", description = "API para gestión de inventario de productos")
public class InventoryController {

    private final InventoryService inventoryService;

    private static final String RESOURCE_TYPE = "inventory";

    // ==================== CREAR/ACTUALIZAR INVENTARIO ====================

    @PostMapping
    @Operation(
            summary = "Crear o actualizar inventario",
            description = "Crea un nuevo registro de inventario o actualiza uno existente para un producto. " +
                    "Valida que el producto exista en el servicio de productos."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Inventario creado/actualizado"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "503", description = "Servicio de productos no disponible",
                    content = @Content(schema = @Schema(implementation = JsonApiErrorResponse.class)))
    })
    public ResponseEntity<JsonApiResponse<InventoryResponse>> createOrUpdateInventory(
            @Valid @RequestBody InventoryRequest request) {

        log.info("POST /inventory - Producto: {}, Cantidad: {}",
                request.getProductId(), request.getQuantity());

        InventoryResponse response = inventoryService.createOrUpdateInventory(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(JsonApiResponse.of(RESOURCE_TYPE, response.getId(), response));
    }

    // ==================== CONSULTAR INVENTARIO POR PRODUCTO ====================

    @GetMapping("/product/{productId}")
    @Operation(
            summary = "Consultar inventario por producto",
            description = "Obtiene la cantidad disponible de un producto. " +
                    "Incluye información del producto obtenida del microservicio de productos."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Inventario encontrado"),
            @ApiResponse(responseCode = "404", description = "Inventario no encontrado",
                    content = @Content(schema = @Schema(implementation = JsonApiErrorResponse.class)))
    })
    public ResponseEntity<JsonApiResponse<InventoryResponse>> getInventoryByProductId(
            @Parameter(description = "ID del producto", example = "1")
            @PathVariable Long productId) {

        log.info("GET /inventory/product/{} - Consultando inventario", productId);

        InventoryResponse response = inventoryService.getInventoryByProductId(productId);

        return ResponseEntity.ok(
                JsonApiResponse.of(RESOURCE_TYPE, response.getId(), response)
        );
    }

    // ==================== ACTUALIZAR CANTIDAD ====================

    @PatchMapping("/product/{productId}/quantity")
    @Operation(
            summary = "Actualizar cantidad",
            description = "Actualiza directamente la cantidad de inventario de un producto"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cantidad actualizada"),
            @ApiResponse(responseCode = "404", description = "Inventario no encontrado")
    })
    public ResponseEntity<JsonApiResponse<InventoryResponse>> updateQuantity(
            @Parameter(description = "ID del producto", example = "1")
            @PathVariable Long productId,
            @Parameter(description = "Nueva cantidad", example = "50")
            @RequestParam Integer quantity) {

        log.info("PATCH /inventory/product/{}/quantity - Nueva cantidad: {}", productId, quantity);

        InventoryResponse response = inventoryService.updateQuantity(productId, quantity);

        return ResponseEntity.ok(
                JsonApiResponse.of(RESOURCE_TYPE, response.getId(), response)
        );
    }

    // ==================== PROCESAR COMPRA ====================

    @PostMapping("/product/{productId}/purchase")
    @Operation(
            summary = "Procesar compra",
            description = "Decrementa el inventario tras una compra. " +
                    "Emite un evento cuando cambia el inventario."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Compra procesada exitosamente"),
            @ApiResponse(responseCode = "400", description = "Stock insuficiente",
                    content = @Content(schema = @Schema(implementation = JsonApiErrorResponse.class))),
            @ApiResponse(responseCode = "404", description = "Inventario no encontrado")
    })
    public ResponseEntity<JsonApiResponse<InventoryResponse>> processPurchase(
            @Parameter(description = "ID del producto", example = "1")
            @PathVariable Long productId,
            @Valid @RequestBody PurchaseRequest request) {

        log.info("POST /inventory/product/{}/purchase - Cantidad: {}", productId, request.getQuantity());

        InventoryResponse response = inventoryService.processPurchase(productId, request);

        return ResponseEntity.ok(
                JsonApiResponse.of(RESOURCE_TYPE, response.getId(), response)
        );
    }

    // ==================== PRODUCTOS CON STOCK BAJO ====================

    @GetMapping("/low-stock")
    @Operation(
            summary = "Productos con stock bajo",
            description = "Lista todos los productos cuyo stock está por debajo del mínimo configurado"
    )
    public ResponseEntity<List<InventoryResponse>> getLowStockItems() {
        log.info("GET /inventory/low-stock - Consultando productos con stock bajo");

        List<InventoryResponse> items = inventoryService.getLowStockItems();

        return ResponseEntity.ok(items);
    }

    // ==================== VERIFICAR STOCK ====================

    @GetMapping("/product/{productId}/check-stock")
    @Operation(
            summary = "Verificar disponibilidad",
            description = "Verifica si hay stock suficiente para una cantidad solicitada"
    )
    public ResponseEntity<Boolean> checkStock(
            @Parameter(description = "ID del producto", example = "1")
            @PathVariable Long productId,
            @Parameter(description = "Cantidad a verificar", example = "5")
            @RequestParam Integer quantity) {

        log.debug("GET /inventory/product/{}/check-stock - Cantidad: {}", productId, quantity);

        boolean hasStock = inventoryService.hasStock(productId, quantity);

        return ResponseEntity.ok(hasStock);
    }

    // ==================== ELIMINAR INVENTARIO ====================

    @DeleteMapping("/product/{productId}")
    @Operation(
            summary = "Eliminar inventario",
            description = "Elimina el registro de inventario de un producto"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Inventario eliminado"),
            @ApiResponse(responseCode = "404", description = "Inventario no encontrado")
    })
    public ResponseEntity<Void> deleteInventory(
            @Parameter(description = "ID del producto", example = "1")
            @PathVariable Long productId) {

        log.info("DELETE /inventory/product/{} - Eliminando inventario", productId);

        inventoryService.deleteInventory(productId);

        return ResponseEntity.noContent().build();
    }
}