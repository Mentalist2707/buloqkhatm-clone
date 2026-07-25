import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { api, Book } from "@/lib/api";
import { computeBookPlan } from "@/lib/plan";
import { colors, radius, gradients } from "@/lib/theme";
import { Card, Progress, Pill, Loading, ErrorView } from "@/components/ui";

type Filter = "ALL" | "READING" | "COMPLETED" | "PAUSED";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  READING:   { label: "O'qilmoqda",  color: colors.emeraldDark, bg: colors.emeraldBg },
  COMPLETED: { label: "Yakunlangan", color: colors.blue,        bg: colors.blueBg },
  PAUSED:    { label: "To'xtatilgan",color: colors.textMuted,   bg: "#f1f5f9" },
};

export default function BooksScreen() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setErr(null);
      const bs = await api.get<Book[]>("/api/books");
      setBooks(bs ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await load(); setRefreshing(false);
  }, [load]);

  if (loading && !refreshing) return <SafeAreaView style={s.flex}><Loading /></SafeAreaView>;
  if (err) return <SafeAreaView style={s.flex}><ErrorView message={err} onRetry={onRefresh} /></SafeAreaView>;

  const filtered = books.filter((b) => filter === "ALL" || b.status === filter);
  const reading = books.filter((b) => b.status === "READING").length;
  const completed = books.filter((b) => b.status === "COMPLETED").length;

  return (
    <SafeAreaView style={s.flex} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
      >
        <View style={s.headRow}>
          <View>
            <Text style={s.h1}>Kitoblar</Text>
            <Text style={s.muted}>{books.length} ta • {reading} o'qilmoqda{completed ? ` • ${completed} yakunlangan` : ""}</Text>
          </View>
          <Pressable onPress={() => router.push("/book/create")} style={s.addBtn}>
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }} contentContainerStyle={{ gap: 8 }}>
          {([["ALL", `Barchasi (${books.length})`], ["READING", `O'qilmoqda (${reading})`], ["COMPLETED", `Yakunlangan (${completed})`], ["PAUSED", "To'xtatilgan"]] as [Filter, string][]).map(([f, label]) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[s.chip, filter === f && s.chipActive]}>
              <Text style={[s.chipText, filter === f && s.chipTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ marginTop: 14, gap: 12 }}>
          {filtered.length > 0 ? filtered.map((book) => {
            const plan = computeBookPlan(book);
            const st = STATUS[book.status] ?? STATUS.READING;
            return (
              <Pressable key={book.id} onPress={() => router.push(`/book/${book.id}`)}>
                <Card style={{ flexDirection: "row", gap: 12, padding: 12 }}>
                  <View style={s.cover}>
                    {book.coverUrl
                      ? <Image source={{ uri: book.coverUrl }} style={s.coverImg} contentFit="cover" />
                      : <Ionicons name="book" size={26} color={colors.blue} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={s.rowBetween}>
                      <Text style={s.bookTitle} numberOfLines={2}>{book.title}</Text>
                      <Pill text={st.label} color={st.color} bg={st.bg} />
                    </View>
                    {book.author ? <Text style={s.muted} numberOfLines={1}>{book.author}</Text> : null}
                    <View style={{ marginTop: 10 }}>
                      <Progress value={plan.percent} colorsArr={plan.isCompleted ? gradients.blue : gradients.emeraldBright} />
                      <View style={[s.rowBetween, { marginTop: 4 }]}>
                        <Text style={s.smallMuted}>{plan.currentPage}/{plan.totalPages} bet</Text>
                        <Text style={[s.small, { fontWeight: "700", color: colors.emerald }]}>{plan.percent}%</Text>
                      </View>
                      {!plan.isCompleted ? (
                        <Text style={[s.smallMuted, { marginTop: 4 }]}>
                          🎯 {plan.todayTarget} bet/kun · ⏳ {plan.daysRemaining} kun qoldi
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          }) : (
            <Card style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text style={{ fontSize: 34 }}>📚</Text>
              <Text style={[s.muted, { marginTop: 8 }]}>Kitob yo'q</Text>
              <Pressable onPress={() => router.push("/book/create")} style={s.smallBtn}>
                <Text style={s.smallBtnText}>+ Kitob qo'shish</Text>
              </Pressable>
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
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  h1: { fontSize: 24, fontWeight: "800", color: colors.text },
  muted: { color: colors.textMuted, fontSize: 13 },
  smallMuted: { color: colors.textMuted, fontSize: 11 },
  small: { fontSize: 11 },
  addBtn: { height: 40, width: 40, borderRadius: radius.md, backgroundColor: colors.emerald, alignItems: "center", justifyContent: "center" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  chipTextActive: { color: "#fff" },
  cover: { width: 60, height: 84, borderRadius: 8, backgroundColor: colors.blueBg, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  coverImg: { width: "100%", height: "100%" },
  bookTitle: { fontSize: 14, fontWeight: "700", color: colors.text, flex: 1, marginRight: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  smallBtn: { marginTop: 10, backgroundColor: colors.emerald, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
