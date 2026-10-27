import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { Screen } from "../components/layout";
import { Button, Notice, PasswordField } from "../components/ui";
import { colors, fonts } from "../theme";

export default function ResetPasswordScreen({ navigation, route }) {
  const isForced = route?.params?.forced === true;
  const { session, completePasswordReset } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (newPassword.length < 6) {
      setError("Use at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await api.post(
        "/users/reset-password",
        { currentPassword, newPassword },
        session?.token
      );
      await completePasswordReset();
    } catch (err) {
      setError(err.message || "Could not update the password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      keyboard
      title="New password"
      onBack={isForced ? undefined : () => navigation.goBack()}
    >
        <Text style={styles.subtitle}>
          {isForced ? "Replace the temporary password." : "Sign in again after this."}
        </Text>

        <Notice message={error} />

        <PasswordField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current password"
        />
        <Spacer />
        <PasswordField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="At least 6 characters"
        />
        <Spacer />
        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat the new password"
        />
        <Spacer />
        <Button
          label="Save password"
          onPress={onSubmit}
          loading={loading}
          disabled={!currentPassword || !newPassword || !confirmPassword}
        />
    </Screen>
  );
}

function Spacer() {
  return <Pressable style={{ height: 14 }} disabled />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
    paddingHorizontal: 24,
  },
  back: {
    alignSelf: "flex-start",
    marginBottom: 24,
    paddingVertical: 6,
  },
  backText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
  },
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.primary,
  },
  title: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.ink,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 20,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.mute,
  },
});
