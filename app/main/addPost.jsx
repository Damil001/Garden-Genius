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
    await sendPushNotification(expoToken);
  };
  return (
    <>
      <ScrollView style={styles.container}>
        <XStack justifyContent="space-between" gap={10} alignItems="center">
          <TextInput
            style={styles.searchInput} // Add a style for the search input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by plant type"
            flexGrow={1}
          />
          <TouchableOpacity onPress={handleOpenSheet}>
            <Ionicons name="add-circle-outline" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </XStack>
        <YStack>
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            graftTransfers
              .filter((transfer) =>
                transfer.plantType
                  .toLowerCase()
                  .includes(searchQuery.toLowerCase())
              ) // Filter based on search query for plant type
              .map((transfer) => (
                <Card style={styles.card}>
                  <Image
                    source={{ uri: transfer.plantImage }}
                    style={styles.cardImage}
                  />
                  <View style={styles.cardContentContainer}>
                    <Text style={styles.cardTitle}>{transfer.plantType}</Text>
                    <Text style={styles.cardContent}>{transfer.content}</Text>
                    <Text style={styles.cardLocation}>
                      <Ionicons
                        name="location-outline"
                        size={14}
                        color="#888"
                      />{" "}
                      {transfer.location}
                    </Text>
                    <Text style={styles.cardUser}>
                      Created by: {userNames[transfer.userId] || "Unknown"}
                    </Text>
                    {user.id !== transfer.userId && (
                      <YStack gap={10} marginTop={10}>
                        <Button
                          onPress={() => {
                            sendNotification(transfer.userId);
                            createGradftRequest(transfer.id, transfer.userId);
                          }}
                          theme="green"
                          iconAfter={
                            <Ionicons
                              name="arrow-forward-circle-outline"
                              size={24}
                              color="#fff"
                            />
                          }
                          disabled={loadingRequest}
                        >
                          {loadingRequest ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            "Request Transfer"
                          )}
                        </Button>
                        <Button
                          onPress={() =>
                            createDirectMessageChannel(transfer.userId)
                          }
                          themeInverse
                          iconAfter={
                            <Ionicons
                              name="chatbubbles-outline"
                              size={24}
                              color="#4CAF50"
                            />
                          }
                          disabled={loadingRequest}
                        >
                          Chat
                        </Button>
                      </YStack>
                    )}
                  </View>
                </Card>
              ))
          )}
        </YStack>

        <Sheet
          modal
          open={open}
          onOpenChange={setOpen}
          snapPoints={[80]}
          dismissOnSnapToBottom
        >
          <Sheet.Overlay opacity={0} />
          <Sheet.Frame style={styles.sheetFrame}>
            <Sheet.Handle />
            <Sheet.ScrollView contentContainerStyle={styles.sheetContent}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Graft Transfer Post</Text>
                <TouchableOpacity onPress={handleCloseSheet}>
                  <Ionicons name="close" size={24} color="#4CAF50" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                value={postContent}
                onChangeText={setPostContent}
                placeholder="Enter your post content"
              />
              <TextInput
                style={styles.input}
                value={plantType}
                onChangeText={setPlantType}
                placeholder="Enter plant type"
              />
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location"
              />
              <Button
                iconAfter={<Ionicons name="image" size={24} color="#4CAF50" />}
                size="$4"
                onPress={handleImagePicker}
                variant="outline"
                marginTop={20}
                themeInverse
              >
                Pick Plant Image
              </Button>
              {plantImage && (
                <Image
                  source={{ uri: plantImage.assets[0].uri }}
                  style={styles.image}
                />
              )}
              <Button
                iconAfter={<Ionicons name="leaf" size={24} color="#4CAF50" />}
                size="$4"
                onPress={handleSubmit}
                theme="green"
                marginTop={20}
              >
                Create a Graft Listing
              </Button>
            </Sheet.ScrollView>
          </Sheet.Frame>
        </Sheet>
      </ScrollView>
    </>
  );
};

// Updated styles for a modern garden-themed look
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2E7D32", // Dark green color
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#4CAF50", // Green border
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginVertical: 10,
  },
  sheetFrame: {
    backgroundColor: "#ffffff", // White background for the sheet
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  sheetContent: {
    padding: 20, // Increased padding for better spacing
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600", // Semi-bold for a modern look
    color: "#2E7D32", // Dark green color
  },
  button: {
    borderRadius: 10, // Rounded corners for buttons
    marginVertical: 10,
  },
  submitButton: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  submitButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    marginTop: 20,
    gap: 10,
  },
  pickImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 5,
    padding: 10,
    justifyContent: "center",
  },
  pickImageButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 150,
  },
  cardContentContainer: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  cardContent: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
  },
  cardLocation: {
    fontSize: 14,
    color: "#888",
    marginBottom: 10,
  },
  cardUser: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  harvestButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  chatButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  searchInput: {
    height: 50,
    borderColor: "#4CAF50", // Green border
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  transferButton: {
    marginTop: 10,
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
  },
});

export default addPost;
