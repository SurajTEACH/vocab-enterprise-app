package com.vocab.enterprise.controller;

import com.vocab.enterprise.model.*;
import com.vocab.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/pyq", "/pyq"})
@RequiredArgsConstructor
public class PyqController {

    private final PyqExamRepository pyqExamRepository;
    private final PyqPaperRepository pyqPaperRepository;
    private final QuestionSheetCategoryRepository questionSheetCategoryRepository;
    private final QuestionSheetPaperRepository questionSheetPaperRepository;

    // ── PYQ EXAMS ──────────────────────────────────────────────────────────────
    @GetMapping("/exams")
    public ResponseEntity<List<PyqExam>> getExams() {
        return ResponseEntity.ok(pyqExamRepository.findAll());
    }

    @PostMapping("/exams")
    public ResponseEntity<PyqExam> createExam(@RequestBody PyqExam exam) {
        if (pyqExamRepository.existsByTitle(exam.getTitle())) {
            return ResponseEntity.ok(pyqExamRepository.findByTitle(exam.getTitle()).orElse(exam));
        }
        return ResponseEntity.ok(pyqExamRepository.save(exam));
    }

    // ── PYQ PAPERS ─────────────────────────────────────────────────────────────
    @GetMapping("/papers")
    public ResponseEntity<List<PyqPaper>> getPapers(@RequestParam(value = "examTitle", required = false) String examTitle) {
        if (examTitle != null && !examTitle.trim().isEmpty()) {
            return ResponseEntity.ok(pyqPaperRepository.findByExamTitle(examTitle.trim()));
        }
        return ResponseEntity.ok(pyqPaperRepository.findAll());
    }

    @PostMapping("/papers")
    public ResponseEntity<PyqPaper> createPaper(@RequestBody PyqPaper paper) {
        PyqPaper saved = pyqPaperRepository.save(paper);
        pyqExamRepository.findByTitle(paper.getExamTitle()).ifPresent(exam -> {
            long count = pyqPaperRepository.countByExamTitle(paper.getExamTitle());
            exam.setCountText(count + " Papers");
            pyqExamRepository.save(exam);
        });
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/papers/{id}")
    public ResponseEntity<PyqPaper> updatePaper(@PathVariable("id") Long id, @RequestBody PyqPaper paperDetails) {
        return pyqPaperRepository.findById(id).map(existing -> {
            existing.setPaperName(paperDetails.getPaperName());
            if (paperDetails.getFileSize() != null) existing.setFileSize(paperDetails.getFileSize());
            if (paperDetails.getFileUrl() != null) existing.setFileUrl(paperDetails.getFileUrl());
            return ResponseEntity.ok(pyqPaperRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/papers/{id}")
    public ResponseEntity<Void> deletePaper(@PathVariable("id") Long id) {
        pyqPaperRepository.findById(id).ifPresent(p -> {
            String examTitle = p.getExamTitle();
            pyqPaperRepository.deleteById(id);
            pyqExamRepository.findByTitle(examTitle).ifPresent(exam -> {
                long count = pyqPaperRepository.countByExamTitle(examTitle);
                exam.setCountText(count + " Papers");
                pyqExamRepository.save(exam);
            });
        });
        return ResponseEntity.noContent().build();
    }

    // ── QUESTION SHEET CATEGORIES ──────────────────────────────────────────────
    @GetMapping("/sheets/categories")
    public ResponseEntity<List<QuestionSheetCategory>> getSheetCategories() {
        return ResponseEntity.ok(questionSheetCategoryRepository.findAll());
    }

    @PostMapping("/sheets/categories")
    public ResponseEntity<QuestionSheetCategory> createSheetCategory(@RequestBody QuestionSheetCategory category) {
        if (questionSheetCategoryRepository.existsByTitle(category.getTitle())) {
            return ResponseEntity.ok(questionSheetCategoryRepository.findByTitle(category.getTitle()).orElse(category));
        }
        return ResponseEntity.ok(questionSheetCategoryRepository.save(category));
    }

    // ── QUESTION SHEET PAPERS ──────────────────────────────────────────────────
    @GetMapping("/sheets/papers")
    public ResponseEntity<List<QuestionSheetPaper>> getSheetPapers(@RequestParam(value = "categoryTitle", required = false) String categoryTitle) {
        if (categoryTitle != null && !categoryTitle.trim().isEmpty()) {
            return ResponseEntity.ok(questionSheetPaperRepository.findByCategoryTitle(categoryTitle.trim()));
        }
        return ResponseEntity.ok(questionSheetPaperRepository.findAll());
    }

    @PostMapping("/sheets/papers")
    public ResponseEntity<QuestionSheetPaper> createSheetPaper(@RequestBody QuestionSheetPaper paper) {
        QuestionSheetPaper saved = questionSheetPaperRepository.save(paper);
        questionSheetCategoryRepository.findByTitle(paper.getCategoryTitle()).ifPresent(cat -> {
            long count = questionSheetPaperRepository.countByCategoryTitle(paper.getCategoryTitle());
            cat.setCountText(count + " Sheets");
            questionSheetCategoryRepository.save(cat);
        });
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/sheets/papers/{id}")
    public ResponseEntity<QuestionSheetPaper> updateSheetPaper(@PathVariable("id") Long id, @RequestBody QuestionSheetPaper paperDetails) {
        return questionSheetPaperRepository.findById(id).map(existing -> {
            existing.setPaperName(paperDetails.getPaperName());
            if (paperDetails.getFileSize() != null) existing.setFileSize(paperDetails.getFileSize());
            if (paperDetails.getFileUrl() != null) existing.setFileUrl(paperDetails.getFileUrl());
            return ResponseEntity.ok(questionSheetPaperRepository.save(existing));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/sheets/papers/{id}")
    public ResponseEntity<Void> deleteSheetPaper(@PathVariable("id") Long id) {
        questionSheetPaperRepository.findById(id).ifPresent(p -> {
            String catTitle = p.getCategoryTitle();
            questionSheetPaperRepository.deleteById(id);
            questionSheetCategoryRepository.findByTitle(catTitle).ifPresent(cat -> {
                long count = questionSheetPaperRepository.countByCategoryTitle(catTitle);
                cat.setCountText(count + " Sheets");
                questionSheetCategoryRepository.save(cat);
            });
        });
        return ResponseEntity.noContent().build();
    }
}
