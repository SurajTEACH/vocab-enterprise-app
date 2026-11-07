package com.vocab.enterprise.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Enterprise WebSocket Configuration (STOMP over SockJS).
 *
 * - /ws       : WebSocket handshake endpoint (SockJS fallback enabled)
 * - /topic    : Broadcast prefix (server → all subscribed clients)
 * - /app      : Message routing prefix (client → server)
 *
 * Used for real-time permission push notifications.
 * When a manager updates a student's permissions, the backend
 * broadcasts the change to /topic/permissions/{userId} and
 * the frontend updates the UI instantly — no polling required.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple in-memory broker with /topic and /queue destinations
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix for @MessageMapping controller methods
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Main WebSocket endpoint — SockJS fallback for browsers that don't support WS
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}
