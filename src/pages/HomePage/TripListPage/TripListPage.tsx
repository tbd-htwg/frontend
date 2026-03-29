import React, { use, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import "./TripListPage.css";
import TripListItem from "../TripListItem/TripListItem";
import { useNavigate } from "react-router";
import { setTrips } from "../../../features/trips/tripsSlice";

const TripListPage: React.FC = () => {
  const tripList = useSelector((state) => state.trips);
  const dispatch = useDispatch();

  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:8080/v1/trips")
      .then((response) => response.json())
      .then((data) => {
        dispatch(setTrips(data));
      });
  }, [dispatch]);

  return (
    <div id="trip-list-page-container">
      <h1>TripListPage</h1>

      {tripList.map((trip) => (
        <div key={trip.id} className="trip-item">
          <TripListItem trip={trip} />
        </div>
      ))}

      <button onClick={() => navigate("/newTrip")}>Add New Trip</button>
    </div>
  );
};

export default TripListPage;
