import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { statusTone, titleCase } from "../format";
import { colors, fonts } from "../theme";

export function Notice({ message, tone = "error" }) {
  if (!message) return null;
  const isError = tone === "error";
  return (
    <View
      style={[
        styles.notice,
        { backgroundColor: isError ? colors.dangerSoft : colors.successSoft },
      ]}
    >
      <Text style={[styles.noticeText, { color: isError ? colors.danger : colors.primaryDark }]}>
        {message}
      </Text>
    </View>
  );
}

export function Field({ label, style, ...props }) {
  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#8696A0"
        style={styles.input}
        {...props}
      />
    </View>
  );
}

export function PasswordField({ label, value, onChangeText, placeholder }) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8696A0"
          secureTextEntry={!visible}
          autoCapitalize="none"
          style={[styles.input, styles.passwordInput]}
        />
        <Pressable
          onPress={() => setVisible((current) => !current)}
          style={styles.eye}
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.mute}
          />
        </Pressable>
      </View>
    </View>
  );
}

export function Button({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.buttonPrimary,
        variant === "ghost" && styles.buttonGhost,
        isDanger && styles.buttonDanger,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            !isPrimary && { color: isDanger ? colors.danger : colors.primary },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Pill({ status }) {
  const tone = statusTone(status);
  const palette = {
    good: { bg: colors.primaryMuted, fg: colors.primaryDark },
    wait: { bg: "#FFF4D8", fg: "#8A6414" },
    bad: { bg: colors.dangerSoft, fg: colors.danger },
    out: { bg: "#F3F4F5", fg: colors.mute },
    neutral: { bg: "#F3F4F5", fg: colors.mute },
  }[tone];

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.pillText, { color: palette.fg }]}>{titleCase(status)}</Text>
    </View>
  );
}

export function ListRow({ icon = "wallet-outline", title, meta, value, status, onPress }) {
  const content = (
    <View style={styles.listRow}>
      <View style={styles.avatar}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.listCopy}>
        <Text style={styles.listTitle} numberOfLines={1}>
          {title}
        </Text>
        {meta ? (
          <Text style={styles.listMeta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>
      <View style={styles.listEnd}>
        {value ? (
          <Text style={styles.listValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {status ? <Pill status={status} /> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color="#C5CDD2" /> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

export function EmptyState({ title, body }) {
  return (
    <Card>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </Card>
  );
}

export function SectionLabel({ children }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  noticeText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    width: "100%",
    borderRadius: 14,
    borderWidth: 0,
    backgroundColor: colors.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eye: {
    position: "absolute",
    right: 0,
    top: 0,
    height: 52,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    minHeight: 52,
    width: "100%",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  buttonDanger: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E7C8C2",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.86,
  },
  buttonText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.white,
  },
  card: {
    backgroundColor: colors.panel,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#163028",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.ink,
  },
  emptyBody: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.mute,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.panel,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  listCopy: {
    flex: 1,
    minWidth: 0,
  },
  listTitle: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.ink,
  },
  listMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mute,
  },
  listEnd: {
    alignItems: "flex-end",
    gap: 4,
    maxWidth: "42%",
  },
  listValue: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  section: {
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.mute,
    marginBottom: 10,
    marginTop: 22,
  },
});
