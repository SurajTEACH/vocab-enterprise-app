import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Image
} from 'react-native';
import {
  Volume2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  BookOpen,
  RotateCcw,
  Zap,
  Clock,
  X
} from 'lucide-react-native';

import { managerApi } from '../api';
import { useSettings } from '../context/SettingsContext';

const trophyImg = require('../../assets/golden_trophy_transparent.png');
const { width } = Dimensions.get('window');

export interface WordDetail {
  id: number;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  hindiMeaning: string;
  synonyms: { word: string; hindi: string }[];
  exampleSentence: string;
  exampleHindi?: string;
  isRevision?: boolean;
}

interface DayWordStudyModalProps {
  visible: boolean;
  dayNumber: number;
  categoryName: string;
  categoryHindi: string;
  onClose: () => void;
  onCompleteDay: (dayNum: number) => void;
}

export const DayWordStudyModal: React.FC<DayWordStudyModalProps> = ({
  visible,
  dayNumber,
  categoryName,
  categoryHindi,
  onClose,
  onCompleteDay
}) => {
  const { settings, playSound } = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [wordsList, setWordsList] = useState<WordDetail[]>([]);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let isMounted = true;
    if (visible) {
      setCurrentIndex(0);
      setIsCompleted(false);
      setCountdown(5);

      const fetchDbWords = async () => {
        try {
          // 1. Fetch Day Study Words (15 Revision from Day N-1 + 15 New for Day N) directly from Spring Boot Backend
          const dayStudyData = await managerApi.getDayStudyWords(categoryName, dayNumber);

          if (dayStudyData && (dayStudyData.allWords?.length > 0 || dayStudyData.newWords?.length > 0 || dayStudyData.revisionWords?.length > 0)) {
            const revs: WordDetail[] = (dayStudyData.revisionWords || []).map((w: any, idx: number) => ({
              id: w.id || idx + 1,
              word: w.word,
              phonetic: w.phonetic || '/.../',
              partOfSpeech: w.partOfSpeech || 'Noun',
              meaning: w.meaning || '',
              hindiMeaning: w.hindiMeaning || '',
              synonyms: [{ word: 'Synonym', hindi: w.hindiMeaning || 'समानार्थी' }],
              exampleSentence: w.exampleSentence || `${w.word} is important for competitive exams.`,
              exampleHindi: w.hindiMeaning ? `अर्थ: ${w.hindiMeaning}` : '',
              isRevision: true
            }));

            const news: WordDetail[] = (dayStudyData.newWords || []).map((w: any, idx: number) => ({
              id: w.id || 1000 + idx,
              word: w.word,
              phonetic: w.phonetic || '/.../',
              partOfSpeech: w.partOfSpeech || 'Noun',
              meaning: w.meaning || '',
              hindiMeaning: w.hindiMeaning || '',
              synonyms: [{ word: 'Synonym', hindi: w.hindiMeaning || 'समानार्थी' }],
              exampleSentence: w.exampleSentence || `${w.word} is important for competitive exams.`,
              exampleHindi: w.hindiMeaning ? `अर्थ: ${w.hindiMeaning}` : '',
              isRevision: false
            }));

            const combined = [...revs, ...news];
            if (isMounted && combined.length > 0) {
              setWordsList(combined);
              return;
            }
          }
        } catch (e) {
          console.warn('[DayWordStudyModal] Fetch day study API warning:', e);
        }

        // 2. Client-side Spaced-Repetition Fallback if offline or mock DB
        try {
          let words = await managerApi.getChapterWords(dayNumber);
          if (!Array.isArray(words) || words.length === 0) {
            words = await managerApi.getWords();
          }

          if (isMounted && Array.isArray(words) && words.length > 0) {
            const catClean = categoryName ? categoryName.toLowerCase().replace('words', '').trim() : '';
            const catWords = words.filter((w: any) =>
              !categoryName ||
              (w.category && w.category.toLowerCase().includes(catClean)) ||
              catClean.includes('synonym')
            );

            const pool = catWords.length > 0 ? catWords : words;
            const totalPoolSize = pool.length;

            const newWordsCount = 15;
            const revisionWordsCount = dayNumber > 1 ? 15 : 0;

            const newStart = (dayNumber - 1) * newWordsCount;
            const revStart = dayNumber > 1 ? (dayNumber - 2) * newWordsCount : 0;

            const revList: WordDetail[] = [];
            if (dayNumber > 1) {
              for (let i = 0; i < revisionWordsCount; i++) {
                const w = pool[(revStart + i) % totalPoolSize];
                revList.push({
                  id: w.id || i + 1,
                  word: w.word,
                  phonetic: w.phonetic || '/.../',
                  partOfSpeech: w.partOfSpeech || 'Noun',
                  meaning: w.meaning || '',
                  hindiMeaning: w.hindiMeaning || '',
                  synonyms: [{ word: 'Synonym', hindi: w.hindiMeaning || 'समानार्थी' }],
                  exampleSentence: w.exampleSentence || `${w.word} is important for competitive exams.`,
                  exampleHindi: w.hindiMeaning ? `अर्थ: ${w.hindiMeaning}` : '',
                  isRevision: true
                });
              }
            }

            const newList: WordDetail[] = [];
            for (let i = 0; i < newWordsCount; i++) {
              const w = pool[(newStart + i) % totalPoolSize];
              newList.push({
                id: w.id || 1000 + i,
                word: w.word,
                phonetic: w.phonetic || '/.../',
                partOfSpeech: w.partOfSpeech || 'Noun',
                meaning: w.meaning || '',
                hindiMeaning: w.hindiMeaning || '',
                synonyms: [{ word: 'Synonym', hindi: w.hindiMeaning || 'समानार्थी' }],
                exampleSentence: w.exampleSentence || `${w.word} is important for competitive exams.`,
                exampleHindi: w.hindiMeaning ? `अर्थ: ${w.hindiMeaning}` : '',
                isRevision: false
              });
            }

            setWordsList([...revList, ...newList]);
            return;
          }
        } catch (err) {
          console.warn('[DayWordStudyModal] Fallback word fetch error:', err);
        }

        if (isMounted) {
          setWordsList([]);
        }
      };

      fetchDbWords();
    }
    return () => { isMounted = false; };
  }, [visible, dayNumber, categoryName]);

  // 5-second Countdown & Automatic Redirect to Home Page after completion
  useEffect(() => {
    let timer: any;
    if (isCompleted && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (isCompleted && countdown === 0) {
      onCompleteDay(dayNumber);
      onClose();
    }
    return () => clearInterval(timer);
  }, [isCompleted, countdown]);

  // Auto-play audio when word changes if enabled in System Settings
  useEffect(() => {
    if (visible && wordsList[currentIndex]?.word && settings.autoPlayAudio && !isCompleted) {
      const timer = setTimeout(() => {
        playSound(wordsList[currentIndex].word);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [visible, currentIndex, wordsList, settings.autoPlayAudio, isCompleted, playSound]);

  if (!visible || wordsList.length === 0) return null;

  const currentWord = wordsList[currentIndex];
  const progressPercent = ((currentIndex + 1) / wordsList.length) * 100;

  // Speak word using global SettingsContext TTS player
  const handlePlaySound = (wordToSpeak: string) => {
    if (wordToSpeak) {
      playSound(wordToSpeak);
    }
  };


  const handleNext = () => {
    if (currentIndex < wordsList.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (wordsList.length === 0) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', maxWidth: 420, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, elevation: 5 }}>
            <BookOpen size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginBottom: 8 }}>
              No Words in Database
            </Text>
            <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Day {dayNumber} currently has no vocabulary terms saved in the database. Please add new words using the Manager Panel!
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{ backgroundColor: '#2563EB', paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <X size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerDayTitle}>Day {dayNumber} Practice</Text>
            <Text style={styles.headerCategorySub}>{categoryName} ({categoryHindi})</Text>
          </View>

          <View style={styles.counterChip}>
            <Text style={styles.counterText}>{currentIndex + 1}/{wordsList.length}</Text>
          </View>
        </View>

        {/* PROGRESS BAR */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        {/* SCREEN CONTENT: EITHER PRACTICE CARD OR THANK YOU CELEBRATION */}
        {!isCompleted ? (
          <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* DISTINCT BADGES: REVISION WORD vs NEW WORD */}
            <View style={styles.tagRow}>
              {currentWord.isRevision ? (
                <View style={styles.revisionBadge}>
                  <RotateCcw size={13} color="#D97706" />
                  <Text style={styles.revisionBadgeText}>DAY {dayNumber > 1 ? dayNumber - 1 : 1} REVISION WORD</Text>
                </View>
              ) : (
                <View style={[styles.revisionBadge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                  <Sparkles size={13} color="#2563EB" />
                  <Text style={[styles.revisionBadgeText, { color: '#1E40AF' }]}>DAY {dayNumber} NEW WORD</Text>
                </View>
              )}
            </View>

            {/* DIRECT COMPACT CONTENT LAYOUT (NO OUTER CARD BOX) */}
            <View style={styles.directContentLayout}>
              {/* WORD TITLE & SOUND BUTTON */}
              <View style={styles.wordTitleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.wordMainText}>{currentWord.word}</Text>
                  <Text style={styles.phoneticText}>{currentWord.phonetic} • {currentWord.partOfSpeech}</Text>
                </View>

                {/* AUDIO SOUND ICON BUTTON */}
                <TouchableOpacity
                  style={styles.soundButton}
                  onPress={() => handlePlaySound(currentWord.word)}
                  activeOpacity={0.8}
                >
                  <Volume2 size={22} color="#2563EB" />
                </TouchableOpacity>
              </View>

              {/* HINDI MEANING BOX */}
              <View style={styles.meaningBox}>
                <Text style={styles.meaningLabel}>हिंदी अर्थ (Hindi Meaning):</Text>
                <Text style={styles.hindiMeaningText}>{currentWord.hindiMeaning}</Text>
              </View>

              {/* ENGLISH MEANING */}
              <View style={styles.engMeaningBox}>
                <Text style={styles.engMeaningLabel}>English Meaning:</Text>
                <Text style={styles.engMeaningText}>{currentWord.meaning}</Text>
              </View>

              {/* SYNONYMS SECTION WITH HINDI MEANINGS */}
              <View style={styles.synonymsSection}>
                <View style={styles.synHeaderRow}>
                  <BookOpen size={15} color="#2563EB" />
                  <Text style={styles.synSectionTitle}>Synonyms (समानार्थी शब्द):</Text>
                </View>

                <View style={styles.synonymsGrid}>
                  {currentWord.synonyms.map((syn, idx) => (
                    <View key={idx} style={styles.synonymChip}>
                      <Text style={styles.synWordText}>{syn.word}</Text>
                      <Text style={styles.synHindiText}>({syn.hindi})</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* EXAMPLE SENTENCE & TRANSLATION */}
              <View style={styles.exampleBox}>
                <Text style={styles.exampleLabel}>उदाहरण (Example Sentence):</Text>
                <Text style={styles.exampleEng}>"{currentWord.exampleSentence}"</Text>
                {currentWord.exampleHindi && (
                  <Text style={styles.exampleHindi}>"{currentWord.exampleHindi}"</Text>
                )}
              </View>
            </View>
          </ScrollView>
        ) : (
          /* THANK YOU CELEBRATION SCREEN MATCHING EXACT IMAGE 2 GRAPHIC DESIGN */
          <ScrollView contentContainerStyle={styles.celebrationScrollBody} showsVerticalScrollIndicator={false}>
            {/* TOP 3D GOLDEN TROPHY ILLUSTRATION WITH BLUE LEAVES & CONFETTI */}
            <View style={styles.trophyHeaderContainer}>
              <Image source={trophyImg} style={styles.trophyImgHeader} resizeMode="contain" />
            </View>

            {/* BLUE VERTICAL ACCENT BAR NEXT TO HEADING */}
            <View style={styles.thankYouHeadingRow}>
              <View style={styles.blueVerticalBar} />
              <View>
                <Text style={styles.thankYouTitleText}>Thank You For</Text>
                <Text style={styles.thankYouTitleTextBlue}>Practice!</Text>
              </View>
            </View>

            {/* SUBTITLE */}
            <Text style={styles.thankYouSubText}>
              शानदार प्रयास! आपने Day {dayNumber} की प्रैक्टिस सफलतापूर्वक पूर्ण कर ली है।
            </Text>

            {/* 2 RICH STAT CARDS (MATCHING IMAGE 2) */}
            <View style={styles.graphicStatsRow}>
              {/* Card 1: Green Words Card */}
              <View style={styles.greenGraphicCard}>
                <View style={styles.greenIconCircle}>
                  <CheckCircle2 size={22} color="#10B981" />
                </View>
                <Text style={styles.greenCardVal}>{wordsList.length} Words</Text>
                <Text style={styles.greenCardSub}>Practiced</Text>
                <View style={styles.greenBarAccent} />
              </View>

              {/* Card 2: Amber XP Card */}
              <View style={styles.amberGraphicCard}>
                <View style={styles.amberIconCircle}>
                  <Zap size={22} color="#F59E0B" fill="#F59E0B" />
                </View>
                <Text style={styles.amberCardVal}>+50 XP</Text>
                <Text style={styles.amberCardSub}>Earned</Text>
                <View style={styles.amberBarAccent} />
              </View>
            </View>
          </ScrollView>
        )}

        {/* BOTTOM NAVIGATION CONTROLS (PREVIOUS / NEXT) */}
        {!isCompleted && (
          <View style={styles.bottomNavControls}>
            <TouchableOpacity
              style={[styles.prevBtn, currentIndex === 0 && styles.btnDisabled]}
              onPress={handlePrev}
              disabled={currentIndex === 0}
              activeOpacity={0.8}
            >
              <ArrowLeft size={18} color={currentIndex === 0 ? '#94A3B8' : '#0F172A'} />
              <Text style={[styles.prevBtnText, currentIndex === 0 && { color: '#94A3B8' }]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNext}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {currentIndex === wordsList.length - 1 ? 'Finish Practice' : 'Next Word'}
              </Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleBox: {
    alignItems: 'center'
  },
  headerDayTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  headerCategorySub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500'
  },
  counterChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB'
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: '#E2E8F0'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB'
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 90
  },
  tagRow: {
    marginBottom: 8,
    alignItems: 'flex-start'
  },
  revisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  revisionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309'
  },
  directContentLayout: {
    width: '100%'
  },
  wordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  wordMainText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5
  },
  phoneticText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2
  },
  soundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  meaningBox: {
    marginTop: 12,
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB'
  },
  meaningLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase'
  },
  hindiMeaningText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4
  },
  engMeaningBox: {
    marginTop: 14
  },
  engMeaningLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  engMeaningText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    marginTop: 2
  },
  synonymsSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9'
  },
  synHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  synSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A'
  },
  synonymsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10
  },
  synonymChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  synWordText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  synHindiText: {
    fontSize: 12,
    color: '#64748B'
  },
  exampleBox: {
    marginTop: 18,
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309'
  },
  exampleEng: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78350F',
    fontStyle: 'italic',
    marginTop: 4
  },
  exampleHindi: {
    fontSize: 13,
    color: '#92400E',
    marginTop: 2
  },
  celebrationScrollBody: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: 'center'
  },
  trophyHeaderContainer: {
    width: '100%',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10
  },
  trophyImgHeader: {
    width: 220,
    height: 170,
    mixBlendMode: 'multiply' as any
  },
  thankYouHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 8
  },
  blueVerticalBar: {
    width: 5,
    height: 64,
    backgroundColor: '#2563EB',
    borderRadius: 3
  },
  thankYouTitleText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 32
  },
  thankYouTitleTextBlue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2563EB',
    lineHeight: 36
  },
  thankYouSubText: {
    fontSize: 13,
    color: '#64748B',
    alignSelf: 'flex-start',
    lineHeight: 18,
    marginBottom: 20
  },
  graphicStatsRow: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
    marginBottom: 24
  },
  greenGraphicCard: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    position: 'relative'
  },
  greenIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  greenCardVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#065F46'
  },
  greenCardSub: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    marginTop: 2
  },
  greenBarAccent: {
    height: 4,
    width: 40,
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginTop: 10
  },
  amberGraphicCard: {
    flex: 1,
    backgroundColor: '#FEF3C7',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    position: 'relative'
  },
  amberIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  amberCardVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#B45309'
  },
  amberCardSub: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 2
  },
  amberBarAccent: {
    height: 4,
    width: 40,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
    marginTop: 10
  },
  autoRedirectChip: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  autoRedirectText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B'
  },
  bottomNavControls: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0'
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9'
  },
  btnDisabled: {
    opacity: 0.5
  },
  prevBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#2563EB'
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  }
});
