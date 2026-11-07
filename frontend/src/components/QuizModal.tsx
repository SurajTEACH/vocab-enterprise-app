import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Question, TestResult } from '../types';
import { theme } from '../theme';

interface QuizModalProps {
  visible: boolean;
  questions: Question[];
  chapterId: number;
  onClose: () => void;
  onSubmit: (answers: { questionId: number; selectedOption: string }[]) => Promise<TestResult>;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  visible,
  questions,
  chapterId,
  onClose,
  onSubmit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  if (!questions || questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const isSelected = selectedAnswers[currentQ?.id];

  const handleOptionSelect = (optionKey: string) => {
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: optionKey }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmitTest = async () => {
    setSubmitting(true);
    const answersList = questions.map(q => ({
      questionId: q.id,
      selectedOption: selectedAnswers[q.id] || ''
    }));

    const res = await onSubmit(answersList);
    setResult(res);
    setSubmitting(false);
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setResult(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={resetQuiz} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
          </View>

          <Text style={styles.counterText}>{currentIndex + 1}/{questions.length}</Text>
        </View>

        {result ? (
          <ScrollView contentContainerStyle={styles.resultContainer}>
            <Text style={styles.resultEmoji}>{result.accuracyPercentage >= 80 ? '🎉' : '💪'}</Text>
            <Text style={styles.resultTitle}>Daily Quiz Completed!</Text>
            <Text style={styles.resultSubtitle}>{result.feedbackMessage}</Text>

            <View style={styles.scoreCard}>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Score</Text>
                <Text style={styles.scoreVal}>{result.score} / {result.totalQuestions}</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>Accuracy</Text>
                <Text style={[styles.scoreVal, { color: theme.colors.primary }]}>{result.accuracyPercentage.toFixed(0)}%</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>XP Earned</Text>
                <Text style={[styles.scoreVal, { color: theme.colors.yellow }]}>+{result.xpEarned} XP</Text>
              </View>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLabel}>New Streak</Text>
                <Text style={[styles.scoreVal, { color: theme.colors.orange }]}>🔥 {result.newStreak} Days</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.finishBtn} onPress={resetQuiz}>
              <Text style={styles.finishBtnText}>Continue Learning</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.quizBody}>
            <Text style={styles.questionLabel}>QUESTION {currentIndex + 1}</Text>
            <Text style={styles.questionText}>{currentQ.questionText}</Text>

            <View style={styles.optionsList}>
              {[
                { key: 'A', text: currentQ.optionA },
                { key: 'B', text: currentQ.optionB },
                { key: 'C', text: currentQ.optionC },
                { key: 'D', text: currentQ.optionD },
              ].map(opt => {
                const selected = isSelected === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    activeOpacity={0.8}
                    style={[
                      styles.optionCard,
                      selected && styles.optionCardSelected
                    ]}
                    onPress={() => handleOptionSelect(opt.key)}
                  >
                    <View style={[styles.optionKeyBadge, selected && styles.optionKeyBadgeSelected]}>
                      <Text style={[styles.optionKeyText, selected && styles.optionKeyTextSelected]}>{opt.key}</Text>
                    </View>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{opt.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.navRow}>
              {currentIndex > 0 && (
                <TouchableOpacity style={styles.prevBtn} onPress={handlePrev}>
                  <Text style={styles.prevBtnText}>Previous</Text>
                </TouchableOpacity>
              )}

              {currentIndex < questions.length - 1 ? (
                <TouchableOpacity
                  style={[styles.nextBtn, !isSelected && styles.disabledBtn]}
                  onPress={handleNext}
                  disabled={!isSelected}
                >
                  <Text style={styles.nextBtnText}>Next Question →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.submitBtn, (!isSelected || submitting) && styles.disabledBtn]}
                  onPress={handleSubmitTest}
                  disabled={!isSelected || submitting}
                >
                  <Text style={styles.submitBtnText}>{submitting ? 'Evaluating...' : 'Finish & Submit Test ✓'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgDark,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: theme.colors.textMuted,
    fontSize: 22,
    fontWeight: '700',
  },
  progressContainer: {
    flex: 1,
    height: 12,
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 6,
  },
  counterText: {
    color: theme.colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  quizBody: {
    padding: 24,
  },
  questionLabel: {
    color: theme.colors.skyBlue,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  questionText: {
    color: theme.colors.textLight,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 24,
  },
  optionsList: {
    gap: 12,
    marginBottom: 30,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardDark,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.surfaceDark,
    gap: 14,
  },
  optionCardSelected: {
    borderColor: theme.colors.skyBlue,
    backgroundColor: '#1E293B',
  },
  optionKeyBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionKeyBadgeSelected: {
    backgroundColor: theme.colors.skyBlue,
  },
  optionKeyText: {
    color: theme.colors.textLight,
    fontSize: 16,
    fontWeight: '800',
  },
  optionKeyTextSelected: {
    color: '#FFFFFF',
  },
  optionText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  prevBtn: {
    backgroundColor: theme.colors.surfaceDark,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  prevBtnText: {
    color: theme.colors.textLight,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: theme.colors.skyBlue,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 16,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  resultContainer: {
    alignItems: 'center',
    padding: 30,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  resultTitle: {
    color: theme.colors.textLight,
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
  },
  resultSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreCard: {
    backgroundColor: theme.colors.cardDark,
    width: '100%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.surfaceDark,
    gap: 14,
    marginBottom: 30,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    color: theme.colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  scoreVal: {
    color: theme.colors.textLight,
    fontSize: 18,
    fontWeight: '800',
  },
  finishBtn: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  finishBtnText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 18,
  },
});
