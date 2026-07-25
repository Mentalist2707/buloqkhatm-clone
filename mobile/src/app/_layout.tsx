import "react-native-reanimated";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserProvider } from "@/lib/user";
import { colors } from "@/lib/theme";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <UserProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.emeraldDark,
              headerTitleStyle: { fontWeight: "800" },
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="book/create" options={{ title: "Yangi Kitob", presentation: "modal" }} />
            <Stack.Screen name="book/[id]" options={{ title: "Kitob" }} />
            <Stack.Screen name="khatm/[id]" options={{ title: "Xatm" }} />
          </Stack>
        </UserProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
