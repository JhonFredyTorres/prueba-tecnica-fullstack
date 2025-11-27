package com.techtest.products.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Respuesta JSON:API para una lista de recursos con paginación.
 *
 * Ejemplo de salida:
 * {
 *   "data": [
 *     { "type": "products", "id": "1", "attributes": {...} },
 *     { "type": "products", "id": "2", "attributes": {...} }
 *   ],
 *   "meta": {
 *     "totalElements": 100,
 *     "totalPages": 10,
 *     "currentPage": 0,
 *     "pageSize": 10,
 *     "isFirst": true,
 *     "isLast": false
 *   },
 *   "links": {
 *     "self": "/api/v1/products?page=0&size=10",
 *     "first": "/api/v1/products?page=0&size=10",
 *     "last": "/api/v1/products?page=9&size=10",
 *     "prev": null,
 *     "next": "/api/v1/products?page=1&size=10"
 *   }
 * }
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonApiListResponse<T> {

    private List<JsonApiData<T>> data;
    private JsonApiMeta meta;
    private JsonApiLinks links;

    /**
     * Crea una respuesta paginada desde un Page de Spring Data.
     *
     * @param page Resultado paginado de Spring Data
     * @param type Tipo del recurso (ej: "products")
     * @param basePath Path base para los links
     * @param mapper Función para convertir entidad a DTO
     * @param idExtractor Función para extraer el ID de la entidad
     * @param <E> Tipo de la entidad
     * @param <T> Tipo del DTO de respuesta
     */
    public static <E, T> JsonApiListResponse<T> fromPage(
            Page<E> page,
            String type,
            String basePath,
            Function<E, T> mapper,
            Function<E, Long> idExtractor) {

        List<JsonApiData<T>> dataList = page.getContent().stream()
                .map(entity -> JsonApiData.of(type, idExtractor.apply(entity), mapper.apply(entity)))
                .collect(Collectors.toList());

        return JsonApiListResponse.<T>builder()
                .data(dataList)
                .meta(JsonApiMeta.fromPage(page))
                .links(JsonApiLinks.fromPage(page, basePath))
                .build();
    }
}