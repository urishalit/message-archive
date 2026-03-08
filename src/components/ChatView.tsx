import React, { useEffect, useRef } from "react";
import { FlatList, StyleSheet, View, Text, ActivityIndicator } from "react-native";
import { ChatBubble } from "./ChatBubble";
import { MessageDoc, RecipientDoc } from "../types/firestore";

interface Props {
  messages: { id: string; data: MessageDoc }[];
  recipientMap: Map<string, RecipientDoc>;
  loading: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  highlightMessageId?: string;
  onMessagePress?: (id: string) => void;
  onMessageLongPress?: (id: string) => void;
}

export function ChatView({
  messages,
  recipientMap,
  loading,
  selectionMode,
  selectedIds,
  highlightMessageId,
  onMessagePress,
  onMessageLongPress,
}: Props) {
  const flatListRef = useRef<FlatList>(null);
  const hasScrolled = useRef(false);

  useEffect(() => {
    if (
      highlightMessageId &&
      messages.length > 0 &&
      !hasScrolled.current &&
      flatListRef.current
    ) {
      const index = messages.findIndex((m) => m.id === highlightMessageId);
      if (index >= 0) {
        hasScrolled.current = true;
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }, 300);
      }
    }
  }, [highlightMessageId, messages]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>אין הודעות</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const recipient = recipientMap.get(item.data.senderId);
        return (
          <ChatBubble
            messageId={item.id}
            senderId={item.data.senderId}
            senderName={recipient?.nickname || "לא ידוע"}
            content={item.data.content}
            timestamp={item.data.timestamp.toDate()}
            selected={selectedIds?.has(item.id)}
            selectionMode={selectionMode}
            highlighted={item.id === highlightMessageId}
            onPress={onMessagePress}
            onLongPress={onMessageLongPress}
          />
        );
      }}
      contentContainerStyle={styles.list}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: info.index,
            animated: true,
            viewPosition: 0.5,
          });
        }, 500);
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
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
});
