// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   FlatList,
//   Pressable,
//   StyleSheet,
//   SafeAreaView,
//   ActivityIndicator,
// } from "react-native";
// import type { NativeStackScreenProps } from "@react-navigation/native-stack";
// // import { RootStackParamList, MedicalTerm } from "../types";
// import { getAllTerms } from "../api/terms";
// import { Term } from "@/types";

// type Props = NativeStackScreenProps<RootStackParamList, "TermList">;

// export default function TermListScreen({ route, navigation }: Props) {
//   const { category } = route.params;
//   const [terms, setTerms] = useState<Term[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     navigation.setOptions({ title: category });
//     getAllTerms(category)
//       .then(setTerms)
//       .finally(() => setLoading(false));
//   }, [category]);

//   if (loading) {
//     return (
//       <SafeAreaView style={styles.center}>
//         <ActivityIndicator size="large" color="#0F766E" />
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.safe}>
//       <Pressable
//         style={styles.studyButton}
//         onPress={() => navigation.navigate("Flashcards", { category })}
//       >
//         <Text style={styles.studyButtonText}>Study these as flashcards</Text>
//       </Pressable>
//       <FlatList
//         data={terms}
//         keyExtractor={(item) => item.id}
//         contentContainerStyle={styles.list}
//         renderItem={({ item }) => (
//           <View style={styles.row}>
//             <Text style={styles.term}>{item.term}</Text>
//             <Text style={styles.definition}>{item.definition}</Text>
//             {item.example ? <Text style={styles.example}>{item.example}</Text> : null}
//           </View>
//         )}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: { flex: 1, backgroundColor: "#F0FDFA" },
//   center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F0FDFA" },
//   list: { padding: 16, gap: 10 },
//   studyButton: {
//     margin: 16,
//     marginBottom: 0,
//     backgroundColor: "#0F766E",
//     padding: 14,
//     borderRadius: 12,
//     alignItems: "center",
//   },
//   studyButtonText: { color: "#fff", fontWeight: "700" },
//   row: { backgroundColor: "#ffffff", padding: 16, borderRadius: 12 },
//   term: { fontSize: 17, fontWeight: "700", color: "#111827" },
//   definition: { fontSize: 14, color: "#374151", marginTop: 4 },
//   example: { fontSize: 13, color: "#6B7280", fontStyle: "italic", marginTop: 4 },
// });
