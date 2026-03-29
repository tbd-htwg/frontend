import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Trip {
  userId: number;
  title: string;
  destination: string;
  startDate: string;
  shortDescription: string;
  longDescription: string;
}

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
