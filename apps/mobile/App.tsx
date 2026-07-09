import { type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { startOutboxProcessor, useSession } from "./src/data";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MissionsScreen } from "./src/screens/MissionsScreen";
import { MissionDetailScreen } from "./src/screens/MissionDetailScreen";
import { PodScreen } from "./src/screens/PodScreen";
import { colors } from "./src/theme";

type Nav =
  | { screen: "missions" }
  | { screen: "detail"; missionId: string }
  | { screen: "pod"; missionId: string; shipmentId: string; shipmentRef: string };

export default function App() {
  const { session, loading } = useSession();
  const [nav, setNav] = useState<Nav>({ screen: "missions" });

  // Jalon 2 : démarre le drainage de l'outbox (réseau / 1er plan / démarrage).
  useEffect(() => {
    startOutboxProcessor();
  }, []);

  let content: ReactNode;
  if (loading) {
    content = (
      <View style={styles.splash}>
        <Text style={styles.brand}>Taïga</Text>
        <ActivityIndicator color={colors.action} style={{ marginTop: 16 }} />
      </View>
    );
  } else if (!session) {
    content = <LoginScreen />;
  } else if (nav.screen === "pod") {
    content = (
      <PodScreen
        missionId={nav.missionId}
        shipmentId={nav.shipmentId}
        shipmentRef={nav.shipmentRef}
        onDone={() => setNav({ screen: "detail", missionId: nav.missionId })}
        onCancel={() => setNav({ screen: "detail", missionId: nav.missionId })}
      />
    );
  } else if (nav.screen === "detail") {
    content = (
      <MissionDetailScreen
        id={nav.missionId}
        onBack={() => setNav({ screen: "missions" })}
        onOpenPod={(shipmentId, shipmentRef) =>
          setNav({ screen: "pod", missionId: nav.missionId, shipmentId, shipmentRef })
        }
      />
    );
  } else {
    content = (
      <MissionsScreen onSelect={(missionId) => setNav({ screen: "detail", missionId })} />
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {content}
    </>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  brand: { color: colors.text, fontSize: 44, fontWeight: "800" },
});
