import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { Sheet, Button, XStack, YStack, Card, H3 } from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import useToast from "../../hooks/useToast";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "../../firebaseConfig";
import { useUser } from "@clerk/clerk-expo";
import { MaterialIcons } from "@expo/vector-icons";

export default function CommunityForm() {
  const { user } = useUser();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const { showError, showSuccess, showInfo } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [plantImage, setPlantImage] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [plantType, setPlantType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null); // Selected post for commenting
  const [commentText, setCommentText] = useState(""); // Comment input
  const [comments, setComments] = useState([]); // Comments for the selected post
  const [isFetchingPosts, setIsFetchingPosts] = useState(true); // New state for loading posts
  const [searchQuery, setSearchQuery] = useState(""); // New state for search query

  const handleOpenSheet = () => {
    setIsSheetOpen(true);
  };

  const handleCloseSheet = () => {
    setIsSheetOpen(false);
  };

  // Function to handle image picker
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
      console.error("Error picking image: ", error);
      showError("Error", "An error occurred while picking the image.");
    }
  };

  // Function to create a post
  const handleCreatePost = async () => {
    if (!title || !content || !plantType) {
      showError("Error", "Please fill in all fields.");
      return;
    }
    if (!plantImage) {
      showError("Error", "Please select an image.");
      return;
    }
    try {
      setIsLoading(true);
      const imageUri = plantImage.assets[0].uri;
      const imageRef = ref(
        storage,
        `communityPosts/${imageUri.split("/").pop()}`
      );
      const response = await fetch(imageUri);
      const blob = await response.blob();
      await uploadBytes(imageRef, blob);
      const imageUrl = await getDownloadURL(imageRef);
      const docRef = await addDoc(collection(db, "communityPosts"), {
        title,
        content,
        plantType,
        plantImage: imageUrl,
        userName: `${user.firstName} ${user.lastName}`,
        likesCount: 0,
        likedBy: [],
      });
      console.log("Document written with ID: ", docRef.id);
      showSuccess(
        "Post Created 🎉",
        "Your post has been created successfully."
      );
      setTitle("");
      setContent("");
      setPlantType("");
      setPlantImage(null);
    } catch (error) {
      console.error("Error creating post: ", error);
      showError("Error", "An error occurred while creating the post.");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to fetch posts and set to state
  useEffect(() => {
    const fetchPosts = async () => {
      setIsFetchingPosts(true); // Start loading
      const querySnapshot = await getDocs(collection(db, "communityPosts"));
      const posts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(posts);
      setIsFetchingPosts(false); // End loading
    };
    fetchPosts();
  }, [db]);

  // Fetch comments for a selected post
  const fetchComments = async (postId) => {
    const postRef = doc(db, "communityPosts", postId);
    const commentsSnapshot = await getDocs(collection(postRef, "comments"));
    const postComments = commentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setComments(postComments);
  };

  // Function to add a comment to a post
  const handleComment = async (postId) => {
    if (!commentText) {
      showError("Error", "Comment cannot be empty.");
      return;
    }
    try {
      const postRef = doc(db, "communityPosts", postId);
      await addDoc(collection(postRef, "comments"), {
        userName: `${user.firstName} ${user.lastName}`,
        commentText,
        likesCount: 0,
        likedBy: [],
        createdAt: new Date(),
      });
      showSuccess("Comment Added", "Your comment has been added.");
      setCommentText(""); // Clear the comment input
      fetchComments(postId); // Refresh comments
    } catch (error) {
      console.error("Error adding comment: ", error);
      showError("Error", "An error occurred while adding the comment.");
    }
  };

  // Open comment modal for a specific post
  const handleOpenComment = (postId) => {
    setSelectedPost(postId); // Set the selected post
    fetchComments(postId); // Fetch the comments for this post
  };

  // Filter posts based on search query
  const filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLike = async (postId) => {
    const postRef = doc(db, "communityPosts", postId);
    const post = posts.find((p) => p.id === postId);
    const isLiked = post.likedBy?.includes(user.id);

    try {
      if (isLiked) {
        // User is removing their like
        await updateDoc(postRef, {
          likedBy: arrayRemove(user.id),
          likesCount: (post.likesCount || 0) - 1,
        });
        // Update state to reflect unlike
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likesCount: Math.max((p.likesCount || 1) - 1, 0),
                  likedBy: p.likedBy.filter((id) => id !== user.id),
                }
              : p
          )
        );
      } else {
        // User is liking the post
        await updateDoc(postRef, {
          likedBy: arrayUnion(user.id),
          likesCount: (post.likesCount || 0) + 1,
        });
        // Update state to reflect like
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likesCount: (p.likesCount || 0) + 1,
                  likedBy: [...(p.likedBy || []), user.id],
                }
              : p
          )
        );
      }
    } catch (error) {
      console.error("Error updating like: ", error);
      showError("Error", "An error occurred while liking the post.");
    }
  };
  const handleCommentLike = async (postId, commentId) => {
    const commentRef = doc(db, "communityPosts", postId, "comments", commentId);
    const comment = comments.find((c) => c.id === commentId);
    const isLiked = comment.likedBy?.includes(user.id);

    try {
      if (isLiked) {
        // User is removing their like on the comment
        await updateDoc(commentRef, {
          likedBy: arrayRemove(user.id),
          likesCount: (comment.likesCount || 0) - 1,
        });
        // Update comments state to reflect unlike
        setComments((prevComments) =>
          prevComments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likesCount: Math.max((c.likesCount || 1) - 1, 0),
                  likedBy: c.likedBy.filter((id) => id !== user.id),
                }
              : c
          )
        );
      } else {
        // User is liking the comment
        await updateDoc(commentRef, {
          likedBy: arrayUnion(user.id),
          likesCount: (comment.likesCount || 0) + 1,
        });
        // Update comments state to reflect like
        setComments((prevComments) =>
          prevComments.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likesCount: (c.likesCount || 0) + 1,
                  likedBy: [...(c.likedBy || []), user.id],
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Error updating comment like: ", error);
      showError("Error", "An error occurred while liking the comment.");
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Search Bar and Add Post Button */}
        <View className="bg-green-600 pt-14 pb-6 px-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1 relative">
              <TextInput
                placeholder="Search plant stories..."
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
              onPress={handleOpenSheet}
              className="bg-white/20 p-3 rounded-xl"
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Posts List */}
        <View className="px-4 -mt-4">
          {isFetchingPosts ? (
            <ActivityIndicator size="large" color="#16a34a" className="py-8" />
          ) : (
            <View className="space-y-4 pb-4">
              {filteredPosts.map((post) => (
                <View
                  key={post.id}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* User Info */}
                  <View className="p-4 flex-row items-center border-b border-gray-100">
                    <View className="bg-green-100 p-2 rounded-full">
                      <Ionicons name="leaf" size={20} color="#16a34a" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-base font-semibold text-gray-800">
                        {post.userName}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {post.plantType}
                      </Text>
                    </View>
                  </View>

                  {/* Post Image */}
                  <Image
                    source={{ uri: post.plantImage }}
                    className="w-full h-56"
                  />

                  {/* Post Content */}
                  <View className="p-4">
                    <Text className="text-lg font-semibold text-gray-800 mb-2">
                      {post.title}
                    </Text>
                    <Text className="text-gray-600 leading-relaxed">
                      {post.content}
                    </Text>
                  </View>

                  {/* Interaction Buttons */}
                  <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50">
                    <TouchableOpacity
                      onPress={() => handleLike(post.id)}
                      className="flex-row items-center space-x-1"
                    >
                      <Ionicons
                        name={
                          post.likedBy?.includes(user.id)
                            ? "heart"
                            : "heart-outline"
                        }
                        size={20}
                        color={
                          post.likedBy?.includes(user.id) ? "#16a34a" : "#666"
                        }
                      />
                      <Text className="text-gray-600">
                        {post.likesCount || 0}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenComment(post.id)}
                      className="flex-row items-center space-x-2"
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color="#666"
                      />
                      <Text className="text-gray-600">Comment</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Comment Sheet */}
        {selectedPost && (
          <Sheet
            modal
            open={!!selectedPost}
            onOpenChange={() => setSelectedPost(null)}
            snapPoints={[70]}
            dismissOnSnapToBottom
          >
            <Sheet.Frame style={styles.sheetContainer}>
              <Sheet.Handle />
              <View className="px-4 py-3 border-b border-gray-100">
                <Text className="text-lg font-semibold text-gray-800">
                  Community Discussion
                </Text>
              </View>

              <ScrollView className="p-4">
                {/* Comment Input */}
                <View className="mb-4">
                  <TextInput
                    placeholder="Share your gardening thoughts..."
                    value={commentText}
                    onChangeText={setCommentText}
                    className="bg-gray-50 p-3 rounded-xl text-gray-800"
                    multiline
                  />
                  <TouchableOpacity
                    onPress={() => handleComment(selectedPost)}
                    className="bg-green-600 mt-2 py-2.5 rounded-xl flex-row items-center justify-center"
                  >
                    <Text className="text-white font-medium">
                      Share Comment
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Comments List */}
                <View className="space-y-3">
                  {comments.map((comment) => (
                    <View
                      key={comment.id}
                      className="bg-gray-50 p-4 rounded-xl mb-2"
                    >
                      <View className="flex-row items-center mb-2">
                        <View className="bg-green-100 p-1.5 rounded-full">
                          <Ionicons name="person" size={16} color="#16a34a" />
                        </View>
                        <Text className="font-medium text-gray-800 ml-2">
                          {comment.userName}
                        </Text>
                      </View>
                      <Text className="text-gray-600 mb-2">
                        {comment.commentText}
                      </Text>
                      <View className="flex-row justify-end">
                        <TouchableOpacity
                          onPress={() =>
                            handleCommentLike(selectedPost, comment.id)
                          }
                          className="flex-row items-center space-x-1"
                        >
                          <Ionicons
                            name={
                              comment.likedBy?.includes(user.id)
                                ? "heart"
                                : "heart-outline"
                            }
                            size={16}
                            color={
                              comment.likedBy?.includes(user.id)
                                ? "#16a34a"
                                : "#666"
                            }
                          />
                          <Text className="text-gray-600">
                            {comment.likesCount || 0}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </Sheet.Frame>
          </Sheet>
        )}

        {/* Create Post Sheet */}
        <Sheet
          modal
          open={isSheetOpen}
          onOpenChange={setIsSheetOpen}
          snapPoints={[70]}
          dismissOnSnapToBottom
        >
          <Sheet.Frame style={styles.sheetContainer}>
            <Sheet.Handle />
            <View className="px-4 py-3 border-b border-gray-100">
              <Text className="text-lg font-semibold text-gray-800">
                Share Your Plant Story
              </Text>
            </View>

            <ScrollView className="p-4">
              <View className="space-y-4">
                <TextInput
                  placeholder="Give your story a title..."
                  value={title}
                  onChangeText={setTitle}
                  className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800"
                />

                <TextInput
                  placeholder="What's happening in your garden?"
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={4}
                  className="bg-gray-50 px-4 py-3 rounded-xl text-gray-800"
                />

                <TextInput
                  placeholder="What type of plant is this?"
                  value={plantType}
                  onChangeText={setPlantType}
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
                    />
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleCreatePost}
                  disabled={isLoading}
                  className="bg-green-600 py-3 rounded-xl flex-row items-center justify-center"
                >
                  <Text className="text-white font-medium">
                    {isLoading ? "Sharing..." : "Share with Community"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Sheet.Frame>
        </Sheet>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  sheetContainer: {
    backgroundColor: "#fff",
    padding: 10,
  },
});
