import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, ApiError } from "../api";
import { useAuth } from "../AuthContext";
import { Screen } from "../components/layout";
import { Button, EmptyState, ListRow, Notice, Pill } from "../components/ui";
import { formatDate, formatMoney } from "../format";
import { colors, fonts } from "../theme";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposits" },
  { id: "withdrawal", label: "Withdrawals" },
];

export default function TransactionsScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.get("/transactions/user", session?.token);
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await signOut();
        return;
      }
      setError(err.message || "Could not load transactions.");
    }
  }, [session?.token, signOut]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      load().finally(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const visible = items.filter((item) =>
    filter === "all" ? true : item.transaction_type === filter
  );

  const shareReceipt = async (tx) => {
    const reference = tx.transaction_number || tx.transaction_id;
    await Share.share({
      message: [
        "CEPEDHU receipt",
        `Reference: ${reference}`,
        `Type: ${tx.transaction_type}`,
        `Amount: ${formatMoney(tx.amount)}`,
        `Date: ${formatDate(tx.transaction_date)}`,
        `Account: ${tx.accountnumber || tx.account_id || "—"}`,
        tx.description ? `Note: ${tx.description}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  };

  return (
    <View style={styles.screen}>
      <Screen
        tabPad
        title="Transactions"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
        }
      >

        <View style={styles.filters}>
          {FILTERS.map((item) => {
            const selectedFilter = filter === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[styles.filter, selectedFilter && styles.filterOn]}
              >
                <Text style={[styles.filterText, selectedFilter && styles.filterTextOn]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Notice message={error} />
        {loading && !items.length ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : null}

        {!loading && visible.length === 0 ? (
          <EmptyState
            title="Nothing in this view"
            body="When your account moves, the record will appear here."
          />
        ) : null}

        {visible.map((tx) => (
          <ListRow
            key={tx.transaction_id}
            icon={tx.transaction_type === "withdrawal" ? "arrow-up-outline" : "arrow-down-outline"}
            title={tx.description || "Account movement"}
            meta={`${formatDate(tx.transaction_date)} · ${tx.accountnumber || "Account"}`}
            value={formatMoney(tx.amount)}
            status={tx.transaction_type}
            onPress={() => setSelected(tx)}
          />
        ))}
      </Screen>

      <Modal visible={Boolean(selected)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.sheetKicker}>Receipt</Text>
            <Text style={styles.sheetAmount}>{formatMoney(selected?.amount)}</Text>
            <View style={{ marginTop: 10 }}>
              <Pill status={selected?.transaction_type} />
            </View>
            <Detail label="Date" value={formatDate(selected?.transaction_date)} />
            <Detail
              label="Reference"
              value={String(selected?.transaction_number || selected?.transaction_id || "—")}
            />
            <Detail
              label="Account"
              value={String(selected?.accountnumber || selected?.account_id || "—")}
            />
            <Detail label="Note" value={selected?.description || "—"} />
            <View style={{ height: 16 }} />
            <Button label="Share receipt" onPress={() => shareReceipt(selected)} />
            <View style={{ height: 10 }} />
            <Button label="Close" variant="ghost" onPress={() => setSelected(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Detail({ label, value }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
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
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.mute,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  filter: {
    borderRadius: 999,
    backgroundColor: colors.panel,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterOn: {
    backgroundColor: colors.primaryMuted,
  },
  filterText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  filterTextOn: {
    color: colors.primary,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
    flexShrink: 1,
  },
  rowMeta: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.mute,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(20, 24, 22, 0.45)",
  },
  sheet: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    backgroundColor: colors.page,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  sheetKicker: {
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.primary,
  },
  sheetAmount: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.ink,
    flexShrink: 1,
  },
  detail: {
    marginTop: 14,
  },
  detailLabel: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mute,
  },
  detailValue: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
  },
});
