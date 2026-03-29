import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Trip } from "../../models/Trip";

// Initial State: BspData Array von Trips
export const initialState: Trip[] = [];

export const tripsSlice = createSlice({
  name: "trips", // Name des Slices
  initialState,
  reducers: {
    setTrips: (state, action: PayloadAction<Trip[]>) => {
      return action.payload;
    },
    addTrip: (state, action: PayloadAction<Trip>) => {
      state.push(action.payload);
    },
    clearTrips: () => {
      return [];
    },
  },
});

export const { setTrips, addTrip, clearTrips } = tripsSlice.actions;

export default tripsSlice.reducer;
