import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import SignatureScreen, { type SignatureViewRef } from "react-native-signature-canvas";
import { submitPod } from "../data";
import type { PodInput } from "../data";
import { colors, radius } from "../theme";

const MAX_PHOTOS = 5;

export function PodScreen({
  missionId,
  shipmentId,
  shipmentRef,
  onDone,
  onCancel,
}: {
  missionId: string;
  shipmentId: string;
  shipmentRef: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [photos, setPhotos] = useState<string[]>([]);
  const [damages, setDamages] = useState(false);
  const [note, setNote] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [signee, setSignee] = useState("");
  const [busy, setBusy] = useState(false);
  const sigRef = useRef<SignatureViewRef>(null);

  // --- Étape 1 : photos ---
  const takePhoto = async () => {
    if (photos.length >= MAX_PHOTOS) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert("Caméra refusée", "Autorisez l'appareil photo pour la preuve.");
    const res = await ImagePicker.launchCameraAsync({ quality: 0.5 });
    if (!res.canceled && res.assets[0]) setPhotos((p) => [...p, res.assets[0]!.uri]);
  };
  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Galerie refusée", "Autorisez l'accès aux photos.");
    const res = await ImagePicker.launchImageLibraryAsync({
      quality: 0.5,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (!res.canceled) setPhotos((p) => [...p, ...res.assets.map((a) => a.uri)].slice(0, MAX_PHOTOS));
  };

  // --- Étape 2 : signature ---
  const onSignatureOK = (sig: string) => {
    setSignature(sig);
    setStep(3);
  };
  const goSignatureNext = () => {
    if (!signee.trim()) return Alert.alert("Nom requis", "Entrez le nom du réceptionnaire.");
    sigRef.current?.readSignature(); // déclenche onOK si non vide
  };

  // --- Étape 3 : confirmer (métadonnées AU MOMENT de la saisie) ---
  const confirm = async () => {
    setBusy(true);
    const capturedAt = new Date().toISOString();
    let lat: number | undefined;
    let lng: number | undefined;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.granted) {
        const pos = await Location.getCurrentPositionAsync({});
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }
    } catch {
      // géoloc indisponible : on garde le POD sans coordonnées
    }
    const input: PodInput = {
      missionId,
      shipmentId,
      photoUris: photos,
      signatureBase64: signature,
      signeeName: signee.trim(),
      damages,
      notes: note.trim() || undefined,
      lat,
      lng,
      capturedAt,
    };
    try {
      await submitPod(input);
      onDone();
    } catch {
      setBusy(false);
      Alert.alert("Erreur", "La preuve n'a pas pu être enregistrée. Réessayez.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Pressable onPress={onCancel} hitSlop={10}>
          <Text style={styles.cancel}>Annuler</Text>
        </Pressable>
        <Text style={styles.stepLabel}>Étape {step}/3</Text>
      </View>
      <Text style={styles.title}>Preuve de livraison · {shipmentRef}</Text>

      {step === 1 && (
        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.section}>Photos ({photos.length}/{MAX_PHOTOS})</Text>
          <View style={styles.thumbs}>
            {photos.map((uri, i) => (
              <Pressable key={uri} onLongPress={() => setPhotos((p) => p.filter((_, j) => j !== i))}>
                <Image source={{ uri }} style={styles.thumb} />
              </Pressable>
            ))}
          </View>
          {photos.length > 0 && <Text style={styles.hint}>Appui long sur une photo pour la retirer.</Text>}
          <View style={styles.rowButtons}>
            <BigButton label="📷 Prendre" onPress={takePhoto} disabled={photos.length >= MAX_PHOTOS} />
            <BigButton label="🖼 Galerie" onPress={pickPhotos} variant="ghost" disabled={photos.length >= MAX_PHOTOS} />
          </View>

          <View style={styles.damageRow}>
            <Text style={styles.section}>Dommages constatés</Text>
            <Switch value={damages} onValueChange={setDamages} trackColor={{ true: colors.error }} />
          </View>
          {damages && (
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Décrivez les dommages…"
              placeholderTextColor={colors.tertiary}
              multiline
              style={styles.noteInput}
            />
          )}

          <BigButton
            label="Continuer"
            onPress={() => (photos.length === 0 ? Alert.alert("Photo requise", "Ajoutez au moins une photo.") : setStep(2))}
          />
        </ScrollView>
      )}

      {step === 2 && (
        <View style={styles.body}>
          <Text style={styles.section}>Signature du réceptionnaire</Text>
          <View style={styles.sigBox}>
            <SignatureScreen
              ref={sigRef}
              onOK={onSignatureOK}
              onEmpty={() => Alert.alert("Signature requise", "Faites signer le réceptionnaire.")}
              webStyle={sigWebStyle}
              autoClear={false}
              backgroundColor={SIG_BG}
              penColor={SIG_INK}
            />
          </View>
          <BigButton label="↺ Recommencer" onPress={() => sigRef.current?.clearSignature()} variant="ghost" />
          <Text style={[styles.section, { marginTop: 12 }]}>Nom du réceptionnaire</Text>
          <TextInput
            value={signee}
            onChangeText={setSignee}
            placeholder="Nom et prénom"
            placeholderTextColor={colors.tertiary}
            style={styles.input}
          />
          <BigButton label="Continuer" onPress={goSignatureNext} />
        </View>
      )}

      {step === 3 && (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.card}>
            <Text style={styles.summ}>📷 {photos.length} photo(s)</Text>
            <Text style={styles.summ}>✍️ Signature de {signee}</Text>
            <Text style={styles.summ}>{damages ? "⚠️ Dommages constatés" : "✓ Aucun dommage"}</Text>
            <Text style={styles.summHint}>
              L'heure et le lieu de la livraison sont enregistrés maintenant.
            </Text>
          </View>
          <BigButton
            label={busy ? "" : "✓ Confirmer la livraison"}
            onPress={confirm}
            disabled={busy}
            loading={busy}
          />
          <Pressable onPress={() => setStep(2)} disabled={busy} style={{ marginTop: 12 }}>
            <Text style={styles.cancel}>← Retour</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function BigButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "ghost";
  disabled?: boolean;
  loading?: boolean;
}) {
  const ghost = variant === "ghost";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.big,
        ghost ? styles.bigGhost : styles.bigPrimary,
        (disabled || loading) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.bg} />
      ) : (
        <Text style={[styles.bigText, ghost && { color: colors.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

// Canevas de signature : encre foncée sur fond blanc (comme sur papier),
// lisible ici et une fois affichée côté web.
const SIG_BG = "#ffffff";
const SIG_INK = "#0b121e";
const sigWebStyle = `.m-signature-pad{box-shadow:none;border:none;margin:0}
.m-signature-pad--body{border:none}
.m-signature-pad--footer{display:none;margin:0}
body,html{background-color:${SIG_BG};height:100%}`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 60 },
  top: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16 },
  cancel: { color: colors.muted, fontSize: 15 },
  stepLabel: { color: colors.tertiary, fontSize: 13 },
  title: { color: colors.text, fontSize: 20, fontWeight: "800", paddingHorizontal: 16, marginTop: 8 },
  body: { padding: 16, gap: 14 },
  section: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  hint: { color: colors.tertiary, fontSize: 12 },
  thumbs: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  thumb: { width: 84, height: 84, borderRadius: radius.btn, backgroundColor: colors.surface2 },
  rowButtons: { flexDirection: "row", gap: 10 },
  damageRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  noteInput: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.btn,
    color: colors.text,
    padding: 12,
    minHeight: 70,
  },
  input: {
    backgroundColor: colors.surface2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.btn,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 16,
  },
  sigBox: {
    height: 240,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    overflow: "hidden",
    backgroundColor: SIG_BG,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 20,
    gap: 8,
  },
  summ: { color: colors.text, fontSize: 16 },
  summHint: { color: colors.tertiary, fontSize: 13, marginTop: 6 },
  big: { borderRadius: radius.btn, paddingVertical: 18, alignItems: "center", flexGrow: 1 },
  bigPrimary: { backgroundColor: colors.action },
  bigGhost: { borderColor: colors.border, borderWidth: 1 },
  bigText: { color: colors.bg, fontSize: 17, fontWeight: "800" },
});
