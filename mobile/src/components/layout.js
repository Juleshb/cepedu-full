import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts } from "../theme";

export function useScreenMetrics() {
  const { width, height } = useWindowDimensions();
  const compact = width < 380;
  const wide = width >= 720;
  return {
    width,
    height,
    compact,
    wide,
    pad: compact ? 16 : 20,
  };
}

export function Screen({
  title,
  onBack,
  brand,
  children,
  scroll = true,
  keyboard = false,
  refreshControl,
  tabPad = false,
}) {
  const insets = useSafeAreaInsets();
  const { pad } = useScreenMetrics();
  const showHeader = Boolean(brand || title || onBack);

  const header = showHeader ? (
    <View style={[styles.header, { paddingTop: insets.top + 8, paddingHorizontal: pad }]}>
      {brand || (
        <View style={styles.headerBar}>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={12} style={styles.backButton}>
              <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </Pressable>
          ) : (
            <View style={styles.headerSide} />
          )}
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          <View style={styles.headerSide} />
        </View>
      )}
    </View>
  ) : null;

  const column = (
    <View
      style={[
        styles.column,
        !scroll && styles.columnFill,
        {
          paddingHorizontal: pad,
          paddingTop: showHeader ? 18 : insets.top + 12,
        },
      ]}
    >
      {children}
    </View>
  );

  const body = scroll ? (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[
        styles.grow,
        { paddingBottom: insets.bottom + (tabPad && Platform.OS === "ios" ? 108 : 28) },
      ]}
      keyboardShouldPersistTaps="handled"
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      {column}
    </ScrollView>
  ) : (
    <View style={[styles.fill, styles.grow, { paddingBottom: insets.bottom + 16 }]}>
      {column}
    </View>
  );

  return (
    <View style={styles.fill}>
      {header}
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    backgroundColor: colors.page,
  },
  grow: {
    flexGrow: 1,
    alignItems: "center",
  },
  column: {
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  columnFill: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingBottom: 16,
  },
  headerBar: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  headerSide: {
    width: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: fonts.semibold,
    fontSize: 18,
    color: colors.white,
  },
});
