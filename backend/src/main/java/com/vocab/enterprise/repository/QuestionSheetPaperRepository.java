package com.vocab.enterprise.repository;

import com.vocab.enterprise.model.QuestionSheetPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionSheetPaperRepository extends JpaRepository<QuestionSheetPaper, Long> {
    List<QuestionSheetPaper> findByCategoryTitle(String categoryTitle);
    long countByCategoryTitle(String categoryTitle);
}
