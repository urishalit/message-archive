import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getColorForRecipient } from "../utils/colors";

interface Props {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isMe?: boolean;
}

export function ChatBubble({
  senderId,
  senderName,
  content,
  timestamp,
  isMe,
}: Props) {
  const bgColor = getColorForRecipient(senderId);

  return (
    <View
      style={[
        styles.container,
        isMe ? styles.containerRight : styles.containerLeft,
      ]}
    >
      <View style={[styles.bubble, { backgroundColor: bgColor }]}>
        <Text style={styles.sender}>{senderName}</Text>
        <Text style={styles.content}>{content}</Text>
        <Text style={styles.time}>
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    marginHorizontal: 12,
    maxWidth: "80%",
  },
  containerLeft: {
    alignSelf: "flex-start",
  },
  containerRight: {
    alignSelf: "flex-end",
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sender: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
    color: "#333",
  },
  content: {
    fontSize: 15,
    color: "#000",
    lineHeight: 20,
  },
  time: {
    fontSize: 11,
    color: "#666",
    alignSelf: "flex-end",
    marginTop: 4,
  },
});
