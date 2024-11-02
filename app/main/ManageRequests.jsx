import { View, Text, ActivityIndicator, Button } from "react-native";
import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import app from "../../firebaseConfig";
import { useUser } from "@clerk/clerk-react"; // Import Clerk hook
import { StreamChat } from "stream-chat";
// Initialize Firestore
import useToast from "../../hooks/useToast";
const db = getFirestore(app);

const ManageRequests = () => {
  const { showError, showSuccess, showInfo } = useToast();
  const streamApiKey = "p9mpz956q36h";
  const [client, setClient] = useState(null);
  const { user } = useUser(); // Get the current user using Clerk
  const [requests, setRequests] = useState([]);
  const [names, setNames] = useState({}); // To store names for each userId
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch graft requests from Firestore
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "graftRequests"));
        const requestsData = querySnapshot.docs.map((doc) => doc.data());

        // Filter requests to include only those where initiatorId or userId matches current user's ID
        const filteredRequests = requestsData.filter(
          (request) => request.ownerId === user.id
        );
        console.log(filteredRequests);
        setRequests(filteredRequests); // Set filtered requests
      } catch (error) {
        console.error("Error fetching graft requests: ", error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    };

    if (user) {
      // Only fetch requests if the user is loaded
      fetchRequests();
    }
  }, [user]);

  // Fetch user name by Clerk user ID and update state
  const getNameByUserId = async (userId) => {
    const apiUrl = `https://api.clerk.dev/v1/users/${userId}`;
    const apiKey = "sk_test_eTkzEx0tcIksKsSTsgRMP4VTyKLIE1jZKHzrKMhnzR";
    try {
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      const data = await response.json();
      return data.first_name;
    } catch (error) {
      console.error("Error fetching user name: ", error);
      return null;
    }
  };

  // Fetch names for all userIds in the filtered requests
  useEffect(() => {
    const fetchAllNames = async () => {
      const newNames = { ...names }; // Create a copy of the names state

      for (const request of requests) {
        // Only fetch the name if it hasn't been fetched before
        if (!newNames[request.requesterId]) {
          const name = await getNameByUserId(request.requesterId);
          newNames[request.requesterId] = name || "Unknown"; // Set to "Unknown" if no name is found
        }
      }

      setNames(newNames); // Update the names state
    };

    if (requests.length > 0) {
      fetchAllNames();
    }
  }, [requests]);

  useEffect(() => {
    const chatClient = StreamChat.getInstance(streamApiKey);
    setClient(chatClient);
  }, []);

  const handleAccept = async (requestId, requesterId) => {
    try {
      if (!client) {
        console.error("Stream client is not initialized.");
        return;
      }
      console.log(user.id, requesterId);
      // Connect the current user to the Stream Chat client
      await client.connectUser(
        {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`, // Use Clerk user info
        },
        client.devToken(user.id)
      );
      const requesterName = await getNameByUserId(requesterId);
      // Create a unique channel ID using the user IDs
      const channelId = `graft-${user.firstName}-${requesterName}`;
      console.log(user.id, requesterId);
      // Create a channel with the current user and the requester
      const channel = client.channel("messaging", channelId, {
        members: [user.id, requesterId],
      });

      await channel.create();
      showSuccess(
        "Channel created between you and the requester 🎉",
        "Please headover to chat to continue 💬"
      );
      console.log(`Channel created between ${user.id} and ${requesterId}`);
    } catch (error) {
      showError("Error creating channel: ❌", "Please try again later 🔄");
      console.error("Error creating channel: ", error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      // Reference to the specific document in the "graftRequests" collection
      const requestDocRef = doc(db, "graftRequests", requestId);
      await deleteDoc(requestDocRef); // Delete the document from Firestore
      console.log(`Rejected request with ID: ${requestId}`);

      // Update the local state to remove the rejected request
      setRequests((prevRequests) =>
        prevRequests.filter((request) => request.id !== requestId)
      );
    } catch (error) {
      console.error("Error rejecting request: ", error);
    }
  };

  return (
    <View>
      <Text>Manage Requests</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" /> // Show loading indicator
      ) : requests.length === 0 ? (
        <Text>No requests found.</Text> // Show empty state message
      ) : (
        requests.map((request, index) => (
          <View
            key={index}
            style={{
              margin: 10,
              padding: 10,
              borderWidth: 1,
              borderColor: "#ccc",
            }}
          >
            <Text>
              {`Request from: ${names[request.requesterId] || "Loading..."}`}
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 10,
              }}
            >
              <Button
                title="Accept"
                onPress={() => handleAccept(request.id, request.requesterId)}
              />
              <Button title="Reject" onPress={() => handleReject(request.id)} />
            </View>
          </View>
        ))
      )}
    </View>
  );
};

export default ManageRequests;
