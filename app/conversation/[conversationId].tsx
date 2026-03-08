import React, { useEffect, useState } from "react";
import { View, StyleSheet, Share, Pressable, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, Stack, useRouter } from "expo-router";
import { useMessages } from "../../src/hooks/useMessages";
import { ChatView } from "../../src/components/ChatView";
import { useAuth } from "../../src/providers/AuthProvider";
import { deleteConversation } from "../../src/services/firestore";
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

  const handleDelete = () => {
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
        },
        () => {} // Ignore snapshot errors (e.g. doc deleted)
      );

    return unsubscribe;
  }, [conversationId]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: convoName || "Chat",
          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginRight: 8 }}>
              <Pressable onPress={handleDelete}>
                <MaterialCommunityIcons name="trash-can-outline" size={22} color="#333" />
              </Pressable>
              <Pressable onPress={shareConversation}>
                <MaterialCommunityIcons name="share-variant" size={22} color="#333" />
              </Pressable>
            </View>
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
