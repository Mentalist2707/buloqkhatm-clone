import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Platform, type ColorValue } from "react-native";
import { colors } from "@/lib/theme";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function tabIcon(base: string) {
  return ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons name={(focused ? base : `${base}-outline`) as IoniconName} color={color as string} size={size - 1} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.emerald,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet_hairline,
          height: Platform.OS === "ios" ? 88 : 66,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 2 },
        tabBarItemStyle: { paddingTop: 2 },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: "Bosh sahifa", tabBarIcon: tabIcon("home") }} />
      <Tabs.Screen name="books"    options={{ title: "Kitoblar",    tabBarIcon: tabIcon("library") }} />
      <Tabs.Screen name="khatms"   options={{ title: "Xatmlar",     tabBarIcon: tabIcon("book") }} />
      <Tabs.Screen name="stats"    options={{ title: "Statistika",  tabBarIcon: tabIcon("stats-chart") }} />
      <Tabs.Screen name="settings" options={{ title: "Sozlamalar",  tabBarIcon: tabIcon("settings") }} />
    </Tabs>
  );
}

const StyleSheet_hairline = 0.5;
