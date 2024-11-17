import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Sheet, Button, XStack, YStack, Card, H3 } from "tamagui";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "../../firebaseConfig";

// Blog categories based on gardening
const BLOG_CATEGORIES = [
  "Indoor Plants",
  "Outdoor Gardens",
  "Plant Care Tips",
  "Seasonal Gardening",
  "Vegetable Growing",
  "Herb Gardens",
  "Flower Gardens",
  "Garden Design",
  "Composting",
  "Plant Disease Control",
  "Garden Tools",
  "Sustainable Gardening",
];

// Event categories
const EVENT_CATEGORIES = [
  "Workshop",
  "Plant Sale",
  "Garden Tour",
  "Community Planting",
  "Expert Talk",
  "Garden Show",
  "Farmers Market",
  "Composting Workshop",
  "Garden Maintenance",
  "Seasonal Celebration",
];

export default function AdminDashboard() {
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [activeTab, setActiveTab] = useState("blogs");
  const [items, setItems] = useState([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const router = useRouter();

  // Add logout handler
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          router.replace("/main");
        },
      },
    ]);
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, activeTab));
      const fetchedItems = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(fetchedItems);
    } catch (error) {
      console.error("Error fetching items:", error);
      Alert.alert("Error", "Failed to fetch items");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
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
        setSelectedImage(result);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleCreate = async () => {
    if (!title || !content || !category) {
      Alert.alert(
        "Error",
        "Please fill in all required fields including category"
      );
      return;
    }

    try {
      setIsLoading(true);

      let imageUrl = null;
      if (selectedImage) {
        const imageUri = selectedImage.assets[0].uri;
        const imageRef = ref(
          storage,
          `${activeTab}/${Date.now()}-${imageUri.split("/").pop()}`
        );
        const response = await fetch(imageUri);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      }

      const newItem = {
        title,
        content,
        category,
        ...(activeTab === "blogs" ? {} : { date, location, description }),
        image: imageUrl,
        createdAt: new Date().toISOString(),
        viewed: 0,
        likesCount: 0,
        likedBy: [],
      };

      const docRef = await addDoc(collection(db, activeTab), newItem);
      setItems((prev) => [{ id: docRef.id, ...newItem }, ...prev]);
      Alert.alert("Success", "Item created successfully");

      resetForm();
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error creating item:", error);
      Alert.alert("Error", "Failed to create item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingItem || !title || !content || !category) {
      Alert.alert(
        "Error",
        "Please fill in all required fields including category"
      );
      return;
    }

    try {
      setIsLoading(true);

      let imageUrl = null;
      if (selectedImage) {
        const imageUri = selectedImage.assets[0].uri;
        const imageRef = ref(
          storage,
          `${activeTab}/${Date.now()}-${imageUri.split("/").pop()}`
        );
        const response = await fetch(imageUri);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      }

      const updateData = {
        title,
        content,
        category,
        ...(activeTab === "blogs" ? {} : { date, location, description }),
        ...(imageUrl && { image: imageUrl }),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, activeTab, editingItem.id), updateData);
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem.id ? { ...item, ...updateData } : item
        )
      );
      Alert.alert("Success", "Item updated successfully");

      resetForm();
      setIsSheetOpen(false);
    } catch (error) {
      console.error("Error updating item:", error);
      Alert.alert("Error", "Failed to update item");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteDoc(doc(db, activeTab, id));
              setItems((prev) => prev.filter((item) => item.id !== id));
              Alert.alert("Success", "Item deleted successfully");
            } catch (error) {
              console.error("Error deleting item:", error);
              Alert.alert("Error", "Failed to delete item");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("");
    setDate("");
    setLocation("");
    setDescription("");
    setSelectedImage(null);
    setEditingItem(null);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const Header = () => (
    <View className="bg-white px-6 py-6 border-b border-gray-200">
      <View className="flex-col space-between gap-y-4 justify-center mb-6">
        <Logo />
        <Navigation />
      </View>
      <SearchAndFilter />
    </View>
  );

  const Logo = () => (
    <View className="flex-row items-center space-x-3">
      <Ionicons name="leaf" size={28} color="#15803d" />
      <Text className="text-3xl font-bold text-green-700">Garden Admin</Text>
    </View>
  );

  const Navigation = () => (
    <View className="flex-row space-between items-center gap-4 space-x-6">
      <TabButton
        label="Blogs"
        isActive={activeTab === "blogs"}
        onPress={() => setActiveTab("blogs")}
      />
      <TabButton
        label="Events"
        isActive={activeTab === "events"}
        onPress={() => setActiveTab("events")}
      />
      <LogoutButton />
    </View>
  );

  const TabButton = ({ label, isActive, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-5 py-3 rounded-lg ${
        isActive ? "bg-green-600" : "bg-gray-100"
      }`}
    >
      <Text className={isActive ? "text-white" : "text-gray-600"}>{label}</Text>
    </TouchableOpacity>
  );

  const LogoutButton = () => (
    <TouchableOpacity
      onPress={handleLogout}
      className="flex-row items-center space-x-2 bg-red-50 px-4 py-3 rounded-lg"
    >
      <Ionicons name="log-out-outline" size={22} color="#dc2626" />
      <Text className="text-red-600 font-medium">Logout</Text>
    </TouchableOpacity>
  );

  const SearchAndFilter = () => (
    <View className="flex-row space-between items-center gap-4">
      <TextInput
        placeholder="Search..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        className="flex-1 h-12 px-4 border border-gray-200 rounded-lg bg-white"
      />
      <TouchableOpacity
        onPress={() => {
          resetForm();
          setIsSheetOpen(true);
        }}
        className="w-12 h-12 bg-green-600 rounded-lg items-center justify-center"
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" />
      <Header />
      {/* Content List */}
      <ScrollView className="flex-1 px-4 py-4 gap-6">
        <View className="space-y-4 mb-4 my-4">
          {filteredItems.map((item) => (
            <View
              key={item.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {item.image && (
                <Image
                  source={{ uri: item.image }}
                  className="w-full h-48"
                  resizeMode="cover"
                />
              )}
              <View className="p-4">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800 mb-1">
                      {item.title}
                    </Text>
                    <View className="bg-green-50 self-start px-2 py-1 rounded-md">
                      <Text className="text-green-600 text-xs">
                        {item.category}
                      </Text>
                    </View>
                    <Text className="text-gray-600 mt-2" numberOfLines={2}>
                      {item.content}
                    </Text>
                    {activeTab === "events" && (
                      <View className="mt-2 space-y-1">
                        <Text className="text-gray-600">📅 {item.date}</Text>
                        <Text className="text-gray-600">
                          📍 {item.location}
                        </Text>
                        <Text className="text-gray-600">
                          {item.description}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => {
                        setEditingItem(item);
                        setTitle(item.title);
                        setContent(item.content);
                        setCategory(item.category);
                        setDate(item.date || "");
                        setLocation(item.location || "");
                        setDescription(item.description || "");
                        setIsSheetOpen(true);
                      }}
                      className="p-2 bg-green-50 rounded-full"
                    >
                      <MaterialIcons name="edit" size={20} color="#16a34a" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id)}
                      className="p-2 bg-red-50 rounded-full"
                    >
                      <MaterialIcons name="delete" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add/Edit Sheet */}
      <Sheet
        modal={true}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        snapPoints={[80]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame className="bg-white p-4" style={styles.sheetContainer}>
          <Sheet.Handle />
          <ScrollView>
            <View className="space-y-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-green-700">
                  {editingItem ? "Edit" : "New"}{" "}
                  {activeTab === "blogs" ? "Blog" : "Event"}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsSheetOpen(false)}
                  className="p-2 bg-gray-100 rounded-full"
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <TextInput
                placeholder="Title"
                value={title}
                onChangeText={setTitle}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white"
              />

              {/* Category Selection */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="py-2"
              >
                {(activeTab === "blogs"
                  ? BLOG_CATEGORIES
                  : EVENT_CATEGORIES
                ).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`mr-2 px-4 py-2 rounded-full ${
                      category === cat ? "bg-green-600" : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={
                        category === cat ? "text-white" : "text-gray-600"
                      }
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                placeholder="Content"
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
                className="w-full p-3 border border-gray-200 rounded-lg bg-white h-24"
              />

              {activeTab === "events" && (
                <View className="space-y-4">
                  <TextInput
                    placeholder="Date (YYYY-MM-DD)"
                    value={date}
                    onChangeText={setDate}
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                  />
                  <TextInput
                    placeholder="Location"
                    value={location}
                    onChangeText={setLocation}
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white"
                  />
                  <TextInput
                    placeholder="Description"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    className="w-full p-3 border border-gray-200 rounded-lg bg-white h-24"
                  />
                </View>
              )}

              <TouchableOpacity
                onPress={handleImagePicker}
                className="w-full p-3 bg-green-50 rounded-lg flex-row items-center justify-center space-x-2 mb-3 gap-3 mt-3"
              >
                <Ionicons name="image" size={24} color="#16a34a" />
                <Text className="text-green-700">
                  {selectedImage ? "Change Image" : "Add Image"}
                </Text>
              </TouchableOpacity>

              {selectedImage && (
                <View className="relative">
                  <Image
                    source={{ uri: selectedImage.assets[0].uri }}
                    className="w-full h-48 rounded-lg"
                  />
                  <TouchableOpacity
                    onPress={() => setSelectedImage(null)}
                    className="absolute top-2 right-2 p-2 bg-red-100 rounded-full"
                  >
                    <Ionicons name="close" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                onPress={editingItem ? handleUpdate : handleCreate}
                disabled={isLoading}
                className={`w-full p-4 rounded-lg flex-row items-center justify-center space-x-2 ${
                  isLoading ? "bg-green-400" : "bg-green-600 gap-3"
                }`}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="white" />
                    <Text className="text-white text-lg">
                      {editingItem ? "Updating..." : "Creating..."}
                    </Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons
                      name={editingItem ? "update" : "add-circle-outline"}
                      size={24}
                      color="white"
                    />
                    <Text className="text-white text-lg">
                      {editingItem ? "Update" : "Create"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Sheet.Frame>
      </Sheet>

      {isLoading && (
        <View className="absolute  top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <View className="bg-white p-6 rounded-xl shadow-lg">
            <ActivityIndicator size="large" color="#16a34a" />
            <Text className="text-green-600 mt-4 text-center font-medium">
              {editingItem ? "Updating..." : "Creating..."}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: "#fff",
    padding: 24,
  },
});
