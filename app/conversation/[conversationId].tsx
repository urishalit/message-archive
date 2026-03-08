import React, { useEffect, useState } from "react";
import { View, StyleSheet, Share, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useMessages } from "../../src/hooks/useMessages";
import { ChatView } from "../../src/components/ChatView";
import { useAuth } from "../../src/providers/AuthProvider";
import firestore from "@react-native-firebase/firestore";
import { ConversationDoc, RecipientDoc } from "../../src/types/firestore";

export default function ConversationScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { messages, loading } = useMessages(conversationId!);
  const [convoName, setConvoName] = useState("");
  const [recipientMap, setRecipientMap] = useState<Map<string, RecipientDoc>>(
    new Map()
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=/conversation/${conversationId}`);
    }
  }, [authLoading, user]);

  const shareConversation = async () => {
    const deepLink = `message-archive://conversation/${conversationId}`;
    await Share.share({ message: `${convoName}\n${deepLink}` });
  };

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
      <Stack.Screen
        options={{
          title: convoName || "Chat",
          headerRight: () => (
            <Pressable onPress={shareConversation} style={{ marginRight: 8 }}>
              <MaterialCommunityIcons name="share-variant" size={22} color="#333" />
            </Pressable>
          ),
        }}
      />
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
