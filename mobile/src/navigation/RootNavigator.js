import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, Image, Platform, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../AuthContext";
import ApplyLoanScreen from "../screens/ApplyLoanScreen";
import ForgotPasswordScreen from "../screens/ForgotPasswordScreen";
import HomeScreen from "../screens/HomeScreen";
import LoanDetailScreen from "../screens/LoanDetailScreen";
import LoansScreen from "../screens/LoansScreen";
import LoginScreen from "../screens/LoginScreen";
import ChatScreen from "../screens/ChatScreen";
import MessagesScreen from "../screens/MessagesScreen";
import OtpScreen from "../screens/OtpScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import SignupScreen from "../screens/SignupScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import { colors, fonts } from "../theme";

const Stack = createNativeStackNavigator();
const IosTab = createNativeBottomTabNavigator();
const AndroidTab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ["home-outline", "home"],
  Activity: ["swap-horizontal-outline", "swap-horizontal"],
  Loans: ["cash-outline", "cash"],
  Messages: ["chatbubbles-outline", "chatbubbles"],
  Profile: ["person-outline", "person"],
};

function tabIcon(name, focusedName) {
  return ({ focused }) => ({
    type: "sfSymbol",
    name: focused && focusedName ? focusedName : name,
  });
}

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.page,
    card: colors.panel,
    text: colors.ink,
    border: colors.line,
    primary: colors.primary,
  },
};

function AndroidMemberTabs() {
  return (
    <AndroidTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mute,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.medium,
          fontSize: 11,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const pair = TAB_ICONS[route.name] || TAB_ICONS.Home;
          return <Ionicons name={focused ? pair[1] : pair[0]} color={color} size={size} />;
        },
      })}
    >
      <AndroidTab.Screen name="Home" component={HomeScreen} />
      <AndroidTab.Screen
        name="Activity"
        component={TransactionsScreen}
        options={{ title: "Activity" }}
      />
      <AndroidTab.Screen name="Loans" component={LoansScreen} />
      <AndroidTab.Screen name="Messages" component={MessagesScreen} />
      <AndroidTab.Screen name="Profile" component={ProfileScreen} />
    </AndroidTab.Navigator>
  );
}

function IosMemberTabs() {
  return (
    <IosTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarMinimizeBehavior: "none",
        tabBarControllerMode: "tabBar",
      }}
    >
      <IosTab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: tabIcon("house", "house.fill") }}
      />
      <IosTab.Screen
        name="Activity"
        component={TransactionsScreen}
        options={{
          title: "Activity",
          tabBarIcon: tabIcon("arrow.left.arrow.right"),
        }}
      />
      <IosTab.Screen
        name="Loans"
        component={LoansScreen}
        options={{ tabBarIcon: tabIcon("banknote", "banknote.fill") }}
      />
      <IosTab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarIcon: tabIcon("message", "message.fill") }}
      />
      <IosTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: tabIcon("person", "person.fill") }}
      />
    </IosTab.Navigator>
  );
}

function MemberTabs() {
  return Platform.OS === "android" ? <AndroidMemberTabs /> : <IosMemberTabs />;
}

function focusedRouteName(state) {
  if (!state?.routes?.length) return "";
  const route = state.routes[state.index ?? 0];
  if (route?.state) return focusedRouteName(route.state);
  return route?.name || "";
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Otp" component={OtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberTabs" component={MemberTabs} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="ApplyLoan" component={ApplyLoanScreen} />
      <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
      <Stack.Screen
        name="ChangePassword"
        component={ResetPasswordScreen}
        initialParams={{ forced: false }}
      />
    </Stack.Navigator>
  );
}

function ResetStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ForcedReset"
        component={ResetPasswordScreen}
        initialParams={{ forced: true }}
      />
    </Stack.Navigator>
  );
}

function BootScreen() {
  return (
    <View style={styles.boot}>
      <StatusBar style="light" />
      <Image source={require("../../assets/logo.png")} style={styles.bootLogo} />
      <Text style={styles.bootMark}>CEPEDHU</Text>
      <ActivityIndicator color={colors.accent} style={{ marginTop: 18 }} />
    </View>
  );
}

export default function RootNavigator() {
  const { ready, session } = useAuth();
  const mode = !session ? "auth" : session.mustResetPassword ? "reset" : "app";
  const [routeName, setRouteName] = useState("Login");
  const [trackedMode, setTrackedMode] = useState(mode);

  if (mode !== trackedMode) {
    setTrackedMode(mode);
    setRouteName(mode === "auth" ? "Login" : "Home");
  }

  if (!ready) return <BootScreen />;

  return (
    <NavigationContainer
      theme={navTheme}
      onStateChange={(state) => setRouteName(focusedRouteName(state))}
    >
      <StatusBar style="light" />
      {session?.mustResetPassword ? (
        <ResetStack />
      ) : session ? (
        <AppStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bootLogo: {
    width: 96,
    height: 110,
    marginBottom: 12,
  },
  bootMark: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.white,
    letterSpacing: 0.6,
  },
});
