import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, RefreshControl, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { api, Book } from "@/lib/api";
import { useUser } from "@/lib/user";
import { computeBookPlan } from "@/lib/plan";
import { colors, radius, gradients } from "@/lib/theme";
import { Card, Progress, Btn, Pill, Loading, ErrorView } from "@/components/ui";
import { formatDate, formatRelativeTime } from "@/lib/format";

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { refresh: refreshUser } = useUser();

  const [book, setBook] = useState<Book | null>(null);
  const [toPage, setToPage] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const b = await api.get<Book>(`/api/books/${id}`);
      setBook(b);
      setToPage(String(b.currentPage || ""));
      navigation.setOptions({ title: b.title });
    } catch (e: any) {
      setErr(e?.message ?? "Xatolik");
    } finally {
      setLoading(false);
    }
  }, [id, navigation]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const logRead = async () => {
    if (!book) return;
    const val = parseInt(toPage);
    if (isNaN(val) || val <= book.currentPage) {
      Alert.alert("Xato", `Betni ${book.currentPage} dan katta kiriting`);
      return;
    }
    setSaving(true);
    try {
      const r = await api.post<{ pagesRead: number; newPage: number; willComplete: boolean; coinsEarned: number }>(
        `/api/books/${book.id}/log`, { toPage: val });
      await load();
      await refreshUser();
      if (r.willComplete) Alert.alert("🎉 Tabriklaymiz!", `Kitobni o'qib tugatdingiz! +${r.coinsEarned} coin`);
      else Alert.alert("✅ Belgilandi", `${r.pagesRead} bet${r.coinsEarned > 0 ? ` · +${r.coinsEarned} coin` : ""}`);
    } catch (e: any) {
      Alert.alert("Xato", e?.message ?? "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!book) return;
    setStatusUpdating(true);
    try {
      const next = book.status === "PAUSED" ? "READING" : "PAUSED";
      const updated = await api.patch<Book>(`/api/books/${book.id}`, { status: next });
      setBook(updated);
      if (next === "PAUSED") {
        Alert.alert("⏸️ Kitob to'xtatildi", "O'qish rejasi to'xtatildi. Davom ettirish mumkin.");
      } else {
        Alert.alert("▶️ Davom ettirildi", "Reja to'xtatilgan vaqtga uzaytirildi. Barakalla!");
      }
    } catch (e: any) {
      Alert.alert("Xato", e?.message ?? "Xatolik");
    } finally {
      setStatusUpdating(false);
    }
  };

  const remove = () => {
    Alert.alert("Kitobni o'chirasizmi?", "Kitob va tarixi butunlay o'chiriladi.", [
      { text: "Bekor", style: "cancel" },
      { text: "O'chirish", style: "destructive", onPress: async () => {
        try { await api.del(`/api/books/${id}`); router.back(); }
        catch (e: any) { Alert.alert("Xato", e?.message ?? "Xatolik"); }
      }},
    ]);
  };

  if (loading && !refreshing) return <Loading />;
  if (err || !book) return <ErrorView message={err ?? "Kitob topilmadi"} onRetry={onRefresh} />;

  const plan = computeBookPlan(book);
  const logs = book.logs ?? [];
  const isPaused = book.status === "PAUSED";

  return (
    <ScrollView
      style={s.flex}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
    >
      {/* Header */}
      <Card style={{ flexDirection: "row", gap: 14 }}>
        <View style={s.cover}>
          {book.coverUrl
            ? <Image source={{ uri: book.coverUrl }} style={s.coverImg} contentFit="cover" />
            : <Ionicons name="book" size={34} color={colors.blue} />}
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.rowBetween}>
            <Text style={s.title} numberOfLines={3}>{book.title}</Text>
          </View>
          {book.author ? <Text style={s.muted}>{book.author}</Text> : null}
          <View style={{ marginTop: 8 }}>
            {plan.isCompleted
              ? <Pill text="Yakunlangan" color={colors.blue} bg={colors.blueBg} />
              : isPaused
                ? <Pill text="To'xtatilgan" color={colors.textMuted} bg="#f1f5f9" />
                : <Pill text="O'qilmoqda" color={colors.emeraldDark} bg={colors.emeraldBg} />}
          </View>
          <View style={{ marginTop: 10 }}>
            <Progress value={plan.percent} colorsArr={plan.isCompleted ? gradients.blue : gradients.emeraldBright} height={10} />
            <View style={[s.rowBetween, { marginTop: 5 }]}>
              <Text style={s.smallMuted}>{plan.currentPage}/{plan.totalPages} bet</Text>
              <Text style={{ fontWeight: "800", color: colors.emerald }}>{plan.percent}%</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Pause / Resume */}
      {!plan.isCompleted ? (
        <Card style={{ marginTop: 14, backgroundColor: isPaused ? "#f8fafc" : colors.card, borderColor: isPaused ? colors.border : undefined }}>
          {isPaused ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={s.pauseIcon}><Ionicons name="pause" size={20} color={colors.textMuted} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "800", color: colors.text }}>Kitob to'xtatilgan</Text>
                <Text style={[s.smallMuted, { marginTop: 2 }]}>Davom etganda reja uzaytiriladi</Text>
              </View>
              <Btn label="Davom etish" onPress={toggleStatus} loading={statusUpdating} style={{ paddingHorizontal: 16 }} />
            </View>
          ) : (
            <Pressable onPress={toggleStatus} disabled={statusUpdating} style={[s.targetBtn, { justifyContent: "center" }]}>
              {statusUpdating
                ? <ActivityIndicator size="small" color={colors.textMuted} />
                : <><Ionicons name="pause" size={15} color={colors.textMuted} /><Text style={s.targetBtnText}>To'xtatish</Text></>}
            </Pressable>
          )}
        </Card>
      ) : null}

      {/* Plan */}
      {!plan.isCompleted && !isPaused ? (
        <>
          <Card style={{ marginTop: 14 }}>
            <Text style={s.section}>Reja</Text>
            <View style={s.grid}>
              <Stat value={plan.todayTarget} label="Bugun (bet)" bg={colors.emeraldBg} color={colors.emeraldDark} />
              <Stat value={plan.daysRemaining} label="Qolgan kun" bg={colors.blueBg} color={colors.blue} />
              <Stat value={plan.pagesPerDay} label="Norma/kun" bg="#f1f5f9" color={colors.text} />
              <Stat value={plan.pagesLeft} label="Qolgan bet" bg="#f1f5f9" color={colors.text} />
            </View>
            <View style={[s.trackBox, { backgroundColor: plan.onTrack ? colors.emeraldBg : "#fff7ed" }]}>
              <Ionicons name={plan.onTrack ? "trending-up" : "trending-down"} size={16} color={plan.onTrack ? colors.emerald : colors.orange} />
              <Text style={[s.trackText, { color: plan.onTrack ? colors.emeraldDark : "#c2410c" }]}>
                {plan.onTrack ? "Rejaga muvofiq ketyapsiz 👍" : `Rejadan ${plan.behindPages} bet orqadasiz`}
              </Text>
            </View>
            <Text style={[s.smallMuted, { marginTop: 10 }]}>
              Boshlangan: {formatDate(book.startDate)}{book.targetDate ? ` · Reja: ${formatDate(book.targetDate)}` : ""}
            </Text>
          </Card>

          {/* Log */}
          <Card style={{ marginTop: 14 }}>
            <Text style={s.section}>O'qishni belgilash</Text>
            <Text style={[s.muted, { marginBottom: 8 }]}>Hozir qaysi betgacha o'qidingiz?</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput
                value={toPage}
                onChangeText={setToPage}
                keyboardType="number-pad"
                placeholder={`${book.currentPage + 1}–${book.totalPages}`}
                placeholderTextColor={colors.textLight}
                style={s.input}
              />
              <Btn label="Belgilash" onPress={logRead} loading={saving} style={{ paddingHorizontal: 20 }} />
            </View>
            <Pressable
              onPress={() => setToPage(String(Math.min(book.totalPages, book.currentPage + plan.todayTarget)))}
              style={s.targetBtn}
            >
              <Ionicons name="flag" size={14} color={colors.emeraldDark} />
              <Text style={s.targetBtnText}>Bugungi norma (+{plan.todayTarget} bet)</Text>
            </Pressable>
          </Card>
        </>
      ) : (
        <Card style={{ marginTop: 14, backgroundColor: colors.blueBg, borderColor: "#bfdbfe", flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={s.doneIcon}><Ionicons name="checkmark" size={22} color="#fff" /></View>
          <View>
            <Text style={{ fontWeight: "800", color: colors.blue }}>Kitob o'qib tugatildi! 🎉</Text>
            {book.completedAt ? <Text style={[s.smallMuted, { marginTop: 2 }]}>{formatDate(book.completedAt)}</Text> : null}
          </View>
        </Card>
      )}

      {/* History */}
      <Card style={{ marginTop: 14 }}>
        <Text style={s.section}>O'qish tarixi ({logs.length})</Text>
        {logs.length > 0 ? logs.map((log) => (
          <View key={log.id} style={s.logRow}>
            <View style={s.logIcon}><Text>📖</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.body}>{log.fromPage}–{log.toPage} bet o'qildi</Text>
              <Text style={s.smallMuted}>{formatRelativeTime(log.date)}</Text>
            </View>
            <Text style={{ fontWeight: "800", color: colors.emerald }}>+{log.pagesRead}</Text>
          </View>
        )) : (
          <Text style={[s.muted, { textAlign: "center", paddingVertical: 16 }]}>Hali tarix yo'q. Birinchi betlarni belgilang!</Text>
        )}
      </Card>

      <Btn label="Kitobni o'chirish" variant="danger" onPress={remove} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

function Stat({ value, label, bg, color }: { value: number; label: string; bg: string; color: string }) {
  return (
    <View style={[s.statBox, { backgroundColor: bg }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  cover: { width: 84, height: 120, borderRadius: 12, backgroundColor: colors.blueBg, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  coverImg: { width: "100%", height: "100%" },
  title: { fontSize: 18, fontWeight: "800", color: colors.text, flex: 1 },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  smallMuted: { color: colors.textMuted, fontSize: 11 },
  body: { fontSize: 14, color: colors.text, fontWeight: "500" },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  section: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statBox: { width: "48%", borderRadius: radius.md, paddingVertical: 12, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "900" },
  statLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  trackBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: radius.md, marginTop: 12 },
  trackText: { fontSize: 13, fontWeight: "600", flex: 1 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, fontSize: 16, color: colors.text, backgroundColor: colors.card, height: 44 },
  targetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 10, borderWidth: 1, borderColor: colors.emeraldBorder, borderRadius: radius.md, paddingVertical: 10, backgroundColor: colors.emeraldBg },
  targetBtnText: { color: colors.emeraldDark, fontWeight: "700", fontSize: 12 },
  doneIcon: { height: 44, width: 44, borderRadius: radius.md, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center" },
  pauseIcon: { height: 40, width: 40, borderRadius: radius.md, backgroundColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  logRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  logIcon: { height: 34, width: 34, borderRadius: 8, backgroundColor: colors.emeraldBg, alignItems: "center", justifyContent: "center" },
});
