import { Stack } from "expo-router";
import { I18nManager } from "react-native";
import { AuthProvider } from "../src/providers/AuthProvider";
import { ShareIntentProvider } from "expo-share-intent";

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <AuthProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#4A90D9" },
            headerTintColor: "#fff",
            headerTitleStyle: { fontWeight: "600" },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ title: "התחברות" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="recipient/[recipientId]" options={{ title: "שיחות" }} />
          <Stack.Screen name="conversation/[conversationId]" options={{ title: "צ'אט" }} />
          <Stack.Screen name="import/index" options={{ title: "ייבוא צ'אט" }} />
          <Stack.Screen name="import/select-range" options={{ title: "בחירת טווח" }} />
          <Stack.Screen name="import/confirm" options={{ title: "אישור ייבוא" }} />
          <Stack.Screen name="recipients/edit" options={{ title: "ניהול כינויים" }} />
        </Stack>
      </AuthProvider>
    </ShareIntentProvider>
  );
}
