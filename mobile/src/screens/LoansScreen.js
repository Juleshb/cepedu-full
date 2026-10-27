import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../AuthContext";
import { Screen } from "../components/layout";
import { Button, EmptyState, Pill } from "../components/ui";
import { formatMoney } from "../format";
import { colors, fonts } from "../theme";

export default function LoansScreen({ navigation }) {
  const { profile, profileLoading, profileError, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const loans = profile?.loans || [];

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  return (
    <Screen
      tabPad
      title="Loans"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
      }
    >

      <Button label="Apply for a loan" onPress={() => navigation.navigate("ApplyLoan")} />

      {profileLoading && !profile ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 28 }} />
      ) : null}

      {profileError && !profile ? (
        <View style={{ marginTop: 16 }}>
          <EmptyState title="Could not load loans" body={profileError} />
        </View>
      ) : null}

      {!profileLoading && loans.length === 0 ? (
        <View style={{ marginTop: 16 }}>
          <EmptyState
            title="No loans yet"
            body="When you apply, the request stays here until CEPEDHU approves or declines it."
          />
        </View>
      ) : null}

      <View style={{ height: 8 }} />
      {loans.map((loan) => {
        const repayments = loan.repayments || [];
        const pending = repayments.filter((item) => item.status === "pending").length;
        return (
          <Pressable
            key={loan.loan_id}
            onPress={() => navigation.navigate("LoanDetail", { loanId: loan.loan_id })}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
                {formatMoney(loan.amount)}
              </Text>
              <Pill status={loan.status} />
            </View>
            <Text style={styles.meta}>
              {loan.repayment_period} months
              {repayments.length
                ? ` · ${pending} pending of ${repayments.length} repayments`
                : " · Schedule not posted yet"}
            </Text>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.primary,
  },
  title: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.ink,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.mute,
  },
  card: {
    marginTop: 12,
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 16,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  amount: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.ink,
  },
  meta: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.mute,
  },
});
