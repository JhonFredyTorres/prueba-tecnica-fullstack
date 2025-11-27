package com.techtest.inventory;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.env.Environment;

@SpringBootApplication
@Slf4j
public class InventoryServiceApplication {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(InventoryServiceApplication.class);
		Environment env = app.run(args).getEnvironment();

		String port = env.getProperty("server.port", "8082");
		String contextPath = env.getProperty("server.servlet.context-path", "");
		String productsUrl = env.getProperty("services.products.url", "http://localhost:8081/api/v1");

		log.info("""
                
                ╔═══════════════════════════════════════════════════════════════╗
                ║          INVENTORY SERVICE INICIADO EXITOSAMENTE              ║
                ╠═══════════════════════════════════════════════════════════════╣
                ║  Local:         http://localhost:{}{}                    ║
                ║  Swagger:       http://localhost:{}{}/swagger-ui.html    ║
                ║  Products URL:  {}                       ║
                ╚═══════════════════════════════════════════════════════════════╝
                """,
				port, contextPath,
				port, contextPath,
				productsUrl);
	}
}