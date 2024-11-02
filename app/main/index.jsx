import { SignedIn, SignedOut, useUser, useAuth } from "@clerk/clerk-expo";
import { Link } from "expo-router";
import { Text, View, Button, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import Toast from "react-native-toast-message";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useState, useRef } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});
const savePushToken = async (token, userId) => {
  try {
    const apiUrl = `https://api.clerk.dev/v1/users/${userId}`;
    const apiKey = "sk_test_eTkzEx0tcIksKsSTsgRMP4VTyKLIE1jZKHzrKMhnzR";
    const param = { public_metadata: { pushToken: token } };
    const response = await fetch(apiUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(param),
    });
    const updatedUser = await response.json();
    console.log("User updated:", updatedUser);
    console.log("Push token saved to Clerk:", token);
  } catch (error) {
    console.error("Error saving push token:", error);
  }
};
async function sendPushNotification(expoPushToken) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Original Title",
    body: "And here is the body!",
    data: { data: "goes here" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}
async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for push notification!"
      );
      return;
    }
    const projectId = "8f4c884e-827c-46cd-9d48-13cc46384af2";
    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);

      return pushTokenString;
    } catch (e) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications");
  }
}
export default function Page() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? ""))
      .catch((error) => setExpoPushToken(`${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(response);
      });

    return () => {
      notificationListener.current &&
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      responseListener.current &&
        Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);
  const { user, isLoaded } = useUser();
  const { signOut, isSignedIn } = useAuth();
  useEffect(() => {
    if (!isSignedIn) {
      signOut();
      Toast.show({
        type: "success",
        text1: "Signed Out",
        text2: "You have been signed out.",
      });
    }
  }, [isSignedIn]);
  savePushToken(expoPushToken, user.id);
  return (
    <View>
      <SignedIn>
        {isLoaded && user ? (
          <Text style={styles.welcomeText}>Hello {user.firstName}!</Text>
        ) : (
          <Text style={styles.welcomeText}>Loading...</Text>
        )}
        <Text>Your Expo push token: {expoPushToken}</Text>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Text>
            Title: {notification && notification.request.content.title}{" "}
          </Text>
          <Text>Body: {notification && notification.request.content.body}</Text>
          <Text>
            Data:{" "}
            {notification && JSON.stringify(notification.request.content.data)}
          </Text>
        </View>
        <Button
          title="Press to Send Notification"
          onPress={async () => {
            await sendPushNotification(expoPushToken);
          }}
        />
        <Button
          title="Sign Out"
          onPress={async () => {
            await signOut();
          }}
        />
      </SignedIn>
      <SignedOut>
        <Redirect href="/" />
      </SignedOut>
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
});
