package com.techtest.products.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techtest.products.dto.response.JsonApiErrorResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * Filtro de seguridad que valida API Key en las peticiones.
  */
@Component
@Slf4j
public class ApiKeyFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-Key";

    @Value("${api.security.key}")
    private String apiKey;

    // Endpoints que NO requieren API Key
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/swagger-ui",
            "/api-docs",
            "/v3/api-docs",
            "/actuator",
            "/health"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Si es un endpoint público, dejar pasar sin validar
        if (isPublicPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Obtener API Key del header
        String requestApiKey = request.getHeader(API_KEY_HEADER);

        // Validar que exista la API Key
        if (requestApiKey == null || requestApiKey.isEmpty()) {
            log.warn("Request sin API Key para path: {}", path);
            sendUnauthorizedResponse(response, "API Key requerida. Envía el header X-API-Key");
            return;
        }

        // Validar que la API Key sea correcta
        if (!apiKey.equals(requestApiKey)) {
            log.warn("API Key inválida recibida para path: {}", path);
            sendUnauthorizedResponse(response, "API Key inválida");
            return;
        }

        log.debug("API Key válida para path: {}", path);
        filterChain.doFilter(request, response);
    }

    /**
     * Verifica si el path es público (no requiere autenticación)
     */
    private boolean isPublicPath(String path) {
        return PUBLIC_PATHS.stream().anyMatch(path::contains);
    }

    /**
     * Envía respuesta 401 Unauthorized en formato JSON:API
     */
    private void sendUnauthorizedResponse(HttpServletResponse response, String message)
            throws IOException {

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        JsonApiErrorResponse errorResponse = JsonApiErrorResponse.of(
                "401",
                "UNAUTHORIZED",
                "No autorizado",
                message
        );

        ObjectMapper mapper = new ObjectMapper();
        mapper.findAndRegisterModules(); // Para serializar LocalDateTime
        response.getWriter().write(mapper.writeValueAsString(errorResponse));
    }
}