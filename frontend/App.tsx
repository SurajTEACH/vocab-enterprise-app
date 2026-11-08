import './src/utils/mobilePolyfills';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import { WelcomeScreen } from './src/components/WelcomeScreen';
import { PricingScreen } from './src/components/PricingScreen';
import { LoginModal } from './src/components/LoginModal';
import { CheckoutFlowModal } from './src/components/CheckoutFlowModal';
import { HomeScreen } from './src/components/HomeScreen';
import { fetchDailyChallenge } from './src/services/api';
import { DailyChallenge } from './src/types';
import { theme } from './src/theme';
import { PermissionProvider, usePermissions } from './src/context/PermissionContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { managerApi } from './src/api';

// Inner app component — needs access to PermissionProvider context
function AppInner() {
  const [screen, setScreen] = useState<'WELCOME' | 'PRICING' | 'MAIN'>('WELCOME');
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'STUDENT' | 'MANAGER'>('STUDENT');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Modals
  const [loginVisible, setLoginVisible] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'SIGNIN' | 'SIGNUP'>('SIGNIN');
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState('Yearly VIP Pass ₹499');
  const [selectedPlanAmount, setSelectedPlanAmount] = useState(499);

  const handleOpenLogin = () => {
    setAuthInitialMode('SIGNIN');
    setLoginVisible(true);
  };

  const handleOpenSignUp = () => {
    setAuthInitialMode('SIGNUP');
    setLoginVisible(true);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('userObj');
      window.localStorage.removeItem('jwtToken');
      window.localStorage.removeItem('loginTimestamp');
    }
    setCurrentUser(null);
    setUserRole('STUDENT');
    setScreen('WELCOME');
    setLoginVisible(false);
  };

  const trackEnterpriseVisit = async (explicitUserId?: number) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        let visitorId = window.localStorage.getItem('vocab_visitor_id');
        if (!visitorId) {
          visitorId = 'vis_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
          window.localStorage.setItem('vocab_visitor_id', visitorId);
        }

        const todayStr = new Date().toISOString().slice(0, 10);
        const lastSentDate = window.localStorage.getItem('vocab_visit_last_sent_date');

        let uid = explicitUserId;
        if (!uid) {
          const savedUser = window.localStorage.getItem('userObj');
          if (savedUser) {
            try {
              const u = JSON.parse(savedUser);
              if (u && (u.id || u.userId)) uid = u.id || u.userId;
            } catch (e) {}
          }
        }

        // Send to backend (backend strictly deduplicates duplicates by calendar day)
        if (lastSentDate !== todayStr || explicitUserId) {
          await managerApi.recordVisit({
            visitorId,
            userId: uid,
            platform: Platform.OS
          });
          window.localStorage.setItem('vocab_visit_last_sent_date', todayStr);
        }
      }
    } catch (err) {
      console.log('[Analytics] Visit tracking error:', err);
    }
  };

  useEffect(() => {
    loadChallenge();
    checkSavedSession();
    trackEnterpriseVisit();

    const handleExpired = () => {
      handleLogout();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('auth_session_expired', handleExpired);
      return () => {
        window.removeEventListener('auth_session_expired', handleExpired);
      };
    }
  }, []);

  const { initPermissions } = usePermissions();

  const checkSavedSession = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedUser = window.localStorage.getItem('userObj');
      const savedTimestamp = window.localStorage.getItem('loginTimestamp');

      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed) {
            const loginTime = savedTimestamp ? parseInt(savedTimestamp, 10) : Date.now();
            const currentTime = Date.now();
            const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

            if (currentTime - loginTime < SEVEN_DAYS_MS) {
              // Valid 7-day session -> Auto restore session across app close & refresh!
              setCurrentUser(parsed);
              const roleUpper = (parsed.role || '').toUpperCase();
              if (roleUpper === 'ADMIN' || roleUpper === 'MANAGER' || parsed.email === 'surajshah1509@gmail.com') {
                setUserRole('MANAGER');
              } else {
                setUserRole('STUDENT');
              }
              setScreen('MAIN');
              if (parsed.userId || parsed.id) {
                // Pass stored userData (which has studentPermissionsJson) for instant permission restore
                initPermissions(parsed.userId || parsed.id, roleUpper, parsed);
              }
            } else {
              // 7 days expired -> Auto logout
              console.log('Session expired after 7 days. Logging out.');
              handleLogout();
            }
          }
        } catch (e) {
          handleLogout();
        }
      }
    }
  };

  const loadChallenge = async () => {
    setLoading(true);
    const data = await fetchDailyChallenge();
    setChallenge(data);
    setLoading(false);
  };

  const handleToggleRole = () => {
    const nextRole = userRole === 'STUDENT' ? 'MANAGER' : 'STUDENT';
    setUserRole(nextRole);
  };

  const handleLoginSuccess = (userData: any) => {
    setLoginVisible(false);
    setScreen('MAIN');
    setCurrentUser(userData);

    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('userObj', JSON.stringify(userData));
      window.localStorage.setItem('loginTimestamp', Date.now().toString());
      // Persist JWT token if returned by login
      if (userData.token) {
        window.localStorage.setItem('jwtToken', userData.token);
      }
    }

    const roleUpper = (userData.role || '').toUpperCase();
    if (roleUpper === 'ADMIN' || roleUpper === 'MANAGER' || userData.email === 'surajshah1509@gmail.com') {
      setUserRole('MANAGER');
    } else {
      setUserRole('STUDENT');
    }

    // Enterprise: initialise real-time permission system — pass full loginData for instant apply
    if (userData.userId || userData.id) {
      initPermissions(userData.userId || userData.id, roleUpper, userData);
      trackEnterpriseVisit(userData.userId || userData.id);
    }
  };

  if (loading || !challenge) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading WordBoost Platform...</Text>
      </View>
    );
  }

  const activeContent = screen === 'WELCOME' ? (
    <WelcomeScreen
      onGetStarted={() => setScreen('PRICING')}
      onSignIn={handleOpenLogin}
    />
  ) : screen === 'PRICING' ? (
    <PricingScreen
      onSelectPlan={(planName, amount) => {
        setSelectedPlanName(planName);
        setSelectedPlanAmount(amount);
        setCheckoutVisible(true);
      }}
      onLogin={handleOpenLogin}
      onSignUp={handleOpenSignUp}
      onBack={() => setScreen('WELCOME')}
    />
  ) : (
    <HomeScreen
      challenge={challenge}
      onNavigateToWelcome={() => setScreen('WELCOME')}
      onNavigateToPricing={() => setScreen('PRICING')}
      userRole={userRole}
      currentUser={currentUser}
      onToggleRole={handleToggleRole}
      onLogout={handleLogout}
    />
  );

  const fullAppWithModals = (
    <View style={{ flex: 1 }}>
      {activeContent}

      {/* Login / Sign Up Modal */}
      <LoginModal
        visible={loginVisible}
        initialMode={authInitialMode}
        onClose={() => setLoginVisible(false)}
        onLoginSuccess={handleLoginSuccess}
        onCreateAccountClick={() => setScreen('PRICING')}
      />

      {/* 4-Step Checkout & Password Creation Flow Modal */}
      <CheckoutFlowModal
        visible={checkoutVisible}
        selectedPlan={selectedPlanName}
        amount={selectedPlanAmount}
        onClose={() => setCheckoutVisible(false)}
        onFlowCompleted={() => {
          setCheckoutVisible(false);
          setLoginVisible(true);
        }}
      />
    </View>
  );

  // If on Web Desktop Browser, frame in modern MNC device preview wrapper
  if (Platform.OS === 'web' && Dimensions.get('window').width > 600) {
    return (
      <View style={styles.webDesktopBackground}>
        <View style={styles.webHeaderBar}>
          <Text style={styles.webHeaderTitle}>WordBoost  Platform</Text>
         
         
        </View>
        <View style={styles.webFrameContainer}>
          <View style={styles.phoneMockupFrame}>
            <View style={styles.phoneCameraNotch} />
            {fullAppWithModals}
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      {fullAppWithModals}
    </SafeAreaView>
  );
}

/**
 * Root App — wraps everything in PermissionProvider so any component
 * can call usePermissions() to get real-time, WebSocket-powered permissions.
 */
export default function App() {
  return (
    <SettingsProvider>
      <PermissionProvider>
        <AppInner />
      </PermissionProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  webDesktopBackground: {
    flex: 1,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  webHeaderBar: {
    alignItems: 'center',
    marginBottom: 12,
  },
  webHeaderTitle: {
    color: '#3B82F6',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  webHeaderSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },
  webFrameContainer: {
    width: 440,
    height: 850,
    borderRadius: 48,
    padding: 10,
    backgroundColor: '#1E293B',
    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
    borderWidth: 3,
    borderColor: '#334155',
  },
  phoneMockupFrame: {
    flex: 1,
    borderRadius: 38,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  phoneCameraNotch: {
    width: 140,
    height: 24,
    backgroundColor: '#0F172A',
    alignSelf: 'center',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    position: 'absolute',
    top: 0,
    zIndex: 999,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bgDark,
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
});
