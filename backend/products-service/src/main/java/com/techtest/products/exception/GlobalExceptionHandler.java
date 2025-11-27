package com.techtest.products.exception;

import com.techtest.products.dto.response.JsonApiErrorResponse;
import com.techtest.products.dto.response.JsonApiErrorResponse.JsonApiError;
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
 * Manejador global de excepciones.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * Maneja ProductNotFoundException (HTTP 404)
     */
    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<JsonApiErrorResponse> handleProductNotFound(ProductNotFoundException ex) {
        log.warn("Producto no encontrado: {}", ex.getMessage());

        JsonApiErrorResponse response = JsonApiErrorResponse.of(
                "404",
                "PRODUCT_NOT_FOUND",
                "Producto no encontrado",
                ex.getMessage()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    /**
     * Maneja DuplicateSkuException (HTTP 409 Conflict)
     */
    @ExceptionHandler(DuplicateSkuException.class)
    public ResponseEntity<JsonApiErrorResponse> handleDuplicateSku(DuplicateSkuException ex) {
        log.warn("SKU duplicado: {}", ex.getMessage());

        JsonApiErrorResponse response = JsonApiErrorResponse.of(
                "409",
                "DUPLICATE_SKU",
                "SKU duplicado",
                ex.getMessage()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    /**
     * Maneja errores de validación (@Valid) - HTTP 400
     *
     * Cuando un DTO tiene campos inválidos, Spring lanza esta excepción.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<JsonApiErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex) {
        log.warn("Error de validación: {}", ex.getMessage());

        List<JsonApiError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(this::mapFieldError)
                .collect(Collectors.toList());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(JsonApiErrorResponse.ofList(errors));
    }

    /**
     * Convierte un FieldError de Spring a JsonApiError
     */
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

    /**
     * Maneja errores de tipo de parámetro (ej: ID no numérico) - HTTP 400
     */
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

    /**
     * Maneja IllegalArgumentException (HTTP 400)
     */
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

    /**
     * Maneja cualquier otra excepción no controlada (HTTP 500)
     *
     * IMPORTANTE: En producción, no expongas el mensaje real del error.
     */
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