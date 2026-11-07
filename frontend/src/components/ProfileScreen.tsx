import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Dimensions,
  Platform
} from 'react-native';
import {
  ArrowLeft,
  Camera,
  Trophy,
  Flame,
  Award,
  CheckCircle2,
  BarChart3,
  Star,
  Users,
  Calendar,
  BookOpen,
  Zap,
  Target,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  Edit2,
  X,
  Check,
  User,
  Mail,
  FileText,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  LogOut
} from 'lucide-react-native';
import { Modal, TextInput, ActivityIndicator } from 'react-native';
import { managerApi } from '../api';

const { width } = Dimensions.get('window');

export interface RankerProfile {
  rank: number;
  name: string;
  city: string;
  state: string;
  targetExam: string;
  xp: string;
  streak: string;
  avatar: string;
  badge: string;
  completedDays: number;
  accuracy: string;
  isCurrentUser?: boolean;
}

interface ProfileScreenProps {
  onBackToHome: () => void;
  userRole?: 'STUDENT' | 'MANAGER';
  currentUser?: any;
  onToggleRole?: () => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBackToHome,
  userRole = 'STUDENT',
  currentUser,
  onToggleRole,
  onLogout
}) => {
  // Read active logged-in user from localStorage (primary) or prop
  const getActiveUser = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('userObj');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.id || parsed.userId || parsed.email || parsed.username || parsed.fullName)) {
            return parsed;
          }
        } catch (e) { }
      }
    }
    return currentUser || null;
  };

  const activeUser = getActiveUser();

  // Dynamic User Profile State from logged in user
  const [avatarUri, setAvatarUri] = useState<string>(
    activeUser?.profileImage || activeUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'
  );
  const [userName, setUserName] = useState(activeUser?.fullName || activeUser?.name || activeUser?.username || 'User');
  const [userCity, setUserCity] = useState(activeUser?.city || 'India');
  const [userState, setUserState] = useState(activeUser?.state || '');
  const [targetExam, setTargetExam] = useState(activeUser?.targetExam || 'General Competitions');
  const [userEmail, setUserEmail] = useState(activeUser?.email || 'N/A');
  const [userMobile, setUserMobile] = useState(activeUser?.mobileNumber || activeUser?.mobile || '');
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const syncProfileData = async () => {
    const user = getActiveUser();
    if (user) {
      if (user.fullName || user.name || user.username) {
        setUserName(user.fullName || user.name || user.username);
      }
      if (user.email) {
        setUserEmail(user.email);
      }
      if (user.mobileNumber || user.mobile) {
        setUserMobile(user.mobileNumber || user.mobile);
      }
      if (user.city) {
        setUserCity(user.city);
      }
      if (user.targetExam) {
        setTargetExam(user.targetExam);
      }
      const img = user.profileImage || user.avatar;
      if (img) {
        setAvatarUri(img);
      }

      // Query MySQL DB endpoint to load saved DB record
      try {
        let dbUser = null;
        if (user.email) {
          dbUser = await managerApi.getProfileByEmail(user.email);
        } else if (user.id || user.userId) {
          dbUser = await managerApi.getProfile(user.id || user.userId);
        }
        if (dbUser) {
          if (dbUser.fullName) setUserName(dbUser.fullName);
          if (dbUser.email) setUserEmail(dbUser.email);
          if (dbUser.mobileNumber) setUserMobile(dbUser.mobileNumber);
          if (dbUser.city) setUserCity(dbUser.city);
          if (dbUser.targetExam) setTargetExam(dbUser.targetExam);
          if (dbUser.profileImage) setAvatarUri(dbUser.profileImage);

          if (typeof window !== 'undefined' && window.localStorage) {
            const saved = window.localStorage.getItem('userObj');
            const userObj = saved ? JSON.parse(saved) : {};
            const newObj = {
              ...userObj,
              ...dbUser,
              name: dbUser.fullName || userObj.name,
              avatar: dbUser.profileImage || userObj.avatar
            };
            window.localStorage.setItem('userObj', JSON.stringify(newObj));
          }
        }
      } catch (err) {
        console.warn('[ProfileScreen] Direct DB profile fetch warning:', err);
      }
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    syncProfileData();

    // Listen for custom real-time profile update events
    const handleProfileUpdateEvent = () => {
      syncProfileData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userProfileUpdated', handleProfileUpdateEvent);
      window.addEventListener('storage', handleProfileUpdateEvent);
    }

    // Fetch registered database users for real leaderboard rankings
    const fetchDbUsers = async () => {
      try {
        const users = await managerApi.getStudents();
        if (isMounted && Array.isArray(users)) {
          setDbUsers(users);
        }
      } catch (e) {
        console.warn('[ProfileScreen] Could not load registered users for rankings:', e);
      }
    };
    fetchDbUsers();

    return () => {
      isMounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('userProfileUpdated', handleProfileUpdateEvent);
        window.removeEventListener('storage', handleProfileUpdateEvent);
      }
    };
  }, [currentUser]);

  // Ranker Modal View State
  const [selectedRanker, setSelectedRanker] = useState<RankerProfile | null>(null);

  // Full-Page Sub-Screen Navigation State (No Popup Modals - Matching Enterprise Real App UX)
  const [profileSubScreen, setProfileSubScreen] = useState<'MAIN' | 'EDIT_PROFILE' | 'CHANGE_PASSWORD'>('MAIN');

  // Edit Profile Form State
  const [tempName, setTempName] = useState(userName);
  const [tempEmail, setTempEmail] = useState(userEmail);
  const [tempMobile, setTempMobile] = useState(userMobile);
  const [tempCity, setTempCity] = useState(userCity);
  const [tempTargetExam, setTempTargetExam] = useState(targetExam);

  // Dedicated Password Update Screen State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  // Tab State: Default to 'DAY_TESTS' for crisp compact view
  const [activeTab, setActiveTab] = useState<'DAY_TESTS' | 'SECTIONAL_TESTS' | 'LEADERBOARD'>('DAY_TESTS');

  // Handle Edit Profile Open
  const handleOpenEditModal = () => {
    const curr = getActiveUser();
    setTempName(curr?.fullName || userName);
    setTempEmail(curr?.email || userEmail);
    setTempMobile(curr?.mobileNumber || curr?.mobile || userMobile);
    setTempCity(curr?.city || userCity);
    setTempTargetExam(curr?.targetExam || targetExam);
    setSuccessToast(false);
    setProfileSubScreen('EDIT_PROFILE');
  };

  // Save Edit Profile to MySQL DB via Backend API
  const handleSaveProfile = async () => {
    const user = getActiveUser();
    const userId = user?.id || user?.userId;
    const emailToUse = tempEmail || user?.email || userEmail;
    setSaving(true);
    setSuccessToast(false);

    try {
      const updatedUser = await managerApi.updateProfile({
        userId,
        email: emailToUse,
        fullName: tempName,
        mobileNumber: tempMobile,
        city: tempCity,
        targetExam: tempTargetExam,
        profileImage: avatarUri
      });

      const finalName = updatedUser?.fullName || tempName;
      const finalEmail = updatedUser?.email || emailToUse;
      const finalMobile = updatedUser?.mobileNumber || tempMobile;
      const finalCity = updatedUser?.city || tempCity;
      const finalExam = updatedUser?.targetExam || tempTargetExam;
      const finalImg = updatedUser?.profileImage || avatarUri;

      setUserName(finalName);
      setUserEmail(finalEmail);
      setUserMobile(finalMobile);
      setUserCity(finalCity);
      setTargetExam(finalExam);
      if (finalImg) setAvatarUri(finalImg);

      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('userObj');
        const userObj = saved ? JSON.parse(saved) : {};
        const newObj = {
          ...userObj,
          id: updatedUser?.id || userId || userObj.id,
          userId: updatedUser?.id || userId || userObj.userId,
          fullName: finalName,
          name: finalName,
          username: userObj.username || finalName,
          email: finalEmail,
          mobileNumber: finalMobile,
          mobile: finalMobile,
          city: finalCity,
          targetExam: finalExam,
          profileImage: finalImg,
          avatar: finalImg
        };
        window.localStorage.setItem('userObj', JSON.stringify(newObj));
        window.dispatchEvent(new Event('userProfileUpdated'));
      }

      setProfileSubScreen('MAIN');
      setShowSuccessPopup(true);

      setTimeout(() => {
        setShowSuccessPopup(false);
      }, 4000);

      const users = await managerApi.getStudents();
      if (Array.isArray(users)) setDbUsers(users);

    } catch (e: any) {
      console.error('[ProfileScreen] Save profile failed:', e);
      setProfileSubScreen('MAIN');
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Failed to save profile to database. Please check your backend connection.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Dedicated Password Update Handler
  const handleUpdatePassword = async () => {
    setPwError(null);
    setPwSuccess(false);

    if (!newPassword.trim()) {
      setPwError('Please enter a new password.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setPwError('New password and Confirm password do not match.');
      return;
    }

    const user = getActiveUser();
    const userId = user?.id || user?.userId;
    const emailToUse = user?.email || userEmail;

    setPwSaving(true);
    try {
      await managerApi.updateProfile({
        userId,
        email: emailToUse,
        password: newPassword.trim()
      });

      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('userObj');
        const userObj = saved ? JSON.parse(saved) : {};
        const newObj = {
          ...userObj,
          password: newPassword.trim()
        };
        window.localStorage.setItem('userObj', JSON.stringify(newObj));
        window.dispatchEvent(new Event('userProfileUpdated'));
      }

      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setPwSuccess(false);
        setProfileSubScreen('MAIN');
        setShowSuccessPopup(true);
      }, 1500);

    } catch (e: any) {
      console.error('Password update error:', e);
      setPwError(e?.message || 'Failed to update password. Please check your backend connection.');
    } finally {
      setPwSaving(false);
    }
  };

  // Handle Photo Upload (Web file input -> base64 -> MySQL DB)
  const handleUploadPhoto = () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            if (event.target?.result) {
              const base64Img = event.target.result as string;
              setAvatarUri(base64Img);

              const user = getActiveUser();
              const userId = user?.id || user?.userId;
              const emailToUse = user?.email || userEmail;
              try {
                const updatedUser = await managerApi.updateProfile({
                  userId,
                  email: emailToUse,
                  profileImage: base64Img
                });

                if (typeof window !== 'undefined' && window.localStorage) {
                  const saved = window.localStorage.getItem('userObj');
                  const userObj = saved ? JSON.parse(saved) : {};
                  userObj.profileImage = updatedUser?.profileImage || base64Img;
                  userObj.avatar = updatedUser?.profileImage || base64Img;
                  window.localStorage.setItem('userObj', JSON.stringify(userObj));
                  window.dispatchEvent(new Event('userProfileUpdated'));
                }

                setShowSuccessPopup(true);
                setTimeout(() => {
                  setShowSuccessPopup(false);
                }, 5000);

                // Refresh DB users list
                const users = await managerApi.getStudents();
                if (Array.isArray(users)) setDbUsers(users);
              } catch (err) {
                console.warn('[ProfileScreen] Photo DB update error:', err);
                if (typeof window !== 'undefined' && window.alert) {
                  window.alert('Failed to save profile photo to database.');
                }
              }
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      window.alert('Upload photo selected! Update profile picture.');
    }
  };


  // Dynamically compute real leaderboard top rankers from backend database users
  const topRankers: RankerProfile[] = React.useMemo(() => {
    if (dbUsers.length > 0) {
      // Sort users by totalXp descending
      const sorted = [...dbUsers].sort((a, b) => (b.totalXp || 0) - (a.totalXp || 0));
      return sorted.map((u, idx) => {
        const isCurrent = (activeUser?.id && u.id === activeUser.id) || (activeUser?.username && u.username === activeUser.username);
        return {
          rank: idx + 1,
          name: (u.fullName || u.username || `User ${u.id}`) + (isCurrent ? ' (You)' : ''),
          city: u.mobileNumber || 'India',
          state: u.role || 'STUDENT',
          targetExam: u.role === 'ADMIN' ? 'System Admin' : u.role === 'MANAGER' ? 'Course Manager' : 'Student',
          xp: `${u.totalXp || 0} XP`,
          streak: `${u.currentStreak || 0} Days`,
          avatar: isCurrent ? avatarUri : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
          badge: idx === 0 ? '🥇 Rank 1' : idx === 1 ? '🥈 Rank 2' : idx === 2 ? '🥉 Rank 3' : `Rank ${idx + 1}`,
          completedDays: u.currentStreak || 1,
          accuracy: '95%',
          isCurrentUser: isCurrent
        };
      });
    }

    // Fallback if database users not fetched yet: display current active user
    if (activeUser) {
      return [
        {
          rank: 1,
          name: `${userName} (You)`,
          city: userCity,
          state: userState,
          targetExam: targetExam,
          xp: `${activeUser?.totalXp ?? activeUser?.totalXP ?? 0} XP`,
          streak: `${activeUser?.streak ?? activeUser?.currentStreak ?? 0} Days`,
          avatar: avatarUri,
          badge: '👑 Rank 1',
          completedDays: activeUser?.streak ?? 1,
          accuracy: '100%',
          isCurrentUser: true
        }
      ];
    }

    return [];
  }, [dbUsers, activeUser, userName, userCity, userState, targetExam, avatarUri]);

  // Dynamic user performance statistics from real session
  const currentUserRankIndex = topRankers.findIndex(r => r.isCurrentUser);
  const userRank = currentUserRankIndex !== -1 ? currentUserRankIndex + 1 : 1;
  const streakCount = activeUser?.streak ?? activeUser?.currentStreak ?? 0;
  const totalXpCount = activeUser?.totalXp ?? activeUser?.totalXP ?? 0;

  const statsData = {
    completedDaysCount: streakCount > 0 ? streakCount : 1,
    totalPracticeWords: streakCount * 15,
    streakDays: streakCount,
    overallRank: userRank,
    totalUsersCount: dbUsers.length > 0 ? dbUsers.length : 1,
    topPercentile: userRank === 1 ? 'Rank 1' : `Top ${Math.round((userRank / (dbUsers.length || 1)) * 100)}%`,
    totalXP: totalXpCount,
    dayWiseTestsCount: 0,
    dayWiseAvgScore: '0%',
    sectionalTestsCount: 0,
    sectionalAvgScore: 'N/A'
  };

  // Real Test Results History (empty until tests are attempted)
  const dayTestLogs: any[] = [];

  // Real Sectional Test Results History (empty until tests are attempted)
  const sectionalTestLogs: any[] = [];

  // IF A RANKER IS SELECTED, OPEN FULL PROFILE PAGE (NOT A POPUP)
  if (selectedRanker) {
    return (
      <SafeAreaView style={styles.container}>
        {/* TOP NAVBAR FOR RANKER PROFILE PAGE */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setSelectedRanker(null)} activeOpacity={0.8}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>{selectedRanker.name}'s Profile</Text>
            <Text style={styles.headerSub}>Leaderboard Rank #{selectedRanker.rank}</Text>
          </View>

          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <Image source={{ uri: selectedRanker.avatar }} style={styles.avatarImg} />
            <View style={styles.userInfoBox}>
              <View style={styles.nameRow}>
                <Text style={styles.userNameText}>{selectedRanker.name}</Text>
                <View style={styles.verifiedBadge}>
                  <CheckCircle2 size={12} color="#10B981" />
                  <Text style={styles.verifiedText}>{selectedRanker.badge}</Text>
                </View>
              </View>
              <View style={styles.userSubRow}>
                <View style={styles.cityRow}>
                  <MapPin size={12} color="#2563EB" />
                  <Text style={[styles.cityText, { fontSize: 11, fontWeight: '700', color: '#2563EB' }]}>
                    {selectedRanker.city}, {selectedRanker.state}
                  </Text>
                </View>
                <Text style={styles.targetExamBadge}>🎯 {selectedRanker.targetExam}</Text>
              </View>
            </View>
          </View>

          {/* OVERALL RANK BANNER */}
          <View style={styles.rankBannerContainer}>
            <View style={styles.rankColLeft}>
              <View style={styles.rankIconCircle}>
                <Trophy size={20} color="#D97706" />
              </View>
              <View>
                <Text style={styles.rankLabelText}>Leaderboard Rank</Text>
                <Text style={styles.rankValueText}>#{selectedRanker.rank} <Text style={styles.totalUsersText}>/ {dbUsers.length || 1} Users</Text></Text>
              </View>
            </View>

            <View style={styles.rankDivider} />

            <View style={styles.rankColRight}>
              <Text style={styles.percentileBadge}>{selectedRanker.badge}</Text>
              <Text style={styles.percentileSub}>Performance Tier</Text>
            </View>
          </View>

          {/* STATS GRID */}
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <View style={styles.statBoxTop}>
                <Zap size={16} color="#2563EB" />
                <Text style={[styles.statNumber, { color: '#1E40AF' }]}>{selectedRanker.xp}</Text>
              </View>
              <Text style={styles.statLabel}>Total XP Score</Text>
              <Text style={styles.statSubText}>Leaderboard Points</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
              <View style={styles.statBoxTop}>
                <Flame size={16} color="#F97316" fill="#F97316" />
                <Text style={[styles.statNumber, { color: '#C2410C' }]}>{selectedRanker.streak}</Text>
              </View>
              <Text style={styles.statLabel}>Active Streak</Text>
              <Text style={styles.statSubText}>Continuous Practice</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <View style={styles.statBoxTop}>
                <Calendar size={16} color="#10B981" />
                <Text style={[styles.statNumber, { color: '#065F46' }]}>{selectedRanker.completedDays}</Text>
              </View>
              <Text style={styles.statLabel}>Days Completed</Text>
              <Text style={styles.statSubText}>Modules Finished</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: '#F3E8FF', borderColor: '#DDD6FE' }]}>
              <View style={styles.statBoxTop}>
                <Award size={16} color="#8B5CF6" />
                <Text style={[styles.statNumber, { color: '#5B21B6' }]}>{selectedRanker.accuracy}</Text>
              </View>
              <Text style={styles.statLabel}>Avg Test Accuracy</Text>
              <Text style={styles.statSubText}>Across All Mocks</Text>
            </View>
          </View>

          {/* RETURN BACK BUTTON */}
          <TouchableOpacity
            style={[styles.modalCloseBtn, { marginTop: 10, backgroundColor: '#2563EB' }]}
            onPress={() => setSelectedRanker(null)}
            activeOpacity={0.85}
          >
            <Text style={[styles.modalCloseText, { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }]}>
              ← Back to Rankings
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // IF FULL-PAGE EDIT PROFILE SUB-SCREEN IS ACTIVE
  if (profileSubScreen === 'EDIT_PROFILE') {
    return (
      <SafeAreaView style={styles.container}>
        {/* TOP NAVBAR FOR EDIT PROFILE PAGE */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setProfileSubScreen('MAIN')} activeOpacity={0.8}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Edit Profile Information</Text>
            <Text style={styles.headerSub}>प्रोफाइल जानकारी अपडेट करें</Text>
          </View>

          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <View style={[styles.sectionContainer, { marginTop: 12 }]}>
            {/* AVATAR UPLOAD PREVIEW */}
            <View style={styles.modalAvatarBox}>
              <Image source={{ uri: avatarUri }} style={styles.modalAvatarImg} />
              <TouchableOpacity style={styles.modalCameraBtn} onPress={handleUploadPhoto} activeOpacity={0.85}>
                <Camera size={14} color="#FFFFFF" />
                <Text style={styles.modalCameraText}>Change Photo</Text>
              </TouchableOpacity>
            </View>

            {/* INPUT 1: FULL NAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name (नाम):</Text>
              <View style={styles.inputBox}>
                <User size={16} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={tempName}
                  onChangeText={setTempName}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* INPUT 2: EMAIL ADDRESS */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address (ईमेल):</Text>
              <View style={styles.inputBox}>
                <Mail size={16} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={tempEmail}
                  onChangeText={setTempEmail}
                  placeholder="Enter your email address"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* INPUT 3: MOBILE NUMBER */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number (मोबाइल नंबर):</Text>
              <View style={styles.inputBox}>
                <FileText size={16} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={tempMobile}
                  onChangeText={setTempMobile}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* INPUT 4: CITY */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>City / District (शहर):</Text>
              <View style={styles.inputBox}>
                <MapPin size={16} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={tempCity}
                  onChangeText={setTempCity}
                  placeholder="e.g. Delhi, Jaipur, Patna"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* INPUT 5: TARGET EXAM */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Exam (लक्ष्य परीक्षा):</Text>
              <View style={styles.inputBox}>
                <Target size={16} color="#64748B" />
                <TextInput
                  style={styles.textInput}
                  value={tempTargetExam}
                  onChangeText={setTempTargetExam}
                  placeholder="e.g. SSC CGL 2026, Bank PO, UPSC"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* ACTION BUTTONS */}
            <View style={[styles.modalActionRow, { marginTop: 24 }]}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setProfileSubScreen('MAIN')}
                disabled={saving}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, saving && { backgroundColor: '#93C5FD' }]}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.modalSaveText}>Saving Profile...</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Check size={16} color="#FFFFFF" />
                    <Text style={styles.modalSaveText}>Save Profile</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // IF FULL-PAGE CHANGE PASSWORD SUB-SCREEN IS ACTIVE
  if (profileSubScreen === 'CHANGE_PASSWORD') {
    return (
      <SafeAreaView style={styles.container}>
        {/* TOP NAVBAR FOR CHANGE PASSWORD PAGE */}
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setProfileSubScreen('MAIN')} activeOpacity={0.8}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <Text style={styles.headerTitle}>Change Password</Text>
            <Text style={styles.headerSub}>सुरक्षित रूप से पासवर्ड बदलें</Text>
          </View>

          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          <View style={[styles.sectionContainer, { marginTop: 12 }]}>
            {/* SECURITY BANNER */}
            <View style={{ backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#BFDBFE' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' }}>
                <KeyRound size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E40AF' }}>Update Account Password</Text>
                <Text style={{ fontSize: 11, color: '#3B82F6', marginTop: 2 }}>Enter your new security password below. It will be encrypted securely.</Text>
              </View>
            </View>

            {/* ERROR BANNER */}
            {pwError && (
              <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FCA5A5', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <X size={18} color="#DC2626" />
                <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 13, flex: 1 }}>{pwError}</Text>
              </View>
            )}

            {/* SUCCESS BANNER */}
            {pwSuccess && (
              <View style={{ backgroundColor: '#ECFDF5', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#6EE7B7', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} color="#059669" />
                <Text style={{ color: '#059669', fontWeight: '800', fontSize: 13, flex: 1 }}>Password updated successfully! 🎉</Text>
              </View>
            )}

            {/* INPUT 1: CURRENT PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password (वर्तमान पासवर्ड - optional verification):</Text>
              <View style={styles.inputBox}>
                <Lock size={16} color="#64748B" />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showCurrentPw}
                />
                <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)} style={{ padding: 4 }} activeOpacity={0.7}>
                  {showCurrentPw ? <EyeOff size={18} color="#2563EB" /> : <Eye size={18} color="#64748B" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* INPUT 2: NEW PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password (नया पासवर्ड):</Text>
              <View style={styles.inputBox}>
                <KeyRound size={16} color="#64748B" />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password (min 6 characters)"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showNewPw}
                />
                <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} style={{ padding: 4 }} activeOpacity={0.7}>
                  {showNewPw ? <EyeOff size={18} color="#2563EB" /> : <Eye size={18} color="#64748B" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* INPUT 3: CONFIRM PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password (पासवर्ड की पुष्टि करें):</Text>
              <View style={styles.inputBox}>
                <Lock size={16} color="#64748B" />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPw}
                />
                <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)} style={{ padding: 4 }} activeOpacity={0.7}>
                  {showConfirmPw ? <EyeOff size={18} color="#2563EB" /> : <Eye size={18} color="#64748B" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* ACTION BUTTONS */}
            <View style={[styles.modalActionRow, { marginTop: 24 }]}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setProfileSubScreen('MAIN')}
                disabled={pwSaving}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSaveBtn, (pwSaving || pwSuccess) && { backgroundColor: pwSuccess ? '#059669' : '#93C5FD' }]}
                onPress={handleUpdatePassword}
                disabled={pwSaving || pwSuccess}
                activeOpacity={0.85}
              >
                {pwSaving ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.modalSaveText}>Updating...</Text>
                  </View>
                ) : pwSuccess ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} color="#FFFFFF" />
                    <Text style={styles.modalSaveText}>Updated!</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <KeyRound size={16} color="#FFFFFF" />
                    <Text style={styles.modalSaveText}>Update Password</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* TOP NAVBAR */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={onBackToHome} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>User Profile & Analytics</Text>
          <Text style={styles.headerSub}>Performance & Rank Breakdown</Text>
        </View>

        <View style={{ width: 34 }} />
      </View>

      {/* 5-SECOND SUCCESS POPUP OVERLAY MODAL */}
      <Modal
        visible={showSuccessPopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSuccessPopup(false)}
      >
        <View style={styles.popupModalOverlay}>
          <View style={styles.popupModalCard}>
            <View style={styles.popupGreenIconBox}>
              <CheckCircle2 size={36} color="#FFFFFF" />
            </View>

            <Text style={styles.popupTitleText}>Successfully Saved! 🎉</Text>
            <Text style={styles.popupDescText}>Successfully updated profile and saved to database.</Text>

            <TouchableOpacity
              style={styles.popupOkBtn}
              onPress={() => setShowSuccessPopup(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.popupOkBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FIXED STICKY TOP SECTION (PROFILE CARD, RANK BANNER, STATS GRID & TAB SWITCHER) */}
      <View style={styles.stickyHeaderWrapper}>
        {/* COMPACT PROFILE HEADER CARD WITH DUAL EDIT & CHANGE PASSWORD ACTION BUTTONS */}
        <View style={styles.profileCard}>
          {/* Avatar with Upload Camera Button */}
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            <TouchableOpacity style={styles.cameraBtn} onPress={handleUploadPhoto} activeOpacity={0.85}>
              <Camera size={12} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfoBox}>
            <View style={styles.nameRow}>
              <Text style={styles.userNameText}>{userName}</Text>
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={12} color="#10B981" />
                <Text style={styles.verifiedText}>{(activeUser?.role || userRole).toUpperCase()}</Text>
              </View>
            </View>

            <View style={styles.userSubRow}>
              <Text style={styles.userEmailText}>{userEmail}{userMobile ? ` • 📞 ${userMobile}` : ''}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#2563EB' }}>📍 {userCity}</Text>
                <Text style={styles.targetExamBadge}>🎯 {targetExam}</Text>
              </View>
            </View>
          </View>

          {/* ACTION BUTTONS ON RIGHT SIDE OF PROFILE CARD */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {/* EDIT PROFILE BUTTON */}
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={handleOpenEditModal}
              activeOpacity={0.8}
              accessibilityLabel="Edit Profile"
            >
              <Edit2 size={16} color="#2563EB" />
            </TouchableOpacity>

            {/* CHANGE PASSWORD BUTTON */}
            <TouchableOpacity
              style={[styles.editProfileBtn, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}
              onPress={() => {
                setPwError(null);
                setPwSuccess(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setProfileSubScreen('CHANGE_PASSWORD');
              }}
              activeOpacity={0.8}
              accessibilityLabel="Change Password"
            >
              <KeyRound size={16} color="#0F172A" />
            </TouchableOpacity>

            {/* LOGOUT BUTTON */}
            {onLogout && (
              <TouchableOpacity
                style={[styles.editProfileBtn, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}
                onPress={onLogout}
                activeOpacity={0.8}
                accessibilityLabel="Log Out"
              >
                <LogOut size={16} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* COMPACT RANK & PERCENTILE HIGHLIGHT BANNER */}
        <View style={styles.rankBannerContainer}>
          <View style={styles.rankColLeft}>
            <View style={styles.rankIconCircle}>
              <Trophy size={20} color="#D97706" />
            </View>
            <View>
              <Text style={styles.rankLabelText}>Overall Rank</Text>
              <Text style={styles.rankValueText}>#{statsData.overallRank} <Text style={styles.totalUsersText}>/ {dbUsers.length || 1}</Text></Text>
            </View>
          </View>

          <View style={styles.rankDivider} />

          <View style={styles.rankColRight}>
            <Text style={styles.percentileBadge}>{statsData.topPercentile}</Text>
            <Text style={styles.percentileSub}>Percentile</Text>
          </View>
        </View>

        {/* 4 COMPACT CORE STATS GRID CARDS */}
        <View style={styles.statsGrid}>
          {/* Box 1: Completed Days */}
          <View style={[styles.statBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <View style={styles.statBoxTop}>
              <Calendar size={16} color="#2563EB" />
              <Text style={[styles.statNumber, { color: '#1E40AF' }]}>{statsData.completedDaysCount}</Text>
            </View>
            <Text style={styles.statLabel}>Days Completed</Text>
            <Text style={styles.statSubText}>{statsData.totalPracticeWords} Words</Text>
          </View>

          {/* Box 2: Practice Streak */}
          <View style={[styles.statBox, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
            <View style={styles.statBoxTop}>
              <Flame size={16} color="#F97316" fill="#F97316" />
              <Text style={[styles.statNumber, { color: '#C2410C' }]}>{statsData.streakDays}d</Text>
            </View>
            <Text style={styles.statLabel}>Active Streak</Text>
            <Text style={styles.statSubText}>Continuous</Text>
          </View>

          {/* Box 3: Day Wise Test Accuracy */}
          <View style={[styles.statBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
            <View style={styles.statBoxTop}>
              <Award size={16} color="#10B981" />
              <Text style={[styles.statNumber, { color: '#065F46' }]}>{statsData.dayWiseAvgScore}</Text>
            </View>
            <Text style={styles.statLabel}>Day-Wise Avg</Text>
            <Text style={styles.statSubText}>{statsData.dayWiseTestsCount} Tests</Text>
          </View>

          {/* Box 4: Sectional Mock Avg */}
          <View style={[styles.statBox, { backgroundColor: '#F3E8FF', borderColor: '#DDD6FE' }]}>
            <View style={styles.statBoxTop}>
              <BarChart3 size={16} color="#8B5CF6" />
              <Text style={[styles.statNumber, { color: '#5B21B6' }]}>{statsData.sectionalAvgScore}</Text>
            </View>
            <Text style={styles.statLabel}>Sectional Avg</Text>
            <Text style={styles.statSubText}>{statsData.sectionalTestsCount} Mocks</Text>
          </View>
        </View>

        {/* COMPACT STRICT TAB SWITCHER (STRICT SEPARATION - ONLY OPEN ACTIVE TAB CONTENT) */}
        <View style={styles.tabSegmentBar}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'DAY_TESTS' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('DAY_TESTS')}
            activeOpacity={0.85}
          >
            <Text style={[styles.segmentText, activeTab === 'DAY_TESTS' && styles.segmentTextActive]}>Day Tests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'SECTIONAL_TESTS' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('SECTIONAL_TESTS')}
            activeOpacity={0.85}
          >
            <Text style={[styles.segmentText, activeTab === 'SECTIONAL_TESTS' && styles.segmentTextActive]}>Sectional Mocks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'LEADERBOARD' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('LEADERBOARD')}
            activeOpacity={0.85}
          >
            <Text style={[styles.segmentText, activeTab === 'LEADERBOARD' && styles.segmentTextActive]}>Rankings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SCROLLABLE BOTTOM CONTENT AREA (LOGS & RANKINGS) */}
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>

        {/* TAB 1 CONTENT: DAY TESTS ONLY */}
        {activeTab === 'DAY_TESTS' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleRow}>
              <Calendar size={16} color="#2563EB" />
              <Text style={styles.sectionHeading}>Day-Wise Test Score History</Text>
            </View>

            {dayTestLogs && dayTestLogs.length > 0 ? (
              dayTestLogs.map((log, index) => (
                <View key={index} style={styles.logCardRow}>
                  <View style={styles.logDayBadge}>
                    <Text style={styles.logDayText}>Day {log.day}</Text>
                  </View>
                  <View style={styles.logInfoCol}>
                    <Text style={styles.logTopicTitle}>{log.topic}</Text>
                    <Text style={styles.logDateText}>{log.date}</Text>
                  </View>
                  <View style={styles.logScoreCol}>
                    <Text style={styles.logScoreText}>{log.score}</Text>
                    <View style={[styles.logStatusBadge, log.percent === 100 ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#F1F5F9' }]}>
                      <Text style={[styles.logStatusText, log.percent === 100 ? { color: '#166534' } : { color: '#475569' }]}>
                        {log.percent}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Award size={32} color="#CBD5E1" />
                <Text style={{ marginTop: 8, fontSize: 13, color: '#94A3B8', fontWeight: '600' }}>No test attempts recorded yet</Text>
                <Text style={{ marginTop: 2, fontSize: 11, color: '#CBD5E1' }}>Complete tests in Quiz Test Hub to view history.</Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 2 CONTENT: SECTIONAL MOCKS ONLY */}
        {activeTab === 'SECTIONAL_TESTS' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleRow}>
              <Award size={16} color="#8B5CF6" />
              <Text style={styles.sectionHeading}>Sectional Mock Test Performance & Rank</Text>
            </View>

            {sectionalTestLogs && sectionalTestLogs.length > 0 ? (
              sectionalTestLogs.map((log, index) => (
                <View key={index} style={styles.sectionalCardRow}>
                  <View style={styles.secLeftInfo}>
                    <View style={styles.diffBadgeRow}>
                      <Text style={styles.secNameText}>{log.name}</Text>
                      <View style={styles.diffChip}>
                        <Text style={styles.diffChipText}>{log.difficulty}</Text>
                      </View>
                    </View>
                    <Text style={styles.secAccuracyText}>Accuracy: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{log.accuracy}</Text> | Score: <Text style={{ fontWeight: '700', color: '#2563EB' }}>{log.score}</Text></Text>
                  </View>

                  <View style={styles.secRankBadge}>
                    <Trophy size={13} color="#D97706" />
                    <Text style={styles.secRankText}>{log.rank}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Award size={32} color="#CBD5E1" />
                <Text style={{ marginTop: 8, fontSize: 13, color: '#94A3B8', fontWeight: '600' }}>No sectional mocks recorded yet</Text>
                <Text style={{ marginTop: 2, fontSize: 11, color: '#CBD5E1' }}>Complete mocks in Quiz Test Hub to view history.</Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 3 CONTENT: LEADERBOARD RANKINGS ONLY */}
        {activeTab === 'LEADERBOARD' && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleRow}>
              <Users size={16} color="#F97316" />
              <Text style={styles.sectionHeading}>Leaderboard Rankings (Total {dbUsers.length || 1})</Text>
            </View>

            {topRankers.map((user, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.8}
                onPress={() => setSelectedRanker(user)}
                style={[
                  styles.rankRowCard,
                  user.isCurrentUser && styles.currentUserRankCard
                ]}
              >
                <View style={styles.rankNumCol}>
                  <Text style={[styles.rankNumText, user.rank <= 3 && { fontWeight: '900', color: '#D97706' }]}>
                    #{user.rank}
                  </Text>
                </View>

                <Image source={{ uri: user.avatar }} style={styles.rankAvatarImg} />

                <View style={styles.rankNameCol}>
                  <Text style={[styles.rankNameText, user.isCurrentUser && { fontWeight: '800', color: '#2563EB' }]}>
                    {user.name}
                  </Text>
                  <View style={styles.cityRow}>
                    <MapPin size={10} color="#64748B" />
                    <Text style={styles.cityText}>{user.city}, {user.state}</Text>
                  </View>
                </View>

                <View style={styles.rankXpCol}>
                  <Text style={styles.rankXpText}>{user.xp}</Text>
                  <View style={styles.rankBadgePill}>
                    <Text style={styles.rankBadgePillText}>{user.badge}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0'
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitleBox: {
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  headerSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500'
  },
  roleBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB'
  },
  stickyHeaderWrapper: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    zIndex: 10
  },
  scrollBody: {
    padding: 12,
    paddingBottom: 30
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1
  },
  avatarWrapper: {
    position: 'relative'
  },
  avatarImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#2563EB'
  },
  cameraBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#2563EB',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF'
  },
  userInfoBox: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1
  },
  userNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A'
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669'
  },
  userBioText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
    marginBottom: 4,
    fontStyle: 'italic'
  },
  userSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  userEmailText: {
    fontSize: 10,
    color: '#64748B'
  },
  targetExamBadge: {
    fontSize: 9,
    fontWeight: '600',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6
  },
  editProfileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A'
  },
  modalAvatarBox: {
    alignItems: 'center',
    marginBottom: 16
  },
  modalAvatarImg: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: '#2563EB',
    marginBottom: 8
  },
  modalCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  modalCameraText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42
  },
  textInput: {
    flex: 1,
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '500',
    outlineStyle: 'none' as any
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCancelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  modalSaveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  modalSaveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  rankBannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 10
  },
  rankColLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  rankIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rankLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E'
  },
  rankValueText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#78350F'
  },
  totalUsersText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E'
  },
  rankDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#FCD34D'
  },
  rankColRight: {
    alignItems: 'flex-end'
  },
  percentileBadge: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B45309',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  percentileSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#92400E',
    marginTop: 1
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  statBox: {
    width: (width - 32 - 8) / 2,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1
  },
  statBoxTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  statNumber: {
    fontSize: 15,
    fontWeight: '900'
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 1
  },
  statSubText: {
    fontSize: 9,
    color: '#64748B'
  },
  tabSegmentBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 12
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B'
  },
  segmentTextActive: {
    color: '#2563EB'
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  logCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  logDayBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  logDayText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB'
  },
  logInfoCol: {
    flex: 1,
    marginLeft: 10
  },
  logTopicTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  logDateText: {
    fontSize: 9,
    color: '#64748B'
  },
  logScoreCol: {
    alignItems: 'flex-end'
  },
  logScoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A'
  },
  logStatusBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1
  },
  logStatusText: {
    fontSize: 9,
    fontWeight: '700'
  },
  sectionalCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  secLeftInfo: {
    flex: 1
  },
  diffBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2
  },
  secNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  diffChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  diffChipText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#D97706'
  },
  secAccuracyText: {
    fontSize: 10,
    color: '#64748B'
  },
  secRankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  secRankText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309'
  },
  rankRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9'
  },
  currentUserRankCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 0,
    marginVertical: 3
  },
  rankNumCol: {
    width: 28
  },
  rankNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B'
  },
  rankAvatarImg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8
  },
  rankNameCol: {
    flex: 1
  },
  rankNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A'
  },
  rankStreakText: {
    fontSize: 9,
    color: '#F97316',
    fontWeight: '600'
  },
  rankXpCol: {
    alignItems: 'flex-end'
  },
  rankXpText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2563EB'
  },
  rankBadgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1
  },
  rankBadgePillText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#475569'
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1
  },
  cityText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500'
  },
  rankerModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4
  },
  rankerCityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6
  },
  rankerCityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB'
  },
  rankerTargetBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  modalStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16
  },
  modalStatBox: {
    width: (400 - 40 - 10) / 2,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center'
  },
  modalStatValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2
  },
  modalStatLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600'
  },
  modalCloseBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalCloseText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  /* 5-SECOND SUCCESS POPUP OVERLAY MODAL STYLES */
  popupModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 99999,
  },
  popupModalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  popupGreenIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  popupTitleText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
    textAlign: 'center',
  },
  popupDescText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 19,
  },
  popupOkBtn: {
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  popupOkBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
