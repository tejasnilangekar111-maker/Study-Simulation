package com.studylibrary.app.repository;

import com.studylibrary.app.entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FlashcardRepository extends JpaRepository<Flashcard, UUID> {

    List<Flashcard> findByUserId(UUID userId);

    Optional<Flashcard> findByIdAndUserId(UUID id, UUID userId);
}
