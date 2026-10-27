import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../AuthContext";
import { Screen } from "../components/layout";
import { Button, EmptyState, ListRow } from "../components/ui";
import { formatDate, formatMoney } from "../format";
import { colors, fonts } from "../theme";

export default function HomeScreen({ navigation }) {
  const { profile, profileLoading, profileError, refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

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

  const summary = profile?.summary || {};
  const firstName = profile?.name?.split(" ")[0] || "Member";
  const recent = profile?.recent_transactions || [];
  const accounts = profile?.accounts || [];

  return (
    <Screen
      tabPad
      brand={
        <View style={styles.brandRow}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.brandName}>CEPEDHU</Text>
            <Text style={styles.brandTag}>Indatirwabahizi</Text>
          </View>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
      }
    >
      <Text style={styles.hello}>Hello, {firstName}</Text>
      <Text style={styles.subtitle}>Your savings and loans.</Text>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Available balance</Text>
        <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
          {profile ? formatMoney(summary.total_balance) : "—"}
        </Text>
        <View style={styles.metrics}>
          <Metric label="Shares" value={profile ? formatMoney(summary.total_shares) : "—"} />
          <Metric label="Monthly" value={profile ? formatMoney(summary.monthly_saving) : "—"} />
          <Metric label="Loans" value={profile ? String(summary.active_loans || 0) : "—"} />
        </View>
      </View>

      {profileLoading && !profile ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 28 }} />
      ) : null}

      {profileError && !profile ? (
        <View style={{ marginTop: 20 }}>
          <EmptyState title="Account unavailable" body={profileError} />
          <View style={{ height: 12 }} />
          <Button label="Try again" onPress={refreshProfile} />
        </View>
      ) : null}

      <Text style={styles.section}>Accounts</Text>
      {accounts.length === 0 ? (
        <EmptyState title="No account yet" body="Your savings account will show here." />
      ) : (
        accounts.map((account) => (
          <ListRow
            key={account.account_id}
            icon="card-outline"
            title={`Account ${account.accountnumber}`}
            meta="Savings"
            value={formatMoney(account.balance)}
          />
        ))
      )}

      <View style={styles.sectionRow}>
        <Text style={styles.section}>Recent</Text>
        <Pressable onPress={() => navigation.navigate("Activity")}>
          <Text style={styles.link}>See all</Text>
        </Pressable>
      </View>

      {recent.length === 0 ? (
        <EmptyState title="No movements yet" body="Deposits and withdrawals will show here." />
      ) : (
        recent.slice(0, 5).map((tx) => (
          <ListRow
            key={tx.transaction_id}
            icon={tx.transaction_type === "withdrawal" ? "arrow-up-outline" : "arrow-down-outline"}
            title={tx.description || "Account movement"}
            meta={formatDate(tx.transaction_date)}
            value={formatMoney(tx.amount)}
            status={tx.transaction_type}
            onPress={() => navigation.navigate("Activity")}
          />
        ))
      )}

      <View style={{ height: 18 }} />
      <Button label="Apply for a loan" onPress={() => navigation.navigate("ApplyLoan")} />
    </Screen>
  );
}

function Metric({ label, value }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 4,
  },
  logo: {
    width: 42,
    height: 48,
  },
  brandName: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.white,
  },
  brandTag: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  hello: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.ink,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.mute,
  },
  summary: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 18,
    padding: 16,
  },
  summaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.primary,
  },
  summaryValue: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.ink,
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  metric: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 96,
  },
  metricLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mute,
  },
  metricValue: {
    marginTop: 2,
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  link: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.primary,
    marginBottom: 10,
  },
});
