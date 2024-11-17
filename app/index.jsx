import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Link, Redirect } from "expo-router";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import BlogEventSection from "../components/BlogCard";

SplashScreen.preventAutoHideAsync();

const ShapeIllustration = () => (
  <View className="relative w-72 h-56 items-center justify-center">
    {/* Background shapes */}
    <MotiView
      from={{ opacity: 0, scale: 0.5, rotate: "0deg" }}
      animate={{ opacity: 1, scale: 1, rotate: "45deg" }}
      transition={{ type: "spring", delay: 300 }}
      className="absolute w-48 h-48 rounded-3xl bg-green-100"
    />
    <MotiView
      from={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 0.7, scale: 1 }}
      transition={{ type: "spring", delay: 500 }}
      className="absolute w-32 h-32 rounded-full bg-green-50 top-0 right-0"
    />

    {/* Plant illustrations using icons */}
    <View className="absolute flex-row items-center justify-center space-x-8">
      <MotiView
        from={{ translateY: 20, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 700 }}
        className="items-center"
      >
        <View className="bg-white p-4 rounded-2xl shadow-sm">
          <Ionicons name="leaf" size={32} color="#16a34a" />
        </View>
      </MotiView>

      <MotiView
        from={{ translateY: -20, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 900 }}
        className="items-center"
      >
        <View className="bg-white p-4 rounded-2xl shadow-sm">
          <Ionicons name="flower" size={32} color="#16a34a" />
        </View>
      </MotiView>
    </View>
  </View>
);

export default function Welcome() {
  const [fontsLoaded] = useFonts({
    "satoshi-regular": require("../assets/fonts/Satoshi-Regular.otf"),
    "satoshi-bold": require("../assets/fonts/Satoshi-Bold.otf"),
    "satoshi-medium": require("../assets/fonts/Satoshi-Medium.otf"),
  });

  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <SignedOut>
        <View className="flex-1 justify-center items-center px-6">
          {/* Logo - Positioned absolutely at top */}
          <MotiView
            from={{ translateY: -10, opacity: 0 }}
            animate={{ translateY: 0, opacity: 1 }}
            transition={{ type: "timing", duration: 1000 }}
            className="absolute top-12 left-6"
          >
            <View className="flex-row items-center">
              <Ionicons name="leaf" size={28} color="#16a34a" />
              <Text
                className="text-2xl text-green-600 ml-2"
                style={{ fontFamily: "satoshi-bold" }}
              >
                Garden Genius
              </Text>
            </View>
          </MotiView>

          {/* Main Content Container */}
          <View className="w-full max-w-sm items-center">
            {/* Illustration */}
            <MotiView
              from={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "timing", duration: 1000, delay: 200 }}
              className="mb-8"
            >
              <ShapeIllustration />
            </MotiView>

            {/* Content */}
            <MotiView
              from={{ translateY: 20, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              transition={{ type: "timing", duration: 1000, delay: 400 }}
              className="mb-12 items-center"
            >
              <Text
                className="text-3xl text-gray-800 mb-3 text-center"
                style={{ fontFamily: "satoshi-bold" }}
              >
                Grow <Text className="text-green-600">jungle</Text> in your own
                home
              </Text>
              <Text
                className="text-gray-500 text-base leading-6 text-center"
                style={{ fontFamily: "satoshi-regular" }}
              >
                Make your plants thrive while gaining knowledge and creating
                reliable plant care habits
              </Text>
            </MotiView>

            {/* Buttons */}
            <MotiView
              from={{ translateY: 20, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              transition={{ type: "timing", duration: 1000, delay: 600 }}
              className="w-full space-y-4 flex-col gap-5"
            >
              <Link href="/sign-in" asChild>
                <TouchableOpacity
                  className="bg-green-600 py-4 rounded-xl shadow-sm "
                  style={{
                    shadowColor: "#16a34a",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Text
                    className="text-white text-center text-lg"
                    style={{ fontFamily: "satoshi-medium" }}
                  >
                    Log in
                  </Text>
                </TouchableOpacity>
              </Link>

              <Link href="/sign-up" asChild>
                <TouchableOpacity
                  className="bg-white border border-gray-200 py-4 rounded-xl"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    className="text-gray-800 text-center text-lg"
                    style={{ fontFamily: "satoshi-medium" }}
                  >
                    Create an account
                  </Text>
                </TouchableOpacity>
              </Link>
              <Link href="/admin" asChild>
                <TouchableOpacity
                  className="bg-white border border-gray-200 py-4 rounded-xl"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text
                    className="text-gray-800 text-center text-lg"
                    style={{ fontFamily: "satoshi-medium" }}
                  >
                    Sign in as admin
                  </Text>
                </TouchableOpacity>
              </Link>
            </MotiView>
          </View>
        </View>
      </SignedOut>
      <SignedIn>
        <Redirect href="/main" />
      </SignedIn>
    </SafeAreaView>
  );
}
