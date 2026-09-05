package com.studylibrary.app.service;

import com.studylibrary.app.dto.FlashcardDto;
import com.studylibrary.app.entity.Flashcard;
import com.studylibrary.app.entity.User;
import com.studylibrary.app.exception.ResourceNotFoundException;
import com.studylibrary.app.repository.FlashcardRepository;
import com.studylibrary.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FlashcardService {

    private final FlashcardRepository flashcardRepository;
    private final UserRepository userRepository;

    public List<FlashcardDto> getAllForUser(String username) {
        User user = getUser(username);
        return flashcardRepository.findByUserId(user.getId()).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public FlashcardDto create(String username, FlashcardDto dto) {
        User user = getUser(username);

        Flashcard flashcard = new Flashcard();
        flashcard.setUser(user);
        flashcard.setQuestion(dto.getQuestion());
        flashcard.setAnswer(dto.getAnswer());

        Flashcard saved = flashcardRepository.save(flashcard);
        return toDto(saved);
    }

    @Transactional
    public FlashcardDto update(String username, UUID id, FlashcardDto dto) {
        User user = getUser(username);
        Flashcard flashcard = flashcardRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found: " + id));

        flashcard.setQuestion(dto.getQuestion());
        flashcard.setAnswer(dto.getAnswer());

        Flashcard saved = flashcardRepository.save(flashcard);
        return toDto(saved);
    }

    @Transactional
    public void delete(String username, UUID id) {
        User user = getUser(username);
        Flashcard flashcard = flashcardRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Flashcard not found: " + id));
        flashcardRepository.delete(flashcard);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private FlashcardDto toDto(Flashcard flashcard) {
        return new FlashcardDto(flashcard.getId(), flashcard.getQuestion(), flashcard.getAnswer(), flashcard.getCreatedAt());
    }
}
