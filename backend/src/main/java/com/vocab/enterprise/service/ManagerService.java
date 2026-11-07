package com.vocab.enterprise.service;

import com.vocab.enterprise.dto.VocabDTOs.*;
import com.vocab.enterprise.model.*;
import com.vocab.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ManagerService {

    private final ChapterRepository chapterRepository;
    private final WordRepository wordRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final TestResultRepository testResultRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final PasswordEncoder passwordEncoder;

    /** WebSocket broker — used to push real-time permission updates to clients */
    private final SimpMessagingTemplate messagingTemplate;

    public List<Chapter> getAllChapters() {
        return chapterRepository.findAll();
    }

    public Chapter createChapter(ChapterCreateRequest request) {
        Chapter chapter = Chapter.builder()
                .dayNumber(request.getDayNumber())
                .title(request.getTitle())
                .description(request.getDescription())
                .iconName(request.getIconName() != null ? request.getIconName() : "book")
                .build();
        Chapter saved = chapterRepository.save(chapter);
        messagingTemplate.convertAndSend("/topic/chapters/updates", saved);
        return saved;
    }

    public Word addWord(WordCreateRequest request) {
        Long chapterId = request.getChapterId() != null ? request.getChapterId() : 1L;
        Chapter chapter = chapterRepository.findById(chapterId)
                .orElseGet(() -> chapterRepository.findAll().stream().findFirst()
                        .orElseGet(() -> createChapter(ChapterCreateRequest.builder().dayNumber(1).title("Day 1: Essential Foundations").description("Essential Vocabulary").build())));

        Word word = Word.builder()
                .chapter(chapter)
                .word(request.getWord())
                .phonetic(request.getPhonetic())
                .meaning(request.getMeaning())
                .hindiMeaning(request.getHindiMeaning())
                .exampleSentence(request.getExampleSentence())
                .partOfSpeech(request.getPartOfSpeech() != null ? request.getPartOfSpeech() : "Noun")
                .audioUrl(request.getAudioUrl())
                .category(request.getCategory() != null ? request.getCategory() : "Synonyms")
                .build();

        Word saved = wordRepository.save(word);
        messagingTemplate.convertAndSend("/topic/words/updates", saved);
        return saved;
    }

    public List<Word> getAllWords() {
        return wordRepository.findAll();
    }

    public List<Word> getWordsByChapterId(Long chapterId) {
        return wordRepository.findByChapterId(chapterId);
    }

    /**
     * Dynamic Spaced-Repetition Day Algorithm:
     * - Day 1: 15 New Words from database category pool.
     * - Day N (N >= 2): 15 Revision Words (from Day N-1) + 15 New Words from category pool.
     * Total = 30 words per day (15 Revision + 15 New).
     */
    public DayStudyResponse getDayStudyWords(String categoryName, int dayNumber) {
        int targetDay = Math.max(1, dayNumber);
        String catClean = categoryName != null ? categoryName.trim().toLowerCase().replace("words", "").trim() : "synonym";

        List<Word> allCategoryWords = wordRepository.findAll().stream()
                .filter(w -> categoryName == null || categoryName.trim().isEmpty()
                        || (w.getCategory() != null && w.getCategory().toLowerCase().contains(catClean))
                        || (catClean.contains("synonym") && (w.getCategory() == null || w.getCategory().equalsIgnoreCase("Synonyms"))))
                .toList();

        if (allCategoryWords.isEmpty()) {
            allCategoryWords = wordRepository.findAll();
        }

        int totalWords = allCategoryWords.size();
        List<Word> revisionWords = new ArrayList<>();
        List<Word> newWords = new ArrayList<>();

        if (totalWords > 0) {
            int newWordsCount = 15;
            int revisionWordsCount = (targetDay > 1) ? 15 : 0;

            int newWordsStart = (targetDay - 1) * newWordsCount;
            int revisionWordsStart = (targetDay > 1) ? (targetDay - 2) * newWordsCount : 0;

            // Pick 15 New Words for Day N
            for (int i = 0; i < newWordsCount; i++) {
                int index = (newWordsStart + i) % totalWords;
                newWords.add(allCategoryWords.get(index));
            }

            // Pick 15 Revision Words from Day N-1 if dayNumber > 1
            if (targetDay > 1) {
                for (int i = 0; i < revisionWordsCount; i++) {
                    int index = (revisionWordsStart + i) % totalWords;
                    revisionWords.add(allCategoryWords.get(index));
                }
            }
        }

        List<Word> combined = new ArrayList<>();
        combined.addAll(revisionWords);
        combined.addAll(newWords);

        return DayStudyResponse.builder()
                .dayNumber(targetDay)
                .category(categoryName)
                .totalCategoryWords(totalWords)
                .revisionWords(revisionWords)
                .newWords(newWords)
                .allWords(combined)
                .build();
    }

    public Question addQuestion(QuestionCreateRequest request) {
        Chapter chapter = chapterRepository.findById(request.getChapterId())
                .orElseThrow(() -> new RuntimeException("Chapter not found"));

        Question question = Question.builder()
                .chapter(chapter)
                .questionText(request.getQuestionText())
                .optionA(request.getOptionA())
                .optionB(request.getOptionB())
                .optionC(request.getOptionC())
                .optionD(request.getOptionD())
                .correctOption(request.getCorrectOption())
                .explanation(request.getExplanation())
                .build();

        return questionRepository.save(question);
    }

    /** Returns all questions from DB (used by Sectional Mock Test) */
    public List<Question> getAllQuestions() {
        return questionRepository.findAll();
    }

    /** Returns questions for a specific chapter/day (used by Day-Wise Test) */
    public List<Question> getQuestionsByChapter(Long chapterId) {
        return questionRepository.findByChapterId(chapterId);
    }

    /**
     * Returns all registered users (safe DTO — no password exposed).
     * Manager panel Users tab shows ALL users regardless of role.
     */
    public List<UserDto> getAllStudents() {
        return userRepository.findAll().stream()
                .map(u -> UserDto.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .fullName(u.getFullName())
                        .mobileNumber(u.getMobileNumber())
                        .profileImage(u.getProfileImage())
                        .city(u.getCity())
                        .targetExam(u.getTargetExam())
                        .role(u.getRole().name())
                        .currentStreak(u.getCurrentStreak())
                        .totalXp(u.getTotalXp())
                        .build())
                .toList();
    }

    /**
     * MNC Level Profile Update Service Method.
     * Persists all profile fields & image into MySQL database, and broadcasts
     * real-time WebSocket update event to /topic/profile/{userId}.
     */
    @Transactional
    public UserDto updateUserProfile(ProfileUpdateRequest request) {
        log.info("Updating user profile for userId: {}, email: {}", request.getUserId(), request.getEmail());
        User user = null;
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            user = userRepository.findByEmail(request.getEmail().trim())
                    .orElseGet(() -> userRepository.findByUsername(request.getEmail().trim()).orElse(null));
        }
        if (user == null && request.getUserId() != null) {
            user = userRepository.findById(request.getUserId()).orElse(null);
        }
        if (user == null) {
            user = userRepository.findAll().stream().findFirst().orElse(null);
        }
        if (user == null) {
            user = User.builder()
                    .username(request.getEmail() != null ? request.getEmail().trim() : "student_user")
                    .email(request.getEmail() != null ? request.getEmail().trim() : "student@vocab.com")
                    .password("$2a$10$defaultPasswordHash")
                    .fullName(request.getFullName() != null ? request.getFullName().trim() : "Student User")
                    .role(User.Role.STUDENT)
                    .currentStreak(1)
                    .totalXp(100)
                    .build();
        }

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty()) {
            String newEmail = request.getEmail().trim();
            if (!newEmail.equalsIgnoreCase(user.getEmail())) {
                if (!userRepository.existsByEmail(newEmail)) {
                    user.setEmail(newEmail);
                } else {
                    log.warn("Email {} is already registered to another user; keeping current email", newEmail);
                }
            }
        }
        if (request.getMobileNumber() != null) {
            user.setMobileNumber(request.getMobileNumber().trim());
        }
        if (request.getCity() != null) {
            user.setCity(request.getCity().trim());
        }
        if (request.getTargetExam() != null) {
            user.setTargetExam(request.getTargetExam().trim());
        }
        if (request.getProfileImage() != null) {
            user.setProfileImage(request.getProfileImage());
        }
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword().trim()));
            log.info("Successfully updated password for user: {}", user.getUsername());
        }

        User saved = userRepository.save(user);

        UserDto dto = UserDto.builder()
                .id(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .fullName(saved.getFullName())
                .mobileNumber(saved.getMobileNumber())
                .profileImage(saved.getProfileImage())
                .city(saved.getCity())
                .targetExam(saved.getTargetExam())
                .role(saved.getRole().name())
                .currentStreak(saved.getCurrentStreak())
                .totalXp(saved.getTotalXp())
                .build();

        // 🚀 Real-time WebSocket broadcasts
        messagingTemplate.convertAndSend("/topic/profile/" + saved.getId(), dto);
        messagingTemplate.convertAndSend("/topic/profile/updates", dto);

        log.info("Profile successfully updated for user {} and broadcast via WebSocket", saved.getId());
        return dto;
    }

    @Transactional(readOnly = true)
    public UserDto getUserProfile(Long userId) {
        User user = null;
        if (userId != null) {
            user = userRepository.findById(userId).orElse(null);
        }
        if (user == null) {
            user = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        return convertToUserDto(user);
    }

    @Transactional(readOnly = true)
    public UserDto getUserProfileByEmail(String email) {
        User user = null;
        if (email != null && !email.trim().isEmpty()) {
            user = userRepository.findByEmail(email.trim())
                    .orElseGet(() -> userRepository.findByUsername(email.trim()).orElse(null));
        }
        if (user == null) {
            user = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        return convertToUserDto(user);
    }


    private UserDto convertToUserDto(User saved) {
        return UserDto.builder()
                .id(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .fullName(saved.getFullName())
                .mobileNumber(saved.getMobileNumber())
                .profileImage(saved.getProfileImage())
                .city(saved.getCity())
                .targetExam(saved.getTargetExam())
                .role(saved.getRole().name())
                .currentStreak(saved.getCurrentStreak())
                .totalXp(saved.getTotalXp())
                .build();
    }

    public List<TestResult> getAllTestResults() {
        return testResultRepository.findAll();
    }

    @Transactional(readOnly = true)
    public UserPermission getUserPermission(Long userId) {
        return userPermissionRepository.findByUserId(userId)
                .orElseGet(() -> {
                    // Default permission fallback
                    String defaultStudentPerms = "{\"synonyms\":true,\"antonyms\":true,\"idioms\":true,\"rootWords\":true,\"oneWord\":true,\"dayWiseTest\":true,\"sectionalTest\":true,\"pyqQuestion\":true,\"questionSheet\":true}";
                    return UserPermission.builder()
                            .userId(userId)
                            .role("Student")
                            .studentPermissionsJson(defaultStudentPerms)
                            .crudPermissionsJson("{}")
                            .build();
                });
    }

    @Transactional
    public UserPermission saveUserPermission(UserPermissionRequest request) {
        log.info("Saving user permission to DB for userId: {}, role: {}", request.getUserId(), request.getRole());

        if (request.getUserId() == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        UserPermission permission = userPermissionRepository.findByUserId(request.getUserId())
                .orElseGet(() -> UserPermission.builder().userId(request.getUserId()).build());

        permission.setRole(request.getRole());
        permission.setStudentPermissionsJson(request.getStudentPermissionsJson());
        permission.setCrudPermissionsJson(request.getCrudPermissionsJson());

        UserPermission saved = userPermissionRepository.save(permission);

        // Update User role if user exists in DB
        userRepository.findById(request.getUserId()).ifPresent(user -> {
            try {
                user.setRole(User.Role.valueOf(request.getRole().toUpperCase()));
                userRepository.save(user);
                log.info("Successfully updated user role in DB to {}", request.getRole());
            } catch (Exception e) {
                log.warn("Could not map role enum for string: {}", request.getRole());
            }
        });

        log.info("User permission successfully persisted in DB with id: {}", saved.getId());

        // 🚀 Real-time WebSocket broadcast — push permission update to the specific user's topic channel
        // Frontend clients subscribed to /topic/permissions/{userId} receive this instantly
        messagingTemplate.convertAndSend(
                "/topic/permissions/" + saved.getUserId(),
                saved
        );
        log.info("🔔 WebSocket broadcast sent to /topic/permissions/{}", saved.getUserId());

        return saved;
    }
}


