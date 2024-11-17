import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useFonts } from "expo-font";
export default function AuthRoutesLayout() {
  const [fontsLoaded] = useFonts({
    "satoshi-regular": require("../../assets/fonts/Satoshi-Regular.otf"),
    "satoshi-bold": require("../../assets/fonts/Satoshi-Bold.otf"),
    "satoshi-italic": require("../../assets/fonts/Satoshi-Italic.otf"),
    "satoshi-medium": require("../../assets/fonts/Satoshi-Medium.otf"),
    "satoshi-light": require("../../assets/fonts/Satoshi-Light.otf"),
    "satoshi-medium-italic": require("../../assets/fonts/Satoshi-MediumItalic.otf"),
    "satoshi-bold-italic": require("../../assets/fonts/Satoshi-BoldItalic.otf"),
  });
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <Redirect href={"/"} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
