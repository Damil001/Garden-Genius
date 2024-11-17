import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from "react-native";
import { Sheet } from "@tamagui/sheet";
import { YStack, XStack } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
} from "firebase/firestore";
import { MaterialIcons } from "@expo/vector-icons";
import app from "../firebaseConfig"; // Adjust path as needed
import { useUser } from "@clerk/clerk-expo";

// Blog Card Component
const BlogCard = ({ blog, onPress, onLike, user }) => {
  return (
    <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 min-w-[300px] max-w-[340px] mr-4">
      {/* Author Header */}
      <View className="p-4 flex-row items-center border-b border-gray-100">
        <View className="bg-green-100 p-2 rounded-full">
          <Ionicons name="book" size={20} color="#16a34a" />
        </View>
        <View className="ml-3">
          <Text className="text-base font-semibold text-gray-800">
            {blog.userName || "Admin"}
          </Text>
          <Text className="text-sm text-gray-500">{blog.category}</Text>
        </View>
      </View>

      {/* Blog Image */}
      <Image
        source={{ uri: blog.image || "/api/placeholder/300/200" }}
        className="w-full h-48"
        resizeMode="cover"
      />

      {/* Content */}
      <View className="p-4">
        <View className="mb-2">
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            {blog.title}
          </Text>
          <Text
            className="text-gray-600 text-sm leading-relaxed"
            numberOfLines={3}
          >
            {blog.content}
          </Text>
        </View>
      </View>

      {/* Interaction Footer */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={() => onLike(blog.id)}
            className="flex-row items-center space-x-1"
          >
            <Ionicons
              name={
                blog.likedBy?.includes(user?.id) ? "heart" : "heart-outline"
              }
              size={20}
              color={blog.likedBy?.includes(user?.id) ? "#16a34a" : "#666666"}
            />
            <Text className="text-gray-600 text-sm">
              {blog.likesCount || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-row items-center space-x-1">
            <Ionicons name="chatbubble-outline" size={18} color="#666666" />
            <Text className="text-gray-600 text-sm">Comment</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={onPress}
          className="bg-emerald-50 px-4 py-1.5 rounded-full"
        >
          <Text className="text-emerald-600 font-medium text-sm">
            Read More
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Event Card Component
const EventCard = ({ event, onPress, onLike, user }) => {
  return (
    <View className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
      {/* Author Header */}
      <View className="p-4 flex-row items-center border-b border-gray-100">
        <View className="bg-green-100 p-2 rounded-full">
          <Ionicons name="calendar" size={20} color="#16a34a" />
        </View>
        <View className="ml-3">
          <Text className="text-base font-semibold text-gray-800">
            {event.title}
          </Text>
          <Text className="text-sm text-emerald-600">{event.category}</Text>
        </View>
      </View>

      {/* Event Image */}
      <Image
        source={{ uri: event.image }}
        className="w-full h-48"
        resizeMode="cover"
      />

      {/* Content */}
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Ionicons name="location-outline" size={18} color="#666666" />
            <Text className="text-gray-600 text-sm ml-1">{event.location}</Text>
          </View>
          <View className="bg-emerald-50 px-3 py-1 rounded-full">
            <Text className="text-emerald-600 text-sm font-medium">
              {event.date}
            </Text>
          </View>
        </View>
        <Text
          className="text-gray-600 text-sm leading-relaxed"
          numberOfLines={3}
        >
          {event.description}
        </Text>
      </View>

      {/* Interaction Footer */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity
            onPress={() => onLike(event.id)}
            className="flex-row items-center space-x-1"
          >
            <Ionicons
              name={
                event.likedBy?.includes(user?.id) ? "heart" : "heart-outline"
              }
              size={20}
              color={event.likedBy?.includes(user?.id) ? "#16a34a" : "#666666"}
            />
            <Text className="text-gray-600 text-sm">
              {event.likesCount || 0}
            </Text>
          </TouchableOpacity>
          <View className="flex-row items-center space-x-1">
            <Ionicons name="people-outline" size={20} color="#666666" />
            <Text className="text-gray-600 text-sm">
              {event.attendees || 0}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onPress}
          className="bg-emerald-50 px-4 py-1.5 rounded-full"
        >
          <Text className="text-emerald-600 font-medium text-sm">
            View Details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Details Sheet Component
const DetailsSheet = ({ item, open, onClose, type }) => {
  if (!item) return null;

  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onClose}
      snapPoints={[85]}
      dismissOnSnapToBottom
      position={0}
    >
      <Sheet.Overlay className="bg-black/50" animation="lazy" />
      <Sheet.Frame
        className="bg-gray-50/95 backdrop-blur-sm rounded-t-3xl"
        style={styles.sheetContainer}
      >
        <Sheet.Handle className="bg-gray-300 w-12 h-1.5 rounded-full mx-auto my-4" />
        <ScrollView className="flex-1">
          <View className="relative">
            <Image
              source={{ uri: item.image }}
              className="w-full h-72"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={onClose}
              className="absolute top-4 right-4 bg-black/20 rounded-full p-2"
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <YStack className="px-6 py-4">
            <XStack className="justify-between items-start mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  {item.title}
                </Text>
                <Text className="text-emerald-600 text-base font-medium">
                  {item.category}
                </Text>
              </View>
              {type === "event" && (
                <View className="bg-emerald-50 px-4 py-2 rounded-full">
                  <Text className="text-emerald-600 text-sm font-medium">
                    {item.date}
                  </Text>
                </View>
              )}
            </XStack>

            {type === "event" && (
              <XStack className="items-center mb-6 bg-gray-100/80 p-3 rounded-xl">
                <Ionicons name="location" size={24} color="#374151" />
                <Text className="text-gray-700 text-base ml-2 font-medium">
                  {item.location}
                </Text>
              </XStack>
            )}

            <View className="mb-8 bg-white p-4 rounded-xl shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                {type === "event" ? "Description" : "Content"}
              </Text>
              <Text className="text-gray-700 text-base leading-7">
                {type === "event" ? item.description : item.content}
              </Text>
            </View>
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
};

// Main Component
const BlogEventSection = () => {
  const { user } = useUser();
  const [blogs, setBlogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const db = getFirestore(app);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      setLoading(true);
      // Fetch blogs
      const blogsQuery = query(
        collection(db, "blogs"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const blogDocs = await getDocs(blogsQuery);
      const blogData = blogDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch events
      const eventsQuery = query(
        collection(db, "events"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const eventDocs = await getDocs(eventsQuery);
      const eventData = eventDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setBlogs(blogData);
      setEvents(eventData);
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (itemId, type) => {
    const collectionName = type === "blog" ? "blogs" : "events";
    const itemRef = doc(db, collectionName, itemId);
    const items = type === "blog" ? blogs : events;
    const setItems = type === "blog" ? setBlogs : setEvents;
    const item = items.find((i) => i.id === itemId);

    try {
      if (item.likedBy?.includes(user.id)) {
        await updateDoc(itemRef, {
          likedBy: arrayRemove(user.id),
          likesCount: (item.likesCount || 1) - 1,
        });
      } else {
        await updateDoc(itemRef, {
          likedBy: arrayUnion(user.id),
          likesCount: (item.likesCount || 0) + 1,
        });
      }

      // Update local state
      setItems((prevItems) =>
        prevItems.map((i) =>
          i.id === itemId
            ? {
                ...i,
                likedBy: i.likedBy?.includes(user.id)
                  ? i.likedBy.filter((id) => id !== user.id)
                  : [...(i.likedBy || []), user.id],
                likesCount: i.likedBy?.includes(user.id)
                  ? (i.likesCount || 1) - 1
                  : (i.likesCount || 0) + 1,
              }
            : i
        )
      );
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Search Bar */}
        <View className="bg-emerald-600 pt-14 pb-6 px-4">
          <View className="flex-row items-center space-x-3">
            <View className="flex-1 relative">
              <TextInput
                placeholder="Search..."
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
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#16a34a" className="py-8" />
        ) : (
          <>
            {/* Blog Section */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center px-4 py-3">
                <Text className="text-xl font-semibold text-gray-800">
                  Latest Articles
                </Text>
                <TouchableOpacity>
                  <Text className="text-emerald-600 font-medium">See All</Text>
                </TouchableOpacity>
              </View>

              <View className="p-4">
                {filteredBlogs.map((blog) => (
                  <BlogCard
                    key={blog.id}
                    blog={blog}
                    user={user}
                    onPress={() => {
                      setSelectedItem(blog);
                      setSelectedType("blog");
                    }}
                    onLike={() => handleLike(blog.id, "blog")}
                  />
                ))}
              </View>
            </View>

            {/* Events Section */}
            <View className="mb-6 px-4">
              <View className="flex-row justify-between items-center py-3">
                <Text className="text-xl font-semibold text-gray-800">
                  Upcoming Events
                </Text>
                <TouchableOpacity>
                  <Text className="text-emerald-600 font-medium">See All</Text>
                </TouchableOpacity>
              </View>

              <View>
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    user={user}
                    onPress={() => {
                      setSelectedItem(event);
                      setSelectedType("event");
                    }}
                    onLike={() => handleLike(event.id, "event")}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {/* Details Sheet */}
        <DetailsSheet
          item={selectedItem}
          type={selectedType}
          open={!!selectedItem}
          onClose={() => {
            setSelectedItem(null);
            setSelectedType(null);
          }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: "#fff",
    padding: 24,
  },
});
export default BlogEventSection;
