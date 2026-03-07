import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/providers/AuthProvider";
import { signOut } from "../../src/services/auth";

export default function SettingsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert("התנתקות", "האם אתה בטוח שברצונך להתנתק?", [
      { text: "ביטול", style: "cancel" },
      {
        text: "התנתק",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        {user?.photoURL && (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        )}
        <Text style={styles.name}>{user?.displayName || "משתמש"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/recipients/edit")}
        >
          <Text style={styles.menuText}>ניהול כינויים</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={[styles.menuText, styles.signOutText]}>התנתק</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  profileSection: {
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  menuItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  menuText: {
    fontSize: 16,
    color: "#333",
  },
  signOutButton: {
    marginTop: 24,
  },
  signOutText: {
    color: "#D32F2F",
  },
});
