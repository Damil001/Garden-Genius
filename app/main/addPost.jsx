import {
  View,
  Text,
  TextInput,
  Image,
  Alert,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"; // Added StyleSheet and ScrollView
import React, { useState, useEffect } from "react"; // Added useState and useEffect
import app from "../../firebaseConfig"; // Adjust the path
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker"; // Importing Expo Image Picker
import { useUser } from "@clerk/clerk-react";
import { MaterialIcons } from "@expo/vector-icons";
import { Sheet } from "@tamagui/sheet"; // Importing BottomSheet from Temagui
import { Ionicons } from "@expo/vector-icons";
import { Button, XStack, YStack, Card } from "tamagui";
import Toast from "react-native-toast-message"; // Import Toast
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications"; // Import Expo Notifications
import { usePushNotifications } from "../../hooks/usePushNotificatio"; // Import your custom hook
import { useNavigation } from "@react-navigation/native";
import { StreamChat } from "stream-chat";
import { updateUser } from "@clerk/clerk-expo";
import useToast from "../../hooks/useToast";
import { Redirect } from "expo-router";
const addPost = () => {
  // All hooks at the top
  const { showError, showSuccess, showInfo } = useToast();
  const { user, isLoaded } = useUser();
  const navigation = useNavigation();
  const streamApiKey = "p9mpz956q36h";

  // All useState hooks
  const [client, setClient] = useState(null);
  const [postContent, setPostContent] = useState("");
  const [plantType, setPlantType] = useState("");
  const [plantImage, setPlantImage] = useState(null);
  const [location, setLocation] = useState("");
  const [open, setOpen] = useState(false);
  const [graftTransfers, setGraftTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState(null);

  // Firebase initialization
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Push notifications hook
  usePushNotifications();

  // Chat initialization effect
  useEffect(() => {
    const initChat = async () => {
      if (!user) return;

      try {
        const chatClient = StreamChat.getInstance(streamApiKey);
        await chatClient.connectUser(
          {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
          },
          chatClient.devToken(user.id)
        );
        setClient(chatClient);
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initChat();

    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [user]);

  // Fetch graft transfers effect
  useEffect(() => {
    let isMounted = true;

    const fetchGraftTransfers = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "graftTransfers"));
        const transfers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (!isMounted) return;

        setGraftTransfers(transfers);

        const userIds = transfers.map((transfer) => transfer.userId);
        const uniqueUserIds = [...new Set(userIds)];

        const userDetails = await Promise.all(
          uniqueUserIds.map(async (id) => {
            const userData = await fetchUserById(id);
            return {
              id,
              name: userData
                ? userData.first_name || userData.last_name || "Unknown"
                : "Unknown",
            };
          })
        );

        if (!isMounted) return;

        const userNameMap = userDetails.reduce((acc, user) => {
          acc[user.id] = user.name;
          return acc;
        }, {});

        setUserNames(userNameMap);
      } catch (error) {
        console.error("Error fetching graft transfers:", error);
        if (isMounted) {
          showError("Error", "Failed to fetch transfers");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchGraftTransfers();

    return () => {
      isMounted = false;
    };
  }, [db, user]);

  // Notifications permission effect
  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await Notifications.requestPermissionsAsync();
        if (newStatus !== "granted") {
          showError(
            "Permission not granted",
            "You need to enable notifications to use this feature."
          );
        }
      }
    };

    requestPermissions();
  }, []);

  // Early returns for loading and auth
  if (!isLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/" />;
  }

  // Helper Functions
  const fetchUserById = async (userId) => {
    const apiUrl = `https://api.clerk.dev/v1/users/${userId}`;
    const apiKey = "sk_test_eTkzEx0tcIksKsSTsgRMP4VTyKLIE1jZKHzrKMhnzR";

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error fetching user");
      }

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      return null;
    }
  };

  const createDirectMessageChannel = async (recipientId) => {
    if (!client) {
      console.error("Stream client is not initialized.");
      return;
    }

    try {
      const channelId = Math.random().toString(36).substring(2, 42);
      const channel = client.channel("messaging", channelId, {
        members: [user.id, recipientId],
      });
      await channel.watch();
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Denied",
          "Permission to access camera roll is required!"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setPlantImage(result);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showError("Error", "An error occurred while picking the image.");
    }
  };

  const handleSubmit = async () => {
    if (!plantImage) {
      showError(
        "No Image Selected 🚫",
        "Please select an image before submitting. ❌"
      );
      return;
    }

    try {
      if (!plantImage.assets || plantImage.assets.length === 0) {
        showError("Error", "Image assets are undefined or empty.");
        return;
      }

      const imageUri = plantImage.assets[0].uri;
      if (!imageUri) {
        showError("Error", "Image URI is undefined.");
        return;
      }

      const imageRef = ref(
        storage,
        `graftTransfers/${imageUri.split("/").pop()}`
      );
      const response = await fetch(imageUri);
      const blob = await response.blob();
      await uploadBytes(imageRef, blob);

      const imageUrl = await getDownloadURL(imageRef);

      const docRef = await addDoc(collection(db, "graftTransfers"), {
        content: postContent,
        plantType,
        plantImage: imageUrl,
        location,
        userId: user.id,
      });

      showSuccess(
        "Post Created 🎉",
        "Graft transfer post created successfully! ✅"
      );

      setPostContent("");
      setPlantType("");
      setPlantImage(null);
      setLocation("");
      setOpen(false);
    } catch (error) {
      console.error("Error adding document:", error);
      showError(
        "Error Adding Document 🚫",
        "An error occurred while adding the document. ❌"
      );
    }
  };

  const createGraftRequest = async (transferId, initiatorId) => {
    try {
      await addDoc(collection(db, "graftRequests"), {
        transferId,
        requesterId: user.id,
        ownerId: initiatorId,
      });
    } catch (error) {
      console.error("Error adding graft request:", error);
      showError("Error", "Failed to create graft request");
    }
  };

  const handleTransferRequest = async (transferId) => {
    setLoadingRequest(true);

    const transfer = graftTransfers.find((t) => t.id === transferId);
    if (!transfer) {
      setLoadingRequest(false);
      return;
    }

    const recipientUserId = transfer.userId;

    if (recipientUserId === user.id) {
      showError("Error", "You cannot request a transfer from yourself.");
      setLoadingRequest(false);
      return;
    }

    const notifiedUser = await fetchUserById(recipientUserId);

    if (!notifiedUser) {
      setLoadingRequest(false);
      return;
    }

    try {
      const notificationContent = {
        to: recipientUserId,
        title: "Graft Transfer Request",
        body: `${
          user.firstName || user.lastName || "User"
        } has requested a graft transfer.`,
      };

      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null,
      });

      showSuccess(
        "Transfer Request Sent 📩",
        "Your request for transfer has been sent successfully! ✅"
      );
    } catch (error) {
      console.error("Error sending notification:", error);
      showError("Error", "Failed to send notification");
    } finally {
      setLoadingRequest(false);
    }
  };

  const sendPushNotification = async (expoToken) => {
    try {
      const message = {
        to: expoToken,
        sound: "default",
        title: `A message from ${user.firstName}`,
        body: `${user.firstName} has requested a graft transfer.`,
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

      showSuccess(
        "Notification Sent 📩",
        "Your notification has been sent successfully! ✅"
      );
    } catch (error) {
      console.error("Error sending push notification:", error);
      showError("Error", "Failed to send push notification");
    }
  };

  const sendNotification = async (userId) => {
    const recipientUser = await fetchUserById(userId);
    const expoToken = recipientUser.public_metadata.pushToken;
    await sendPushNotification(expoToken);
  };
  const createGradftRequest = async (transferId, initiatorId) => {
    try {
      const docRef = await addDoc(collection(db, "graftRequests"), {
        transferId: transferId,
        requesterId: user.id,
        ownerId: initiatorId,
      });
      console.log("Document written with ID: ", docRef.id);
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };
  const handleOpenSheet = () => setOpen(true);
  const handleCloseSheet = () => setOpen(false);

  // Keep all your imports and logic the same, just update the return JSX part:

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Search Header */}
        <View className="bg-green-600 pt-14 pb-6 px-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 relative">
              <TextInput
                placeholder="Search plant transfers..."
                placeholderTextColor="white"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="bg-white/20 px-4 py-2.5 rounded-xl text-white pr-10"
              />
              <MaterialIcons
                name="search"
                size={20}
                color="white"
                style={{ position: "absolute", right: 12, top: 12 }}
              />
            </View>
            <TouchableOpacity
              onPress={() => setOpen(true)}
              className="bg-white/20 p-3 rounded-xl"
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Graft Transfers List */}
        <View className="px-4 -mt-4">
          {loading ? (
            <ActivityIndicator size="large" color="#16a34a" className="py-8" />
          ) : (
            <View className="space-y-4 pb-4">
              {graftTransfers
                .filter((transfer) =>
                  transfer.plantType
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
                )
                .map((transfer) => (
                  <View
                    key={transfer.id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* User Info */}
                    <View className="p-4 flex-row items-center border-b border-gray-100">
                      <View className="bg-green-100 p-2 rounded-full">
                        <Ionicons name="leaf" size={20} color="#16a34a" />
                      </View>
                      <View className="ml-3">
                        <Text className="text-base font-semibold text-gray-800">
                          {userNames[transfer.userId] || "Unknown"}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {transfer.location}
                        </Text>
                      </View>
                    </View>

                    {/* Transfer Image */}
                    <Image
                      source={{ uri: transfer.plantImage }}
                      className="w-full h-56"
                      style={{ resizeMode: "cover" }}
                    />

                    {/* Transfer Content */}
                    <View className="p-4">
                      <Text className="text-lg font-semibold text-gray-800 mb-2">
                        {transfer.plantType}
                      </Text>
                      <Text className="text-gray-600 leading-relaxed">
                        {transfer.content}
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    {user.id !== transfer.userId && (
                      <View className="p-4 bg-gray-50 space-y-2">
                        <TouchableOpacity
                          onPress={() => {
                            sendNotification(transfer.userId);
                            createGradftRequest(transfer.id, transfer.userId);
                          }}
                          className="bg-green-600 py-3 rounded-xl flex-row items-center justify-center"
                          disabled={loadingRequest}
                        >
                          {loadingRequest ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <>
                              <Text className="text-white font-medium mr-2">
                                Request Transfer
                              </Text>
                              <Ionicons
                                name="arrow-forward"
                                size={18}
                                color="white"
                              />
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
            </View>
          )}
        </View>

        {/* Create Post Sheet */}
        <Sheet
          modal
          open={open}
          onOpenChange={setOpen}
          snapPoints={[70]}
          dismissOnSnapToBottom
        >
          <Sheet.Frame className="bg-white rounded-t-3xl">
            <Sheet.Handle />
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-800">
                Share Your Plant Transfer
              </Text>
            </View>

            <ScrollView className="p-4">
              <View className="space-y-4">
                <TextInput
                  placeholder="Plant type..."
                  value={plantType}
                  onChangeText={setPlantType}
                  className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800"
                />

                <TextInput
                  placeholder="Describe your plant transfer..."
                  value={postContent}
                  onChangeText={setPostContent}
                  multiline
                  numberOfLines={4}
                  className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800"
                />

                <TextInput
                  placeholder="Location..."
                  value={location}
                  onChangeText={setLocation}
                  className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800"
                />

                <TouchableOpacity
                  onPress={handleImagePicker}
                  className="bg-gray-50 p-4 rounded-xl flex-row items-center justify-center border-2 border-dashed border-gray-200"
                >
                  <Ionicons name="image-outline" size={24} color="#16a34a" />
                  <Text className="ml-2 text-gray-600">Add Plant Photo</Text>
                </TouchableOpacity>

                {plantImage && (
                  <View className="rounded-xl overflow-hidden">
                    <Image
                      source={{ uri: plantImage.assets[0].uri }}
                      className="w-full h-48"
                      style={{ resizeMode: "cover" }}
                    />
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleSubmit}
                  className="bg-green-600 py-3 rounded-xl flex-row items-center justify-center"
                >
                  <Text className="text-white font-medium">
                    Share Transfer Listing
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Sheet.Frame>
        </Sheet>
      </ScrollView>
    </View>
  );
  // Remove the StyleSheet as we're using Tailwind classes now
};

// Updated styles for a modern garden-themed look
const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: "#fff",
    padding: 10,
  },
});

export default addPost;
