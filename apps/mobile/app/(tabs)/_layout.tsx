import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#B8634A" }}>
      <Tabs.Screen name="index" options={{ title: "Pedidos" }} />
      <Tabs.Screen name="dre" options={{ title: "DRE" }} />
    </Tabs>
  );
}
