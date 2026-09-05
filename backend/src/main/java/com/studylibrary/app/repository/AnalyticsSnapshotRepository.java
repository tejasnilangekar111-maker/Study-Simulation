package com.studylibrary.app.repository;

import com.studylibrary.app.entity.AnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnalyticsSnapshotRepository extends JpaRepository<AnalyticsSnapshot, UUID> {

    Optional<AnalyticsSnapshot> findByUserIdAndDate(UUID userId, LocalDate date);

    List<AnalyticsSnapshot> findByUserIdAndDateBetweenOrderByDateAsc(UUID userId, LocalDate start, LocalDate end);
}
