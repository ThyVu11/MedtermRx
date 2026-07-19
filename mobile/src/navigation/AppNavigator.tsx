import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "../theme";

import DashboardScreen from "../screens/DashboardScreen";
import DissectorScreen from "../screens/DissectorScreen";
import ScannerScreen from "../screens/ScannerScreen";
import RootLibraryScreen from "../screens/RootLibraryScreen";
import ConfusablesScreen from "../screens/ConfusablesScreen";
import ReviewScreen from "../screens/ReviewScreen";
import TermDetailScreen from "../screens/TermDetailScreen";
import { RootStackParamList } from "../types/types";
import FlashcardScreen from "../screens/FlashcardScreen";
import MemoryMapScreen from "../screens/MemoryMapScreen";
import KeywordMnemonicScreen from "../screens/KeywordMnemonicScreen";
import OrganDetailScreen from "../screens/OrganDetailScreen";
import QuizScreen from "../screens/QuizScreen";
import HomeScreen from "../screens/HomeScreen";
import QuizResultScreen from "../screens/QuizResultScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ["https://medterm.expo.app/"],
  config: {
    screens: {
      Home: "", // Maps to '/'
      Dashboard: "/dashboard", // Maps to '/dashboard'
      Scanner: "dashboard/scanner",
      Dissector: "dashboard/dissector",
      RootLibrary: "dashboard/root-library",
      Confusables: "dashboard/confusables",
      TermDetail: "dashboard/dissector/term-detail",
      MemoryMap: "dashboard/MemoryMap",
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "MedTermRx" }}
        />
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ title: "MedTermRx" }}
        />
        <Stack.Screen
          name="Dissector"
          component={DissectorScreen}
          options={{ title: "Word Dissector" }}
        />
        <Stack.Screen
          name="Scanner"
          component={ScannerScreen}
          options={{ title: "Scan & Dissect" }}
        />
        <Stack.Screen
          name="RootLibrary"
          component={RootLibraryScreen}
          options={{ title: "Root Library" }}
        />
        <Stack.Screen
          name="Confusables"
          component={ConfusablesScreen}
          options={{ title: "Confusables" }}
        />
        <Stack.Screen
          name="Review"
          component={ReviewScreen}
          options={{ title: "Review Session" }}
        />
        <Stack.Screen
          name="TermDetail"
          component={TermDetailScreen}
          options={{ title: "Dissection" }}
        />
        <Stack.Screen
          name="MemoryMap"
          component={MemoryMapScreen}
          options={{ title: "Memory Map" }}
        />
        <Stack.Screen
          name="OrganDetail"
          component={OrganDetailScreen}
          options={{ title: "Region" }}
        />
        <Stack.Screen
          name="Flashcard"
          component={FlashcardScreen}
          options={{ title: "Flashcards" }}
        />
        <Stack.Screen
          name="Quiz"
          component={QuizScreen}
          options={{ title: "Quiz" }}
        />
        <Stack.Screen
          name="QuizResult"
          component={QuizResultScreen}
          options={{ title: "Results", headerBackVisible: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
