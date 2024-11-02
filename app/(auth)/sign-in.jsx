import { useSignIn, useUser } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text, TextInput, Button, View, StyleSheet } from "react-native";
import React from "react";
import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { updateUser } from "@clerk/clerk-expo";
export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const { user } = useUser();
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");

  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        try {
        } catch (error) {
          console.error("Error registering for push notifications:", error);
        }
        Toast.show({
          type: "success",
          text1: "Sign In Successful",
          text2: "Welcome back!",
        });
        router.replace("/");
      } else {
        // Handle error response
        const errorMessage =
          signInAttempt.errors?.[0]?.message ||
          "Sign In Failed. Please try again.";
        Toast.show({
          type: "error",
          text1: "Sign In Failed",
          text2: errorMessage,
        });
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Toast.show({
        type: "error",
        text1: "An error occurred",
        text2: err.errors[0].message,
      });
    }
  }, [isLoaded, emailAddress, password]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Email..."
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
      />
      <TextInput
        style={styles.input}
        value={password}
        placeholder="Password..."
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />
      <Button title="Sign In" onPress={onSignInPress} color="#4a9c2f" />
      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account?</Text>
        <Link href="/sign-up">
          <Text style={styles.signupLink}>Sign up</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f0f8ff",
  },
  input: {
    height: 40,
    borderColor: "#4a9c2f",
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 10,
    borderRadius: 5,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    marginRight: 5,
  },
  signupLink: {
    color: "#4a9c2f",
    fontWeight: "bold",
  },
});
