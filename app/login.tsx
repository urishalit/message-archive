import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { signInWithGoogle } from "../src/services/auth";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      router.replace(redirect || "/(tabs)/home");
    } catch (error: any) {
      Alert.alert("שגיאת התחברות", error.message || "ההתחברות נכשלה");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ארכיון הודעות</Text>
      <Text style={styles.subtitle}>
        ייבוא וארגון שיחות הצ'אט שלך
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleSignIn}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>התחברות עם Google</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 48,
  },
  button: {
    backgroundColor: "#4285F4",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 220,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
