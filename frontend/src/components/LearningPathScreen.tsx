import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Modal
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  ArrowLeft,
  Flame,
  Star,
  Lock,
  Check,
  Play,
  Gift,
  Crown,
  X
} from 'lucide-react-native';
import { DayWordStudyModal } from './DayWordStudyModal';
import { managerApi } from '../api';

const { width } = Dimensions.get('window');

interface LearningPathScreenProps {
  categoryName: string;
  categoryHindi: string;
  categoryColor: string;
  onBack: () => void;
}

export interface DayNode {
  dayNumber: number;
  chapterId?: number;
  title: string;
  titleHindi: string;
  wordCount: number;
  status: 'COMPLETED' | 'CURRENT' | 'LOCKED';
  stars: number; // 0 to 3
  isBossLevel?: boolean;
}

// Helper to generate day title and Hindi metadata
const getDayMetaData = (dayNum: number) => {
  const titles = [
    { title: 'Essential Foundations', titleHindi: 'बुनियादी शब्द' },
    { title: 'High Frequency Words', titleHindi: 'महत्वपूर्ण शब्द' },
    { title: 'SSC & CGL PYQs', titleHindi: 'परीक्षा में पूछे गए शब्द' },
    { title: 'Confusing Vocabulary', titleHindi: 'भ्रमित करने वाले शब्द' },
    { title: 'Grand Milestone Test', titleHindi: 'महा परीक्षा चुनौती' },
    { title: 'Advanced Expressions', titleHindi: 'उच्च स्तरीय शब्द' },
    { title: 'Editorial & Newspaper Words', titleHindi: 'अखबार के कठिन शब्द' },
    { title: 'Root Words & Prefixes', titleHindi: 'मूल शब्द अभ्यास' },
    { title: 'Idioms & Phrasal Verbs', titleHindi: 'मुहावरे और वाक्यांश' },
    { title: 'One Word Substitution', titleHindi: 'एक शब्द प्रतिस्थापन' },
    { title: 'Antonyms & Synonyms', titleHindi: 'विलोम एवं समानार्थी' },
    { title: 'Speed Revision Challenge', titleHindi: 'द्रुत पुनरीक्षण चुनौती' },
    { title: 'Pro Exam Vocabulary', titleHindi: 'प्रो परीक्षा शब्दावली' },
    { title: 'Top 100 Repeated Words', titleHindi: 'शीर्ष 100 बारंबार शब्द' },
    { title: 'Mastery Graduation Test', titleHindi: 'मास्टरी स्नातक परीक्षा' },
  ];

  const idx = (dayNum - 1) % titles.length;
  return {
    title: titles[idx].title,
    titleHindi: titles[idx].titleHindi,
    isBossLevel: dayNum % 5 === 0
  };
};

// Retrieve category specific completed days count from localStorage
const getCategoryCompletedDays = (catName: string): number => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const catSaved = window.localStorage.getItem(`cat_progress_${catName}`);
    if (catSaved) {
      try {
        const parsed = JSON.parse(catSaved);
        if (typeof parsed.completedDays === 'number') return parsed.completedDays;
      } catch (e) { }
    }
  }
  return 0; // Default: 0 days completed initially
};

export const LearningPathScreen: React.FC<LearningPathScreenProps> = ({
  categoryName,
  categoryHindi,
  categoryColor = '#2563EB',
  onBack
}) => {
  const [selectedDay, setSelectedDay] = useState<DayNode | null>(null);
  const [quizVisible, setQuizVisible] = useState(false);
  const [lockedModalNode, setLockedModalNode] = useState<DayNode | null>(null);
  const [completedDaysCount, setCompletedDaysCount] = useState<number>(() => getCategoryCompletedDays(categoryName));
  const [dbChapters, setDbChapters] = useState<any[]>([]);

  // Fetch real chapters added by Manager Panel from backend DB
  React.useEffect(() => {
    let isMounted = true;
    const fetchDbChapters = async () => {
      try {
        const chapters = await managerApi.getChapters();
        if (isMounted && Array.isArray(chapters) && chapters.length > 0) {
          setDbChapters(chapters);
        }
      } catch (e) {
        console.warn('[LearningPathScreen] Could not load DB chapters:', e);
      }
    };
    fetchDbChapters();
    return () => { isMounted = false; };
  }, []);

  // Dynamically compute day nodes: Show at least 7 days initially.
  // As days are completed, show (7 + completedDaysCount) days (e.g. 1 done -> Day 8 shows!).
  const dayNodes: DayNode[] = React.useMemo(() => {
    const totalDaysToShow = Math.max(7, 7 + completedDaysCount);
    const nodes: DayNode[] = [];

    for (let d = 1; d <= totalDaysToShow; d++) {
      const dbCh = dbChapters.find((ch: any) => (ch.dayNumber || ch.day_number) === d);
      const meta = getDayMetaData(d);

      let status: 'COMPLETED' | 'CURRENT' | 'LOCKED' = 'LOCKED';
      let stars = 0;

      if (d <= completedDaysCount) {
        status = 'COMPLETED';
        stars = 3;
      } else if (d === completedDaysCount + 1) {
        status = 'CURRENT';
        stars = 0;
      } else {
        status = 'LOCKED';
        stars = 0;
      }

      nodes.push({
        dayNumber: d,
        chapterId: dbCh?.id,
        title: dbCh?.title || meta.title,
        titleHindi: dbCh?.description || meta.titleHindi,
        wordCount: dbCh?.words && Array.isArray(dbCh.words) && dbCh.words.length > 0 ? dbCh.words.length : 25,
        status,
        stars,
        isBossLevel: meta.isBossLevel
      });
    }

    return nodes;
  }, [completedDaysCount, dbChapters]);

  // Snake path offset logic: returns horizontal alignment (left, center, right)
  const getOffset = (index: number) => {
    const pattern = [0, 55, 95, 55, 0, -55, -95, -55];
    return pattern[index % pattern.length];
  };

  const handleNodeClick = (node: DayNode) => {
    if (node.status === 'LOCKED') {
      setLockedModalNode(node);
      return;
    }
    setSelectedDay(node);
    setQuizVisible(true);
  };

  // Build smooth SVG bezier snake path string connecting all node centers
  const svgWidth = 360;
  const nodeYSpacing = 150; // Vertical spacing
  const startY = 50;
  const centerX = svgWidth / 2;

  let overallPathD = '';
  let completedPathD = '';

  dayNodes.forEach((node, i) => {
    const currX = centerX + getOffset(i);
    const currY = startY + i * nodeYSpacing;

    if (i === 0) {
      overallPathD = `M ${currX} ${currY}`;
      if (node.status === 'COMPLETED') completedPathD = `M ${currX} ${currY}`;
    } else {
      const prevX = centerX + getOffset(i - 1);
      const prevY = startY + (i - 1) * nodeYSpacing;
      const cp1Y = prevY + nodeYSpacing / 2;
      const cp2Y = currY - nodeYSpacing / 2;

      const curveSegment = ` C ${prevX} ${cp1Y}, ${currX} ${cp2Y}, ${currX} ${currY}`;
      overallPathD += curveSegment;

      if (dayNodes[i - 1].status === 'COMPLETED') {
        if (!completedPathD) completedPathD = `M ${prevX} ${prevY}`;
        completedPathD += curveSegment;
      }
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER BAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {categoryName.toLowerCase().includes('words') ? categoryName : `${categoryName} Words`}
          </Text>
          <Text style={styles.headerSub}>{categoryHindi}</Text>
        </View>

        <View style={styles.headerStats}>
          <View style={styles.statChip}>
            <Flame size={18} color="#F97316" fill="#F97316" />
            <Text style={styles.statText}>{completedDaysCount} Days</Text>
          </View>
        </View>
      </View>

      {/* SNAKE LEARNING PATH SCROLLVIEW */}
      <ScrollView
        contentContainerStyle={styles.pathScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PATH NODES CONTAINER */}
        <View style={[styles.nodesListContainer, { height: dayNodes.length * nodeYSpacing + 60 }]}>
          {/* SVG SMOOTH CONNECTING SNAKE PATH */}
          <Svg height={dayNodes.length * nodeYSpacing + 60} width={svgWidth} style={styles.svgOverlay}>
            {/* Background Dotted Line */}
            <Path
              d={overallPathD}
              stroke="#CBD5E1"
              strokeWidth="5"
              strokeDasharray="7 5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Active Completed Green/Brand Line */}
            {completedPathD !== '' && (
              <Path
                d={completedPathD}
                stroke="#10B981"
                strokeWidth="5"
                fill="none"
                strokeLinecap="round"
              />
            )}
          </Svg>

          {dayNodes.map((node, index) => {
            const isCurrent = node.status === 'CURRENT';
            const isCompleted = node.status === 'COMPLETED';
            const isLocked = node.status === 'LOCKED';
            const isBoss = node.isBossLevel;
            const nodeOffset = getOffset(index);

            return (
              <View
                key={node.dayNumber}
                style={[
                  styles.nodeAbsoluteRow,
                  {
                    top: index * nodeYSpacing + 15,
                    transform: [{ translateX: nodeOffset }]
                  }
                ]}
              >
                {/* CURRENT DAY ACTIVE PULSE CALLOUT BADGE (ABOVE NODE) */}
                {isCurrent && (
                  <View style={[styles.activeCalloutBadge, { backgroundColor: categoryColor }]}>
                    <Text style={styles.activeCalloutText}>START</Text>
                  </View>
                )}

                {/* Main Interactive Circle Node */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => handleNodeClick(node)}
                  style={[
                    styles.nodeCircle,
                    isCompleted && styles.nodeCompleted,
                    isCurrent && [styles.nodeCurrent, { borderColor: categoryColor, shadowColor: categoryColor }],
                    isLocked && styles.nodeLocked,
                    isBoss && styles.nodeBoss
                  ]}
                >
                  {isCompleted && (
                    <View style={styles.completedInner}>
                      <Check size={28} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}

                  {isCurrent && (
                    <View style={[styles.currentInner, { backgroundColor: categoryColor }]}>
                      <Play size={26} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
                    </View>
                  )}

                  {isLocked && !isBoss && <Lock size={22} color="#94A3B8" />}

                  {isBoss && isLocked && <Lock size={24} color="#94A3B8" />}
                  {isBoss && !isLocked && <Crown size={28} color="#D97706" fill="#FBBF24" />}
                </TouchableOpacity>

                {/* NODE INFO LABEL - CLEAN DAY BADGE BELOW NODE */}
                <View style={[styles.nodeDayPill, isCurrent && { backgroundColor: categoryColor, borderColor: categoryColor }]}>
                  <Text style={[styles.nodeDayText, isCurrent && { color: '#FFFFFF', fontWeight: '800' }]}>
                    Day {node.dayNumber}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* BOTTOM ELLIPSIS CARD (...) INDICATOR FOR CONTINUOUS DAYS */}
          <View
            style={[
              styles.nodeAbsoluteRow,
              {
                top: dayNodes.length * nodeYSpacing + 15,
                transform: [{ translateX: getOffset(dayNodes.length) }]
              }
            ]}
          >
            <View style={styles.ellipsisPill}>
              <Text style={styles.ellipsisText}>• • •</Text>
              <Text style={styles.ellipsisSubText}>More Days Unlocking</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* BEAUTIFUL NATIVE IN-APP LOCKED DAY POPUP MODAL */}
      <Modal
        visible={!!lockedModalNode}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLockedModalNode(null)}
      >
        <View style={styles.lockedModalOverlay}>
          <View style={styles.lockedModalCard}>
            {/* Top Close Button */}
            <TouchableOpacity
              style={styles.lockedCloseBtn}
              onPress={() => setLockedModalNode(null)}
              activeOpacity={0.8}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Lock Animated Icon Header */}
            <View style={styles.lockedIconBox}>
              <Lock size={36} color="#F59E0B" />
            </View>

            <Text style={styles.lockedTitle}>
              Day {lockedModalNode?.dayNumber} is Locked! 🔒
            </Text>

            <Text style={styles.lockedDesc}>
              Complete <Text style={{ fontWeight: '800', color: '#0F172A' }}>Day {lockedModalNode ? lockedModalNode.dayNumber - 1 : 1}</Text> first to unlock Day {lockedModalNode?.dayNumber}.
            </Text>

            <Text style={styles.lockedHindiSub}>
              दिन {lockedModalNode ? lockedModalNode.dayNumber - 1 : 1} को पूरा करके दिन {lockedModalNode?.dayNumber} खोलें।
            </Text>

            {/* Primary Action Button: Start Previous Unlocked Day */}
            <TouchableOpacity
              style={styles.lockedPrimaryBtn}
              onPress={() => {
                const prevDayNum = lockedModalNode ? lockedModalNode.dayNumber - 1 : 1;
                const prevNode = dayNodes.find(n => n.dayNumber === prevDayNum) || dayNodes.find(n => n.status === 'CURRENT') || dayNodes[0];
                setLockedModalNode(null);
                if (prevNode) {
                  setSelectedDay(prevNode);
                  setQuizVisible(true);
                }
              }}
              activeOpacity={0.85}
            >
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.lockedPrimaryBtnText}>
                Start Day {lockedModalNode ? lockedModalNode.dayNumber - 1 : 1} Now
              </Text>
            </TouchableOpacity>

            {/* Secondary Cancel Button */}
            <TouchableOpacity
              style={styles.lockedSecondaryBtn}
              onPress={() => setLockedModalNode(null)}
              activeOpacity={0.8}
            >
              <Text style={styles.lockedSecondaryText}>Got It / ठीक है</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* INTERACTIVE DAY PRACTICE & REVISION MODAL */}
      {selectedDay && (
        <DayWordStudyModal
          visible={quizVisible}
          dayNumber={selectedDay.dayNumber}
          categoryName={categoryName}
          categoryHindi={categoryHindi}
          onClose={() => setQuizVisible(false)}
          onCompleteDay={(completedDayNum) => {
            const nextCount = Math.max(completedDaysCount, completedDayNum);
            setCompletedDaysCount(nextCount);

            // Persist completed days for this category in localStorage
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem(`cat_progress_${categoryName}`, JSON.stringify({ completedDays: nextCount }));

              const saved = window.localStorage.getItem('userObj');
              const userObj = saved ? JSON.parse(saved) : {};
              const newStreak = (userObj.currentStreak || userObj.streak || 0) + 1;
              const newXp = (userObj.totalXp || userObj.xp || 0) + 50;

              const updatedObj = {
                ...userObj,
                currentStreak: newStreak,
                streak: newStreak,
                totalXp: newXp,
                xp: newXp,
                completedDays: Math.max(userObj.completedDays || 0, nextCount)
              };

              window.localStorage.setItem('userObj', JSON.stringify(updatedObj));
              window.dispatchEvent(new Event('userProfileUpdated'));

              // Persist to MySQL DB
              const uid = userObj.id || userObj.userId || 1;
              managerApi.updateProfile({
                userId: uid,
                fullName: userObj.fullName || userObj.name
              }).catch(e => console.warn('[LearningPathScreen] DB streak update warning:', e));
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  headerBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleContainer: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A'
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500'
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C'
  },
  pathScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center'
  },
  bannerCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 5,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2
  },
  bannerTextCol: {
    flex: 1,
    paddingRight: 12
  },
  bannerBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 2
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  bannerDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  nodesListContainer: {
    width: 360,
    alignItems: 'center',
    position: 'relative'
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1
  },
  nodeAbsoluteRow: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 3
  },
  nodeCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2
  },
  nodeCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#059669'
  },
  completedInner: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  nodeCurrent: {
    backgroundColor: '#2563EB',
    borderWidth: 4,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    transform: [{ scale: 1.1 }]
  },
  currentInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  nodeLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1'
  },
  nodeBoss: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B'
  },
  activeCalloutBadge: {
    position: 'absolute',
    top: -24,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5
  },
  activeCalloutText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5
  },
  nodeDayPill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 4
  },
  nodeDayText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B'
  },
  ellipsisPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ellipsisText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 2
  },
  ellipsisSubText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2
  },
  lockedModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  lockedModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  lockedCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lockedIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    borderWidth: 3,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8
  },
  lockedDesc: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4
  },
  lockedHindiSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500'
  },
  lockedPrimaryBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 10
  },
  lockedPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  lockedSecondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  lockedSecondaryText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700'
  }
});
