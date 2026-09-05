package com.studylibrary.app.controller;

import com.studylibrary.app.dto.NoteDto;
import com.studylibrary.app.service.NotesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NotesController {

    private final NotesService notesService;

    @GetMapping
    public ResponseEntity<List<NoteDto>> getAll(Authentication authentication) {
        return ResponseEntity.ok(notesService.getAllForUser(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<NoteDto> create(@Valid @RequestBody NoteDto dto, Authentication authentication) {
        NoteDto created = notesService.create(authentication.getName(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteDto> update(@PathVariable UUID id, @Valid @RequestBody NoteDto dto,
                                           Authentication authentication) {
        return ResponseEntity.ok(notesService.update(authentication.getName(), id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication authentication) {
        notesService.delete(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
