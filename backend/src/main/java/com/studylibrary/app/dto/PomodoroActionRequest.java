package com.studylibrary.app.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class PomodoroActionRequest {

    @NotNull
    private UUID sessionId;
}
