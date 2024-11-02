// components/PostForm.js

import React from "react";
import { TextInput } from "react-native";
import { Button } from "tamagui";
import { Ionicons } from "@expo/vector-icons";

const PostForm = ({
  postContent,
  setPostContent,
  plantType,
  setPlantType,
  location,
  setLocation,
  handleSubmit,
}) => {
  return (
    <>
      <TextInput
        value={postContent}
        onChangeText={setPostContent}
        placeholder="Enter your post content"
        style={styles.input}
      />
      <TextInput
        value={plantType}
        onChangeText={setPlantType}
        placeholder="Enter plant type"
        style={styles.input}
      />
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="Enter location"
        style={styles.input}
      />
      <Button
        iconAfter={<Ionicons name="leaf" size={24} color="#4CAF50" />}
        size="$4"
        onPress={handleSubmit}
        theme="green"
        marginTop={20}
      >
        Create a Graft Listing
      </Button>
    </>
  );
};

export default PostForm;
