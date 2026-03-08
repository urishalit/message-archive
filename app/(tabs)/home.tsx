import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useRecipients } from "../../src/hooks/useRecipients";
import { RecipientCard } from "../../src/components/RecipientCard";
import { SearchBar } from "../../src/components/SearchBar";
import { SearchResultsList } from "../../src/components/SearchResultsList";
import { deleteRecipient } from "../../src/services/firestore";
import { useSearch } from "../../src/hooks/useSearch";
import { ConversationDoc } from "../../src/types/firestore";
import firestore from "@react-native-firebase/firestore";

export default function HomeScreen() {
  const { recipients, loading } = useRecipients();
  const [convoCounts, setConvoCounts] = useState<Record<string, number>>({});
  const [uploaderIds, setUploaderIds] = useState<Set<string>>(new Set());
  const [conversations, setConversations] = useState<
    { id: string; data: ConversationDoc }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Get conversation counts per recipient, collect uploader IDs, and build conversations array
    const unsubscribe = firestore()
      .collection("conversations")
      .orderBy("date", "desc")
      .onSnapshot((snap) => {
        if (!snap) return;
        const counts: Record<string, number> = {};
        const uploaders = new Set<string>();
        const convos: { id: string; data: ConversationDoc }[] = [];
        for (const doc of snap.docs) {
          const data = doc.data() as ConversationDoc;
          convos.push({ id: doc.id, data });
          for (const rid of data.recipientIds || []) {
            counts[rid] = (counts[rid] || 0) + 1;
          }
          if (data.uploaderId) {
            uploaders.add(data.uploaderId);
          }
        }
        setConvoCounts(counts);
        setUploaderIds(uploaders);
        setConversations(convos);
      });
    return unsubscribe;
  }, []);

  const visibleRecipients = recipients.filter((r) => !uploaderIds.has(r.id));

  const { recipientResults, conversationResults, messageResults, searching } =
    useSearch(searchQuery, visibleRecipients, conversations);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={() => setSearchQuery("")}
      />
      {searchQuery ? (
        <SearchResultsList
          recipientResults={recipientResults}
          conversationResults={conversationResults}
          messageResults={messageResults}
          searching={searching}
          convoCounts={convoCounts}
          query={searchQuery}
          onRecipientPress={(id) => router.push(`/recipient/${id}`)}
          onConversationPress={(id) => router.push(`/conversation/${id}`)}
          onMessagePress={(convoId, msgId) =>
            router.push(`/conversation/${convoId}?highlightMessage=${msgId}`)
          }
        />
      ) : visibleRecipients.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>אין שיחות עדיין</Text>
          <Text style={styles.emptySubtext}>
            ייבא צ'אט כדי להתחיל
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleRecipients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipientCard
              recipientId={item.id}
              nickname={item.data.nickname}
              platform={item.data.platform}
              conversationCount={convoCounts[item.id] || 0}
              onPress={() => router.push(`/recipient/${item.id}`)}
              onLongPress={() =>
                Alert.alert(
                  "מחיקת איש קשר",
                  `למחוק את "${item.data.nickname}" וכל השיחות שלו?\nפעולה זו אינה ניתנת לביטול.`,
                  [
                    { text: "ביטול", style: "cancel" },
                    {
                      text: "מחק",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await deleteRecipient(item.id);
                        } catch (e: any) {
                          Alert.alert("שגיאה", e.message || "המחיקה נכשלה");
                        }
                      },
                    },
                  ]
                )
              }
            />
          )}
        />
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/import")}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4A90D9",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 28,
    color: "#fff",
    lineHeight: 30,
  },
});
