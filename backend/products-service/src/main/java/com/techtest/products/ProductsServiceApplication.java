package com.techtest.products;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

/**
 * Clase principal del Microservicio de Productos.
 *
 * @SpringBootApplication combina:
 * - @Configuration: Esta clase puede definir beans
 * - @EnableAutoConfiguration: Spring Boot configura automáticamente
 * - @ComponentScan: Busca componentes en este paquete y subpaquetes
 */
@SpringBootApplication
@Slf4j
public class ProductsServiceApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(ProductsServiceApplication.class);
		Environment env = app.run(args).getEnvironment();

		String port = env.getProperty("server.port", "8081");
		String contextPath = env.getProperty("server.servlet.context-path", "");

		log.info("""
                
                ╔═══════════════════════════════════════════════════════════════╗
                ║           PRODUCTS SERVICE INICIADO EXITOSAMENTE              ║
                ╠═══════════════════════════════════════════════════════════════╣
                ║  Local:      http://localhost:{}{}                       ║
                ║  Swagger:    http://localhost:{}{}/swagger-ui.html       ║
                ║  API Docs:   http://localhost:{}{}/api-docs              ║
                ╚═══════════════════════════════════════════════════════════════╝
                """,
				port, contextPath,
				port, contextPath,
				port, contextPath);
	}
}