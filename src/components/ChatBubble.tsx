import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getColorForRecipient } from "../utils/colors";

interface Props {
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isMe?: boolean;
  messageId?: string;
  selected?: boolean;
  selectionMode?: boolean;
  highlighted?: boolean;
  onPress?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

export function ChatBubble({
  senderId,
  senderName,
  content,
  timestamp,
  isMe,
  messageId,
  selected,
  selectionMode,
  highlighted,
  onPress,
  onLongPress,
}: Props) {
  const bgColor = getColorForRecipient(senderId);
  const highlightAnim = useRef(new Animated.Value(highlighted ? 1 : 0)).current;

  useEffect(() => {
    if (highlighted) {
      highlightAnim.setValue(1);
      Animated.timing(highlightAnim, {
        toValue: 0,
        duration: 1500,
        delay: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [highlighted]);

  const highlightBg = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "#FFF9C4"],
  });

  return (
    <Pressable
      onPress={messageId && onPress ? () => onPress(messageId) : undefined}
      onLongPress={messageId && onLongPress ? () => onLongPress(messageId) : undefined}
      delayLongPress={300}
    >
      <Animated.View
        style={[
          styles.container,
          isMe ? styles.containerRight : styles.containerLeft,
          { backgroundColor: highlightBg },
        ]}
      >
        <View style={[styles.bubble, { backgroundColor: bgColor }, selected && styles.selectedOverlay]}>
          {selected && (
            <View style={styles.checkmark}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4A90D9" />
            </View>
          )}
          <Text style={styles.sender}>{senderName}</Text>
          <Text style={styles.content}>{content}</Text>
          <Text style={styles.time}>
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
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
  selectedOverlay: {
    backgroundColor: "rgba(74,144,217,0.15)",
  },
  checkmark: {
    position: "absolute",
    top: 4,
    left: 4,
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
