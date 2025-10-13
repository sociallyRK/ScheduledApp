import React from "react";
import { SafeAreaView, View, Text, ScrollView, StyleSheet } from "react-native";

const Row = ({ t, a }) => (
  <View style={styles.row}>
    <Text style={styles.time}>{t}</Text>
    <Text style={styles.act}>{a}</Text>
  </View>
);

export default function App() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Scheduled</Text>
        <Text style={styles.subtitle}>Your one-page daily operator ✨</Text>
      </View>
      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 32 }}>
        <Text style={styles.section}>📅 Today</Text>
        <Row t="05:00" a="Wake Up" />
        <Row t="05:01" a="Code 💻" />
        <Row t="07:00" a="Yoga 🧘" />
        <Row t="08:00" a="Swim 🏊" />
        <Row t="09:30" a="Code 💻" />
        <Row t="17:00" a="Gym 🏋️" />
        <Row t="19:30" a="Code 💻" />
        <Row t="21:00" a="Dinner 🍽️" />
        <Text style={styles.section}>📌 Milestones</Text>
        <Text style={styles.bullet}>• Aug 1 — Trees</Text>
        <Text style={styles.bullet}>• Aug 11 — Hash Tables</Text>
        <Text style={styles.bullet}>• Sept 7 — Final Project</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: { padding: 16, borderBottomWidth: 1, borderColor: "#eee" },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#666", marginTop: 4 },
  body: { paddingHorizontal: 16, marginTop: 8 },
  section: { marginTop: 16, fontSize: 18, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: "#f3f3f3" },
  time: { width: 64, fontVariant: ["tabular-nums"], fontSize: 16, color: "#111" },
  act: { fontSize: 16, color: "#111", flexShrink: 1 },
  bullet: { fontSize: 15, color: "#333", marginTop: 8, marginLeft: 8 }
});
