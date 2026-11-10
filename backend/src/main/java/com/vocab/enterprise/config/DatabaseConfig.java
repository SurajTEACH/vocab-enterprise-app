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
import java.net.InetAddress;
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

                StringBuilder jdbc = new StringBuilder("jdbc:mysql://").append(host).append(":").append(port).append(path);
                if (StringUtils.hasText(query)) {
                    String fixedQuery = query.replace("ssl-mode=", "sslMode=");
                    jdbc.append("?").append(fixedQuery);
                    if (!fixedQuery.contains("allowPublicKeyRetrieval")) {
                        jdbc.append("&allowPublicKeyRetrieval=true");
                    }
                } else {
                    jdbc.append("?sslMode=REQUIRED&allowPublicKeyRetrieval=true");
                }
                url = jdbc.toString();
                log.info("Auto-converted raw mysql:// URI to valid JDBC URL for cloud database.");
            } catch (Exception e) {
                log.warn("Could not parse URI structure, prepending jdbc:: {}", e.getMessage());
                url = "jdbc:" + url;
            }
        }

        // Verify host DNS resolution for MySQL to prevent Hikari blocking or crashing on deleted/invalid cloud hosts
        if (StringUtils.hasText(url) && url.contains(":mysql:")) {
            try {
                String cleanForUri = url.replace("jdbc:mysql://", "http://");
                int queryIdx = cleanForUri.indexOf('?');
                if (queryIdx > 0) cleanForUri = cleanForUri.substring(0, queryIdx);
                URI checkUri = new URI(cleanForUri);
                String checkHost = checkUri.getHost();
                if (StringUtils.hasText(checkHost) && !checkHost.equalsIgnoreCase("localhost") && !checkHost.equals("127.0.0.1")) {
                    InetAddress.getByName(checkHost);
                }
            } catch (Exception ex) {
                log.error("Cloud MySQL host is invalid or unreachable ({}) - switching to resilient in-memory database so the app stays 100% ONLINE!", ex.getMessage());
                url = "jdbc:h2:mem:Ward_Boost_app;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL";
                user = "sa";
                pass = "";
            }
        }

        // If still empty or not provided, fallback to in-memory H2
        if (!StringUtils.hasText(url)) {
            url = "jdbc:h2:mem:Ward_Boost_app;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL";
            user = "sa";
            pass = "";
        }

        log.info("Initializing DataSource with URL: {}", url.replaceAll(":[^/@]+@", ":****@"));

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        if (StringUtils.hasText(user)) {
            config.setUsername(user);
        }
        if (StringUtils.hasText(pass)) {
            config.setPassword(pass);
        }

        if (url.contains(":mysql:")) {
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            config.setMaximumPoolSize(5); // Render free tier friendly
            config.setMinimumIdle(1);
            config.setConnectionTimeout(10000); // 10s connection timeout
            config.setIdleTimeout(600000);
            config.setMaxLifetime(1800000);
        } else if (url.contains(":h2:")) {
            config.setDriverClassName("org.h2.Driver");
        }

        return new HikariDataSource(config);
    }
}
