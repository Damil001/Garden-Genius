import { SignedIn, SignedOut, useUser, useAuth } from "@clerk/clerk-expo";
import { Link, Redirect } from "expo-router";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState, useRef } from "react";
import Toast from "react-native-toast-message";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import BlogEventSection from "../../components/BlogCard";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Components
const WeatherSection = ({ weather, isLoading }) => {
  if (isLoading) {
    return (
      <View
        className="bg-white rounded-2xl p-4 mb-4 items-center justify-center"
        style={{ height: 120 }}
      >
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!weather) return null;

  const getWeatherIcon = (weatherCode) => {
    const codes = {
      0: "sunny",
      1: "partly-sunny",
      2: "partly-sunny",
      3: "cloudy",
      45: "cloudy",
      48: "cloudy",
      51: "rainy",
      53: "rainy",
      55: "rainy",
      61: "rainy",
      63: "rainy",
      65: "rainy",
      71: "snow",
      73: "snow",
      75: "snow",
      95: "thunderstorm",
    };
    return codes[weatherCode] || "partly-sunny";
  };

  return (
    <View className="bg-white rounded-2xl p-4 mb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        Weather Today
      </Text>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons
            name={getWeatherIcon(weather.weathercode)}
            size={32}
            color="#16a34a"
          />
          <View className="ml-3">
            <Text className="text-2xl font-bold text-gray-800">
              {Math.round(weather.temperature_2m)}°C
            </Text>
            <View className="flex-row items-center">
              <Ionicons name="water-outline" size={14} color="#666" />
              <Text className="text-gray-600 ml-1">
                {Math.round(weather.relativehumidity_2m)}%
              </Text>
            </View>
          </View>
        </View>
        <View>
          <View className="flex-row items-center">
            <Ionicons name="thermometer-outline" size={14} color="#666" />
            <Text className="text-gray-600 ml-1">
              Feels like {Math.round(weather.apparent_temperature)}°C
            </Text>
          </View>
          <View className="flex-row items-center mt-1">
            <Ionicons name="speedometer-outline" size={14} color="#666" />
            <Text className="text-gray-600 ml-1">
              {Math.round(weather.windspeed_10m)} km/h
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const NotificationCard = ({ notification }) => {
  if (!notification) return null;

  return (
    <View className="bg-white rounded-2xl p-4 mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-semibold text-gray-800">
          Latest Notification
        </Text>
        <View className="bg-green-100 px-2 py-1 rounded-full">
          <Text className="text-green-600 text-xs">New</Text>
        </View>
      </View>
      <Text className="text-gray-700 font-medium mb-1">
        {notification.request.content.title}
      </Text>
      <Text className="text-gray-600">{notification.request.content.body}</Text>
    </View>
  );
};

const QuickStats = () => (
  <View className="flex-row justify-between mb-6">
    <View className="bg-white rounded-xl p-4 flex-1 mr-2">
      <View className="bg-blue-50 p-2 rounded-full w-10 mb-2">
        <Ionicons name="water" size={20} color="#2563eb" />
      </View>
      <Text className="text-2xl font-bold text-gray-800">12</Text>
      <Text className="text-gray-600">Plants Watered</Text>
    </View>
    <View className="bg-white rounded-xl p-4 flex-1 ml-2">
      <View className="bg-green-50 p-2 rounded-full w-10 mb-2">
        <Ionicons name="leaf" size={20} color="#16a34a" />
      </View>
      <Text className="text-2xl font-bold text-gray-800">5</Text>
      <Text className="text-gray-600">Growing Plants</Text>
    </View>
  </View>
);

const GardenTips = () => (
  <View className="mb-4">
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-lg font-semibold text-gray-800">Garden Tips</Text>
      <TouchableOpacity>
        <Text className="text-green-600">See All</Text>
      </TouchableOpacity>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {[
        { title: "Spring Planting", icon: "leaf", color: "bg-green-50" },
        { title: "Pest Control", icon: "bug", color: "bg-red-50" },
        { title: "Watering Guide", icon: "water", color: "bg-blue-50" },
        { title: "Soil Care", icon: "earth", color: "bg-amber-50" },
      ].map((tip, index) => (
        <TouchableOpacity
          key={index}
          className="mr-3 bg-white rounded-xl p-4 w-32 items-center shadow-sm"
        >
          <View className={`${tip.color} p-3 rounded-full mb-2`}>
            <Ionicons name={tip.icon} size={24} color="#16a34a" />
          </View>
          <Text className="text-center text-gray-700 font-medium">
            {tip.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const CareEventsSection = ({ events }) => (
  <View className="mb-6">
    <View className="flex-row justify-between items-center mb-4">
      <Text className="text-lg font-semibold text-gray-800">Care Events</Text>
      <TouchableOpacity>
        <Text className="text-green-600 font-medium">View All</Text>
      </TouchableOpacity>
    </View>

    {events.length === 0 ? (
      <View className="bg-white rounded-2xl p-6 items-center">
        <View className="bg-gray-50 p-4 rounded-full mb-3">
          <Ionicons name="calendar-outline" size={24} color="#16a34a" />
        </View>
        <Text className="text-gray-600 text-center">
          No upcoming care events
        </Text>
      </View>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="space-x-3"
      >
        {events.map((event, index) => (
          <TouchableOpacity
            key={index}
            className="bg-white rounded-2xl p-4 shadow-sm"
            style={{ width: 200 }}
          >
            {/* Event Type Icon */}
            <View className="flex-row justify-between items-center mb-3">
              <View className="p-2 rounded-full bg-gray-50">
                <Text style={{ fontSize: 20 }}>{event.icon}</Text>
              </View>
              <Text
                className={`
                  text-xs font-medium px-2 py-1 rounded-full
                  ${
                    event.importance === "high"
                      ? "bg-red-50 text-red-600"
                      : "bg-green-50 text-green-600"
                  }
                `}
              >
                {event.type}
              </Text>
            </View>

            {/* Plant Name */}
            <Text
              className="text-gray-800 font-semibold text-lg mb-2"
              numberOfLines={1}
            >
              {event.plantName}
            </Text>

            {/* Date and Time */}
            <View className="flex-row items-center space-x-2">
              <Ionicons name="calendar-outline" size={16} color="#666666" />
              <Text className="text-gray-600 flex-1">{event.date}</Text>
            </View>

            {/* Additional Info (if available) */}
            {event.notes && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                <Text className="text-gray-600 text-sm" numberOfLines={2}>
                  {event.notes}
                </Text>
              </View>
            )}

            {/* Status Indicator */}
            <View className="absolute top-4 right-4">
              <View
                className={`h-2 w-2 rounded-full ${
                  event.completed ? "bg-green-500" : "bg-red-500"
                }`}
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    )}
  </View>
);

// Main Page Component
export default function Page() {
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notification, setNotification] = useState(false);
  const [weather, setWeather] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);
  const notificationListener = useRef();
  const responseListener = useRef();
  const { user, isLoaded } = useUser();
  const { signOut, isSignedIn } = useAuth();
  const [careEvents, setCareEvents] = useState([]);
  const db = getFirestore();

  // Save push token to Clerk
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
      console.log("Push token saved to Clerk:", token);
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  };

  // Register for push notifications
  async function registerForPushNotificationsAsync() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
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
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "Failed to get push notification permission",
        });
        return;
      }

      const projectId = "8f4c884e-827c-46cd-9d48-13cc46384af2";
      try {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
          .data;
        return token;
      } catch (error) {
        console.error("Error getting push token:", error);
        return null;
      }
    }

    return null;
  }

  // Fetch weather data
  const fetchWeather = async () => {
    setIsLoadingWeather(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Location Permission Denied",
          text2: "Please enable location services to get weather information",
        });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relativehumidity_2m,apparent_temperature,weathercode,windspeed_10m`
      );

      setWeather(response.data.current);
      console.log(response.data.current);
    } catch (error) {
      console.error("Error fetching weather:", error);
      Toast.show({
        type: "error",
        text1: "Weather Error",
        text2: "Unable to fetch weather information",
      });
    } finally {
      setIsLoadingWeather(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchWeather(),
      registerForPushNotificationsAsync().then((token) => {
        if (token && user) {
          setExpoPushToken(token);
          savePushToken(token, user.id);
        }
      }),
    ]).finally(() => setRefreshing(false));
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchWeather();
      registerForPushNotificationsAsync().then((token) => {
        if (token) {
          setExpoPushToken(token);
          savePushToken(token, user.id);
        }
      });

      notificationListener.current =
        Notifications.addNotificationReceivedListener((notification) =>
          setNotification(notification)
        );

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) =>
          console.log(response)
        );

      return () => {
        notificationListener.current &&
          Notifications.removeNotificationSubscription(
            notificationListener.current
          );
        responseListener.current &&
          Notifications.removeNotificationSubscription(
            responseListener.current
          );
      };
    }
  }, [user]);

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

  // Fetch care events for the current user
  const fetchCareEvents = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "careEvents"),
        where("userId", "==", user.id)
      );
      const querySnapshot = await getDocs(q);
      const events = querySnapshot.docs.map((doc) => doc.data());
      setCareEvents(events.slice(0, 4)); // Get the first 4 events
    } catch (error) {
      console.error("Error fetching care events:", error);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchCareEvents();
    }
  }, [isLoaded, user]);

  return (
    <View className="flex-1 bg-gray-50">
      <SignedIn>
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View className="bg-green-600 pt-14 pb-6 px-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-white text-lg">Welcome back,</Text>
                <Text className="text-white text-2xl font-bold">
                  {isLoaded && user ? user.firstName : "Loading..."}
                </Text>
              </View>
              <TouchableOpacity
                onPress={signOut}
                className="bg-white/20 p-2 rounded-full"
              >
                <Ionicons name="log-out-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="px-4 -mt-4">
            <WeatherSection weather={weather} isLoading={isLoadingWeather} />
            <GardenTips />
            <QuickStats />
            <CareEventsSection events={careEvents} />
          </View>
          <BlogEventSection />
        </ScrollView>
      </SignedIn>
      <SignedOut>
        <Redirect href="/" />
      </SignedOut>
    </View>
  );
}
