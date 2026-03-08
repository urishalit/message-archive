import React from "react";
import {
  SectionList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { RecipientCard } from "./RecipientCard";
import { ConversationCard } from "./ConversationCard";
import { RecipientDoc, ConversationDoc } from "../types/firestore";
import { SearchMessageResult } from "../hooks/useSearch";

interface Props {
  recipientResults: { id: string; data: RecipientDoc }[];
  conversationResults: { id: string; data: ConversationDoc }[];
  messageResults: SearchMessageResult[];
  searching: boolean;
  convoCounts: Record<string, number>;
  query: string;
  onRecipientPress: (id: string) => void;
  onConversationPress: (id: string) => void;
  onMessagePress: (conversationId: string, messageId: string) => void;
}

export function SearchResultsList({
  recipientResults,
  conversationResults,
  messageResults,
  searching,
  convoCounts,
  query,
  onRecipientPress,
  onConversationPress,
  onMessagePress,
}: Props) {
  const sections: { title: string; data: any[]; type: string }[] = [];

  if (recipientResults.length > 0) {
    sections.push({
      title: "אנשי קשר",
      data: recipientResults,
      type: "recipient",
    });
  }
  if (conversationResults.length > 0) {
    sections.push({
      title: "שיחות",
      data: conversationResults,
      type: "conversation",
    });
  }
  if (messageResults.length > 0) {
    sections.push({
      title: "הודעות",
      data: messageResults,
      type: "message",
    });
  }

  const isEmpty = sections.length === 0 && !searching;

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => item.id || item.messageId || String(index)}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item, section }) => {
        if (section.type === "recipient") {
          return (
            <RecipientCard
              recipientId={item.id}
              nickname={item.data.nickname}
              platform={item.data.platform}
              conversationCount={convoCounts[item.id] || 0}
              onPress={() => onRecipientPress(item.id)}
            />
          );
        }
        if (section.type === "conversation") {
          return (
            <ConversationCard
              name={item.data.name}
              date={item.data.date.toDate()}
              messageCount={item.data.messageCount}
              platform={item.data.platform}
              onPress={() => onConversationPress(item.id)}
            />
          );
        }
        // message
        const msg = item as SearchMessageResult;
        return (
          <TouchableOpacity
            style={styles.messageRow}
            activeOpacity={0.7}
            onPress={() => onMessagePress(msg.conversationId, msg.messageId)}
          >
            <Text style={styles.messageConvoName}>{msg.conversationName}</Text>
            <Text style={styles.messageSnippet} numberOfLines={2}>
              {highlightSnippet(msg.content, query)}
            </Text>
          </TouchableOpacity>
        );
      }}
      ListEmptyComponent={
        isEmpty ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>לא נמצאו תוצאות</Text>
          </View>
        ) : null
      }
      ListFooterComponent={
        searching ? (
          <ActivityIndicator
            size="small"
            color="#4A90D9"
            style={styles.loader}
          />
        ) : null
      }
      contentContainerStyle={sections.length === 0 && isEmpty ? styles.emptyList : undefined}
    />
  );
}

function highlightSnippet(content: string, query: string): string {
  // Return a trimmed snippet around the match
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return content.substring(0, 100);

  const start = Math.max(0, idx - 30);
  const end = Math.min(content.length, idx + query.length + 50);
  let snippet = "";
  if (start > 0) snippet += "...";
  snippet += content.substring(start, end);
  if (end < content.length) snippet += "...";
  return snippet;
}

const styles = StyleSheet.create({
  sectionHeader: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    textAlign: "right",
  },
  messageRow: {
    padding: 14,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  messageConvoName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4A90D9",
    marginBottom: 2,
    textAlign: "right",
  },
  messageSnippet: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    textAlign: "right",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  loader: {
    marginVertical: 16,
  },
});
