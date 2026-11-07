package com.vocab.enterprise.service;

import com.vocab.enterprise.dto.VocabDTOs.*;
import com.vocab.enterprise.model.*;
import com.vocab.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DailyChallengeService {

    private final ChapterRepository chapterRepository;
    private final WordRepository wordRepository;
    private final QuestionRepository questionRepository;
    private final TestResultRepository testResultRepository;
    private final UserRepository userRepository;

    public DailyChallengeResponse getDailyChallenge(User user, Integer dayNumber) {
        int streak = (user != null && user.getCurrentStreak() != null) ? user.getCurrentStreak() : 0;
        int xp = (user != null && user.getTotalXp() != null) ? user.getTotalXp() : 0;

        Integer dayToFetch = (dayNumber != null) ? dayNumber : 1;
        Chapter chapter = chapterRepository.findByDayNumber(dayToFetch)
                .orElseGet(() -> chapterRepository.findAll().stream().findFirst().orElse(null));

        if (chapter == null) {
            return DailyChallengeResponse.builder()
                    .chapterId(1L)
                    .dayNumber(dayToFetch)
                    .chapterTitle("Day " + dayToFetch + ": Core Vocabulary")
                    .chapterDescription("Daily Vocabulary Learning Session")
                    .revisionWords(List.of())
                    .newWords(List.of())
                    .testQuestions(List.of())
                    .streakCount(streak)
                    .totalXp(xp)
                    .build();
        }

        List<Word> allWords = wordRepository.findByChapterId(chapter.getId());
        if (allWords == null) allWords = List.of();

        // Split into 15 Revision Words + 10 New Words
        int revisionCount = Math.min(15, allWords.size());
        List<Word> revisionWords = allWords.subList(0, revisionCount);
        List<Word> newWords = (allWords.size() > revisionCount) ? allWords.subList(revisionCount, allWords.size()) : List.of();

        List<Question> questions = questionRepository.findByChapterId(chapter.getId());
        if (questions == null) questions = List.of();

        return DailyChallengeResponse.builder()
                .chapterId(chapter.getId())
                .dayNumber(chapter.getDayNumber() != null ? chapter.getDayNumber() : dayToFetch)
                .chapterTitle(chapter.getTitle())
                .chapterDescription(chapter.getDescription())
                .revisionWords(revisionWords)
                .newWords(newWords)
                .testQuestions(questions)
                .streakCount(streak)
                .totalXp(xp)
                .build();
    }

    @Transactional
    public TestResultResponse submitTest(User user, TestSubmissionRequest request) {
        Chapter chapter = chapterRepository.findById(request.getChapterId())
                .orElseThrow(() -> new RuntimeException("Chapter not found"));

        List<Question> questions = questionRepository.findByChapterId(chapter.getId());
        Map<Long, Question> questionMap = questions.stream()
                .collect(Collectors.toMap(Question::getId, Function.identity()));

        int correctCount = 0;
        if (request.getAnswers() != null) {
            for (TestSubmissionRequest.AnswerItem ans : request.getAnswers()) {
                Question q = questionMap.get(ans.getQuestionId());
                if (q != null && q.getCorrectOption().equalsIgnoreCase(ans.getSelectedOption())) {
                    correctCount++;
                }
            }
        }

        int totalQuestions = questions.size();
        double accuracy = totalQuestions > 0 ? ((double) correctCount / totalQuestions) * 100 : 0.0;
        int xpEarned = correctCount * 20;

        // Save Test Result
        TestResult result = TestResult.builder()
                .user(user)
                .chapter(chapter)
                .score(correctCount)
                .totalQuestions(totalQuestions)
                .accuracyPercentage(accuracy)
                .build();
        testResultRepository.save(result);

        // Update User Streak & XP
        int curXp = user.getTotalXp() != null ? user.getTotalXp() : 0;
        int curStreak = user.getCurrentStreak() != null ? user.getCurrentStreak() : 0;
        user.setTotalXp(curXp + xpEarned);
        user.setCurrentStreak(curStreak + 1);
        userRepository.save(user);

        String feedback = accuracy >= 80 ? "Outstanding! Superb vocabulary retention!" : "Good effort! Practice daily for 100% accuracy!";

        return TestResultResponse.builder()
                .chapterId(chapter.getId())
                .score(correctCount)
                .totalQuestions(totalQuestions)
                .accuracyPercentage(accuracy)
                .xpEarned(xpEarned)
                .newStreak(user.getCurrentStreak())
                .feedbackMessage(feedback)
                .build();
    }
}
