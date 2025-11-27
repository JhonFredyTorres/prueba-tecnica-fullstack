package com.techtest.products.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

/**
 * Wrapper JSON:API para un objeto individual.
 *
 * Según el estándar JSON:API, cada recurso debe tener:
 * - type: tipo del recurso (ej: "products")
 * - id: identificador único (como String)
 * - attributes: los datos del recurso
 *
 * Ejemplo de salida:
 * {
 *   "type": "products",
 *   "id": "1",
 *   "attributes": {
 *     "name": "Laptop",
 *     "price": 999.99
 *   }
 * }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonApiData<T> {

    private String type;
    private String id;
    private T attributes;

    /**
     * Factory method para crear un JsonApiData fácilmente
     */
    public static <T> JsonApiData<T> of(String type, Long id, T attributes) {
        return JsonApiData.<T>builder()
                .type(type)
                .id(id != null ? id.toString() : null)
                .attributes(attributes)
                .build();
    }

    public static <T> JsonApiData<T> of(String type, String id, T attributes) {
        return JsonApiData.<T>builder()
                .type(type)
                .id(id)
                .attributes(attributes)
                .build();
    }
}