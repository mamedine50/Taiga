import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { markStatus, useMission } from "../data";
import type { ShipmentStatus } from "../data";
import { colors, radius, statusColor, statusLabelFr } from "../theme";

const STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: "ramassage", label: "Ramassage effectué" },
  { status: "en_transit", label: "En transit" },
  { status: "livre", label: "Livré" },
];

export function MissionDetailScreen({ id, onBack }: { id: string; onBack: () => void }) {
  const { mission, loading, reload } = useMission(id);
  const [busy, setBusy] = useState(false);

  const advance = async (status: ShipmentStatus) => {
    if (!mission) return;
    setBusy(true);
    // Toute écriture passe par l'outbox (repository) — jamais Supabase direct.
    for (const s of mission.shipments) {
      await markStatus({ missionId: mission.id, shipmentId: s.id, status });
    }
    await reload();
    setBusy(false);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.back}>
        <Text style={styles.backText}>← Mes missions</Text>
      </Pressable>

      {loading || !mission ? (
        <ActivityIndicator color={colors.action} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.title}>
              {mission.shipments.length > 1
                ? `Départ groupé · ${mission.shipments.length} exp.`
                : (mission.shipments[0]?.ref ?? "Mission")}
            </Text>
            <Text style={[styles.status, { color: statusColor(mission.status) }]}>
              {statusLabelFr[mission.status] ?? mission.status}
            </Text>
          </View>

          {mission.shipments.map((s) => (
            <View key={s.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.ref}>{s.ref}</Text>
                <Text style={[styles.status, { color: statusColor(s.status) }]}>
                  {statusLabelFr[s.status] ?? s.status}
                </Text>
              </View>
              <Text style={styles.line}>Ramassage : {s.originAddress}, {s.originCity}</Text>
              <Text style={styles.line}>Livraison : {s.destAddress}, {s.destCity}</Text>
            </View>
          ))}

          <View style={styles.actions}>
            {STEPS.map((step) => (
              <Pressable
                key={step.status}
                onPress={() => advance(step.status)}
                disabled={busy}
                style={[styles.actionBtn, busy && { opacity: 0.6 }]}
              >
                <Text style={styles.actionText}>{step.label}</Text>
              </Pressable>
            ))}
            {busy && <ActivityIndicator color={colors.action} style={{ marginTop: 8 }} />}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 60 },
  back: { paddingHorizontal: 16, paddingBottom: 8 },
  backText: { color: colors.muted, fontSize: 14 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", flexShrink: 1 },
  status: { fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 16,
    gap: 4,
  },
  ref: { color: colors.action, fontSize: 15, fontWeight: "600" },
  line: { color: colors.muted, fontSize: 13, marginTop: 2 },
  actions: { gap: 10, marginTop: 8 },
  actionBtn: {
    backgroundColor: colors.action,
    borderRadius: radius.btn,
    paddingVertical: 14,
    alignItems: "center",
  },
  actionText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
});
