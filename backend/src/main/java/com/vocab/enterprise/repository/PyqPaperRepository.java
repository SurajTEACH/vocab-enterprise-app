package com.vocab.enterprise.repository;

import com.vocab.enterprise.model.PyqPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PyqPaperRepository extends JpaRepository<PyqPaper, Long> {
    List<PyqPaper> findByExamTitle(String examTitle);
    long countByExamTitle(String examTitle);
}
