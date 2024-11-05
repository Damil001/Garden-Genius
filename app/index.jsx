import { View, Text, StyleSheet } from "react-native";
import { Link, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { SignedIn, SignedOut } from "@clerk/clerk-expo";
import { useAuth } from "@clerk/clerk-expo";
import Toast from "react-native-toast-message";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Redirect } from "expo-router";
SplashScreen.preventAutoHideAsync();
const index = () => {
  const [fontsLoaded] = useFonts({
    "satoshi-regular": require("../assets/fonts/Satoshi-Regular.otf"),
    "satoshi-bold": require("../assets/fonts/Satoshi-Bold.otf"),
    "satoshi-italic": require("../assets/fonts/Satoshi-Italic.otf"),
    "satoshi-medium": require("../assets/fonts/Satoshi-Medium.otf"),
    "satoshi-light": require("../assets/fonts/Satoshi-Light.otf"),
    "satoshi-medium-italic": require("../assets/fonts/Satoshi-MediumItalic.otf"),
    "satoshi-bold-italic": require("../assets/fonts/Satoshi-BoldItalic.otf"),
    "satoshi-light-italic": require("../assets/fonts/Satoshi-LightItalic.otf"),
  });
  const router = useRouter();
  const { signOut, isSignedIn } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);
  if (!fontsLoaded) {
    return null;
  }
  return (
    <View style={styles.container}>
      <SignedOut>
        <View>
          <Text style={styles.welcomeText}>
            Welcome to the Ultimate Solution for Gardening at{" "}
            <Text style={styles.highlightText}>Home!</Text>
          </Text>
          <View style={styles.buttonContainer}>
            <Link href="/sign-in" style={styles.button}>
              <Text style={styles.buttonText}>Sign In</Text>
            </Link>
            <Link href="/sign-up" style={styles.button}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </Link>
          </View>
        </View>
      </SignedOut>
      <SignedIn>
        <Redirect href="/main" />
      </SignedIn>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#F0F8FF",
  },
  welcomeText: {
    fontSize: 24,
    textAlign: "center",
    marginTop: 30,
    color: "#333",
    fontFamily: "satoshi-medium",
  },
  highlightText: {
    color: "#4A9C2F",
    fontFamily: "satoshi-medium",
    fontStyle: "italic",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    backgroundColor: "#4A9C2F",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    textAlign: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 18,
    textAlign: "center",
  },
});
export default index;
