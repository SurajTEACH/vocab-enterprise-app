export interface Word {
  id: number;
  word: string;
  phonetic?: string;
  meaning: string;
  hindiMeaning?: string;
  exampleSentence?: string;
  partOfSpeech?: string;
  audioUrl?: string;
}

export interface Question {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
}

export interface DailyChallenge {
  chapterId: number;
  dayNumber: number;
  chapterTitle: string;
  chapterDescription: string;
  revisionWords: Word[];
  newWords: Word[];
  testQuestions: Question[];
  streakCount: number;
  totalXp: number;
}

export interface TestSubmission {
  chapterId: number;
  answers: {
    questionId: number;
    selectedOption: string;
  }[];
}

export interface TestResult {
  chapterId: number;
  score: number;
  totalQuestions: number;
  accuracyPercentage: number;
  xpEarned: number;
  newStreak: number;
  feedbackMessage: string;
}

export interface UserProfile {
  username: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'MANAGER' | 'ADMIN';
  streak: number;
  totalXp: number;
}
