import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  visible: boolean;
  senderName: string;
  timestamp: Date;
  initialContent: string;
  onSave: (content: string) => void;
  onDismiss: () => void;
}

export function EditMessageModal({
  visible,
  senderName,
  timestamp,
  initialContent,
  onSave,
  onDismiss,
}: Props) {
  const [content, setContent] = useState(initialContent);

  // Split content preserving whitespace for redaction chips
  const tokens = useMemo(() => content.split(/(\s+)/), [content]);

  const handleRedactWord = (index: number) => {
    const token = tokens[index];
    // Skip whitespace tokens
    if (/^\s+$/.test(token)) return;
    const redacted = "\u2588".repeat(token.length);
    const updated = [...tokens];
    updated[index] = redacted;
    setContent(updated.join(""));
  };

  const timeStr = timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = timestamp.toLocaleDateString("he-IL");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerName}>{senderName}</Text>
              <Text style={styles.headerTime}>{dateStr} {timeStr}</Text>
            </View>
            <Pressable onPress={onDismiss} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          {/* Text editor */}
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Redaction chips */}
          <Text style={styles.sectionTitle}>השחרה - לחץ על מילה להסתרתה</Text>
          <ScrollView style={styles.chipsScroll} contentContainerStyle={styles.chipsContainer}>
            {tokens.map((token, i) => {
              if (/^\s+$/.test(token)) {
                return <Text key={i}>{" "}</Text>;
              }
              const isRedacted = /^\u2588+$/.test(token);
              return (
                <Pressable
                  key={i}
                  onPress={() => handleRedactWord(i)}
                  style={[styles.chip, isRedacted && styles.chipRedacted]}
                >
                  <Text style={[styles.chipText, isRedacted && styles.chipTextRedacted]}>
                    {token}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Buttons */}
          <View style={styles.buttons}>
            <Pressable style={styles.cancelBtn} onPress={onDismiss}>
              <Text style={styles.cancelText}>ביטול</Text>
            </Pressable>
            <Pressable
              style={styles.saveBtn}
              onPress={() => onSave(content)}
            >
              <Text style={styles.saveText}>שמור</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  headerTime: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    minHeight: 80,
    maxHeight: 160,
    marginBottom: 12,
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    textAlign: "right",
  },
  chipsScroll: {
    maxHeight: 120,
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  chip: {
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  chipRedacted: {
    backgroundColor: "#333",
  },
  chipText: {
    fontSize: 14,
    color: "#000",
  },
  chipTextRedacted: {
    color: "#fff",
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    color: "#666",
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#4A90D9",
    alignItems: "center",
  },
  saveText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "600",
  },
});
