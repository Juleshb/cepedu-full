import { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../AuthContext";
import { Screen } from "../components/layout";
import { Button, Notice } from "../components/ui";
import { colors, fonts } from "../theme";

export default function OtpScreen({ navigation }) {
  const { pendingIdentity, confirmOtp, resendOtp } = useAuth();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  const setDigit = (index, value) => {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    if (clean.length > 1) {
      const next = ["", "", "", "", "", ""];
      clean
        .slice(0, 6)
        .split("")
        .forEach((digit, offset) => {
          next[offset] = digit;
        });
      setDigits(next);
      const focusAt = Math.min(clean.length, 5);
      inputs.current[focusAt]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (index < 5) inputs.current[index + 1]?.focus();
  };

  const onKeyPress = (index, key) => {
    if (key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const onSubmit = async () => {
    const otp = digits.join("");
    if (otp.length !== 6) {
      setError("Enter the code.");
      return;
    }
    setError("");
    setInfo("");
    setLoading(true);
    try {
      await confirmOtp(otp);
    } catch (err) {
      setError(err.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setError("");
    setInfo("");
    setResending(true);
    try {
      await resendOtp();
      setInfo("Code sent.");
    } catch (err) {
      setError(err.message || "Could not resend the code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <Screen keyboard title="Enter code" onBack={() => navigation.goBack()}>
      <Text style={styles.subtitle}>
        {pendingIdentity ? `Sent to ${pendingIdentity}` : "Check your email"}
      </Text>

      <Notice message={info} tone="success" />
      <Notice message={error} />

      <View style={styles.row}>
        {digits.map((digit, index) => (
          <TextInput
            key={index}
            ref={(node) => {
              inputs.current[index] = node;
            }}
            value={digit}
            onChangeText={(value) => setDigit(index, value)}
            onKeyPress={({ nativeEvent }) => onKeyPress(index, nativeEvent.key)}
            keyboardType="number-pad"
            maxLength={index === 0 ? 6 : 1}
            style={styles.box}
            textContentType="oneTimeCode"
            autoFocus={index === 0}
          />
        ))}
      </View>

      <Button label="Continue" onPress={onSubmit} loading={loading} />

      <Pressable onPress={onResend} disabled={resending} style={styles.resend}>
        <Text style={styles.resendText}>
          {resending ? "Sending…" : "Resend code"}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  row: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },
  box: {
    flex: 1,
    minWidth: 0,
    maxWidth: 56,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: 22,
    color: colors.ink,
  },
  resend: {
    marginTop: 18,
    alignItems: "center",
  },
  resendText: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.primary,
  },
});
