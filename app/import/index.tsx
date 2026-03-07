import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { useShareIntentContext } from "expo-share-intent";
import { detectAndParse, ParsedChat } from "../../src/parsers";
import { useAuth } from "../../src/providers/AuthProvider";

export default function ImportScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const { user } = useAuth();

  useEffect(() => {
    if (hasShareIntent && shareIntent.files?.length) {
      handleSharedFile(shareIntent.files[0].path);
      resetShareIntent();
    } else if (hasShareIntent && shareIntent.text) {
      handleContent(shareIntent.text);
      resetShareIntent();
    }
  }, [hasShareIntent]);

  const handleSharedFile = async (uri: string) => {
    if (!user) {
      Alert.alert("Please sign in first");
      router.replace("/login");
      return;
    }
    setLoading(true);
    try {
      const content = await FileSystem.readAsStringAsync(uri);
      handleContent(content);
    } catch (error: any) {
      Alert.alert("Error", "Failed to read shared file: " + error.message);
      setLoading(false);
    }
  };

  const handleContent = (content: string) => {
    try {
      const parsed = detectAndParse(content);
      if (parsed.messages.length === 0) {
        Alert.alert("No messages found", "The file does not contain any parseable messages.");
        setLoading(false);
        return;
      }
      // Store parsed data in global state for the next screen
      globalThis.__importData = parsed;
      router.push("/import/select-range");
    } catch (error: any) {
      Alert.alert("Parse Error", error.message || "Failed to parse chat export");
    }
    setLoading(false);
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "application/json", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setLoading(true);
      const content = await FileSystem.readAsStringAsync(file.uri);
      handleContent(content);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to pick file");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>Parsing chat export...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Import Chat Export</Text>
      <Text style={styles.description}>
        Select a WhatsApp .txt export or Telegram result.json file
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={pickFile}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Pick File</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        You can also share a file directly from WhatsApp or Telegram to this app
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
  },
  button: {
    backgroundColor: "#4A90D9",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  hint: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginTop: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },
});
