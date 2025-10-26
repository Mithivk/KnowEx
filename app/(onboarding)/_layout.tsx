import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen name="communities" options={{ headerShown: false }} />
      <Stack.Screen name="technologies" options={{ headerShown: false }} />
    </Stack>
  );
}