package com.studylibrary.app.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pomodoro_sessions")
@Getter
@Setter
public class PomodoroSession {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int durationMinutes;

    @Column(nullable = false)
    private boolean completed = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionType sessionType;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    public enum SessionType {
        WORK, SHORT_BREAK, LONG_BREAK
    }
}
