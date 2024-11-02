import { Tabs } from "expo-router";

export default function MainLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ headerShown: false }} />
      <Tabs.Screen name="addPost" options={{ headerShown: false }} />
    </Tabs>
  );
}
