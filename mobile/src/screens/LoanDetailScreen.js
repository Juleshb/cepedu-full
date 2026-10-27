import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "../AuthContext";
import { Screen } from "../components/layout";
import { EmptyState, Pill } from "../components/ui";
import { formatDate, formatMoney } from "../format";
import { colors, fonts } from "../theme";

export default function LoanDetailScreen({ navigation, route }) {
  const { profile } = useAuth();
  const loan = (profile?.loans || []).find(
    (item) => item.loan_id === route.params?.loanId
  );

  return (
    <Screen title="Loan details" onBack={() => navigation.goBack()}>

      {!loan ? (
        <EmptyState
          title="Loan not found"
          body="This request is not on your membership. Pull to refresh from the loans list."
        />
      ) : (
        <>
          <Text style={styles.kicker}>Loan {loan.loan_id}</Text>
          <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(loan.amount)}
          </Text>
          <View style={{ marginTop: 10 }}>
            <Pill status={loan.status} />
          </View>
          <Text style={styles.meta}>
            {loan.repayment_period} months · Opened {formatDate(loan.created_at)}
          </Text>

          <Text style={styles.section}>Repayment schedule</Text>
          {(loan.repayments || []).length === 0 ? (
            <EmptyState
              title="No schedule yet"
              body="Repayment dates appear here after CEPEDHU posts them for an approved loan."
            />
          ) : (
            loan.repayments.map((repayment) => (
              <View key={repayment.repayment_id} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{formatMoney(repayment.amount)}</Text>
                  <Text style={styles.rowMeta}>
                    Due {formatDate(repayment.due_date)}
                    {repayment.payment_date
                      ? ` · Paid ${formatDate(repayment.payment_date)}`
                      : ""}
                  </Text>
                </View>
                <Pill status={repayment.status} />
              </View>
            ))
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  back: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.primary,
    marginBottom: 20,
  },
  kicker: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.primary,
  },
  amount: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 34,
    color: colors.ink,
  },
  meta: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.mute,
  },
  section: {
    marginTop: 26,
    marginBottom: 10,
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.mute,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
  },
  rowMeta: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.mute,
  },
});
