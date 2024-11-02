import React, { useState, useEffect } from "react";
import { Calendar, Agenda } from "react-native-calendars";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import app from "../../firebaseConfig";
import { useUser } from "@clerk/clerk-expo";
import useToast from "../../hooks/useToast";

const AddPlant = () => {
  const { user } = useUser();
  const db = getFirestore(app);
  const [selectedDate, setSelectedDate] = useState("");
  const [name, setName] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [items, setItems] = useState({}); // State for Agenda items
  const [loading, setLoading] = useState(true); // Loading state
  const { showError, showSuccess } = useToast();

  // Fetch data from Firestore on mount
  useEffect(() => {
    const fetchPlants = async () => {
      try {
        // Query to get only the plants associated with the current user
        const plantsQuery = query(
          collection(db, "plants"),
          where("userId", "==", user.id)
        );

        const querySnapshot = await getDocs(plantsQuery);
        const data = {};

        querySnapshot.forEach((doc) => {
          const plant = doc.data();
          const date = plant.date;

          if (!data[date]) {
            data[date] = [];
          }
          data[date].push({
            name: plant.name,
            userName: plant.userName,
            userId: plant.userId,
            id: doc.id,
          });
        });

        setItems(data);
      } catch (error) {
        showError("Failed to load plants");
        console.error("Error fetching plants: ", error);
      } finally {
        setLoading(false); // Stop loading once data is fetched
      }
    };

    fetchPlants();
  }, [db, user.id]);

  const handleDateClick = (date) => {
    setSelectedDate(date.dateString);
    setIsFormVisible(true);
  };

  const handleSave = async (date) => {
    try {
      const docRef = await addDoc(collection(db, "plants"), {
        name,
        date,
        userName: `${user.firstName} ${user.lastName}`,
        userId: user.id,
      });

      // Update local `items` state with the new entry
      setItems((prevItems) => ({
        ...prevItems,
        [date]: [
          ...(prevItems[date] || []),
          {
            name,
            userName: `${user.firstName} ${user.lastName}`,
            userId: user.id,
            id: docRef.id,
          },
        ],
      }));

      setIsFormVisible(false);
      setName("");
      showSuccess("Plant added successfully");
    } catch (error) {
      showError("Failed to save plant");
      console.error("Error saving plant: ", error);
    }
  };

  const renderItem = (item) => (
    <View style={styles.item}>
      <Text>{item.name}</Text>
      <Text>Added by: {item.userName}</Text>
    </View>
  );

  const renderEmptyData = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No events this month</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Agenda
          items={items}
          onDayPress={handleDateClick}
          renderItem={renderItem}
          renderEmptyData={renderEmptyData} // Display message when no items
        />
      )}

      {isFormVisible && (
        <View style={styles.form}>
          <Text style={styles.label}>Add Event for: {selectedDate}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Name"
            value={name}
            onChangeText={setName}
          />
          <Button title="Save" onPress={() => handleSave(selectedDate)} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  form: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  item: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "gray",
  },
});

export default AddPlant;
