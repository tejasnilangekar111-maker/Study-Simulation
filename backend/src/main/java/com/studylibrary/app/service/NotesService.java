package com.studylibrary.app.service;

import com.studylibrary.app.dto.NoteDto;
import com.studylibrary.app.entity.StudyNote;
import com.studylibrary.app.entity.User;
import com.studylibrary.app.exception.ResourceNotFoundException;
import com.studylibrary.app.repository.StudyNoteRepository;
import com.studylibrary.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotesService {

    private final StudyNoteRepository studyNoteRepository;
    private final UserRepository userRepository;

    public List<NoteDto> getAllForUser(String username) {
        User user = getUser(username);
        return studyNoteRepository.findByUserId(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public NoteDto create(String username, NoteDto dto) {
        User user = getUser(username);

        StudyNote note = new StudyNote();
        note.setUser(user);
        note.setTitle(dto.getTitle());
        note.setContent(dto.getContent());

        StudyNote saved = studyNoteRepository.save(note);
        return toDto(saved);
    }

    @Transactional
    public NoteDto update(String username, UUID id, NoteDto dto) {
        User user = getUser(username);
        StudyNote note = studyNoteRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + id));

        note.setTitle(dto.getTitle());
        note.setContent(dto.getContent());

        StudyNote saved = studyNoteRepository.save(note);
        return toDto(saved);
    }

    @Transactional
    public void delete(String username, UUID id) {
        User user = getUser(username);
        StudyNote note = studyNoteRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Note not found: " + id));
        studyNoteRepository.delete(note);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private NoteDto toDto(StudyNote note) {
        return new NoteDto(note.getId(), note.getTitle(), note.getContent(), note.getCreatedAt(), note.getUpdatedAt());
    }
}
