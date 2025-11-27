package com.techtest.products.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import org.springframework.data.domain.Page;

/**
 * Links de navegación JSON:API para paginación.
  */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class JsonApiLinks {

    private String self;
    private String first;
    private String last;
    private String prev;
    private String next;

    /**
     * Genera los links de paginación basados en la página actual
     *
     * @param page Objeto Page de Spring Data
     * @param basePath Path base del endpoint (ej: "/api/v1/products")
     * @return JsonApiLinks con todos los links de navegación
     */
    public static JsonApiLinks fromPage(Page<?> page, String basePath) {
        int currentPage = page.getNumber();
        int totalPages = page.getTotalPages();
        int size = page.getSize();

        String self = buildUrl(basePath, currentPage, size);
        String first = buildUrl(basePath, 0, size);
        String last = totalPages > 0 ? buildUrl(basePath, totalPages - 1, size) : first;
        String prev = currentPage > 0 ? buildUrl(basePath, currentPage - 1, size) : null;
        String next = currentPage < totalPages - 1 ? buildUrl(basePath, currentPage + 1, size) : null;

        return JsonApiLinks.builder()
                .self(self)
                .first(first)
                .last(last)
                .prev(prev)
                .next(next)
                .build();
    }

    private static String buildUrl(String basePath, int page, int size) {
        return String.format("%s?page=%d&size=%d", basePath, page, size);
    }
}