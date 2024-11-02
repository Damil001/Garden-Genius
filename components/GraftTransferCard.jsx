// components/GraftTransferCard.js

import React from "react";
import { View, Text, Image, ActivityIndicator } from "react-native";
import { Button } from "tamagui";
import { LinearGradient } from "expo-linear-gradient";

const GraftTransferCard = ({
  transfer,
  userNames,
  user,
  handleTransferRequest,
  createDirectMessageChannel,
  loadingRequest,
}) => {
  return (
    <LinearGradient colors={["#e0f7fa", "#b2ebf2"]} style={styles.card}>
      <Text style={styles.cardTitle}>{transfer.plantType}</Text>
      <Text style={styles.cardContent}>{transfer.content}</Text>
      <Image source={{ uri: transfer.plantImage }} style={styles.cardImage} />
      <Text style={styles.cardLocation}>{transfer.location}</Text>
      <Text style={styles.cardUser}>
        Created by: {userNames[transfer.userId] || "Unknown"}
      </Text>
      {user.id !== transfer.userId && (
        <>
          <Button
            onPress={() => handleTransferRequest(transfer.id)}
            style={styles.transferButton}
            disabled={loadingRequest}
          >
            {loadingRequest ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              "Request Transfer"
            )}
          </Button>
          <Button
            onPress={() => createDirectMessageChannel(transfer.userId)}
            style={styles.transferButton}
            disabled={loadingRequest}
          >
            Chat
          </Button>
        </>
      )}
    </LinearGradient>
  );
};

export default GraftTransferCard;
