import * as React from "react";
import { TextInput, Button, View } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { updateUser } from "@clerk/clerk-expo";
export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");

  const registerForPushNotificationsAsync = async () => {
    let token;
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      alert("Failed to get push token for push notification!");
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;

    // Store the push token in Clerk's public metadata
    if (token) {
      try {
        await updateUser({
          publicMetadata: {
            pushToken: token, // Save the token here
          },
        });
        console.log("Push token saved to Clerk:", token);
      } catch (error) {
        console.error("Error saving push token:", error);
      }
    }

    return token;
  };
  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName, // Include the first and last name in the signup
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setPendingVerification(true);
      Toast.show({
        text1: "Please check your email for the verification code.",
        text2: "We are waiting to on board you!!",
        type: "success",
      });
    } catch (err) {
      // Error handling
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        router.replace("/");
        Toast.show({
          type: "success",
          text1: "Account created successfully!",
          text2: "Welcome to the app!",
        });
        try {
          registerForPushNotificationsAsync();
        } catch (error) {
          console.error("Error registering for push notifications:", error);
        }
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
        Toast.show({
          type: "error",
          text1: "Something went wrong. Please try again.",
          text2: completeSignUp.errors[0].message,
        });
      }
    } catch (err) {
      // Error handling
      console.error(JSON.stringify(err, null, 2));
      Toast.show({
        type: "error",
        text1: "Something went wrong. Please try again.",
        text2: err.errors[0].message,
      });
    }
  };

  return (
    <View style={styles.container}>
      {!pendingVerification && (
        <>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={firstName}
            placeholder="First Name..."
            onChangeText={(text) => setFirstName(text)}
          />
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={lastName}
            placeholder="Last Name..."
            onChangeText={(text) => setLastName(text)}
          />
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email..."
            onChangeText={(email) => setEmailAddress(email)}
          />
          <TextInput
            style={styles.input}
            value={password}
            placeholder="Password..."
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />
          <Button
            title="Sign Up"
            onPress={onSignUpPress}
            color="#90ee90" // Light green color
          />
        </>
      )}
      {pendingVerification && (
        <>
          <TextInput
            style={styles.input}
            value={code}
            placeholder="Verification Code..."
            onChangeText={(code) => setCode(code)}
          />
          <Button title="Verify Email" onPress={onPressVerify} />
        </>
      )}
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
