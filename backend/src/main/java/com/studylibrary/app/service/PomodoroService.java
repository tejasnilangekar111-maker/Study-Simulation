package com.studylibrary.app.service;

import com.studylibrary.app.dto.PomodoroSessionDto;
import com.studylibrary.app.dto.PomodoroStartRequest;
import com.studylibrary.app.entity.PomodoroSession;
import com.studylibrary.app.entity.User;
import com.studylibrary.app.exception.ResourceNotFoundException;
import com.studylibrary.app.repository.PomodoroSessionRepository;
import com.studylibrary.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PomodoroService {

    private static final String ACTIVE_SESSION_KEY_PREFIX = "pomodoro:active:user:";

    private final PomodoroSessionRepository pomodoroSessionRepository;
    private final UserRepository userRepository;
    private final AnalyticsService analyticsService;
    private final RedisTemplate<String, Object> redisTemplate;

    @Transactional
    public PomodoroSessionDto start(String username, PomodoroStartRequest request) {
        User user = getUser(username);

        PomodoroSession session = new PomodoroSession();
        session.setUser(user);
        session.setDurationMinutes(request.getDurationMinutes());
        session.setSessionType(request.getSessionType());
        session.setCompleted(false);
        session.setStartedAt(LocalDateTime.now());

        PomodoroSession saved = pomodoroSessionRepository.save(session);

        cacheActiveSession(user.getId(), saved);

        return PomodoroSessionDto.fromEntity(saved);
    }

    @Transactional
    public PomodoroSessionDto pause(String username, UUID sessionId) {
        User user = getUser(username);
        PomodoroSession session = getOwnedSession(sessionId, user.getId());

        // Pausing does not persist a terminal state on the entity itself; the live
        // "paused" flag is tracked in Redis so the timer can resume from where it left off.
        cacheActiveSession(user.getId(), session, "PAUSED");

        return PomodoroSessionDto.fromEntity(session);
    }

    @Transactional
    public PomodoroSessionDto complete(String username, UUID sessionId) {
        User user = getUser(username);
        PomodoroSession session = getOwnedSession(sessionId, user.getId());

        session.setCompleted(true);
        session.setCompletedAt(LocalDateTime.now());
        PomodoroSession saved = pomodoroSessionRepository.save(session);

        updateStreak(user);
        analyticsService.recordCompletedSession(user.getId(), saved.getDurationMinutes());

        clearActiveSession(user.getId());

        return PomodoroSessionDto.fromEntity(saved);
    }

    public List<PomodoroSessionDto> getHistory(String username) {
        User user = getUser(username);
        return pomodoroSessionRepository.findByUserIdOrderByStartedAtDesc(user.getId()).stream()
                .map(PomodoroSessionDto::fromEntity)
                .toList();
    }

    /**
     * Streak logic: if the user completed a session yesterday, extend the streak;
     * otherwise (first session ever, or a gap day), reset the streak to 1.
     */
    private void updateStreak(User user) {
        LocalDate today = LocalDate.now();
        LocalDateTime yesterdayStart = today.minusDays(1).atStartOfDay();
        LocalDateTime todayStart = today.atStartOfDay();

        List<PomodoroSession> completedYesterday = pomodoroSessionRepository
                .findByUserIdAndCompletedTrueAndCompletedAtBetween(user.getId(), yesterdayStart, todayStart);

        if (!completedYesterday.isEmpty()) {
            user.setStreak(user.getStreak() + 1);
        } else {
            user.setStreak(1);
        }

        userRepository.save(user);
    }

    private void cacheActiveSession(UUID userId, PomodoroSession session) {
        cacheActiveSession(userId, session, "RUNNING");
    }

    private void cacheActiveSession(UUID userId, PomodoroSession session, String status) {
        String key = ACTIVE_SESSION_KEY_PREFIX + userId;
        Map<String, Object> state = Map.of(
                "sessionId", session.getId().toString(),
                "status", status,
                "durationMinutes", session.getDurationMinutes(),
                "sessionType", session.getSessionType().name()
        );
        redisTemplate.opsForValue().set(key, state, Duration.ofHours(6));
    }

    private void clearActiveSession(UUID userId) {
        redisTemplate.delete(ACTIVE_SESSION_KEY_PREFIX + userId);
    }

    private PomodoroSession getOwnedSession(UUID sessionId, UUID userId) {
        PomodoroSession session = pomodoroSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Pomodoro session not found: " + sessionId));

        if (!session.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Pomodoro session not found: " + sessionId);
        }

        return session;
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }
}
