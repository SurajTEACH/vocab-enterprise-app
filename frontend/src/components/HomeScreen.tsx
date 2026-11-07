import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal
} from 'react-native';
import {
  BookOpen,
  ArrowLeftRight,
  Sparkles,
  Target,
  Volume2,
  GitFork,
  Home as HomeIcon,
  BrainCircuit,
  User as UserIcon,
  Crown,
  Flame,
  Zap,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Lock,
  X,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ChevronRight,
  FileText,
  Download,
  Eye,
  ExternalLink
} from 'lucide-react-native';
import { managerApi } from '../api';
import { VocabularyCard } from './VocabularyCard';
import { QuizModal } from './QuizModal';
import { ManagerPanelModal, PdfInAppViewer } from './ManagerPanelModal';
import { LearningPathScreen } from './LearningPathScreen';
import { QuizTestScreen } from './QuizTestScreen';
import { ProfileScreen } from './ProfileScreen';
import { submitDailyTest } from '../services/api';
import { DailyChallenge, Word } from '../types';
import { usePermissions } from '../context/PermissionContext';

const logoImg = require('../../assets/word_boost_logo1.png');

interface HomeScreenProps {
  challenge: DailyChallenge;
  onNavigateToWelcome: () => void;
  onNavigateToPricing: () => void;
  userRole: 'STUDENT' | 'MANAGER';
  currentUser?: any;
  onToggleRole: () => void;
  onLogout?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  challenge: initialChallenge,
  onNavigateToWelcome,
  onNavigateToPricing,
  userRole,
  currentUser,
  onToggleRole,
  onLogout
}) => {
  const [challenge, setChallenge] = useState<DailyChallenge>(initialChallenge);
  const [activeTab, setActiveTab] = useState<'HOME' | 'QUIZ' | 'PROFILE'>('HOME');
  const [filter, setFilter] = useState<'ALL' | 'REVISION' | 'NEW'>('ALL');

  // ─── Enterprise Real-time Permissions (WebSocket-powered via PermissionContext) ───
  // No local state, no polling — all handled by PermissionProvider at root level
  const { canAccess, permissions } = usePermissions();

  // Allow entering Quiz Test hub if user has ANY quiz / topic permission
  const hasAnyQuizAccess =
    canAccess('dayWiseTest') ||
    canAccess('sectionalTest') ||
    canAccess('synonyms') ||
    canAccess('antonyms') ||
    canAccess('idioms') ||
    canAccess('oneWord') ||
    canAccess('rootWords') ||
    canAccess('homonyms');

  // MNC Style Access Restricted Popup Modal State
  const [restrictedModal, setRestrictedModal] = useState<{
    visible: boolean;
    moduleName: string;
    description: string;
  }>({
    visible: false,
    moduleName: '',
    description: ''
  });
  const [managerVisible, setManagerVisible] = useState(userRole === 'MANAGER');
  const [selectedPathModule, setSelectedPathModule] = useState<{
    name: string;
    hindi: string;
    color: string;
  } | null>(null);

  const [streakCount, setStreakCount] = useState<number>(1);
  const [xpCount, setXpCount] = useState<number>(50);

  const syncStreakData = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('userObj');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) {
            setStreakCount(parsed.currentStreak || parsed.streak || 1);
            setXpCount(parsed.totalXp || parsed.xp || 50);
          }
        } catch (e) { }
      }
    }
  };

  React.useEffect(() => {
    syncStreakData();
    const handleUpdate = () => syncStreakData();
    if (typeof window !== 'undefined') {
      window.addEventListener('userProfileUpdated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('userProfileUpdated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      }
    };
  }, []);

  React.useEffect(() => {
    if (userRole === 'MANAGER') {
      setManagerVisible(true);
    }
  }, [userRole]);

  // ─── PYQ & Practice Question Sheets GET State ─────────────────
  const [pyqExamsList, setPyqExamsList] = useState<any[]>([]);
  const [pyqPapersList, setPyqPapersList] = useState<any[]>([]);
  const [questionSheetCategories, setQuestionSheetCategories] = useState<any[]>([]);
  const [questionSheetsList, setQuestionSheetsList] = useState<any[]>([]);

  // ─── Full-Page Sub-Screen State (Matching Manager Panel Navigation Exactly) ───
  const [homeSubScreen, setHomeSubScreen] = useState<
    'MAIN' | 'PYQ_HUB' | 'SHEET_HUB' | 'PYQ_PAPERS_LIST' | 'SHEET_PAPERS_LIST' | 'PDF_VIEWER'
  >('MAIN');
  const [selectedExamTitle, setSelectedExamTitle] = useState<string>('');
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState<string>('');
  const [selectedPaperForPdf, setSelectedPaperForPdf] = useState<{ title: string; pdfUrl: string } | null>(null);

  const mergePyqItems = (bList: any[], lList: any[], defaultSeeds: any[]) => {
    const map = new Map<string, any>();
    const dynamicList = [...(lList || []), ...(bList || [])];

    if (dynamicList.length > 0) {
      dynamicList.forEach(item => {
        if (item) {
          const key = (item.paperName || item.title || String(item.id || '')).toLowerCase().trim();
          if (key) map.set(key, item);
        }
      });
    } else {
      (defaultSeeds || []).forEach(item => {
        if (item) {
          const key = (item.paperName || item.title || String(item.id || '')).toLowerCase().trim();
          if (key) map.set(key, item);
        }
      });
    }

    return Array.from(map.values());
  };

  const fetchPyqAndSheets = async () => {
    let backendExams: any[] = [];
    let backendPapers: any[] = [];
    let backendSheetCats: any[] = [];
    let backendSheets: any[] = [];

    try {
      const [exams, papers, sheetCats, sheets] = await Promise.all([
        managerApi.getPyqExams().catch(() => []),
        managerApi.getPyqPapers().catch(() => []),
        managerApi.getQuestionSheetCategories().catch(() => []),
        managerApi.getQuestionSheetPapers().catch(() => [])
      ]);

      if (Array.isArray(exams) && exams.length > 0) backendExams = exams;
      if (Array.isArray(papers) && papers.length > 0) backendPapers = papers;
      if (Array.isArray(sheetCats) && sheetCats.length > 0) backendSheetCats = sheetCats;
      if (Array.isArray(sheets) && sheets.length > 0) backendSheets = sheets;
    } catch (e) {
      console.log('Error fetching PYQ/Sheets in HomeScreen:', e);
    }

    let localExams: any[] = [];
    let localPapers: any[] = [];
    let localSheetCats: any[] = [];
    let localSheets: any[] = [];

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedE = window.localStorage.getItem('vocab_pyq_exams');
        if (storedE) localExams = JSON.parse(storedE);
        const storedP = window.localStorage.getItem('vocab_pyq_papers');
        if (storedP) localPapers = JSON.parse(storedP);
        const storedC = window.localStorage.getItem('vocab_question_sheet_categories');
        if (storedC) localSheetCats = JSON.parse(storedC);
        const storedS = window.localStorage.getItem('vocab_question_sheets');
        if (storedS) localSheets = JSON.parse(storedS);
      } catch (_) {}
    }

    const mergedExams = mergePyqItems(backendExams, localExams, [
      { id: 1, title: 'SSC CGL', description: 'Combined Graduate Level Exam Papers' },
      { id: 2, title: 'SSC CHSL', description: 'Combined Higher Secondary Level Papers' },
      { id: 3, title: 'RRB NTPC', description: 'Railway Recruitment Board Non-Tech Papers' },
      { id: 4, title: 'TCS NQT', description: 'National Qualifier Test Previous Papers' }
    ]);

    const mergedPapers = mergePyqItems(backendPapers, localPapers, []);

    const mergedSheetCats = mergePyqItems(backendSheetCats, localSheetCats, [
      { id: 101, title: 'Synonyms Practice Sheet', description: 'Top 500 Synonyms Worksheet' },
      { id: 102, title: 'Antonyms Practice Sheet', description: 'High Frequency Antonyms Worksheet' },
      { id: 103, title: 'Idioms & Phrases Sheet', description: '500+ SSC Repeated Idioms Worksheet' }
    ]);

    const mergedSheets = mergePyqItems(backendSheets, localSheets, []);

    setPyqExamsList(mergedExams);
    setPyqPapersList(mergedPapers);
    setQuestionSheetCategories(mergedSheetCats);
    setQuestionSheetsList(mergedSheets);
  };

  const matchTitle = (t1?: string, t2?: string) => {
    if (!t1 || !t2) return false;
    const s1 = t1.toLowerCase().trim();
    const s2 = t2.toLowerCase().trim();
    return s1 === s2 || s1.includes(s2) || s2.includes(s1);
  };

  const handleOpenPyqExam = (examTitle: string) => {
    const matchingPapers = pyqPapersList.filter(p => !examTitle || matchTitle(p.examTitle || p.exam_title, examTitle));
    if (matchingPapers.length === 1) {
      setSelectedPaperForPdf({
        title: matchingPapers[0].paperName || matchingPapers[0].title || 'Paper',
        pdfUrl: matchingPapers[0].fileUrl || matchingPapers[0].pdfUrl || matchingPapers[0].fileUri || ''
      });
      setHomeSubScreen('PDF_VIEWER');
    } else {
      setSelectedExamTitle(examTitle);
      setHomeSubScreen('PYQ_PAPERS_LIST');
    }
  };

  const handleOpenSheetCategory = (catTitle: string) => {
    const matchingSheets = questionSheetsList.filter(s => !catTitle || matchTitle(s.categoryTitle || s.category_title, catTitle));
    if (matchingSheets.length === 1) {
      setSelectedPaperForPdf({
        title: matchingSheets[0].paperName || matchingSheets[0].title || 'Sheet',
        pdfUrl: matchingSheets[0].fileUrl || matchingSheets[0].pdfUrl || matchingSheets[0].fileUri || ''
      });
      setHomeSubScreen('PDF_VIEWER');
    } else {
      setSelectedCategoryTitle(catTitle);
      setHomeSubScreen('SHEET_PAPERS_LIST');
    }
  };

  React.useEffect(() => {
    fetchPyqAndSheets();

    if (typeof window !== 'undefined') {
      window.addEventListener('pyq_data_updated', fetchPyqAndSheets);
      return () => {
        window.removeEventListener('pyq_data_updated', fetchPyqAndSheets);
      };
    }
  }, []);


  const handleAddWordFromManager = (wordData: any) => {
    const newWordObj: Word = {
      id: Date.now(),
      word: wordData.word,
      phonetic: wordData.phonetic,
      meaning: wordData.meaning,
      hindiMeaning: wordData.hindiMeaning,
      exampleSentence: wordData.exampleSentence,
      partOfSpeech: 'Noun'
    };
    setChallenge(prev => ({
      ...prev,
      newWords: [newWordObj, ...prev.newWords]
    }));
  };

  const handleCreateDayFromManager = (dayData: any) => {
    window.alert(`New Day Created: Chapter Day ${dayData.dayNumber}: "${dayData.title}" initialized!`);
  };

  const allWords = [
    ...challenge.revisionWords.map(w => ({ word: w, type: 'REVISION' as const })),
    ...challenge.newWords.map(w => ({ word: w, type: 'NEW' as const }))
  ];

  const displayedWords = allWords.filter(item => {
    if (filter === 'REVISION') return item.type === 'REVISION';
    if (filter === 'NEW') return item.type === 'NEW';
    return true;
  });

  if (activeTab === 'QUIZ') {
    return (
      <QuizTestScreen
        onBackToHome={() => setActiveTab('HOME')}
        studentPerms={permissions.student}
      />
    );
  }

  if (activeTab === 'PROFILE') {
    return (
      <ProfileScreen
        onBackToHome={() => setActiveTab('HOME')}
        userRole={userRole}
        currentUser={currentUser}
        onToggleRole={onToggleRole}
        onLogout={onLogout}
      />
    );
  }

  if (selectedPathModule) {
    return (
      <LearningPathScreen
        categoryName={selectedPathModule.name}
        categoryHindi={selectedPathModule.hindi}
        categoryColor={selectedPathModule.color}
        onBack={() => setSelectedPathModule(null)}
      />
    );
  }

  // ─── FULL PAGE SCREEN VIEW 1: PYQ EXAMS HUB (Matching Manager Panel Layout) ───
  if (homeSubScreen === 'PYQ_HUB') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setHomeSubScreen('MAIN')} style={styles.backCircleBtn} activeOpacity={0.7}>
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.subPageTitle}>PYQ Exams</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 10, letterSpacing: 0.5 }}>
            SELECT EXAM CATEGORY TO VIEW PAPERS
          </Text>

          <View style={{ gap: 8 }}>
            {(pyqExamsList.length > 0 ? pyqExamsList : [
              { id: 1, title: 'SSC CGL', description: 'Combined Graduate Level Exam P...' },
              { id: 2, title: 'SSC CHSL', description: 'Combined Higher Secondary Leve...' },
              { id: 3, title: 'RRB NTPC', description: 'Railway Recruitment Board Non-T...' },
              { id: 4, title: 'TCS NQT', description: 'National Qualifier Test Previous Pa...' }
            ]).map((exam) => {
              const paperCount = pyqPapersList.filter(p => matchTitle(p.examTitle || p.exam_title, exam.title)).length;
              return (
                <TouchableOpacity
                  key={exam.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    shadowColor: '#000',
                    shadowOpacity: 0.02,
                    shadowRadius: 4,
                    elevation: 1
                  }}
                  activeOpacity={0.75}
                  onPress={() => {
                    setSelectedExamTitle(exam.title);
                    setHomeSubScreen('PYQ_PAPERS_LIST');
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center' }}>
                      <FileSpreadsheet size={18} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>{exam.title}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }} numberOfLines={1}>{exam.description || 'Previous Year Question Papers'}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>
                        {paperCount} {paperCount === 1 ? 'Paper' : 'Papers'}
                      </Text>
                    </View>
                    <ArrowRight size={16} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── FULL PAGE SCREEN VIEW 2: PYQ PAPERS LIST UNDER EXAM (Matching Manager Panel Layout - View Only) ───
  if (homeSubScreen === 'PYQ_PAPERS_LIST') {
    const filteredPapers = pyqPapersList.filter(p => matchTitle(p.examTitle || p.exam_title, selectedExamTitle));
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setHomeSubScreen('PYQ_HUB')} style={styles.backCircleBtn} activeOpacity={0.7}>
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.subPageTitle} numberOfLines={1}>{selectedExamTitle} Papers</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>
          {filteredPapers.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 50 }}>
              <FileSpreadsheet size={40} color="#CBD5E1" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B', marginTop: 10 }}>No Papers Uploaded Yet</Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>Question papers for {selectedExamTitle} will appear here when uploaded by manager.</Text>
            </View>
          ) : (
            filteredPapers.map((paper, idx) => (
              <TouchableOpacity
                key={paper.id || idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: '#000',
                  shadowOpacity: 0.02,
                  shadowRadius: 3,
                  elevation: 1
                }}
                activeOpacity={0.75}
                onPress={() => {
                  const paperTitle = paper.paperName || paper.title || 'Official Question Paper';
                  const pdfUrl = paper.fileUrl || paper.pdfUrl || paper.fileUri || '';
                  setSelectedPaperForPdf({ title: paperTitle, pdfUrl });
                  setHomeSubScreen('PDF_VIEWER');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 6 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
                    <FileText size={18} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>{paper.paperName || paper.title}</Text>
                    <Text style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>
                      {paper.fileType || 'PDF'} • {paper.fileSize || '0.2 MB'} • {paper.addedDate || paper.createdAt || 'Recent'}
                    </Text>
                  </View>
                </View>

                {/* View Action Button ONLY - NO Add, NO Edit, NO Delete on Homepage */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View
                    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#EFF6FF', borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}
                  >
                    <Eye size={12} color="#2563EB" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>View</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── FULL PAGE SCREEN VIEW 3: PRACTICE QUESTION SHEETS HUB (Matching Manager Panel Layout) ───
  if (homeSubScreen === 'SHEET_HUB') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setHomeSubScreen('MAIN')} style={styles.backCircleBtn} activeOpacity={0.7}>
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.subPageTitle}>Question Sheets</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 10, letterSpacing: 0.5 }}>
            SELECT CATEGORY TO VIEW WORKSHEETS
          </Text>

          <View style={{ gap: 8 }}>
            {(questionSheetCategories.length > 0 ? questionSheetCategories : [
              { id: 101, title: 'Synonyms Practice Sheet', description: 'Top 500 Synonyms Worksheet' },
              { id: 102, title: 'Antonyms Practice Sheet', description: 'High Frequency Antonyms Worksheet' },
              { id: 103, title: 'Idioms & Phrases Sheet', description: '500+ SSC Repeated Idioms Worksheet' }
            ]).map((sheetCat) => {
              const sheetCount = questionSheetsList.filter(s => matchTitle(s.categoryTitle || s.category_title, sheetCat.title)).length;
              return (
                <TouchableOpacity
                  key={sheetCat.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    shadowColor: '#000',
                    shadowOpacity: 0.02,
                    shadowRadius: 4,
                    elevation: 1
                  }}
                  activeOpacity={0.75}
                  onPress={() => {
                    setSelectedCategoryTitle(sheetCat.title);
                    setHomeSubScreen('SHEET_PAPERS_LIST');
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' }}>
                      <Layers size={18} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>{sheetCat.title}</Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }} numberOfLines={1}>{sheetCat.description || 'Topic-wise Practice Worksheets'}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#16A34A' }}>
                        {sheetCount} {sheetCount === 1 ? 'Sheet' : 'Sheets'}
                      </Text>
                    </View>
                    <ArrowRight size={16} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── FULL PAGE SCREEN VIEW 4: SHEETS LIST UNDER CATEGORY (Matching Manager Panel Layout - View Only) ───
  if (homeSubScreen === 'SHEET_PAPERS_LIST') {
    const filteredSheets = questionSheetsList.filter(s => matchTitle(s.categoryTitle || s.category_title, selectedCategoryTitle));
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity onPress={() => setHomeSubScreen('SHEET_HUB')} style={styles.backCircleBtn} activeOpacity={0.7}>
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.subPageTitle} numberOfLines={1}>{selectedCategoryTitle} Worksheets</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 12 }} showsVerticalScrollIndicator={false}>
          {filteredSheets.length === 0 ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 50 }}>
              <Layers size={40} color="#CBD5E1" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B', marginTop: 10 }}>No Worksheets Uploaded Yet</Text>
              <Text style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>Worksheets for {selectedCategoryTitle} will appear here when uploaded by manager.</Text>
            </View>
          ) : (
            filteredSheets.map((sheet, idx) => (
              <TouchableOpacity
                key={sheet.id || idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: '#000',
                  shadowOpacity: 0.02,
                  shadowRadius: 3,
                  elevation: 1
                }}
                activeOpacity={0.75}
                onPress={() => {
                  const sheetTitle = sheet.paperName || sheet.title || 'Practice Worksheet';
                  const pdfUrl = sheet.fileUrl || sheet.pdfUrl || sheet.fileUri || '';
                  setSelectedPaperForPdf({ title: sheetTitle, pdfUrl });
                  setHomeSubScreen('PDF_VIEWER');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 6 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
                    <FileText size={18} color="#EF4444" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>{sheet.paperName || sheet.title}</Text>
                    <Text style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>
                      {sheet.fileType || 'PDF'} • {sheet.fileSize || '0.2 MB'} • {sheet.addedDate || sheet.createdAt || 'Recent'}
                    </Text>
                  </View>
                </View>

                {/* View Action Button ONLY - NO Add, NO Edit, NO Delete on Homepage */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View
                    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#EFF6FF', borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }}
                  >
                    <Eye size={12} color="#2563EB" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>View</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── FULL PAGE SCREEN VIEW 5: FULL-SCREEN PDF READER WITH DOWNLOAD BUTTON ───
  if (homeSubScreen === 'PDF_VIEWER') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        <View style={styles.subHeaderRow}>
          <TouchableOpacity
            onPress={() => {
              if (selectedExamTitle) setHomeSubScreen('PYQ_PAPERS_LIST');
              else if (selectedCategoryTitle) setHomeSubScreen('SHEET_PAPERS_LIST');
              else setHomeSubScreen('MAIN');
            }}
            style={styles.backCircleBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>

          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.subPageTitle} numberOfLines={1}>{selectedPaperForPdf?.title || 'Paper Document'}</Text>
          </View>

          {/* Download PDF Button */}
          {selectedPaperForPdf?.pdfUrl ? (
            <TouchableOpacity
              style={{
                backgroundColor: '#2563EB',
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5
              }}
              onPress={() => {
                const dlUrl = selectedPaperForPdf.pdfUrl;
                if (typeof window !== 'undefined' && dlUrl) {
                  const link = document.createElement('a');
                  link.href = dlUrl;
                  link.download = `${selectedPaperForPdf.title || 'Question_Paper'}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              activeOpacity={0.8}
            >
              <Download size={15} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Download</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {selectedPaperForPdf && (
            <PdfInAppViewer
              fileUrl={selectedPaperForPdf.pdfUrl || ''}
              paperName={selectedPaperForPdf.title}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* MNC COMPACT TOP NAVBAR WITH PROMINENT LOGO ON LEFT */}
      <View style={styles.compactTopNavbar}>
        <View style={styles.logoLeftContainer}>
          <Image source={logoImg} style={styles.logoImgLeft} resizeMode="contain" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {(permissions.role?.toUpperCase() === 'MANAGER' || permissions.role?.toUpperCase() === 'ADMIN' || permissions.role?.toUpperCase() === 'STAFF' || userRole?.toUpperCase() === 'MANAGER' || userRole?.toUpperCase() === 'ADMIN') && (
            <TouchableOpacity
              style={styles.managerAccessBtn}
              onPress={() => setManagerVisible(true)}
              activeOpacity={0.85}
            >
              <ShieldCheck size={14} color="#FFFFFF" />
              <Text style={styles.managerAccessText}>Manager Panel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>


      {/* MIDDLE CONTENT AREA (SCROLLABLE CARDS BETWEEN TOP & BOTTOM BARS) */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 4 CLICKABLE VOCABULARY CATEGORY CARDS */}
        <View style={styles.categoryGridHeader}>
          <Text style={styles.sectionHeaderTitle}>Vocabulary Modules</Text>
        </View>

        <View style={styles.categoryGrid}>
          {(() => {
            const modules = [
              { permKey: 'synonyms', name: 'Synonyms', hindi: 'समानार्थी शब्द', color: '#2563EB', icon: BookOpen, bg: '#EFF6FF' },
              { permKey: 'antonyms', name: 'Antonyms', hindi: 'विलोम शब्द', color: '#10B981', icon: ArrowLeftRight, bg: '#ECFDF5' },
              { permKey: 'idioms', name: 'Idioms & Phrases', hindi: 'मुहावरे एवं कहावतें', color: '#8B5CF6', icon: Sparkles, bg: '#F3E8FF' },
              { permKey: 'oneWord', name: 'One Word Sub.', hindi: 'एक शब्द प्रतिस्थापन', color: '#D97706', icon: Target, bg: '#FEF3C7' },
              { permKey: 'homonyms', name: 'Homonyms & Homophones', hindi: 'समश्रुत भिन्नार्थक शब्द', color: '#0083B0', icon: Volume2, bg: '#E0F7FA' },
              { permKey: 'rootWords', name: 'Root Words', hindi: 'मूल शब्द (Etymology)', color: '#E11D48', icon: GitFork, bg: '#FFE4E6' },
              { permKey: 'pyqQuestion', name: 'PYQ Question', hindi: 'विगत वर्षों के प्रश्न पत्र', color: '#2563EB', icon: FileSpreadsheet, bg: '#EFF6FF', type: 'PYQ_HUB' },
              { permKey: 'questionSheet', name: 'Question Sheet', hindi: 'अभ्यास प्रश्न पत्र (Worksheets)', color: '#16A34A', icon: Layers, bg: '#F0FDF4', type: 'SHEET_HUB' }
            ];

            return modules.map((mod: any, idx: number) => {
              const IconComponent = mod.icon;
              const isPermitted = mod.permKey === 'pyqQuestion' || mod.permKey === 'questionSheet' ? true : canAccess(mod.permKey as any);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.categoryCard,
                    !isPermitted && { opacity: 0.5, backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }
                  ]}
                  onPress={() => {
                    if (!isPermitted) {
                      setRestrictedModal({
                        visible: true,
                        moduleName: mod.name,
                        description: `You do not have permission to access the "${mod.name}" module.`
                      });
                      return;
                    }
                    if (mod.type === 'PYQ_HUB') {
                      setHomeSubScreen('PYQ_HUB');
                    } else if (mod.type === 'SHEET_HUB') {
                      setHomeSubScreen('SHEET_HUB');
                    } else {
                      setSelectedPathModule({ name: mod.name, hindi: mod.hindi, color: mod.color });
                    }
                  }}
                  activeOpacity={isPermitted ? 0.85 : 1.0}
                >
                  <View style={{ position: 'relative' }}>
                    <View style={[styles.catIconBox, { backgroundColor: isPermitted ? mod.bg : '#E2E8F0' }]}>
                      <IconComponent size={24} color={isPermitted ? mod.color : '#94A3B8'} />
                    </View>
                    {!isPermitted && (
                      <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#EF4444', width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', elevation: 3 }}>
                        <Lock size={11} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.catTitle, !isPermitted && { color: '#64748B' }]}>{mod.name}</Text>
                  <Text style={[styles.catSub, !isPermitted && { color: '#94A3B8' }]}>{mod.hindi}</Text>
                </TouchableOpacity>
              );
            });
          })()}
        </View>
      </ScrollView>

      {/* MNC STANDARD BOTTOM NAVIGATION BAR (LEFT: HOME | MIDDLE: QUIZ TEST | RIGHT: PROFILE) */}
      <View style={styles.mncBottomTabBar}>
        {/* Left: Home */}
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'HOME' && styles.tabItemActive]}
          onPress={() => setActiveTab('HOME')}
        >
          <HomeIcon size={22} color={activeTab === 'HOME' ? '#2563EB' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'HOME' && styles.tabLabelActive]}>Home</Text>
        </TouchableOpacity>

        {/* Middle: Quiz Test */}
        <TouchableOpacity
          style={[styles.middleQuizTabBtn, !hasAnyQuizAccess && { opacity: 0.5 }]}
          activeOpacity={hasAnyQuizAccess ? 0.85 : 1.0}
          onPress={() => {
            if (!hasAnyQuizAccess) {
              setRestrictedModal({
                visible: true,
                moduleName: 'Practice Quiz Tests',
                description: 'You currently do not have authorization to access Practice Quiz Tests. Access privileges are managed by your System Administrator or Manager.'
              });
              return;
            }
            setActiveTab('QUIZ');
          }}
        >
          <View style={[styles.middleQuizIconCircle, !hasAnyQuizAccess && { backgroundColor: '#64748B' }]}>
            {!hasAnyQuizAccess ? <Lock size={20} color="#FFFFFF" /> : <BrainCircuit size={22} color="#FFFFFF" />}
          </View>
          <Text style={styles.middleQuizLabel}>Quiz Test</Text>
        </TouchableOpacity>

        {/* Right: Profile */}
        <TouchableOpacity
          style={[styles.tabItem, activeTab === ('PROFILE' as any) && styles.tabItemActive]}
          onPress={() => {
            setActiveTab('PROFILE');
          }}
        >
          <UserIcon size={22} color={activeTab === ('PROFILE' as any) ? '#2563EB' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === ('PROFILE' as any) && styles.tabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Manager Modal */}
      <ManagerPanelModal
        visible={managerVisible}
        onClose={() => setManagerVisible(false)}
        currentUser={currentUser}
        onAddWord={handleAddWordFromManager}
        onCreateDay={handleCreateDayFromManager}
        onLogout={onLogout}
      />

      {/* MNC STYLE ACCESS RESTRICTED POPUP MODAL */}
      <Modal
        visible={restrictedModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRestrictedModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.mncModalOverlay}>
          <View style={styles.mncModalContainer}>
            {/* Red Lock Warning Badge Circle */}
            <View style={styles.mncLockBadgeCircle}>
              <ShieldAlert size={28} color="#EF4444" />
            </View>

            {/* Title & Description */}
            <Text style={styles.mncModalTitle}>Access Restricted 🔒</Text>
            <Text style={styles.mncModalSubTitle}>{restrictedModal.moduleName}</Text>
            <Text style={styles.mncModalDesc}>
              You do not have permission to open this module.
            </Text>

            {/* Support Note */}
            <View style={styles.mncSupportNoteBox}>
              <Text style={styles.mncSupportNoteText}>
                Need access? Please contact support team.
              </Text>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.mncModalCloseBtn}
              onPress={() => setRestrictedModal(prev => ({ ...prev, visible: false }))}
              activeOpacity={0.85}
            >
              <Text style={styles.mncModalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subPageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  compactTopNavbar: {
    backgroundColor: '#FFFFFF',
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    height: 52,
  },
  managerAccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  managerAccessText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  logoLeftContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: '100%',
    marginLeft: 0,
    paddingLeft: 0,
  },
  logoImgLeft: {
    width: 145,
    height: 46,
    marginLeft: -6,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  streakPillText: {
    color: '#C2410C',
    fontSize: 11,
    fontWeight: '800',
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEFCE8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  xpPillText: {
    color: '#A16207',
    fontSize: 11,
    fontWeight: '800',
  },
  vipBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  vipBtnText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  categoryGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeaderTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
  },
  welcomeLinkText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '800',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  catCardActiveBlue: {
    borderColor: '#2563EB',
    backgroundColor: '#F0F7FF',
  },
  catCardActiveGreen: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  catCardActivePurple: {
    borderColor: '#8B5CF6',
    backgroundColor: '#F3E8FF',
  },
  catCardActiveAmber: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
  },
  catCardActiveCyan: {
    borderColor: '#0083B0',
    backgroundColor: '#E0F7FA',
  },
  catCardActiveRose: {
    borderColor: '#E11D48',
    backgroundColor: '#FFE4E6',
  },
  catIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  catTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  catSub: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  catBadgeBlue: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  catBadgeBlueText: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '800',
  },
  catBadgeGreen: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  catBadgeGreenText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  catBadgePurple: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  catBadgePurpleText: {
    color: '#8B5CF6',
    fontSize: 10,
    fontWeight: '800',
  },
  catBadgeAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  catBadgeAmberText: {
    color: '#D97706',
    fontSize: 10,
    fontWeight: '800',
  },
  catBadgeCyan: {
    backgroundColor: '#E0F7FA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#B2EBF2',
  },
  catBadgeCyanText: {
    color: '#0083B0',
    fontSize: 10,
    fontWeight: '800',
  },
  catBadgeRose: {
    backgroundColor: '#FFE4E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  catBadgeRoseText: {
    color: '#E11D48',
    fontSize: 10,
    fontWeight: '800',
  },
  chapterBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  vocabCountText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  chapterTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  chapterDesc: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    borderColor: '#0F172A',
    backgroundColor: '#0F172A',
  },
  filterChipActiveSky: {
    borderColor: '#0284C7',
    backgroundColor: '#EFF6FF',
  },
  filterChipActiveGreen: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  filterText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterTextActiveSky: {
    color: '#0284C7',
  },
  filterTextActiveGreen: {
    color: '#10B981',
  },
  listSection: {
    gap: 4,
  },
  mncBottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    flex: 1,
  },
  tabItemActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  middleQuizTabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -12,
  },
  middleQuizIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  middleQuizLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    marginTop: 2,
  },
  /* MNC ACCESS RESTRICTED MODAL STYLES */
  mncModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  mncModalContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  mncLockBadgeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: '#FEF2F2',
  },
  mncModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  mncModalSubTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 10,
    textAlign: 'center',
  },
  mncModalDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
    fontWeight: '500',
  },
  mncSupportNoteBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    width: '100%',
  },
  mncSupportNoteText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 16,
  },
  mncModalCloseBtn: {
    backgroundColor: '#0F172A',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mncModalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
