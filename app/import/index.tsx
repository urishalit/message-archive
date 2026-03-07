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
import * as FileSystem from "expo-file-system/legacy";
import JSZip from "jszip";
import { useShareIntentContext } from "expo-share-intent";
import { detectAndParse, ParsedChat } from "../../src/parsers";
import { useAuth } from "../../src/providers/AuthProvider";

const CHAT_FILE_EXTENSIONS = [".txt", ".json"];

async function extractChatFromZip(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64" as any,
  });
  const zip = await JSZip.loadAsync(base64, { base64: true });

  // Look for .txt or .json files (skip media/images)
  for (const ext of CHAT_FILE_EXTENSIONS) {
    for (const [filename, file] of Object.entries(zip.files)) {
      if (!file.dir && filename.toLowerCase().endsWith(ext)) {
        return await file.async("string");
      }
    }
  }

  throw new Error("לא נמצא קובץ צ'אט (.txt או .json) בתוך הקובץ המכווץ");
}

async function readFileContent(uri: string, fileName?: string): Promise<string> {
  const isZip =
    fileName?.toLowerCase().endsWith(".zip") ||
    uri.toLowerCase().endsWith(".zip");

  if (isZip) {
    return extractChatFromZip(uri);
  }
  return FileSystem.readAsStringAsync(uri);
}

export default function ImportScreen() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } =
    useShareIntentContext();
  const { user } = useAuth();

  useEffect(() => {
    if (hasShareIntent && shareIntent.files?.length) {
      handleSharedFile(
        shareIntent.files[0].path,
        shareIntent.files[0].fileName
      );
      resetShareIntent();
    } else if (hasShareIntent && shareIntent.text) {
      handleContent(shareIntent.text);
      resetShareIntent();
    }
  }, [hasShareIntent]);

  const handleSharedFile = async (uri: string, fileName?: string) => {
    if (!user) {
      Alert.alert("יש להתחבר קודם");
      router.replace("/login");
      return;
    }
    setLoading(true);
    try {
      const content = await readFileContent(uri, fileName);
      handleContent(content);
    } catch (error: any) {
      Alert.alert("שגיאה", error.message || "קריאת הקובץ נכשלה");
      setLoading(false);
    }
  };

  const handleContent = (content: string) => {
    try {
      const parsed = detectAndParse(content);
      if (parsed.messages.length === 0) {
        Alert.alert(
          "לא נמצאו הודעות",
          "הקובץ אינו מכיל הודעות שניתן לפענח."
        );
        setLoading(false);
        return;
      }
      globalThis.__importData = parsed;
      router.push("/import/select-range");
    } catch (error: any) {
      Alert.alert("שגיאת פענוח", error.message || "פענוח הצ'אט נכשל");
    }
    setLoading(false);
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/plain",
          "application/json",
          "application/zip",
          "application/x-zip-compressed",
          "*/*",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setLoading(true);
      const content = await readFileContent(file.uri, file.name);
      handleContent(content);
    } catch (error: any) {
      Alert.alert("שגיאה", error.message || "בחירת הקובץ נכשלה");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
        <Text style={styles.loadingText}>מפענח ייצוא צ'אט...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ייבוא ייצוא צ'אט</Text>
      <Text style={styles.description}>
        בחר קובץ ייצוא WhatsApp (.txt / .zip) או Telegram (.json)
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={pickFile}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>בחר קובץ</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>
        ניתן גם לשתף קובץ ישירות מ-WhatsApp או Telegram לאפליקציה זו
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
