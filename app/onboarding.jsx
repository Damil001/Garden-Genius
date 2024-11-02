import Onboarding from "react-native-onboarding-swiper";
import { Image, Dimensions } from "react-native";
import { StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

export default function OnboardingScreen() {
  return (
    <Onboarding
      titleStyles={styles.title}
      subtitleStyles={styles.subtitle}
      pages={[
        {
          backgroundColor: "rgb(255, 255, 255)",
          image: (
            <Image
              source={require("../assets/images/slide1.jpg")}
              style={styles.image}
            />
          ),
          title: "Grow your Garden, Grow yourself",
          subtitle: "Welcome to the Ultimate Solution for Gardening at Home!",
        },
        {
          backgroundColor: "rgb(255, 255, 255)",
          image: (
            <Image
              source={require("../assets/images/slide2.jpg")}
              style={styles.image}
            />
          ),
          title: "Turn your balcony into a garden",
          subtitle: "Transform your small space into a thriving garden",
        },
        {
          backgroundColor: "rgb(255, 255, 255)",
          image: (
            <Image
              source={require("../assets/images/slide3.jpg")}
              style={styles.image}
            />
          ),
          title: "Grow your own food",
          subtitle: "Harvest fresh ingredients for your meals",
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: "satoshi-medium",
    fontSize: 24,
    color: "#333",
    textAlign: "center",
    width: "90%", // Adjust width to prevent overflow
    alignSelf: "center",
  },
  subtitle: {
    fontFamily: "satoshi-regular",
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    width: "85%",
    alignSelf: "center",
    marginTop: 10,
  },
  image: {
    width: width * 0.8, // 80% of screen width
    height: width * 0.8, // maintain aspect ratio
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#000",
  },
});
