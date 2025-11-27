package com.techtest.products.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * Respuesta de error siguiendo el estándar JSON:API.
 *
 * Ejemplo de salida:
 * {
 *   "errors": [
 *     {
 *       "status": "404",
 *       "code": "PRODUCT_NOT_FOUND",
 *       "title": "Producto no encontrado",
 *       "detail": "No se encontró el producto con ID: 123",
 *       "timestamp": "2024-01-15T10:30:00"
 *     }
 *   ]
 * }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonApiErrorResponse {

    private List<JsonApiError> errors;

    /**
     * Crea una respuesta de error simple (un solo error)
     */
    public static JsonApiErrorResponse of(String status, String code, String title, String detail) {
        JsonApiError error = JsonApiError.builder()
                .status(status)
                .code(code)
                .title(title)
                .detail(detail)
                .timestamp(LocalDateTime.now())
                .build();

        return JsonApiErrorResponse.builder()
                .errors(Collections.singletonList(error))
                .build();
    }

    /**
     * Crea una respuesta con múltiples errores (útil para validaciones)
     */
    public static JsonApiErrorResponse ofList(List<JsonApiError> errors) {
        return JsonApiErrorResponse.builder()
                .errors(errors)
                .build();
    }

    /**
     * Clase interna que representa un error individual
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class JsonApiError {
        private String status;      // Código HTTP como string (ej: "404")
        private String code;        // Código interno de error (ej: "PRODUCT_NOT_FOUND")
        private String title;       // Título corto del error
        private String detail;      // Descripción detallada
        private String source;      // Campo que causó el error (para validaciones)
        private LocalDateTime timestamp;
    }
}