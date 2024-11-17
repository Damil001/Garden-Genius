import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";

export default function Component() {
  const [fontsLoaded] = useFonts({
    "satoshi-regular": require("../../assets/fonts/Satoshi-Regular.otf"),
    "satoshi-bold": require("../../assets/fonts/Satoshi-Bold.otf"),
    "satoshi-medium": require("../../assets/fonts/Satoshi-Medium.otf"),
  });

  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) return;

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        Toast.show({
          type: "success",
          text1: "Sign In Successful",
          text2: "Welcome back!",
        });
        router.replace("/");
      } else {
        Toast.show({
          type: "error",
          text1: "Sign In Failed",
          text2: signInAttempt.errors?.[0]?.message || "Please try again.",
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

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="h-1/4 bg-green-50 rounded-b-[40px] justify-end pb-8">
          <View className="items-center">
            <View className="bg-white p-4 rounded-full shadow-sm">
              <Ionicons name="leaf" size={40} color="#16a34a" />
            </View>
          </View>
        </View>

        <View className="px-6 pt-8 flex-1">
          <View className="mb-8">
            <Text
              className="text-3xl text-gray-800 mb-2"
              style={{ fontFamily: "satoshi-bold" }}
            >
              Welcome Back
            </Text>
            <Text
              className="text-gray-500"
              style={{ fontFamily: "satoshi-regular" }}
            >
              Sign in to continue your gardening journey
            </Text>
          </View>

          <View className="space-y-4">
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
                  placeholderTextColor="#a0a0a0"
                  autoCapitalize="none"
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                />
              </View>
            </View>

            {/* Password Input */}
            <View className="space-y-2">
              <Text
                className="text-gray-700 ml-1"
                style={{ fontFamily: "satoshi-medium" }}
              >
                Password
              </Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
                <Ionicons name="lock-closed-outline" size={20} color="#666" />
                <TextInput
                  className="flex-1 ml-3 text-gray-800"
                  style={{ fontFamily: "satoshi-regular" }}
                  placeholder="Enter your password"
                  placeholderTextColor="#a0a0a0"
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

            <TouchableOpacity className="items-end">
              <Text
                className="text-green-600"
                style={{ fontFamily: "satoshi-medium" }}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={onSignInPress}
            className="bg-green-600 rounded-xl py-4 mt-8"
          >
            <Text
              className="text-white text-center text-lg"
              style={{ fontFamily: "satoshi-medium" }}
            >
              Sign In
            </Text>
          </TouchableOpacity>

          {/* Social Login Options */}
          <View className="mt-8">
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text
                className="mx-4 text-gray-500"
                style={{ fontFamily: "satoshi-regular" }}
              >
                Or continue with
              </Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            <View className="flex-row justify-center space-x-4">
              <TouchableOpacity className="w-14 h-14 rounded-full bg-gray-50 items-center justify-center">
                <Ionicons name="logo-google" size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center mt-8 mb-6">
            <Text
              className="text-gray-600"
              style={{ fontFamily: "satoshi-regular" }}
            >
              Don't have an account?{" "}
            </Text>
            <Link href="/sign-up">
              <Text
                className="text-green-600"
                style={{ fontFamily: "satoshi-bold" }}
              >
                Sign up
              </Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
