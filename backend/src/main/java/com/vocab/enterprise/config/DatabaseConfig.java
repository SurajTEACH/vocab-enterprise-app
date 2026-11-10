package com.vocab.enterprise.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:}")
    private String configuredUrl;

    @Value("${spring.datasource.username:}")
    private String configuredUsername;

    @Value("${spring.datasource.password:}")
    private String configuredPassword;

    @Bean
    @Primary
    public DataSource dataSource() {
        String url = configuredUrl;
        String user = configuredUsername;
        String pass = configuredPassword;

        // Check if DATABASE_URL or SPRING_DATASOURCE_URL environment variables are provided
        if (!StringUtils.hasText(url) || url.contains(":h2:mem:")) {
            String envSpringUrl = System.getenv("SPRING_DATASOURCE_URL");
            String envDbUrl = System.getenv("DATABASE_URL");
            if (StringUtils.hasText(envSpringUrl)) {
                url = envSpringUrl;
            } else if (StringUtils.hasText(envDbUrl)) {
                url = envDbUrl;
            }
        }

        // Auto-fix if url starts with mysql:// (e.g. raw Aiven or Render URL)
        if (StringUtils.hasText(url) && url.startsWith("mysql://")) {
            try {
                URI uri = new URI(url);
                String host = uri.getHost();
                int port = uri.getPort() > 0 ? uri.getPort() : 3306;
                String path = uri.getPath(); // e.g. /defaultdb
                String query = uri.getQuery();
                String userInfo = uri.getUserInfo();

                if (StringUtils.hasText(userInfo) && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    if (!StringUtils.hasText(user) || "sa".equalsIgnoreCase(user) || "root".equalsIgnoreCase(user)) {
                        user = parts[0];
                    }
                    if (!StringUtils.hasText(pass)) {
                        pass = parts[1];


    }
}
