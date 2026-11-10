package com.vocab.enterprise.controller;

import com.vocab.enterprise.dto.VocabDTOs.*;
import com.vocab.enterprise.model.*;
import com.vocab.enterprise.service.ManagerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/manager", "/manager"})
@RequiredArgsConstructor
public class ManagerController {

    private final ManagerService managerService;

    @GetMapping("/chapters")
    public ResponseEntity<List<Chapter>> getChapters() {
        return ResponseEntity.ok(managerService.getAllChapters());
    }

    @PostMapping("/chapters")
    public ResponseEntity<Chapter> createChapter(@RequestBody ChapterCreateRequest request) {
        return ResponseEntity.ok(managerService.createChapter(request));
    }

    @GetMapping("/words")
    public ResponseEntity<List<Word>> getWords() {
        return ResponseEntity.ok(managerService.getAllWords());
    }

    @GetMapping("/words/chapter/{chapterId}")
    public ResponseEntity<List<Word>> getChapterWords(@PathVariable("chapterId") Long chapterId) {
        return ResponseEntity.ok(managerService.getWordsByChapterId(chapterId));
    }

    /**
     * Dynamic Spaced-Repetition Endpoint:
     * Returns 15 Revision (from Day N-1) + 15 New Words (for Day N) from MySQL database category pool.
     */
    @GetMapping("/words/day-study")
    public ResponseEntity<DayStudyResponse> getDayStudyWords(
            @RequestParam(value = "category", required = false, defaultValue = "Synonyms") String category,
            @RequestParam(value = "dayNumber", required = false, defaultValue = "1") int dayNumber) {
        return ResponseEntity.ok(managerService.getDayStudyWords(category, dayNumber));
    }

    @PostMapping("/words")
    public ResponseEntity<Word> addWord(@RequestBody WordCreateRequest request) {
        return ResponseEntity.ok(managerService.addWord(request));
    }

    @PostMapping("/questions")
    public ResponseEntity<Question> addQuestion(@RequestBody QuestionCreateRequest request) {
        return ResponseEntity.ok(managerService.addQuestion(request));
    }

    /**
     * GET /api/manager/questions — All questions from DB (for Sectional Mock Test)
     */
    @GetMapping("/questions")
    public ResponseEntity<List<Question>> getAllQuestions() {
        return ResponseEntity.ok(managerService.getAllQuestions());
    }

    /**
     * GET /api/manager/questions/chapter/{chapterId} — Questions for a specific Day/Chapter (Day-Wise Test)
     */
    @GetMapping("/questions/chapter/{chapterId}")
    public ResponseEntity<List<Question>> getChapterQuestions(@PathVariable("chapterId") Long chapterId) {
        return ResponseEntity.ok(managerService.getQuestionsByChapter(chapterId));
    }

    /**
     * GET /api/manager/students — Returns ALL registered users (safe DTO, no password).
     * Accessible only by MANAGER / ADMIN role (enforced by SecurityConfig).
     */
    @GetMapping("/students")
    public ResponseEntity<List<UserDto>> getStudents() {
        return ResponseEntity.ok(managerService.getAllStudents());
    }

    @GetMapping("/scores")
    public ResponseEntity<List<TestResult>> getScores() {
        return ResponseEntity.ok(managerService.getAllTestResults());
    }

    @GetMapping("/permissions/{userId}")
    public ResponseEntity<UserPermission> getUserPermission(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(managerService.getUserPermission(userId));
    }

    @PostMapping("/permissions")
    public ResponseEntity<UserPermission> saveUserPermission(@RequestBody UserPermissionRequest request) {
        return ResponseEntity.ok(managerService.saveUserPermission(request));
    }

    /**
     * GET /api/manager/profile/{userId} — Fetches real user profile directly from MySQL DB
     */
    @GetMapping("/profile/{userId}")
    public ResponseEntity<UserDto> getUserProfile(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(managerService.getUserProfile(userId));
    }

    @GetMapping("/profile/email/{email}")
    public ResponseEntity<UserDto> getUserProfileByEmail(@PathVariable("email") String email) {
        return ResponseEntity.ok(managerService.getUserProfileByEmail(email));
    }

    /**
     * PUT /api/manager/profile — Updates user profile in MySQL DB and triggers real-time WebSocket update
     */
    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(@RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(managerService.updateUserProfile(request));
    }
}
