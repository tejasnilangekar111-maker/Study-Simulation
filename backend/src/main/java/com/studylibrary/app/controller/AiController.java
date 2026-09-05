package com.studylibrary.app.controller;

import com.studylibrary.app.ai.AiService;
import com.studylibrary.app.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/quiz")
    public ResponseEntity<QuizResponse> quiz(@Valid @RequestBody QuizRequest request) {
        return ResponseEntity.ok(aiService.generateQuiz(request.getTopic(), request.getNumberOfQuestions()));
    }

    @PostMapping("/summary")
    public ResponseEntity<SummaryResponse> summary(@Valid @RequestBody SummaryRequest request) {
        return ResponseEntity.ok(aiService.summarize(request.getContent()));
    }
}
