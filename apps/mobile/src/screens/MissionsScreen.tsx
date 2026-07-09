import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { signOut, useMissions } from "../data";
import type { MissionWithShipments } from "../data";
import { colors, radius, statusColor, statusLabelFr } from "../theme";

export function MissionsScreen({ onSelect }: { onSelect: (id: string) => void }) {
  const { missions, loading, refreshing, sync } = useMissions();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes missions</Text>
        <Pressable onPress={() => signOut()} hitSlop={10}>
          <Text style={styles.signout}>Se déconnecter</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.action} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={missions}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={sync} tintColor={colors.action} />
          }
          ListEmptyComponent={<Text style={styles.empty}>Aucune mission pour l'instant.</Text>}
          renderItem={({ item }) => <MissionRow mission={item} onPress={() => onSelect(item.id)} />}
        />
      )}
    </View>
  );
}

function MissionRow({ mission, onPress }: { mission: MissionWithShipments; onPress: () => void }) {
  const grouped = mission.shipments.length > 1;
  const first = mission.shipments[0];
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.rowBetween}>
        {grouped ? (
          <Text style={styles.ref}>Départ groupé · {mission.shipments.length} exp.</Text>
        ) : (
          <Text style={styles.ref}>{first?.ref ?? "—"}</Text>
        )}
        <Text style={[styles.status, { color: statusColor(mission.status) }]}>
          {statusLabelFr[mission.status] ?? mission.status}
        </Text>
      </View>
      {first && (
        <Text style={styles.route}>
          {first.originCity} → {first.destCity}
        </Text>
      )}
      <Text style={styles.payout}>
        {mission.carrierPayout.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  signout: { color: colors.muted, fontSize: 13 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 16,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ref: { color: colors.action, fontSize: 15, fontWeight: "600" },
  status: { fontSize: 12, fontWeight: "700" },
  route: { color: colors.muted, fontSize: 14, marginTop: 4 },
  payout: { color: colors.live, fontSize: 18, fontWeight: "700", marginTop: 8 },
});
