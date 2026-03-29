import { createSlice } from "@reduxjs/toolkit";

export interface User {
  id?: number;
  name: string;
  email: string;
}

export const userSlice = createSlice({
  name: "user",
  initialState: {
    name: "Joe Doe",
    email: "Moma@example.com",
  } as User,
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
