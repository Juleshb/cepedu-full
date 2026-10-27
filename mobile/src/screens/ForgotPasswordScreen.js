import { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { Screen } from "../components/layout";
import { Button, Field, Notice, PasswordField } from "../components/ui";
import { colors, fonts } from "../theme";

export default function ForgotPasswordScreen({ navigation }) {
  const { announce } = useAuth();
  const [step, setStep] = useState(1);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const data = await api.post("/users/forgot-password", {
        emailOrPhone: emailOrPhone.trim(),
      });
      setInfo(data?.message || "If an account exists, a code was sent.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Could not send a code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
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
      await api.post("/users/confirm-reset-password", {
        emailOrPhone: emailOrPhone.trim(),
        otp: otp.trim(),
        newPassword,
      });
      announce("Password saved. Sign in again.");
      navigation.navigate("Login");
    } catch (err) {
      setError(err.message || "Could not reset the password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      keyboard
      title={step === 1 ? "Reset password" : "New password"}
      onBack={() => navigation.goBack()}
    >
        <Text style={styles.subtitle}>
          {step === 1 ? "We'll email a code." : "Enter the code."}
        </Text>

        <Notice message={info} tone="success" />
        <Notice message={error} />

        {step === 1 ? (
          <>
            <Field
              label="Email or phone"
              value={emailOrPhone}
              onChangeText={setEmailOrPhone}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="name@example.com or phone"
              style={styles.field}
            />
            <Button
              label="Send code"
              onPress={requestCode}
              loading={loading}
              disabled={!emailOrPhone.trim()}
            />
          </>
        ) : (
          <>
            <Field
              label="One-time code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              placeholder="6-digit code"
              style={styles.field}
            />
            <PasswordField
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
            />
            <ViewSpacer />
            <PasswordField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat the new password"
            />
            <ViewSpacer />
            <Button label="Save password" onPress={resetPassword} loading={loading} />
          </>
        )}
    </Screen>
  );
}

function ViewSpacer() {
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
  field: {
    marginBottom: 16,
  },
});
