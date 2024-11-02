import * as SecureStore from "expo-secure-store";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { Slot } from "expo-router";
import Toast from "react-native-toast-message";
import tamaguiConfig from "../tamagui.config";
import { TamaguiProvider } from "tamagui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
const tokenCache = {
  async getToken(key) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log("No values stored under key: " + key);
      }
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key, value) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env"
  );
}

function RootLayoutNav() {
  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <TamaguiProvider config={tamaguiConfig}>
          <GestureHandlerRootView>
            <Slot />
          </GestureHandlerRootView>
          <Toast ref={(ref) => Toast.setRef(ref)} />
        </TamaguiProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
export default RootLayoutNav;