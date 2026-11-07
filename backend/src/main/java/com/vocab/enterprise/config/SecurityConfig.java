package com.vocab.enterprise.config;

import jakarta.servlet.DispatcherType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(DispatcherType.ERROR, DispatcherType.FORWARD, DispatcherType.ASYNC).permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // ── 1. Anonymous & Public Endpoints ─────────────────────────
                .requestMatchers(
                    "/error",
                    "/api/auth/**",
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/api-docs/**",
                    "/swagger-ui.html",
                    "/h2-console/**",
                    "/ws/**",
                    "/ws/info/**",
                    "/api/analytics/**",
                    "/api/manager/analytics/**"
                ).permitAll()

                // ── 2. Read-Only Public Learning & Preview Endpoints ────────
                .requestMatchers(HttpMethod.GET, "/api/daily/challenge").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/manager/words/day-study").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/manager/words", "/api/manager/words/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/manager/chapters", "/api/manager/chapters/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/pyq/exams", "/api/pyq/papers").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/pyq/sheets/categories", "/api/pyq/sheets/papers").permitAll()

                // ── 3. Authenticated User & Profile Endpoints ───────────────
                .requestMatchers("/api/manager/profile/**").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/manager/profile").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/daily/submit-test").authenticated()

                // ── 4. Manager & Admin Strict RBAC Management Endpoints ─────
                .requestMatchers("/api/manager/students", "/api/manager/students/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers("/api/manager/permissions", "/api/manager/permissions/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers("/api/manager/scores", "/api/manager/scores/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/manager/chapters/**", "/api/manager/words/**", "/api/manager/questions/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/manager/chapters/**", "/api/manager/words/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/manager/chapters/**", "/api/manager/words/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/pyq/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/pyq/**").hasAnyRole("MANAGER", "ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/pyq/**").hasAnyRole("MANAGER", "ADMIN")

                // ── 5. Everything Else Requires Authentication ──────────────
                .anyRequest().authenticated()
            )
            .headers(headers -> headers
                .frameOptions(HeadersConfigurer.FrameOptionsConfig::disable)
                .contentTypeOptions(content -> {})
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        String allowedOrigins = System.getenv("ALLOWED_ORIGINS");
        if (allowedOrigins != null && !allowedOrigins.isBlank()) {
            configuration.setAllowedOrigins(List.of(allowedOrigins.split(",")));
        } else {
            configuration.setAllowedOriginPatterns(List.of("*"));
        }
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
