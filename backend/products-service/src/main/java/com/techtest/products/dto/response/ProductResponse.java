package com.techtest.products.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO que representa un producto en la respuesta de la API.
 *
 * No exponemos la entidad directamente porque:
 * 1. Podemos controlar qué campos mostrar
 * 2. Podemos formatear datos (fechas, precios)
 * 3. Desacoplamos la API de la base de datos
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)  // No incluye campos null en el JSON
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private BigDecimal price;
    private String category;
    private String sku;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}