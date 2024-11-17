import React, { useState, useEffect } from "react";
import { Calendar, Agenda } from "react-native-calendars";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import app from "../../firebaseConfig";
import { useUser } from "@clerk/clerk-expo";
import useToast from "../../hooks/useToast";

const PLANT_DATABASE = {
  rose: {
    name: "Rose",
    icon: "🌹",
    color: "rose",
    careSchedule: [
      { type: "Water", intervalDays: 2, icon: "💧", importance: "high" },
      { type: "Fertilize", intervalDays: 14, icon: "🌱", importance: "medium" },
      { type: "Prune", intervalDays: 30, icon: "✂️", importance: "low" },
    ],
    tips: "Keep soil moist, but not waterlogged. Prune dead flowers regularly.",
    difficulty: "Moderate",
    sunlight: "Full sun",
    growthTime: "2-3 months",
  },
  lavender: {
    name: "Lavender",
    icon: "💜",
    color: "purple",
    careSchedule: [
      { type: "Water", intervalDays: 7, icon: "💧", importance: "medium" },
      { type: "Trim", intervalDays: 90, icon: "✂️", importance: "low" },
      {
        type: "Check Soil",
        intervalDays: 14,
        icon: "🌱",
        importance: "medium",
      },
    ],
    tips: "Well-draining soil is essential. Don't overwater.",
    difficulty: "Easy",
    sunlight: "Full sun",
    growthTime: "1-2 months",
  },
  tomato: {
    name: "Tomato",
    icon: "🍅",
    color: "red",
    careSchedule: [
      { type: "Water", intervalDays: 2, icon: "💧", importance: "high" },
      { type: "Fertilize", intervalDays: 14, icon: "🌱", importance: "high" },
      { type: "Support", intervalDays: 7, icon: "🥅", importance: "medium" },
      { type: "Prune", intervalDays: 10, icon: "✂️", importance: "medium" },
    ],
    tips: "Support plants as they grow. Remove suckers regularly.",
    difficulty: "Moderate",
    sunlight: "Full sun",
    growthTime: "60-80 days",
  },
  mint: {
    name: "Mint",
    icon: "🌿",
    color: "green",
    careSchedule: [
      { type: "Water", intervalDays: 3, icon: "💧", importance: "medium" },
      { type: "Harvest", intervalDays: 14, icon: "✂️", importance: "low" },
      { type: "Contain", intervalDays: 30, icon: "🏺", importance: "high" },
    ],
    tips: "Plant in containers to prevent spreading. Regular harvesting promotes growth.",
    difficulty: "Easy",
    sunlight: "Partial shade",
    growthTime: "4-6 weeks",
  },
};

const AddPlant = () => {
  const { user } = useUser();
  const db = getFirestore(app);
  const [selectedDate, setSelectedDate] = useState("");
  const [name, setName] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlantType, setSelectedPlantType] = useState(null);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const plantsQuery = query(
        collection(db, "plants"),
        where("userId", "==", user.id)
      );

      const [plantsSnapshot, eventsSnapshot] = await Promise.all([
        getDocs(plantsQuery),
        getDocs(
          query(collection(db, "careEvents"), where("userId", "==", user.id))
        ),
      ]);

      const data = {};

      // Add plants
      plantsSnapshot.forEach((doc) => {
        const plant = doc.data();
        const date = plant.date;
        if (!data[date]) data[date] = [];
        data[date].push({
          ...plant,
          id: doc.id,
          isPlant: true,
        });
      });

      // Add care events
      eventsSnapshot.forEach((doc) => {
        const event = doc.data();
        const date = event.date;
        if (!data[date]) data[date] = [];
        data[date].push({
          ...event,
          id: doc.id,
          isEvent: true,
        });
      });

      setItems(data);
    } catch (error) {
      showError("Failed to load plants");
      console.error("Error fetching plants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !selectedPlantType) {
      showError("Please fill in all fields");
      return;
    }

    try {
      const plantData = {
        name: name.trim(),
        date: selectedDate,
        plantType: selectedPlantType,
        userName: `${user.firstName} ${user.lastName}`,
        userId: user.id,
        createdAt: new Date().toISOString(),
      };

      // Add plant
      const plantRef = await addDoc(collection(db, "plants"), plantData);

      // Generate care schedule
      const plant = PLANT_DATABASE[selectedPlantType];
      const carePromises = [];

      plant.careSchedule.forEach((care) => {
        let currentDate = new Date(selectedDate);
        for (let i = 0; i < 12; i++) {
          // Generate 12 occurrences
          currentDate = new Date(
            currentDate.setDate(currentDate.getDate() + care.intervalDays)
          );

          const eventData = {
            plantId: plantRef.id,
            plantName: name.trim(),
            type: care.type,
            date: currentDate.toISOString().split("T")[0],
            icon: care.icon,
            importance: care.importance,
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            completed: false,
          };

          carePromises.push(addDoc(collection(db, "careEvents"), eventData));
        }
      });

      await Promise.all(carePromises);
      await fetchPlants();

      showSuccess("Plant added successfully");
      setIsFormVisible(false);
      resetForm();
    } catch (error) {
      showError("Failed to save plant");
      console.error("Error saving plant:", error);
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedPlantType(null);
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await updateDoc(doc(db, "careEvents", taskId), {
        completed: true,
        completedAt: new Date().toISOString(),
      });
      await fetchPlants();
      showSuccess("Task completed!");
    } catch (error) {
      showError("Failed to complete task");
      console.error("Error completing task:", error);
    }
  };

  const PlantTypeCard = ({ type, data, selected }) => (
    <TouchableOpacity
      onPress={() => setSelectedPlantType(type)}
      className={`p-4 rounded-xl mb-3 ${
        selected
          ? "bg-green-50 border-2 border-green-500"
          : "bg-white border border-gray-200"
      }`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center space-x-2">
          <Text className="text-2xl">{data.icon}</Text>
          <Text className="text-lg font-semibold">{data.name}</Text>
        </View>
        <View
          className={`px-3 py-1 rounded-full ${
            data.difficulty === "Easy"
              ? "bg-green-100"
              : data.difficulty === "Moderate"
              ? "bg-yellow-100"
              : "bg-red-100"
          }`}
        >
          <Text
            className={`text-sm ${
              data.difficulty === "Easy"
                ? "text-green-700"
                : data.difficulty === "Moderate"
                ? "text-yellow-700"
                : "text-red-700"
            }`}
          >
            {data.difficulty}
          </Text>
        </View>
      </View>

      <Text className="text-gray-600 mb-2">{data.tips}</Text>

      <View className="flex-row flex-wrap gap-2">
        <View className="flex-row items-center">
          <Text className="text-sm mr-1">☀️</Text>
          <Text className="text-sm text-gray-600">{data.sunlight}</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-sm mr-1">⏳</Text>
          <Text className="text-sm text-gray-600">{data.growthTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderItem = (item) => {
    if (item.isPlant) {
      const plantInfo = PLANT_DATABASE[item.plantType];
      return (
        <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row items-center space-x-2">
            <Text className="text-2xl">{plantInfo?.icon}</Text>
            <View>
              <Text className="text-lg font-semibold">{item.name}</Text>
              <Text className="text-sm text-gray-500">Plant added</Text>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View
        className={`bg-white rounded-xl p-4 mb-3 shadow-sm border-l-4 ${
          item.importance === "high"
            ? "border-red-500"
            : item.importance === "medium"
            ? "border-yellow-500"
            : "border-green-500"
        }`}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center space-x-2">
            <Text className="text-xl">{item.icon}</Text>
            <View>
              <Text className="font-medium">{item.type}</Text>
              <Text className="text-sm text-gray-500">{item.plantName}</Text>
            </View>
          </View>
          {!item.completed && (
            <TouchableOpacity
              onPress={() => handleCompleteTask(item.id)}
              className="bg-green-500 px-3 py-1.5 rounded-full"
            >
              <Text className="text-white text-sm font-medium">Complete</Text>
            </TouchableOpacity>
          )}
        </View>
        {item.completed && (
          <View className="mt-2 bg-green-50 rounded-lg p-2">
            <Text className="text-green-700 text-sm">✓ Completed</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <Agenda
          items={items}
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
            setIsFormVisible(true);
          }}
          renderItem={renderItem}
          renderEmptyDate={() => (
            <View className="flex-1 py-4">
              <Text className="text-gray-400 text-center">
                No tasks for this day
              </Text>
            </View>
          )}
          theme={{
            agendaDayTextColor: "#374151",
            agendaDayNumColor: "#374151",
            agendaTodayColor: "#10B981",
            agendaKnobColor: "#10B981",
            dotColor: "#10B981",
            selectedDayBackgroundColor: "#10B981",
            selectedDayTextColor: "#ffffff",
          }}
        />
      )}

      <Modal visible={isFormVisible} animationType="slide" transparent={true}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-semibold text-center mb-6">
              Add New Plant
            </Text>

            <TextInput
              className="w-full px-4 py-3 rounded-lg bg-gray-50 mb-4"
              placeholder="Plant Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9CA3AF"
            />

            <ScrollView className="max-h-96">
              {Object.entries(PLANT_DATABASE).map(([type, data]) => (
                <PlantTypeCard
                  key={type}
                  type={type}
                  data={data}
                  selected={selectedPlantType === type}
                />
              ))}
            </ScrollView>

            <View className="space-y-3 mt-4">
              <TouchableOpacity
                onPress={handleSave}
                className="w-full bg-green-500 py-4 rounded-xl"
              >
                <Text className="text-white text-center font-semibold text-lg">
                  Add Plant
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setIsFormVisible(false);
                  resetForm();
                }}
                className="w-full bg-gray-100 py-4 rounded-xl"
              >
                <Text className="text-gray-600 text-center font-medium text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddPlant;
