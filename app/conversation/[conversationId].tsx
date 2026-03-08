import React, { useEffect, useState, useCallback } from "react";
import { View, StyleSheet, Share, Pressable, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useMessages } from "../../src/hooks/useMessages";
import { ChatView } from "../../src/components/ChatView";
import { EditMessageModal } from "../../src/components/EditMessageModal";
import { useAuth } from "../../src/providers/AuthProvider";
import {
  deleteConversation,
  deleteMessages,
  updateMessageContent,
} from "../../src/services/firestore";
import firestore from "@react-native-firebase/firestore";
import { ConversationDoc, RecipientDoc, MessageDoc } from "../../src/types/firestore";

export default function ConversationScreen() {
  const { conversationId, highlightMessage } = useLocalSearchParams<{
    conversationId: string;
    highlightMessage?: string;
  }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { messages, loading } = useMessages(conversationId!);
  const [convoName, setConvoName] = useState("");
  const [recipientMap, setRecipientMap] = useState<Map<string, RecipientDoc>>(
    new Map()
  );

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit state
  const [editingMessage, setEditingMessage] = useState<{
    id: string;
    data: MessageDoc;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=/conversation/${conversationId}`);
    }
  }, [authLoading, user]);

  const shareConversation = async () => {
    const deepLink = `https://messages-archive.web.app/conversation/${conversationId}`;
    await Share.share({ message: deepLink, title: convoName });
  };

  const handleDeleteConversation = () => {
    Alert.alert(
      "מחיקת שיחה",
      `למחוק את "${convoName}"?\nפעולה זו אינה ניתנת לביטול.`,
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "מחק",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(conversationId!);
              router.replace("/(tabs)/home");
            } catch (e: any) {
              Alert.alert("שגיאה", e.message || "המחיקה נכשלה");
            }
          },
        },
      ]
    );
  };

  const handleMessagePress = useCallback(
    (id: string) => {
      if (selectionMode) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
            if (next.size === 0) setSelectionMode(false);
          } else {
            next.add(id);
          }
          return next;
        });
      } else {
        const msg = messages.find((m) => m.id === id);
        if (msg) setEditingMessage({ id, data: msg.data });
      }
    },
    [selectionMode, messages]
  );

  const handleMessageLongPress = useCallback((id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }, []);

  const handleDeleteSelected = () => {
    const count = selectedIds.size;
    Alert.alert(
      "מחיקת הודעות",
      `למחוק ${count} הודעות?\nפעולה זו אינה ניתנת לביטול.`,
      [
        { text: "ביטול", style: "cancel" },
        {
          text: "מחק",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMessages(conversationId!, Array.from(selectedIds));
              setSelectionMode(false);
              setSelectedIds(new Set());
            } catch (e: any) {
              Alert.alert("שגיאה", e.message || "המחיקה נכשלה");
            }
          },
        },
      ]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(messages.map((m) => m.id)));
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleSaveEdit = async (content: string) => {
    if (!editingMessage) return;
    try {
      await updateMessageContent(conversationId!, editingMessage.id, content);
    } catch (e: any) {
      Alert.alert("שגיאה", e.message || "העדכון נכשל");
    }
    setEditingMessage(null);
  };

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = firestore()
      .collection("conversations")
      .doc(conversationId)
      .onSnapshot(
        async (doc) => {
          if (!doc.exists) return;
          const data = doc.data();
          if (!data) return;
          setConvoName(data.name);

          const map = new Map<string, RecipientDoc>();
          for (const rid of data.recipientIds) {
            const recipDoc = await firestore()
              .collection("recipients")
              .doc(rid)
              .get();
            if (recipDoc.exists()) {
              map.set(rid, recipDoc.data() as RecipientDoc);
            }
          }
          setRecipientMap(map);
        },
        () => {}
      );

    return unsubscribe;
  }, [conversationId]);

  const editingSender = editingMessage
    ? recipientMap.get(editingMessage.data.senderId)?.nickname || "לא ידוע"
    : "";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: selectionMode
            ? `${selectedIds.size} נבחרו`
            : convoName || "Chat",
          headerRight: () =>
            selectionMode ? (
              <View style={styles.headerRow}>
                <Pressable onPress={handleSelectAll}>
                  <MaterialCommunityIcons
                    name="select-all"
                    size={22}
                    color="#333"
                  />
                </Pressable>
                <Pressable onPress={handleDeleteSelected}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={22}
                    color="#d32f2f"
                  />
                </Pressable>
              </View>
            ) : (
              <View style={styles.headerRow}>
                <Pressable onPress={handleDeleteConversation}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={22}
                    color="#333"
                  />
                </Pressable>
                <Pressable onPress={shareConversation}>
                  <MaterialCommunityIcons
                    name="share-variant"
                    size={22}
                    color="#333"
                  />
                </Pressable>
              </View>
            ),
          headerLeft: selectionMode
            ? () => (
                <Pressable onPress={exitSelectionMode} style={{ marginLeft: 8 }}>
                  <MaterialCommunityIcons name="close" size={24} color="#333" />
                </Pressable>
              )
            : undefined,
        }}
      />
      <ChatView
        messages={messages}
        recipientMap={recipientMap}
        loading={loading}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        highlightMessageId={highlightMessage}
        onMessagePress={handleMessagePress}
        onMessageLongPress={handleMessageLongPress}
      />
      {editingMessage && (
        <EditMessageModal
          visible={true}
          senderName={editingSender}
          timestamp={editingMessage.data.timestamp.toDate()}
          initialContent={editingMessage.data.content}
          onSave={handleSaveEdit}
          onDismiss={() => setEditingMessage(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECE5DD",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginRight: 8,
  },
});
