import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../api";
import { Screen } from "../components/layout";
import { Button, Field, Notice } from "../components/ui";
import { colors, fonts } from "../theme";

const MARITAL = ["single", "married", "divorced", "widowed"];

const EMPTY = {
  name: "",
  email: "",
  telephone: "",
  identification_number: "",
  date_of_birth: "",
  place_of_birth: "",
  residence_place: "",
  address: "",
  position: "",
  place_of_working: "",
  marital_status: "single",
  spouse_name: "",
  spouse_id_number: "",
  spouse_telephone: "",
  shares: "",
  monthly_saving: "",
};

export default function SignupScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const next = () => {
    if (step === 1 && (!form.name.trim() || !form.email.trim() || !form.telephone.trim())) {
      setError("Name, email, and phone are required.");
      return;
    }
    if (step === 1 && !form.email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (
      step === 2 &&
      form.date_of_birth &&
      !/^\d{4}-\d{2}-\d{2}$/.test(form.date_of_birth.trim())
    ) {
      setError("Use the date format YYYY-MM-DD.");
      return;
    }
    setError("");
    setStep((current) => current + 1);
  };

  const submit = async () => {
    const shares = form.shares === "" ? 0 : Number(form.shares);
    const monthlySaving = form.monthly_saving === "" ? 0 : Number(form.monthly_saving);
    if (!Number.isFinite(shares) || !Number.isFinite(monthlySaving)) {
      setError("Shares and monthly saving must be numbers.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        telephone: form.telephone.trim(),
        date_of_birth: form.date_of_birth.trim(),
        shares,
        monthly_saving: monthlySaving,
        marital_status: form.marital_status || null,
      };
      const data = await api.post("/users/register", payload);
      setDone(data);
    } catch (err) {
      setError(err.message || "Could not submit the membership request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      keyboard
      title={done ? "Check your email" : "Join"}
      onBack={() => (step > 1 && !done ? setStep(step - 1) : navigation.goBack())}
    >
        <Text style={styles.subtitle}>
          {done ? "Then sign in." : "We'll email your password."}
        </Text>

        {!done ? (
          <View style={styles.steps}>
            {[1, 2, 3].map((item) => (
              <View
                key={item}
                style={[styles.step, item <= step && styles.stepOn]}
              />
            ))}
          </View>
        ) : null}

        <Notice message={error} />

        {done ? (
          <Button label="Sign in" onPress={() => navigation.navigate("Login")} />
        ) : null}

        {!done && step === 1 ? (
          <>
            <Field label="Full name" value={form.name} onChangeText={set("name")} style={styles.field} />
            <Field
              label="Email"
              value={form.email}
              onChangeText={set("email")}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.field}
            />
            <Field
              label="Phone"
              value={form.telephone}
              onChangeText={set("telephone")}
              keyboardType="phone-pad"
              style={styles.field}
            />
            <Field
              label="Identification number"
              value={form.identification_number}
              onChangeText={set("identification_number")}
              style={styles.field}
            />
            <Button label="Continue" onPress={next} />
          </>
        ) : null}

        {!done && step === 2 ? (
          <>
            <Field
              label="Date of birth"
              value={form.date_of_birth}
              onChangeText={set("date_of_birth")}
              placeholder="YYYY-MM-DD"
              style={styles.field}
            />
            <Field label="Place of birth" value={form.place_of_birth} onChangeText={set("place_of_birth")} style={styles.field} />
            <Field label="Residence" value={form.residence_place} onChangeText={set("residence_place")} style={styles.field} />
            <Field label="Address" value={form.address} onChangeText={set("address")} style={styles.field} />
            <Button label="Continue" onPress={next} />
          </>
        ) : null}

        {!done && step === 3 ? (
          <>
            <Field label="Position" value={form.position} onChangeText={set("position")} style={styles.field} />
            <Field label="Workplace" value={form.place_of_working} onChangeText={set("place_of_working")} style={styles.field} />
            <Text style={styles.label}>Marital status</Text>
            <View style={styles.choices}>
              {MARITAL.map((status) => {
                const selected = form.marital_status === status;
                return (
                  <Pressable
                    key={status}
                    onPress={() => set("marital_status")(status)}
                    style={[styles.choice, selected && styles.choiceOn]}
                  >
                    <Text style={[styles.choiceText, selected && styles.choiceTextOn]}>
                      {status}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {form.marital_status === "married" ? (
              <>
                <Field label="Spouse name" value={form.spouse_name} onChangeText={set("spouse_name")} style={styles.field} />
                <Field label="Spouse ID" value={form.spouse_id_number} onChangeText={set("spouse_id_number")} style={styles.field} />
                <Field label="Spouse phone" value={form.spouse_telephone} onChangeText={set("spouse_telephone")} keyboardType="phone-pad" style={styles.field} />
              </>
            ) : null}
            <Field
              label="Shares"
              value={form.shares}
              onChangeText={set("shares")}
              keyboardType="decimal-pad"
              placeholder="0"
              style={styles.field}
            />
            <Field
              label="Monthly saving"
              value={form.monthly_saving}
              onChangeText={set("monthly_saving")}
              keyboardType="decimal-pad"
              placeholder="0"
              style={styles.field}
            />
            <Button label="Join" onPress={submit} loading={loading} />
          </>
        ) : null}
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
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.mute,
  },
  steps: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  step: {
    flex: 1,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.line,
  },
  stepOn: {
    backgroundColor: colors.primary,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 8,
  },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  choice: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  choiceOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  choiceText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
    textTransform: "capitalize",
  },
  choiceTextOn: {
    color: colors.white,
  },
});
