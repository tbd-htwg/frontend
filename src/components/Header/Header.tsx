import { useSelector } from "react-redux";
import "./Header.css"; // optional für Styling

import { useNavigate } from "react-router-dom";
import type { RootState } from "../../store";

function Header() {
  const navigate = useNavigate();

  const currentUser = useSelector((state: RootState) => state.user);

  return (
    <header id="app-header">
      <h1>Travel Planner</h1>
      <p>CI/CD works!</p>

      <div id="button-container">
        <button onClick={() => navigate("/contact")}> Contact </button>
        <button onClick={() => navigate("/newTrip")}> Add Trip </button>
        <button onClick={() => navigate("/")}> Home </button>
      </div>

      <div id="login-container">
        <p>Eingeloggt als: {currentUser?.name || "Nicht eingeloggt"}</p>
        <button onClick={() => navigate("/login")}> Login </button>
      </div>
    </header>
  );
}

export default Header;
