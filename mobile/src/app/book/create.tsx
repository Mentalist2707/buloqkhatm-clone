import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { api, Book } from "@/lib/api";
import { colors, radius } from "@/lib/theme";
import { Card, Btn } from "@/components/ui";

export default function CreateBookScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [targetDays, setTargetDays] = useState("");
  const [saving, setSaving] = useState(false);

  const pages = parseInt(totalPages) || 0;
  const days = parseInt(targetDays) || 0;
  const perDay = pages > 0 && days > 0 ? Math.ceil(pages / days) : 0;

  const submit = async () => {
    if (!title.trim()) { Alert.alert("Xato", "Kitob nomini kiriting"); return; }
    if (pages < 1 || days < 1) { Alert.alert("Xato", "Betlar va kunlar sonini to'g'ri kiriting"); return; }
    setSaving(true);
    try {
      const book = await api.post<Book>("/api/books", {
        title: title.trim(),
        author: author.trim() || null,
        description: description.trim() || null,
        coverUrl: coverUrl.trim() || null,
        totalPages: pages,
        targetDays: days,
      });
      router.replace(`/book/${book.id}`);
    } catch (e: any) {
      Alert.alert("Xato", e?.message ?? "Xatolik");
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.flex} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Card>
          <Field label="Kitob nomi *" value={title} onChangeText={setTitle} placeholder="Masalan: Ihyou Ulumiddin" />
          <Field label="Muallif / Egasi" value={author} onChangeText={setAuthor} placeholder="Masalan: Imom G'azzoliy" />
          <Field label="Muqova rasmi (URL)" value={coverUrl} onChangeText={setCoverUrl} placeholder="https://..." autoCapitalize="none" />
          <Field label="Izoh" value={description} onChangeText={setDescription} placeholder="Qisqacha..." multiline />

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Field label="Betlar soni *" value={totalPages} onChangeText={setTotalPages} placeholder="320" keyboardType="number-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Necha kunda *" value={targetDays} onChangeText={setTargetDays} placeholder="30" keyboardType="number-pad" />
            </View>
          </View>
        </Card>

        {perDay > 0 ? (
          <Card style={{ marginTop: 14, backgroundColor: colors.emeraldBg, borderColor: colors.emeraldBorder, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={s.planIcon}><Ionicons name="flag" size={20} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.planTitle}>Kuniga {perDay} bet o'qishingiz kerak</Text>
              <Text style={s.planSub}>{pages} bet ÷ {days} kun</Text>
            </View>
          </Card>
        ) : null}

        <Btn label="Kitobni saqlash" onPress={submit} loading={saving} style={{ marginTop: 18 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.textLight}
        style={[s.input, props.multiline && { height: 72, textAlignVertical: "top" }]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: "row", gap: 12 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text, backgroundColor: colors.card,
  },
  planIcon: { height: 40, width: 40, borderRadius: radius.md, backgroundColor: colors.emerald, alignItems: "center", justifyContent: "center" },
  planTitle: { fontSize: 14, fontWeight: "800", color: colors.emeraldDark },
  planSub: { fontSize: 12, color: colors.emeraldDark, marginTop: 2, opacity: 0.8 },
});
