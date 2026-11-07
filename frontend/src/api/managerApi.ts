import { axiosClient } from './axiosClient';

export interface ChapterCreateRequest {
  dayNumber: number;
  title: string;
  description: string;
  iconName?: string;
}

export interface WordCreateRequest {
  chapterId: number;
  word: string;
  phonetic: string;
  meaning: string;
  hindiMeaning: string;
  exampleSentence: string;
  partOfSpeech: string;
  audioUrl?: string;
  category?: string;
}

export interface QuestionCreateRequest {
  chapterId: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
}

export const managerApi = {
  /**
   * Manager API: Fetch all Chapters/Days from MySQL Database
   */
  async getChapters() {
    const response = await axiosClient.get('/manager/chapters');
    return response.data;
  },

  /**
   * Manager API: Fetch all Words from MySQL Database
   */
  async getWords() {
    const response = await axiosClient.get('/manager/words');
    return response.data;
  },

  /**
   * Manager API: Fetch Words by Chapter ID from MySQL Database
   */
  async getChapterWords(chapterId: number) {
    const response = await axiosClient.get(`/manager/words/chapter/${chapterId}`);
    return response.data;
  },

  /**
   * Spaced-Repetition Day Study API:
   * Dynamically fetches 15 Revision Words (from Day N-1) + 15 New Words (for Day N) from MySQL DB pool.
   */
  async getDayStudyWords(category: string, dayNumber: number) {
    const response = await axiosClient.get(`/manager/words/day-study?category=${encodeURIComponent(category)}&dayNumber=${dayNumber}`);
    return response.data;
  },

  /**
   * Manager API: Create new Chapter/Day via Axios
   */
  async createChapter(payload: ChapterCreateRequest) {
    const response = await axiosClient.post('/manager/chapters', payload);
    return response.data;
  },

  /**
   * Manager API: Add new Vocabulary Word to Chapter via Axios
   */
  async createWord(payload: WordCreateRequest) {
    const response = await axiosClient.post('/manager/words', payload);
    return response.data;
  },

  /**
   * Manager API: Add Question to Chapter via Axios
   */
  async createQuestion(payload: QuestionCreateRequest) {
    const response = await axiosClient.post('/manager/questions', payload);
    return response.data;
  },

  /**
   * Manager API: Fetch all Questions from MySQL Database (for Sectional Mock Test)
   */
  async getQuestions() {
    const response = await axiosClient.get('/manager/questions');
    return response.data;
  },

  /**
   * Manager API: Fetch Questions for a specific Chapter/Day (for Day-Wise Test)
   */
  async getChapterQuestions(chapterId: number) {
    const response = await axiosClient.get(`/manager/questions/chapter/${chapterId}`);
    return response.data;
  },

  /**
   * Manager API: Fetch real registered students list from backend
   */
  async getStudents() {
    const response = await axiosClient.get('/manager/students');
    return response.data;
  },

  /**
   * Manager API: Save new User to database via Backend API
   */
  async createUser(payload: any) {
    const response = await axiosClient.post('/auth/register', payload);
    return response.data;
  },

  /**
   * Manager API: Get User Permissions from backend DB
   */
  async getUserPermissions(userId: number) {
    const response = await axiosClient.get(`/manager/permissions/${userId}`);
    return response.data;
  },

  /**
   * Manager API: Save User Permissions to backend DB
   */
  async saveUserPermissions(payload: {
    userId: number;
    role: string;
    studentPermissionsJson: string;
    crudPermissionsJson: string;
  }) {
    const response = await axiosClient.post('/manager/permissions', payload);
    return response.data;
  },

  /**
   * MNC Level Profile API: Fetch user profile directly from MySQL Database
   */
  async getProfile(userId: number) {
    const response = await axiosClient.get(`/manager/profile/${userId}`);
    return response.data;
  },

  async getProfileByEmail(email: string) {
    const response = await axiosClient.get(`/manager/profile/email/${encodeURIComponent(email)}`);
    return response.data;
  },

  /**
   * MNC Level Profile API: Update user profile data & photo in MySQL Database
   */
  async updateProfile(payload: {
    userId: number;
    fullName?: string;
    email?: string;
    mobileNumber?: string;
    city?: string;
    targetExam?: string;
    profileImage?: string;
    password?: string;
  }) {
    const response = await axiosClient.put('/manager/profile', payload);
    return response.data;
  },

  // ── PYQ & QUESTION SHEETS API (MySQL Database Integration) ─────────────────
  async getPyqExams() {
    const response = await axiosClient.get('/pyq/exams');
    return response.data;
  },

  async createPyqExam(payload: { title: string; description?: string; category?: string }) {
    const response = await axiosClient.post('/pyq/exams', payload);
    return response.data;
  },

  async getPyqPapers(examTitle?: string) {
    const url = examTitle ? `/pyq/papers?examTitle=${encodeURIComponent(examTitle)}` : '/pyq/papers';
    const response = await axiosClient.get(url);
    return response.data;
  },

  async createPyqPaper(payload: any) {
    const response = await axiosClient.post('/pyq/papers', payload);
    return response.data;
  },

  async updatePyqPaper(id: number, payload: any) {
    const response = await axiosClient.put(`/pyq/papers/${id}`, payload);
    return response.data;
  },

  async deletePyqPaper(id: number) {
    const response = await axiosClient.delete(`/pyq/papers/${id}`);
    return response.data;
  },

  async getQuestionSheetCategories() {
    const response = await axiosClient.get('/pyq/sheets/categories');
    return response.data;
  },

  async createQuestionSheetCategory(payload: { title: string; description?: string }) {
    const response = await axiosClient.post('/pyq/sheets/categories', payload);
    return response.data;
  },

  async getQuestionSheetPapers(categoryTitle?: string) {
    const url = categoryTitle ? `/pyq/sheets/papers?categoryTitle=${encodeURIComponent(categoryTitle)}` : '/pyq/sheets/papers';
    const response = await axiosClient.get(url);
    return response.data;
  },

  async createQuestionSheetPaper(payload: any) {
    const response = await axiosClient.post('/pyq/sheets/papers', payload);
    return response.data;
  },

  async updateQuestionSheetPaper(id: number, payload: any) {
    const response = await axiosClient.put(`/pyq/sheets/papers/${id}`, payload);
    return response.data;
  },

  async deleteQuestionSheetPaper(id: number) {
    const response = await axiosClient.delete(`/pyq/sheets/papers/${id}`);
    return response.data;
  },

  // ── ENTERPRISE REAL-TIME ANALYTICS & VISIT TRACKING API ─────────────────
  async recordVisit(payload: { visitorId: string; userId?: number; platform?: string }) {
    const response = await axiosClient.post('/analytics/visit', payload);
    return response.data;
  },

  async getAnalyticsOverview() {
    const response = await axiosClient.get('/analytics/overview');
    return response.data;
  },

  async getMonthlyUsage(year?: number, month?: number) {
    let url = '/analytics/monthly-usage';
    const params: string[] = [];
    if (year) params.push(`year=${year}`);
    if (month) params.push(`month=${month}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    const response = await axiosClient.get(url);
    return response.data;
  }
};


