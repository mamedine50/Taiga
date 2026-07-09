import { type ReactNode, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSession } from "./src/data";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MissionsScreen } from "./src/screens/MissionsScreen";
import { MissionDetailScreen } from "./src/screens/MissionDetailScreen";
import { colors } from "./src/theme";

export default function App() {
  const { session, loading } = useSession();
  const [selectedMission, setSelectedMission] = useState<string | null>(null);

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
  } else if (selectedMission) {
    content = (
      <MissionDetailScreen id={selectedMission} onBack={() => setSelectedMission(null)} />
    );
  } else {
    content = <MissionsScreen onSelect={setSelectedMission} />;
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
