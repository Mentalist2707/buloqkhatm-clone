import React from "react";
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator,
  ViewStyle, StyleProp,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, gradients, shadow } from "@/lib/theme";
import { API_BASE_URL } from "@/lib/config";

export function Card({ children, style, tint }:
  { children: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return (
    <View style={[styles.card, tint ? { backgroundColor: tint, borderColor: "transparent" } : null, style]}>
      {children}
    </View>
  );
}

export function Progress({ value, colorsArr, color = colors.emerald, track = "#eef1f4", height = 9 }:
  { value: number; colorsArr?: readonly [string, string, ...string[]]; color?: string; track?: string; height?: number }) {
  const w = `${Math.min(100, Math.max(0, value))}%` as const;
  return (
    <View style={[styles.progressTrack, { backgroundColor: track, height, borderRadius: height }]}>
      {colorsArr ? (
        <LinearGradient colors={colorsArr} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ width: w, height, borderRadius: height }} />
      ) : (
        <View style={{ width: w, backgroundColor: color, height, borderRadius: height }} />
      )}
    </View>
  );
}

export function Btn({ label, onPress, variant = "gradient", disabled, loading, style, icon }:
  { label: string; onPress?: () => void; variant?: "gradient" | "emerald" | "outline" | "danger" | "ghost";
    disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>; icon?: React.ReactNode }) {

  const content = (fg: string) => (
    <>
      {loading ? <ActivityIndicator color={fg} size="small" /> : (
        <>
          {icon}
          <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
        </>
      )}
    </>
  );

  if (variant === "gradient") {
    return (
      <Pressable onPress={onPress} disabled={disabled || loading}
        style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }, style]}>
        <LinearGradient colors={gradients.emerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.btn, shadow.sm]}>
          {content("#fff")}
        </LinearGradient>
      </Pressable>
    );
  }

  const v = {
    emerald: { bg: colors.emerald, fg: "#fff", bd: colors.emerald },
    outline: { bg: colors.white, fg: colors.text, bd: colors.border },
    danger:  { bg: colors.redBg, fg: colors.red, bd: "#fecaca" },
    ghost:   { bg: "transparent", fg: colors.textMuted, bd: "transparent" },
  }[variant];

  return (
    <Pressable onPress={onPress} disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, { backgroundColor: v.bg, borderWidth: 1, borderColor: v.bd, opacity: disabled ? 0.5 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }, style]}>
      {content(v.fg)}
    </Pressable>
  );
}

export function Pill({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{text}</Text>
    </View>
  );
}

export function Loading({ text }: { text?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.emerald} size="large" />
      {text ? <Text style={styles.muted}>{text}</Text> : null}
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 44 }}>📡</Text>
      <Text style={[styles.title, { textAlign: "center", marginTop: 10 }]}>Ulanib bo'lmadi</Text>
      <Text style={[styles.muted, { textAlign: "center", marginTop: 6, paddingHorizontal: 24 }]}>{message}</Text>
      <View style={styles.urlBox}>
        <Text style={styles.urlLabel}>Ulanmoqda:</Text>
        <Text style={styles.urlText} selectable>{API_BASE_URL}</Text>
      </View>
      <Text style={[styles.muted, { textAlign: "center", marginTop: 8, fontSize: 12, paddingHorizontal: 24 }]}>
        Agar manzil localhost yoki 192.168.* bo'lsa — APK eski. Yangi manzil bilan qayta build qiling.
      </Text>
      {onRetry ? <Btn label="Qayta urinish" onPress={onRetry} style={{ marginTop: 18, minWidth: 160 }} /> : null}
    </View>
  );
}

export const T = {
  h1: (props: any) => <Text {...props} style={[styles.h1, props.style]} />,
  h2: (props: any) => <Text {...props} style={[styles.h2, props.style]} />,
  title: (props: any) => <Text {...props} style={[styles.title, props.style]} />,
  body: (props: any) => <Text {...props} style={[styles.body, props.style]} />,
  muted: (props: any) => <Text {...props} style={[styles.muted, props.style]} />,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.sm,
  },
  progressTrack: { width: "100%", overflow: "hidden" },
  btn: {
    height: 50, borderRadius: radius.lg,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 18, flexDirection: "row", gap: 8,
  },
  btnText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.2 },
  pill: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: radius.full, alignSelf: "flex-start" },
  pillText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.bg },
  urlBox: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, backgroundColor: colors.borderSoft, alignItems: "center" },
  urlLabel: { fontSize: 10, color: colors.textLight, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  urlText: { fontSize: 12, color: colors.text, fontWeight: "600", marginTop: 2 },
  h1: { fontSize: 26, fontWeight: "900", color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 19, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  title: { fontSize: 15, fontWeight: "700", color: colors.text },
  body: { fontSize: 14, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
});
