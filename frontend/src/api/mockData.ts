import { DailyChallenge } from '../types';

export const EMPTY_DAILY_CHALLENGE: DailyChallenge = {
  chapterId: 1,
  dayNumber: 1,
  chapterTitle: 'Daily Vocabulary Challenge',
  chapterDescription: 'Master vocabulary & communication terms from MySQL database.',
  streakCount: 1,
  totalXp: 0,
  revisionWords: [],
  newWords: [],
  testQuestions: []
};

export const MOCK_DAILY_CHALLENGE = EMPTY_DAILY_CHALLENGE;
