import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";
import { ParsedChat } from "../../src/parsers";
import {
  getOrCreateRecipient,
  createConversationWithMessages,
} from "../../src/services/firestore";

export default function ConfirmImportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const parsed: ParsedChat | undefined = globalThis.__importData;

  const [pageName, setPageName] = useState("");
  const [nicknames, setNicknames] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    if (parsed) {
      for (const p of parsed.participants) {
        map[p] = p; // Default nickname is the identifier itself
      }
    }
    return map;
  });
  const [saving, setSaving] = useState(false);

  if (!parsed) {
    return (
      <View style={styles.center}>
        <Text>לא נמצאו נתוני ייבוא. חזור אחורה והתחל מחדש.</Text>
      </View>
    );
  }

  const handleSave = async () => {
    if (!pageName.trim()) {
      Alert.alert("נדרש שם", "נא לתת שם לשיחה.");
      return;
    }
    if (!user) {
      Alert.alert("לא מחובר");
      return;
    }

    setSaving(true);
    try {
      // Create or find recipients
      const senderMap = new Map<string, string>();
      const recipientIds: string[] = [];

      for (const participant of parsed.participants) {
        const nickname = nicknames[participant] || participant;
        const recipientId = await getOrCreateRecipient(
          participant,
          nickname,
          parsed.platform,
          user.uid
        );
        senderMap.set(participant, recipientId);
        recipientIds.push(recipientId);
      }

      // Get date from first message
      const sortedMsgs = [...parsed.messages].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      );

      await createConversationWithMessages({
        name: pageName.trim(),
        date: sortedMsgs[0]?.timestamp || new Date(),
        platform: parsed.platform,
        recipientIds,
        senderMap,
        messages: sortedMsgs,
        userId: user.uid,
      });

      // Clean up
      delete globalThis.__importData;

      Alert.alert("יובא בהצלחה!", `${parsed.messages.length} הודעות נשמרו.`, [
        {
          text: "OK",
          onPress: () => router.replace("/(tabs)/home"),
        },
      ]);
    } catch (error: any) {
      Alert.alert("שגיאה", error.message || "השמירה נכשלה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>שם השיחה</Text>
      <TextInput
        style={styles.input}
        value={pageName}
        onChangeText={setPageName}
        placeholder="לדוגמה, צ'אט משפחתי - מרץ 2024"
        placeholderTextColor="#999"
      />

      <Text style={styles.sectionTitle}>
        הגדרת כינויים ({parsed.participants.length} משתתפים)
      </Text>
      <Text style={styles.sectionSubtitle}>
        אלה יוצגו במקום המזהים המקוריים
      </Text>

      {parsed.participants.map((participant) => (
        <View key={participant} style={styles.nicknameRow}>
          <Text style={styles.participantLabel} numberOfLines={1}>
            שולח {parsed.participants.indexOf(participant) + 1}
          </Text>
          <TextInput
            style={styles.nicknameInput}
            value={nicknames[participant]}
            onChangeText={(text) =>
              setNicknames((prev) => ({ ...prev, [participant]: text }))
            }
            placeholder="כינוי"
            placeholderTextColor="#999"
          />
        </View>
      ))}

      <Text style={styles.summary}>
        {parsed.messages.length} הודעות ייובאו
      </Text>

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>שמור בארכיון</Text>
        )}
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
  },
  nicknameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  participantLabel: {
    width: 80,
    fontSize: 13,
    color: "#666",
  },
  nicknameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: "#333",
  },
  summary: {
    fontSize: 14,
    color: "#4A90D9",
    fontWeight: "600",
    textAlign: "center",
    marginVertical: 20,
  },
  button: {
    backgroundColor: "#4A90D9",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
