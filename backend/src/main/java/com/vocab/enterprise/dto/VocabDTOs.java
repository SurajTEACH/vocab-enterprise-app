package com.vocab.enterprise.dto;

import com.vocab.enterprise.model.Question;
import com.vocab.enterprise.model.Word;
import lombok.*;

import java.util.List;

public class VocabDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyChallengeResponse {
        private Long chapterId;
        private Integer dayNumber;
        private String chapterTitle;
        private String chapterDescription;
        private List<Word> revisionWords; // 15 Revision Words
        private List<Word> newWords;      // 10 New Words
        private List<Question> testQuestions; // Daily Test Questions
        private Integer streakCount;
        private Integer totalXp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestSubmissionRequest {
        private Long chapterId;
        private List<AnswerItem> answers;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class AnswerItem {
            private Long questionId;
            private String selectedOption; // "A", "B", "C", "D"
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TestResultResponse {
        private Long chapterId;
        private Integer score;
        private Integer totalQuestions;
        private Double accuracyPercentage;
        private Integer xpEarned;
        private Integer newStreak;
        private String feedbackMessage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChapterCreateRequest {
        private Integer dayNumber;
        private String title;
        private String description;
        private String iconName;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WordCreateRequest {
        private Long chapterId;
        private String word;
        private String phonetic;
        private String meaning;
        private String hindiMeaning;
        private String exampleSentence;
        private String partOfSpeech;
        private String audioUrl;
        private String category;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IdiomCreateRequest {
        private Long chapterId;
        private String idiomPhrase;
        private String meaning;
        private String hindiMeaning;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OneWordSubstitutionCreateRequest {
        private Long chapterId;
        private String phrase;
        private String oneWord;
        private String partOfSpeech;
        private String hindiMeaning;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HomonymHomophoneCreateRequest {
        private Long chapterId;
        private String word;
        private String meaning;
        private String hindiMeaning;
        private String partOfSpeech;
        private String similarWordsJson;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RootWordCreateRequest {
        private Long chapterId;
        private String rootWord;
        private String meaningJson;
        private String examplesJson;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class QuestionCreateRequest {
        private Long chapterId;
        private String questionText;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String correctOption;
        private String explanation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserPermissionRequest {
        private Long userId;
        private String role;
        private String studentPermissionsJson;
        private String crudPermissionsJson;
    }

    /**
     * Safe User Response DTO — password field is NEVER included.
     * Used by ManagerController /students endpoint instead of raw User entity.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserDto {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private String mobileNumber;
        private String profileImage;
        private String city;
        private String targetExam;
        private String role;
        private Integer currentStreak;
        private Integer totalXp;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ProfileUpdateRequest {
        private Long userId;
        private String fullName;
        private String email;
        private String mobileNumber;
        private String city;
        private String targetExam;
        private String profileImage;
        private String password;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayStudyResponse {
        private Integer dayNumber;
        private String category;
        private Integer totalCategoryWords;
        private List<Word> revisionWords;
        private List<Word> newWords;
        private List<Word> allWords;
    }
}
