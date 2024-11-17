import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import * as Notifications from "expo-notifications";
import { updateUser } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fontsLoaded] = useFonts({
    "satoshi-regular": require("../../assets/fonts/Satoshi-Regular.otf"),
    "satoshi-bold": require("../../assets/fonts/Satoshi-Bold.otf"),
    "satoshi-medium": require("../../assets/fonts/Satoshi-Medium.otf"),
  });

  const registerForPushNotificationsAsync = async () => {
    // ... (keep existing notification logic)
  };

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    try {
      await signUp.create({
        emailAddress,
        password,
        firstName,
        lastName,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
      Toast.show({
        text1: "Verification code sent",
        text2: "Please check your email",
        type: "success",
      });
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Toast.show({
        type: "error",
        text1: "Sign up failed",
        text2: err.errors[0].message,
      });
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        await registerForPushNotificationsAsync();
        router.replace("/");
        Toast.show({
          type: "success",
          text1: "Account created successfully!",
          text2: "Welcome to the app!",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Verification failed",
          text2: "Please try again",
        });
      }
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Verification failed",
        text2: err.errors[0].message,
      });
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Design Element */}
          <View className="h-1/5 bg-green-50 rounded-b-[40px] justify-end pb-8">
            <View className="items-center">
              <View className="bg-white p-4 rounded-full shadow-sm">
                <Ionicons name="leaf" size={40} color="#16a34a" />
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View className="px-6 pt-8 flex-1">
            {/* Header */}
            <View className="mb-8">
              <Text
                className="text-3xl text-gray-800 mb-2"
                style={{ fontFamily: "satoshi-bold" }}
              >
                {pendingVerification ? "Verify Your Email" : "Create Account"}
              </Text>
              <Text
                className="text-gray-500"
                style={{ fontFamily: "satoshi-regular" }}
              >
                {pendingVerification
                  ? "Enter the code sent to your email"
                  : "Start your gardening journey today"}
              </Text>
            </View>

            {!pendingVerification ? (
              <View className="space-y-4">
                <View className="flex-row space-x-3">
                  <View className="flex-1 space-y-2">
                    <Text
                      className="text-gray-700 ml-1"
                      style={{ fontFamily: "satoshi-medium" }}
                    >
                      First Name
                    </Text>
                    <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                      <Ionicons name="person-outline" size={20} color="#666" />
                      <TextInput
                        className="flex-1 ml-3 text-gray-800"
                        style={{ fontFamily: "satoshi-regular" }}
                        placeholder="First"
                        value={firstName}
                        onChangeText={setFirstName}
                      />
                    </View>
                  </View>
                  <View className="flex-1 space-y-2">
                    <Text
                      className="text-gray-700 ml-1"
                      style={{ fontFamily: "satoshi-medium" }}
                    >
                      Last Name
                    </Text>
                    <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                      <Ionicons name="person-outline" size={20} color="#666" />
                      <TextInput
                        className="flex-1 ml-3 text-gray-800"
                        style={{ fontFamily: "satoshi-regular" }}
                        placeholder="Last"
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </View>
                  </View>
                </View>

                <View className="space-y-2">
                  <Text
                    className="text-gray-700 ml-1"
                    style={{ fontFamily: "satoshi-medium" }}
                  >
                    Email
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                    <Ionicons name="mail-outline" size={20} color="#666" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800"
                      style={{ fontFamily: "satoshi-regular" }}
                      placeholder="Enter your email"
                      value={emailAddress}
                      onChangeText={setEmailAddress}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View className="space-y-2">
                  <Text
                    className="text-gray-700 ml-1"
                    style={{ fontFamily: "satoshi-medium" }}
                  >
                    Password
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#666"
                    />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800"
                      style={{ fontFamily: "satoshi-regular" }}
                      placeholder="Create a password"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color="#666"
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Sign Up Button */}
                <TouchableOpacity
                  onPress={onSignUpPress}
                  className="bg-green-600 rounded-xl py-4 mt-6"
                >
                  <Text
                    className="text-white text-center text-lg"
                    style={{ fontFamily: "satoshi-medium" }}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>

                <View className="mt-6">
                  <View className="flex-row items-center mb-6">
                    <View className="flex-1 h-[1px] bg-gray-200" />
                    <Text
                      className="mx-4 text-gray-500"
                      style={{ fontFamily: "satoshi-regular" }}
                    >
                      Or sign up with
                    </Text>
                    <View className="flex-1 h-[1px] bg-gray-200" />
                  </View>

                  <View className="flex-row justify-center space-x-4">
                    <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-50 items-center justify-center">
                      <Ionicons name="logo-google" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View className="space-y-4">
                <View className="space-y-2">
                  <Text
                    className="text-gray-700 ml-1"
                    style={{ fontFamily: "satoshi-medium" }}
                  >
                    Verification Code
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                    <Ionicons name="key-outline" size={20} color="#666" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800"
                      style={{ fontFamily: "satoshi-regular" }}
                      placeholder="Enter verification code"
                      value={code}
                      onChangeText={setCode}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={onPressVerify}
                  className="bg-green-600 rounded-xl py-4 mt-4"
                >
                  <Text
                    className="text-white text-center text-lg"
                    style={{ fontFamily: "satoshi-medium" }}
                  >
                    Verify Email
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {!pendingVerification && (
              <Text
                className="text-gray-500 text-center mt-6 mb-4 px-4"
                style={{ fontFamily: "satoshi-regular" }}
              >
                By signing up, you agree to our Terms of Service and Privacy
                Policy
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
