import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";

interface Props {
  name: string;
  date: Date;
  messageCount: number;
  platform: string;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ConversationCard({
  name,
  date,
  messageCount,
  platform,
  onPress,
  onLongPress,
}: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.badge}>{platform}</Text>
      </View>
      <Text style={styles.subtitle}>
        {date.toLocaleDateString()} - {messageCount} הודעות
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    flex: 1,
  },
  badge: {
    fontSize: 11,
    color: "#fff",
    backgroundColor: "#4A90D9",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
});
