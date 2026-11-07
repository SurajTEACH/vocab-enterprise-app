package com.vocab.enterprise.repository;

import com.vocab.enterprise.model.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WordRepository extends JpaRepository<Word, Long> {
    List<Word> findByChapterId(Long chapterId);
}
