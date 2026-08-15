import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { APP_NAME, APP_TAGLINE } from '@signalhub/shared';

export default function App() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'learning' | 'certificates'>('learning');
  const [watchProgress, setWatchProgress] = useState(40);
  const [isLessonComplete, setIsLessonComplete] = useState(false);

  const handleSimulateWatch = () => {
    const next = Math.min(watchProgress + 30, 100);
    setWatchProgress(next);
    if (next >= 90) {
      setIsLessonComplete(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* App Header */}
      <View style={styles.header}>
        <Text style={styles.brandTitle}>{APP_NAME}</Text>
        <Text style={styles.brandSubtitle}>{APP_TAGLINE}</Text>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'learning' && (
          <View style={styles.card}>
            <Text style={styles.cardTag}>ACTIVE COURSE PLAYER</Text>
            <Text style={styles.cardTitle}>Computer Networks & Web Systems</Text>
            <Text style={styles.cardSub}>Lesson 1.1: Understanding OSI Layers & Protocols</Text>

            {/* Video Watch Progress Tracker */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Verified Watch Progress: {watchProgress}%</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${watchProgress}%` }]} />
              </View>
              <Text style={styles.thresholdText}>Required: 90% watch threshold</Text>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleSimulateWatch}>
              <Text style={styles.actionButtonText}>
                {watchProgress >= 100 ? 'Video Watched (100%)' : 'Simulate Watching Video (+30%)'}
              </Text>
            </TouchableOpacity>

            {isLessonComplete ? (
              <View style={styles.completeBox}>
                <Text style={styles.completeText}>✓ Lesson Progress Verified!</Text>
                <TouchableOpacity style={styles.quizButton}>
                  <Text style={styles.quizButtonText}>Take Module 1 Quiz</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.incompleteText}>Watch to 90% to unlock lesson completion & quiz.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('catalog')}>
          <Text style={[styles.navText, activeTab === 'catalog' && styles.navTextActive]}>Courses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('learning')}>
          <Text style={[styles.navText, activeTab === 'learning' && styles.navTextActive]}>My Learning</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('certificates')}>
          <Text style={[styles.navText, activeTab === 'certificates' && styles.navTextActive]}>Certificates</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#020617',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#38bdf8',
  },
  brandSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTag: {
    fontSize: 10,
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  cardSub: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 4,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#f8fafc',
    marginBottom: 6,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284c7',
  },
  thresholdText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completeBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#064e3b',
    borderRadius: 8,
    alignItems: 'center',
  },
  completeText: {
    color: '#34d399',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 8,
  },
  quizButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  quizButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  incompleteText: {
    fontSize: 11,
    color: '#fbbf24',
    marginTop: 12,
    textAlign: 'center',
  },
  navBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#020617',
    paddingVertical: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    color: '#64748b',
  },
  navTextActive: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
});
