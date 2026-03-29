import { createSlice } from "@reduxjs/toolkit";
import type { User } from "../../models/User";

export const userSlice = createSlice({
  name: "user",
  initialState: {} as User,
  reducers: {
    setUser: (state, action) => {
      return action.payload;
    },
    clearUser: (state) => {
      state.id = 0;
      state.name = "";
      state.email = "";
    },
  },
});

// Action creators are generated for each case reducer function
export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;
