import { configureStore } from "@reduxjs/toolkit";
import termsReducer from "@/features/termsSlice";
import rootsReducer from "@/features/rootsSlice";
import confusablesReducer from "@/features/confusablesSlice";

export const store = configureStore({
  reducer: {
    terms: termsReducer,
    roots: rootsReducer,
    confusables: confusablesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
