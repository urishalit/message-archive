import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useRecipients } from "../../src/hooks/useRecipients";
import { RecipientCard } from "../../src/components/RecipientCard";
import firestore from "@react-native-firebase/firestore";

export default function HomeScreen() {
  const { recipients, loading } = useRecipients();
  const [convoCounts, setConvoCounts] = useState<Record<string, number>>({});
  const router = useRouter();

  useEffect(() => {
    // Get conversation counts per recipient
    const unsubscribe = firestore()
      .collection("conversations")
      .onSnapshot((snap) => {
        const counts: Record<string, number> = {};
        for (const doc of snap.docs) {
          const data = doc.data();
          for (const rid of data.recipientIds || []) {
            counts[rid] = (counts[rid] || 0) + 1;
          }
        }
        setConvoCounts(counts);
      });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {recipients.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Import a chat to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipients}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipientCard
              recipientId={item.id}
              nickname={item.data.nickname}
              platform={item.data.platform}
              conversationCount={convoCounts[item.id] || 0}
              onPress={() => router.push(`/recipient/${item.id}`)}
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
