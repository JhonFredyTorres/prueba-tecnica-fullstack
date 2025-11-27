package com.techtest.products.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO que representa un producto en la respuesta de la API.
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