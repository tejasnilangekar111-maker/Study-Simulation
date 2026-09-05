package com.studylibrary.app.controller;

import com.studylibrary.app.dto.FlashcardDto;
import com.studylibrary.app.service.FlashcardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/flashcards")
@RequiredArgsConstructor
public class FlashcardController {

    private final FlashcardService flashcardService;

    @GetMapping
    public ResponseEntity<List<FlashcardDto>> getAll(Authentication authentication) {
        return ResponseEntity.ok(flashcardService.getAllForUser(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<FlashcardDto> create(@Valid @RequestBody FlashcardDto dto, Authentication authentication) {
        FlashcardDto created = flashcardService.create(authentication.getName(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FlashcardDto> update(@PathVariable UUID id, @Valid @RequestBody FlashcardDto dto,
                                                Authentication authentication) {
        return ResponseEntity.ok(flashcardService.update(authentication.getName(), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication authentication) {
        flashcardService.delete(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
