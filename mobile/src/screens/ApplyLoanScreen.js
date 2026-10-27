import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { Screen } from "../components/layout";
import { Button, Field, Notice } from "../components/ui";
import { colors, fonts } from "../theme";

export default function ApplyLoanScreen({ navigation }) {
  const { session, refreshProfile } = useAuth();
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const parsedAmount = Number(amount);
    const parsedMonths = Number(months);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a loan amount greater than zero.");
      return;
    }
    if (!Number.isInteger(parsedMonths) || parsedMonths <= 0) {
      setError("Enter the repayment period in whole months.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api.post(
        "/loans",
        {
          user_id: session.userId,
          amount: parsedAmount,
          repayment_period: parsedMonths,
        },
        session.token
      );
      await refreshProfile();
      navigation.goBack();
    } catch (err) {
      setError(err.message || "Could not submit the application.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen keyboard title="Apply for a loan" onBack={() => navigation.goBack()}>
        <Text style={styles.title}>New request</Text>
        <Text style={styles.subtitle}>
          Staff review it before any money is released.
        </Text>
        <Notice message={error} />
        <Field
          label="Amount (Frw)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="50000"
          style={styles.field}
        />
        <Field
          label="Repayment period (months)"
          value={months}
          onChangeText={setMonths}
          keyboardType="number-pad"
          placeholder="12"
          style={styles.field}
        />
        <Button label="Submit application" onPress={submit} loading={loading} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
    paddingHorizontal: 24,
  },
  back: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
    marginBottom: 24,
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
    marginBottom: 18,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.mute,
  },
  field: {
    marginBottom: 14,
  },
});
