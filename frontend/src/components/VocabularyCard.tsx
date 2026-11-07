import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Word } from '../types';
import { theme } from '../theme';

interface VocabularyCardProps {
  wordItem: Word;
  type: 'REVISION' | 'NEW';
  index: number;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({ wordItem, type, index }) => {
  const [expanded, setExpanded] = useState(false);

  const badgeColor = type === 'REVISION' ? theme.colors.skyBlue : theme.colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setExpanded(!expanded)}
      style={[
        styles.card,
        { borderColor: expanded ? badgeColor : theme.colors.surfaceDark }
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.wordGroup}>
          <Text style={styles.indexNum}>#{index}</Text>
          <Text style={styles.wordText}>{wordItem.word}</Text>
          {wordItem.phonetic && <Text style={styles.phonetic}>{wordItem.phonetic}</Text>}
        </View>

        <View style={[styles.typePill, { backgroundColor: badgeColor + '25', borderColor: badgeColor }]}>
          <Text style={[styles.typePillText, { color: badgeColor }]}>
            {type === 'REVISION' ? '🔄 REVISION' : '✨ NEW WORD'}
          </Text>
        </View>
      </View>

      <View style={styles.meaningRow}>
        <Text style={styles.meaningText}>{wordItem.meaning}</Text>
        {wordItem.hindiMeaning && (
          <Text style={styles.hindiMeaning}>💡 {wordItem.hindiMeaning}</Text>
        )}
      </View>

      {wordItem.partOfSpeech && (
        <View style={styles.posBadge}>
          <Text style={styles.posText}>{wordItem.partOfSpeech}</Text>
        </View>
      )}

      {expanded && (
        <View style={styles.expandedSection}>
          <View style={styles.divider} />
          <Text style={styles.exampleTitle}>Example Sentence:</Text>
          <Text style={styles.exampleText}>"{wordItem.exampleSentence || 'Used in professional MNC daily workflows.'}"</Text>
        </View>
      )}

      <Text style={styles.tapPrompt}>{expanded ? 'Tap to collapse ▲' : 'Tap for example & details ▼'}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardDark,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  indexNum: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  wordText: {
    color: theme.colors.textLight,
    fontSize: 20,
    fontWeight: '800',
  },
  phonetic: {
    color: theme.colors.skyBlue,
    fontSize: 13,
    fontStyle: 'italic',
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  meaningRow: {
    marginTop: 4,
    gap: 4,
  },
  meaningText: {
    color: '#E2E8F0',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  hindiMeaning: {
    color: theme.colors.yellow,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  posBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.surfaceDark,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 8,
  },
  posText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  expandedSection: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.surfaceDark,
    marginVertical: 8,
  },
  exampleTitle: {
    color: theme.colors.skyBlue,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  exampleText: {
    color: theme.colors.textLight,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  tapPrompt: {
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
});
