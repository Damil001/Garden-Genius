import React from "react";
import { Button, Image, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

const ImagePickerComponent = ({ plantImage, setPlantImage }) => {
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
        setPlantImage(result);
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred while picking the image.");
    }
  };

  return (
    <>
      <Button
        iconAfter={<Ionicons name="image" size={24} color="#4CAF50" />}
        size="$4"
        onPress={handleImagePicker}
        variant="outline"
      >
        Pick Plant Image
      </Button>
      {plantImage && (
        <Image
          source={{ uri: plantImage.assets[0].uri }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 10,
            marginVertical: 10,
          }}
        />
      )}
    </>
  );
};

export default ImagePickerComponent;
