import React, { useState } from "react";

import "./LoginPage.css"; // optional für Styling

import { useSelector, useDispatch } from "react-redux";
import { userSlice, type User } from "../../features/user/userSlice";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // Local state für Inputfelder
  const [userName, setUserName] = useState("");
  const [userMail, setUserMail] = useState("");

  const navigate = useNavigate();

  const setUser = () => {
    const currentUser: User = {
      name: userName,
      email: userMail,
    };

    fetch("http://localhost:8080/v1/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(currentUser),
    })
      .then((response) => response.json())
      .then((response) => {
        const user: User = response;

        dispatch(userSlice.actions.setUser(user));
      });

    setUserMail("");
    setUserName("");
  };

  return (
    <div id="login-box">
      <input
        type="text"
        placeholder="Username"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
      />
      <input
        type="email"
        value={userMail}
        placeholder="Email"
        onChange={(e) => setUserMail(e.target.value)}
      />
      <button onClick={setUser}>Login</button>

      {user && (
        <div>
          <h2>User Info:</h2>
          <p>ID: {user.id}</p>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
        </div>
      )}

      <button onClick={() => navigate("/")}> Go Back </button>
    </div>
  );
};

export default LoginPage;
