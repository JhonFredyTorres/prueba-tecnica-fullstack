package com.techtest.products.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Configuración de OpenAPI/Swagger.
 *
 * Una vez que la aplicación esté corriendo, podemos acceder a:
 * - Swagger UI: http://localhost:8081/api/v1/swagger-ui.html
 * - JSON spec: http://localhost:8081/api/v1/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:8081}")
    private String serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "ApiKeyAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Products Service API")
                        .description("Microservicio de gestión de productos. " +
                                "Parte de la prueba técnica Full Stack.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Jhon Fredy Torres")
                                .email("jhon@example.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort + "/api/v1")
                                .description("Servidor de desarrollo"),
                        new Server()
                                .url("http://products-service:8081/api/v1")
                                .description("Servidor Docker")
                ))
                .addSecurityItem(new SecurityRequirement()
                        .addList(securitySchemeName))
                .components(new io.swagger.v3.oas.models.Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name("X-API-Key")
                                        .type(SecurityScheme.Type.APIKEY)
                                        .in(SecurityScheme.In.HEADER)
                                        .description("API Key para autenticación entre servicios")));
    }
}