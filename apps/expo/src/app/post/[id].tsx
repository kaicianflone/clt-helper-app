import { SafeAreaView, Text, View } from "react-native";
import { Stack } from "expo-router";

export default function Post() {
  return (
    <SafeAreaView className="bg-background">
      <Stack.Screen options={{ title: "Post" }} />
      <View className="h-full w-full p-4">
        <Text className="text-foreground py-4">Post detail (coming soon)</Text>
      </View>
    </SafeAreaView>
  );
}
