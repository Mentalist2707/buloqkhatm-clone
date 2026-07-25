import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, RefreshControl } from "react-native";
import { useLocalSearchParams, useFocusEffect, useNavigation } from "expo-router";
import { api } from "@/lib/api";
import { useUser } from "@/lib/user";
import { colors, radius } from "@/lib/theme";
import { Card, Progress, Loading, ErrorView } from "@/components/ui";
import { JUZ_NAMES } from "@/lib/format";

interface Juz {
  id: string;
  juzNumber: number;
  status: "AVAILABLE" | "RESERVED" | "COMPLETED";
  assignedToId: string | null;
  progress?: { pagesRead: number; totalPages: number } | null;
}
interface KhatmDetail {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  juzList: Juz[];
  _count?: { participations: number };
}

export default function KhatmDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user, refresh: refreshUser } = useUser();

  const [khatm, setKhatm] = useState<KhatmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const k = await api.get<KhatmDetail>(`/api/khatms/${id}`);
      setKhatm(k);
      navigation.setOptions({ title: k.title });
    } catch (e: any) {
      setErr(e?.message ?? "Xatolik");
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const takeJuz = (juz: Juz) => {
    Alert.alert(`${juz.juzNumber}-porani olasizmi?`, JUZ_NAMES[juz.juzNumber], [
      { text: "Bekor", style: "cancel" },
      { text: "Olaman", onPress: async () => {
        setBusy(juz.id);
        try { await api.post(`/api/juz/${juz.id}/take`); await load(); }
        catch (e: any) { Alert.alert("Xato", e?.message ?? "Xatolik"); }
        finally { setBusy(null); }
      }},
    ]);
  };

  const completeJuz = (juz: Juz) => {
    Alert.alert(`${juz.juzNumber}-porani o'qib bo'ldingizmi?`, "Bu porani yakunlangan deb belgilaymiz.", [
      { text: "Bekor", style: "cancel" },
      { text: "Ha, o'qidim", onPress: async () => {
        setBusy(juz.id);
        try {
          const r = await api.post<{ coinsEarned: number; khatmCompleted: boolean }>(`/api/juz/${juz.id}/complete`);
          await load(); await refreshUser();
          Alert.alert("🎉 Ajr!", `${juz.juzNumber}-pora yakunlandi${r.coinsEarned ? ` · +${r.coinsEarned} coin` : ""}`);
        } catch (e: any) { Alert.alert("Xato", e?.message ?? "Xatolik"); }
        finally { setBusy(null); }
      }},
    ]);
  };

  if (loading && !refreshing) return <Loading />;
  if (err || !khatm) return <ErrorView message={err ?? "Xatm topilmadi"} onRetry={onRefresh} />;

  const done = khatm.juzList.filter((j) => j.status === "COMPLETED").length;
  const pct = Math.round((done / 30) * 100);
  const myId = user?.id;

  return (
    <ScrollView
      style={s.flex}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
    >
      <Card style={{ backgroundColor: colors.emeraldDark }}>
        <Text style={s.heroTitle}>{khatm.title}</Text>
        {khatm.description ? <Text style={s.heroDesc}>{khatm.description}</Text> : null}
        <View style={{ marginTop: 12 }}>
          <Progress value={pct} color="#fff" track="rgba(255,255,255,0.25)" height={10} />
          <Text style={s.heroMeta}>{done}/30 pora o'qildi · {pct}%</Text>
        </View>
      </Card>

      <Text style={s.section}>30 Pora</Text>
      <View style={s.legend}>
        {[["Bo'sh", "#cbd5e1"], ["Band", colors.amber], ["O'qildi", colors.emerald]].map(([l, c]) => (
          <View key={l} style={s.legendItem}>
            <View style={[s.dot, { backgroundColor: c as string }]} />
            <Text style={s.smallMuted}>{l}</Text>
          </View>
        ))}
      </View>

      <View style={s.grid}>
        {khatm.juzList.map((juz) => {
          const mine = juz.assignedToId === myId;
          const bg = juz.status === "COMPLETED" ? colors.emeraldBg
            : juz.status === "RESERVED" ? colors.amberBg : "#f1f5f9";
          const border = juz.status === "COMPLETED" ? colors.emerald
            : juz.status === "RESERVED" ? colors.amber : colors.border;
          const onPress = () => {
            if (busy) return;
            if (juz.status === "AVAILABLE") takeJuz(juz);
            else if (juz.status === "RESERVED" && mine) completeJuz(juz);
          };
          return (
            <Pressable key={juz.id} onPress={onPress} style={[s.cell, { backgroundColor: bg, borderColor: border }]}>
              <Text style={[s.cellNum, { color: border === colors.border ? colors.text : border }]}>{juz.juzNumber}</Text>
              <Text style={s.cellName} numberOfLines={1}>{JUZ_NAMES[juz.juzNumber]}</Text>
              {juz.status === "AVAILABLE" ? <Text style={s.cellHint}>olish →</Text>
                : juz.status === "RESERVED"
                  ? <Text style={[s.cellHint, { color: colors.amber }]}>{mine ? "o'qidim ✓" : "band"}</Text>
                  : <Text style={[s.cellHint, { color: colors.emerald }]}>✓ o'qildi</Text>}
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  heroDesc: { color: "#d1fae5", fontSize: 13, marginTop: 4 },
  heroMeta: { color: "#d1fae5", fontSize: 12, marginTop: 6 },
  section: { fontSize: 16, fontWeight: "800", color: colors.text, marginTop: 20, marginBottom: 8 },
  legend: { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 3 },
  smallMuted: { color: colors.textMuted, fontSize: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: "22.5%", aspectRatio: 0.9, borderRadius: radius.md, borderWidth: 1.5, padding: 6, justifyContent: "space-between" },
  cellNum: { fontSize: 20, fontWeight: "900" },
  cellName: { fontSize: 8, color: colors.textMuted },
  cellHint: { fontSize: 9, fontWeight: "700", color: colors.textLight },
});
