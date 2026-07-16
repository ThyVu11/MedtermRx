import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getAllRoots } from "@/api/roots";
import type { RootEntry } from "@/types/types";

interface RootsState {
  items: RootEntry[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: RootsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchRoots = createAsyncThunk("roots/fetchRoots", async () => {
  return await getAllRoots();
});

const rootsSlice = createSlice({
  name: "roots",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoots.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchRoots.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchRoots.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load roots";
      });
  },
});

export default rootsSlice.reducer;
