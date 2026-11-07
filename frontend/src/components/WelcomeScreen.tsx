import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Logo Row */}
        <View style={styles.logoRow}>
          <View style={styles.logoIconBg}>
            <Text style={styles.logoStar}>✨</Text>
            <Text style={styles.logoBookEmoji}>📖</Text>
          </View>
          <View style={styles.logoTextCol}>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandWord}>Word</Text>
              <Text style={styles.brandBoost}>Boost</Text>
            </View>
            <Text style={styles.tagline}>Learn  •  Practice  •  Grow</Text>
          </View>
        </View>

        {/* Main Headline */}
        <Text style={styles.headline}>Build a Stronger{"\n"}Vocabulary</Text>
        <Text style={styles.subHeadline}>
          Learn new words, practice with real examples and become a better you.
        </Text>

        {/* User's Exact Provided Image */}
        <View style={styles.heroContainer}>
          <Image
            source={require('../../assets/word_boost_hero.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
        </View>

        {/* 4 Feature Badges Grid */}
        <View style={styles.featuresGrid}>
          {/* Feature 1 */}
          <View style={styles.featureItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#EDE9FE' }]}>
              <Text style={styles.featureIcon}>📖</Text>
            </View>
            <Text style={styles.featureTitle}>Daily Words</Text>
            <Text style={styles.featureDesc}>Learn useful words every day</Text>
          </View>

          {/* Feature 2 */}
          <View style={styles.featureItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Text style={styles.featureIcon}>🎯</Text>
            </View>
            <Text style={styles.featureTitle}>Practice</Text>
            <Text style={styles.featureDesc}>Quizzes, sentences & real-life usage</Text>
          </View>

          {/* Feature 3 */}
          <View style={styles.featureItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Text style={styles.featureIcon}>💡</Text>
            </View>
            <Text style={styles.featureTitle}>Track Progress</Text>
            <Text style={styles.featureDesc}>See your growth with simple stats</Text>
          </View>

          {/* Feature 4 */}
          <View style={styles.featureItem}>
            <View style={[styles.iconCircle, { backgroundColor: '#FCE7F3' }]}>
              <Text style={styles.featureIcon}>🖨️</Text>
            </View>
            <Text style={styles.featureTitle}>Print</Text>
            <Text style={styles.featureDesc}>Save & print practice sheets</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity style={styles.getStartedBtn} activeOpacity={0.85} onPress={onGetStarted}>
          <Text style={styles.btnText}>Get Started  →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  logoIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  logoStar: {
    position: 'absolute',
    top: -6,
    right: -4,
    fontSize: 14,
  },
  logoBookEmoji: {
    fontSize: 26,
  },
  logoTextCol: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandWord: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandBoost: {
    color: '#3B82F6',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tagline: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
  headline: {
    color: '#0F172A',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  subHeadline: {
    color: '#475569',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 20,
    fontWeight: '500',
  },
  heroContainer: {
    width: '100%',
    height: 250,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 28,
    rowGap: 20,
  },
  featureItem: {
    width: '48%',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
  getStartedBtn: {
    backgroundColor: '#3B82F6',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 16,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  signInLink: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '800',
  },
});
