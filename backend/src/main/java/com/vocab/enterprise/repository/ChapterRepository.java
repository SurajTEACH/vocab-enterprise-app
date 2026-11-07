package com.vocab.enterprise.repository;

import com.vocab.enterprise.model.Chapter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {
    Optional<Chapter> findByDayNumber(Integer dayNumber);
}
