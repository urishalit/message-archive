import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRecipients } from "../../src/hooks/useRecipients";
import { updateRecipientNickname } from "../../src/services/firestore";
import { getColorForRecipient } from "../../src/utils/colors";

export default function EditRecipientsScreen() {
  const { recipients, loading } = useRecipients();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = (id: string, currentNickname: string) => {
    setEditingId(id);
    setEditValue(currentNickname);
  };

  const saveEdit = async () => {
    if (!editingId || !editValue.trim()) return;
    setSaving(true);
    try {
      await updateRecipientNickname(editingId, editValue.trim());
      setEditingId(null);
    } catch (error: any) {
      Alert.alert("שגיאה", error.message || "עדכון הכינוי נכשל");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {recipients.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>אין נמענים עדיין</Text>
        </View>
      ) : (
        <FlatList
          data={recipients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isEditing = editingId === item.id;
            const color = getColorForRecipient(item.id);

            return (
              <View style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: color }]}>
                  <Text style={styles.avatarText}>
                    {item.data.nickname[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.info}>
                  {isEditing ? (
                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.editInput}
                        value={editValue}
                        onChangeText={setEditValue}
                        autoFocus
                        onSubmitEditing={saveEdit}
                      />
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={saveEdit}
                        disabled={saving}
                      >
                        <Text style={styles.saveText}>
                          {saving ? "..." : "שמור"}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setEditingId(null)}
                        style={styles.cancelButton}
                      >
                        <Text style={styles.cancelText}>ביטול</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => startEdit(item.id, item.data.nickname)}
                    >
                      <Text style={styles.nickname}>{item.data.nickname}</Text>
                      <Text style={styles.platform}>{item.data.platform}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  info: {
    flex: 1,
  },
  nickname: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  platform: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#4A90D9",
    borderRadius: 6,
    padding: 8,
    fontSize: 15,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#4A90D9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
  },
  cancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  cancelText: {
    color: "#666",
  },
});
