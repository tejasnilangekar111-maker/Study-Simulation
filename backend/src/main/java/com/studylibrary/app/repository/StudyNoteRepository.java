package com.studylibrary.app.repository;

import com.studylibrary.app.entity.StudyNote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudyNoteRepository extends JpaRepository<StudyNote, UUID> {

    List<StudyNote> findByUserId(UUID userId);

    Optional<StudyNote> findByIdAndUserId(UUID id, UUID userId);
}
