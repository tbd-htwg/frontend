import "./Header.css"; // optional für Styling

import { useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate(); // Hook für Navigation

  return (
    <header id="app-header">
      <h1>Travel Planner</h1>

      <div id="button-container">
        <button onClick={() => navigate("/login")}> Login </button>
        <button onClick={() => navigate("/contact")}> Contact </button>
        <button onClick={() => navigate("/newTrip")}> Add Trip </button>
        <button onClick={() => navigate("/")}> Home </button>
      </div>
    </header>
  );
}

export default Header;
