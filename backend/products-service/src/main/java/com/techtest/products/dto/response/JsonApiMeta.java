package com.techtest.products.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import org.springframework.data.domain.Page;

/**
 * Metadata de paginación para JSON:API.
 *
 * Incluye información sobre la paginación actual:
 * - totalElements: total de registros en la base de datos
 * - totalPages: total de páginas
 * - currentPage: página actual (0-indexed)
 * - pageSize: elementos por página
 * - isFirst: si es la primera página
 * - isLast: si es la última página
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonApiMeta {

    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
    private boolean isFirst;
    private boolean isLast;

    /**
     * Crea metadata desde un objeto Page de Spring Data
     */
    public static JsonApiMeta fromPage(Page<?> page) {
        return JsonApiMeta.builder()
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .currentPage(page.getNumber())
                .pageSize(page.getSize())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .build();
    }
}