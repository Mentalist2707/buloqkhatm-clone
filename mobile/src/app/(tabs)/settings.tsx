import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useUser } from "@/lib/user";
import { API_BASE_URL } from "@/lib/config";
import { colors, radius } from "@/lib/theme";
import { Card, Btn } from "@/components/ui";

export default function SettingsScreen() {
  const { user, refresh } = useUser();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user?.name) setName(user.name); }, [user?.name]);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch("/api/users/me", { name: name.trim() || null });
      await refresh();
      Alert.alert("✅ Saqlandi");
    } catch (e: any) {
      Alert.alert("Xato", e?.message ?? "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    Alert.alert("Ma'lumotlarni tozalash", "Ballaringiz, xatm va kitoblaringiz o'chiriladi. Davom etasizmi?", [
      { text: "Bekor", style: "cancel" },
      { text: "Tozalash", style: "destructive", onPress: async () => {
        try { await api.del("/api/users/me"); await refresh(); Alert.alert("Tozalandi"); }
        catch (e: any) { Alert.alert("Xato", e?.message ?? "Xatolik"); }
      }},
    ]);
  };

  return (
    <SafeAreaView style={s.flex} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.h1}>Sozlamalar</Text>

        <Card style={{ marginTop: 14 }}>
          <View style={s.profileRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{(user?.name?.[0] ?? "M").toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.title}>{user?.name || "Men"}</Text>
              <Text style={s.muted}>Shaxsiy hisob · {user?.level ?? "Beginner"}</Text>
            </View>
          </View>
          <Text style={[s.label, { marginTop: 14 }]}>Ismingiz</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Ismingiz" placeholderTextColor={colors.textLight} style={s.input} />
          <Btn label="Saqlash" onPress={save} loading={saving} style={{ marginTop: 12 }} />
        </Card>

        <Card style={{ marginTop: 14 }}>
          <Text style={s.section}>Hisob</Text>
          <Row label="Ajr Ballar" value={String(user?.coins ?? 0)} />
          <Row label="Daraja" value={user?.level ?? "Beginner"} />
          <Row label="Streak" value={`${user?.streakDays ?? 0} kun`} />
        </Card>

        <Card style={{ marginTop: 14, backgroundColor: colors.blueBg, borderColor: "#bfdbfe" }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Ionicons name="server-outline" size={18} color={colors.blue} />
            <View style={{ flex: 1 }}>
              <Text style={[s.title, { color: colors.blue }]}>Server ulanishi</Text>
              <Text style={[s.smallMuted, { marginTop: 4 }]} selectable>{API_BASE_URL}</Text>
              <Text style={[s.smallMuted, { marginTop: 6 }]}>
                Ulanmasa: kompyuterda Next.js server ishlab turishi va bu manzil kompyuter LAN IP siga to'g'ri kelishi kerak
                (mobile/src/lib/config.ts yoki app.json → extra.apiBaseUrl).
              </Text>
            </View>
          </View>
        </Card>

        <Card style={{ marginTop: 14, borderColor: "#fecaca" }}>
          <Text style={[s.section, { color: colors.red }]}>Xavfli zona</Text>
          <Text style={s.muted}>Barcha shaxsiy ma'lumotlarni tozalash (qaytarib bo'lmaydi).</Text>
          <Btn label="Ma'lumotlarni tozalash" variant="danger" onPress={reset} style={{ marginTop: 12 }} />
        </Card>

        <Text style={[s.smallMuted, { textAlign: "center", marginTop: 20 }]}>BuloqKhatm — shaxsiy · © 2024</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.muted}>{label}</Text>
      <Text style={s.title}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  h1: { fontSize: 24, fontWeight: "800", color: colors.text },
  title: { fontSize: 15, fontWeight: "700", color: colors.text },
  muted: { color: colors.textMuted, fontSize: 13 },
  smallMuted: { color: colors.textMuted, fontSize: 11, lineHeight: 16 },
  section: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 10 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 44, fontSize: 15, color: colors.text, backgroundColor: colors.card },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { height: 52, width: 52, borderRadius: 26, backgroundColor: colors.emeraldBg, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "800", color: colors.emeraldDark },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
