package com.vocab.enterprise.repository;

import com.vocab.enterprise.model.PyqExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PyqExamRepository extends JpaRepository<PyqExam, Long> {
    Optional<PyqExam> findByTitle(String title);
    boolean existsByTitle(String title);
}
