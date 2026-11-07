import { axiosClient } from './axiosClient';
import { DailyChallenge, TestResult, TestSubmission } from '../types';
import { EMPTY_DAILY_CHALLENGE } from './mockData';

export const vocabApi = {
  /**
   * Fetch Daily Challenge by Day number using Axios (strictly from MySQL Backend DB)
   */
  async getDailyChallenge(day: number = 1): Promise<DailyChallenge> {
    try {
      const response = await axiosClient.get<DailyChallenge>(`/daily/challenge?day=${day}`);
      if (response.data && (response.data.revisionWords || response.data.newWords)) {
        return response.data;
      }
      return EMPTY_DAILY_CHALLENGE;
    } catch (error) {
      console.warn('Daily challenge endpoint warning, returning empty state:', error);
      return EMPTY_DAILY_CHALLENGE;
    }
  },

  /**
   * Submit Daily Test using Axios (strictly via Backend DB API)
   */
  async submitDailyTest(submission: TestSubmission): Promise<TestResult> {
    try {
      const response = await axiosClient.post<TestResult>('/daily/submit-test', submission);
      return response.data;
    } catch (error) {
      console.warn('Test submission API error:', error);
      const total = submission.answers?.length || 0;
      return {
        chapterId: submission.chapterId,
        score: 0,
        totalQuestions: total,
        accuracyPercentage: 0,
        xpEarned: 0,
        newStreak: 1,
        feedbackMessage: 'Test submitted.'
      };
    }
  }
};
