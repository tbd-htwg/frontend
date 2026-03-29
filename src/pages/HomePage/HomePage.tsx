import React from "react";
import TripListPage from "./TripListPage/TripListPage";

import "./HomePage.css";

const HomePage: React.FC = () => {
  return (
    <div id="home-page-container">
      <TripListPage />
    </div>
  );
};

export default HomePage;
