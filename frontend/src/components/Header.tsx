import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface HeaderProps {
  streak: number;
  totalXp: number;
  userRole: 'STUDENT' | 'MANAGER';
  onOpenManager: () => void;
  onToggleRole: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  streak,
  totalXp,
  userRole,
  onOpenManager,
  onToggleRole,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>diligo</Text>
        </View>
        <TouchableOpacity style={styles.roleTag} onPress={onToggleRole}>
          <Text style={styles.roleTagText}>{userRole === 'MANAGER' ? '⚡ MANAGER' : '🎓 STUDENT'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statBadge, { borderColor: theme.colors.orange }]}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={[styles.statValue, { color: theme.colors.orange }]}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>

        <View style={[styles.statBadge, { borderColor: theme.colors.yellow }]}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={[styles.statValue, { color: theme.colors.yellow }]}>{totalXp}</Text>
          <Text style={styles.statLabel}>Total XP</Text>
        </View>

        {userRole === 'MANAGER' && (
          <TouchableOpacity style={styles.managerBtn} onPress={onOpenManager}>
            <Text style={styles.managerBtnText}>⚙️ Panel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardDark,
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceDark,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  logoText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: 1,
  },
  roleTag: {
    backgroundColor: theme.colors.surfaceDark,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderDark,
  },
  roleTagText: {
    color: theme.colors.textLight,
    fontSize: 12,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  managerBtn: {
    backgroundColor: theme.colors.purple,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  managerBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
