package com.studylibrary.app.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.Duration;
import java.util.Map;

/**
 * Handles real-time Pomodoro timer control messages from clients over STOMP/WebSocket.
 * Clients send START / PAUSE / SKIP commands to /app/pomodoro/{sessionId}; the current
 * state (kept in Redis, keyed by session id) is broadcast back to everyone subscribed
 * to /topic/pomodoro/{sessionId}.
 */
@Controller
@RequiredArgsConstructor
public class PomodoroWebSocketController {

    private static final String REDIS_KEY_PREFIX = "pomodoro:ws:";

    private final RedisTemplate<String, Object> redisTemplate;

    @MessageMapping("/pomodoro/{sessionId}")
    @SendTo("/topic/pomodoro/{sessionId}")
    public Map<String, Object> handleTimerEvent(@DestinationVariable String sessionId, Map<String, Object> payload) {
        String action = String.valueOf(payload.getOrDefault("action", "")).toUpperCase();
        String redisKey = REDIS_KEY_PREFIX + sessionId;

        Map<String, Object> state = switch (action) {
            case "START" -> Map.of("sessionId", sessionId, "status", "RUNNING", "action", action);
            case "PAUSE" -> Map.of("sessionId", sessionId, "status", "PAUSED", "action", action);
            case "SKIP" -> Map.of("sessionId", sessionId, "status", "SKIPPED", "action", action);
            default -> Map.of("sessionId", sessionId, "status", "UNKNOWN", "action", action);
        };

        redisTemplate.opsForValue().set(redisKey, state, Duration.ofHours(6));

        return state;
    }
}
