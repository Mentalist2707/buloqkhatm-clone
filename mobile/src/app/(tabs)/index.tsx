import { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { api, Book, Khatm } from "@/lib/api";
import { useUser } from "@/lib/user";
import { computeBookPlan } from "@/lib/plan";
import { colors, radius, gradients, shadow, getUserLevel, getNextLevel, getLevelProgress } from "@/lib/theme";
import { Card, Progress, Loading, ErrorView, Bismillah, Ornament } from "@/components/ui";

export default function DashboardScreen() {
  const router = useRouter();
  const { user, error, refresh: refreshUser } = useUser();
  const [books, setBooks] = useState<Book[]>([]);
  const [khatms, setKhatms] = useState<Khatm[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoadErr(null);
      const [bs, ks] = await Promise.all([
        api.get<Book[]>("/api/books?status=READING"),
        api.get<Khatm[]>("/api/khatms?status=ACTIVE"),
      ]);
      setBooks(bs ?? []);
      setKhatms(ks ?? []);
    } catch (e: any) {
      setLoadErr(e?.message ?? "Xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); refreshUser(); }, [load, refreshUser]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshUser()]);
    setRefreshing(false);
  }, [load, refreshUser]);

  if (loading && !refreshing) return <SafeAreaView style={s.flex}><Loading text="Yuklanmoqda..." /></SafeAreaView>;
  if (loadErr && !user && error) return <SafeAreaView style={s.flex}><ErrorView message={loadErr} onRetry={onRefresh} /></SafeAreaView>;

  const coins = user?.coins ?? 0;
  const level = getUserLevel(coins);
  const nextLevel = getNextLevel(coins);
  const lvlProgress = getLevelProgress(coins);
  const name = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Aziz do'st";

  return (
    <SafeAreaView style={s.flex} edges={["top"]}>
      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.emerald} />}
      >
        {/* Hero */}
        <LinearGradient colors={gradients.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.hero, shadow.glow]}>
          <View style={s.heroGlow1} />
          <View style={s.heroGlow2} />
          <View style={{ alignItems: "center", marginBottom: 14 }}>
            <Bismillah color="#e8d9a8" size={17} />
            <Ornament color="#d9be6a" style={{ marginTop: 8, width: 140 }} />
          </View>
          <View style={s.heroTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroHello}>Assalomu alaykum 👋</Text>
              <Text style={s.heroName}>{name}</Text>
            </View>
            <View style={s.levelChip}>
              <Ionicons name="sparkles" size={12} color="#e8d9a8" />
              <Text style={s.levelChipText}>{level.name}</Text>
            </View>
          </View>

          <View style={s.statRow}>
            {[
              { icon: "book", label: "Pora", value: user?.totalJuzRead ?? 0 },
              { icon: "library", label: "Kitob", value: user?.totalBooksRead ?? 0 },
              { icon: "star", label: "Coin", value: coins },
              { icon: "flame", label: "Streak", value: `${user?.streakDays ?? 0}` },
            ].map((st) => (
              <View key={st.label} style={s.statBox}>
                <Ionicons name={st.icon as any} size={15} color="#fff" style={{ opacity: 0.9 }} />
                <Text style={s.statValue}>{st.value}</Text>
                <Text style={s.statLabel}>{st.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ marginTop: 16 }}>
            <View style={s.rowBetween}>
              <Text style={s.heroLevel}>Daraja darajasi</Text>
              {nextLevel ? <Text style={s.heroLevelNext}>{nextLevel.name} · {nextLevel.minPoints - coins} coin</Text> : <Text style={s.heroLevelNext}>MAX 🏆</Text>}
            </View>
            <View style={{ marginTop: 8 }}>
              <Progress value={lvlProgress} colorsArr={gradients.gold} track="rgba(255,255,255,0.20)" height={9} />
            </View>
          </View>
        </LinearGradient>

        {/* Quick actions */}
        <View style={s.quickRow}>
          <QuickAction grad={gradients.emerald} icon="add" label="Yangi Kitob" onPress={() => router.push("/book/create")} />
          <QuickAction grad={gradients.blue} icon="stats-chart" label="Statistika" onPress={() => router.push("/(tabs)/stats")} />
          <QuickAction grad={gradients.emeraldBright} icon="book" label="Xatmlar" onPress={() => router.push("/(tabs)/khatms")} />
        </View>

        {/* Reading books */}
        <SectionHead title="O'qilayotgan kitoblar" onSeeAll={() => router.push("/(tabs)/books")} />
        {books.length > 0 ? books.map((book) => {
          const plan = computeBookPlan(book);
          return (
            <Pressable key={book.id} onPress={() => router.push(`/book/${book.id}`)}>
              <Card style={{ marginBottom: 12, flexDirection: "row", gap: 14 }}>
                <View style={s.cover}>
                  {book.coverUrl
                    ? <Image source={{ uri: book.coverUrl }} style={s.coverImg} contentFit="cover" />
                    : <Ionicons name="book" size={22} color={colors.blue} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.bookTitle} numberOfLines={1}>{book.title}</Text>
                  {book.author ? <Text style={s.muted} numberOfLines={1}>{book.author}</Text> : null}
                  <View style={{ marginTop: 10 }}>
                    <Progress value={plan.percent} colorsArr={gradients.blue} />
                    <View style={[s.rowBetween, { marginTop: 6 }]}>
                      <Text style={s.smallMuted}>{plan.currentPage}/{plan.totalPages} bet</Text>
                      <View style={[s.miniTag, { backgroundColor: plan.onTrack ? colors.emeraldBg : colors.amberBg }]}>
                        <Ionicons name="flag" size={9} color={plan.onTrack ? colors.emerald : colors.orange} />
                        <Text style={[s.miniTagText, { color: plan.onTrack ? colors.emeraldDark : colors.orange }]}>
                          Bugun {plan.todayTarget} bet
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }) : (
          <EmptyCard icon="library-outline" text="Hozircha kitob rejasi yo'q" cta="Kitob qo'shish" onPress={() => router.push("/book/create")} />
        )}

        {/* Active khatms */}
        <SectionHead title="Faol xatmlar" onSeeAll={() => router.push("/(tabs)/khatms")} />
        {khatms.length > 0 ? khatms.slice(0, 4).map((k) => {
          const done = k.juzList?.filter((j) => j.status === "COMPLETED").length ?? 0;
          const pct = Math.round((done / 30) * 100);
          return (
            <Pressable key={k.id} onPress={() => router.push(`/khatm/${k.id}`)}>
              <Card style={{ marginBottom: 12 }}>
                <Text style={s.bookTitle} numberOfLines={1}>{k.title}</Text>
                <View style={{ marginTop: 10 }}>
                  <Progress value={pct} colorsArr={gradients.emeraldBright} />
                  <View style={[s.rowBetween, { marginTop: 6 }]}>
                    <Text style={s.smallMuted}>{done}/30 pora</Text>
                    <Text style={[s.small, { color: colors.emerald, fontWeight: "800" }]}>{pct}%</Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          );
        }) : (
          <EmptyCard icon="book-outline" text="Faol xatm yo'q" />
        )}
        <View style={{ height: 12 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ grad, icon, label, onPress }:
  { grad: readonly [string, string, ...string[]]; icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.quick, shadow.sm]}>
        <Ionicons name={icon} size={20} color="#fff" />
        <Text style={s.quickLabel}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function SectionHead({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={s.sectionHead}>
      <Text style={s.sectionTitle}>{title}</Text>
      {onSeeAll ? <Pressable onPress={onSeeAll} hitSlop={8}><Text style={s.link}>Barchasi</Text></Pressable> : null}
    </View>
  );
}

function EmptyCard({ icon, text, cta, onPress }: { icon: any; text: string; cta?: string; onPress?: () => void }) {
  return (
    <Card style={{ alignItems: "center", paddingVertical: 28 }}>
      <View style={s.emptyIcon}><Ionicons name={icon} size={26} color={colors.textLight} /></View>
      <Text style={[s.muted, { marginTop: 10 }]}>{text}</Text>
      {cta && onPress ? (
        <Pressable onPress={onPress} style={s.emptyBtn}>
          <Ionicons name="add" size={15} color="#fff" />
          <Text style={s.emptyBtnText}>{cta}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 24 },
  hero: { borderRadius: radius.xxl, padding: 22, overflow: "hidden" },
  heroGlow1: { position: "absolute", top: -40, right: -30, width: 150, height: 150, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.10)" },
  heroGlow2: { position: "absolute", bottom: -50, left: -20, width: 120, height: 120, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.07)" },
  heroTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  heroHello: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  heroName: { color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 3, letterSpacing: -0.4 },
  levelChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(217,190,106,0.20)", borderWidth: 1, borderColor: "rgba(217,190,106,0.5)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  levelChipText: { color: "#e8d9a8", fontSize: 11, fontWeight: "800" },
  statRow: { flexDirection: "row", gap: 8, marginTop: 20 },
  statBox: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: radius.md, paddingVertical: 11, alignItems: "center", gap: 3, borderWidth: 1, borderColor: "rgba(232,217,168,0.14)" },
  statValue: { color: "#fdf6e3", fontSize: 17, fontWeight: "900" },
  statLabel: { color: "rgba(253,246,227,0.7)", fontSize: 10, fontWeight: "600" },
  heroLevel: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "700" },
  heroLevelNext: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "600" },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  quick: { borderRadius: radius.lg, paddingVertical: 16, alignItems: "center", gap: 6 },
  quickLabel: { color: "#fff", fontSize: 12, fontWeight: "800" },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "900", color: colors.text, letterSpacing: -0.3 },
  link: { color: colors.emerald, fontWeight: "800", fontSize: 13 },
  cover: { width: 48, height: 66, borderRadius: 12, backgroundColor: colors.blueBg, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  coverImg: { width: "100%", height: "100%" },
  bookTitle: { fontSize: 15, fontWeight: "800", color: colors.text, letterSpacing: -0.2 },
  muted: { color: colors.textMuted, fontSize: 13 },
  smallMuted: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  small: { fontSize: 11 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  miniTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  miniTagText: { fontSize: 10, fontWeight: "800" },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.borderSoft, alignItems: "center", justifyContent: "center" },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 14, backgroundColor: colors.emerald, paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md },
  emptyBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
