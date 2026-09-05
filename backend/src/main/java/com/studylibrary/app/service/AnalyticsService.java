package com.studylibrary.app.service;

import com.studylibrary.app.dto.DailyAnalytics;
import com.studylibrary.app.dto.WeeklyAnalyticsResponse;
import com.studylibrary.app.entity.AnalyticsSnapshot;
import com.studylibrary.app.entity.User;
import com.studylibrary.app.exception.ResourceNotFoundException;
import com.studylibrary.app.repository.AnalyticsSnapshotRepository;
import com.studylibrary.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsSnapshotRepository analyticsSnapshotRepository;
    private final UserRepository userRepository;

    public WeeklyAnalyticsResponse getWeeklyAnalytics(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6);

        List<AnalyticsSnapshot> snapshots =
                analyticsSnapshotRepository.findByUserIdAndDateBetweenOrderByDateAsc(user.getId(), start, today);

        Map<LocalDate, AnalyticsSnapshot> byDate = snapshots.stream()
                .collect(Collectors.toMap(AnalyticsSnapshot::getDate, s -> s));

        List<DailyAnalytics> days = start.datesUntil(today.plusDays(1))
                .map(date -> {
                    AnalyticsSnapshot snapshot = byDate.get(date);
                    int focusMinutes = snapshot != null ? snapshot.getFocusMinutes() : 0;
                    int completedSessions = snapshot != null ? snapshot.getCompletedSessions() : 0;
                    return new DailyAnalytics(date, focusMinutes, completedSessions);
                })
                .toList();

        return new WeeklyAnalyticsResponse(days);
    }

    /**
     * Increments today's snapshot for the given user, creating it if it does not yet exist.
     */
    public void recordCompletedSession(UUID userId, int durationMinutes) {
        LocalDate today = LocalDate.now();
        AnalyticsSnapshot snapshot = analyticsSnapshotRepository.findByUserIdAndDate(userId, today)
                .orElseGet(() -> {
                    AnalyticsSnapshot s = new AnalyticsSnapshot();
                    s.setDate(today);
                    return s;
                });

        if (snapshot.getUser() == null) {
            User user = userRepository.getReferenceById(userId);
            snapshot.setUser(user);
        }

        snapshot.setFocusMinutes(snapshot.getFocusMinutes() + durationMinutes);
        snapshot.setCompletedSessions(snapshot.getCompletedSessions() + 1);

        analyticsSnapshotRepository.save(snapshot);
    }
}
