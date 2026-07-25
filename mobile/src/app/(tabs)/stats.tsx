import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/lib/api";
import { useUser } from "@/lib/user";
import { colors, radius, gradients, getUserLevel, getNextLevel, getLevelProgress } from "@/lib/theme";
import { Card, Progress, Loading, ErrorView } from "@/components/ui";
import { formatRelativeTime } from "@/lib/format";

interface DailyActivity { date: string; pagesRead: number; juzRead: number; bookPages: number; coinsEarned: number; }
interface CoinTx { id: string; amount: number; reason: string; description?: string | null; createdAt: string; }

const COIN_ICON: Record<string, string> = {
  DAILY_ACTIVITY: "☀️", JUZ_COMPLETED: "📖", KHATM_PARTICIPANT: "🎉",
  KHATM_CREATOR: "👑", BOOK_COMPLETED: "📚", STREAK_7: "🔥", STREAK_30: "💎", ADMIN_BONUS: "⭐",
};

export default function StatsScreen() {
  const { user, refresh: refreshUser } = useUser();
  const [week, setWeek] = useState<DailyActivity[]>([]);
  const [coins, setCoins] = useState<CoinTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const d = await api.get<{ weekActivity: DailyActivity[]; recentCoins: CoinTx[] }>("/api/users/activity");
      setWeek(d.weekActivity ?? []);
      setCoins(d.recentCoins ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); refreshUser(); }, [load, refreshUser]));
  const onRefresh = useCallback(async () => { setRefreshing(true); await Promise.all([load(), refreshUser()]); setRefreshing(false); }, [load, refreshUser]);

  if (loading && !refreshing) return <SafeAreaView style={s.flex}><Loading /></SafeAreaView>;
  if (err) return <SafeAreaView style={s.flex}><ErrorView message={err} onRetry={onRefresh} /></SafeAreaView>;

  const c = user?.coins ?? 0;
  const level = getUserLevel(c);
  const nextLevel = getNextLevel(c);
  const maxBar = Math.max(1, ...week.map((d) => (d.pagesRead ?? 0) + (d.bookPages ?? 0)));

  const summary = [
    { icon: "book-outline", label: "Qur'on betlari", value: user?.totalPagesRead ?? 0, color: colors.emerald },
    { icon: "bookmark-outline", label: "O'qilgan pora", value: user?.totalJuzRead ?? 0, color: colors.emeraldDark },
    { icon: "library-outline", label: "O'qilgan kitob", value: user?.totalBooksRead ?? 0, color: colors.purple },
    { icon: "flame-outline", label: "Streak", value: `${user?.streakDays ?? 0} kun`, color: colors.orange },
    { icon: "star-outline", label: "BuloqCoin", value: c, color: colors.yellow },
    { icon: "trophy-outline", label: "Xatmlar", value: user?.totalKhatms ?? 0, color: colors.blue },
  ];

  return (
    <SafeAreaView style={s.flex} edges={["top"]}>
      <ScrollView contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}>
        <Text style={s.h1}>Statistika</Text>
        <Text style={s.muted}>Shaxsiy o'qish natijalaringiz</Text>

        <View style={s.grid}>
          {summary.map((st) => (
            <Card key={st.label} style={s.statCard}>
              <View style={[s.statIcon, { backgroundColor: st.color + "22" }]}>
                <Ionicons name={st.icon as any} size={18} color={st.color} />
              </View>
              <Text style={s.statValue}>{st.value}</Text>
              <Text style={s.statLabel}>{st.label}</Text>
            </Card>
          ))}
        </View>

        {/* Level */}
        <Card style={{ marginTop: 6 }}>
          <Text style={s.section}>Daraja</Text>
          <View style={s.rowBetween}>
            <Text style={[s.levelName, { color: level.color }]}>{level.name}</Text>
            {nextLevel ? <Text style={s.smallMuted}>{nextLevel.name} → {nextLevel.minPoints - c}</Text> : <Text style={s.smallMuted}>MAX 🏆</Text>}
          </View>
          <View style={{ marginTop: 8 }}><Progress value={getLevelProgress(c)} colorsArr={gradients.purple} /></View>
        </Card>

        {/* Week chart */}
        <Card style={{ marginTop: 14 }}>
          <Text style={s.section}>So'nggi kunlar faolligi</Text>
          {week.length > 0 ? (
            <View style={s.chart}>
              {week.slice(-7).map((d, i) => {
                const total = (d.pagesRead ?? 0) + (d.bookPages ?? 0);
                const h = Math.round((total / maxBar) * 100);
                const label = new Date(d.date).getDate();
                return (
                  <View key={i} style={s.barCol}>
                    <Text style={s.barVal}>{total || ""}</Text>
                    <View style={s.barTrack}>
                      <View style={[s.bar, { height: `${Math.max(4, h)}%` }]} />
                    </View>
                    <Text style={s.barLabel}>{label}</Text>
                  </View>
                );
              })}
            </View>
          ) : <Text style={[s.muted, { textAlign: "center", paddingVertical: 16 }]}>Hali faollik yo'q</Text>}
        </Card>

        {/* Coin history */}
        <Card style={{ marginTop: 14 }}>
          <Text style={s.section}>Ajr Ball tarixi</Text>
          {coins.length > 0 ? coins.map((tx) => (
            <View key={tx.id} style={s.txRow}>
              <View style={s.txIcon}><Text>{COIN_ICON[tx.reason] ?? "⭐"}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.body} numberOfLines={1}>{tx.description ?? tx.reason}</Text>
                <Text style={s.smallMuted}>{formatRelativeTime(tx.createdAt)}</Text>
              </View>
              <Text style={{ fontWeight: "800", color: tx.amount > 0 ? colors.emerald : colors.red }}>
                {tx.amount > 0 ? "+" : ""}{tx.amount}
              </Text>
            </View>
          )) : <Text style={[s.muted, { textAlign: "center", paddingVertical: 16 }]}>Hali ball tarixi yo'q</Text>}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  h1: { fontSize: 24, fontWeight: "800", color: colors.text },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  smallMuted: { color: colors.textMuted, fontSize: 11 },
  body: { fontSize: 14, color: colors.text, fontWeight: "500" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14, marginBottom: 8 },
  statCard: { width: "31%", alignItems: "center", padding: 12 },
  statIcon: { height: 36, width: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "900", color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: "center" },
  section: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 12 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  levelName: { fontSize: 15, fontWeight: "800" },
  chart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 140, gap: 6 },
  barCol: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
  barVal: { fontSize: 10, color: colors.textMuted, marginBottom: 2 },
  barTrack: { width: "70%", flex: 1, backgroundColor: "#f1f5f9", borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  bar: { width: "100%", backgroundColor: colors.emerald, borderRadius: 6 },
  barLabel: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  txIcon: { height: 34, width: 34, borderRadius: 8, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center" },
});
