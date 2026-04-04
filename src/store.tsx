import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./features/user/userSlice";
import tripsReducer from "./features/trips/tripsSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    trips: tripsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
