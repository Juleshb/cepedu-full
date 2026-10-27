import { useState } from "react";
import {
  Image,
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
import { useAuth } from "../AuthContext";
import { Button, Field, Notice, PasswordField } from "../components/ui";
import { colors, fonts } from "../theme";

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const logoWidth = Math.min(96, Math.max(72, width * 0.22));
  const { signIn, loginNotice, clearLoginNotice } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError("");
    clearLoginNotice();
    setLoading(true);
    try {
      await signIn(emailOrPhone.trim(), password);
      navigation.navigate("Otp");
    } catch (err) {
      setError(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.brand, { paddingTop: insets.top + 20 }]}>
        <Image
          source={require("../../assets/logo.png")}
          style={[styles.logo, { width: logoWidth, height: logoWidth * 1.15 }]}
        />
        <Text style={styles.mark}>CEPEDHU</Text>
        <Text style={styles.tagline}>Indatirwabahizi</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.formWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={styles.form}>
          <Text style={styles.title}>Sign in</Text>

          <Notice message={loginNotice} tone="success" />
          <Notice message={error} />

          <Field
            label="Email or phone"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email or phone"
            style={styles.field}
          />
          <PasswordField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
          />

          <Pressable
            onPress={() => navigation.navigate("ForgotPassword")}
            style={styles.forgot}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Button
            label="Sign in"
            onPress={onSubmit}
            loading={loading}
            disabled={!emailOrPhone.trim() || !password}
          />

          <Pressable
            onPress={() => navigation.navigate("Signup")}
            style={styles.switch}
          >
            <Text style={styles.switchText}>
              New here? <Text style={styles.switchLink}>Join</Text>
            </Text>
          </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.page,
  },
  brand: {
    backgroundColor: colors.primary,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  logo: {
    marginBottom: 8,
  },
  mark: {
    fontFamily: fonts.bold,
    fontSize: 34,
    color: colors.white,
    letterSpacing: 0.4,
  },
  tagline: {
    marginTop: 6,
    fontFamily: fonts.medium,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.accentSoft,
  },
  formWrap: {
    flex: 1,
    marginTop: -16,
  },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    backgroundColor: colors.panel,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 28,
  },
  form: {
    width: "100%",
    maxWidth: 560,
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 20,
    fontFamily: fonts.bold,
    fontSize: 30,
    color: colors.ink,
  },
  field: {
    marginBottom: 14,
  },
  forgot: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: 18,
  },
  forgotText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.primary,
  },
  switch: {
    marginTop: 22,
    alignItems: "center",
  },
  switchText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.mute,
  },
  switchLink: {
    fontFamily: fonts.semibold,
    color: colors.primary,
  },
});
