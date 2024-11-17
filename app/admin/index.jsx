import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

const AdminShapeIllustration = () => (
  <View className="relative w-72 h-56 items-center justify-center">
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

    <View className="absolute flex-row items-center justify-center space-x-8">
      <MotiView
        from={{ translateY: 20, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 700 }}
        className="items-center"
      >
        <View className="bg-white p-4 rounded-2xl shadow-sm">
          <Ionicons name="shield-checkmark" size={32} color="#16a34a" />
        </View>
      </MotiView>

      <MotiView
        from={{ translateY: -20, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: "spring", delay: 900 }}
        className="items-center"
      >
        <View className="bg-white p-4 rounded-2xl shadow-sm">
          <Ionicons name="settings" size={32} color="#16a34a" />
        </View>
      </MotiView>
    </View>
  </View>
);

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  const handleLogin = async () => {
    try {
      setError("");
      setLoading(true);

      // Check admin credentials
      if (email === "admin@gmail.com" && password === "damiljamil") {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
        router.push("/admin/adminHome"); // Navigate to main page
      } else {
        setError("Invalid email or password");
      }
    } catch (err) {
      setError("Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 px-6">
        {/* Logo */}
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
              Admin Portal
            </Text>
          </View>
        </MotiView>

        {/* Main Content */}
        <View className="flex-1 justify-center items-center">
          <View className="w-full max-w-sm items-center">
            {/* Illustration */}
            <MotiView
              from={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "timing", duration: 1000, delay: 200 }}
              className="mb-8"
            >
              <AdminShapeIllustration />
            </MotiView>

            {/* Error Message */}
            {error ? (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring" }}
                className="w-full bg-red-50 px-4 py-3 rounded-xl mb-4"
              >
                <Text
                  className="text-red-600 text-center"
                  style={{ fontFamily: "satoshi-medium" }}
                >
                  {error}
                </Text>
              </MotiView>
            ) : null}

            {/* Form Fields */}
            <MotiView
              from={{ translateY: 20, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              transition={{ type: "timing", duration: 1000, delay: 400 }}
              className="w-full space-y-4"
            >
              <View className="relative">
                <View className="absolute top-5 left-3 z-10">
                  <Ionicons name="mail-outline" size={24} color="#16a34a" />
                </View>
                <TextInput
                  className="w-full bg-white border border-gray-200 rounded-xl px-12 py-4 mb-4"
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#666"
                  style={{ fontFamily: "satoshi-regular" }}
                />
              </View>

              <View className="relative">
                <View className="absolute top-5 left-3 z-10">
                  <Ionicons
                    name="lock-closed-outline"
                    size={24}
                    color="#16a34a"
                  />
                </View>
                <TextInput
                  className="w-full bg-white border border-gray-200 rounded-xl px-12 py-4 mb-4"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#666"
                  style={{ fontFamily: "satoshi-regular" }}
                />
              </View>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                className="bg-green-600 py-4 rounded-xl shadow-sm"
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
                  {loading ? "Logging in..." : "Login as Admin"}
                </Text>
              </TouchableOpacity>
            </MotiView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
