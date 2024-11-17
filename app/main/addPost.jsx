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
const addPost = () => {
  const { showError, showSuccess, showInfo } = useToast();
  const { user } = useUser();
  const streamApiKey = "p9mpz956q36h";
  const [client, setClient] = useState(null);
  const navigation = useNavigation();
  useEffect(() => {
    const initChat = async () => {
      try {
        const chatClient = StreamChat.getInstance(streamApiKey);
        await chatClient.connectUser(
          {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`, // Use Clerk user info
          },
          chatClient.devToken(user.id) // For dev purposes, use devToken
        );
        setClient(chatClient); // Set the client state
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };
    initChat();

    // Cleanup on unmount
    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [user.id]);
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
      console.log("Channel created:", channel);
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  // Check if user is defined before accessing user.id
  if (!user) {
    console.error("User is not defined");
    return null; // or return a loading indicator
  }

  const [postContent, setPostContent] = useState(""); // State for post content
  const [plantType, setPlantType] = useState(""); // State for plant type
  const [plantImage, setPlantImage] = useState(null); // State for plant image
  const [location, setLocation] = useState(""); // State for location
  const db = getFirestore(app);
  const storage = getStorage(app);
  const [open, setOpen] = useState(false);
  const [graftTransfers, setGraftTransfers] = useState([]); // State for graft transfers
  const [loading, setLoading] = useState(true); // State for loading
  const [userNames, setUserNames] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingRequest, setLoadingRequest] = useState(false); // State for loading request
  const [selectedTransferId, setSelectedTransferId] = useState(null); // State to track selected transfer ID
  usePushNotifications(); // Call the custom hook for notifications

  const handleOpenSheet = () => {
    setOpen(true);
  };

  const handleCloseSheet = () => {
    setOpen(false);
  };
  // Initialize Firebase Storage

  const handleImagePicker = async () => {
    try {
      // Request permission to access the media library
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Denied",
          "Permission to access camera roll is required!"
        );
        return;
      }

      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        console.log("Image Picker Result:", result); // Log the result for debugging
        setPlantImage(result); // Set the selected image object
      }
    } catch (error) {
      console.error("Error picking image: ", error);
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

    console.log("Selected Plant Image:", plantImage); // Log the plant image object

    try {
      // Ensure plantImage.assets is defined and has at least one item
      if (!plantImage.assets || plantImage.assets.length === 0) {
        console.error("Image assets are undefined or empty");
        showError("Error", "Image assets are undefined or empty.");
        return;
      }

      const imageUri = plantImage.assets[0].uri; // Access the URI correctly
      console.log("Image URI:", imageUri); // Log the image URI for debugging

      // Ensure imageUri is defined
      if (!imageUri) {
        console.error("Image URI is undefined");
        showError("Error", "Image URI is undefined.");
        return;
      }

      // Upload image to Firebase Storage
      const imageRef = ref(
        storage,
        `graftTransfers/${imageUri.split("/").pop()}`
      ); // Use the image name from the URI
      const response = await fetch(imageUri);
      const blob = await response.blob(); // Convert the image to a blob
      await uploadBytes(imageRef, blob); // Upload the image

      // Get the download URL
      const imageUrl = await getDownloadURL(imageRef);

      // Save post details to Firestore, including user ID
      const docRef = await addDoc(collection(db, "graftTransfers"), {
        content: postContent,
        plantType: plantType, // Added plant type
        plantImage: imageUrl, // Store the image URL
        location: location, // Added location
        userId: user.id, // Save the user ID from Clerk
      });
      console.log("Document written with ID: ", docRef.id);

      showSuccess(
        "Post Created 🎉",
        "Graft transfer post created successfully! ✅"
      );

      // Reset fields to default state
      setPostContent("");
      setPlantType("");
      setPlantImage(null);
      setLocation("");
    } catch (error) {
      console.error("Error adding document: ", error);
      showError(
        "Error Adding Document 🚫",
        "An error occurred while adding the document. ❌"
      );
    }
  };
  // Use Clerk API to fetch user by ID
  const fetchUserById = async (userId) => {
    const apiUrl = `https://api.clerk.dev/v1/users/${userId}`;
    const apiKey = "sk_test_eTkzEx0tcIksKsSTsgRMP4VTyKLIE1jZKHzrKMhnzR"; // Replace with your Clerk API key

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

      const user = await response.json();
      console.log(user);
      return user;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
    }
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
  // Fetch graft transfers data from Firestore
  useEffect(() => {
    const fetchGraftTransfers = async () => {
      setLoading(true); // Set loading to true before fetching
      try {
        const querySnapshot = await getDocs(collection(db, "graftTransfers"));
        const transfers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setGraftTransfers(transfers); // Set the fetched data to state

        // Fetch user names based on user IDs
        const userIds = transfers.map((transfer) => transfer.userId);
        const uniqueUserIds = [...new Set(userIds)];
        console.log(uniqueUserIds); // Get unique user IDs
        const userDetails = await Promise.all(
          uniqueUserIds.map(async (id) => {
            const user = await fetchUserById(id); // Fetch user details from Clerk
            return {
              id,
              name: user
                ? user.first_name || user.last_name || "Unknown"
                : "Unknown",
            };
          })
        );
        console.log(userDetails);
        const userNameMap = userDetails.reduce((acc, user) => {
          acc[user.id] = user.name; // Map user ID to user name
          return acc;
        }, {});
        setUserNames(userNameMap); // Set user names in state
      } catch (error) {
        console.error("Error fetching graft transfers: ", error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    fetchGraftTransfers(); // Call the fetch function
  }, [db]); // Dependency array includes db

  // Request notification permissions
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

  // Function to handle transfer request
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
      showError(
        "Notification Error 🚫",
        "An error occurred while sending the notification. ❌"
      );
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
      showError(
        "Notification Error 🚫",
        "An error occurred while sending the notification. ❌"
      );
      console.error("Error sending push notification:", error);
    }
  };
  const sendNotification = async (userId) => {
    const user = await fetchUserById(userId);
    const expoToken = user.public_metadata.pushToken;
    console.log(expoToken);
    await sendPushNotification(expoToken);
  };
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
