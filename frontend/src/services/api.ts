import { DailyChallenge, TestResult, TestSubmission } from '../types';
import { MOCK_DAILY_CHALLENGE } from '../api/mockData';
export { MOCK_DAILY_CHALLENGE };

import { vocabApi } from '../api/vocabApi';

export async function fetchDailyChallenge(token?: string, day: number = 1): Promise<DailyChallenge> {
  return await vocabApi.getDailyChallenge(day);
}

export async function submitDailyTest(submission: TestSubmission, token?: string): Promise<TestResult> {
  return await vocabApi.submitDailyTest(submission);
}
