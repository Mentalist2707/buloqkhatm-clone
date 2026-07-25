import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { api, Khatm } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import { Card, Progress, Pill, Loading, ErrorView } from "@/components/ui";

export default function KhatmsScreen() {
  const router = useRouter();
  const [khatms, setKhatms] = useState<Khatm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const ks = await api.get<Khatm[]>("/api/khatms?status=ALL");
      setKhatms(ks ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  if (loading && !refreshing) return <SafeAreaView style={s.flex}><Loading /></SafeAreaView>;
  if (err) return <SafeAreaView style={s.flex}><ErrorView message={err} onRetry={onRefresh} /></SafeAreaView>;

  return (
    <SafeAreaView style={s.flex} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
      >
        <Text style={s.h1}>Xatmlar</Text>
        <Text style={s.muted}>{khatms.length} ta xatm</Text>

        <View style={{ marginTop: 14, gap: 12 }}>
          {khatms.length > 0 ? khatms.map((k) => {
            const done = k.juzList?.filter((j) => j.status === "COMPLETED").length ?? 0;
            const pct = Math.round((done / 30) * 100);
            const active = k.status === "ACTIVE";
            return (
              <Pressable key={k.id} onPress={() => router.push(`/khatm/${k.id}`)}>
                <Card>
                  <View style={s.rowBetween}>
                    <Text style={s.title} numberOfLines={1}>{k.title}</Text>
                    <Pill
                      text={active ? "Faol" : k.status === "COMPLETED" ? "Yakunlangan" : "Qoralama"}
                      color={active ? colors.emeraldDark : colors.blue}
                      bg={active ? colors.emeraldBg : colors.blueBg}
                    />
                  </View>
                  {k.description ? <Text style={s.muted} numberOfLines={2}>{k.description}</Text> : null}
                  <View style={{ marginTop: 10 }}>
                    <Progress value={pct} />
                    <View style={[s.rowBetween, { marginTop: 5 }]}>
                      <Text style={s.smallMuted}>{done}/30 pora · {k._count?.participations ?? 1} ishtirokchi</Text>
                      <Text style={{ fontWeight: "800", color: colors.emerald, fontSize: 12 }}>{pct}%</Text>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }) : (
            <Card style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text style={{ fontSize: 34 }}>📖</Text>
              <Text style={[s.muted, { marginTop: 8 }]}>Hozircha xatm yo'q</Text>
              <Text style={[s.smallMuted, { marginTop: 4, textAlign: "center" }]}>
                Xatmni veb ilovada yarating — bu yerda kuzatib borasiz
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  h1: { fontSize: 24, fontWeight: "800", color: colors.text },
  title: { fontSize: 15, fontWeight: "700", color: colors.text, flex: 1, marginRight: 8 },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  smallMuted: { color: colors.textMuted, fontSize: 11 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
});
