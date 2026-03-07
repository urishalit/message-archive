import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useConversations } from "../../src/hooks/useConversations";
import { ConversationCard } from "../../src/components/ConversationCard";
import firestore from "@react-native-firebase/firestore";
import { RecipientDoc } from "../../src/types/firestore";

export default function RecipientScreen() {
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const { conversations, loading } = useConversations(recipientId);
  const [recipient, setRecipient] = useState<RecipientDoc | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!recipientId) return;
    const unsubscribe = firestore()
      .collection("recipients")
      .doc(recipientId)
      .onSnapshot((doc) => {
        if (doc.exists()) {
          setRecipient(doc.data() as RecipientDoc);
        }
      });
    return unsubscribe;
  }, [recipientId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: recipient?.nickname || "שיחות" }} />
      {conversations.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>אין שיחות</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationCard
              name={item.data.name}
              date={item.data.date?.toDate() || new Date()}
              messageCount={item.data.messageCount}
              platform={item.data.platform}
              onPress={() => router.push(`/conversation/${item.id}`)}
            />
          )}
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
});
