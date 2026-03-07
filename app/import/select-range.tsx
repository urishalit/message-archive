import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { DateRangePicker } from "../../src/components/DateRangePicker";
import { ParsedChat } from "../../src/parsers";

export default function SelectRangeScreen() {
  const router = useRouter();
  const parsed: ParsedChat | undefined = globalThis.__importData;

  if (!parsed) {
    return (
      <View style={styles.center}>
        <Text>לא נמצאו נתוני ייבוא. חזור אחורה ובחר קובץ.</Text>
      </View>
    );
  }

  const sortedMessages = useMemo(
    () =>
      [...parsed.messages].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      ),
    [parsed]
  );

  const firstMsg = sortedMessages[0];
  const lastMsg = sortedMessages[sortedMessages.length - 1];

  const [startDate, setStartDate] = useState(firstMsg.timestamp);
  const [endDate, setEndDate] = useState(lastMsg.timestamp);

  const filteredMessages = useMemo(
    () =>
      sortedMessages.filter(
        (m) => m.timestamp >= startDate && m.timestamp <= endDate
      ),
    [sortedMessages, startDate, endDate]
  );

  const handleContinue = () => {
    if (filteredMessages.length === 0) {
      Alert.alert("אין הודעות", "הטווח שנבחר אינו מכיל הודעות.");
      return;
    }
    globalThis.__importData = {
      ...parsed,
      messages: filteredMessages,
      participants: [
        ...new Set(filteredMessages.map((m) => m.sender)),
      ],
    };
    router.push("/import/confirm");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.info}>
        {parsed.messages.length} הודעות נמצאו ({parsed.platform})
      </Text>

      <View style={styles.previewBox}>
        <Text style={styles.previewLabel}>הודעה ראשונה</Text>
        <Text style={styles.previewText} numberOfLines={2}>
          {firstMsg.sender}: {firstMsg.content}
        </Text>
        <Text style={styles.previewDate}>
          {firstMsg.timestamp.toLocaleString()}
        </Text>
      </View>

      <View style={styles.previewBox}>
        <Text style={styles.previewLabel}>הודעה אחרונה</Text>
        <Text style={styles.previewText} numberOfLines={2}>
          {lastMsg.sender}: {lastMsg.content}
        </Text>
        <Text style={styles.previewDate}>
          {lastMsg.timestamp.toLocaleString()}
        </Text>
      </View>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
      />

      <Text style={styles.filterInfo}>
        {filteredMessages.length} הודעות בטווח שנבחר
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handleContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>המשך</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
    marginBottom: 16,
  },
  previewBox: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: "#333",
  },
  previewDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  filterInfo: {
    fontSize: 14,
    color: "#4A90D9",
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 16,
  },
  button: {
    backgroundColor: "#4A90D9",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
