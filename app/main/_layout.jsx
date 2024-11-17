import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Platform } from "react-native";

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "white",
          height: Platform.OS === "ios" ? 88 : 68,
          paddingBottom: Platform.OS === "ios" ? 30 : 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
        },
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#6b7280",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: "satoshi-medium",
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <View className={`p-1 ${focused ? "bg-green-100 rounded-xl" : ""}`}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="addPlant"
        options={{
          title: "Plants",
          tabBarIcon: ({ focused, color }) => (
            <View className={`p-1 ${focused ? "bg-green-100 rounded-xl" : ""}`}>
              <Ionicons
                name={focused ? "leaf" : "leaf-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="communityForm"
        options={{
          title: "Community",
          tabBarIcon: ({ focused, color }) => (
            <View className={`p-1 ${focused ? "bg-green-100 rounded-xl" : ""}`}>
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="addPost"
        options={{
          title: "Post",
          tabBarIcon: ({ focused, color }) => (
            <View className="bg-green-600 p-3 rounded-full -mt-8 shadow-lg">
              <Ionicons name="add" size={24} color="white" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="pestIdentification"
        options={{
          title: "Identify",
          tabBarIcon: ({ focused, color }) => (
            <View className={`p-1 ${focused ? "bg-green-100 rounded-xl" : ""}`}>
              <Ionicons
                name={focused ? "search" : "search-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="chatScreen"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused, color }) => (
            <View className={`p-1 ${focused ? "bg-green-100 rounded-xl" : ""}`}>
              <Ionicons
                name={focused ? "chatbubble" : "chatbubble-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="ManageRequests"
        options={{
          title: "Requests",
          tabBarIcon: ({ focused, color }) => (
            <View className={`p-1 ${focused ? "bg-green-100 rounded-xl" : ""}`}>
              <Ionicons
                name={focused ? "git-pull-request" : "git-pull-request-outline"}
                size={24}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
