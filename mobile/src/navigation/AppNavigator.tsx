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

export type RootStackParamList = {
  Dashboard: undefined;
  Dissector: { initialQuery?: string } | undefined;
  Scanner: undefined;
  RootLibrary: undefined;
  Confusables: undefined;
  Review: undefined;
  TermDetail: { termId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.paper },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: "MedTermRx" }} />
        <Stack.Screen
          name="Dissector"
          component={DissectorScreen}
          options={{ title: "Word Dissector" }}
        />
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: "Scan & Dissect" }} />
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
        <Stack.Screen name="Review" component={ReviewScreen} options={{ title: "Review Session" }} />
        <Stack.Screen
          name="TermDetail"
          component={TermDetailScreen}
          options={{ title: "Dissection" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
