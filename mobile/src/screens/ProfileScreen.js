import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../AuthContext";
import { Screen } from "../components/layout";
import { EmptyState } from "../components/ui";
import { SUPPORT_WHATSAPP } from "../config";
import { formatDate, formatMoney, titleCase } from "../format";
import { colors, fonts } from "../theme";

function initials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "C";
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function membershipStatus(profile) {
  const loans = profile?.loans || [];
  if (loans.some((loan) => loan.status === "approved")) return "approved";
  if (loans.some((loan) => loan.status === "pending")) return "pending";
  return "member";
}

export default function ProfileScreen({ navigation }) {
  const { profile, profileError, refreshProfile, signOut } = useAuth();
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

  const confirmSignOut = () => {
    Alert.alert("Sign out", "Sign out of CEPEDHU on this device?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const summary = profile?.summary || {};
  const accounts = profile?.accounts || [];
  const status = membershipStatus(profile);
  const roleLine = [profile?.position, profile?.place_of_working].filter(Boolean).join(" · ");

  const details = profile
    ? [
        ["Identification", profile.identification_number],
        ["Date of birth", formatDate(profile.date_of_birth)],
        ["Place of birth", profile.place_of_birth],
        ["Residence", profile.residence_place],
        ["Address", profile.address],
        ["Marital status", profile.marital_status ? titleCase(profile.marital_status) : null],
        ["Spouse", profile.spouse_name],
      ].filter(([, value]) => value && value !== "—")
    : [];

  return (
    <Screen
      tabPad
      brand={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials(profile?.name)}</Text>
          </View>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
      }
    >
      <Text style={styles.name}>{profile?.name || "Member"}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.role}>{roleLine || "CEPEDHU member"}</Text>
        <View style={[styles.badge, status !== "member" && status !== "approved" && styles.badgeWait]}>
          <Text style={[styles.badgeText, status === "pending" && styles.badgeWaitText, status === "rejected" && styles.badgeBadText]}>
            {status === "member" ? "Member" : titleCase(status)}
          </Text>
        </View>
      </View>

      {profileError && !profile ? (
        <EmptyState title="Profile unavailable" body={profileError} />
      ) : null}

      {profile?.telephone ? (
        <Pressable style={styles.contact} onPress={() => Linking.openURL(`tel:${profile.telephone}`)}>
          <Ionicons name="call-outline" size={18} color={colors.primary} />
          <Text style={styles.contactText}>{profile.telephone}</Text>
        </Pressable>
      ) : null}
      {profile?.email ? (
        <Pressable style={styles.contact} onPress={() => Linking.openURL(`mailto:${profile.email}`)}>
          <Ionicons name="mail-outline" size={18} color={colors.primary} />
          <Text style={styles.contactText}>{profile.email}</Text>
        </Pressable>
      ) : null}

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Savings</Text>
          <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
            {profile ? formatMoney(summary.total_balance) : "—"}
          </Text>
        </View>
        <View style={styles.summarySplit} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Shares</Text>
          <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
            {profile ? formatMoney(summary.total_shares) : "—"}
          </Text>
          <Text style={styles.summaryHint}>
            {profile ? `${formatMoney(summary.monthly_saving)} / month` : ""}
          </Text>
        </View>
      </View>

      <Text style={styles.section}>Accounts</Text>
      {accounts.length === 0 ? (
        <EmptyState title="No account yet" body="Your savings account will show here." />
      ) : (
        accounts.map((account) => (
          <View key={account.account_id} style={styles.account}>
            <View style={styles.accountIcon}>
              <Ionicons name="card-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountNumber}>{account.accountnumber}</Text>
              <Text style={styles.accountMeta}>Savings account</Text>
            </View>
            <Text style={styles.accountBalance}>{formatMoney(account.balance)}</Text>
          </View>
        ))
      )}

      {details.length ? (
        <>
          <Text style={styles.section}>Details</Text>
          <View style={styles.detailCard}>
            {details.map(([label, value]) => (
              <View key={label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Text style={styles.section}>Actions</Text>
      <Action
        icon="swap-horizontal-outline"
        label="Transactions"
        onPress={() => navigation.navigate("Activity")}
      />
      <Action
        icon="cash-outline"
        label="Loans"
        onPress={() => navigation.navigate("Loans")}
      />
      <Action
        icon="lock-closed-outline"
        label="Change password"
        onPress={() => navigation.navigate("ChangePassword")}
      />
      <Action
        icon="logo-whatsapp"
        label="WhatsApp support"
        onPress={() => Linking.openURL(SUPPORT_WHATSAPP)}
      />
      <Action icon="log-out-outline" label="Sign out" danger onPress={confirmSignOut} />
    </Screen>
  );
}

function Action({ icon, label, onPress, danger = false }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}>
      <View style={[styles.actionIcon, danger && styles.actionIconDanger]}>
        <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.primary} />
      </View>
      <Text style={[styles.actionLabel, danger && { color: colors.danger }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#C5CDD2" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingBottom: 8,
  },
  headerTitle: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.white,
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.35)",
  },
  initials: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.primary,
  },
  name: {
    marginTop: 4,
    textAlign: "center",
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.ink,
  },
  metaRow: {
    marginTop: 8,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  role: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.mute,
  },
  badge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
  },
  badgeWait: {
    backgroundColor: "#FFF4D8",
  },
  badgeWaitText: {
    color: "#8A6414",
  },
  badgeBadText: {
    color: colors.danger,
  },
  contact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.panel,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  contactText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  summary: {
    marginTop: 8,
    flexDirection: "row",
    backgroundColor: colors.primaryMuted,
    borderRadius: 18,
    padding: 16,
  },
  summaryItem: {
    flex: 1,
  },
  summarySplit: {
    width: 1,
    backgroundColor: "#D5E8DC",
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
  },
  summaryValue: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  summaryHint: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mute,
  },
  section: {
    marginTop: 22,
    marginBottom: 10,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  accountIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  accountNumber: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
  },
  accountMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mute,
  },
  accountBalance: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  detailCard: {
    backgroundColor: colors.panel,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  detailRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  detailLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mute,
  },
  detailValue: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIconDanger: {
    backgroundColor: colors.dangerSoft,
  },
  actionLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
  },
});
