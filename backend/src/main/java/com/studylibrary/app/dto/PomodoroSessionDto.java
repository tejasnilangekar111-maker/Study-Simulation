package com.studylibrary.app.dto;

import com.studylibrary.app.entity.PomodoroSession;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PomodoroSessionDto {

    private UUID id;
    private int durationMinutes;
    private boolean completed;
    private PomodoroSession.SessionType sessionType;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public static PomodoroSessionDto fromEntity(PomodoroSession session) {
        return new PomodoroSessionDto(
                session.getId(),
                session.getDurationMinutes(),
                session.isCompleted(),
                session.getSessionType(),
                session.getStartedAt(),
                session.getCompletedAt()
        );
    }
}
