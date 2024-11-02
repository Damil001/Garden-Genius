import React, { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import {
  Chat,
  ChannelList,
  Channel,
  MessageList,
  MessageInput,
} from "stream-chat-expo";
import { useAuth } from "@clerk/clerk-expo";
import { useUser } from "@clerk/clerk-expo";
import { View, ActivityIndicator, Button } from "react-native";
import { OverlayProvider } from "stream-chat-expo";
import { useRouter } from "expo-router";
const apiKey = "p9mpz956q36h"; // Replace with your Stream API key

const ChatScreen = () => {
  const router = useRouter();
  const [client, setClient] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null); // To track the selected channel
  const { user } = useUser(); // Use user from Clerk

  // Initialize Stream Chat Client
  useEffect(() => {
    const initChat = async () => {
      try {
        if (user.id) {
          const chatClient = StreamChat.getInstance(apiKey);

          // Connect user to Stream with Clerk userId
          await chatClient.connectUser(
            {
              id: user.id,
              name: `${user.firstName} ${user.lastName}`, // Optionally replace with the user's name
            },
            chatClient.devToken(user.id)
          );

          setClient(chatClient);
          console.log("Chat client initialized");
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initChat();

    // Cleanup on unmount
    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [user.id]);

  // Ensure user is added as a member of the channel when querying channels
  const filters = {
    members: { $in: [user.id] }, // Filter for channels where the current user is a member
  };

  // When the user selects a channel from the list
  const handleSelectChannel = (channel) => {
    setSelectedChannel(channel); // Set the selected channel in state
  };

  // Handle back to channel list
  const handleBackToList = () => {
    setSelectedChannel(null); // Clear the selected channel to go back to the list
  };

  if (!client) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <OverlayProvider>
        <Chat client={client}>
          {selectedChannel ? (
            // Render the individual channel's message list and input when a channel is selected
            <View style={{ flex: 1 }}>
              <Button title="Back to Channels" onPress={handleBackToList} />
              <Channel channel={selectedChannel} style={{ paddingBottom: 200 }}>
                <MessageList />
                <MessageInput />
              </Channel>
            </View>
          ) : (
            // Render the channel list if no channel is selected
            <ChannelList filters={filters} onSelect={handleSelectChannel} />
          )}
        </Chat>
      </OverlayProvider>
    </View>
  );
};

export default ChatScreen;
