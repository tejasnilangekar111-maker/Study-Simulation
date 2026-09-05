package com.studylibrary.app.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.GenericFilterBean;

import java.io.IOException;
import java.time.Duration;

/**
 * Fixed-window rate limiter for the public /api/auth/** endpoints (register, login,
 * forgot-password, reset-password), backed by Redis so the limit holds even if the
 * backend is scaled to multiple instances. These endpoints are permitAll in
 * {@link SecurityConfig}, which makes them the obvious brute-force/spam target.
 */
@Component
@RequiredArgsConstructor
public class AuthRateLimitFilter extends GenericFilterBean {

    private static final int LIMIT = 10;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String path = request.getRequestURI();

        if (!path.startsWith("/api/auth/")) {
            chain.doFilter(request, response);
            return;
        }

        String key = "ratelimit:auth:" + request.getRemoteAddr() + ":" + path;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1L) {
            redisTemplate.expire(key, WINDOW);
        }

        if (count != null && count > LIMIT) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"message\":\"Too many requests. Please try again later.\"}");
            return;
        }

        chain.doFilter(request, response);
    }
}
