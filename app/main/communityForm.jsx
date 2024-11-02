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
    <ScrollView>
      <View>
        <XStack justifyContent="space-evenly" alignItems="center">
          <TextInput
            placeholder="Search posts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { width: "80%" }]}
          />
          <TouchableOpacity onPress={handleOpenSheet} style={styles.addButton}>
            <Ionicons name="add-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </XStack>

        <View>
          {isFetchingPosts ? ( // Show loader if fetching posts
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <YStack>
              {filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  themeInverse
                  bordered
                  backgroundColor="#fff"
                  padding="$4"
                  margin="$2"
                  borderRadius="$3"
                >
                  <Card.Header>
                    <H3 extraBold color="$color11">
                      {post.title}
                    </H3>
                  </Card.Header>
                  <Image
                    source={{ uri: post.plantImage }}
                    style={styles.cardImage}
                  />
                  <Card.Footer
                    justifyContent="space-between"
                    padding="$2"
                    backgroundColor="#f0f0f0"
                  >
                    <Text
                      color="$color1"
                      fontSize="$2"
                      style={styles.cardContent}
                    >
                      {post.content}
                    </Text>
                    <Text
                      color="$color2"
                      fontSize="$1"
                      style={styles.cardContent}
                    >
                      {post.plantType}
                    </Text>
                  </Card.Footer>
                  <XStack justifyContent="flex-end" marginTop="$5" gap="$4">
                    <Button onPress={() => handleLike(post.id)}>
                      <MaterialIcons
                        name="thumb-up"
                        size={24}
                        color={
                          post.likedBy?.includes(user.id) ? "#4CAF50" : "#888"
                        }
                      />
                      <Text>{post.likesCount || 0}</Text>
                    </Button>
                    <Button onPress={() => handleOpenComment(post.id)}>
                      <MaterialIcons name="comment" size={24} color="#4CAF50" />
                    </Button>
                    <Button>
                      <MaterialIcons
                        name="thumb-down"
                        size={24}
                        color="#4CAF50"
                      />
                    </Button>
                  </XStack>
                </Card>
              ))}
            </YStack>
          )}
        </View>

        {selectedPost && (
          <Sheet
            modal={true}
            open={!!selectedPost}
            onOpenChange={() => setSelectedPost(null)}
            style={{ backgroundColor: "white" }}
            snapPoints={[70]}
            dismissOnSnapToBottom
          >
            <Sheet.Overlay opacity={0} />
            <Sheet.Frame backgroundColor="white" padding={20}>
              <Sheet.Handle />
              <Sheet.ScrollView>
                <XStack justifyContent="space-between">
                  <Text>Add a Comment</Text>
                  <Button onPress={() => setSelectedPost(null)}>
                    <Ionicons name="close" size={24} color="#4CAF50" />
                  </Button>
                </XStack>
                <YStack gap="$4" marginTop={20}>
                  <TextInput
                    placeholder="Write a comment..."
                    value={commentText}
                    onChangeText={setCommentText}
                    style={styles.input}
                  />
                  <Button onPress={() => handleComment(selectedPost)}>
                    <MaterialIcons name="send" size={24} color="#4CAF50" />
                    Submit Comment
                  </Button>

                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.comment}>
                      <Text style={styles.commentUser}>
                        {comment.userName}:
                      </Text>
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text>{comment.commentText}</Text>
                        <Button
                          themeInverse
                          onPress={() =>
                            handleCommentLike(selectedPost, comment.id)
                          }
                        >
                          <MaterialIcons
                            name="thumb-up"
                            size={24}
                            color={
                              comment.likedBy?.includes(user.id)
                                ? "#4CAF50"
                                : "#888"
                            }
                          />
                          <Text>{comment.likesCount || 0}</Text>
                        </Button>
                      </XStack>
                    </View>
                  ))}
                </YStack>
              </Sheet.ScrollView>
            </Sheet.Frame>
          </Sheet>
        )}

        <Sheet
          modal={true}
          open={isSheetOpen}
          onOpenChange={(open) => setIsSheetOpen(open)}
          style={{ backgroundColor: "white" }}
          snapPoints={[70]}
          dismissOnSnapToBottom
        >
          <Sheet.Overlay opacity={0} />
          <Sheet.Frame backgroundColor="white" padding={20}>
            <Sheet.Handle />
            <Sheet.ScrollView>
              <XStack justifyContent="space-between">
                <Text>Add a Post</Text>
                <Button onPress={handleCloseSheet}>
                  <Ionicons name="close" size={24} color="#4CAF50" />
                </Button>
              </XStack>
              <YStack gap="$4" marginTop={20}>
                <TextInput
                  placeholder="Post Title"
                  value={title}
                  onChangeText={setTitle}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Post Content"
                  value={content}
                  onChangeText={setContent}
                  style={styles.input}
                />
                <TextInput
                  placeholder="Plant Type"
                  value={plantType}
                  onChangeText={setPlantType}
                  style={styles.input}
                />
                <Button
                  iconAfter={
                    <Ionicons name="image" size={24} color="#4CAF50" />
                  }
                  onPress={handleImagePicker}
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
                  size="$4"
                  iconAfter={
                    <MaterialIcons name="post-add" size={24} color="#4CAF50" />
                  }
                  onPress={handleCreatePost}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Post..." : "Create Post"}
                </Button>
              </YStack>
            </Sheet.ScrollView>
          </Sheet.Frame>
        </Sheet>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
  },
  image: {
    width: "100%",
    height: 200,
  },
  cardImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  cardContent: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
  },
  comment: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  commentUser: {
    fontWeight: "bold",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 5,
    padding: 10,
    margin: 10,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
});
