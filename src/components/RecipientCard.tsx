import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { getColorForRecipient } from "../utils/colors";

interface Props {
  recipientId: string;
  nickname: string;
  platform: string;
  conversationCount?: number;
  onPress: () => void;
  onLongPress?: () => void;
}

export function RecipientCard({
  recipientId,
  nickname,
  platform,
  conversationCount,
  onPress,
  onLongPress,
}: Props) {
  const color = getColorForRecipient(recipientId);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.7}>
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{nickname[0]?.toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nickname}>{nickname}</Text>
        <Text style={styles.subtitle}>
          {platform}
          {conversationCount !== undefined && ` - ${conversationCount} שיחות`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    fontSize: 20,
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
  subtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
});
