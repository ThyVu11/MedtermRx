import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getAllConfusables } from "../api/confusables";
import type { ConfusablePair } from "../types/types";

interface ConfusablesState {
  items: ConfusablePair[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ConfusablesState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchConfusables = createAsyncThunk(
  "confusables/fetchConfusables",
  async () => {
    return await getAllConfusables();
  },
);

const confusablesSlice = createSlice({
  name: "confusables",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchConfusables.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchConfusables.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchConfusables.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load confusables";
      });
  },
});

export default confusablesSlice.reducer;
