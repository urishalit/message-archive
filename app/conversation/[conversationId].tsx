import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useMessages } from "../../src/hooks/useMessages";
import { ChatView } from "../../src/components/ChatView";
import firestore from "@react-native-firebase/firestore";
import { ConversationDoc, RecipientDoc } from "../../src/types/firestore";

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const { messages, loading } = useMessages(conversationId!);
  const [convoName, setConvoName] = useState("");
  const [recipientMap, setRecipientMap] = useState<Map<string, RecipientDoc>>(
    new Map()
  );

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = firestore()
      .collection("conversations")
      .doc(conversationId)
      .onSnapshot(async (doc) => {
        if (!doc.exists) return;
        const data = doc.data() as ConversationDoc;
        setConvoName(data.name);

        // Fetch all recipients for this conversation
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
      });

    return unsubscribe;
  }, [conversationId]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: convoName || "Chat" }} />
      <ChatView
        messages={messages}
        recipientMap={recipientMap}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ECE5DD",
  },
});
