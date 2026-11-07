package com.vocab.enterprise.repository;

import com.vocab.enterprise.model.QuestionSheetCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface QuestionSheetCategoryRepository extends JpaRepository<QuestionSheetCategory, Long> {
    Optional<QuestionSheetCategory> findByTitle(String title);
    boolean existsByTitle(String title);
}
