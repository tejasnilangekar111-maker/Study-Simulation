package com.studylibrary.app.controller;

import com.studylibrary.app.dto.PomodoroActionRequest;
import com.studylibrary.app.dto.PomodoroSessionDto;
import com.studylibrary.app.dto.PomodoroStartRequest;
import com.studylibrary.app.service.PomodoroService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pomodoro")
@RequiredArgsConstructor
public class PomodoroController {

    private final PomodoroService pomodoroService;

    @PostMapping("/start")
    public ResponseEntity<PomodoroSessionDto> start(@Valid @RequestBody PomodoroStartRequest request,
                                                      Authentication authentication) {
        return ResponseEntity.ok(pomodoroService.start(authentication.getName(), request));
    }

    @PostMapping("/pause")
    public ResponseEntity<PomodoroSessionDto> pause(@Valid @RequestBody PomodoroActionRequest request,
                                                      Authentication authentication) {
        return ResponseEntity.ok(pomodoroService.pause(authentication.getName(), request.getSessionId()));
    }

    @PostMapping("/complete")
    public ResponseEntity<PomodoroSessionDto> complete(@Valid @RequestBody PomodoroActionRequest request,
                                                         Authentication authentication) {
        return ResponseEntity.ok(pomodoroService.complete(authentication.getName(), request.getSessionId()));
    }

    @GetMapping("/history")
    public ResponseEntity<List<PomodoroSessionDto>> history(Authentication authentication) {
        return ResponseEntity.ok(pomodoroService.getHistory(authentication.getName()));
    }
}
