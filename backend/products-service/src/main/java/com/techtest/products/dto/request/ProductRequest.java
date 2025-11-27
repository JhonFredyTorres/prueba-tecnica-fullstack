package com.techtest.products.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * DTO para crear o actualizar un producto.
 *
 * Las validaciones (@NotBlank, @NotNull, etc.) se ejecutan automáticamente
 * cuando usas @Valid en el controller.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    @NotBlank(message = "El nombre es obligatorio")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    private String name;

    @Size(max = 500, message = "La descripción no puede exceder 500 caracteres")
    private String description;

    @NotNull(message = "El precio es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio debe ser mayor a 0")
    @Digits(integer = 8, fraction = 2, message = "El precio debe tener máximo 8 dígitos enteros y 2 decimales")
    private BigDecimal price;

    @NotBlank(message = "La categoría es obligatoria")
    @Size(max = 50, message = "La categoría no puede exceder 50 caracteres")
    private String category;

    @NotBlank(message = "El SKU es obligatorio")
    @Size(min = 3, max = 50, message = "El SKU debe tener entre 3 y 50 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9-_]+$", message = "El SKU solo puede contener letras, números, guiones y guiones bajos")
    private String sku;

    private Boolean active = true;
}