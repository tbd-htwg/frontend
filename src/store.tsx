import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./features/user/userSlice";
import tripsReducer from "./features/trips/tripsSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    trips: tripsReducer,
  },
});
