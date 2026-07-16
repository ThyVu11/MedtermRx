import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getAllTerms } from "@/api/terms";
import type { Term } from "@/types/types";

interface TermsState {
  items: Term[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: TermsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchTerms = createAsyncThunk("terms/fetchTerms", async () => {
  return await getAllTerms();
});

const termsSlice = createSlice({
  name: "terms",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTerms.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTerms.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTerms.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load terms";
      });
  },
});

export default termsSlice.reducer;
