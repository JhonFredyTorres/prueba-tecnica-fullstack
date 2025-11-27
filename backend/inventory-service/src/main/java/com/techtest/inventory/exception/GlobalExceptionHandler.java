package com.techtest.inventory.exception;

import com.techtest.inventory.dto.response.JsonApiErrorResponse;
import com.techtest.inventory.dto.response.JsonApiErrorResponse.JsonApiError;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Manejador global de excepciones para el servicio de inventario.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(InventoryNotFoundException.class)
    public ResponseEntity<JsonApiErrorResponse> handleInventoryNotFound(InventoryNotFoundException ex) {
        log.warn("Inventario no encontrado: {}", ex.getMessage());

        JsonApiErrorResponse response = JsonApiErrorResponse.of(
                "404",
                "INVENTORY_NOT_FOUND",
                "Inventario no encontrado",
                ex.getMessage()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<JsonApiErrorResponse> handleInsufficientStock(InsufficientStockException ex) {
        log.warn("Stock insuficiente: {}", ex.getMessage());

        JsonApiErrorResponse response = JsonApiErrorResponse.of(
                "400",
                "INSUFFICIENT_STOCK",
                "Stock insuficiente",
                ex.getMessage()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(ProductServiceException.class)
    public ResponseEntity<JsonApiErrorResponse> handleProductServiceError(ProductServiceException ex) {
        log.error("Error en servicio de productos: {}", ex.getMessage());

        JsonApiErrorResponse response = JsonApiErrorResponse.of(
                "503",
                "PRODUCT_SERVICE_ERROR",
                "Error en servicio de productos",
                ex.getMessage()
        );

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<JsonApiErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        log.warn("Error de validación: {}", ex.getMessage());

        List<JsonApiError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(this::mapFieldError)
                .collect(Collectors.toList());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(JsonApiErrorResponse.ofList(errors));
    }

    private JsonApiError mapFieldError(FieldError fieldError) {
        return JsonApiError.builder()
                .status("400")
                .code("VALIDATION_ERROR")
                .title("Error de validación")
                .detail(fieldError.getDefaultMessage())
                .source(fieldError.getField())
                .timestamp(LocalDateTime.now())
                .build();
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<JsonApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.warn("Error de tipo de argumento: {}", ex.getMessage());

        String detail = String.format("El parámetro '%s' debe ser de tipo %s",
                ex.getName(),
                ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "desconocido");

        JsonApiErrorResponse response = JsonApiErrorResponse.of(
                "400",
                "INVALID_PARAMETER",
                "Parámetro inválido",
                detail
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<JsonApiErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Argumento ilegal: {}", ex.getMessage());

        JsonApiErrorResponse response = JsonApiErrorResponse.of(
                "400",
                "INVALID_ARGUMENT",
                "Argumento inválido",
                ex.getMessage()
        );

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<JsonApiErrorResponse> handleGenericException(Exception ex) {
        log.error("Error interno del servidor", ex);

        JsonApiErrorResponse response = JsonApiErrorResponse.of(
                "500",
                "INTERNAL_ERROR",
                "Error interno del servidor",
                "Ha ocurrido un error inesperado. Por favor, intente más tarde."
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}