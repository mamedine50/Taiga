import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";

/**
 * COQUILLE — Phase 0.
 * Aucun écran métier ici tant que le portail web n'est pas fonctionnel
 * (comptes, cotation, paiement, dispatch). Cette vue confirme seulement
 * que l'app compile et démarre dans le monorepo.
 */
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Taïga</Text>
      <Text style={styles.subtitle}>Application chauffeur</Text>
      <Text style={styles.note}>Coquille — Phase 0</Text>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1a14",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    color: "#f2f7f4",
    fontSize: 48,
    fontWeight: "700",
  },
  subtitle: {
    color: "#f2f7f4",
    fontSize: 18,
  },
  note: {
    color: "#9db3a8",
    fontSize: 14,
    marginTop: 8,
  },
});
