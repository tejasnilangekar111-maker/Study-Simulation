package com.studylibrary.app.controller;

import com.studylibrary.app.dto.WeeklyAnalyticsResponse;
import com.studylibrary.app.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/weekly")
    public ResponseEntity<WeeklyAnalyticsResponse> weekly(Authentication authentication) {
        return ResponseEntity.ok(analyticsService.getWeeklyAnalytics(authentication.getName()));
    }
}
