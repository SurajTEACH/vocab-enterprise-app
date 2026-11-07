import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';

interface PricingScreenProps {
  onSelectPlan: (planName: string, amount: number) => void;
  onLogin: () => void;
  onSignUp?: () => void;
  onBack: () => void;
}

export const PricingScreen: React.FC<PricingScreenProps> = ({
  onSelectPlan,
  onLogin,
  onSignUp,
  onBack
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('YEARLY');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Prominent Back Button Row */}
        <View style={styles.topBackRow}>
          <TouchableOpacity style={styles.prominentBackBtn} activeOpacity={0.8} onPress={onBack}>
            <Text style={styles.prominentBackIconText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.mainTitle}>Choose Your Plan</Text>
        <Text style={styles.subTitle}>
          SSC, Banking & Competitive Exams ke liye Highly Useful! Isme Official PYQs (Previous Year Questions) bhi included hain.
        </Text>

        {/* Monthly / Yearly Switcher */}
        <View style={styles.billingToggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, billingCycle === 'MONTHLY' && styles.toggleBtnActive]}
            onPress={() => setBillingCycle('MONTHLY')}
          >
            <Text style={[styles.toggleText, billingCycle === 'MONTHLY' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, billingCycle === 'YEARLY' && styles.toggleBtnActive]}
            onPress={() => setBillingCycle('YEARLY')}
          >
            <Text style={[styles.toggleText, billingCycle === 'YEARLY' && styles.toggleTextActive]}>Yearly</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>SAVE 58%</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Monthly Card (Shows ONLY when Monthly tab is active) */}
        {billingCycle === 'MONTHLY' && (
          <View style={styles.flatCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planIcon}>📅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>Monthly Pass</Text>
                <Text style={styles.planSub}>Flexible month-to-month access</Text>
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.priceVal}>99</Text>
              <Text style={styles.period}>/ month</Text>
            </View>
            <View style={styles.featureList}>
              <Text style={styles.featureItem}>✓ SSC, Banking & Railway Exam Vocabulary</Text>
              <Text style={styles.featureItem}>✓ Includes Official Exam PYQs</Text>
              <Text style={styles.featureItem}>✓ Hindi Meaning (हिंदी अर्थ) + Examples</Text>
              <Text style={styles.featureItem}>✓ Unlimited Daily Quizzes & Streak Tracking</Text>
            </View>
            <TouchableOpacity
              style={styles.planBtnPrimary}
              onPress={() => onSelectPlan('Monthly Pass ₹99', 99)}
            >
              <Text style={styles.planBtnPrimaryText}>Get Monthly Pass (₹99)  →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tab 2: Yearly Card (Shows ONLY when Yearly tab is active) */}
        {billingCycle === 'YEARLY' && (
          <View style={[styles.flatCard, styles.popularCard]}>
            <View style={styles.popularTag}>
              <Text style={styles.popularTagText}>🔥 BEST VALUE (SAVE 58%)</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={styles.planIcon}>⚡</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>Yearly VIP Pass</Text>
                <Text style={styles.planSub}>Full 1 Year Unlimited Access</Text>
              </View>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.priceVal}>499</Text>
              <Text style={styles.period}>/ year</Text>
            </View>
            <View style={styles.featureList}>
              <Text style={styles.featureItemActive}>✓ Complete SSC CGL, CHSL & Banking Vocabulary</Text>
              <Text style={styles.featureItemActive}>✓ All Previous Year Questions (PYQs) Coverage</Text>
              <Text style={styles.featureItemActive}>✓ 1 Full Year Unlimited Practice & Tests</Text>
            </View>
            <TouchableOpacity
              style={styles.planBtnPrimary}
              onPress={() => onSelectPlan('Yearly VIP Pass ₹499', 499)}
            >
              <Text style={styles.planBtnPrimaryText}>Get Yearly VIP Pass (₹499)  →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Niche Login & Sign Up Section */}
        <View style={styles.bottomLoginSection}>
          <TouchableOpacity style={styles.loginBtn} activeOpacity={0.85} onPress={onLogin}>
            <Text style={styles.loginBtnText}>Login to Your Account</Text>
          </TouchableOpacity>

          {/* New User? Create Free Account Link */}
          <View style={styles.noAccountRow}>
            <Text style={styles.noAccountText}>New to WordBoost?</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={onSignUp || onLogin}>
              <Text style={styles.createAccountLinkText}> Create Free Account →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBackRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginTop: 12,
  },
  prominentBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prominentBackIconText: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
    alignItems: 'center',
  },
  mainTitle: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
  },
  subTitle: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 340,
    marginBottom: 14,
    fontWeight: '600',
  },
  billingToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 30,
    padding: 3,
    marginBottom: 16,
    width: '100%',
    maxWidth: 320,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 26,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleText: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  toggleTextActive: {
    color: '#3B82F6',
    fontWeight: '800',
  },
  saveBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  flatCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    width: '100%',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  popularCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    position: 'relative',
    backgroundColor: '#F0F7FF',
  },
  popularTag: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  planIcon: {
    fontSize: 28,
  },
  planTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  planSub: {
    color: '#64748B',
    fontSize: 11,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currency: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  priceVal: {
    color: '#0F172A',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  period: {
    color: '#64748B',
    fontSize: 13,
    marginLeft: 4,
  },
  featureList: {
    gap: 6,
    marginBottom: 16,
  },
  featureItem: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '500',
  },
  featureItemActive: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  planBtnPrimary: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  planBtnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 15,
  },
  bottomLoginSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 8,
  },
  alreadyAccountText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: '#0F172A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  noAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  noAccountText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  createAccountLinkText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
});
