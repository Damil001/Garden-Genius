import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync } from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";

const PestIdentification = () => {
  const [image, setImage] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usePestModel, setUsePestModel] = useState(false);

  const API_URLS = {
    plant: "http://192.168.100.32:8080/predict",
    pest: "http://192.168.100.32:8081/predict-pest",
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera roll permissions to make this work!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        await classifyImage(result.assets[0].uri);
      }
    } catch (error) {
      alert("Error picking image: " + error.message);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Sorry, we need camera permissions to make this work!");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
        await classifyImage(result.assets[0].uri);
      }
    } catch (error) {
      alert("Error taking photo: " + error.message);
    }
  };

  const classifyImage = async (uri) => {
    try {
      setLoading(true);

      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: 224, height: 224 } }],
        { format: "jpeg" }
      );

      const formData = new FormData();
      formData.append("image", {
        uri: manipResult.uri,
        type: "image/jpeg",
        name: "image.jpg",
      });

      const apiUrl = usePestModel ? API_URLS.pest : API_URLS.plant;

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();

      if (data.success) {
        setPredictions(data.predictions);
      } else {
        alert("Error classifying image: " + data.error);
      }
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-grow">
      <View className="flex-1 p-5 bg-gray-100">
        <Text className="text-2xl font-bold text-center mb-5 text-green-800">
          Pest Identification & Seed Identification
        </Text>

        <View className="flex-row justify-around mb-5">
          <TouchableOpacity
            className="bg-green-600 p-4 rounded-lg w-5/12 flex-row items-center justify-center"
            onPress={pickImage}
          >
            <Ionicons name="images" size={24} color="white" />
            <Text className="text-white text-center text-lg font-semibold ml-2">
              Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-green-600 p-4 rounded-lg w-5/12 flex-row items-center justify-center"
            onPress={takePhoto}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text className="text-white text-center text-lg font-semibold ml-2">
              Camera
            </Text>
          </TouchableOpacity>
        </View>

        <View className="items-center mb-5">
          <TouchableOpacity
            className={`p-3 rounded-lg ${
              usePestModel ? "bg-green-600" : "bg-gray-500"
            }`}
            onPress={() => setUsePestModel(!usePestModel)}
          >
            <Text className="text-white text-lg font-semibold">
              {usePestModel ? "Using Pest Model" : "Using Seed Model"}
            </Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View className="items-center mb-5">
            <Image
              source={{ uri: image }}
              className="w-72 h-72 rounded-lg border-2 border-green-600"
            />
          </View>
        )}

        {loading && (
          <ActivityIndicator size="large" color="#4CAF50" className="my-5" />
        )}

        {predictions.length > 0 && (
          <View className="bg-white p-4 rounded-lg shadow-lg">
            <Text className="text-xl font-bold mb-3 text-green-800">
              Results:
            </Text>
            {predictions.map((pred, index) => (
              <View key={index} className="mb-3 p-3 bg-green-100 rounded-md">
                <Text className="text-lg font-semibold text-green-900">
                  {pred.class}
                </Text>
                <Text className="text-md text-green-700 mt-1">
                  Confidence: {(pred.confidence * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default PestIdentification;
