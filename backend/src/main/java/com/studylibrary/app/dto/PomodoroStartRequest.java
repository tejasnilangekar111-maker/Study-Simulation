package com.studylibrary.app.dto;

import com.studylibrary.app.entity.PomodoroSession;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PomodoroStartRequest {

    @Min(1)
    private int durationMinutes;

    @NotNull
    private PomodoroSession.SessionType sessionType;
}
