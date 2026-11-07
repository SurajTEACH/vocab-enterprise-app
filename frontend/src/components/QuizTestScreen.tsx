import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions
} from 'react-native';
import {
  ArrowLeft,
  Flame,
  Zap,
  BookOpen,
  ArrowLeftRight,
  Sparkles,
  Target,
  Volume2,
  GitFork,
  Calendar as CalendarIcon,
  Award,
  CheckCircle2,
  Lock,
  Clock,
  Check,
  AlertCircle,
  BarChart3,
  RotateCcw,
  Trophy,
  Play,
  ShieldAlert,
  HelpCircle,
  X
} from 'lucide-react-native';

import { managerApi } from '../api';

const { width } = Dimensions.get('window');

interface QuizTestScreenProps {
  onBackToHome: () => void;
  studentPerms?: {
    synonyms?: boolean;
    antonyms?: boolean;
    idioms?: boolean;
    oneWord?: boolean;
    homonyms?: boolean;
    rootWords?: boolean;
    dayWiseTest?: boolean;
    sectionalTest?: boolean;
  };
}

export interface TopicOption {
  id: string;
  permKey: string;
  name: string;
  hindi: string;
  color: string;
  bgColor: string;
  icon: any;
}

const topicList: TopicOption[] = [
  { id: 'SYNONYMS', permKey: 'synonyms', name: 'Synonyms', hindi: 'समानार्थी शब्द', color: '#2563EB', bgColor: '#EFF6FF', icon: BookOpen },
  { id: 'ANTONYMS', permKey: 'antonyms', name: 'Antonyms', hindi: 'विलोम शब्द', color: '#10B981', bgColor: '#ECFDF5', icon: ArrowLeftRight },
  { id: 'IDIOMS', permKey: 'idioms', name: 'Idioms & Phrases', hindi: 'मुहावरे एवं कहावतें', color: '#8B5CF6', bgColor: '#F3E8FF', icon: Sparkles },
  { id: 'SUBSTITUTION', permKey: 'oneWord', name: 'One Word Sub.', hindi: 'एक शब्द प्रतिस्थापन', color: '#D97706', bgColor: '#FEF3C7', icon: Target },
  { id: 'HOMONYMS', permKey: 'homonyms', name: 'Homonyms & Homophones', hindi: 'समश्रुत भिन्नार्थक', color: '#0083B0', bgColor: '#E0F7FA', icon: Volume2 },
  { id: 'ROOTWORDS', permKey: 'rootWords', name: 'Root Words', hindi: 'मूल शब्द (Etymology)', color: '#E11D48', bgColor: '#FFE4E6', icon: GitFork },
];

export interface MCQQuestion {
  id: number;
  question: string;
  options: { key: string; text: string; hindiText?: string }[];
  correctAnswer: string;
  explanation: string;
}

export const QuizTestScreen: React.FC<QuizTestScreenProps> = ({ onBackToHome, studentPerms }) => {
  const [selectedTopic, setSelectedTopic] = useState<TopicOption>(topicList[0]);
  const [activeMode, setActiveMode] = useState<'CALENDAR' | 'SECTIONAL'>('CALENDAR');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MODERATE' | 'HARD'>('MODERATE');
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [streakCount, setStreakCount] = useState<number>(1);

  const syncStreak = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('userObj');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed) setStreakCount(parsed.currentStreak || parsed.streak || 1);
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    syncStreak();
    const handleUpdate = () => syncStreak();
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

  // Restricted Warning Modal State
  const [restrictedModal, setRestrictedModal] = useState<{ visible: boolean; title: string; desc: string }>({
    visible: false,
    title: '',
    desc: ''
  });

  // Fetch real words from DB and generate dynamic quiz test questions
  useEffect(() => {
    let isMounted = true;
    const fetchDbQuestions = async () => {
      try {
        const words = await managerApi.getWords();
        if (isMounted && Array.isArray(words) && words.length > 0) {
          const generated: MCQQuestion[] = words.map((w: any, idx: number) => {
            const options = [
              { key: 'A', text: w.meaning || 'Primary dictionary meaning', hindiText: w.hindiMeaning || '' },
              { key: 'B', text: 'Secondary alternative definition', hindiText: 'वैकल्पिक अर्थ' },
              { key: 'C', text: 'Antonym or opposite concept', hindiText: 'विपरीत अर्थ' },
              { key: 'D', text: 'Unrelated distractor definition', hindiText: 'असंबद्ध अर्थ' }
            ];
            return {
              id: w.id || idx + 1,
              question: `Select the correct meaning of the word: "${(w.word || '').toUpperCase()}"`,
              options,
              correctAnswer: 'A',
              explanation: `"${w.word}" means ${w.meaning || w.hindiMeaning || 'as specified in the database'}.`
            };
          });
          setQuestions(generated);
          return;
        }
      } catch (e) {
        console.warn('[QuizTestScreen] DB words quiz loader warning:', e);
      }

      // Set empty array if database has no words/questions added
      if (isMounted) {
        setQuestions([]);
      }
    };
    fetchDbQuestions();
    return () => { isMounted = false; };
  }, []);

  // Timed Mock Test Modal State
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600); // 10 mins
  const [testCompleted, setTestCompleted] = useState(false);

  // Dynamic Day Calendar State (Day 1 & Day 2 completed)
  const completedDays = [1, 2];

  // Auto-switch mode and topic based on user permissions
  useEffect(() => {
    if (studentPerms) {
      if (studentPerms.dayWiseTest === false && studentPerms.sectionalTest !== false) {
        setActiveMode('SECTIONAL');
      }
      const isPermitted = studentPerms[selectedTopic.permKey as keyof typeof studentPerms] !== false;
      if (!isPermitted) {
        const firstPermitted = topicList.find(t => studentPerms[t.permKey as keyof typeof studentPerms] !== false);
        if (firstPermitted) {
          setSelectedTopic(firstPermitted);
        }
      }
    }
  }, [studentPerms]);

  // Timer Countdown Effect for Live Test
  useEffect(() => {
    let timer: any;
    if (testModalVisible && !testCompleted && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        setTimeLeftSeconds(prev => prev - 1);
      }, 1000);
    } else if (timeLeftSeconds === 0 && !testCompleted) {
      setTestCompleted(true);
    }
    return () => clearInterval(timer);
  }, [testModalVisible, testCompleted, timeLeftSeconds]);


  const handleStartCalendarDayTest = (dayNum: number) => {
    if (!completedDays.includes(dayNum) && dayNum > 3) {
      window.alert(`Day ${dayNum} Test is Locked! Complete Day ${dayNum - 1} in the Snake Path first.`);
      return;
    }
    setTestTitle(`Day ${dayNum} Timed Mock Test`);
    setCurrentQIndex(0);
    setUserAnswers({});
    setTimeLeftSeconds(600); // 10 Mins
    setTestCompleted(false);
    setTestModalVisible(true);
  };

  const handleStartSectionalMock = () => {
    const diffLabel = selectedDifficulty === 'EASY' ? 'Easy (Beginner)' : selectedDifficulty === 'MODERATE' ? 'Moderate (SSC PYQ)' : 'Hard (Bank PO & UPSC)';
    setTestTitle(`${selectedTopic.name} - ${diffLabel} Mock Test`);
    setCurrentQIndex(0);
    setUserAnswers({});
    setTimeLeftSeconds(selectedDifficulty === 'EASY' ? 600 : selectedDifficulty === 'MODERATE' ? 900 : 1200);
    setTestCompleted(false);
    setTestModalVisible(true);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const calculateScore = () => {
    let correct = 0;
    const activeQuestions = questions;
    activeQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctAnswer) correct++;
    });
    const total = activeQuestions.length || 1;
    return {
      score: correct,
      total: activeQuestions.length,
      accuracy: Math.round((correct / total) * 100),
      xp: correct * 10
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP HEADER */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBackToHome} activeOpacity={0.8}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Quiz Test Hub</Text>
          <Text style={styles.headerSub}>Timed Mock Evaluation</Text>
        </View>

      </View>

      {/* FIXED STICKY HEADER SECTION (TOPIC SELECTOR & MODE SWITCHER TABS) */}
      <View style={styles.stickyHeaderContainer}>
        {/* 1. SELECT TOPIC SECTION */}
        <View style={styles.sectionHeaderRow}>
          <BookOpen size={16} color="#2563EB" />
          <Text style={styles.sectionTitle}>Select Topic (विषय चुनें):</Text>
        </View>

        {/* HORIZONTAL TOPIC CHIPS SCROLL */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicScrollRow}>
          {topicList.map(topic => {
            const IconComp = topic.icon;
            const isSelected = selectedTopic.id === topic.id;
            const isPermitted = studentPerms ? studentPerms[topic.permKey as keyof typeof studentPerms] !== false : true;

            return (
              <TouchableOpacity
                key={topic.id}
                activeOpacity={isPermitted ? 0.85 : 1.0}
                onPress={() => {
                  if (!isPermitted) {
                    setRestrictedModal({
                      visible: true,
                      title: topic.name,
                      desc: `You do not have permission to access the "${topic.name}" test module.`
                    });
                    return;
                  }
                  setSelectedTopic(topic);
                }}
                style={[
                  styles.topicChip,
                  { backgroundColor: isSelected ? topic.color : '#FFFFFF', borderColor: isSelected ? topic.color : '#E2E8F0' },
                  !isPermitted && { opacity: 0.5, backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }
                ]}
              >
                <View style={{ position: 'relative' }}>
                  <View style={[styles.topicIconCircle, { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : (isPermitted ? topic.bgColor : '#E2E8F0') }]}>
                    <IconComp size={16} color={isSelected ? '#FFFFFF' : (isPermitted ? topic.color : '#94A3B8')} />
                  </View>
                  {!isPermitted && (
                    <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFFFFF' }}>
                      <Lock size={9} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View>
                  <Text style={[styles.topicChipName, isSelected && { color: '#FFFFFF' }, !isPermitted && { color: '#64748B' }]}>{topic.name}</Text>
                  <Text style={[styles.topicChipHindi, isSelected && { color: 'rgba(255,255,255,0.85)' }, !isPermitted && { color: '#94A3B8' }]}>{topic.hindi}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 2. MODE SWITCHER TABS (DAY CALENDAR VS SECTIONAL MOCK) */}
        <View style={styles.modeTabBar}>
          <TouchableOpacity
            style={[
              styles.modeTabBtn,
              activeMode === 'CALENDAR' && styles.modeTabActive,
              studentPerms?.dayWiseTest === false && { opacity: 0.5 }
            ]}
            onPress={() => {
              if (studentPerms?.dayWiseTest === false) {
                setRestrictedModal({
                  visible: true,
                  title: 'Day-Wise Test',
                  desc: 'You do not have permission to access Day-Wise Tests.'
                });
                return;
              }
              setActiveMode('CALENDAR');
            }}
            activeOpacity={studentPerms?.dayWiseTest !== false ? 0.85 : 1.0}
          >
            {studentPerms?.dayWiseTest === false ? (
              <Lock size={16} color="#94A3B8" />
            ) : (
              <CalendarIcon size={16} color={activeMode === 'CALENDAR' ? '#2563EB' : '#64748B'} />
            )}
            <Text style={[styles.modeTabText, activeMode === 'CALENDAR' && styles.modeTabTextActive, studentPerms?.dayWiseTest === false && { color: '#94A3B8' }]}>
              Day-Wise Test
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTabBtn,
              activeMode === 'SECTIONAL' && styles.modeTabActive,
              studentPerms?.sectionalTest === false && { opacity: 0.5 }
            ]}
            onPress={() => {
              if (studentPerms?.sectionalTest === false) {
                setRestrictedModal({
                  visible: true,
                  title: 'Sectional Mock Test',
                  desc: 'You do not have permission to access Sectional Mock Tests.'
                });
                return;
              }
              setActiveMode('SECTIONAL');
            }}
            activeOpacity={studentPerms?.sectionalTest !== false ? 0.85 : 1.0}
          >
            {studentPerms?.sectionalTest === false ? (
              <Lock size={16} color="#94A3B8" />
            ) : (
              <Award size={16} color={activeMode === 'SECTIONAL' ? '#2563EB' : '#64748B'} />
            )}
            <Text style={[styles.modeTabText, activeMode === 'SECTIONAL' && styles.modeTabTextActive, studentPerms?.sectionalTest === false && { color: '#94A3B8' }]}>
              Sectional Mock Test
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SCROLLABLE MAIN CONTENT AREA (CALENDAR GRID OR SECTIONAL MOCK) */}
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>

        {/* MODE A: DAY-WISE CALENDAR VIEW */}
        {activeMode === 'CALENDAR' && (
          <View style={styles.calendarContainer}>
            <View style={styles.calHeadingBox}>
              <Text style={styles.calHeadingTitle}>{selectedTopic.name} - Day-Wise Test</Text>
              <Text style={styles.calHeadingSub}>Click any completed or active Day to start the timed quiz!</Text>
            </View>

            {/* DAY GRID CELLS (30 DAYS CALENDAR) */}
            <View style={styles.calendarGrid}>
              {Array.from({ length: 30 }, (_, i) => i + 1).map(dayNum => {
                const isDone = completedDays.includes(dayNum);
                const isCurrentActive = dayNum === 3;
                const isLocked = dayNum > 3;

                return (
                  <TouchableOpacity
                    key={dayNum}
                    activeOpacity={0.8}
                    onPress={() => handleStartCalendarDayTest(dayNum)}
                    style={[
                      styles.calCell,
                      isDone && styles.calCellDone,
                      isCurrentActive && [styles.calCellCurrent, { borderColor: selectedTopic.color }],
                      isLocked && styles.calCellLocked
                    ]}
                  >
                    {isDone && <CheckCircle2 size={16} color="#10B981" style={styles.cellIconTop} />}
                    {isCurrentActive && <Play size={14} color="#2563EB" fill="#2563EB" style={styles.cellIconTop} />}
                    {isLocked && <Lock size={14} color="#94A3B8" style={styles.cellIconTop} />}

                    <Text style={[styles.calDayNumText, isCurrentActive && { color: selectedTopic.color, fontWeight: '900' }]}>
                      Day {dayNum}
                    </Text>
                    <Text style={styles.calCellSub}>
                      {isDone ? 'Pass 100%' : isCurrentActive ? 'Active' : 'Locked'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* MODE B: SECTIONAL MOCK TEST VIEW */}
        {activeMode === 'SECTIONAL' && (
          <View style={styles.sectionalContainer}>
            <View style={styles.secHeadingBox}>
              <Text style={styles.secHeadingTitle}>{selectedTopic.name} Sectional Mock</Text>
              <Text style={styles.secHeadingSub}>Select difficulty level and test your speed under pressure!</Text>
            </View>

            {/* DIFFICULTY CARDS */}
            <View style={styles.difficultyGrid}>
              {/* EASY */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSelectedDifficulty('EASY')}
                style={[
                  styles.diffCard,
                  selectedDifficulty === 'EASY' && styles.diffCardActiveEasy
                ]}
              >
                <View style={[styles.diffIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <CheckCircle2 size={24} color="#10B981" />
                </View>
                <Text style={styles.diffTitle}>Easy Level</Text>
                <Text style={styles.diffSub}>10 Qs • 10 Mins • Basic Words</Text>
              </TouchableOpacity>

              {/* MODERATE (DEFAULT) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSelectedDifficulty('MODERATE')}
                style={[
                  styles.diffCard,
                  selectedDifficulty === 'MODERATE' && styles.diffCardActiveMod
                ]}
              >
                <View style={[styles.diffIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Zap size={24} color="#D97706" fill="#FBBF24" />
                </View>
                <Text style={styles.diffTitle}>Moderate (Default)</Text>
                <Text style={styles.diffSub}>15 Qs • 15 Mins • SSC CGL PYQs</Text>
              </TouchableOpacity>

              {/* HARD */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSelectedDifficulty('HARD')}
                style={[
                  styles.diffCard,
                  selectedDifficulty === 'HARD' && styles.diffCardActiveHard
                ]}
              >
                <View style={[styles.diffIconCircle, { backgroundColor: '#FFE4E6' }]}>
                  <Flame size={24} color="#E11D48" fill="#E11D48" />
                </View>
                <Text style={styles.diffTitle}>Hard Level</Text>
                <Text style={styles.diffSub}>20 Qs • 20 Mins • Bank PO / UPSC</Text>
              </TouchableOpacity>
            </View>

            {/* START SECTIONAL MOCK TEST BUTTON */}
            <TouchableOpacity
              style={[styles.startSectionalBtn, { backgroundColor: selectedTopic.color }]}
              onPress={handleStartSectionalMock}
              activeOpacity={0.85}
            >
              <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.startSectionalBtnText}>
                Start {selectedDifficulty} Mock Test ({selectedTopic.name})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* LIVE TIMED MOCK TEST MODAL */}
      <Modal visible={testModalVisible} animationType="slide">
        <SafeAreaView style={styles.container}>
          {/* TEST TOP BAR WITH TIMER */}
          <View style={styles.testTopBar}>
            <TouchableOpacity onPress={() => setTestModalVisible(false)} style={styles.testCloseBtn}>
              <ArrowLeft size={20} color="#0F172A" />
            </TouchableOpacity>

            <Text style={styles.testHeaderTitle}>{testTitle}</Text>

            {/* TIMER COUNTDOWN BADGE */}
            <View style={[styles.timerChip, timeLeftSeconds <= 60 && { backgroundColor: '#FFE4E6' }]}>
              <Clock size={16} color={timeLeftSeconds <= 60 ? '#E11D48' : '#2563EB'} />
              <Text style={[styles.timerText, timeLeftSeconds <= 60 && { color: '#E11D48' }]}>
                {formatTimer(timeLeftSeconds)}
              </Text>
            </View>
          </View>

          {!testCompleted ? (
            (() => {
              const activeQuestions = questions;
              const currentQ = activeQuestions[currentQIndex];

              if (!activeQuestions || activeQuestions.length === 0 || !currentQ) {
                return (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, minHeight: 320 }}>
                    <HelpCircle size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#1E293B', textAlign: 'center', marginBottom: 8 }}>
                      No Test Questions in Database
                    </Text>
                    <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', maxWidth: 360, lineHeight: 20, marginBottom: 20 }}>
                      There are currently no test questions added to the database. Please add new vocabulary terms or test questions using the Manager Panel!
                    </Text>
                    <TouchableOpacity
                      onPress={() => setTestModalVisible(false)}
                      style={{ backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 28, borderRadius: 12 }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 15 }}>Close Test</Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <ScrollView contentContainerStyle={styles.testScrollBody} showsVerticalScrollIndicator={false}>
                  {/* QUESTION PROGRESS COUNTER */}
                  <View style={styles.qCounterRow}>
                    <Text style={styles.qCounterText}>Question {currentQIndex + 1} of {activeQuestions.length}</Text>
                  </View>

                  {/* MCQ QUESTION CARD */}
                  <View style={styles.mcqCard}>
                    <Text style={styles.mcqQuestionText}>{currentQ?.question}</Text>

                    {/* OPTIONS LIST */}
                    <View style={styles.optionsList}>
                      {currentQ?.options.map(opt => {
                        const isSelected = userAnswers[currentQ.id] === opt.key;

                        return (
                          <TouchableOpacity
                            key={opt.key}
                            activeOpacity={0.85}
                            onPress={() => setUserAnswers(prev => ({ ...prev, [currentQ.id]: opt.key }))}
                            style={[
                              styles.optionItem,
                              isSelected && styles.optionSelected
                            ]}
                          >
                            <View style={[styles.optKeyBadge, isSelected && styles.optKeySelected]}>
                              <Text style={[styles.optKeyText, isSelected && { color: '#FFFFFF' }]}>{opt.key}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.optMainText, isSelected && { color: '#2563EB', fontWeight: '800' }]}>
                                {opt.text}
                              </Text>
                              {opt.hindiText && <Text style={styles.optHindiSub}>({opt.hindiText})</Text>}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* TEST BOTTOM NAVIGATION */}
                  <View style={styles.testNavRow}>
                    <TouchableOpacity
                      style={[styles.testPrevBtn, currentQIndex === 0 && { opacity: 0.5 }]}
                      disabled={currentQIndex === 0}
                      onPress={() => setCurrentQIndex(prev => prev - 1)}
                    >
                      <Text style={styles.testPrevBtnText}>Previous</Text>
                    </TouchableOpacity>

                    {currentQIndex < activeQuestions.length - 1 ? (
                      <TouchableOpacity
                        style={styles.testNextBtn}
                        onPress={() => setCurrentQIndex(prev => prev + 1)}
                      >
                        <Text style={styles.testNextBtnText}>Next Question</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.testSubmitBtn}
                        onPress={() => setTestCompleted(true)}
                      >
                        <Text style={styles.testSubmitBtnText}>Submit Quiz Test</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              );
            })()
          ) : (
            /* TEST RESULTS SCREEN */
            <ScrollView contentContainerStyle={styles.resultScrollBody} showsVerticalScrollIndicator={false}>
              {(() => {
                const res = calculateScore();
                return (
                  <View style={{ width: '100%', alignItems: 'center' }}>
                    <View style={styles.resTrophyCircle}>
                      <Trophy size={48} color="#D97706" fill="#FBBF24" />
                    </View>

                    <Text style={styles.resTitleText}>Quiz Test Result</Text>
                    <Text style={styles.resSubText}>यहाँ आपका मॉक टेस्ट का विस्तृत रिपोर्ट कार्ड है!</Text>

                    {/* SCORE CARDS */}
                    <View style={styles.resStatsGrid}>
                      <View style={styles.resStatCard}>
                        <CheckCircle2 size={22} color="#10B981" />
                        <Text style={styles.resStatVal}>{res.score} / {res.total}</Text>
                        <Text style={styles.resStatLbl}>Correct Answers</Text>
                      </View>

                      <View style={[styles.resStatCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                        <BarChart3 size={22} color="#2563EB" />
                        <Text style={[styles.resStatVal, { color: '#1D4ED8' }]}>{res.accuracy}%</Text>
                        <Text style={styles.resStatLbl}>Accuracy</Text>
                      </View>

                      <View style={[styles.resStatCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
                        <Zap size={22} color="#D97706" fill="#FBBF24" />
                        <Text style={[styles.resStatVal, { color: '#B45309' }]}>+{res.xp} XP</Text>
                        <Text style={styles.resStatLbl}>Earned</Text>
                      </View>
                    </View>

                    {/* CLOSE RESULTS BUTTON */}
                    <TouchableOpacity
                      style={styles.closeResBtn}
                      onPress={() => setTestModalVisible(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.closeResBtnText}>Back to Quiz Hub</Text>
                    </TouchableOpacity>
                  </View>
                );
              })()}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* MNC STYLE ACCESS RESTRICTED POPUP MODAL */}
      <Modal
        visible={restrictedModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRestrictedModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.mncModalOverlay}>
          <View style={styles.mncModalContainer}>
            <View style={styles.mncLockBadgeCircle}>
              <ShieldAlert size={28} color="#EF4444" />
            </View>
            <Text style={styles.mncModalTitle}>Access Restricted 🔒</Text>
            <Text style={styles.mncModalSubTitle}>{restrictedModal.title}</Text>
            <Text style={styles.mncModalDesc}>{restrictedModal.desc}</Text>
            <View style={styles.mncSupportNoteBox}>
              <Text style={styles.mncSupportNoteText}>
                Need access? Please contact support team.
              </Text>
            </View>
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
    backgroundColor: '#F8FAFC'
  },
  headerBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleBox: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A'
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C'
  },
  stickyHeaderContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10
  },
  scrollBody: {
    padding: 12,
    paddingBottom: 30
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  topicScrollRow: {
    marginBottom: 14
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  topicIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  topicChipName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A'
  },
  topicChipHindi: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500'
  },
  modeTabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  modeTabTextActive: {
    color: '#2563EB',
    fontWeight: '800'
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  calHeadingBox: {
    marginBottom: 10
  },
  calHeadingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  calHeadingSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between'
  },
  calCell: {
    width: '31%',
    height: 56,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative'
  },
  calCellDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  calCellCurrent: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5
  },
  calCellLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1'
  },
  cellIconTop: {
    position: 'absolute',
    top: 4,
    right: 4
  },
  calDayNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B'
  },
  calCellSub: {
    fontSize: 8.5,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '600'
  },
  sectionalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  secHeadingBox: {
    marginBottom: 10
  },
  secHeadingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  secHeadingSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  difficultyGrid: {
    gap: 8,
    marginBottom: 14
  },
  diffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  diffCardActiveEasy: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981'
  },
  diffCardActiveMod: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706'
  },
  diffCardActiveHard: {
    backgroundColor: '#FFE4E6',
    borderColor: '#E11D48'
  },
  diffIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center'
  },
  diffTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  diffSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  startSectionalBtn: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
  startSectionalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  testTopBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  testCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  testHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  timerText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2563EB'
  },
  testScrollBody: {
    padding: 16,
    paddingBottom: 40
  },
  qCounterRow: {
    marginBottom: 12
  },
  qCounterText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2563EB'
  },
  mcqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20
  },
  mcqQuestionText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 16
  },
  optionsList: {
    gap: 10
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0'
  },
  optionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB'
  },
  optKeyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center'
  },
  optKeySelected: {
    backgroundColor: '#2563EB'
  },
  optKeyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569'
  },
  optMainText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B'
  },
  optHindiSub: {
    fontSize: 12,
    color: '#64748B'
  },
  testNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12
  },
  testPrevBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9'
  },
  testPrevBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  testNextBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#2563EB'
  },
  testNextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  testSubmitBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10B981'
  },
  testSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  resultScrollBody: {
    padding: 24,
    alignItems: 'center'
  },
  resTrophyCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F59E0B',
    marginBottom: 16
  },
  resTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A'
  },
  resSubText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 24
  },
  resStatsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 28
  },
  resStatCard: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  resStatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#065F46',
    marginTop: 4
  },
  resStatLbl: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2
  },
  closeResBtn: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeResBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF'
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
