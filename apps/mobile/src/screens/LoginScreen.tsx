import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { signInWithPassword } from "../data";
import { colors, radius } from "../theme";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setBusy(true);
    const res = await signInWithPassword(email.trim(), password);
    setBusy(false);
    if (res.error) setError("Courriel ou mot de passe invalide.");
    // succès → useSession bascule l'app automatiquement
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.brand}>Taïga</Text>
        <Text style={styles.subtitle}>Application chauffeur</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Courriel</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="vous@exemple.ca"
            placeholderTextColor={colors.tertiary}
            style={styles.input}
          />
          <Text style={[styles.label, { marginTop: 14 }]}>Mot de passe</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.tertiary}
            style={styles.input}
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={[styles.button, busy && { opacity: 0.6 }]}
          >
            {busy ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, justifyContent: "center", padding: 24 },
  brand: { color: colors.text, fontSize: 44, fontWeight: "800", textAlign: "center" },
  subtitle: { color: colors.muted, fontSize: 16, textAlign: "center", marginTop: 2, marginBottom: 28 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 20,
  },
  label: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.btn,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  error: { color: colors.error, fontSize: 13, marginTop: 12 },
  button: {
    backgroundColor: colors.action,
    borderRadius: radius.btn,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: colors.bg, fontSize: 15, fontWeight: "700" },
});
