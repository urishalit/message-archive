import { Stack } from "expo-router";
import { AuthProvider } from "../src/providers/AuthProvider";
import { ShareIntentProvider } from "expo-share-intent";

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
          <Stack.Screen name="login" options={{ title: "Sign In" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="recipient/[recipientId]" options={{ title: "Conversations" }} />
          <Stack.Screen name="conversation/[conversationId]" options={{ title: "Chat" }} />
          <Stack.Screen name="import/index" options={{ title: "Import Chat" }} />
          <Stack.Screen name="import/select-range" options={{ title: "Select Range" }} />
          <Stack.Screen name="import/confirm" options={{ title: "Confirm Import" }} />
          <Stack.Screen name="recipients/edit" options={{ title: "Manage Nicknames" }} />
        </Stack>
      </AuthProvider>
    </ShareIntentProvider>
  );
}
