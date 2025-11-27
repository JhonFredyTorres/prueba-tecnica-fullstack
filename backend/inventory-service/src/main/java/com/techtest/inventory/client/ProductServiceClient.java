package com.techtest.inventory.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techtest.inventory.dto.response.InventoryResponse.ProductInfo;
import com.techtest.inventory.exception.ProductServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

/**
 * Cliente HTTP para comunicarse con el microservicio de Productos.
 *
 * Características:
 * - Reintentos automáticos (3 intentos por defecto)
 * - Backoff exponencial entre reintentos
 * - Manejo de errores HTTP
 * - Logging detallado
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProductServiceClient {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${services.products.url}")
    private String productsServiceUrl;

    /**
     * Verifica si un producto existe en el servicio de productos.
     *
     * @Retryable: Si falla por timeout o error de servidor, reintenta automáticamente
     * - maxAttempts: número máximo de intentos (incluyendo el primero)
     * - backoff: tiempo entre reintentos (aumenta exponencialmente)
     * - retryFor: excepciones que disparan reintento
     */
    @Retryable(
            retryFor = {ResourceAccessException.class, HttpServerErrorException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public boolean productExists(Long productId) {
        String url = productsServiceUrl + "/products/" + productId + "/exists";
        log.debug("Verificando existencia de producto {} en: {}", productId, url);

        try {
            ResponseEntity<Boolean> response = restTemplate.getForEntity(url, Boolean.class);

            boolean exists = Boolean.TRUE.equals(response.getBody());
            log.debug("Producto {} existe: {}", productId, exists);
            return exists;

        } catch (HttpClientErrorException.NotFound e) {
            log.debug("Producto {} no encontrado (404)", productId);
            return false;
        } catch (HttpClientErrorException e) {
            log.error("Error del cliente al verificar producto {}: {} - {}",
                    productId, e.getStatusCode(), e.getMessage());
            throw new ProductServiceException(productId, "Error de cliente: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            log.error("Timeout al verificar producto {}: {}", productId, e.getMessage());
            throw e; // Se reintentará
        }
    }

    /**
     * Obtiene información detallada de un producto.
     * La respuesta viene en formato JSON:API.
     */
    @Retryable(
            retryFor = {ResourceAccessException.class, HttpServerErrorException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 1000, multiplier = 2)
    )
    public ProductInfo getProductInfo(Long productId) {
        String url = productsServiceUrl + "/products/" + productId;
        log.debug("Obteniendo información de producto {} desde: {}", productId, url);

        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            // Parsear respuesta JSON:API
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode attributes = root.path("data").path("attributes");

            ProductInfo productInfo = ProductInfo.builder()
                    .id(productId)
                    .name(attributes.path("name").asText(null))
                    .sku(attributes.path("sku").asText(null))
                    .category(attributes.path("category").asText(null))
                    .build();

            log.debug("Producto {} obtenido: {}", productId, productInfo.getName());
            return productInfo;

        } catch (HttpClientErrorException.NotFound e) {
            log.warn("Producto {} no encontrado", productId);
            throw new ProductServiceException(productId, "Producto no encontrado");
        } catch (HttpClientErrorException e) {
            log.error("Error del cliente al obtener producto {}: {}", productId, e.getStatusCode());
            throw new ProductServiceException(productId, "Error: " + e.getStatusCode());
        } catch (ResourceAccessException e) {
            log.error("Timeout al obtener producto {}: {}", productId, e.getMessage());
            throw e; // Se reintentará
        } catch (Exception e) {
            log.error("Error inesperado al obtener producto {}: {}", productId, e.getMessage());
            throw new ProductServiceException(productId, e.getMessage());
        }
    }

    /**
     * Método de recuperación cuando se agotan los reintentos.
     * Se ejecuta después de que fallen todos los intentos.
         */
    @Recover
    public boolean recoverProductExists(ResourceAccessException e, Long productId) {
        log.error("Todos los reintentos agotados para verificar producto {}. Error: {}",
                productId, e.getMessage());
        throw new ProductServiceException(
                "Servicio de productos no disponible después de múltiples intentos", e);
    }

    @Recover
    public ProductInfo recoverGetProductInfo(ResourceAccessException e, Long productId) {
        log.error("Todos los reintentos agotados para obtener producto {}. Error: {}",
                productId, e.getMessage());
        throw new ProductServiceException(
                "Servicio de productos no disponible después de múltiples intentos", e);
    }
}