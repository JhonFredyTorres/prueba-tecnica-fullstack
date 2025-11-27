package com.techtest.products.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

/**
 * Respuesta JSON:API para un recurso individual.
 *
 * Ejemplo de salida:
 * {
 *   "data": {
 *     "type": "products",
 *     "id": "1",
 *     "attributes": { ... }
 *   }
 * }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonApiResponse<T> {

    private JsonApiData<T> data;

    /**
     * Factory method para crear respuesta fácilmente
     */
    public static <T> JsonApiResponse<T> of(String type, Long id, T attributes) {
        return JsonApiResponse.<T>builder()
                .data(JsonApiData.of(type, id, attributes))
                .build();
    }
}