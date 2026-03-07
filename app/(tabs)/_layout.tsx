import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#4A90D9" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "600" },
        tabBarActiveTintColor: "#4A90D9",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "ראשי",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{"🏠"}</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "הגדרות",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>{"⚙️"}</Text>,
        }}
      />
    </Tabs>
  );
}
